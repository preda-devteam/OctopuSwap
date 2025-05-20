'use client'
import Button from '@/components/base/Button'
import { useState } from 'react'
import UserAPI from '@/dataApi/User'
import toasty from '@/components/base/Toast'

type SignupConfirmProps = {
  address: string
  loading?: boolean
  onClose: () => void
}
const SignupConfirm = (props: SignupConfirmProps) => {
  const { address, onClose } = props
  const [loading, setLoading] = useState(false)
  const [inviteCode, setInviteCode] = useState('')

  const signUp = async (inviteCode?: string) => {
    setLoading(true)
    try {
      if (inviteCode && inviteCode.length !== 32) {
        toasty({
          content: 'Invalid Invite Code!',
          type: 'error',
        })
        return
      }
      const res = await UserAPI.signupUser(address, inviteCode)
      if (!res.code) {
        inviteCode &&
          toasty({
            content: 'Invite Success!',
          })
      }
      onClose && onClose()
    } catch (err) {
      console.log(err)
    }
    setLoading(false)
  }

  const onSkip = () => {
    signUp()
  }

  const onConfirm = () => {
    signUp(inviteCode)
  }

  return (
    <div className="w-[483px] h-[302px] px-[56px] py-[40px]">
      <div className="text-[28px] font-[600] ">Invite Code</div>
      <div className="input-ligth my-[30px] h-[80px] rounded-[10px] overflow-hidden bg-[#2D2E36] px-[23px]">
        <input
          value={inviteCode}
          onChange={e => setInviteCode(e.target.value)}
          className="h-[100%] w-[100%] text-[18px] bg-transparent outline-0"
          placeholder="Enter Invite Code"></input>
      </div>
      <div className="flex gap-[30px]">
        <Button className="flex-1" type="outline" loading={loading} disabled={loading} onClick={onSkip}>
          Skip
        </Button>
        <Button className="flex-1" loading={loading} disabled={loading} onClick={onConfirm}>
          Confirm
        </Button>
      </div>
    </div>
  )
}

export default SignupConfirm
