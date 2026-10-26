import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useWorkspace } from '../context/WorkspaceContext'
import { useEnvironment } from '../context/EnvironmentContext'
import { createRequestApi, updateRequestApi } from '../api/requestApi'
import { executeRequestApi, getExecutionHistoryApi, createEnvironmentApi } from '../api/environmentApi'
import EnvironmentSelector from './EnvironmentSelector'
import CodeModal from './CodeModal'
import AIAssistantModal from './ai/AIAssistantModal'
import GenerateDocsPanel from './ai/GenerateDocsPanel'
import GenerateTestsPanel from './ai/GenerateTestsPanel'
import TestAssertionEditor from './ai/TestAssertionEditor'
import GenerateAndRunTestsPanel from './ai/GenerateAndRunTestsPanel'
import ExplainResponsePanel from './ai/ExplainResponsePanel'
import { SparklesIcon, BoltIcon, BeakerIcon, PlayIcon, HeadersIcon } from './ai/aiIcons'
import '../styles/app.css'
import '../styles/environment.css'


const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']

// Parse headers stored as JSON {"k":"v"} or old "K: v\n" lines
const parseKV = (raw) => {
  if (!raw) return [{ key: '', value: '', enabled: true }]
  try {
    const obj = JSON.parse(raw)
    if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
      const pairs = Object.entries(obj).map(([k, v]) => ({ key: k, value: v, enabled: true }))
      return [...pairs, { key: '', value: '', enabled: true }]
    }
  } catch {}
  // fallback: "Key: value" lines
  const lines = raw.split('\n').filter(Boolean)
  const pairs = lines.map((line) => {
    const idx = line.indexOf(':')
    if (idx === -1) return { key: line.trim(), value: '', enabled: true }
    return { key: line.slice(0, idx).trim(), value: line.slice(idx + 1).trim(), enabled: true }
  })
  return pairs.length ? [...pairs, { key: '', value: '', enabled: true }] : [{ key: '', value: '', enabled: true }]
}

// Serialise to JSON {"k":"v"} — backend expects Map<String,String> stored as JSON
const serializeKV = (pairs) => {
  const obj = {}
  pairs.filter((p) => p.enabled && p.key.trim()).forEach((p) => { obj[p.key.trim()] = p.value.trim() })
  return Object.keys(obj).length ? JSON.stringify(obj) : null
}

// Parse queryParams stored as JSON {"k":"v"} or old "a=b&c=d" format
const parseQueryParams = (raw) => {
  if (!raw) return [{ key: '', value: '', enabled: true }]
  try {
    const obj = JSON.parse(raw)
    if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
      const pairs = Object.entries(obj).map(([k, v]) => ({ key: k, value: v, enabled: true }))
      return [...pairs, { key: '', value: '', enabled: true }]
    }
  } catch {}
  // fallback: "a=b&c=d" format
  const pairs = raw.split('&').filter(Boolean).map((pair) => {
    const [k, ...rest] = pair.split('=')
    return { key: decodeURIComponent(k || ''), value: decodeURIComponent(rest.join('=') || ''), enabled: true }
  })
  return [...pairs, { key: '', value: '', enabled: true }]
}

// Serialise to JSON {"k":"v"}
const serializeQueryParams = (pairs) => {
  const obj = {}
  pairs.filter((p) => p.enabled && p.key.trim()).forEach((p) => { obj[p.key.trim()] = p.value.trim() })
  return Object.keys(obj).length ? JSON.stringify(obj) : null
}

// Build a full URL with query params appended (for display + direct fetch fallback)
const buildFullUrl = (baseUrl, params) => {
  const enabled = params.filter((p) => p.enabled && p.key.trim())
  if (!enabled.length) return baseUrl
  const qs = enabled.map((p) => `${encodeURIComponent(p.key.trim())}=${encodeURIComponent(p.value.trim())}`).join('&')
  return baseUrl.includes('?') ? `${baseUrl}&${qs}` : `${baseUrl}?${qs}`
}

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

function tokenizeJSON(json) {
  const regex = /("(?:\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*")(\s*:)?|\b(true|false)\b|\b(null)\b|(-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g
  const tokens = []
  let lastIndex = 0
  let match
  let i = 0

  while ((match = regex.exec(json)) !== null) {
    if (match.index > lastIndex) {
      tokens.push(json.slice(lastIndex, match.index))
    }
    const [, str, colon, boolVal, nullVal, numVal] = match
    if (str) {
      if (colon) {
        tokens.push(<span key={i++} className="json-key">{str}</span>)
        tokens.push(colon)
      } else {
        tokens.push(<span key={i++} className="json-string">{str}</span>)
      }
    } else if (numVal) {
      tokens.push(<span key={i++} className="json-number">{numVal}</span>)
    } else if (boolVal) {
      tokens.push(<span key={i++} className="json-boolean">{boolVal}</span>)
    } else if (nullVal) {
      tokens.push(<span key={i++} className="json-null">{nullVal}</span>)
    }
    lastIndex = regex.lastIndex
  }
  if (lastIndex < json.length) {
    tokens.push(json.slice(lastIndex))
  }
  return tokens
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

export default function RequestBuilder({ request, collectionId, folderId, onSaved, onNew, onDirtyChange }) {
  const { addRequestToStore, addRequestToFolderStore, updateRequestInStore } = useWorkspace()
  const { activeEnvironment, environments, createEnvironment, selectEnvironment, loadEnvironments, envsLoaded } = useEnvironment()

  const [copiedBody, setCopiedBody] = useState(false)
  const [copiedDocs, setCopiedDocs] = useState(false)

  const [name, setName] = useState('')
  const [method, setMethod] = useState('GET')
  const [url, setUrl] = useState('')
  const [activeTab, setActiveTab] = useState('params')
  const [params, setParams] = useState([{ key: '', value: '', enabled: true }])
  const [headers, setHeaders] = useState([{ key: '', value: '', enabled: true }])
  const [body, setBody] = useState('')
  const [bodyMode, setBodyMode] = useState('json')
  const [authType, setAuthType] = useState('none')
  const [authBearer, setAuthBearer] = useState('')
  const [authBasicUser, setAuthBasicUser] = useState('')
  const [authBasicPass, setAuthBasicPass] = useState('')
  const [authApiKeyName, setAuthApiKeyName] = useState('X-API-Key')
  const [authApiKeyValue, setAuthApiKeyValue] = useState('')
  const [authApiKeyIn, setAuthApiKeyIn] = useState('header')

  const [response, setResponse] = useState(null)
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState(null)
  const [activeRespTab, setActiveRespTab] = useState('body')
  const [respRaw, setRespRaw] = useState(false)

  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [saved, setSaved] = useState(false)
  const [showCode, setShowCode] = useState(false)

  // Track the last-saved snapshot to detect unsaved changes
  const savedSnapshotRef = useRef(null)
  const isEditing = Boolean(request?.id)
  const onDirtyChangeRef = useRef(onDirtyChange)
  const lastDirtyRef = useRef(false)

  useEffect(() => {
    onDirtyChangeRef.current = onDirtyChange
  }, [onDirtyChange])

  // AI Assistant Modal & Workbench state
  const [showAiModal, setShowAiModal] = useState(false)
  const [aiModalInitialTool, setAiModalInitialTool] = useState('body')
  const [testsSubTab, setTestsSubTab] = useState('runner')


  const undefinedVars = useMemo(() => {
    if (!activeEnvironment) return []
    const envKeys = new Set((activeEnvironment.variables || []).map((v) => v.variableKey || v.key).filter(Boolean))
    const regex = /\{\{\s*([\w.-]+)\s*\}\}/g
    const found = new Set()

    const scan = (str) => {
      if (!str || typeof str !== 'string') return
      regex.lastIndex = 0
      let m
      while ((m = regex.exec(str)) !== null) {
        if (!envKeys.has(m[1])) {
          found.add(m[1])
        }
      }
    }

    scan(url)
    scan(body)
    params.forEach((p) => { scan(p.key); scan(p.value) })
    headers.forEach((h) => { scan(h.key); scan(h.value) })

    return Array.from(found)
  }, [activeEnvironment, url, body, params, headers])

  useEffect(() => {
    if (request) {
      setName(request.name || '')
      setMethod(request.method || 'GET')
      // Strip any baked-in QS from the stored url back into the params table
      const rawUrl = request.url || ''
      const qMark = rawUrl.indexOf('?')
      const baseUrl = qMark === -1 ? rawUrl : rawUrl.slice(0, qMark)
      const storedQS = qMark === -1 ? '' : rawUrl.slice(qMark + 1)
      setUrl(baseUrl)
      // Prefer stored queryParams JSON; fall back to QS in url for old records
      const initialParams = parseQueryParams(request.queryParams || storedQS || null)
      const initialHeaders = parseKV(request.headers)
      setParams(initialParams)
      setHeaders(initialHeaders)
      setBody(request.body || '')
      setResponse(null)
      setSendError(null)
      setSaveError(null)
      savedSnapshotRef.current = {
        name: (request.name || '').trim(),
        method: request.method || 'GET',
        url: baseUrl.trim(),
        queryParams: serializeQueryParams(initialParams),
        headers: serializeKV(initialHeaders),
        body: (request.body || '').trim(),
      }
    } else {
      setName('')
      setMethod('GET')
      setUrl('')
      setParams([{ key: '', value: '', enabled: true }])
      setHeaders([{ key: '', value: '', enabled: true }])
      setBody('')
      setResponse(null)
      savedSnapshotRef.current = {
        name: '',
        method: 'GET',
        url: '',
        queryParams: null,
        headers: null,
        body: '',
      }
    }
    lastDirtyRef.current = false
    onDirtyChangeRef.current?.(false)
  }, [request])

  const checkIfDirty = useCallback(() => {
    const snap = savedSnapshotRef.current
    if (!snap) return false
    const curName = name.trim()
    const curMethod = method
    const curUrl = url.trim()
    const curParams = serializeQueryParams(params)
    const curHeaders = serializeKV(headers)
    const curBody = bodyMode === 'none' ? '' : body.trim()

    return (
      curName !== (snap.name || '').trim() ||
      curMethod !== (snap.method || 'GET') ||
      curUrl !== (snap.url || '').trim() ||
      curParams !== (snap.queryParams || null) ||
      curHeaders !== (snap.headers || null) ||
      curBody !== (snap.body || '').trim()
    )
  }, [name, method, url, params, headers, body, bodyMode])

  useEffect(() => {
    const dirty = checkIfDirty()
    if (dirty !== lastDirtyRef.current) {
      lastDirtyRef.current = dirty
      onDirtyChangeRef.current?.(dirty)
    }
  }, [checkIfDirty])

  // ── Auth → headers/queryParams ─────────────────────────────────────────────

  const applyAuth = (headersObj, paramsArr) => {
    const h = { ...headersObj }
    const p = paramsArr.map((r) => ({ ...r }))
    if (authType === 'bearer' && authBearer.trim()) {
      h['Authorization'] = `Bearer ${authBearer.trim()}`
    } else if (authType === 'basic' && authBasicUser.trim()) {
      h['Authorization'] = 'Basic ' + btoa(`${authBasicUser}:${authBasicPass}`)
    } else if (authType === 'apikey' && authApiKeyName.trim() && authApiKeyValue.trim()) {
      if (authApiKeyIn === 'header') {
        h[authApiKeyName.trim()] = authApiKeyValue.trim()
      } else {
        p.push({ key: authApiKeyName.trim(), value: authApiKeyValue.trim(), enabled: true })
      }
    }
    return { h, p }
  }

  // ── Save (returns saved request object) ────────────────────────────────────

  const doSave = useCallback(async () => {
    if (!name.trim()) throw new Error('Give this request a name first')
    if (!url.trim()) throw new Error('URL is required')
    if (!collectionId) throw new Error('Select a collection first')

    const fullUrl = buildFullUrl(url.trim(), params)
    const headersToSave = serializeKV(headers)
    let headersObj = {}
    try { headersObj = headersToSave ? JSON.parse(headersToSave) : {} } catch {}
    if (body.trim() && !Object.keys(headersObj).some((k) => k.toLowerCase() === 'content-type')) {
      headersObj['Content-Type'] = 'application/json'
    }
    const { h: headersWithAuth, p: paramsWithAuth } = applyAuth(headersObj, params)
    const finalParams = paramsWithAuth
    const payload = {
      name: name.trim(),
      method,
      url: buildFullUrl(url.trim(), finalParams),
      headers: Object.keys(headersWithAuth).length ? JSON.stringify(headersWithAuth) : null,
      queryParams: serializeQueryParams(finalParams),
      body: bodyMode === 'none' ? null : (body.trim() || null),
      folderId: folderId ?? request?.folderId ?? null,
    }

    const currentSnap = {
      name: name.trim(),
      method,
      url: url.trim(),
      queryParams: serializeQueryParams(params),
      headers: serializeKV(headers),
      body: bodyMode === 'none' ? '' : body.trim(),
    }

    if (isEditing) {
      const res = await updateRequestApi(request.id, payload)
      updateRequestInStore(collectionId, request.folderId || null, res.data)
      savedSnapshotRef.current = currentSnap
      lastDirtyRef.current = false
      onDirtyChangeRef.current?.(false)
      onSaved?.(res.data)
      return res.data
    } else {
      const res = await createRequestApi(collectionId, payload)
      if (folderId) {
        addRequestToFolderStore(folderId, res.data)
      } else {
        addRequestToStore(collectionId, res.data)
      }
      savedSnapshotRef.current = currentSnap
      lastDirtyRef.current = false
      onDirtyChangeRef.current?.(false)
      onSaved?.(res.data)
      return res.data
    }
  }, [name, method, url, params, headers, body, bodyMode, authType, authBearer,
      authBasicUser, authBasicPass, authApiKeyName, authApiKeyValue, authApiKeyIn,
      collectionId, folderId, request, isEditing,
      addRequestToStore, addRequestToFolderStore, updateRequestInStore, onSaved])

  const handleSave = async () => {
    setSaving(true)
    setSaveError(null)
    setSaved(false)
    try {
      await doSave()
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      setSaveError(err?.response?.data?.message || err?.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  // ── Send ────────────────────────────────────────────────────────────────────

  const handleSend = async () => {
    if (!url.trim()) return
    setSending(true)
    setSendError(null)
    setResponse(null)

    try {
      // 1. Ensure we have a saved request id — save first if needed
      let savedRequest = request
      if (!savedRequest?.id) {
        if (!name.trim() || !collectionId) {
          setSendError('Save the request to a collection before sending.')
          setSending(false)
          return
        }
        savedRequest = await doSave()
      } else if (checkIfDirty()) {
        savedRequest = await doSave()
      }

      // 2. Ensure we have an active environment — auto-create "Default" if none exist
      let envId = activeEnvironment?.id
      if (!envId) {
        if (!envsLoaded) await loadEnvironments()
        if (environments.length > 0) {
          envId = environments[0].id
          selectEnvironment(envId)
        } else {
          const created = await createEnvironment('Default')
          envId = created.id
          selectEnvironment(envId)
        }
      }

      // 3. Execute via backend
      const res = await executeRequestApi(savedRequest.id, envId)
      const dto = res.data
      const bodyText = tryFormatJSON(dto.body || '')
      const size = new TextEncoder().encode(dto.body || '').length

      if (dto.statusCode === 0) {
        setSendError(dto.body || 'Request failed')
        setResponse({ status: 0, time: dto.responseTime })
      } else {
        setResponse({
          status: dto.statusCode,
          statusText: httpStatusText(dto.statusCode),
          time: dto.responseTime,
          size,
          body: bodyText,
          headers: dto.headers || {},
        })
      }
    } catch (err) {
      setSendError(err?.response?.data?.message || err?.message || 'Execution failed')
      setResponse({ status: null, time: null })
    } finally {
      setSending(false)
    }
  }

  const handleSendRef = useRef(handleSend)
  handleSendRef.current = handleSend
  const handleSaveRef = useRef(handleSave)
  handleSaveRef.current = handleSave

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        handleSendRef.current()
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSaveRef.current()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

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

  // ── AI helpers & callbacks ────────────────────────────────────────────────
  const handleApplyBodyFromAI = useCallback((newBody) => {
    setBody(newBody)
    if (bodyMode === 'none') {
      setBodyMode('json')
    }
  }, [bodyMode])

  const handleApplyHeadersFromAI = useCallback((headersToApply) => {
    setHeaders((prev) => {
      const existing = prev.filter((h) => h.key || h.value)
      const existingMap = new Map()
      existing.forEach((h, idx) => {
        existingMap.set(h.key.trim().toLowerCase(), idx)
      })

      const updated = [...existing]
      headersToApply.forEach((newH) => {
        const lower = newH.name.trim().toLowerCase()
        if (existingMap.has(lower)) {
          const idx = existingMap.get(lower)
          updated[idx] = { key: newH.name, value: newH.value, enabled: true }
        } else {
          updated.push({ key: newH.name, value: newH.value, enabled: true })
          existingMap.set(lower, updated.length - 1)
        }
      })

      return [...updated, { key: '', value: '', enabled: true }]
    })
  }, [])

  const handleSaveForAI = useCallback(async () => {
    return await doSave()
  }, [doSave])


  const paramCount  = params.filter((p) => p.enabled && p.key).length
  const headerCount = headers.filter((h) => h.enabled && h.key).length

  const formattedResponseBody = useMemo(() => {
    const b = response?.body
    if (b == null) return null
    if (respRaw || b.length > 200 * 1024) return respRaw ? b : tryFormatJSON(b)
    try {
      return tokenizeJSON(JSON.stringify(JSON.parse(b), null, 2))
    } catch {
      return b
    }
  }, [response?.body, respRaw])

  return (
    <div className="request-builder">
      {/* ── Name row ── */}
      <div className="request-name-row">
        <input
          className="request-name-input"
          placeholder="Request name"
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
        <button className="btn-sm btn-sm-primary" onClick={handleSave} disabled={saving} type="button">
          {saving ? 'Saving' : saved ? 'Saved' : isEditing ? 'Save' : 'Save to Collection'}
        </button>
        <button className="btn-sm btn-sm-ghost" onClick={() => setShowCode(true)} type="button" title="Generate code snippet">
          {'</>'}
        </button>
        <button
          className="btn-ai-assistant"
          onClick={() => {
            setAiModalInitialTool('body')
            setShowAiModal(true)
          }}
          type="button"
          title="Open APIForge Spring AI Assistant"
        >
          <SparklesIcon size={14} />
          <span>AI Assistant</span>
        </button>
      </div>

      {showCode && (
        <CodeModal
          url={url} method={method}
          headers={serializeKV(headers)}
          body={bodyMode !== 'none' ? body : null}
          onClose={() => setShowCode(false)}
        />
      )}

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
          placeholder="https://api.example.com/endpoint  — use {{var}} for env variables"
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

      {undefinedVars.length > 0 && (
        <div style={{
          padding: '4px 16px',
          fontSize: '11.5px',
          color: 'var(--warning)',
          background: 'var(--bg-panel)',
          borderBottom: '1px solid var(--border)',
        }}>
          Undefined variable(s): {undefinedVars.join(', ')}
        </div>
      )}

      {/* ── Request tabs ── */}
      <div className="tabs" role="tablist">
        {[
          { id: 'params',  label: 'Params',  count: paramCount },
          { id: 'headers', label: 'Headers', count: headerCount },
          { id: 'auth',    label: 'Auth',    count: authType !== 'none' ? 1 : 0 },
          { id: 'body',    label: 'Body',    count: bodyMode !== 'none' && body.trim() ? 1 : 0 },
          { id: 'docs',    label: 'Docs',    count: 0 },
          { id: 'tests',   label: 'Tests',   count: 0 },
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
          <KVTable pairs={params} onChange={setParams} keyPlaceholder="param" valuePlaceholder="value" />
        )}
        {activeTab === 'headers' && (
          <>
            <KVTable pairs={headers} onChange={setHeaders} keyPlaceholder="Header" valuePlaceholder="value" />
            <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                type="button"
                className="btn-sm btn-ai-assistant"
                onClick={() => {
                  setAiModalInitialTool('headers')
                  setShowAiModal(true)
                }}
              >
                <SparklesIcon size={13} />
                <span>Suggest Headers with AI</span>
              </button>
            </div>
          </>
        )}
        {activeTab === 'auth' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="field">
              <label className="field-label">Type</label>
              <select className="field-select" value={authType} onChange={(e) => setAuthType(e.target.value)}>
                <option value="none">None</option>
                <option value="bearer">Bearer Token</option>
                <option value="basic">Basic Auth</option>
                <option value="apikey">API Key</option>
              </select>
            </div>
            {authType === 'bearer' && (
              <div className="field">
                <label className="field-label">Token</label>
                <input className="field-input" placeholder="eyJ..." value={authBearer} onChange={(e) => setAuthBearer(e.target.value)} />
              </div>
            )}
            {authType === 'basic' && (
              <>
                <div className="field">
                  <label className="field-label">Username</label>
                  <input className="field-input" value={authBasicUser} onChange={(e) => setAuthBasicUser(e.target.value)} />
                </div>
                <div className="field">
                  <label className="field-label">Password</label>
                  <input className="field-input" type="password" value={authBasicPass} onChange={(e) => setAuthBasicPass(e.target.value)} />
                </div>
              </>
            )}
            {authType === 'apikey' && (
              <>
                <div className="field">
                  <label className="field-label">Key name</label>
                  <input className="field-input" value={authApiKeyName} onChange={(e) => setAuthApiKeyName(e.target.value)} />
                </div>
                <div className="field">
                  <label className="field-label">Value</label>
                  <input className="field-input" value={authApiKeyValue} onChange={(e) => setAuthApiKeyValue(e.target.value)} />
                </div>
                <div className="field">
                  <label className="field-label">Add to</label>
                  <select className="field-select" value={authApiKeyIn} onChange={(e) => setAuthApiKeyIn(e.target.value)}>
                    <option value="header">Header</option>
                    <option value="query">Query param</option>
                  </select>
                </div>
              </>
            )}
            {authType !== 'none' && (
              <div style={{ fontSize: 11, color: 'var(--text-subtle)' }}>
                Applied to headers/params on Save and Send.
              </div>
            )}
          </div>
        )}
        {activeTab === 'body' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {['none','json','text'].map((m) => (
                <button key={m} className={`btn-sm ${bodyMode === m ? 'btn-sm-primary' : 'btn-sm-ghost'}`}
                  style={{ height: 22, fontSize: 11, padding: '0 8px' }}
                  onClick={() => setBodyMode(m)}>
                  {m === 'none' ? 'None' : m === 'json' ? 'Raw JSON' : 'Raw Text'}
                </button>
              ))}
              {bodyMode !== 'none' && body.trim() && (
                <button className="btn-sm btn-sm-ghost" style={{ height: 22, fontSize: 11, padding: '0 8px' }}
                  onClick={() => { try { setBody(JSON.stringify(JSON.parse(body), null, 2)) } catch {} }}>
                  Beautify
                </button>
              )}
              <button
                type="button"
                className="btn-sm btn-ai-assistant"
                style={{ height: 22, fontSize: 11, padding: '0 8px', marginLeft: 'auto' }}
                onClick={() => {
                  setAiModalInitialTool('body')
                  setShowAiModal(true)
                }}
              >
                <SparklesIcon size={12} /> Generate Body with AI
              </button>
            </div>
            {bodyMode !== 'none' && (
              <textarea
                className="body-editor"
                placeholder={bodyMode === 'json' ? '{\n  "key": "value"\n}' : 'Plain text body'}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                spellCheck={false}
                aria-label="Request body"
              />
            )}
          </div>
        )}
        {activeTab === 'docs' && (
          <GenerateDocsPanel
            url={url}
            method={method}
            headers={headers}
            body={body}
            response={response}
          />
        )}
        {activeTab === 'tests' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className={`btn-sm ${testsSubTab === 'runner' ? 'btn-sm-primary' : 'btn-sm-ghost'}`}
                style={{ height: '26px', fontSize: '11.5px' }}
                onClick={() => setTestsSubTab('runner')}
              >
                <PlayIcon size={12} /> Test Assertions Runner
              </button>
              <button
                type="button"
                className={`btn-sm ${testsSubTab === 'generator' ? 'btn-sm-primary' : 'btn-sm-ghost'}`}
                style={{ height: '26px', fontSize: '11.5px' }}
                onClick={() => setTestsSubTab('generator')}
              >
                <BeakerIcon size={12} /> AI Test Case Generator
              </button>
              <button
                type="button"
                className={`btn-sm ${testsSubTab === 'gen-and-run' ? 'btn-sm-primary' : 'btn-sm-ghost'}`}
                style={{ height: '26px', fontSize: '11.5px' }}
                onClick={() => setTestsSubTab('gen-and-run')}
              >
                <BoltIcon size={12} /> 1-Click Generate & Run
              </button>
            </div>

            {testsSubTab === 'runner' && (
              <TestAssertionEditor
                requestId={request?.id}
                requestName={name}
                environmentId={activeEnvironment?.id}
                environmentName={activeEnvironment?.name}
                onSaveFirst={handleSaveForAI}
              />
            )}

            {testsSubTab === 'generator' && (
              <GenerateTestsPanel
                url={url}
                method={method}
                body={body}
                response={response}
                onTransferToRunner={() => setTestsSubTab('runner')}
              />
            )}

            {testsSubTab === 'gen-and-run' && (
              <GenerateAndRunTestsPanel
                requestId={request?.id}
                requestName={name}
                url={url}
                method={method}
                body={body}
                response={response}
                environmentId={activeEnvironment?.id}
                environmentName={activeEnvironment?.name}
                onSaveFirst={handleSaveForAI}
              />
            )}
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
              role="tab" aria-selected={activeRespTab === 'body'}
              style={{ fontSize: '12px', padding: '8px 12px' }}
            >
              Body
            </button>
            <button
              className={`tab-btn ${activeRespTab === 'respHeaders' ? 'active' : ''}`}
              onClick={() => setActiveRespTab('respHeaders')}
              role="tab" aria-selected={activeRespTab === 'respHeaders'}
              style={{ fontSize: '12px', padding: '8px 12px' }}
            >
              Headers
              {response?.headers && Object.keys(response.headers).length > 0 && (
                <span className="tab-badge">{Object.keys(response.headers).length}</span>
              )}
            </button>
            <button
              className={`tab-btn ${activeRespTab === 'aiExplain' ? 'active' : ''}`}
              onClick={() => setActiveRespTab('aiExplain')}
              role="tab" aria-selected={activeRespTab === 'aiExplain'}
              style={{ fontSize: '12px', padding: '8px 12px' }}
            >
              <SparklesIcon size={12} style={{ display: 'inline', marginRight: 4, color: 'var(--orange)' }} />
              AI Explain
            </button>
          </div>

          {response && (
            <div className="response-meta">
              {response.status != null && response.status !== 0 && (
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
              {response.status != null && response.status !== 0 && (
                <button
                  className="btn-sm btn-ai-assistant"
                  style={{ fontSize: 10, height: 22, padding: '0 7px' }}
                  onClick={() => {
                    setAiModalInitialTool('explain')
                    setShowAiModal(true)
                  }}
                  type="button"
                  title="Explain response with AI"
                >
                  <SparklesIcon size={11} />
                  <span>Explain</span>
                </button>
              )}
              {response.body != null && (
                <>
                  <button className="btn-sm btn-sm-ghost" style={{ fontSize: 10, height: 22, padding: '0 7px' }}
                    onClick={() => setRespRaw((r) => !r)}>
                    {respRaw ? 'Pretty' : 'Raw'}
                  </button>
                  <button className="btn-sm btn-sm-ghost" style={{ fontSize: 10, height: 22, padding: '0 7px' }}
                    onClick={async () => {
                      let ok = false
                      try {
                        if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(response.body); ok = true }
                      } catch {}
                      if (!ok) {
                        try {
                          const ta = document.createElement('textarea'); ta.value = response.body; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); ok = true
                        } catch {}
                      }
                      if (ok) { setCopiedBody(true); setTimeout(() => setCopiedBody(false), 2000) }
                    }}>
                    {copiedBody ? '✓ Copied!' : 'Copy'}
                  </button>
                  <button className="btn-sm btn-sm-ghost" style={{ fontSize: 10, height: 22, padding: '0 7px' }}
                    onClick={() => {
                      const blob = new Blob([response.body], { type: 'text/plain' })
                      const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
                      a.download = 'response.txt'; a.click(); URL.revokeObjectURL(a.href)
                    }}>
                    Download
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {sendError && (
          <div className="response-body" style={{ color: 'var(--error)' }}>
            {sendError}
          </div>
        )}

        {!response && !sendError && (
          <div className="response-empty">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
              style={{ color: 'var(--text-subtle)', marginBottom: '4px' }}>
              <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
            <span>Enter a URL and hit Send</span>
          </div>
        )}

        {response && activeRespTab === 'body' && (
          <div className="response-body" aria-live="polite">
            {formattedResponseBody != null
              ? formattedResponseBody
              : <span style={{ color: 'var(--text-subtle)', fontStyle: 'italic' }}>Empty body</span>}
          </div>
        )}

        {response && activeRespTab === 'aiExplain' && (
          <div style={{ padding: '16px 20px', overflowY: 'auto' }}>
            <ExplainResponsePanel response={response} />
          </div>
        )}

        {response && activeRespTab === 'respHeaders' && (
          <div className="tab-content" style={{ padding: '12px 16px' }}>
            {Object.keys(response.headers || {}).length === 0 ? (
              <div style={{ fontSize: '13px', color: 'var(--text-subtle)' }}>No headers returned</div>
            ) : (
              <table className="kv-table">
                <thead><tr><th>Header</th><th>Value</th></tr></thead>
                <tbody>
                  {Object.entries(response.headers).map(([k, v]) => (
                    <tr key={k}>
                      <td><span className="kv-input" style={{ display: 'block', color: 'var(--text-secondary)', background: 'transparent', border: 'none', padding: '4px 8px' }}>{k}</span></td>
                      <td><span className="kv-input" style={{ display: 'block', color: 'var(--text-muted)', background: 'transparent', border: 'none', padding: '4px 8px', wordBreak: 'break-all' }}>{v}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      <HistoryPanel requestId={request?.id} onSelectRun={handleSelectHistoryRun} />

      {/* ── APIForge Spring AI Assistant Workbench Modal ── */}
      <AIAssistantModal
        isOpen={showAiModal}
        initialTool={aiModalInitialTool}
        onClose={() => setShowAiModal(false)}
        requestId={request?.id}
        requestName={name}
        url={url}
        method={method}
        headers={headers}
        body={body}
        response={response}
        environmentId={activeEnvironment?.id}
        environmentName={activeEnvironment?.name}
        onApplyBody={handleApplyBodyFromAI}
        onApplyHeaders={handleApplyHeadersFromAI}
        onSaveFirst={handleSaveForAI}
      />
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
