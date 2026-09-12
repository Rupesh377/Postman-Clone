import { useState, useEffect, useCallback } from 'react'
import { useWorkspace } from '../context/WorkspaceContext'
import { useEnvironment } from '../context/EnvironmentContext'
import { createRequestApi, updateRequestApi } from '../api/requestApi'
import { executeRequestApi, getExecutionHistoryApi } from '../api/environmentApi'
import EnvironmentSelector from './EnvironmentSelector'
import '../styles/app.css'
import '../styles/environment.css'

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']

const parseKV = (raw) => {
  if (!raw) return [{ key: '', value: '', enabled: true }]
  const lines = raw.split('\n').filter(Boolean)
  const pairs = lines.map((line) => {
    const idx = line.indexOf(':')
    if (idx === -1) return { key: line.trim(), value: '', enabled: true }
    return {
      key: line.slice(0, idx).trim(),
      value: line.slice(idx + 1).trim(),
      enabled: true,
    }
  })
  return pairs.length ? [...pairs, { key: '', value: '', enabled: true }] : [{ key: '', value: '', enabled: true }]
}

const serializeKV = (pairs) =>
  pairs
    .filter((p) => p.enabled && p.key.trim())
    .map((p) => `${p.key.trim()}: ${p.value.trim()}`)
    .join('\n')

const parseQueryParams = (raw) => {
  if (!raw) return [{ key: '', value: '', enabled: true }]
  const pairs = raw.split('&').filter(Boolean).map((pair) => {
    const [k, ...rest] = pair.split('=')
    return { key: decodeURIComponent(k || ''), value: decodeURIComponent(rest.join('=') || ''), enabled: true }
  })
  return [...pairs, { key: '', value: '', enabled: true }]
}

const serializeQueryParams = (pairs) =>
  pairs
    .filter((p) => p.enabled && p.key.trim())
    .map((p) => `${encodeURIComponent(p.key.trim())}=${encodeURIComponent(p.value.trim())}`)
    .join('&')

// ── KVTable (unchanged from original) ────────────────────────────────────────

function KVTable({ pairs, onChange, keyPlaceholder = 'Key', valuePlaceholder = 'Value' }) {
  const update = (idx, field, val) => {
    const next = pairs.map((p, i) => (i === idx ? { ...p, [field]: val } : p))
    if (idx === pairs.length - 1 && (field === 'key' || field === 'value') && val) {
      next.push({ key: '', value: '', enabled: true })
    }
    onChange(next)
  }

  const remove = (idx) => {
    const next = pairs.filter((_, i) => i !== idx)
    if (!next.length) next.push({ key: '', value: '', enabled: true })
    onChange(next)
  }

  return (
    <table className="kv-table">
      <thead>
        <tr>
          <th style={{ width: '28px' }}></th>
          <th>Key</th>
          <th>Value</th>
          <th style={{ width: '36px' }}></th>
        </tr>
      </thead>
      <tbody>
        {pairs.map((pair, idx) => (
          <tr key={idx}>
            <td>
              <input
                type="checkbox"
                checked={pair.enabled}
                onChange={(e) => update(idx, 'enabled', e.target.checked)}
                style={{ accentColor: 'var(--orange)', cursor: 'pointer' }}
                aria-label="Enable row"
              />
            </td>
            <td>
              <input
                className="kv-input"
                placeholder={keyPlaceholder}
                value={pair.key}
                onChange={(e) => update(idx, 'key', e.target.value)}
              />
            </td>
            <td>
              <input
                className="kv-input"
                placeholder={valuePlaceholder}
                value={pair.value}
                onChange={(e) => update(idx, 'value', e.target.value)}
              />
            </td>
            <td>
              {(pair.key || pair.value) && (
                <button className="kv-delete-btn" onClick={() => remove(idx)} aria-label="Remove row" type="button">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

// ── Helpers (unchanged) ───────────────────────────────────────────────────────

function statusClass(code) {
  if (!code) return ''
  if (code < 300) return 'status-ok'
  if (code < 400) return 'status-redir'
  return 'status-err'
}

function formatBytes(bytes) {
  if (bytes == null) return '—'
  if (bytes < 1024) return `${bytes} B`
  return `${(bytes / 1024).toFixed(1)} KB`
}

function tryFormatJSON(text) {
  try {
    return JSON.stringify(JSON.parse(text), null, 2)
  } catch {
    return text
  }
}

/** Format an ISO timestamp into a short locale string */
function formatTs(ts) {
  if (!ts) return ''
  try {
    return new Date(ts).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return ts
  }
}

// ── History panel ─────────────────────────────────────────────────────────────

function HistoryPanel({ requestId, onSelectRun }) {
  const [open, setOpen] = useState(false)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(null)

  // Reset when request changes
  useEffect(() => {
    setOpen(false)
    setHistory([])
    setLoaded(false)
    setError(null)
  }, [requestId])

  const loadHistory = useCallback(async () => {
    if (!requestId || loading) return
    setLoading(true)
    setError(null)
    try {
      const res = await getExecutionHistoryApi(requestId)
      // Most recent first
      setHistory([...(res.data || [])].reverse())
      setLoaded(true)
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load history')
    } finally {
      setLoading(false)
    }
  }, [requestId, loading])

  const handleToggle = () => {
    const next = !open
    setOpen(next)
    if (next && !loaded) loadHistory()
  }

  if (!requestId) return null

  return (
    <div className="history-panel">
      <div
        className="history-panel-header"
        onClick={handleToggle}
        role="button"
        aria-expanded={open}
        aria-controls="history-list"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleToggle() }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          style={{ color: 'var(--text-subtle)', flexShrink: 0 }}>
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        <span className="history-panel-title">Run History</span>
        {loaded && history.length > 0 && (
          <span className="tab-badge" style={{ marginRight: '4px' }}>{history.length}</span>
        )}
        <span className={`history-panel-chevron ${open ? 'open' : ''}`}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </div>

      {open && (
        <div className="history-list" id="history-list" role="list">
          {loading && (
            <div className="history-loading">
              <div className="spinner-lg" style={{ width: '20px', height: '20px', borderWidth: '2px' }} />
            </div>
          )}
          {error && (
            <div className="history-empty" style={{ color: 'var(--error)' }}>{error}</div>
          )}
          {!loading && !error && history.length === 0 && (
            <div className="history-empty">No executions recorded yet.</div>
          )}
          {!loading && history.map((run, idx) => (
            <div
              key={idx}
              className="history-row"
              role="listitem"
              onClick={() => onSelectRun && onSelectRun(run)}
              title="Click to load this response"
            >
              <span className={`history-row-status ${statusClass(run.statusCode)}`}>
                {run.statusCode || '—'}
              </span>
              <span className="history-row-time">{run.responseTime != null ? `${run.responseTime}ms` : '—'}</span>
              <span className="history-row-ts">{formatTs(run.executedAt)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── RequestBuilder ────────────────────────────────────────────────────────────

export default function RequestBuilder({ request, collectionId, onSaved, onNew }) {
  const { addRequestToStore, updateRequestInStore } = useWorkspace()
  const { activeEnvironment } = useEnvironment()

  const [name, setName] = useState('')
  const [method, setMethod] = useState('GET')
  const [url, setUrl] = useState('')
  const [activeTab, setActiveTab] = useState('params')
  const [params, setParams] = useState([{ key: '', value: '', enabled: true }])
  const [headers, setHeaders] = useState([{ key: '', value: '', enabled: true }])
  const [body, setBody] = useState('')

  const [response, setResponse] = useState(null)
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState(null)
  const [activeRespTab, setActiveRespTab] = useState('body')

  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [saved, setSaved] = useState(false)

  const isEditing = Boolean(request?.id)

  useEffect(() => {
    if (request) {
      setName(request.name || '')
      setMethod(request.method || 'GET')
      setUrl(request.url || '')
      setParams(parseQueryParams(request.queryParams))
      setHeaders(parseKV(request.headers))
      setBody(request.body || '')
      setResponse(null)
      setSendError(null)
      setSaveError(null)
    } else {
      setName('')
      setMethod('GET')
      setUrl('')
      setParams([{ key: '', value: '', enabled: true }])
      setHeaders([{ key: '', value: '', enabled: true }])
      setBody('')
      setResponse(null)
    }
  }, [request])

  const buildUrl = useCallback(() => {
    const qs = serializeQueryParams(params)
    if (!qs) return url
    const sep = url.includes('?') ? '&' : '?'
    return `${url}${sep}${qs}`
  }, [url, params])

  // ── Send ────────────────────────────────────────────────────────────────────

  const handleSend = async () => {
    if (!url.trim()) return
    setSending(true)
    setSendError(null)
    setResponse(null)

    // ── Path A: saved request + active environment → backend execution engine ──
    if (request?.id && activeEnvironment?.id) {
      try {
        const res = await executeRequestApi(request.id, activeEnvironment.id)
        const dto = res.data // { statusCode, headers, body, responseTime }
        const bodyText = tryFormatJSON(dto.body || '')
        const size = new TextEncoder().encode(dto.body || '').length

        setResponse({
          status: dto.statusCode,
          // Backend doesn't return statusText; derive a short label from the code
          statusText: httpStatusText(dto.statusCode),
          time: dto.responseTime,
          size,
          body: bodyText,
          headers: dto.headers || {},
        })
      } catch (err) {
        setSendError(
          err?.response?.data?.message ||
          err?.message ||
          'Execution failed'
        )
        setResponse({ status: null, time: null })
      } finally {
        setSending(false)
      }
      return
    }

    // ── Path B: unsaved request OR no environment → raw browser fetch (fallback) ──
    const finalUrl = buildUrl()
    const headersObj = {}
    headers.filter((h) => h.enabled && h.key.trim()).forEach((h) => {
      headersObj[h.key.trim()] = h.value.trim()
    })

    const hasBody = ['POST', 'PUT', 'PATCH'].includes(method) && body.trim()
    if (hasBody && !headersObj['Content-Type'] && !headersObj['content-type']) {
      headersObj['Content-Type'] = 'application/json'
    }

    const start = performance.now()
    try {
      const fetchOptions = {
        method,
        headers: headersObj,
        ...(hasBody ? { body } : {}),
      }
      const res = await fetch(finalUrl, fetchOptions)
      const elapsed = Math.round(performance.now() - start)
      const text = await res.text()
      const size = new TextEncoder().encode(text).length

      const resHeaders = {}
      res.headers.forEach((v, k) => { resHeaders[k] = v })

      setResponse({
        status: res.status,
        statusText: res.statusText,
        time: elapsed,
        size,
        body: tryFormatJSON(text),
        headers: resHeaders,
      })
    } catch (err) {
      const elapsed = Math.round(performance.now() - start)
      setSendError(`Network error: ${err.message}`)
      setResponse({ status: null, time: elapsed })
    } finally {
      setSending(false)
    }
  }

  // ── Save ────────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!name.trim()) { setSaveError('Give this request a name first'); return }
    if (!url.trim())  { setSaveError('URL is required'); return }
    if (!collectionId) { setSaveError('Select a collection first'); return }

    setSaving(true)
    setSaveError(null)
    setSaved(false)

    const payload = {
      name: name.trim(),
      method,
      url: url.trim(),
      headers: serializeKV(headers) || null,
      queryParams: serializeQueryParams(params) || null,
      body: body.trim() || null,
      folderId: request?.folderId || null,
    }

    try {
      if (isEditing) {
        const res = await updateRequestApi(request.id, payload)
        updateRequestInStore(collectionId, request.folderId || null, res.data)
        onSaved?.(res.data)
      } else {
        const res = await createRequestApi(collectionId, payload)
        addRequestToStore(collectionId, res.data)
        onSaved?.(res.data)
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      setSaveError(err.response?.data?.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  // Load a historical run into the response panel
  const handleSelectHistoryRun = (run) => {
    setResponse({
      status: run.statusCode,
      statusText: httpStatusText(run.statusCode),
      time: run.responseTime,
      size: new TextEncoder().encode(run.body || '').length,
      body: tryFormatJSON(run.body || ''),
      headers: run.headers || {},
    })
    setActiveRespTab('body')
  }

  const paramCount  = params.filter((p) => p.enabled && p.key).length
  const headerCount = headers.filter((h) => h.enabled && h.key).length

  // Determine which send mode will be used (for tooltip on Send button)
  const willUseBackend = Boolean(request?.id && activeEnvironment?.id)
  const sendTitle = willUseBackend
    ? `Execute via backend (environment: ${activeEnvironment.name})`
    : request?.id
      ? 'Select an environment above to use backend execution with {{variable}} resolution'
      : 'Save this request to a collection to enable backend execution'

  return (
    <div className="request-builder">
      {/* ── Name row ── */}
      <div className="request-name-row">
        <input
          className="request-name-input"
          placeholder="Request name (e.g. Get users)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-label="Request name"
        />
        <button className="btn-sm btn-sm-ghost" onClick={onNew} title="New request" type="button">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New
        </button>
        <button
          className="btn-sm btn-sm-primary"
          onClick={handleSave}
          disabled={saving}
          type="button"
        >
          {saving ? '…' : saved ? '✓ Saved' : isEditing ? 'Save' : 'Save to Collection'}
        </button>
      </div>

      {saveError && (
        <div style={{ padding: '0 16px 4px' }}>
          <div className="alert alert-error" style={{ fontSize: '12px', padding: '8px 12px' }}>{saveError}</div>
        </div>
      )}

      {/* ── Environment selector strip ── */}
      <EnvironmentSelector />

      {/* ── URL bar ── */}
      <div className="request-url-bar">
        <select
          className="method-select"
          value={method}
          onChange={(e) => setMethod(e.target.value)}
          aria-label="HTTP method"
          style={{
            color:
              method === 'GET'    ? '#22c55e' :
              method === 'POST'   ? '#f97316' :
              method === 'DELETE' ? '#ef4444' :
              method === 'PUT'    ? '#eab308' :
              method === 'PATCH'  ? '#8b5cf6' :
              'var(--text-primary)',
          }}
        >
          {METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>

        <input
          className="url-input"
          placeholder="https://api.example.com/v1/users  (use {{baseUrl}} for env variables)"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSend() }}
          aria-label="Request URL"
        />

        <button
          className="send-btn"
          onClick={handleSend}
          disabled={sending || !url.trim()}
          title={sendTitle}
          type="button"
          style={willUseBackend ? { background: 'var(--orange)', transition: 'background var(--transition)' } : {}}
        >
          {sending ? (
            <span className="spinner" style={{ width: '16px', height: '16px' }} />
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
              Send
              {/* Small indicator showing backend vs browser mode */}
              {willUseBackend && (
                <span style={{
                  fontSize: '9px',
                  fontWeight: 700,
                  background: 'rgba(255,255,255,0.2)',
                  padding: '1px 5px',
                  borderRadius: '10px',
                  letterSpacing: '0.2px',
                }}>
                  ENV
                </span>
              )}
            </>
          )}
        </button>
      </div>

      {/* ── Request tabs ── */}
      <div className="tabs" role="tablist">
        {[
          { id: 'params',  label: 'Params',  count: paramCount },
          { id: 'headers', label: 'Headers', count: headerCount },
          { id: 'body',    label: 'Body',    count: body.trim() ? 1 : 0 },
        ].map(({ id, label, count }) => (
          <button
            key={id}
            className={`tab-btn ${activeTab === id ? 'active' : ''}`}
            onClick={() => setActiveTab(id)}
            role="tab"
            aria-selected={activeTab === id}
          >
            {label}
            {count > 0 && <span className="tab-badge">{count}</span>}
          </button>
        ))}
      </div>

      <div className="tab-content">
        {activeTab === 'params' && (
          <KVTable
            pairs={params}
            onChange={setParams}
            keyPlaceholder="param"
            valuePlaceholder="value"
          />
        )}
        {activeTab === 'headers' && (
          <KVTable
            pairs={headers}
            onChange={setHeaders}
            keyPlaceholder="Authorization"
            valuePlaceholder="Bearer token or header value"
          />
        )}
        {activeTab === 'body' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-subtle)' }}>
              Raw body — paste JSON, form data, or any format your endpoint expects.
            </div>
            <textarea
              className="body-editor"
              placeholder={'{\n  "key": "value"\n}'}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              spellCheck={false}
              aria-label="Request body"
            />
          </div>
        )}
      </div>

      {/* ── Response panel ── */}
      <div className="response-panel">
        <div className="response-header">
          <div className="tabs" style={{ flex: 1, border: 'none', padding: 0, background: 'transparent' }} role="tablist">
            <button
              className={`tab-btn ${activeRespTab === 'body' ? 'active' : ''}`}
              onClick={() => setActiveRespTab('body')}
              role="tab"
              aria-selected={activeRespTab === 'body'}
              style={{ fontSize: '12px', padding: '8px 12px' }}
            >
              Body
            </button>
            <button
              className={`tab-btn ${activeRespTab === 'respHeaders' ? 'active' : ''}`}
              onClick={() => setActiveRespTab('respHeaders')}
              role="tab"
              aria-selected={activeRespTab === 'respHeaders'}
              style={{ fontSize: '12px', padding: '8px 12px' }}
            >
              Headers
              {response?.headers && Object.keys(response.headers).length > 0 && (
                <span className="tab-badge">{Object.keys(response.headers).length}</span>
              )}
            </button>
          </div>

          {response && (
            <div className="response-meta">
              {response.status && (
                <span className={`response-stat ${statusClass(response.status)}`}>
                  {response.status} {response.statusText}
                </span>
              )}
              {response.time != null && (
                <span className="response-stat">
                  <span className="response-stat-label">Time:</span>
                  <span style={{ color: 'var(--text-primary)' }}>{response.time}ms</span>
                </span>
              )}
              {response.size != null && (
                <span className="response-stat">
                  <span className="response-stat-label">Size:</span>
                  <span style={{ color: 'var(--text-primary)' }}>{formatBytes(response.size)}</span>
                </span>
              )}
            </div>
          )}
        </div>

        {sendError && (
          <div className="response-body" style={{ color: 'var(--error)' }}>
            {sendError}
            <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--text-subtle)' }}>
              {willUseBackend
                ? 'The backend execution engine returned an error. Check that the target URL is reachable from the server.'
                : 'Check that the server is reachable and CORS is configured for this origin.'}
            </div>
          </div>
        )}

        {!response && !sendError && (
          <div className="response-empty">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
              style={{ color: 'var(--text-subtle)', marginBottom: '4px' }}>
              <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
            <span>Enter a URL and hit <strong style={{ color: 'var(--text-muted)' }}>Send</strong></span>
            {!request?.id && (
              <span style={{ fontSize: '11px', color: 'var(--text-subtle)' }}>
                Save to a collection to enable backend execution with <code style={{ color: 'var(--orange)' }}>{'{{variables}}'}</code>
              </span>
            )}
            {request?.id && !activeEnvironment && (
              <span style={{ fontSize: '11px', color: 'var(--text-subtle)' }}>
                Select an environment above to use <code style={{ color: 'var(--orange)' }}>{'{{variable}}'}</code> resolution
              </span>
            )}
            {!request?.id && !activeEnvironment && (
              <span style={{ fontSize: '12px' }}>The response will appear here</span>
            )}
          </div>
        )}

        {response && activeRespTab === 'body' && (
          <div className="response-body" aria-live="polite">
            {response.body ?? <span style={{ color: 'var(--text-subtle)', fontStyle: 'italic' }}>Empty response body</span>}
          </div>
        )}

        {response && activeRespTab === 'respHeaders' && (
          <div className="tab-content" style={{ padding: '12px 16px' }}>
            {Object.keys(response.headers || {}).length === 0 ? (
              <div style={{ fontSize: '13px', color: 'var(--text-subtle)' }}>No headers returned</div>
            ) : (
              <table className="kv-table">
                <thead>
                  <tr><th>Header</th><th>Value</th></tr>
                </thead>
                <tbody>
                  {Object.entries(response.headers).map(([k, v]) => (
                    <tr key={k}>
                      <td>
                        <span className="kv-input" style={{ display: 'block', color: 'var(--text-secondary)', background: 'transparent', border: 'none', padding: '4px 8px' }}>
                          {k}
                        </span>
                      </td>
                      <td>
                        <span className="kv-input" style={{ display: 'block', color: 'var(--text-muted)', background: 'transparent', border: 'none', padding: '4px 8px', wordBreak: 'break-all' }}>
                          {v}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* ── Run History panel (only for saved requests) ── */}
      <HistoryPanel requestId={request?.id} onSelectRun={handleSelectHistoryRun} />
    </div>
  )
}

// ── Tiny helper: derive statusText from a numeric code ────────────────────────

function httpStatusText(code) {
  const map = {
    200: 'OK', 201: 'Created', 202: 'Accepted', 204: 'No Content',
    301: 'Moved Permanently', 302: 'Found', 304: 'Not Modified',
    400: 'Bad Request', 401: 'Unauthorized', 403: 'Forbidden',
    404: 'Not Found', 405: 'Method Not Allowed', 409: 'Conflict',
    422: 'Unprocessable Entity', 429: 'Too Many Requests',
    500: 'Internal Server Error', 502: 'Bad Gateway', 503: 'Service Unavailable',
  }
  return map[code] || ''
}
