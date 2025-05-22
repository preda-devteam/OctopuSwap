'use client'
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import clazz from 'classnames'
import NestToast, { NestToastProps } from '../NestToast'
import styled from 'styled-components'

const StyledLayout = styled.div`
  position: fixed;
  z-index: 900;
  left: 50%;
  top: 10vh;
  transform: translate(-50%, -50%);
  .inner {
    min-width: 100px;
    max-width: 500px;
    z-index: 999;
    display: flex;
    justify-content: center;
  }
  &.nest {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    z-index: 800;
  }
`

export interface ToastProps extends Pick<NestToastProps, 'type' | 'alpha'> {
  content: string
  left?: number
  duration?: number
  nest?: boolean
  wrapper?: HTMLElement
  outclick?: () => void
  onTimeEnd?: () => void
}

interface State {
  content: string
}

export class Toast extends React.PureComponent<ToastProps, State> {
  state = {
    content: this.props.content,
  }

  timer: null | NodeJS.Timeout = null

  changeContent = (content: string) => {
    this.setState({ content })
  }

  handler = (e: any) => {
    // const target = e.target as HTMLDivElement
    // if (!target.closest('.ui-tiny-toast')) {
    this.props?.outclick?.()
    // }
  }

  tick() {
    const { duration } = this.props
    if (typeof duration !== 'undefined' && duration !== -1) {
      this.timer = setTimeout(() => {
        this.props?.onTimeEnd?.()
      }, duration * 1000)
    }
  }

  componentWillUnmount() {
    this.timer && clearTimeout(this.timer)
    document.body.removeEventListener('click', this.handler)
  }

  componentDidMount() {
    this.tick()
    document.body.addEventListener('click', this.handler, false)
  }

  render() {
    const { content } = this.state
    const { left, nest = false, type, alpha } = this.props
    const styles = left ? { left } : undefined
    return (
      <StyledLayout data-role="toast" style={styles} className={clazz([{ nest: !!nest }])}>
        <NestToast type={type} className="inner" text={content} alpha={alpha}></NestToast>
      </StyledLayout>
    )
  }
}

let theToast: Toast | null = null,
  container: HTMLElement | null,
  theToastTimer: NodeJS.Timeout
const maker = (duration: number) => {
  document.body.removeEventListener('click', handler, false)
  return setTimeout(() => {
    destroy()
  }, duration * 1000)
}

const destroy = () => {
  if (container) {
    container.parentElement?.removeChild(container)
  }
  theToast = null
  container = null
}

const handler = (e: any) => {
  const target = e.target as HTMLDivElement
  // if (!target.closest('.ui-tiny-toast')) {
  destroy()
  // }
}

export default function toasty(props: ToastProps) {
  const { duration = 3, wrapper = document.querySelector('#page-sub-layout') || document.body, ...rest } = props
  if (theToast) {
    theToast.changeContent(rest.content)
    theToastTimer && clearTimeout(theToastTimer)
    if (duration !== -1) {
      theToastTimer = maker(duration)
    }
    return theToast
  }
  container = document.createElement('div')
  wrapper.appendChild(container)
  ReactDOM.render(<Toast {...rest} />, container, function (this: Toast) {
    theToast = this
  })
  document.body.addEventListener('click', handler, false)

  if (duration !== -1) {
    theToastTimer = maker(duration)
  }

  return theToast
  // return ReactDOM.createPortal(<Toast {...rest} />, document.body)
}

toasty.error = (content: string) => {
  toasty({ content, type: 'error' })
}
