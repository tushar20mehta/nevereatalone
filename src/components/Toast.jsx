import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, Info, X } from 'lucide-react'

const icons = {
  success: CheckCircle,
  error: XCircle,
  info: Info
}

export default function Toast({ message, type = 'success', onClose }) {
  const [exiting, setExiting] = useState(false)
  const Icon = icons[type] || icons.info

  useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true)
      setTimeout(onClose, 300)
    }, 3000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div className={`toast toast-${type} ${exiting ? 'toast-exit' : 'toast-enter'}`}>
      <Icon size={18} />
      <span>{message}</span>
      <button className="toast-close" onClick={() => { setExiting(true); setTimeout(onClose, 300) }}>
        <X size={14} />
      </button>
    </div>
  )
}
