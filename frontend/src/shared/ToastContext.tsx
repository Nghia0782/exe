import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'

type ToastType = 'success' | 'error' | 'info'
type ToastItem = { id: number; type: ToastType; message: string }

type ToastContextType = {
  notify: (message: string, type?: ToastType, timeoutMs?: number) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const idRef = useRef(1)

  const remove = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const notify = useCallback((message: string, type: ToastType = 'info', timeoutMs = 2500) => {
    const id = idRef.current++
    setToasts(prev => [...prev, { id, type, message }])
    window.setTimeout(() => remove(id), timeoutMs)
  }, [remove])

  const value = useMemo(() => ({ notify }), [notify])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed top-4 right-4 z-[9999] space-y-3">
        {toasts.map(t => (
          <div
            key={t.id}
            className={
              `min-w-[260px] max-w-[360px] px-4 py-3 rounded-2xl shadow-xl border backdrop-blur-sm text-sm ` +
              (t.type === 'success'
                ? 'bg-green-50/90 border-green-200 text-green-800'
                : t.type === 'error'
                ? 'bg-red-50/90 border-red-200 text-red-800'
                : 'bg-blue-50/90 border-blue-200 text-blue-800')
            }
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}


