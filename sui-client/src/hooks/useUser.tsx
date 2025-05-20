import UserAPI from '@/dataApi/User'
import { toTokenAmount } from '@/utils/string'
import { useRequest } from 'ahooks'
import { useMetaMask } from './useMetaMask'
import { utils } from 'ethers'
import { useState } from 'react'
import { usePhantom } from './usePhantom'
import { useOKX } from './useOKX'
import { useDioxContext } from './useDiox'

interface UseProps {
  address?: string
  tokenAddress?: string
  l1Token?: string
  disabaled?: boolean
}

export function useUserVote({ address, tokenAddress, l1Token, disabaled }: UseProps) {
  const { data: votedAmount = '0' } = useRequest(
    async () => {
      if (!address || !tokenAddress || !l1Token || disabaled) {
        return
      }
      const res = await UserAPI.getMyVote(address, tokenAddress)
      const targetToken = res.data?.find(i => i.L1Token === l1Token)

      return toTokenAmount(targetToken?.TotalL1Amount || 0, l1Token)
    },
    {
      refreshDeps: [address, tokenAddress, l1Token],
    },
  )
  return votedAmount
}

export function useUserTokenBalance({ address, tokenAddress, disabaled }: UseProps) {
  const [reloadTime, setReloadTime] = useState(0)
  const { data: tokenBalance = '0' } = useRequest(
    async () => {
      if (!address || !tokenAddress || disabaled) {
        return
      }
      const res = await UserAPI.getTokenBalance(address)
      const targetToken = res.data?.find(i => i.TokenAddress === tokenAddress)

      return toTokenAmount(targetToken?.Balance || 0, '', targetToken?.Decimals)
    },
    {
      refreshDeps: [address, tokenAddress],
    },
  )
  return {
    data: tokenBalance || '0',
    reload: () => {
      setReloadTime(() => reloadTime + 1)
    },
  }
}

export function useUserL1Balance(token: string) {
  console.log('==========useUserL1Balance', token)
  const [reloadTime, setReloadTime] = useState(0)
  const { metamask } = useMetaMask()
  const { phantomWallet } = usePhantom('', token)
  const { okxWallet, l1Address: okxL1Address } = useOKX('', token)
  const { dioxide } = useDioxContext()
  const isETH = token === 'ETH'
  const isSOL = token === 'SOL'
  const { data } = useRequest(
    async () => {
      try {
        if (isETH) {
          const walletNameConnected = localStorage.getItem('ETH')
          if (walletNameConnected === 'metamask') {
            const metamaskWallet = metamask?.current
            if (!metamaskWallet) return '0'
            const l1Address = metamaskWallet?.wallet?.selectedAddress
            if (!l1Address) {
              // await wallet.connectAddress()
              setReloadTime(() => reloadTime + 1)
              return '0'
            }
            const [balance, decimal] = await metamaskWallet?.getBalance(l1Address, token)
            const int = parseInt(utils.formatUnits(balance, decimal - 4))

            return utils.formatUnits(int, 4) || '0'
          } else if (walletNameConnected === 'okx') {
            const wallet = okxWallet?.current
            if (!wallet) return '0'
            const l1Address = wallet?.selectAddress
            if (!l1Address) {
              // await wallet.connect('ETH')
              setReloadTime(() => reloadTime + 1)
              return '0'
            }
            const [balance, decimal] = await wallet?.getBalance(l1Address, 'ETH')
            const int = parseInt(utils.formatUnits(balance, decimal - 4))

            return utils.formatUnits(int, 4) || '0'
          } else if (walletNameConnected === 'phantom') {
            const wallet = phantomWallet?.current
            if (!wallet) return '0'
            const l1Address = wallet?.selectAddress
            if (!l1Address) {
              // await wallet.connect('ETH')
              setReloadTime(() => reloadTime + 1)
              return '0'
            }
            const [balance, decimal] = await wallet?.getBalance(l1Address, 'ETH')
            const int = parseInt(utils.formatUnits(balance, decimal - 4))
            console.log('int', int)

            return utils.formatUnits(int, 4) || '0'
          } else {
            return '0'
          }
        } else if (isSOL) {
          const walletNameConnected = localStorage.getItem('SOL')
          if (walletNameConnected === 'phantom') {
            const wallet = phantomWallet?.current
            if (!wallet) return '0'
            const l1Address = wallet?.selectAddress
            if (!l1Address) {
              // await wallet.connect('SOL')
              setReloadTime(() => reloadTime + 1)
              return '0'
            }
            const balance = await wallet?.getBalance(l1Address, 'SOL')
            return balance || '0'
          } else if (walletNameConnected === 'okx') {
            const wallet = okxWallet?.current
            if (!wallet) return '0'
            const l1Address = wallet?.selectAddress
            if (!l1Address) {
              // await wallet.connect('SOL')
              setReloadTime(() => reloadTime + 1)
              return '0'
            }
            const [balance] = await wallet?.getBalance(l1Address, 'SOL')
            return balance || '0'
          } else {
            return '0'
          }
        } else {
          const LAMPORTS_PER_DIO = 10 ** 8
          // dioxide
          if (!dioxide) return '0'
          const balance = await dioxide
            .request({
              method: 'balance',
            })
            .catch(() => {
              return '0'
            })
          return balance.split(':')[0] / LAMPORTS_PER_DIO || '0'
        }
      } catch (e) {
        console.log(e)
      }
    },
    {
      refreshDeps: [
        token,
        dioxide,
        metamask?.current,
        metamask?.current?.selectAddress,
        phantomWallet?.current,
        phantomWallet?.current?.selectAddress,
        okxWallet?.current,
        okxWallet?.current?.selectAddress,
      ],
    },
  )

  return {
    data,
    reload: () => {
      setReloadTime(() => reloadTime + 1)
    },
  }
}

export function useGetDIOGas() {
  const { dioxide } = useDioxContext()

  const {
    data: dioGas,
    loading: loadingDioGas,
    run: getDioGas,
  } = useRequest(
    async (ttl: string, tokenName: string, tokenAmount: string | number, expectedAmount: number) => {
      if (!dioxide || !tokenName || !expectedAmount || !tokenAmount) return '0'
      try {
        const gas = await dioxide.request({
          method: 'gasfee',
          params: {
            func: 'XREI.InternalTokenSwap.swapToken',
            args: {
              target_symbol: 'DIO',
              expected_amount: expectedAmount,
            },
            tokens: [{ [tokenName as string]: tokenAmount }],
            ttl,
          },
        })
        return gas || '0'
      } catch (error) {
        console.log(error)
      }
    },
    {
      manual: true,
      refreshDeps: [dioxide],
    },
  )

  return { dioGas, loadingDioGas, getDioGas }
}
