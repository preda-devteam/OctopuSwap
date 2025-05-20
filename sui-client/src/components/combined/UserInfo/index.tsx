'use client'
import Address from '@/components/combined/Address'
import { DEFAULT_ADDRESS_ICON } from '@/constants'
import { useDioxAddressContext } from '@/hooks/useDioxAddress'
import InviteCode from '../InviteCode'
import { useRequest } from 'ahooks'
import UserAPI from '@/dataApi/User'

export function UserInfo() {
  const { address } = useDioxAddressContext()
  const { data: inviteCode } = useRequest(
    async () => {
      if (!address?.address) return ''
      const res = await UserAPI.getUserInfo(address?.address)
      return res?.data?.InviteCode
    },
    {
      refreshDeps: [address?.address],
    },
  )

  if (!address) return ''

  return (
    <>
      <div className="user-img">
        <img src={address?.avatar || DEFAULT_ADDRESS_ICON} alt="detail" />
      </div>
      <p className="user-name">{address?.alias || '--'}</p>
      <Address addr={address?.address} copy />
      <div className="invit-box">
        <h3>
          My Invite Code
          <img src="/img/tip.svg" alt="tip" width={24} height={24} />
        </h3>
        <InviteCode code={inviteCode} />
      </div>
    </>
  )
}
