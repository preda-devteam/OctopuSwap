'use client'
import React, { useEffect, useState, useCallback, createContext, useContext } from 'react'
import { useDioxContext } from './useDiox'
import cookie from 'js-cookie'
import toasty from '@/components/base/Toast'

export type Address = {
  address: string
  avatar?: string
  alias?: string
  balance?: number
}

const Context = createContext<{ address: Address | null; bindAppAddress: null | (() => void) }>({
  address: null,
  bindAppAddress: null,
})
const Provider = Context.Provider
let initTime: NodeJS.Timeout | null = null
export const useDioxAddressContext = () => useContext(Context)

export function DioxAddressContextProvider({
  children,
  cacheAddress = null,
}: {
  children: React.ReactNode
  cacheAddress: Address | null
}) {
  const [address, setAddress] = useState<Address | null>(cacheAddress)
  const { dioxide } = useDioxContext()
  useEffect(() => {
    if (dioxide) {
      getAppAddress()
      dioxide.on('connected_address_changed', (address: string[]) => {
        console.log('connected_address_changed', address)
        getAddressProfile()
        const initAddr = {
          address: address[0].toLocaleLowerCase(),
          avatar: '',
          alias: '',
          balance: 0,
        }
        cookie.set('cacheAddress', JSON.stringify(initAddr))
        setAddress(initAddr)
        setTimeout(() => {
          window.location.reload()
        }, 200)
      })
      dioxide.on('disconnect', (e: boolean) => {
        console.log('disconnect', e)
        setAddress(null)
      })
      dioxide.on('network_changed', () => {
        getAppAddress()
      })
      dioxide.on('connect', (e: any) => {
        console.log('connect', e)
        getAppAddress()
      })
    } else {
      getAppAddress()
    }
  }, [dioxide])

  const getAppAddress = useCallback(async () => {
    initTime && clearTimeout(initTime)
    if (!dioxide) {
      initTime = setTimeout(() => {
        setAddress(null)
      }, 200)
      return
    }
    try {
      const [add] = await dioxide.request({
        method: 'connected_address',
      })
      if (!add) {
        setAddress(null)
        return cookie.remove('cacheAddress')
      }
      const cacheAddrStr = cookie.get('cacheAddress')
      let initAddr = {
        address: add.toLocaleLowerCase(),
        avatar: '',
        alias: '',
        balance: 0,
      }
      if (cacheAddrStr) {
        const cacheAddr = JSON.parse(cacheAddrStr)
        if (cacheAddr.address === add.toLocaleLowerCase()) {
          initAddr = cacheAddr
        }
      }
      cookie.set('cacheAddress', JSON.stringify(initAddr))
      setAddress(initAddr)
      getAddressProfile()
    } catch (e: any) {
      // cookie.remove('cacheAddress')
      if (e?.code === 32602) {
        setAddress(null)
      }
    }
  }, [dioxide])

  const getAddressProfile = useCallback(async () => {
    if (!dioxide) return
    try {
      const [profile, balance] = await Promise.all([
        dioxide.request({
          method: 'profile',
        }),
        dioxide.request({
          method: 'balance',
        }),
      ])
      if (profile) {
        profile.address = profile.address.toLocaleLowerCase()
        const addr = {
          ...profile,
          balance: balance.split(':')[0],
        }
        setAddress(addr)
        cookie.set('cacheAddress', JSON.stringify(profile))
      }
    } catch (e: any) {
      if (e?.code === 32602) {
        setAddress(null)
      }
    }
  }, [dioxide])

  const bindAppAddress = useCallback(async () => {
    if (!dioxide?.isDioxWallet) {
      window?.open &&
        window.open(
          'https://chrome.google.com/webstore/detail/diowallet/ghdejoclpabnhidemhnfagafafcmgcfm',
          'fullscreen=1',
        )
      return
    }
    try {
      const [add] = await dioxide.request({
        method: 'request_connect_address',
        params: {
          symbol: 'XREI',
        },
      })
      setAddress(add)
    } catch (e) {
      console.log(e)
      const msg = (e as { message?: string })?.message
      msg && toasty({ content: msg })
    }
  }, [dioxide])

  return <Provider value={{ address, bindAppAddress: bindAppAddress }}>{children}</Provider>
}
