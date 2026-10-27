import { useState } from 'react'
import { generateBodyApi } from '../../api/aiApi'
import { SparklesIcon, CopyIcon, CheckIcon, CodeBracketIcon, ArrowPathIcon } from './aiIcons'

const EXAMPLE_PROMPTS = [
  'User registration with email, password, and profile details',
  'E-commerce order with items list, total, and shipping address',
  'Login credentials with email, password, and rememberMe flag',
  'Filter search query with page, limit, tags array, and sortBy',
  'Create payment intent with amount, currency, and paymentMethod',
]

export default function GenerateBodyPanel({ currentBody, onApplyBody, onClose }) {
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [generatedJson, setGeneratedJson] = useState('')
  const [copied, setCopied] = useState(false)
  const [applied, setApplied] = useState(false)

  const handleGenerate = async (descToUse) => {
    const text = (descToUse || description).trim()
    if (!text) {
      setError('Please provide a description of the request body you need.')
      return
    }
    if (text.length > 2000) {
      setError('Description cannot exceed 2000 characters.')
      return
    }

    setLoading(true)
    setError(null)
    setApplied(false)

    try {
      const res = await generateBodyApi(text)
      const data = res.data
      let formatted = ''
      if (typeof data?.body === 'string') {
        try {
          formatted = JSON.stringify(JSON.parse(data.body), null, 2)
        } catch {
          formatted = data.body
        }
      } else if (data?.body) {
        formatted = JSON.stringify(data.body, null, 2)
      } else {
        formatted = '{}'
      }

      setGeneratedJson(formatted)
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to generate request body.')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    if (!generatedJson) return
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(generatedJson)
      } else {
        const ta = document.createElement('textarea')
        ta.value = generatedJson
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
      }
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  const handleApply = (mode = 'replace') => {
    if (!generatedJson) return
    if (mode === 'replace') {
      onApplyBody(generatedJson)
    } else {
      // Append or merge if current body exists
      if (currentBody && currentBody.trim()) {
        try {
          const currentObj = JSON.parse(currentBody)
          const newObj = JSON.parse(generatedJson)
          const merged = { ...currentObj, ...newObj }
          onApplyBody(JSON.stringify(merged, null, 2))
        } catch {
          onApplyBody(currentBody + '\n\n' + generatedJson)
        }
      } else {
        onApplyBody(generatedJson)
      }
    }
    setApplied(true)
    setTimeout(() => setApplied(false), 2500)
  }

  return (
    <div className="ai-panel">
      <div className="ai-panel-header">
        <div>
          <h3 className="ai-panel-title">
            <SparklesIcon size={18} style={{ color: 'var(--orange)' }} />
            AI Request Body Generator
          </h3>
          <p className="ai-panel-desc">
            Describe the data structure or API payload you need in natural language.
          </p>
        </div>
      </div>

      <div className="ai-prompt-chips-label">Quick Prompt Examples</div>
      <div className="ai-prompt-chips-container">
        {EXAMPLE_PROMPTS.map((prompt, idx) => (
          <button
            key={idx}
            type="button"
            className="ai-prompt-chip"
            onClick={() => {
              setDescription(prompt)
              handleGenerate(prompt)
            }}
          >
            {prompt}
          </button>
        ))}
      </div>

      <div className="ai-textarea-wrapper">
        <label className="field-label" htmlFor="ai-body-desc">
          Description
        </label>
        <textarea
          id="ai-body-desc"
          className="ai-textarea"
          placeholder="e.g. Create a user registration JSON payload with full name, email, password, and preferences object"
          value={description}
          onChange={(e) => {
            setDescription(e.target.value)
            if (error) setError(null)
          }}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
              e.preventDefault()
              handleGenerate()
            }
          }}
          disabled={loading}
          rows={3}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-subtle)' }}>
            Press Ctrl+Enter or Cmd+Enter to generate
          </span>
          <span className="ai-char-counter">{description.length} / 2000</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '14px' }}>
        <button
          type="button"
          className="btn-sm btn-sm-primary"
          onClick={() => handleGenerate()}
          disabled={loading || !description.trim()}
          style={{ minWidth: '130px', height: '32px' }}
        >
          {loading ? (
            <>
              <ArrowPathIcon size={14} className="spinner" /> Generating…
            </>
          ) : (
            <>
              <SparklesIcon size={14} /> Generate Body
            </>
          )}
        </button>

        {generatedJson && (
          <button
            type="button"
            className="btn-sm btn-sm-ghost"
            onClick={() => handleGenerate()}
            disabled={loading}
            title="Regenerate with current description"
          >
            <ArrowPathIcon size={13} /> Regenerate
          </button>
        )}
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '14px' }}>
          {error}
        </div>
      )}

      {loading && !generatedJson && (
        <div className="ai-loading-container">
          <div className="ai-spinner-sparkle">
            <SparklesIcon size={28} />
          </div>
          <span>Crafting JSON request body with Spring AI…</span>
        </div>
      )}

      {generatedJson && (
        <div className="ai-preview-box">
          <div className="ai-preview-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CodeBracketIcon size={14} />
              <span>Generated JSON Preview</span>
            </div>
            <div className="ai-preview-actions">
              <button
                type="button"
                className="btn-icon-xs"
                onClick={handleCopy}
                title="Copy JSON to clipboard"
              >
                {copied ? <CheckIcon size={12} style={{ color: 'var(--success)' }} /> : <CopyIcon size={12} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
              <button
                type="button"
                className="btn-sm btn-sm-primary"
                style={{ height: '24px', fontSize: '11px', padding: '0 8px' }}
                onClick={() => handleApply('replace')}
                title="Apply directly to the active request body"
              >
                {applied ? <CheckIcon size={12} /> : null}
                <span>{applied ? 'Applied!' : 'Use in Request'}</span>
              </button>
            </div>
          </div>
          <pre className="ai-preview-body">{generatedJson}</pre>
        </div>
      )}
    </div>
  )
}
