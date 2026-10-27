import { useState } from 'react'
import { generateTestsApi } from '../../api/aiApi'
import { SparklesIcon, BeakerIcon, ArrowPathIcon, PlusIcon, CheckIcon } from './aiIcons'

export default function GenerateTestsPanel({
  url,
  method,
  body,
  response,
  onTransferToRunner,
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [testCases, setTestCases] = useState(null)
  const [expectedStatusCode, setExpectedStatusCode] = useState(
    response?.status >= 100 && response?.status <= 599 ? response.status : 200
  )
  const [transferred, setTransferred] = useState(false)

  const sampleResponseBody = response?.body || ''

  const handleGenerate = async () => {
    if (!url || !url.trim()) {
      setError('Please provide a Request URL before generating test cases.')
      return
    }

    setLoading(true)
    setError(null)
    setTransferred(false)

    // Backend size limits:
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

    try {
      const res = await generateTestsApi(safeUrl, method, safeReqBody, safeStatus, safeRespBody)
      setTestCases(res.data.testCases || [])
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to generate test cases.')
    } finally {
      setLoading(false)
    }
  }

  // Convert supported test cases into test assertions for the runner
  const handleTransfer = () => {
    if (!testCases || !onTransferToRunner) return
    const assertions = []

    testCases.forEach((tc) => {
      const type = (tc.testType || '').trim().toUpperCase().replace(/[\s-]+/g, '_')

      if (type.includes('STATUS') || type === 'STATUS_CODE_EQUALS' || type === 'STATUS_CODE') {
        const num = parseInt(tc.expectedResult?.trim(), 10)
        assertions.push({
          type: 'STATUS_CODE_EQUALS',
          description: `${tc.name}: ${tc.description}`,
          expectedStatusCode: isNaN(num) ? 200 : num,
        })
      } else if (type.includes('PERFORMANCE') || type.includes('RESPONSE_TIME')) {
        const num = parseInt(tc.expectedResult?.trim(), 10)
        assertions.push({
          type: 'RESPONSE_TIME_LESS_THAN_MS',
          description: `${tc.name}: ${tc.description}`,
          maxResponseTimeMs: isNaN(num) ? 1000 : num,
        })
      } else if (type.includes('HEADER')) {
        assertions.push({
          type: 'HEADER_CONTAINS',
          description: `${tc.name}: ${tc.description}`,
          headerName: 'Content-Type',
          expectedValue: 'application/json',
        })
      } else {
        // Fallback default status code assertion
        assertions.push({
          type: 'STATUS_CODE_EQUALS',
          description: `${tc.name}: ${tc.description}`,
          expectedStatusCode: 200,
        })
      }
    })

    if (assertions.length > 0) {
      onTransferToRunner(assertions)
      setTransferred(true)
      setTimeout(() => setTransferred(false), 3000)
    }
  }

  return (
    <div className="ai-panel">
      <div className="ai-panel-header">
        <div>
          <h3 className="ai-panel-title">
            <BeakerIcon size={18} style={{ color: 'var(--orange)' }} />
            AI Test Case Generator
          </h3>
          <p className="ai-panel-desc">
            Generate functional test scenarios, status checks, edge cases, and performance criteria for your API.
          </p>
        </div>
        <button
          type="button"
          className="btn-sm btn-sm-primary"
          onClick={handleGenerate}
          disabled={loading || !url?.trim()}
        >
          {loading ? (
            <>
              <ArrowPathIcon size={14} className="spinner" /> Generating…
            </>
          ) : (
            <>
              <SparklesIcon size={14} /> Generate Test Cases
            </>
          )}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginBottom: '14px' }}>
        <div className="field">
          <label className="field-label" htmlFor="ai-expected-status">
            Expected Status Code
          </label>
          <input
            id="ai-expected-status"
            className="field-input"
            type="number"
            min="100"
            max="599"
            value={expectedStatusCode}
            onChange={(e) => setExpectedStatusCode(e.target.value)}
            placeholder="e.g. 200, 201, 404"
          />
        </div>
        <div className="field">
          <label className="field-label">Method & Endpoint</label>
          <div className="field-input" style={{ background: 'var(--bg-panel)', color: 'var(--text-secondary)' }}>
            {method} {url || '(no URL)'}
          </div>
        </div>
      </div>

      <div className="ai-info-card" style={{ marginBottom: '14px' }}>
        <span>
          ℹ️ <strong>Note:</strong> Generating test cases creates specification scenarios. To execute them on the live server, you can transfer them to the Test Runner or use 1-Click Generate & Run.
        </span>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '14px' }}>
          {error}
        </div>
      )}

      {loading && (
        <div className="ai-loading-container">
          <div className="ai-spinner-sparkle">
            <BeakerIcon size={28} />
          </div>
          <span>Designing comprehensive API test cases with Spring AI…</span>
        </div>
      )}

      {!loading && !testCases && !error && (
        <div className="empty-state" style={{ padding: '36px 12px' }}>
          <div className="empty-state-icon">
            <BeakerIcon size={26} />
          </div>
          <div className="empty-state-title">No Test Cases Generated Yet</div>
          <div className="empty-state-desc">
            Click &quot;Generate Test Cases&quot; to have Spring AI suggest positive, negative, and performance test scenarios.
          </div>
        </div>
      )}

      {testCases && !loading && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Generated Test Cases ({testCases.length})
            </span>
            {onTransferToRunner && testCases.length > 0 && (
              <button
                type="button"
                className="btn-sm btn-sm-ghost"
                onClick={handleTransfer}
                style={{ height: '26px', fontSize: '11.5px', color: 'var(--orange)', borderColor: 'rgba(255, 108, 55, 0.4)' }}
              >
                {transferred ? (
                  <>
                    <CheckIcon size={12} style={{ color: 'var(--success)' }} /> Transferred to Runner!
                  </>
                ) : (
                  <>
                    <PlusIcon size={12} /> Convert to Executable Assertions
                  </>
                )}
              </button>
            )}
          </div>

          {testCases.length === 0 ? (
            <div className="ai-info-card">No test cases returned from AI service.</div>
          ) : (
            <div className="ai-test-cases-grid">
              {testCases.map((tc, idx) => (
                <div key={idx} className="ai-test-case-card">
                  <div className="ai-test-case-header">
                    <span className="ai-test-case-name">{tc.name}</span>
                    <span className="ai-test-type-pill">{tc.testType}</span>
                  </div>
                  <div className="ai-test-case-desc">{tc.description}</div>
                  <div className="ai-test-case-expected">
                    <strong style={{ color: 'var(--text-primary)' }}>Expected:</strong> {tc.expectedResult}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
