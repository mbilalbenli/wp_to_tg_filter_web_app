import { createContext, useCallback, useContext, useRef, useState } from 'react'

export function Spinner({ small = false, label = '' }) {
  return <span className={`spinner${small ? ' small' : ''}`} role="status" aria-label={label || 'Yükleniyor'} />
}

export function LoadingBlock({ label = 'Yükleniyor...' }) {
  return <div className="loading-block"><Spinner /> <span>{label}</span></div>
}

export function ErrorBox({ message, onRetry }) {
  if (!message) return null
  return (
    <div className="error-box" role="alert">
      <div>
        <strong>Bir hata oluştu.</strong>
        <div>{message}</div>
      </div>
      {onRetry && <button type="button" className="btn secondary" onClick={onRetry}>Tekrar Dene</button>}
    </div>
  )
}

export function EmptyState({ title, hint }) {
  return <div className="empty-state"><strong>{title}</strong>{hint && <div className="muted">{hint}</div>}</div>
}

const ToastCtx = createContext(null)
export const useToast = () => useContext(ToastCtx)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const idRef = useRef(0)
  const push = useCallback((message, type = 'success') => {
    const id = ++idRef.current
    setToasts((t) => [...t, { id, message, type }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200)
  }, [])
  const toast = {
    success: (m) => push(m, 'success'),
    error: (m) => push(m, 'error'),
    info: (m) => push(m, 'info'),
  }
  return (
    <ToastCtx.Provider value={toast}>
      {children}
      <div className="snackbar-stack" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`snackbar ${t.type}`}>
            <span>{t.message}</span>
            <button type="button" aria-label="Kapat" onClick={() => setToasts((x) => x.filter((y) => y.id !== t.id))}>×</button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}
