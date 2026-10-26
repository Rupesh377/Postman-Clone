import { useState, useEffect } from 'react'
import { explainResponseApi } from '../../api/aiApi'
import { SparklesIcon, CopyIcon, CheckIcon, ArrowPathIcon, ExclamationTriangleIcon } from './aiIcons'

function statusBadgeInfo(statusCode) {
  if (!statusCode) return { label: 'None', className: 'badge-info' }
  if (statusCode >= 200 && statusCode < 300) return { label: 'Success', className: 'badge-success' }
  if (statusCode >= 300 && statusCode < 400) return { label: 'Redirection', className: 'badge-info' }
  if (statusCode >= 400 && statusCode < 500) return { label: 'Client Error', className: 'badge-warning' }
  return { label: 'Server Error', className: 'badge-warning' }
}

export default function ExplainResponsePanel({ response }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [explanationData, setExplanationData] = useState(null)
  const [copiedSection, setCopiedSection] = useState(null)

  const statusCode = response?.status
  const responseBody = response?.body
  const responseHeaders = response?.headers

  const hasValidResponse = statusCode != null && statusCode >= 100 && statusCode <= 599

  const handleExplain = async () => {
    if (!hasValidResponse) {
      setError('No valid HTTP response found to explain. Please send an API request first.')
      return
    }

    setLoading(true)
    setError(null)

    // Backend size limits:
    // statusCode: 100-599
    // responseBody: max 20000
    // responseHeaders: max 10000
    const safeBody = responseBody ? String(responseBody).slice(0, 19500) : null
    let safeHeaders = null
    if (responseHeaders && typeof responseHeaders === 'object') {
      try {
        safeHeaders = JSON.stringify(responseHeaders).slice(0, 9500)
      } catch {}
    }

    try {
      const res = await explainResponseApi(statusCode, safeBody, safeHeaders)
      setExplanationData(res.data)
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to explain response.')
    } finally {
      setLoading(false)
    }
  }

  // Auto-fetch if not yet fetched and valid response exists
  useEffect(() => {
    if (hasValidResponse && !explanationData && !loading && !error) {
      handleExplain()
    }
  }, [statusCode, responseBody])

  const handleCopy = async (text, sectionKey) => {
    if (!text) return
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
      setCopiedSection(sectionKey)
      setTimeout(() => setCopiedSection(null), 2000)
    } catch {}
  }

  const badge = statusBadgeInfo(statusCode)

  // Split fixes into items if formatted as lines/bullets
  const renderFixes = (fixes) => {
    if (!fixes) return <span>No specific fixes suggested.</span>
    if (Array.isArray(fixes)) {
      return (
        <ul className="ai-fixes-list">
          {fixes.map((fix, idx) => (
            <li key={idx}>{fix}</li>
          ))}
        </ul>
      )
    }
    // String - could have newlines, bullets, or numbered points
    const lines = fixes.split('\n').filter((l) => l.trim().length > 0)
    if (lines.length > 1) {
      return (
        <ul className="ai-fixes-list">
          {lines.map((line, idx) => {
            const clean = line.replace(/^[-*•\d.]+\s*/, '')
            return <li key={idx}>{clean}</li>
          })}
        </ul>
      )
    }
    return <p style={{ margin: 0 }}>{fixes}</p>
  }

  return (
    <div className="ai-panel">
      <div className="ai-panel-header">
        <div>
          <h3 className="ai-panel-title">
            <SparklesIcon size={18} style={{ color: 'var(--orange)' }} />
            AI Response Explainer
          </h3>
          <p className="ai-panel-desc">
            Deep-dive into the latest HTTP response, detect root causes, and get actionable troubleshooting steps.
          </p>
        </div>
        {hasValidResponse && (
          <button
            type="button"
            className="btn-sm btn-sm-primary"
            onClick={handleExplain}
            disabled={loading}
          >
            {loading ? (
              <>
                <ArrowPathIcon size={14} className="spinner" /> Analyzing…
              </>
            ) : (
              <>
                <SparklesIcon size={14} /> Re-analyze Response
              </>
            )}
          </button>
        )}
      </div>

      {!hasValidResponse ? (
        <div className="empty-state" style={{ padding: '36px 12px' }}>
          <div className="empty-state-icon">
            <ExclamationTriangleIcon size={28} />
          </div>
          <div className="empty-state-title">No Response Available Yet</div>
          <div className="empty-state-desc">
            Send an API request using the URL bar first. Once a response is received, the AI will automatically explain the HTTP status, potential causes, and solutions.
          </div>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
            <div className="ai-req-context-badge">
              <strong>Status Code:</strong>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{statusCode}</span>
              <span className={`ai-explain-card-badge ${badge.className}`}>{badge.label}</span>
            </div>
            {response?.time != null && (
              <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                Time: <strong>{response.time}ms</strong>
              </span>
            )}
            {response?.size != null && (
              <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                Size: <strong>{response.size} B</strong>
              </span>
            )}
          </div>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: '14px' }}>
              {error}
            </div>
          )}

          {loading && (
            <div className="ai-loading-container">
              <div className="ai-spinner-sparkle">
                <SparklesIcon size={28} />
              </div>
              <span>Analyzing HTTP {statusCode} response and diagnosing possible issues…</span>
            </div>
          )}

          {explanationData && !loading && (
            <div className="ai-explainer-sections">
              {/* 1. Response Explanation */}
              <div className="ai-explain-card">
                <div className="ai-explain-card-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="ai-explain-card-badge badge-info">1. Overview</span>
                    <span>Response Explanation</span>
                  </div>
                  <button
                    type="button"
                    className="btn-icon-xs"
                    onClick={() => handleCopy(explanationData.explanation, 'explanation')}
                    title="Copy explanation"
                  >
                    {copiedSection === 'explanation' ? (
                      <CheckIcon size={12} style={{ color: 'var(--success)' }} />
                    ) : (
                      <CopyIcon size={12} />
                    )}
                    <span>{copiedSection === 'explanation' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="ai-explain-card-body">
                  <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{explanationData.explanation}</p>
                </div>
              </div>

              {/* 2. Possible Cause */}
              <div className="ai-explain-card" style={{ borderColor: 'rgba(227, 179, 65, 0.3)' }}>
                <div className="ai-explain-card-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="ai-explain-card-badge badge-warning">2. Inferred Reason</span>
                    <span>Possible Cause</span>
                  </div>
                  <button
                    type="button"
                    className="btn-icon-xs"
                    onClick={() => handleCopy(explanationData.possibleCause, 'cause')}
                    title="Copy possible cause"
                  >
                    {copiedSection === 'cause' ? (
                      <CheckIcon size={12} style={{ color: 'var(--success)' }} />
                    ) : (
                      <CopyIcon size={12} />
                    )}
                    <span>{copiedSection === 'cause' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="ai-explain-card-body">
                  <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{explanationData.possibleCause}</p>
                  <div style={{ marginTop: '10px', fontSize: '11px', color: 'var(--text-subtle)' }}>
                    * Note: This is an AI inference based on typical HTTP patterns, not a definitive internal server log.
                  </div>
                </div>
              </div>

              {/* 3. Suggested Fixes */}
              <div className="ai-explain-card" style={{ borderColor: 'rgba(63, 185, 80, 0.3)' }}>
                <div className="ai-explain-card-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="ai-explain-card-badge badge-success">3. Troubleshooting</span>
                    <span>Suggested Fixes & Action Items</span>
                  </div>
                  <button
                    type="button"
                    className="btn-icon-xs"
                    onClick={() => handleCopy(explanationData.suggestedFixes, 'fixes')}
                    title="Copy suggested fixes"
                  >
                    {copiedSection === 'fixes' ? (
                      <CheckIcon size={12} style={{ color: 'var(--success)' }} />
                    ) : (
                      <CopyIcon size={12} />
                    )}
                    <span>{copiedSection === 'fixes' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="ai-explain-card-body">
                  {renderFixes(explanationData.suggestedFixes)}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
