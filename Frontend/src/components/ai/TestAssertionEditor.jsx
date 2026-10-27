import { useState } from 'react'
import { runTestsApi } from '../../api/aiApi'
import {
  BeakerIcon,
  PlayIcon,
  PlusIcon,
  TrashIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
} from './aiIcons'

const ASSERTION_TYPES = [
  { value: 'STATUS_CODE_EQUALS', label: 'Status Code Equals' },
  { value: 'JSON_PATH_EXISTS', label: 'JSON Path Exists' },
  { value: 'JSON_PATH_EQUALS', label: 'JSON Path Equals' },
  { value: 'HEADER_CONTAINS', label: 'Header Contains' },
  { value: 'RESPONSE_TIME_LESS_THAN_MS', label: 'Response Time Less Than (ms)' },
]

const DEFAULT_ASSERTIONS = [
  {
    type: 'STATUS_CODE_EQUALS',
    description: 'Verify HTTP status is 200 OK',
    expectedStatusCode: 200,
  },
  {
    type: 'RESPONSE_TIME_LESS_THAN_MS',
    description: 'Verify response latency under 1500ms',
    maxResponseTimeMs: 1500,
  },
]

export default function TestAssertionEditor({
  requestId,
  requestName,
  environmentId,
  environmentName,
  onSaveFirst,
  initialAssertions,
}) {
  const [assertions, setAssertions] = useState(
    initialAssertions && initialAssertions.length > 0 ? initialAssertions : DEFAULT_ASSERTIONS
  )
  const [running, setRunning] = useState(false)
  const [error, setError] = useState(null)
  const [results, setResults] = useState(null)

  const handleAddAssertion = (type = 'STATUS_CODE_EQUALS') => {
    const newAssertion = {
      type,
      description: '',
    }
    if (type === 'STATUS_CODE_EQUALS') newAssertion.expectedStatusCode = 200
    if (type === 'JSON_PATH_EXISTS') newAssertion.jsonPath = '$.id'
    if (type === 'JSON_PATH_EQUALS') {
      newAssertion.jsonPath = '$.status'
      newAssertion.expectedValue = 'success'
    }
    if (type === 'HEADER_CONTAINS') {
      newAssertion.headerName = 'Content-Type'
      newAssertion.expectedValue = 'application/json'
    }
    if (type === 'RESPONSE_TIME_LESS_THAN_MS') newAssertion.maxResponseTimeMs = 1000

    setAssertions((prev) => [...prev, newAssertion])
  }

  const handleUpdateAssertion = (index, field, value) => {
    setAssertions((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item
        const updated = { ...item, [field]: value }

        // If type changed, reset specific fields
        if (field === 'type') {
          delete updated.expectedStatusCode
          delete updated.jsonPath
          delete updated.expectedValue
          delete updated.headerName
          delete updated.maxResponseTimeMs

          if (value === 'STATUS_CODE_EQUALS') updated.expectedStatusCode = 200
          if (value === 'JSON_PATH_EXISTS') updated.jsonPath = '$.id'
          if (value === 'JSON_PATH_EQUALS') {
            updated.jsonPath = '$.status'
            updated.expectedValue = 'success'
          }
          if (value === 'HEADER_CONTAINS') {
            updated.headerName = 'Content-Type'
            updated.expectedValue = 'application/json'
          }
          if (value === 'RESPONSE_TIME_LESS_THAN_MS') updated.maxResponseTimeMs = 1000
        }
        return updated
      })
    )
  }

  const handleRemoveAssertion = (index) => {
    setAssertions((prev) => prev.filter((_, i) => i !== index))
  }

  const validateAssertions = () => {
    if (assertions.length === 0) {
      return 'At least one test assertion is required.'
    }
    for (let i = 0; i < assertions.length; i++) {
      const a = assertions[i]
      if (a.type === 'STATUS_CODE_EQUALS') {
        const code = Number(a.expectedStatusCode)
        if (isNaN(code) || code < 100 || code > 599) {
          return `Assertion #${i + 1}: Expected status code must be between 100 and 599.`
        }
      }
      if (a.type === 'JSON_PATH_EXISTS') {
        if (!a.jsonPath || !a.jsonPath.trim()) {
          return `Assertion #${i + 1}: JSON path cannot be empty.`
        }
      }
      if (a.type === 'JSON_PATH_EQUALS') {
        if (!a.jsonPath || !a.jsonPath.trim()) {
          return `Assertion #${i + 1}: JSON path cannot be empty.`
        }
        if (a.expectedValue === undefined || a.expectedValue === null) {
          return `Assertion #${i + 1}: Expected value is required.`
        }
      }
      if (a.type === 'HEADER_CONTAINS') {
        if (!a.headerName || !a.headerName.trim()) {
          return `Assertion #${i + 1}: Header name is required.`
        }
        if (a.expectedValue === undefined || a.expectedValue === null) {
          return `Assertion #${i + 1}: Expected header value is required.`
        }
      }
      if (a.type === 'RESPONSE_TIME_LESS_THAN_MS') {
        const time = Number(a.maxResponseTimeMs)
        if (isNaN(time) || time <= 0) {
          return `Assertion #${i + 1}: Maximum response time must be a positive number.`
        }
      }
    }
    return null
  }

  const handleRunTests = async () => {
    // Check if request is saved
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

    const validationErr = validateAssertions()
    if (validationErr) {
      setError(validationErr)
      return
    }

    setRunning(true)
    setError(null)
    setResults(null)

    // Prepare payload
    const payload = assertions.map((a) => {
      const item = {
        type: a.type,
        description: a.description ? a.description.slice(0, 500) : undefined,
      }
      if (a.type === 'STATUS_CODE_EQUALS') {
        item.expectedStatusCode = parseInt(a.expectedStatusCode, 10)
      } else if (a.type === 'JSON_PATH_EXISTS') {
        item.jsonPath = a.jsonPath.trim().slice(0, 500)
      } else if (a.type === 'JSON_PATH_EQUALS') {
        item.jsonPath = a.jsonPath.trim().slice(0, 500)
        item.expectedValue = String(a.expectedValue).slice(0, 2000)
      } else if (a.type === 'HEADER_CONTAINS') {
        item.headerName = a.headerName.trim().slice(0, 200)
        item.expectedValue = String(a.expectedValue).slice(0, 2000)
      } else if (a.type === 'RESPONSE_TIME_LESS_THAN_MS') {
        item.maxResponseTimeMs = parseInt(a.maxResponseTimeMs, 10)
      }
      return item
    })

    try {
      const res = await runTestsApi(targetRequestId, payload, environmentId)
      setResults(res.data)
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Execution failed.')
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
            <BeakerIcon size={18} style={{ color: 'var(--orange)' }} />
            API Test Assertions Runner
          </h3>
          <p className="ai-panel-desc">
            Define precise assertions on status codes, JSON paths, headers, and latency, and execute them on the backend test runner.
          </p>
        </div>
        <button
          type="button"
          className="btn-sm btn-sm-primary"
          onClick={handleRunTests}
          disabled={running || assertions.length === 0}
          style={{ minWidth: '120px' }}
        >
          {running ? (
            <>
              <ArrowPathIcon size={14} className="spinner" /> Running…
            </>
          ) : (
            <>
              <PlayIcon size={13} /> Run Tests
            </>
          )}
        </button>
      </div>

      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap' }}>
        <div className="ai-req-context-badge">
          <strong>Request:</strong> {requestName || (requestId ? `ID: ${requestId}` : 'Unsaved Request')}
        </div>
        <div className="ai-req-context-badge">
          <strong>Environment:</strong> {environmentName || (environmentId ? `ID: ${environmentId}` : 'None (Default)')}
        </div>
      </div>

      {!requestId && (
        <div className="ai-warning-card">
          ⚠️ <strong>Notice:</strong> This request has not been saved yet. Running tests will automatically save it to your collection first so the backend test runner can execute it.
        </div>
      )}

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '14px' }}>
          {error}
        </div>
      )}

      {/* ── Test Results Summary Banner (if results exist) ── */}
      {results && (
        <div className="ai-preview-box" style={{ marginBottom: '20px' }}>
          <div className="ai-preview-header">
            <span>Execution Summary</span>
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

      {/* ── Assertion List Editor ── */}
      <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
          Configured Assertions ({assertions.length})
        </span>
        <button
          type="button"
          className="btn-sm btn-sm-ghost"
          onClick={() => handleAddAssertion()}
          style={{ height: '26px', fontSize: '11.5px' }}
        >
          <PlusIcon size={12} /> Add Assertion
        </button>
      </div>

      {assertions.map((a, idx) => (
        <div key={idx} className="ai-assertion-row">
          <div className="ai-assertion-row-top">
            <select
              className="field-select"
              style={{ width: '220px', height: '32px' }}
              value={a.type}
              onChange={(e) => handleUpdateAssertion(idx, 'type', e.target.value)}
              aria-label="Assertion Type"
            >
              {ASSERTION_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>

            <input
              className="field-input"
              style={{ flex: 1, height: '32px' }}
              placeholder="Description (optional)"
              value={a.description || ''}
              onChange={(e) => handleUpdateAssertion(idx, 'description', e.target.value)}
              aria-label="Assertion Description"
            />

            <button
              type="button"
              className="btn-icon"
              onClick={() => handleRemoveAssertion(idx)}
              title="Remove assertion"
              aria-label="Remove assertion"
              style={{ color: 'var(--error)' }}
            >
              <TrashIcon size={15} />
            </button>
          </div>

          {/* Conditional Fields based on Assertion Type */}
          <div className="ai-assertion-grid-fields">
            {a.type === 'STATUS_CODE_EQUALS' && (
              <div className="field">
                <label className="field-label">Expected Status Code</label>
                <input
                  className="field-input"
                  type="number"
                  min="100"
                  max="599"
                  placeholder="200"
                  value={a.expectedStatusCode ?? ''}
                  onChange={(e) => handleUpdateAssertion(idx, 'expectedStatusCode', e.target.value)}
                />
              </div>
            )}

            {a.type === 'JSON_PATH_EXISTS' && (
              <div className="field">
                <label className="field-label">JSON Path</label>
                <input
                  className="field-input"
                  placeholder="e.g. $.id or data.user"
                  value={a.jsonPath ?? ''}
                  onChange={(e) => handleUpdateAssertion(idx, 'jsonPath', e.target.value)}
                />
              </div>
            )}

            {a.type === 'JSON_PATH_EQUALS' && (
              <>
                <div className="field">
                  <label className="field-label">JSON Path</label>
                  <input
                    className="field-input"
                    placeholder="e.g. $.name"
                    value={a.jsonPath ?? ''}
                    onChange={(e) => handleUpdateAssertion(idx, 'jsonPath', e.target.value)}
                  />
                </div>
                <div className="field">
                  <label className="field-label">Expected Value</label>
                  <input
                    className="field-input"
                    placeholder="e.g. John Doe or true or 123"
                    value={a.expectedValue ?? ''}
                    onChange={(e) => handleUpdateAssertion(idx, 'expectedValue', e.target.value)}
                  />
                </div>
              </>
            )}

            {a.type === 'HEADER_CONTAINS' && (
              <>
                <div className="field">
                  <label className="field-label">Header Name</label>
                  <input
                    className="field-input"
                    placeholder="e.g. Content-Type"
                    value={a.headerName ?? ''}
                    onChange={(e) => handleUpdateAssertion(idx, 'headerName', e.target.value)}
                  />
                </div>
                <div className="field">
                  <label className="field-label">Expected Substring / Value</label>
                  <input
                    className="field-input"
                    placeholder="e.g. application/json"
                    value={a.expectedValue ?? ''}
                    onChange={(e) => handleUpdateAssertion(idx, 'expectedValue', e.target.value)}
                  />
                </div>
              </>
            )}

            {a.type === 'RESPONSE_TIME_LESS_THAN_MS' && (
              <div className="field">
                <label className="field-label">Max Latency (ms)</label>
                <input
                  className="field-input"
                  type="number"
                  min="1"
                  placeholder="1000"
                  value={a.maxResponseTimeMs ?? ''}
                  onChange={(e) => handleUpdateAssertion(idx, 'maxResponseTimeMs', e.target.value)}
                />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
