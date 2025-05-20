'use client'
import * as React from 'react'
import clazz from 'classnames'
import './index.scss'

export interface ButtonProps {
  disabled?: boolean
  icon?: string
  classnames?: string
  className?: string
  onClick?: React.MouseEventHandler<HTMLElement>
  type?: 'primary' | 'danger' | 'outline' | 'dangerLine'
  size?: 'small' | 'large' | 'tiny'
  long?: boolean
  loading?: boolean
  rawType?: 'submit' | 'button' | 'reset'
  style?: React.CSSProperties
  children?: React.ReactNode
  // iconProps?: Omit<IconFontProps, 'type'>
}
const Button = (props: ButtonProps) => {
  const {
    disabled,
    classnames,
    className,
    type = 'primary',
    size = 'tiny',
    long,
    loading,
    icon,
    style,
    // iconProps,
    rawType = 'button',
  } = props
  const clasname = [
    {
      [type]: !!type,
      long,
      [size]: !!size,
      loading: loading != null && loading,
    },
    classnames,
    className,
  ]

  const handleClick = (e: any) => {
    if (props.loading) {
      return
    }
    props.onClick && props.onClick(e)
  }

  return (
    <button
      type={rawType}
      style={style}
      className={clazz([clasname], 'button')}
      disabled={disabled}
      onClick={handleClick}>
      {loading ? <img className="loading" src="/img/loading.svg" alt="loading" /> : <span>{props.children}</span>}
    </button>
  )
}

export default Button
