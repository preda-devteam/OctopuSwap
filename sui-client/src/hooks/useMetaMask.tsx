import BeeAPI from '@/dataApi/Beepay'
import MetaMask from '@/utils/metamask'
import { utils } from 'ethers'
import { useRequest } from 'ahooks'
import { useEffect, useRef, useState } from 'react'

export function useMetaMask(address?: string) {
  const metamask = useRef<MetaMask | null>(null)
  const [l1Address, setL1Address] = useState('')

  useEffect(() => {
    metamask.current = new MetaMask({
      addressChangeCB: setL1Address,
    })
  }, [])

  const { data: l2Address } = useRequest(
    async () => {
      if (!address) return

      const res = await BeeAPI.signup(address)

      return res?.result?.eth
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
    async (cost: string) => {
      if (!metamask.current || !cost || !metamask.current?.selectAddress) return '0'
      const res = await metamask.current.festimateGas({
        to: metamask.current?.selectAddress,
        value: utils.parseEther(cost),
      })

      return res?.data || '0'
    },
    {
      refreshDeps: [address],
      manual: true,
    },
  )

  return {
    metamask,
    l1Address,
    l2Address,
    l1Gas,
    loadingGas,
    getL1Gas,
  }
}
