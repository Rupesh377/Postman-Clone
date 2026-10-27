import { useState } from 'react'
import { generateAndRunTestsApi } from '../../api/aiApi'
import {
  BoltIcon,
  PlayIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  SparklesIcon,
} from './aiIcons'

export default function GenerateAndRunTestsPanel({
  requestId,
  requestName,
  url,
  method,
  body,
  response,
  environmentId,
  environmentName,
  onSaveFirst,
}) {
  const [running, setRunning] = useState(false)
  const [error, setError] = useState(null)
  const [results, setResults] = useState(null)
  const [expectedStatusCode, setExpectedStatusCode] = useState(
    response?.status >= 100 && response?.status <= 599 ? response.status : 200
  )

  const sampleResponseBody = response?.body || ''

  const handleGenerateAndRun = async () => {
    if (!url || !url.trim()) {
      setError('A Request URL is required.')
      return
    }

    let targetRequestId = requestId
    if (!targetRequestId) {
      if (onSaveFirst) {
        try {
          const saved = await onSaveFirst()
          targetRequestId = saved?.id
        } catch (saveErr) {
          setError(saveErr.message || 'Please save this request to a collection before running tests.')
          return
        }
      } else {
        setError('Please save this request to a collection before running tests.')
        return
      }
    }

    if (!targetRequestId) {
      setError('A saved request ID is required to execute server-side tests.')
      return
    }

    setRunning(true)
    setError(null)
    setResults(null)

    // Backend GenerateTestsRequestDTO size limits:
    // url: max 2000
    // method: not blank
    // requestBody: max 20000
    // expectedStatusCode: 100-599
    // sampleResponseBody: max 20000
    const safeUrl = url.trim().slice(0, 2000)
    const safeReqBody = body ? body.trim().slice(0, 19500) : null
    const safeRespBody = sampleResponseBody ? String(sampleResponseBody).slice(0, 19500) : null
    const safeStatus = Number(expectedStatusCode) >= 100 && Number(expectedStatusCode) <= 599
      ? Number(expectedStatusCode)
      : undefined

    const payload = {
      url: safeUrl,
      method,
      requestBody: safeReqBody,
      expectedStatusCode: safeStatus,
      sampleResponseBody: safeRespBody,
    }

    try {
      const res = await generateAndRunTestsApi(targetRequestId, payload, environmentId)
      setResults(res.data)
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Generate and run tests workflow failed.')
    } finally {
      setRunning(false)
    }
  }

  const passRate = results && results.totalTests > 0
    ? Math.round((results.passed / results.totalTests) * 100)
    : 0

  return (
    <div className="ai-panel">
      <div className="ai-panel-header">
        <div>
          <h3 className="ai-panel-title">
            <BoltIcon size={18} style={{ color: 'var(--orange)' }} />
            1-Click Generate & Run Tests
          </h3>
          <p className="ai-panel-desc">
            Spring AI analyzes your endpoint and payloads, automatically constructs assertions, and immediately executes them against your live server.
          </p>
        </div>
        <button
          type="button"
          className="btn-sm btn-sm-primary"
          onClick={handleGenerateAndRun}
          disabled={running || !url?.trim()}
          style={{ minWidth: '160px', height: '32px' }}
        >
          {running ? (
            <>
              <ArrowPathIcon size={14} className="spinner" /> Generating & Running…
            </>
          ) : (
            <>
              <BoltIcon size={14} /> Generate & Run Tests
            </>
          )}
        </button>
      </div>

      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap' }}>
        <div className="ai-req-context-badge">
          <strong>Request:</strong> {requestName || (requestId ? `ID: ${requestId}` : 'Unsaved Request')}
        </div>
        <div className="ai-req-context-badge">
          <strong>Target:</strong> {method} {url || '(no URL)'}
        </div>
        <div className="ai-req-context-badge">
          <strong>Environment:</strong> {environmentName || (environmentId ? `ID: ${environmentId}` : 'None (Default)')}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginBottom: '14px' }}>
        <div className="field">
          <label className="field-label" htmlFor="gen-run-status">
            Target Expected Status
          </label>
          <input
            id="gen-run-status"
            className="field-input"
            type="number"
            min="100"
            max="599"
            value={expectedStatusCode}
            onChange={(e) => setExpectedStatusCode(e.target.value)}
            placeholder="200"
          />
        </div>
        <div className="field">
          <label className="field-label">Sample Response</label>
          <div className="field-input" style={{ background: 'var(--bg-panel)', color: 'var(--text-muted)' }}>
            {sampleResponseBody ? `${sampleResponseBody.length} characters` : 'None (will use method/URL)'}
          </div>
        </div>
      </div>

      {!requestId && (
        <div className="ai-warning-card">
          ⚠️ <strong>Notice:</strong> This request has unsaved changes or is not yet saved to a collection. Triggering &quot;Generate & Run&quot; will automatically save it so the server can execute against it.
        </div>
      )}

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '14px' }}>
          {error}
        </div>
      )}

      {running && (
        <div className="ai-loading-container">
          <div className="ai-spinner-sparkle">
            <SparklesIcon size={30} />
          </div>
          <span>Spring AI is generating test cases, building assertions, and executing live tests…</span>
        </div>
      )}

      {results && !running && (
        <div className="ai-preview-box">
          <div className="ai-preview-header">
            <span>Execution Summary & Results</span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Pass Rate: <strong>{passRate}%</strong>
            </span>
          </div>

          <div className="ai-results-summary" style={{ margin: '12px' }}>
            <div className="ai-results-stats">
              <div className="ai-stat-item">
                <span className="ai-stat-label">Total Tests</span>
                <span className="ai-stat-value">{results.totalTests}</span>
              </div>
              <div className="ai-stat-item">
                <span className="ai-stat-label">Passed</span>
                <span className="ai-stat-value passed">{results.passed}</span>
              </div>
              <div className="ai-stat-item">
                <span className="ai-stat-label">Failed</span>
                <span className="ai-stat-value failed">{results.failed}</span>
              </div>
            </div>

            <div style={{ width: '140px' }}>
              <div style={{ height: '8px', background: 'var(--bg-input)', borderRadius: '4px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${passRate}%`,
                    height: '100%',
                    background: passRate === 100 ? 'var(--success)' : passRate > 50 ? 'var(--warning)' : 'var(--error)',
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>
            </div>
          </div>

          <div style={{ padding: '0 12px 12px' }}>
            {results.results?.map((res, idx) => (
              <div key={idx} className={`ai-result-card ${res.passed ? 'passed' : 'failed'}`}>
                <div className="ai-result-card-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className={`ai-result-badge ${res.passed ? 'passed' : 'failed'}`}>
                      {res.passed ? <CheckCircleIcon size={12} /> : <XCircleIcon size={12} />}
                      {res.passed ? 'PASSED' : 'FAILED'}
                    </span>
                    <strong style={{ fontSize: '12.5px', color: 'var(--text-primary)' }}>
                      {res.description || res.assertionType}
                    </strong>
                  </div>
                  <span className="ai-test-type-pill">{res.assertionType}</span>
                </div>

                <div className="ai-result-diff-grid">
                  <div>
                    <div className="ai-diff-col-label">Expected</div>
                    <div className="ai-diff-val">{res.expected ?? '—'}</div>
                  </div>
                  <div>
                    <div className="ai-diff-col-label">Actual</div>
                    <div className="ai-diff-val" style={{ color: res.passed ? 'var(--success)' : 'var(--error)' }}>
                      {res.actual ?? '—'}
                    </div>
                  </div>
                </div>

                {res.message && (
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {res.message}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
