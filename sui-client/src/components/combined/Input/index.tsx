'use client'
import clss from 'classnames'
import { useEffect, useMemo, useState } from 'react'
import './index.scss'
import BigNumber from 'bignumber.js'
import MetaMask from '@/utils/metamask'
import { utils } from 'ethers'
import { token2Decimals } from '@/utils/string'
import Phantom from '@/utils/phantom'
import Okx from '@/utils/okx'
type InputProps = {
  className?: string
  onResult?: (result: { result: boolean; amount: string }) => void
  balance?: string
  wallet: MetaMask | Phantom | Okx | null
  token?: string
  l2TokenSymbol?: string
  type?: 'vote' | 'launch'
  walletName?: string
}

export enum VoteType {
  ETH = 'ETH',
  SOLANA = 'SOL',
}

const Input = ({ className, onResult, type, balance, wallet, token, l2TokenSymbol, walletName }: InputProps) => {
  const [voteVal, setVoteVal] = useState<string>()
  const [error, setError] = useState('')
  const [tokenBalance, setTokenBalance] = useState<string>('0')

  useEffect(() => {
    if (wallet && walletName === 'metamask') {
      getL1Balance()
    }
    if (wallet && walletName === 'phantom') {
      getPhantomBalance()
    }
    if (wallet && walletName === 'okx') {
      getOkxBalance()
    }
  }, [wallet?.selectAddress, token, walletName])

  // metamask
  const getL1Balance = async () => {
    setTokenBalance('0')
    try {
      const l1Address = wallet?.selectAddress
      if (!l1Address || !token) {
        return
      }
      const [balance, decimal] = await wallet.getBalance(l1Address, token as 'ETH' | 'SOL')
      const int = parseInt(utils.formatUnits(balance, decimal - 4))
      console.log('getL1Balance', utils.formatUnits(int, 4))
      setTokenBalance(utils.formatUnits(int, 4))
    } catch (e) {
      console.log(e)
    }
  }

  // phantom
  const getPhantomBalance = async () => {
    setTokenBalance('0')
    try {
      const solAddress = wallet?.selectAddress
      console.log('getSolBalance', solAddress, token)
      if (!solAddress) {
        return
      }
      const [balance, decimal] = await (wallet as Phantom)?.getBalance(solAddress, token as 'ETH' | 'SOL')
      if (token === VoteType.ETH) {
        const int = parseInt(utils.formatUnits(balance, decimal - 4))
        setTokenBalance(utils.formatUnits(int, 4))
      } else {
        setTokenBalance(balance)
      }
    } catch (e) {
      console.log(e)
    }
  }

  // okx
  const getOkxBalance = async () => {
    setTokenBalance('0')
    try {
      const okxL1Address = wallet?.selectAddress
      if (!okxL1Address) {
        return
      }
      const [balance, decimal] = await (wallet as Okx)?.getBalance(okxL1Address, token as 'ETH' | 'SOL')
      if (token === VoteType.ETH) {
        const int = parseInt(utils.formatUnits(balance, decimal - 4))
        setTokenBalance(utils.formatUnits(int, 4))
      } else {
        setTokenBalance(balance)
      }
    } catch (e) {
      console.log(e)
    }
  }

  const handleChangeVote = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputNumber = e.target.value.replace(/[^0-9.]/gi, '')
    setVoteVal(inputNumber)
  }
  const handleBlurVote = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (token === VoteType.ETH) {
      getL1Balance()
    } else {
      getPhantomBalance()
    }
    const inputNumber = e.target.value.replace(/[^0-9.]/gi, '')
    const result = checkVoteVal(inputNumber)
    onResult && onResult({ result, amount: inputNumber })
  }

  const checkVoteVal = (val: string) => {
    if (val.split('.')[1]?.length > token2Decimals(token)) {
      setError('Insufficient Decimals')
      return false
    }
    if (new BigNumber(tokenBalance).lt(new BigNumber(val))) {
      setError('Insufficient Balance')
      return false
    }

    if (new BigNumber(val).lt(0.00000001)) {
      setError('Not less than 0.00000001')
      return false
    } else {
      setError('')
      return true
    }
  }

  const isVote = useMemo(() => {
    return type === 'vote'
  }, [type])

  return (
    <div
      className={clss(
        {
          error,
        },
        className,
        'input-box',
      )}>
      <div className="input">
        <input
          type="text"
          value={voteVal}
          placeholder="Enter Amount"
          onChange={e => handleChangeVote(e)}
          onBlur={e => handleBlurVote(e)}
        />
        {token}
      </div>
      <div className="balance">
        <span>
          {isVote ? 'My Power' : 'Token Balance'}
          <span className="value line-clamp">
            {balance} {isVote ? token : l2TokenSymbol || ''}
          </span>
        </span>
        <span>
          Balance
          <span className="value line-clamp">
            {tokenBalance} {token}
          </span>
        </span>
      </div>
      <p className="error">{error}</p>
    </div>
  )
}

export default Input
