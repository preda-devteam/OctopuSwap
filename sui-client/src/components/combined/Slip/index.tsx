import Tooltip from '@/components/base/Tooltip'
import classNames from 'classnames'
import { useEffect, useMemo, useState } from 'react'

interface SlipProps {
  className?: string
  defaultPercen?: string
  defaultDeadline?: string
  onChange: (percen: string, deadline: string) => void
}

const Slip = ({ onChange, className, defaultPercen = '10', defaultDeadline = '30' }: SlipProps) => {
  const [percen, setPercen] = useState(defaultPercen)
  const [deadline, setDeadline] = useState(defaultDeadline)

  const [percenError, setPercenError] = useState('')
  const [deadlineError, setDeadlineError] = useState('')

  useEffect(() => {
    onChange && onChange(defaultPercen, defaultDeadline)
  }, [defaultPercen, defaultDeadline])

  const handleChangePercen = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputNumber = e.target.value.replace(/[^0-9\.]/gi, '')
    setPercen(inputNumber)
    if (!inputNumber) {
      setPercenError('Max.slippage is required')
      return
    }
    const [, float] = inputNumber?.split('.')
    if (float && float.length > 1) {
      setPercenError('Max.slippage must be 1 decimal places')
      return
    }
    if (+inputNumber < 10) {
      setPercenError('Max.slippage must be greater than 10%')
      return
    }
    if (+inputNumber > 99.9) {
      setPercenError('Max.slippage must be less than 99.9%')
      return
    }
    setPercenError('')
    onChange && onChange(inputNumber, deadline)
  }
  const handleChangeDeadline = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputNumber = e.target.value.replace(/[^0-9]/gi, '')
    setDeadline(inputNumber)
    if (+inputNumber > 480) {
      setDeadlineError('Deadline must be less than 480')
      return
    }
    if (+inputNumber < 1) {
      setDeadlineError('Deadline must be greater than 1')
      return
    }
    setDeadlineError('')
    onChange && onChange(percen, inputNumber)
  }

  const renderOverlay = useMemo(() => {
    return (
      <div className="w-[210px] px-[12px] py-[13px]">
        <label className="text-[#888] text-[14px]" htmlFor="percen">
          Max.slippage
        </label>
        <div className="mb-[25px] mt-[8px] relative ">
          <input
            className={classNames(
              percenError ? 'border-[#EA1587]' : 'border-[#888]',
              'w-full py-[16px] pr-[36px] pl-[16px] outline-0 bg-transparent rounded-[10px]  border-[1px] text-[#fff]',
            )}
            id="percen"
            value={percen}
            type="text"
            autoComplete="off"
            onChange={handleChangePercen}
          />
          <span className="absolute right-[16px] top-[50%] translate-y-[-50%]">%</span>
          <p className="absolute top-[105%] leading-[10px] left-0 text-[#EA1587] text-[10px]">{percenError}</p>
        </div>
        <label className="text-[#888]  text-[14px]" htmlFor="deadline">
          Transaction Deadline
        </label>
        <div className="relative mt-[8px]">
          <input
            className={classNames(
              deadlineError ? 'border-[#EA1587]' : 'border-[#888]',
              'w-full font-[600] py-[16px] pr-[56px] pl-[16px] outline-0 bg-transparent rounded-[10px] border-[#888] border-[1px] text-[#fff]',
            )}
            id="deadline"
            value={deadline}
            type="text"
            autoComplete="off"
            onChange={handleChangeDeadline}
          />
          <span className="absolute right-[16px] top-[50%] translate-y-[-50%]">m</span>
          <p className="absolute top-[105%] leading-[10px] left-0 text-[#EA1587] text-[10px]">{deadlineError}</p>
        </div>
      </div>
    )
  }, [percen, deadline, percenError, deadlineError])
  return (
    <Tooltip
      hideArrow
      className={classNames('cursor-pointer', className)}
      placement="bottomRight"
      trigger="click"
      overlay={renderOverlay}>
      <img src="/img/slip.svg" alt="slip" />
    </Tooltip>
  )
}

export default Slip
