import clss from 'classnames'
export interface Props extends StyleComponent {
  type: string
  className?: string
  onClick?: (e?: any) => void
  size?: number
}

const Icon = (props: Props) => {
  const { type, className, size, onClick, style = {} } = props
  const s = size ? { width: size, height: size } : {}
  const styles = Object.assign(style, s)
  return (
    <svg
      style={styles}
      className={clss(
        className,
        `diox-font-${type}`,
        'diox-font',
        'iconfont',
        'inline-flex',
        'items-center leading-none',
        {
          'cursor-pointer': !!onClick,
        },
      )}
      aria-hidden="true"
      onClick={e => onClick && onClick(e)}>
      <use xlinkHref={`#diox-font-${type}`}></use>
    </svg>
  )
}

export default Icon
