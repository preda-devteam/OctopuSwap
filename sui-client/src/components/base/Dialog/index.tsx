import { createRoot } from 'react-dom/client'
import clss from 'classnames'
import { useState } from 'react'
import './index.scss'

interface DialogProps {
  children: JSX.Element
  clickMaskClose?: boolean
  onClose?: () => void
}
export const Dialog = ({ children, clickMaskClose, onClose }: DialogProps) => {
  const [hide, setHide] = useState(false)
  const handleClickMask = () => {
    if (clickMaskClose) {
      setHide(true)
      onClose && onClose()
    }
  }
  return (
    <div className={clss({ hide }, 'dialog')}>
      <div className="dialog-mask" onClick={handleClickMask}></div>
      <div className="dialog-content">{children}</div>
    </div>
  )
}

function dialog({
  content,
  rootWarp,
  clickMaskClose = true,
}: {
  content: JSX.Element
  rootWarp?: string
  clickMaskClose?: boolean
}) {
  const container = document.createElement(rootWarp || 'div')
  const root = createRoot(container)
  const removeDialog = () => {
    const dialog = document.querySelector('.dialog')
    dialog && dialog?.parentElement?.remove()
  }
  root.render(
    <Dialog onClose={removeDialog} clickMaskClose={clickMaskClose}>
      {content}
    </Dialog>,
  )
  document.body.appendChild(container)
  return {
    removeDialog,
  }
}

export default dialog
