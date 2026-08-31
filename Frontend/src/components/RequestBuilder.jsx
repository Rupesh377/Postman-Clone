import { useState, useEffect, useCallback } from 'react'
import { useWorkspace } from '../context/WorkspaceContext'
import { createRequestApi, updateRequestApi } from '../api/requestApi'
import '../styles/app.css'

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']

// ── Key-value pair helpers ────────────────────────────────────
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

// ── Key-value table ───────────────────────────────────────────
function KVTable({ pairs, onChange, keyPlaceholder = 'Key', valuePlaceholder = 'Value' }) {
  const update = (idx, field, val) => {
    const next = pairs.map((p, i) => (i === idx ? { ...p, [field]: val } : p))
    // auto-add blank row if editing the last row
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

// ── Status color helper ───────────────────────────────────────
function statusClass(code) {
  if (!code) return ''
  if (code < 300) return 'status-ok'
  if (code < 400) return 'status-redir'
  return 'status-err'
}

function formatBytes(bytes) {
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

// ── Main component ────────────────────────────────────────────
export default function RequestBuilder({ request, collectionId, onSaved, onNew }) {
  const { addRequestToStore, updateRequestInStore } = useWorkspace()

  // Form state
  const [name, setName] = useState('')
  const [method, setMethod] = useState('GET')
  const [url, setUrl] = useState('')
  const [activeTab, setActiveTab] = useState('params')
  const [params, setParams] = useState([{ key: '', value: '', enabled: true }])
  const [headers, setHeaders] = useState([{ key: '', value: '', enabled: true }])
  const [body, setBody] = useState('')

  // Response state
  const [response, setResponse] = useState(null) // { status, statusText, time, size, body, headers }
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState(null)
  const [activeRespTab, setActiveRespTab] = useState('body')

  // Save state
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [saved, setSaved] = useState(false)

  const isEditing = Boolean(request?.id)

  // Populate fields when a saved request is selected
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
      // New request
      setName('')
      setMethod('GET')
      setUrl('')
      setParams([{ key: '', value: '', enabled: true }])
      setHeaders([{ key: '', value: '', enabled: true }])
      setBody('')
      setResponse(null)
    }
  }, [request])

  // Build URL with query params merged
  const buildUrl = useCallback(() => {
    const qs = serializeQueryParams(params)
    if (!qs) return url
    const sep = url.includes('?') ? '&' : '?'
    return `${url}${sep}${qs}`
  }, [url, params])

  const handleSend = async () => {
    if (!url.trim()) return
    setSending(true)
    setSendError(null)
    setResponse(null)

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

  const paramCount  = params.filter((p) => p.enabled && p.key).length
  const headerCount = headers.filter((h) => h.enabled && h.key).length

  return (
    <div className="request-builder">
      {/* Request name row */}
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

      {/* URL bar */}
      <div className="request-url-bar">
        <select
          className="method-select"
          value={method}
          onChange={(e) => setMethod(e.target.value)}
          aria-label="HTTP method"
          style={{ color: method === 'GET' ? '#22c55e' : method === 'POST' ? '#f97316' : method === 'DELETE' ? '#ef4444' : method === 'PUT' ? '#eab308' : method === 'PATCH' ? '#8b5cf6' : 'var(--text-primary)' }}
        >
          {METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>

        <input
          className="url-input"
          placeholder="https://api.example.com/v1/users"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSend() }}
          aria-label="Request URL"
        />

        <button
          className="send-btn"
          onClick={handleSend}
          disabled={sending || !url.trim()}
          type="button"
        >
          {sending ? (
            <span className="spinner" style={{ width: '16px', height: '16px' }} />
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
              Send
            </>
          )}
        </button>
      </div>

      {/* Request tabs */}
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

      {/* Tab content */}
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

      {/* Response panel */}
      <div className="response-panel">
        {/* Status bar */}
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

        {/* Response body */}
        {sendError && (
          <div className="response-body" style={{ color: 'var(--error)' }}>
            {sendError}
            <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--text-subtle)' }}>
              Check that the server is reachable and CORS is configured for this origin.
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
            <span style={{ fontSize: '12px' }}>The response will appear here</span>
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
                      <td><span className="kv-input" style={{ background: 'none', border: 'none', color: 'var(--orange)', fontWeight: 500 }}>{k}</span></td>
                      <td><span className="kv-input" style={{ background: 'none', border: 'none' }}>{v}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
