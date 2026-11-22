import { useEffect, useRef } from 'react'

/**
 * Reusable confirmation dialog.
 *
 * Props:
 *   open         – boolean, controls visibility
 *   title        – string, dialog heading
 *   message      – string | ReactNode, body text
 *   confirmLabel – string (default "Delete")
 *   cancelLabel  – string (default "Cancel")
 *   destructive  – boolean, makes confirm button red (default false)
 *   onConfirm    – () => void
 *   onCancel     – () => void
 */
export default function ConfirmDialog({
  open,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
}) {
  const cancelRef = useRef(null)

  // Escape key → cancel
  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape') onCancel?.() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onCancel])

  // Auto-focus cancel on open
  useEffect(() => {
    if (open) setTimeout(() => cancelRef.current?.focus(), 50)
  }, [open])

  if (!open) return null

  return (
    <div
      className="modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel?.() }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div className="modal confirm-dialog" style={{ maxWidth: 380 }}>
        <div className="confirm-dialog-icon-row">
          {destructive ? (
            <div className="confirm-dialog-icon confirm-dialog-icon--danger">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                <path d="M10 11v6M14 11v6M9 6V4h6v2" />
              </svg>
            </div>
          ) : (
            <div className="confirm-dialog-icon confirm-dialog-icon--warn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
          )}
        </div>

        <div>
          <div className="confirm-dialog-title" id="confirm-dialog-title">{title}</div>
          {message && <p className="confirm-dialog-message">{message}</p>}
        </div>

        <div className="confirm-dialog-actions">
          <button
            ref={cancelRef}
            className="btn-sm btn-sm-ghost"
            style={{ flex: 1 }}
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            className={`btn-sm ${destructive ? 'btn-sm-danger-solid' : 'btn-sm-primary'}`}
            style={{ flex: 1 }}
            onClick={onConfirm}
            autoFocus
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
