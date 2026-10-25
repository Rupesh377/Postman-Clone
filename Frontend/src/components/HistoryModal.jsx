import { useState, useEffect, useCallback } from 'react'
import Modal from './Modal'
import { useToast } from '../context/ToastContext'
import { getHistoryApi, deleteHistoryItemApi, clearHistoryApi } from '../api/historyApi'

const METHOD_COLORS = {
  GET: '#34c75a', POST: 'var(--orange)', PUT: '#d4a00a',
  PATCH: '#9b72f5', DELETE: 'var(--error)', HEAD: '#13c4b2',
}

function fmtDate(ts) {
  if (!ts) return ''
  return new Date(ts).toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export default function HistoryModal({ onClose }) {
  const toast = useToast()
  const [rows, setRows]       = useState([])
  const [page, setPage]       = useState(0)
  const [totalPages, setTotal]= useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  const [copiedId, setCopiedId] = useState(null)

  const load = useCallback(async (p) => {
    setLoading(true)
    setError(null)
    try {
      const res = await getHistoryApi(p)
      const data = res.data
      const items = Array.isArray(data) ? data : (Array.isArray(data?.content) ? data.content : [])
      setRows((prev) => p === 0 ? items : [...prev, ...items])
      setTotal(data?.totalPages || 1)
      setPage(data?.number || 0)
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load history')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load(0) }, [load])

  const handleDelete = async (id) => {
    try {
      await deleteHistoryItemApi(id)
      setRows((prev) => prev.filter((r) => r.id !== id))
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to delete')
    }
  }

  const handleClear = async () => {
    if (!window.confirm('Delete all history? This cannot be undone.')) return
    try {
      await clearHistoryApi()
      setRows([])
      setTotal(1)
      setPage(0)
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to clear history')
    }
  }

  const statusClass = (code) => {
    if (!code || code === 0) return 'status-err'
    if (code < 300) return 'status-ok'
    if (code < 400) return 'status-redir'
    return 'status-err'
  }

  return (
    <Modal
      title="Request History"
      onClose={onClose}
      wide
      footer={
        rows.length > 0 && (
          <button className="btn-sm btn-sm-danger" onClick={handleClear}>
            Clear all
          </button>
        )
      }
    >
      {error && <div className="alert alert-error">{error}</div>}

      {rows.length === 0 && !loading && !error && (
        <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '24px 0' }}>
          No history yet.
        </div>
      )}

      {rows.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: '60vh', overflowY: 'auto' }}>
          {rows.map((r) => (
            <div key={r.id} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '7px 10px', borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-panel)', border: '1px solid var(--border)',
              fontSize: 12,
            }}>
              <span style={{
                fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 10,
                color: METHOD_COLORS[r.method] || 'var(--text-muted)',
                minWidth: 48,
              }}>
                {r.method}
              </span>

              <span style={{
                flex: 1, overflow: 'hidden', textOverflow: 'ellipsis',
                whiteSpace: 'nowrap', fontFamily: 'var(--mono)', fontSize: 11,
                color: 'var(--text-secondary)',
              }} title={r.url}>
                {r.requestName ? <strong style={{ color: 'var(--text-primary)', marginRight: 6 }}>{r.requestName}</strong> : null}
                {r.url}
              </span>

              <span className={`response-stat ${statusClass(r.statusCode)}`} style={{ fontSize: 11 }}>
                {r.statusCode || '—'}
              </span>

              <span style={{ color: 'var(--text-subtle)', fontSize: 11, minWidth: 52 }}>
                {r.responseTime != null ? `${r.responseTime}ms` : ''}
              </span>

              <span style={{ color: 'var(--text-subtle)', fontSize: 11, minWidth: 110, textAlign: 'right' }}>
                {fmtDate(r.executedAt)}
              </span>

              <button
                className="btn-icon"
                style={{ color: copiedId === r.id ? 'var(--orange)' : 'var(--text-subtle)', flexShrink: 0 }}
                title="Copy URL"
                aria-label="Copy URL"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(r.url)
                    setCopiedId(r.id)
                    setTimeout(() => setCopiedId(null), 1500)
                  } catch {}
                }}
              >
                {copiedId === r.id ? (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                  </svg>
                )}
              </button>

              <button
                className="btn-icon"
                style={{ color: 'var(--text-subtle)', flexShrink: 0 }}
                title="Delete"
                aria-label="Delete history entry"
                onClick={() => handleDelete(r.id)}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14H6L5 6"/>
                  <path d="M10 11v6M14 11v6"/>
                  <path d="M9 6V4h6v2"/>
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 16 }}>
          <div className="spinner-lg" style={{ width: 20, height: 20, borderWidth: 2 }} />
        </div>
      )}

      {!loading && page < totalPages - 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 8 }}>
          <button className="btn-sm btn-sm-ghost" onClick={() => load(page + 1)}>
            Load more
          </button>
        </div>
      )}
    </Modal>
  )
}
