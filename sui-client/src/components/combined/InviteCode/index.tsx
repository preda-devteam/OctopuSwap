'use client'
import Button from '@/components/base/Button'
import toasty from '@/components/base/Toast'
import Image from 'next/image'
import CopyToClipboard from 'react-copy-to-clipboard'
import './index.scss'
import { linkTweet } from '@/utils/url'
const InviteCode = ({ code }: { code?: string }) => {
  const handleCopy = () => {
    toasty({ content: 'Copied!' })
  }
  const handlerTweet = () => {
    if (code) {
      const linkText =
        'Excited to be at XREI @xrei_ai, the AI-powered parallel universe of the hottest influencers & celebrities!' +
        `\n\nJoin me with my invite code (${code}).` +
        '\n\nFollow @xrei_ai to stay updated with trendy #memecoins #launchpad #AI topics!'
      linkTweet(linkText)
    }
  }
  return (
    <div className="invite-code">
      {code}
      <Image
        className="cursor-pointer"
        src="/img/share.svg"
        alt="share"
        width={25}
        height={25}
        onClick={handlerTweet}
      />
      <CopyToClipboard text={code || ''} onCopy={handleCopy}>
        <Button className="copy-btn">Copy</Button>
      </CopyToClipboard>
    </div>
  )
}

export default InviteCode
