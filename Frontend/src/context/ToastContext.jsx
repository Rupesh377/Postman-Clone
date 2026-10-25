import { createContext, useContext, useState, useCallback } from 'react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const add = useCallback((message, type = 'error') => {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }, [])

  const error = useCallback((msg) => add(msg, 'error'), [add])
  const success = useCallback((msg) => add(msg, 'success'), [add])

  return (
    <ToastContext.Provider value={{ error, success, toasts, remove }}>
      {children}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  return { error: ctx.error, success: ctx.success }
}

export function Toast() {
  const ctx = useContext(ToastContext)
  if (!ctx || !ctx.toasts.length) return null
  return (
    <div className="toast-container">
      {ctx.toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`} onClick={() => ctx.remove(t.id)}>
          {t.message}
        </div>
      ))}
    </div>
  )
}

export { Toast as ToastDisplay }
