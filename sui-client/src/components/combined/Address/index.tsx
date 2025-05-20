'use client'
import { seesaw } from '@/utils/string'
import Image from 'next/image'
import './index.scss'
import toasty from '@/components/base/Toast'
import CopyToClipboard from 'react-copy-to-clipboard'

const Address = ({ addr, copy }: { addr: string; copy?: boolean }) => {
  const handleCopy = () => {
    toasty({ content: 'Copied!' })
  }
  return (
    <div className="addr-box">
      {seesaw({ raw: addr, isAddress: true })}
      {copy ? (
        <CopyToClipboard text={addr} onCopy={handleCopy}>
          <Image src="/img/copy.svg" width={25} height={24} alt="copy" />
        </CopyToClipboard>
      ) : (
        ''
      )}
    </div>
  )
}

export default Address
