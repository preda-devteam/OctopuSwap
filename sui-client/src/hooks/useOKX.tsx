/**
 * @description: okx wallet hooks
 * @author: yuanyuan.li
 * @abstract: 需要解除切换主网的注释
 */
import { useState, useEffect, useRef } from 'react'
import { useRequest } from 'ahooks'
import OkxWallet from '@/utils/okx'
import BeeAPI from '@/dataApi/Beepay'

export function useOKX(address?: string, l1Token?: string) {
  const okxWallet = useRef<OkxWallet | null>(null)
  const [l1Address, setL1Address] = useState<string>('')
  const [connectionError, setConnectionError] = useState<string | null>(null)

  const handleAccountsChanged = (accounts: string[]) => {
    if (okxWallet.current) {
      okxWallet.current.selectAddress = accounts[0]
      setL1Address(okxWallet.current.selectAddress)
    }
  }

  const handleAccountChanged = (newPublicKey: any) => {
    if (okxWallet.current) {
      if (newPublicKey) {
        okxWallet.current.selectAddress = newPublicKey.toString()
        setL1Address(newPublicKey)
      } else {
        okxWallet.current.selectAddress = ''
        setL1Address('')
      }
    }
  }

  const handleChainChanged = async (chainId: string) => {
    if (chainId !== okxWallet.current?.chainIdMain) {
      // this.switchToMain('ETH')
    } else {
      const accounts = await okxWallet.current?.wallet.request({ method: 'eth_requestAccounts' })
      if (accounts && accounts.length > 0) {
        okxWallet.current.selectAddress = accounts[0]
        setL1Address(accounts[0])
      } else {
        okxWallet.current.selectAddress = ''
        setL1Address('')
      }
    }
  }

  const handleDisconnect = () => {
    if (okxWallet.current) {
      okxWallet.current.selectAddress = ''
      setL1Address('')
      localStorage.removeItem(l1Token as string)
      console.log('Wallet disconnected qqq')
    }
  }

  useEffect(() => {
    const initOKX = async () => {
      okxWallet.current = OkxWallet.getInstance({
        onAddrChange: (addr: string) => {
          setL1Address(addr)
        },
      })

      const provider = okxWallet.current?.getProvider(l1Token as 'ETH' | 'SOL')

      if (provider) {
        okxWallet.current.wallet = provider
        try {
          const response =
            l1Token === 'SOL'
              ? await provider.connect({ network: okxWallet.current?.network, onlyIfTrusted: true })
              : await provider.request({ method: 'eth_accounts' })
          if (okxWallet.current) {
            if (l1Token === 'SOL' && response.publicKey) {
              const address = response.publicKey.toString()
              okxWallet.current.selectAddress = address
              setL1Address(address)
            } else if (l1Token === 'ETH' && response && response.length > 0) {
              const [address] = response
              okxWallet.current.selectAddress = address
              setL1Address(address)
              // TODO: 切换到主网
              //   okxWallet.current?.switchToMain('ETH')
            } else {
              okxWallet.current.selectAddress = ''
              setL1Address('')
            }
          }
        } catch (error) {
          console.error('Auto-connect failed:', error)
          if (l1Token) {
            const walletName = localStorage.getItem(l1Token)
            // 4001 user reject
            const isUserReject = (error as { code: number })?.code === 4001
            if (walletName === 'okx' && !isUserReject) {
              setTimeout(() => {
                initOKX()
              })
            }
          }
        }

        // okxWallet.current?.startAssociationCheck(l1Token)
        const walletName = localStorage.getItem(l1Token as string)
        if (okxWallet.current?.wallet && walletName === 'okx') {
          okxWallet.current.wallet.on('accountsChanged', handleAccountsChanged)
          okxWallet.current.wallet.on('accountChanged', handleAccountChanged)
          okxWallet.current.wallet.on('chainChanged', handleChainChanged)
          okxWallet.current.wallet.on('disconnect', handleDisconnect)
        }
      }
    }

    initOKX()

    return () => {
      if (okxWallet.current?.wallet) {
        okxWallet.current.wallet.off('accountsChanged', handleAccountsChanged)
        okxWallet.current.wallet.off('accountChanged', handleAccountChanged)
        okxWallet.current.wallet.off('chainChanged', handleChainChanged)
        okxWallet.current.wallet.off('disconnect', handleDisconnect)
      }
    }
  }, [l1Token])

  const { data: l2Address } = useRequest(
    async () => {
      if (!address) return

      const res = await BeeAPI.signup(address)

      return l1Token === 'SOL' ? res?.result?.sol : res?.result?.eth
    },
    {
      refreshDeps: [address],
    },
  )

  const { data: allAddress } = useRequest(
    async () => {
      if (!address) return

      const res = await BeeAPI.signup(address)

      return res?.result
    },
    {
      refreshDeps: [address],
    },
  )

  const {
    data: l1Gas,
    loading: loadingGas,
    run: getL1Gas,
  } = useRequest(
    async (cost: string, currency: 'ETH' | 'SOL') => {
      console.log('=============getL1Gas', cost, okxWallet.current?.selectAddress, currency)
      if (!okxWallet.current || !cost || !okxWallet.current.selectAddress) return '0'
      const res = await okxWallet.current.estimateGas({
        currency,
        targetAddress: okxWallet.current.selectAddress,
        amount: parseFloat(cost),
      })
      return res?.data || '0'
    },
    {
      refreshDeps: [address],
      manual: true,
    },
  )

  return {
    okxWallet,
    l1Address,
    l2Address,
    allAddress,
    l1Gas,
    loadingGas,
    connectionError,
    getL1Gas,
  }
}
