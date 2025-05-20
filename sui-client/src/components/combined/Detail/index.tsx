'use client'
import Image from 'next/image'
import Back from '@/components/combined/Back'
import dialog from '@/components/base/Dialog'
import DetailTabs from '@/components/combined/DetailTabs'
import { Vote } from '@/dataApi/Vote'
import { Launch } from '@/dataApi/Launch'
import React, { useEffect, useMemo, useState, useRef } from 'react'
import Like from '@/components/combined/Like'
import { useDioxAddressContext } from '@/hooks/useDioxAddress'
import { toTokenAmount, toStatusTime as toStatus, Status, toFixed, toLimitFixed, toTokenType } from '@/utils/string'
import Input from '../Input'
import { VoteType } from '../Input'
import { useMetaMask } from '@/hooks/useMetaMask'
import Button from '@/components/base/Button'
import toasty from '@/components/base/Toast'
import { TokenStatus } from '@/dataApi/Token'
import { useFavs } from '@/hooks/useFavs'
import { useUserTokenBalance, useUserVote } from '@/hooks/useUser'
import { FINISHED, PREPARE, TOKEN_TYPE } from '@/constants'
import { useRouter } from 'next/navigation'
import { linkSwap } from '@/utils/url'
import { usePhantom } from '@/hooks/usePhantom'
import { useOKX } from '@/hooks/useOKX'
import WalletSelect from '../WalletSelect'

export interface ConfirmParams {
  cost: string
  l1Gas?: string
  l2Address: string
  resetCost: () => void
  isWalletSelected: string
  voteType?: VoteType
}

function Detail({
  data,
  exchangeNumber,
  btnTxt = data.type === TOKEN_TYPE.VOTE ? 'Boost' : 'Submit',
  children,
  onCostChange,
  onConfirm,
}: React.PropsWithChildren<{
  data: Vote | Launch
  exchangeNumber?: string
  btnTxt?: string
  onCostChange?: (x: string) => void
  onConfirm?: (x: ConfirmParams) => void
}>) {
  const router = useRouter()
  const { address, bindAppAddress } = useDioxAddressContext()
  const { metamask, l1Address, l2Address, l1Gas, loadingGas, getL1Gas } = useMetaMask(address?.address)
  const {
    phantomWallet,
    l1Address: solAddress,
    l2Address: soll2Adress,
    l1Gas: solGas,
    loadingGas: solLoadingGas,
    getL1Gas: solGetGas,
  } = usePhantom(address?.address, data.L1Token)
  const {
    okxWallet,
    l1Address: okxL1Address,
    l2Address: okxL2Address,
    l1Gas: okxL1Gas,
    loadingGas: okxLoadingGas,
    getL1Gas: okxGetGas,
  } = useOKX(address?.address, data.L1Token)

  const isVote = useMemo(() => data.type === TOKEN_TYPE.VOTE, [data.type])
  const votedAmount = useUserVote({
    address: address?.address,
    tokenAddress: data.TokenAddress,
    l1Token: data.L1Token,
    disabaled: !isVote,
  })
  const { data: launchAmount } = useUserTokenBalance({
    address: address?.address,
    tokenAddress: data.TokenAddress,
    disabaled: isVote,
  })
  const { data: userFavs } = useFavs()
  const liked = useMemo(() => (userFavs?.some(i => i.TokenAddress === data?.TokenAddress) ? 1 : 0), [userFavs])
  const [cost, setCost] = useState('')
  const tokenType = toTokenType(data.Status)
  const isSwap = tokenType === TOKEN_TYPE.SWAP
  const isLaunch = tokenType === TOKEN_TYPE.LAUNCH
  const statusInfo = useMemo(() => {
    const tsInfo = data.type === TOKEN_TYPE.LAUNCH ? [data.LaunchStart, data.LaunchEnd] : [data.VoteStart, data.VoteEnd]
    return toStatus(...tsInfo, data.ServerTime)
  }, [data])
  const isFinished = statusInfo.status === Status.End
  const [isWalletSelected, setIsWalletSelected] = useState(localStorage.getItem(data.L1Token))
  const Wallet = {
    metamask: metamask.current,
    phantom: phantomWallet.current,
    okx: okxWallet.current,
  }
  const dialogRef = useRef<any>(null)
  const btnWordings = useMemo(() => {
    if (isSwap) {
      return 'Swap'
    }
    if (isFinished) {
      return FINISHED
    }
    if (statusInfo.status === Status.ComingSoon) {
      return `${PREPARE}: ` + statusInfo.timeStr
    }

    /**
     * ETH支持Metamask，Phantom和OKX三种钱包的支付
     * SOL支持Phantom和OKX两种钱包的支付
     */
    const isWalletConnected =
      data.L1Token === VoteType.ETH ? !!l1Address || !!solAddress || !!okxL1Address : !!solAddress || !!okxL1Address

    if (!isWalletSelected) {
      return 'Connect Wallet'
    } else {
      // 用户断开当前选择的钱包
      if (data?.L1Token === VoteType.ETH) {
        if (isWalletSelected === 'metamask') {
          if (!l1Address) return 'Connect Wallet'
        } else if (isWalletSelected === 'phantom') {
          if (!solAddress) return 'Connect Wallet'
        } else {
          if (!okxL1Address) return 'Connect Wallet'
        }
      } else {
        if (isWalletSelected === 'phantom') {
          if (!solAddress) return 'Connect Wallet'
        } else {
          if (!okxL1Address) return 'Connect Wallet'
        }
      }
    }

    return address && isWalletConnected ? btnTxt : 'Connect Wallet'
  }, [statusInfo, isSwap, isFinished, address, l1Address, solAddress, okxL1Address, isWalletSelected])

  const btnDisabled = useMemo(() => {
    if (isSwap) {
      return false
    }
    if (data.Status === TokenStatus.FINISH || statusInfo.status !== Status.InProgress) {
      return true
    }

    // 不知道sol/eth连接哪个钱包的时候要重新选择钱包连接
    if (!isWalletSelected) {
      return false
    }

    if (!address) return false

    if (data.L1Token === VoteType.ETH) {
      // 用户断开当前选择的钱包
      if (isWalletSelected === 'metamask') {
        if (!l1Address) return false
      } else if (isWalletSelected === 'phantom') {
        if (!solAddress) return false
      } else {
        if (!okxL1Address) return false
      }
    }

    if (data.L1Token === VoteType.SOLANA) {
      // 用户断开当前选择的钱包
      if (isWalletSelected === 'phantom') {
        if (!solAddress) return false
      } else {
        if (!okxL1Address) return false
      }
    }

    if (statusInfo.status !== Status.InProgress) {
      return true
    }
    const isDisabled =
      (data.L1Token === VoteType.ETH ? loadingGas || solLoadingGas || okxLoadingGas : solLoadingGas || okxLoadingGas) ||
      !cost
    if (isDisabled) {
      return true
    }

    return false
  }, [
    statusInfo,
    isSwap,
    address,
    cost,
    loadingGas,
    solLoadingGas,
    okxLoadingGas,
    l1Address,
    solAddress,
    okxL1Address,
    isWalletSelected,
  ])

  useEffect(() => {
    if (cost && l2Address) {
      if (isWalletSelected === 'metamask') {
        getL1Gas(cost)
      } else if (isWalletSelected === 'phantom') {
        solGetGas(cost, data.L1Token as 'ETH' | 'SOL')
      } else {
        okxGetGas(cost, data.L1Token as 'ETH' | 'SOL')
      }
    }
  }, [cost, l2Address])

  useEffect(() => {
    return () => {
      dialogRef.current?.removeDialog()
    }
  }, [])

  const handleCostChange = async ({ result, amount }: { result: boolean; amount: string }) => {
    const cost = !result ? '' : amount
    setCost(cost)
    onCostChange && onCostChange(cost)
  }

  const handleBtnClick = () => {
    if (isSwap) {
      router.push(linkSwap(data?.TokenAddress))
      return
    }
    if (!address) {
      bindAppAddress && bindAppAddress()
      return
    }

    /**
     * ETH支持Metamask，Phantom和OKX三种钱包的支付
     * SOL支持Phantom和OKX两种钱包的支付
     */
    let isWalletConnected =
      data.L1Token === VoteType.ETH ? !!l1Address || !!solAddress || !!okxL1Address : !!solAddress || !!okxL1Address

    if (data?.L1Token === VoteType.ETH) {
      if (isWalletSelected === 'metamask') {
        if (!l1Address) isWalletConnected = false
      } else if (isWalletSelected === 'phantom') {
        if (!solAddress) isWalletConnected = false
      } else {
        if (!okxL1Address) isWalletConnected = false
      }
    } else {
      if (isWalletSelected === 'phantom') {
        if (!solAddress) isWalletConnected = false
      } else {
        if (!okxL1Address) isWalletConnected = false
      }
    }

    // eth/sol未连接任何一个钱包
    if (!isWalletConnected || !isWalletSelected) {
      const options =
        data.L1Token === VoteType.ETH
          ? [
              { id: 'metamask', imgSrc: 'metamask.svg', desc: 'MetaMask' },
              { id: 'okx', imgSrc: 'okx.svg', desc: 'OKX Wallet' },
              { id: 'phantom', imgSrc: 'phantom.svg', desc: 'Phantom' },
            ]
          : [
              { id: 'okx', imgSrc: 'okx.svg', desc: 'OKX Wallet' },
              { id: 'phantom', imgSrc: 'phantom.svg', desc: 'Phantom' },
            ]
      const dialogResult = dialog({
        content: (
          <WalletSelect
            title={'Connect a Wallet'}
            options={options}
            handleClick={async (id: string) => {
              localStorage.setItem(data.L1Token, id)
              setIsWalletSelected(id)
              switch (id) {
                case 'metamask': {
                  const connectAddress = await metamask.current?.connectAddress().catch(err => {
                    toasty({ content: err?.message })
                  })
                  console.log('==========connectAddress metamask', connectAddress)
                  if (connectAddress) {
                    toasty({ content: 'Wallet Connected' })
                    dialogResult.removeDialog()
                  }
                  break
                }
                case 'okx': {
                  const connectAddress = await okxWallet.current?.connect(data.L1Token as 'ETH' | 'SOL').catch(err => {
                    toasty({ content: err?.message })
                  })
                  console.log('==========connectAddress okx', connectAddress)
                  if (connectAddress) {
                    toasty({ content: 'Wallet Connected' })
                    dialogResult.removeDialog()
                  }
                  break
                }
                case 'phantom': {
                  const connectAddress = await phantomWallet.current?.connect(data.L1Token as 'ETH' | 'SOL')
                  console.log('==========connectAddress phantom', connectAddress)
                  if (connectAddress) {
                    toasty({ content: 'Wallet Connected' })
                    dialogResult.removeDialog()
                  } else {
                    toasty({ content: 'Wallet Connect Failed' })
                  }
                  break
                }
                default: {
                  return null
                }
              }
            }}></WalletSelect>
        ),
      })

      dialogRef.current = dialogResult

      return
    }

    if (!l2Address) {
      toasty({ content: 'Please signup 0xbee on the website first' })
      return
    }

    onConfirm?.({
      cost,
      l1Gas: gasMapping[isWalletSelected as keyof typeof gasMapping],
      l2Address: soll2Adress as string,
      resetCost: () => setCost(''),
      isWalletSelected,
    })
  }

  const soldAndTotal = useMemo(() => {
    const sold = toFixed(toTokenAmount(data?.TotalAmount, '', data?.Decimals), 0)
    const total = toTokenAmount(data?.Amount, '', data?.Decimals)
    return `${sold} / ${total}`
  }, [data])

  const gasMapping = {
    metamask: l1Gas,
    phantom: solGas,
    okx: okxL1Gas,
  }

  const selectedGas = gasMapping[isWalletSelected as keyof typeof gasMapping] || '-'

  const loadingMapping = {
    metamask: loadingGas,
    phantom: solLoadingGas,
    okx: okxLoadingGas,
  }

  const selectedLoading = loadingMapping[isWalletSelected as keyof typeof loadingMapping]

  return (
    <main className="mx-auto my-[30px] container main">
      <Back />
      <div className="mt-[18px] ml-[5px] flex items-start gap-20">
        <div className="w-[600px] inline-block mt-[35px] ml-20 rounded-2xl border-2 border-solid border-gray-9 bg-gray-9">
          <div className="h-[542px]">
            {data?.Image ? (
              <img src={data?.Image} alt="detail" className="rounded-2xl w-full h-full object-cover" />
            ) : (
              ''
            )}
          </div>
          <h4 className="px-4 text-base font-semibold my-5">About Me</h4>
          <p className="px-4 text-base mb-5 break-all line-clamp-3">{data?.Description || '--'}</p>
          {data?.OutUrl ? (
            <div className="px-4 overflow-auto">
              <iframe
                className="w-full h-[900px] border-none"
                src={data?.OutUrl}
                allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"></iframe>
            </div>
          ) : (
            ''
          )}
        </div>
        <div className="w-[430px]">
          <div className="flex flex-col gap-[25px] text-[#888] leading-[18px] text-base mb-12">
            <div>
              <h1 className="flex items-center text-[28px] leading-[42px] line-clamp-1">
                <span className="text-white inline-block font-semibold max-w-[200px] line-clamp">
                  {data?.Title || '--'}
                </span>
                @{data?.TokenAddress || '--'}
                <Like className="ml-[1.875rem]" tokenaddress={data?.TokenAddress} status={Number(liked)} />
              </h1>
              {data?.Slogan ? (
                <p className="mt-1 pt-px flex items-center text-sm font-semibold break-all line-clamp-2">
                  {/* <Image src="/img/female.svg" alt="like" width={20} height={20} /> */}
                  {data?.Slogan}
                </p>
              ) : null}
            </div>
            <div className="flex items-center">
              <span>Total Supply</span>
              <span className="ml-4 flex-1 text-white text-right line-clamp-1">
                {data ? toTokenAmount(data?.TotalSupply, '', data?.Decimals) : 0}
              </span>
            </div>
            <div className="flex items-center">
              <span>{isVote ? 'Power Level / Capacity' : 'Token Sold / Allocation'}</span>
              <span className="ml-4 flex-1 text-white text-right line-clamp-1">{data ? soldAndTotal : 0}</span>
            </div>
            <div className="flex items-center">
              <span>Ends in</span>
              <span className="px-2 flex-1 text-sm leading-[26px] font-medium rounded-sm bg-[rgba(227, 225, 227, 0.08)] inline-flex justify-end items-center">
                <Image className="mr-1" src="/img/remain.svg" alt="remain" width={16} height={16} />
                <span className="linear-font">
                  {statusInfo.status === Status.ComingSoon ? statusInfo.formatEnd : statusInfo.timeStr}
                </span>
              </span>
            </div>
            {children}
            {isSwap || isFinished ? null : (
              <Input
                onResult={handleCostChange}
                walletName={isWalletSelected as string}
                wallet={Wallet[isWalletSelected as keyof typeof Wallet]}
                type={data.type}
                balance={isVote ? votedAmount : toLimitFixed(launchAmount, 2)}
                token={data?.L1Token}
                l2TokenSymbol={data?.TokenAddress.split(':')[0]}
              />
            )}
            {isLaunch ? (
              <div className="flex items-center">
                <span>Estimated To Be Received：</span>
                <span className="ml-4 flex-1 text-white text-right line-clamp">
                  {toTokenAmount(exchangeNumber || '0', '', data?.Decimals)} {data?.TokenAddress.split(':')[0]}
                </span>
              </div>
            ) : (
              ''
            )}

            <Button
              type="primary"
              className="vote"
              disabled={btnDisabled}
              loading={selectedLoading}
              onClick={handleBtnClick}>
              {btnWordings}
            </Button>
            {isSwap ? (
              ''
            ) : (
              <div className="flex items-center">
                <span>Estimated Fee</span>
                <span className="ml-4 flex-1 text-white text-right line-clamp-1">
                  {selectedGas}
                  {data.L1Token}
                </span>
              </div>
            )}
            {/* <div className="flex items-center">
              <span>Time Etimates</span>
              <span className="ml-4 flex-1 text-white text-right line-clamp-1">0 ETH</span>
            </div> */}
            <DetailTabs data={data} holdable={!isVote} />
          </div>
        </div>
      </div>
    </main>
  )
}

export default Detail
