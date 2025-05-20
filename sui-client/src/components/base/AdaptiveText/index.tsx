import React, { useEffect, useRef, useState } from 'react'

interface AdaptiveTextProps {
  className?: string
  text: string
  defaultSize?: number // default is 16
}

const AdaptiveText = ({ className, text, defaultSize = 16 }: AdaptiveTextProps) => {
  const textRef = useRef<HTMLParagraphElement>(null)
  const [size, setSize] = useState(defaultSize)
  const [isMax, setIsMax] = useState(false)

  useEffect(() => {
    if (textRef.current) {
      const fontCheck = () => {
        const target = textRef.current as HTMLParagraphElement
        if (!target) {
          return
        }
        const targetChild = target.firstChild as HTMLParagraphElement
        const mingap = Math.floor(targetChild.getClientRects()[0].width) - Math.floor(target.offsetWidth)
        const maxgap = Math.floor(targetChild.offsetWidth) - Math.floor(target.offsetWidth)
        if (mingap + mingap < 0) {
          return
        }
        if (mingap > 0) {
          setIsMax(false)
          if (size <= 12) {
            setIsMax(true)
            setSize(12)
            return
          }
          setSize(size - (parseInt(String(mingap / size)) || 1))
        } else if (maxgap < 0 && size < defaultSize) {
          if (size <= 12) {
            setIsMax(true)
            setSize(12)
            return
          }
          setSize(size + defaultSize / size)
        }
      }
      if (window.requestIdleCallback) {
        window.requestIdleCallback(fontCheck)
      } else {
        window.requestAnimationFrame(fontCheck)
      }
    }
  }, [textRef.current, size, text, defaultSize])
  return (
    <p
      className={className}
      style={{
        fontSize: size + 'px',
        overflow: 'hidden',
        lineHeight: '1',
      }}
      ref={textRef}>
      <span
        style={{
          fontSize: 'inherit',
          whiteSpace: 'nowrap',
          display: 'inline-block',
          textOverflow: 'ellipsis',
          overflow: 'hidden',
          maxWidth: isMax ? '101%' : 'unset',
        }}>
        {text}
      </span>
    </p>
  )
}

export default AdaptiveText
