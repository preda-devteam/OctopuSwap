'use client'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import './index.scss'

export default function Back() {
  const router = useRouter()
  const handleBack = () => {
    router.back()
  }
  return (
    <nav className="back" onClick={handleBack}>
      <Image src="/img/left.svg" alt="back" width={14} height={17} />
      Back
    </nav>
  )
}
