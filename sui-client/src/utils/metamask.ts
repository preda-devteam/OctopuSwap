import { utils, Contract, providers } from 'ethers'
import { bignumberMult } from './string'
// const USDTJSON = require('../contracts/USDT.json')
interface MetaMaskProps {
  addressChangeCB: (addr: string) => void
}
interface ConnectInfo {
  chainId: string
}

export interface EncodeData {
  userId: string
  symbol: string
  points: number
  rateTime: number
}

export interface SnedParams {
  amount: string
  targetAddress: string
  customData?: string
}

export interface Walelt {
  selectedAddress: string
  request: (request: { method: string; params?: Array<any> }) => Promise<any>
  on: (event: string, cb: (...arg: any[]) => void) => void
}

export const getChainId = async () => {
  const chainId = await window.ethereum.request({ method: 'eth_chainId' })
  return chainId
}

const chainId = '0xAA36A7' // '0x1'
export default class MetaMask {
  static instance = null
  static callbacks: Array<(addr: string) => void> = []

  public wallet: Walelt | null = null
  public selectAddress = ''
  public selectChain = ''
  public provider: providers.Web3Provider | null = null
  public addressChangeCB: (addr: string) => void

  constructor({ addressChangeCB }: MetaMaskProps) {
    this.addressChangeCB = addressChangeCB
    MetaMask.callbacks.push(this.addressChangeCB)
    window.addEventListener('eip6963:announceProvider', this.getWallet)
    window.dispatchEvent(new Event('eip6963:requestProvider'))

    if (MetaMask.instance) {
      return MetaMask.instance
    }
  }

  getWallet = async (event: any) => {
    if (this.wallet) return this.wallet
    if (event?.detail) {
      if (event.detail?.info?.rdns === 'io.metamask') {
        this.wallet = event.detail.provider
        MetaMask.triggerAddrChange(this.wallet?.selectedAddress)
        this.wallet!.on('accountsChanged', (accounts: string[]) => {
          if (!accounts.length) {
            this.selectAddress = ''
            localStorage.removeItem('ETH')
            MetaMask.triggerAddrChange('')
          } else {
            this.selectAddress = accounts[0]
            MetaMask.triggerAddrChange(this.selectAddress)
          }
        })
        this.wallet!.on('connect', async (connectInfo: ConnectInfo) => {
          this.selectChain = connectInfo.chainId
        })
        this.wallet!.on('disconnect', () => {
          this.selectAddress = ''
          localStorage.removeItem('ETH')
          MetaMask.triggerAddrChange('')
        })
      }
    }
  }

  async connectAddress() {
    if (!this.wallet) {
      window.open('https://chromewebstore.google.com/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn')
      throw new Error('Can’t find MetaMask extension')
    }
    await this.switchToMain(true)
    const [address] = await this.wallet.request({ method: 'eth_requestAccounts' })
    this.selectAddress = address
    this.addressChangeCB && this.addressChangeCB(this.selectAddress)
    return address
  }

  async sendETH(sendArg: SnedParams) {
    if (!this.selectAddress) {
      throw new Error('selectAddress can not undefined')
    }
    if (!this.provider) {
      throw new Error('provider not init')
    }
    const signer = this.provider.getSigner()
    const tx = {
      to: sendArg.targetAddress,
      value: utils.parseEther(sendArg.amount),
      data: sendArg.customData || undefined,
    }
    const { hash } = await signer.sendTransaction(tx)
    const txnLink = MetaMask.createExplorerLink(hash, this.provider.network.chainId)

    return { txnLink, hash }
  }

  // async sendUSDT(amount: string, customData?: string) {
  //   if (!this.selectAddress) {
  //     throw new Error('selectAddress can not undefined')
  //   }
  //   const signer = this.provider.getSigner()
  //   const [contractAddress, decimal] = await this.getUSDTContract()
  //   const USDTContract = new Contract(contractAddress, USDTJSON.abi, signer)
  //   const usdtAmount = utils.parseUnits(amount, decimal)

  //   const transferData = USDTContract.interface.encodeFunctionData('transfer', [targetAddress, usdtAmount])
  //   const tx = {
  //     to: contractAddress,
  //     data: transferData + (customData || '').replace('0x', ''),
  //   }

  //   const { hash } = await signer.sendTransaction(tx)
  //   const txnLink = MetaMask.createExplorerLink(hash, this.provider.network.chainId)

  //   return txnLink
  // }

  static triggerAddrChange(v = '') {
    MetaMask.callbacks.forEach(cb => cb?.(v))
  }

  static createExplorerLink(hash: string, chainId: string | number) {
    let prefix
    switch (Number(chainId)) {
      case 5:
        prefix = 'goerli.'
        break
      case 11155111:
        prefix = 'sepolia.'
        break
      default:
        prefix = ''
    }
    return `https://${prefix}etherscan.io/tx/${hash}`
  }

  static getEncodeData({ userId, symbol, points, rateTime }: EncodeData) {
    return utils.hexlify(utils.toUtf8Bytes(`custom:${userId}@${symbol}@${points}@${rateTime}`))
  }

  static getDecodeData(pStr: string) {
    let tempstr = ''
    try {
      if (pStr.startsWith('0x')) {
        pStr = pStr.slice(2)
      }
      tempstr = decodeURIComponent(pStr.replace(/\s+/g, '').replace(/[0-9a-f]{2}/g, '%$&'))
    } catch (err) {
      tempstr = hex2asc(pStr)
    }
    return tempstr
  }

  async getBalance(address: string, token?: string) {
    // if (token && token === 'USDT') {
    //   const signer = this.provider.getSigner()
    //   const [contractAddress, decimal] = await this.getUSDTContract()
    //   const USDTContract = new Contract(contractAddress, USDTJSON.abi, signer)
    //   const balance = await USDTContract.balanceOf(await signer.getAddress())
    //   return [balance, decimal]
    // }
    if (!this.wallet || !address) return []
    const balance = await this.wallet.request({
      method: 'eth_getBalance',
      params: [
        address, // address to check for balance
        'latest', // "latest", "earliest" or "pending" (optional)
      ],
    })
    return [balance, 18]
  }

  async switchToMain(force?: boolean) {
    if (this.wallet) {
      this.provider = new providers.Web3Provider(this.wallet)
      const r = await this.provider.ready
      // force to main
      if (force || (this.wallet.selectedAddress && r.name !== 'homestead')) {
        await this.wallet.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId }],
        })
      }
      if (this.wallet.selectedAddress) {
        this.selectAddress = this.wallet.selectedAddress
        MetaMask.triggerAddrChange(this.selectAddress)
      } else {
        this.selectAddress = ''
        MetaMask.triggerAddrChange('')
      }
    }
  }

  async getUSDTContract(): Promise<[string, number]> {
    const isTestNet = await this.isTestNet()
    if (isTestNet) {
      return ['0xb6434ee024892cbd8e3364048a259ef779542475', 18]
    }
    return ['0xdac17f958d2ee523a2206206994597c13d831ec7', 6]
  }

  async isTestNet() {
    if (this.wallet) {
      let chainName
      if (this.provider) {
        chainName = this.provider._network.name
      } else {
        this.provider = new providers.Web3Provider(this.wallet)
        const r = await this.provider.ready
        chainName = r.name
      }
      return chainName !== 'homestead'
    }
    return true
  }

  async festimateGas(tx: providers.TransactionRequest): Promise<{ success: boolean; data?: string; msg?: string }> {
    try {
      if (!this.provider) return { success: false }
      const failed = await this.validate(tx)
      if (failed) {
        console.error('failed approveERC20' + failed)
        return { success: false, msg: 'failed approveERC20' + failed }
      }
      const gasPrice = await this.provider.getGasPrice()
      const gasLimit = await this.provider.estimateGas(tx)
      return {
        success: true,
        data: bignumberMult(utils.formatUnits(gasLimit, 'gwei'), utils.formatUnits(gasPrice, 'gwei')),
      }
    } catch (e) {
      return { success: false, msg: 'fail to estimateGas, use the defaultGasLimit' }
    }
  }

  async validate(tx: providers.TransactionRequest) {
    try {
      if (!this.provider) return
      const result = await this.provider.call(tx)
      return utils.toUtf8String('0x' + result.substr(138))
    } catch (e: any) {
      if (e.code == -32000) {
        if (e.message.indexOf('err: insufficient funds for gas') > -1) {
          throw new Error('You do not have enough Balance in your account to pay for transaction fees on network.')
        } else {
          throw new Error(e.message)
        }
      } else {
        if (e.code === -32603) {
          throw new Error(e?.data?.message)
        } else {
          throw new Error(e.message)
        }
      }
    }
  }
}

function hex2asc(pStr: string) {
  let tempstr = ''
  for (let b = 0; b < pStr.length; b = b + 2) {
    tempstr = tempstr + String.fromCharCode(parseInt(pStr.substr(b, 2), 16))
  }
  return tempstr
}
