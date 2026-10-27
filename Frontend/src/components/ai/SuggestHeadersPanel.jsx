import { useState, useEffect } from 'react'
import { suggestHeadersApi } from '../../api/aiApi'
import { SparklesIcon, CopyIcon, CheckIcon, HeadersIcon, ArrowPathIcon, ExclamationTriangleIcon, PlusIcon } from './aiIcons'

export default function SuggestHeadersPanel({
  url,
  method,
  body,
  existingHeaders,
  onApplyHeaders,
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [suggestions, setSuggestions] = useState(null)
  const [selectedHeaders, setSelectedHeaders] = useState({})
  const [copiedKey, setCopiedKey] = useState(null)
  const [appliedCount, setAppliedCount] = useState(null)

  // Serialize existing headers to Map/JSON format expected by backend DTO
  const getExistingHeadersJson = () => {
    if (!existingHeaders || !Array.isArray(existingHeaders)) return null
    const obj = {}
    existingHeaders
      .filter((h) => h.enabled && h.key?.trim())
      .forEach((h) => {
        obj[h.key.trim()] = h.value?.trim() || ''
      })
    return Object.keys(obj).length > 0 ? JSON.stringify(obj) : null
  }

  const handleFetchSuggestions = async () => {
    if (!url || !url.trim()) {
      setError('Please provide a Request URL before asking for header suggestions.')
      return
    }

    setLoading(true)
    setError(null)
    setAppliedCount(null)

    // Backend size limits:
    // url max 2000, requestBody max 20000, existingHeaders max 10000
    const safeUrl = url.trim().slice(0, 2000)
    const safeBody = body ? body.trim().slice(0, 19500) : null
    const safeHeaders = getExistingHeadersJson()?.slice(0, 9500) || null

    try {
      const res = await suggestHeadersApi(safeUrl, method, safeBody, safeHeaders)
      const data = res.data
      setSuggestions(data)

      // Pre-select all suggested headers by default
      const initialSelected = {}
      ;(data?.headers || []).forEach((h, idx) => {
        initialSelected[idx] = true
      })
      setSelectedHeaders(initialSelected)
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch header suggestions.')
    } finally {
      setLoading(false)
    }
  }

  // Auto-fetch if not yet fetched and URL is available
  useEffect(() => {
    if (url && url.trim() && !suggestions && !loading && !error) {
      handleFetchSuggestions()
    }
  }, [url])

  const handleToggleSelect = (index) => {
    setSelectedHeaders((prev) => ({
      ...prev,
      [index]: !prev[index],
    }))
  }

  const handleSelectAll = (select) => {
    const updated = {}
    ;(suggestions?.headers || []).forEach((_, idx) => {
      updated[idx] = select
    })
    setSelectedHeaders(updated)
  }

  const handleCopy = async (text, id) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text)
      } else {
        const ta = document.createElement('textarea')
        ta.value = text
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
      }
      setCopiedKey(id)
      setTimeout(() => setCopiedKey(null), 2000)
    } catch {}
  }

  const handleApplySelected = () => {
    if (!suggestions?.headers || !onApplyHeaders) return
    const toApply = suggestions.headers.filter((_, idx) => selectedHeaders[idx])
    if (toApply.length === 0) return

    onApplyHeaders(toApply)
    setAppliedCount(toApply.length)
    setTimeout(() => setAppliedCount(null), 3000)
  }

  const handleApplySingle = (header) => {
    if (!onApplyHeaders) return
    onApplyHeaders([header])
    setAppliedCount(1)
    setTimeout(() => setAppliedCount(null), 2500)
  }

  const selectedCount = Object.values(selectedHeaders).filter(Boolean).length
  const totalCount = suggestions?.headers?.length || 0

  return (
    <div className="ai-panel">
      <div className="ai-panel-header">
        <div>
          <h3 className="ai-panel-title">
            <HeadersIcon size={18} style={{ color: 'var(--orange)' }} />
            AI Header Suggestions
          </h3>
          <p className="ai-panel-desc">
            Analyze your endpoint, HTTP method, and payload to recommend appropriate headers and authentication.
          </p>
        </div>
        <button
          type="button"
          className="btn-sm btn-sm-primary"
          onClick={handleFetchSuggestions}
          disabled={loading || !url?.trim()}
        >
          {loading ? (
            <>
              <ArrowPathIcon size={14} className="spinner" /> Analyzing…
            </>
          ) : (
            <>
              <SparklesIcon size={14} /> Suggest Headers
            </>
          )}
        </button>
      </div>

      <div className="ai-req-context-badge" style={{ marginBottom: '14px' }}>
        <strong>Request Context:</strong> {method} {url || '(no URL specified)'}
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '14px' }}>
          {error}
        </div>
      )}

      {loading && (
        <div className="ai-loading-container">
          <div className="ai-spinner-sparkle">
            <HeadersIcon size={28} />
          </div>
          <span>Analyzing request parameters and recommending headers…</span>
        </div>
      )}

      {!loading && !suggestions && !error && (
        <div className="empty-state" style={{ padding: '30px 10px' }}>
          <div className="empty-state-icon">
            <HeadersIcon size={26} />
          </div>
          <div className="empty-state-title">No Header Suggestions Yet</div>
          <div className="empty-state-desc">
            Click &quot;Suggest Headers&quot; above to inspect the active request and generate recommended headers.
          </div>
        </div>
      )}

      {suggestions && !loading && (
        <>
          {suggestions.authenticationSuggestion && (
            <div className="ai-info-card">
              <SparklesIcon size={16} style={{ color: 'var(--accent-blue)', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '2px' }}>
                  Authentication Guidance
                </strong>
                {suggestions.authenticationSuggestion}
              </div>
            </div>
          )}

          {suggestions.explanation && (
            <div className="ai-info-card" style={{ borderLeftColor: 'var(--orange)' }}>
              <div>
                <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '2px' }}>
                  AI Analysis
                </strong>
                {suggestions.explanation}
              </div>
            </div>
          )}

          {suggestions.headers && suggestions.headers.length > 0 ? (
            <div className="ai-preview-box" style={{ marginTop: '10px' }}>
              <div className="ai-preview-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    id="select-all-headers"
                    checked={totalCount > 0 && selectedCount === totalCount}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    style={{ accentColor: 'var(--orange)', cursor: 'pointer' }}
                    aria-label="Select all suggested headers"
                  />
                  <label htmlFor="select-all-headers" style={{ cursor: 'pointer', userSelect: 'none' }}>
                    Suggested Headers ({selectedCount}/{totalCount} selected)
                  </label>
                </div>
                <div className="ai-preview-actions">
                  <button
                    type="button"
                    className="btn-sm btn-sm-primary"
                    disabled={selectedCount === 0}
                    onClick={handleApplySelected}
                    style={{ height: '24px', fontSize: '11px', padding: '0 8px' }}
                  >
                    {appliedCount ? (
                      <>
                        <CheckIcon size={12} /> Applied {appliedCount}!
                      </>
                    ) : (
                      <>
                        <PlusIcon size={12} /> Apply Selected ({selectedCount})
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table className="ai-headers-table">
                  <thead>
                    <tr>
                      <th style={{ width: '30px' }}></th>
                      <th style={{ width: '22%' }}>Header</th>
                      <th style={{ width: '30%' }}>Value</th>
                      <th>Reason</th>
                      <th style={{ width: '90px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {suggestions.headers.map((h, idx) => (
                      <tr key={idx}>
                        <td>
                          <input
                            type="checkbox"
                            checked={!!selectedHeaders[idx]}
                            onChange={() => handleToggleSelect(idx)}
                            style={{ accentColor: 'var(--orange)', cursor: 'pointer' }}
                            aria-label={`Select ${h.name}`}
                          />
                        </td>
                        <td>
                          <div className="ai-header-name">
                            <span>{h.name}</span>
                            <button
                              type="button"
                              className="btn-icon"
                              style={{ padding: '2px' }}
                              onClick={() => handleCopy(h.name, `name-${idx}`)}
                              title="Copy header name"
                            >
                              {copiedKey === `name-${idx}` ? (
                                <CheckIcon size={11} style={{ color: 'var(--success)' }} />
                              ) : (
                                <CopyIcon size={11} />
                              )}
                            </button>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span className="ai-header-value">{h.value}</span>
                            <button
                              type="button"
                              className="btn-icon"
                              style={{ padding: '2px' }}
                              onClick={() => handleCopy(h.value, `val-${idx}`)}
                              title="Copy header value"
                            >
                              {copiedKey === `val-${idx}` ? (
                                <CheckIcon size={11} style={{ color: 'var(--success)' }} />
                              ) : (
                                <CopyIcon size={11} />
                              )}
                            </button>
                          </div>
                        </td>
                        <td>
                          <span className="ai-header-reason">{h.reason}</span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            className="btn-icon-xs"
                            onClick={() => handleApplySingle(h)}
                            title="Add header to request"
                          >
                            <PlusIcon size={11} /> Add
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="ai-info-card" style={{ marginTop: '12px' }}>
              <span>No additional headers recommended for this request.</span>
            </div>
          )}
        </>
      )}
    </div>
  )
}
