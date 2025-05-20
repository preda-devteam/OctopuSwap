/**
 * @description: okx钱包class
 * @author: yuanyuan.li
 * @date: 2024-10-23 14:50:00
 * @abstract: TODO部分待正式发布时需要添加，目前ETH默认链接sepolia网络供测试；network正式发布需要改为mainnet地址，强制只能走mainnetokx不支持sol的切换主网方法
 */
import { providers, utils } from 'ethers'
import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  VersionedTransaction,
  TransactionMessage,
} from '@solana/web3.js'
import { bignumberMult } from './string'

export default class OkxWallet {
  /**
   * network是solana的rpc地址
   * chainID是eth的chainID
   */
  private static instance: OkxWallet
  public network: string
  public chainID: string
  public wallet: any
  public selectAddress = ''
  public onAddrChange: (addr: string) => void = () => {}
  private extraFee = 0.00000812

  public chainIdMain = '0x1'

  constructor({ onAddrChange }: { onAddrChange: (addr: string) => void }) {
    this.network = 'https://api.testnet.solana.com'
    this.chainID = '0xAA36A7' // sepolia network
    this.onAddrChange = onAddrChange
  }

  public static getInstance({ onAddrChange }: { onAddrChange: (addr: string) => void }): OkxWallet {
    if (!OkxWallet.instance) {
      OkxWallet.instance = new OkxWallet({ onAddrChange })
    }
    OkxWallet.instance.onAddrChange = onAddrChange
    return OkxWallet.instance
  }

  public getProvider(currency: 'ETH' | 'SOL') {
    if ('okxwallet' in window) {
      const provider =
        currency === 'SOL' ? (window.okxwallet as any)?.solana : currency === 'ETH' ? window.okxwallet : null
      if (provider?.isOkxWallet) {
        return provider
      }
    }
    return null
  }

  checkWallet() {
    if (!this.wallet) {
      throw new Error('wallet not init')
    }
    if (!this.selectAddress) {
      throw new Error('Wallet is not connected. Please reconnect.')
    }
  }

  async sendETH(to: string, amount: string) {
    const response = await this.wallet.request({
      method: 'eth_sendTransaction',
      params: [
        {
          from: this.selectAddress,
          to,
          value: utils.hexlify(utils.parseEther(amount)),
        },
      ],
    })
    const txHash = response
    return txHash
  }

  async sendSOL(to: string, amount: string) {
    const connection = new Connection(this.network)
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: new PublicKey(this.selectAddress),
        toPubkey: new PublicKey(to),
        lamports: BigInt(Math.floor(parseFloat(amount) * LAMPORTS_PER_SOL)),
      }),
    )

    const { blockhash } = await connection.getLatestBlockhash()
    transaction.recentBlockhash = blockhash
    transaction.feePayer = new PublicKey(this.selectAddress)

    // Explicitly check if signTransaction method exists
    if (typeof this.wallet.signTransaction !== 'function') {
      throw new Error('Wallet does not support signTransaction method')
    }

    const signed = await this.wallet.signTransaction(transaction)
    const signature = await connection.sendRawTransaction(signed.serialize())
    return signature
  }

  async geETHBalance(address: string) {
    const balance = await this.wallet.request({
      method: 'eth_getBalance',
      params: [
        address, // address to check for balance
        'latest', // "latest", "earliest" or "pending" (optional)
      ],
    })
    return [balance, 18]
  }

  async geSOLBalance(address: string) {
    try {
      const publicKey = new PublicKey(address)
      const connection = new Connection(this.network)
      const balanceInLamports = await connection.getBalance(publicKey)

      const balanceInSol = balanceInLamports / LAMPORTS_PER_SOL || 0
      return [balanceInSol.toString(), 9]
    } catch (error) {
      console.error('Error getting balance:', error)
      throw error
    }
  }

  async validate(tx: providers.TransactionRequest) {
    const provider = new providers.Web3Provider(this.wallet)
    try {
      if (!provider) return
      const result = await provider.call(tx)
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

  async estimateETHGas(tx: providers.TransactionRequest): Promise<{ success: boolean; data?: string; msg?: string }> {
    const provider = new providers.Web3Provider(this.wallet)
    try {
      const failed = await this.validate(tx)
      if (failed) {
        console.error('failed approveERC20' + failed)
        return { success: false, msg: 'failed approveERC20' + failed }
      }
      const gasPrice = await provider.getGasPrice()
      const gasLimit = await provider.estimateGas(tx)
      return {
        success: true,
        data: bignumberMult(utils.formatUnits(gasLimit, 'gwei'), utils.formatUnits(gasPrice, 'gwei')),
      }
    } catch (e) {
      return { success: false, msg: 'fail to estimateGas, use the defaultGasLimit' }
    }
  }

  async estimateSOLGas(sendArg: {
    targetAddress: string
    amount: number
  }): Promise<{ success: boolean; data?: string; msg?: string }> {
    try {
      const fromPubkey = new PublicKey(this.selectAddress)
      const toPubkey = new PublicKey(sendArg.targetAddress)
      const connection = new Connection(this.network)

      // 获取最新的区块哈希
      const { blockhash } = await connection.getLatestBlockhash('confirmed')

      // 创建转账指令
      const transferInstruction = SystemProgram.transfer({
        fromPubkey,
        toPubkey,
        lamports: sendArg.amount,
      })

      // 创建交易消息
      const messageV0 = new TransactionMessage({
        payerKey: fromPubkey,
        recentBlockhash: blockhash,
        instructions: [transferInstruction],
      }).compileToV0Message()

      // 创建版本化交易
      const transaction = new VersionedTransaction(messageV0)

      // 获取交易的序列化大小
      const rawTransaction = transaction.serialize()
      const txSize = rawTransaction.length

      // 使用 getFeeForMessage 来获取费用估算
      const fee = await connection.getFeeForMessage(messageV0, 'confirmed')

      if (fee === null) {
        throw new Error('Failed to get fee estimation')
      }
      // 加上安全边际，防止网络波动导致手续费不足
      const estimatedFee = (fee.value ?? 0) / LAMPORTS_PER_SOL

      return {
        success: true,
        data: estimatedFee.toFixed(9).replace(/\.?0+$/, ''),
      }
    } catch (error) {
      console.error('Error estimating gas:', error)
      return {
        success: false,
        msg: error instanceof Error ? error.message : String(error),
      }
    }
  }

  public async connect(currency: 'ETH' | 'SOL') {
    const provider = this.getProvider(currency)
    if (provider) {
      this.wallet = provider
      try {
        const response =
          currency === 'SOL'
            ? await provider.connect({ network: this.network })
            : await provider.request({ method: 'eth_requestAccounts' })

        console.log(`Connected to OKX Wallet on ${this.network} for ${currency}:`, response)

        if (currency === 'SOL' && response.publicKey) {
          this.selectAddress = response.publicKey.toString()
          this.onAddrChange(this.selectAddress)
          console.log('=================response', this.selectAddress)
        } else if (currency === 'ETH' && response && response.length > 0) {
          const address = response[0]
          this.selectAddress = address
          this.onAddrChange(this.selectAddress)
          // TODO: 切换到主网
          //   this.switchToMain('ETH')
        } else {
          this.selectAddress = ''
        }

        if (currency === 'ETH') {
          this.wallet.on('accountsChanged', (accounts: string[]) => {
            this.selectAddress = accounts[0]
            this.onAddrChange(this.selectAddress)
          })
        } else {
          this.wallet.on('accountChanged', (newPublicKey: any) => {
            if (newPublicKey) {
              this.selectAddress = newPublicKey.toString()
              this.onAddrChange(this.selectAddress)
            } else {
              this.selectAddress = ''
              this.onAddrChange('')
            }
          })
        }

        if (currency === 'ETH') {
          await provider.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: this.chainID }],
          })
          // TODO: 切换主网
          this.wallet.on('chainChanged', async (chainId: string) => {
            console.log('==========chainChanged=======')
            if (chainId !== this.chainIdMain) {
              // this.switchToMain('ETH')
            } else {
              // 如果切换的是主网的话，需要获取主网地址
              const accounts = await this.wallet.request({ method: 'eth_requestAccounts' })
              if (accounts && accounts.length > 0) {
                this.selectAddress = accounts[0]
                this.onAddrChange(this.selectAddress)
              } else {
                this.selectAddress = ''
                this.onAddrChange('')
              }
            }
          })
        }

        // eslint-disable-next-line prettier/prettier
        (window as any).okxwallet.on('disconnect', () => {
          this.selectAddress = ''
          this.onAddrChange('')
          localStorage.removeItem(currency as string)
          console.log('Wallet disconnected 666')
        })

        this.onAddrChange(this.selectAddress)
        console.log('Updated select address:', this.selectAddress)

        return this.selectAddress
      } catch (error) {
        console.error(`Connection to OKX Wallet failed on ${this.network} for ${currency}:`, error)
        throw error
      }
    } else {
      window.open('https://chromewebstore.google.com/detail/okx-wallet/mcohilncbfahbmgdjkbpemcciiolgcge', '_blank')
      throw new Error('OKX Wallet is not available')
    }
  }

  public async sendTransaction(sendArg: { currency: 'ETH' | 'SOL'; targetAddress: string; amount: string }) {
    this.checkWallet()
    if (sendArg.currency === 'ETH') {
      const txnHash = await this.sendETH(sendArg.targetAddress, sendArg.amount)
      return txnHash
    } else {
      const signature = await this.sendSOL(sendArg.targetAddress, sendArg.amount)
      return signature
    }
  }

  public async getBalance(address: string, currency: 'ETH' | 'SOL'): Promise<[string, number]> {
    this.checkWallet()

    if (currency === 'ETH') {
      const balance: any = await this.geETHBalance(address)
      return balance
    } else {
      const balance: any = await this.geSOLBalance(address)
      return balance
    }
  }

  public async estimateGas(sendArg: { currency: 'ETH' | 'SOL'; targetAddress: string; amount: number }) {
    this.checkWallet()
    if (sendArg.currency === 'ETH') {
      const res = await this.estimateETHGas({
        to: sendArg.targetAddress,
        value: utils.parseEther(sendArg.amount.toString()),
      })
      return res
    } else {
      const res = await this.estimateSOLGas({
        targetAddress: sendArg.targetAddress,
        amount: Math.round(parseFloat(sendArg.amount.toString()) * LAMPORTS_PER_SOL),
      })
      return res
    }
  }

  private async switchToMain(currency: 'ETH' | 'SOL') {
    if (!this.wallet || !this.selectAddress) return

    if (currency === 'ETH') {
      await this.wallet.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: this.chainIdMain }],
      })
      if (this.wallet.selectedAddress) {
        this.selectAddress = this.wallet.selectedAddress
        this.onAddrChange(this.wallet.selectedAddress)
      } else {
        this.selectAddress = ''
        this.onAddrChange('')
      }
    }
  }

  public async walletIsConnected(currency: 'ETH' | 'SOL') {
    try {
      const provider = this.getProvider(currency)
      if (!provider) {
        console.log('Provider not found')
        return false
      }

      if (currency === 'ETH') {
        const accounts = await provider.request({ method: 'eth_accounts' })
        return accounts && accounts.length > 0
      } else if (currency === 'SOL') {
        const response = await provider.connect({ network: this.network, onlyIfTrusted: true })
        return response.publicKey ? true : false
      }
    } catch (error) {
      console.error('Error checking wallet connection:', error)
      return false
    }
  }
}
