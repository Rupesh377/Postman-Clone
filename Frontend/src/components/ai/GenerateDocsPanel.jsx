import { useState } from 'react'
import { generateDocsApi } from '../../api/aiApi'
import { SparklesIcon, CopyIcon, CheckIcon, DocumentTextIcon, ArrowPathIcon, DownloadIcon } from './aiIcons'
import MarkdownViewer from './MarkdownViewer'

export default function GenerateDocsPanel({
  url,
  method,
  headers,
  body,
  response,
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [documentation, setDocumentation] = useState('')
  const [copied, setCopied] = useState(false)

  const statusCode = response?.status >= 100 && response?.status <= 599 ? response.status : null
  const responseBody = response?.body || null

  const getHeadersJson = () => {
    if (!headers || !Array.isArray(headers)) return null
    const obj = {}
    headers
      .filter((h) => h.enabled && h.key?.trim())
      .forEach((h) => {
        obj[h.key.trim()] = h.value?.trim() || ''
      })
    return Object.keys(obj).length > 0 ? JSON.stringify(obj) : null
  }

  const handleGenerateDocs = async () => {
    if (!url || !url.trim()) {
      setError('Please provide a Request URL before generating documentation.')
      return
    }

    setLoading(true)
    setError(null)

    // Backend validation limits:
    // url: max 2000
    // method: not blank
    // requestHeaders: max 10000
    // requestBody: max 20000
    // responseStatusCode: 100-599
    // responseBody: max 20000
    const safeUrl = url.trim().slice(0, 2000)
    const safeReqHeaders = getHeadersJson()?.slice(0, 9500) || null
    const safeReqBody = body ? body.trim().slice(0, 19500) : null
    const safeRespBody = responseBody ? String(responseBody).slice(0, 19500) : null

    try {
      const res = await generateDocsApi(
        safeUrl,
        method,
        safeReqHeaders,
        safeReqBody,
        statusCode,
        safeRespBody
      )
      setDocumentation(res.data.documentation || '')
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to generate API documentation.')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    if (!documentation) return
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(documentation)
      } else {
        const ta = document.createElement('textarea')
        ta.value = documentation
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
      }
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  const handleDownload = () => {
    if (!documentation) return
    try {
      const blob = new Blob([documentation], { type: 'text/markdown;charset=utf-8' })
      const downloadUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      const filename = `${method.toLowerCase()}_api_docs.md`
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(downloadUrl)
    } catch {}
  }

  return (
    <div className="ai-panel">
      <div className="ai-panel-header">
        <div>
          <h3 className="ai-panel-title">
            <DocumentTextIcon size={18} style={{ color: 'var(--orange)' }} />
            AI API Documentation Generator
          </h3>
          <p className="ai-panel-desc">
            Automatically produce complete, developer-ready Markdown documentation from your active request and response.
          </p>
        </div>
        <button
          type="button"
          className="btn-sm btn-sm-primary"
          onClick={handleGenerateDocs}
          disabled={loading || !url?.trim()}
        >
          {loading ? (
            <>
              <ArrowPathIcon size={14} className="spinner" /> Generating Docs…
            </>
          ) : (
            <>
              <SparklesIcon size={14} /> Generate Documentation
            </>
          )}
        </button>
      </div>

      {/* Request & Response Summary Pills */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
        <div className="ai-req-context-badge">
          <strong>Endpoint:</strong> {method} {url || '(no URL)'}
        </div>
        <div className="ai-req-context-badge">
          <strong>Request Body:</strong> {body && body.trim() ? `${body.length} chars` : 'None'}
        </div>
        <div className="ai-req-context-badge">
          <strong>Response:</strong>{' '}
          {statusCode ? (
            <span style={{ color: 'var(--success)', fontWeight: 600 }}>{statusCode}</span>
          ) : (
            <span style={{ color: 'var(--text-subtle)' }}>Not executed yet</span>
          )}
        </div>
      </div>

      {!statusCode && (
        <div className="ai-warning-card">
          💡 <strong>Tip:</strong> Executing the request first provides sample response payloads, status codes, and headers, making the generated documentation much more comprehensive.
        </div>
      )}

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '14px' }}>
          {error}
        </div>
      )}

      {loading && (
        <div className="ai-loading-container">
          <div className="ai-spinner-sparkle">
            <DocumentTextIcon size={28} />
          </div>
          <span>Writing API documentation in Markdown with Spring AI…</span>
        </div>
      )}

      {!loading && !documentation && !error && (
        <div className="empty-state" style={{ padding: '36px 12px' }}>
          <div className="empty-state-icon">
            <DocumentTextIcon size={26} />
          </div>
          <div className="empty-state-title">No Documentation Generated Yet</div>
          <div className="empty-state-desc">
            Click &quot;Generate Documentation&quot; to synthesize request structure, headers, response schemas, and usage notes into standard Markdown.
          </div>
        </div>
      )}

      {documentation && !loading && (
        <div className="ai-preview-box" style={{ marginTop: '12px' }}>
          <div className="ai-preview-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <DocumentTextIcon size={14} />
              <span>Generated API Documentation (Markdown)</span>
            </div>
            <div className="ai-preview-actions">
              <button
                type="button"
                className="btn-icon-xs"
                onClick={handleCopy}
                title="Copy markdown text"
              >
                {copied ? <CheckIcon size={12} style={{ color: 'var(--success)' }} /> : <CopyIcon size={12} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
              <button
                type="button"
                className="btn-icon-xs"
                onClick={handleDownload}
                title="Download as .md file"
              >
                <DownloadIcon size={12} />
                <span>Download .md</span>
              </button>
            </div>
          </div>
          <div style={{ padding: '16px 20px', maxHeight: '480px', overflowY: 'auto' }}>
            <MarkdownViewer content={documentation} />
          </div>
        </div>
      )}
    </div>
  )
}
