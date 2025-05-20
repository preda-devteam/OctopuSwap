/**
 * @description: phantom wallet class
 * @author yuanyuan.li
 * @abstract: 需要将切换主网的代码取消注释
 */
import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  Cluster,
  TransactionMessage,
  VersionedTransaction,
  clusterApiUrl,
} from '@solana/web3.js'
import { providers, utils, BigNumber } from 'ethers'
import { bignumberMult, token2Decimals } from './string'

interface PhantomProps {
  onAddrChange: (addr: string) => void
  extraGasFee?: string
}

export default class Phantom {
  static instance: any
  private connection: Connection
  public selectAddress = ''
  private network: Cluster = 'devnet'
  private chainID: string
  private chainIdMain = '0x1'
  public wallet: any // Phantom wallet instance
  public onAddrChange: (addr: string) => void
  public extraGasFee: string
  private associationCheckInterval: NodeJS.Timeout | null = null

  constructor({ onAddrChange, extraGasFee }: PhantomProps) {
    this.connection = new Connection(clusterApiUrl('devnet')) // 使用 devnet，可以根据需要更改
    this.onAddrChange = onAddrChange
    this.extraGasFee = extraGasFee || '0'
    this.chainID = '0xAA36A7' // sepolia network
  }

  public static getInstance({
    onAddrChange,
    extraGasFee,
  }: {
    onAddrChange: (addr: string) => void
    extraGasFee?: string
  }): Phantom {
    if (!Phantom.instance) {
      Phantom.instance = new Phantom({ onAddrChange, extraGasFee })
    }
    Phantom.instance.onAddrChange = onAddrChange
    return Phantom.instance
  }

  getProvider = (currency: 'ETH' | 'SOL') => {
    if ('phantom' in window) {
      const provider =
        currency === 'SOL'
          ? (window.phantom as any)?.solana
          : currency === 'ETH'
          ? (window.phantom as any)?.ethereum
          : null

      if (provider?.isPhantom) {
        return provider
      }
    }
    return null
  }

  async getSolBalance(address: string) {
    try {
      const publicKey = new PublicKey(address)
      const balanceInLamports = await this.connection.getBalance(publicKey)

      // 将 lamports（Solana 的最小单位） 转换为 SOL 并格式化
      const balanceInSol = balanceInLamports / LAMPORTS_PER_SOL
      return [balanceInSol.toString(), 9] // 保留 9 位小数
    } catch (error) {
      console.error('Error getting balance:', error)
      throw error
    }
  }

  async getETHBalance(address: string) {
    const balance = await this.wallet.request({
      method: 'eth_getBalance',
      params: [
        address, // address to check for balance
        'latest', // "latest", "earliest" or "pending" (optional)
      ],
    })
    return [balance, 18]
  }

  async estimateSOLGas(sendArg: {
    targetAddress: string
    amount: number
  }): Promise<{ success: boolean; data?: string; msg?: string }> {
    try {
      const fromPubkey = new PublicKey(this.selectAddress)
      const toPubkey = new PublicKey(sendArg.targetAddress)

      // 获取最新的区块哈希
      const { blockhash } = await this.connection.getLatestBlockhash('confirmed')

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
      const fee = await this.connection.getFeeForMessage(messageV0, 'confirmed')

      if (fee === null) {
        throw new Error('Failed to get fee estimation')
      }
      // 加上安全边际，防止网络波动导致手续费不足
      const estimatedFee = (fee.value ?? 0) / LAMPORTS_PER_SOL

      return {
        success: true,
        data: (estimatedFee + parseFloat(this.extraGasFee)).toFixed(9).replace(/\.?0+$/, ''), // Remove trailing zeros,
      }
    } catch (error) {
      console.error('Error estimating gas:', error)
      return {
        success: false,
        msg: 'Failed to estimate transaction fee',
      }
    }
  }

  async estimateETHGas(tx: { to: string; value: string }): Promise<{ success: boolean; data?: string; msg?: string }> {
    const integerAmount = bignumberMult(tx.value, 10 ** token2Decimals('ETH')).toString()
    const hexAmount = '0x' + BigInt(integerAmount).toString(16)
    try {
      const gasPriceHex = await this.wallet.request({
        method: 'eth_gasPrice',
      })
      const gasLimitHex = await this.wallet.request({
        method: 'eth_estimateGas',
        params: [
          {
            from: this.selectAddress,
            to: tx.to,
            value: hexAmount,
          },
        ],
      })

      // Convert hex values to BigNumber
      const gasPrice = parseInt(gasPriceHex, 16)
      const gasLimit = parseInt(gasLimitHex, 16)

      // Calculate total gas fee in wei
      const totalGasFeeInWei = bignumberMult(gasPrice, gasLimit)

      // Convert wei to ether
      const totalGasFeeInEth = utils.formatEther(totalGasFeeInWei)
      // 估算不准，总是与真实手续费相差约一半，手动补齐
      return {
        success: true,
        data: (parseFloat(totalGasFeeInEth) * 2).toString(),
      }
    } catch (e) {
      return { success: false, msg: 'Failed to estimate gas, using the default gas limit' }
    }
  }

  async sendSolTransaction(sendArg: { targetAddress: string; amount: string }) {
    try {
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: new PublicKey(this.selectAddress),
          toPubkey: new PublicKey(sendArg.targetAddress),
          lamports: BigInt(Math.floor(parseFloat(sendArg.amount) * LAMPORTS_PER_SOL)),
        }),
      )

      const { blockhash } = await this.connection.getLatestBlockhash()
      transaction.recentBlockhash = blockhash
      transaction.feePayer = new PublicKey(this.selectAddress)

      // Explicitly check if signTransaction method exists
      if (typeof this.wallet.signTransaction !== 'function') {
        throw new Error('Wallet does not support signTransaction method')
      }

      const signed = await this.wallet.signTransaction(transaction)
      const signature = await this.connection.sendRawTransaction(signed.serialize())

      return signature
    } catch (error) {
      console.error('Error sending SOL:', error)
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

  checkWallet() {
    if (!this.wallet) {
      throw new Error('wallet not init')
    }
    console.log('==============this.selectAddress', this.selectAddress)
    if (!this.selectAddress) {
      throw new Error('Wallet is not connected. Please reconnect.')
    }
    return true
  }

  async connect(currency: 'ETH' | 'SOL') {
    const provider = this.getProvider(currency)

    if (provider) {
      this.wallet = provider

      try {
        const response =
          currency === 'SOL' ? await provider.connect() : await provider.request({ method: 'eth_requestAccounts' })

        console.log(`Connected to Phantom Wallet for ${currency}:`, response)

        if (currency === 'SOL' && response.publicKey) {
          this.selectAddress = response.publicKey.toString()
          // TODO: 切换到主网
          // this.switchToMain('SOL')
        } else if (currency === 'ETH' && response && response.length > 0) {
          this.selectAddress = response[0]
          // TODO: 切换到主网
          //   this.switchToMain('ETH')
        } else {
          this.selectAddress = ''
        }

        // 监听地址变化
        if (currency === 'ETH') {
          provider.on('accountsChanged', (accounts: string[]) => {
            this.selectAddress = accounts[0]
            this.onAddrChange(this.selectAddress)
          })
        } else {
          provider.on('accountChanged', (publicKey: PublicKey | null) => {
            console.log('========accountChanged=======', publicKey)
            if (publicKey) {
              this.selectAddress = publicKey.toString()
              this.onAddrChange(this.selectAddress)
            } else {
              this.selectAddress = ''
              this.onAddrChange('')
            }
          })
        }

        if (currency === 'ETH') {
          // TODO: 切换到主网
          provider.on('chainChanged', async (chainId: string) => {
            console.log('==========chainChanged=======', chainId)
            if (chainId !== this.chainIdMain) {
              // TODO: 切换到主网
              // this.switchToMain('ETH')
            } else {
              // 如果切换的是主网的话，需要获取主网地址
              const accounts = await provider.request({
                method: 'eth_requestAccounts',
                params: [{ chainId: this.chainIdMain }],
              })
              if (accounts && accounts.length > 0) {
                this.selectAddress = accounts[0]
                this.onAddrChange(this.selectAddress)
              } else {
                this.selectAddress = ''
                this.onAddrChange('')
              }
            }
          })
        } else {
          provider.on('networkChanged', (network: string) => {
            this.network = network as Cluster
            this.connection = new Connection(clusterApiUrl(this.network))
            // TODO: 切换到主网
            // this.switchToMain('SOL')
          })
        }

        // phantom钱包无法监听手动的断开连接
        this.startAssociationCheck(currency)

        this.onAddrChange(this.selectAddress)

        return this.selectAddress
      } catch (err) {
        console.error('Failed to connect to Phantom wallet', err)
        throw err as { message: string }
      }
    } else {
      window.open('https://chromewebstore.google.com/detail/phantom/bfnaelmomeimhlpmgjnjophhpkkoljpa', '_blank')
      throw new Error('Phantom wallet is not installed!')
    }
  }

  async sendETHTransaction(to: string, amount: string) {
    const integerAmount = bignumberMult(amount, 10 ** token2Decimals('ETH')).toString()
    const hexAmount = '0x' + BigInt(integerAmount).toString(16)

    try {
      const response = await this.wallet.request({
        method: 'eth_sendTransaction',
        params: [
          {
            from: this.selectAddress,
            to,
            value: hexAmount,
          },
        ],
      })

      // Ensure response is in the expected format
      if (response) {
        const txHash = response
        return txHash
      } else {
        throw new Error('Unexpected response format')
      }
    } catch (error) {
      console.error('Error sending ETH transaction:', error)
      throw error
    }
  }

  async sendTransaction(sendArg: { currency: 'ETH' | 'SOL'; targetAddress: string; amount: string }) {
    if (!this.wallet || !this.selectAddress) return

    if (sendArg.currency === 'ETH') {
      const txnHash = await this.sendETHTransaction(sendArg.targetAddress, sendArg.amount)
      return txnHash
    } else {
      const signature = await this.sendSolTransaction(sendArg)
      return signature
    }
  }

  async switchToMain(currency: 'ETH' | 'SOL') {
    console.log('Starting switchToMain method')
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
    } else {
      try {
        let currentNetwork
        try {
          console.log('Requesting current network')
          currentNetwork = await this.wallet.request({ method: 'getNetwork' })
          console.log('Current network:', currentNetwork)
        } catch (networkError) {
          console.warn('Unable to get current network:', networkError)
          // 如果无法获取当前网络，我们假需要切换
          currentNetwork = 'unknown'
        }

        if (currentNetwork !== 'mainnet-beta') {
          console.log('Attempting to switch to mainnet-beta')
          try {
            await this.wallet.request({
              method: 'switchNetwork',
              params: ['mainnet-beta'],
            })
            console.log('Successfully switched to mainnet-beta')
          } catch (switchError) {
            console.error('Error switching network:', switchError)
            // 如果切换网络失败，我们可能需要重新初始化钱包连接
            throw new Error('Failed to switch network. Please reconnect your wallet.')
          }
        }

        this.network = 'mainnet-beta'
        console.log('Setting up connection to', this.network)
        this.connection = new Connection(clusterApiUrl(this.network))

        if (this.wallet.publicKey) {
          this.selectAddress = this.wallet.publicKey.toString()
          this.onAddrChange(this.selectAddress)
          console.log('Updated select address:', this.selectAddress)
        } else {
          this.selectAddress = ''
          this.onAddrChange('')
          console.log('Cleared select address')
        }

        console.log('Switched to Solana mainnet')
      } catch (error) {
        console.error('Error in switchToMain:', error)
        // 重置钱包状态
        this.wallet = null
        this.selectAddress = ''
        this.onAddrChange('')
        throw error
      }
    }
  }

  /**
   * Solana 的手续费系统由两个组成部分组成：
   * 基础手续费（base fee）和优先手续费（priority fee）。广义上，每个手续费组件理想地服务于以下目的：
   * 基础手续费：使用网络资源的权利
   * 优先手续费：确定领导者交易队列中的顺序
   * 基础手续费目前设定为每个签名 0.000005 SOL（5,000 lamports），构成了交易成本的基础。这是由一个地址支付的费用，以便获得使用网络资源的权利。这是一个一次性的总费用，无论实际使用多少资源来执行交易（或者交易是否行），都需要预先支付给网络。
   */

  async festimateGas(sendArg: { currency: 'ETH' | 'SOL'; targetAddress: string; amount: number | string }) {
    this.checkWallet()
    if (sendArg.currency === 'ETH') {
      const res = await this.estimateETHGas({
        to: sendArg.targetAddress,
        value: sendArg.amount.toString(),
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

  async getBalance(address: string, currency: 'ETH' | 'SOL'): Promise<[string, number]> {
    this.checkWallet()
    if (currency === 'ETH') {
      const balance: any = await this.getETHBalance(address)
      return balance
    } else {
      const balance: any = await this.getSolBalance(address)
      return balance
    }
  }

  startAssociationCheck(currency: 'ETH' | 'SOL') {
    this.stopAssociationCheck() // 确保不会创建多个 interval
    this.associationCheckInterval = setInterval(async () => {
      const isAssociated =
        currency === 'ETH' ? await this.walletIsConnected('ETH') : await this.walletIsConnected('SOL')
      if (!isAssociated) {
        console.log('=======isAssociated', isAssociated)
        this.handleDisconnect(currency)
      }
    }, 10000)
  }

  stopAssociationCheck() {
    console.log('===============phantom stopAssociationCheck')
    if (this.associationCheckInterval) {
      clearInterval(this.associationCheckInterval)
      this.associationCheckInterval = null
    }
  } 

  private handleDisconnect(currency: string) {
    this.selectAddress = ''
    this.onAddrChange('')
    console.log('===============phantom disconnect')
    localStorage.removeItem('SOL' as string)
    localStorage.removeItem('ETH' as string)
    this.stopAssociationCheck()
  }

  public async walletIsConnected(currency: 'ETH' | 'SOL') {
    try {
      const provider = this.getProvider(currency)
      if (!provider) {
        console.log('Provider not found')
        return false
      }

      if (currency === 'ETH') {
        try {
          await provider.request({ method: 'eth_accounts' })
          return true
        } catch (error) {
          console.log('===============phantom walletIsConnected error', error)
          return false
        }
      } else if (currency === 'SOL') {
        try {
          console.log('===============phantom walletIsConnected connect666', provider)
          console.log('===============phantom walletIsConnected connect666 666', provider.connect)
          const res = await provider.connect({ onlyIfTrusted: true })
          console.log('===============phantom walletIsConnected res', res)
          return true
        } catch (error) {
          console.log('===============phantom walletIsConnected error', error)
          return false
        }
      }
    } catch (error) {
      console.error('Error checking wallet connection:', error)
      return false
    }
  }
}
