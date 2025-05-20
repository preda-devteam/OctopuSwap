import BeeAPI from '@/dataApi/Beepay'
import { PublicKey } from '@solana/web3.js'
import { useRequest } from 'ahooks'
import { useEffect, useRef, useState } from 'react'
import Phantom from '@/utils/phantom'

export function usePhantom(address?: string, l1Token?: string) {
  const phantomWallet = useRef<Phantom | null>(null)
  const [l1Address, setL1Address] = useState('')
  const [connectionError, setConnectionError] = useState<string | null>(null)

  const handleAccountChanged = (publicKey: PublicKey | null) => {
    console.log('========accountChanged=======', publicKey)
    if (publicKey && phantomWallet.current) {
      phantomWallet.current.selectAddress = publicKey.toString()
      phantomWallet.current?.onAddrChange(phantomWallet.current?.selectAddress)
    } else {
      if (phantomWallet.current) {
        phantomWallet.current.selectAddress = ''
        phantomWallet.current?.onAddrChange('')
      }
    }
  }

  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts && accounts.length > 0 && phantomWallet.current) {
      phantomWallet.current.selectAddress = accounts[0]
      phantomWallet.current?.onAddrChange(phantomWallet.current?.selectAddress)
    }
  }

  useEffect(() => {
    const initPhantom = async () => {
      phantomWallet.current = Phantom.getInstance({
        onAddrChange: (addr: string) => {
          setL1Address(addr)
        },
        extraGasFee: '0.000025',
      })
      if (!l1Token) return
      const providerIsConnected = localStorage.getItem(l1Token)
      if (!providerIsConnected) return

      const provider = phantomWallet.current?.getProvider(l1Token as 'ETH' | 'SOL')
      phantomWallet.current.wallet = provider

      if (provider) {
        try {
          // eslint-disable-next-line prettier/prettier
          const res =
            l1Token === 'SOL'
              ? await provider.connect({ onlyIfTrusted: true })
              : await provider.request({ method: 'eth_accounts' })
          console.log('===============phantom res', res)
          if (phantomWallet.current) {
            if (l1Token === 'SOL' && res.publicKey) {
              const address = res.publicKey.toString()
              phantomWallet.current.selectAddress = address
              setL1Address(address)
              const walletName = localStorage.getItem('SOL')
              if (!walletName) {
                localStorage.setItem('SOL', 'phantom')
              }
              // TODO: 切换到主网
              // this.switchToMain('SOL')
            } else if (l1Token === 'ETH' && res && res.length > 0) {
              phantomWallet.current.selectAddress = res[0]
              setL1Address(res[0])
              const walletName = localStorage.getItem('ETH')
              if (!walletName) {
                localStorage.setItem('ETH', 'phantom')
              }
              // TODO: 切换到主网
              //   this.switchToMain('ETH')
            } else {
              phantomWallet.current.selectAddress = ''
              setL1Address('')
            }
            phantomWallet.current?.startAssociationCheck(l1Token as 'ETH' | 'SOL')
            if (l1Token === 'ETH') {
              phantomWallet.current?.wallet.on('accountsChanged', (accounts: string[]) => {
                if (accounts && accounts.length > 0 && phantomWallet.current) {
                  phantomWallet.current.selectAddress = accounts[0]
                  phantomWallet.current?.onAddrChange(phantomWallet.current?.selectAddress)
                }
              })
            } else {
              if (phantomWallet.current?.wallet) {
                phantomWallet.current.wallet.on('accountChanged', handleAccountChanged)
                phantomWallet.current.wallet.on('accountsChanged', handleAccountsChanged)
              }
            }
          }
        } catch (error) {
          console.error('Auto-connect failed:', error)
          setTimeout(() => {
            const walletName = localStorage.getItem(l1Token)
            // 4001 user reject
            const isUserReject = (error as { code: number })?.code === 4001
            if (walletName === 'phantom' && !isUserReject) {
              initPhantom()
            }
          })
        }
      }
    }

    initPhantom()

    return () => {
      if (phantomWallet.current?.wallet) {
        phantomWallet.current.wallet.off('accountChanged', handleAccountChanged)
        phantomWallet.current.wallet.off('accountsChanged', handleAccountsChanged)
      }
      phantomWallet.current?.stopAssociationCheck()
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
      console.log('getL1Gas phantom', cost, phantomWallet.current?.selectAddress)
      // 将 SOL 转换为 lamports

      if (!phantomWallet.current || !cost || !phantomWallet.current.selectAddress) return '0'
      const res = await phantomWallet.current.festimateGas({
        currency,
        targetAddress: phantomWallet.current.selectAddress,
        amount: cost,
      })

      return res?.data || '0'
    },
    {
      refreshDeps: [address],
      manual: true,
    },
  )

  return {
    phantomWallet,
    l1Address,
    l2Address,
    allAddress,
    l1Gas,
    loadingGas,
    getL1Gas,
    connectionError,
  }
}
