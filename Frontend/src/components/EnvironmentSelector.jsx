import { useState, useEffect, useRef, useCallback } from 'react'
import Modal from './Modal'
import { useEnvironment } from '../context/EnvironmentContext'
import '../styles/environment.css'

// ── Inline KVTable (same pattern as RequestBuilder, adapted for env variables) ─

function EnvVarTable({ variables, environmentId, onAdd, onEdit, onRemove }) {
  // Local draft rows: each has { id (if saved), key, value, dirty, saving, error }
  const [rows, setRows] = useState([])

  // Sync when variables prop changes (e.g. after env switch)
  useEffect(() => {
    const saved = (variables || []).map((v) => ({
      id: v.id,
      key: v.variableKey,
      value: v.variableValue,
      dirty: false,
      saving: false,
      error: null,
    }))
    setRows([...saved, { id: null, key: '', value: '', dirty: false, saving: false, error: null }])
  }, [variables])

  const updateRow = (idx, field, val) => {
    setRows((prev) => {
      const next = prev.map((r, i) => (i === idx ? { ...r, [field]: val, dirty: true } : r))
      // Auto-append empty row when typing in the last row
      if (idx === prev.length - 1 && val) {
        next.push({ id: null, key: '', value: '', dirty: false, saving: false, error: null })
      }
      return next
    })
  }

  // Commit a row on blur: create if new, update if existing
  const commitRow = async (idx) => {
    const row = rows[idx]
    if (!row.dirty) return
    if (!row.key.trim()) return // empty key → skip

    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, saving: true, error: null } : r)))

    try {
      if (!row.id) {
        // new variable
        const created = await onAdd(row.key.trim(), row.value.trim())
        setRows((prev) =>
          prev.map((r, i) =>
            i === idx
              ? { id: created.id, key: created.variableKey, value: created.variableValue, dirty: false, saving: false, error: null }
              : r
          )
        )
      } else {
        // update existing
        const updated = await onEdit(row.id, row.key.trim(), row.value.trim())
        setRows((prev) =>
          prev.map((r, i) =>
            i === idx
              ? { id: updated.id, key: updated.variableKey, value: updated.variableValue, dirty: false, saving: false, error: null }
              : r
          )
        )
      }
    } catch (err) {
      const msg = err?.response?.data?.message || 'Save failed'
      setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, saving: false, error: msg } : r)))
    }
  }

  const removeRow = async (idx) => {
    const row = rows[idx]
    if (!row.id) {
      // unsaved row — just remove from local state
      setRows((prev) => {
        const next = prev.filter((_, i) => i !== idx)
        if (!next.some((r) => !r.id && !r.key)) {
          next.push({ id: null, key: '', value: '', dirty: false, saving: false, error: null })
        }
        return next
      })
      return
    }

    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, saving: true } : r)))
    try {
      await onRemove(row.id)
      setRows((prev) => {
        const next = prev.filter((_, i) => i !== idx)
        if (!next.some((r) => !r.id && !r.key)) {
          next.push({ id: null, key: '', value: '', dirty: false, saving: false, error: null })
        }
        return next
      })
    } catch (err) {
      const msg = err?.response?.data?.message || 'Delete failed'
      setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, saving: false, error: msg } : r)))
    }
  }

  return (
    <table className="kv-table" style={{ tableLayout: 'fixed' }}>
      <thead>
        <tr>
          <th style={{ width: '40%' }}>Variable</th>
          <th style={{ width: '40%' }}>Value</th>
          <th style={{ width: '14%', textAlign: 'right', paddingRight: '8px' }}>Status</th>
          <th style={{ width: '6%' }}></th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, idx) => (
          <tr key={row.id ?? `draft-${idx}`}>
            <td>
              <input
                className="kv-input"
                placeholder="{{variableName}}"
                value={row.key}
                onChange={(e) => updateRow(idx, 'key', e.target.value)}
                onBlur={() => commitRow(idx)}
                disabled={row.saving}
                aria-label="Variable name"
              />
              {row.error && (
                <div style={{ fontSize: '10px', color: 'var(--error)', paddingLeft: '8px' }}>
                  {row.error}
                </div>
              )}
            </td>
            <td>
              <input
                className="kv-input"
                placeholder="value"
                value={row.value}
                onChange={(e) => updateRow(idx, 'value', e.target.value)}
                onBlur={() => commitRow(idx)}
                disabled={row.saving}
                aria-label="Variable value"
              />
            </td>
            <td className="env-var-saving">
              {row.saving ? '…' : row.dirty && row.key ? '●' : ''}
            </td>
            <td>
              {(row.key || row.value) && (
                <button
                  className="kv-delete-btn"
                  onClick={() => removeRow(idx)}
                  disabled={row.saving}
                  type="button"
                  aria-label="Remove variable"
                >
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

// ── Environment Manager Modal ─────────────────────────────────────────────────

function EnvironmentManagerModal({ onClose }) {
  const {
    environments,
    envsLoading,
    activeEnvironment,
    loadEnvironments,
    createEnvironment,
    removeEnvironment,
    addVariable,
    editVariable,
    removeVariable,
    selectEnvironment,
  } = useEnvironment()

  // Which env is being edited in the variables panel (may differ from activeEnvironment)
  const [editingEnvId, setEditingEnvId] = useState(activeEnvironment?.id ?? null)
  const [newEnvName, setNewEnvName] = useState('')
  const [creating, setCreating] = useState(false)
  const [createErr, setCreateErr] = useState('')
  const newEnvInputRef = useRef(null)

  useEffect(() => {
    loadEnvironments()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const editingEnv = environments.find((e) => e.id === editingEnvId) || null

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!newEnvName.trim()) return
    setCreating(true)
    setCreateErr('')
    try {
      const created = await createEnvironment(newEnvName.trim())
      setNewEnvName('')
      setEditingEnvId(created.id)
    } catch (err) {
      setCreateErr(err?.response?.data?.message || 'Failed to create')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (env) => {
    if (!window.confirm(`Delete environment "${env.name}"? This cannot be undone.`)) return
    try {
      await removeEnvironment(env.id)
      if (editingEnvId === env.id) {
        setEditingEnvId(environments.find((e) => e.id !== env.id)?.id ?? null)
      }
    } catch {
      // error handled inside removeEnvironment
    }
  }

  // Callbacks for variable table
  const handleAddVar = useCallback(
    async (key, value) => {
      if (!editingEnvId) throw new Error('No environment selected')
      return addVariable(editingEnvId, key, value)
    },
    [editingEnvId, addVariable]
  )

  const handleEditVar = useCallback(
    async (varId, key, value) => {
      if (!editingEnvId) throw new Error('No environment selected')
      return editVariable(editingEnvId, varId, key, value)
    },
    [editingEnvId, editVariable]
  )

  const handleRemoveVar = useCallback(
    async (varId) => {
      if (!editingEnvId) throw new Error('No environment selected')
      return removeVariable(editingEnvId, varId)
    },
    [editingEnvId, removeVariable]
  )

  return (
    <div className="env-modal">
      <Modal title="Manage Environments" onClose={onClose}>
        {/* Create new env */}
        <form onSubmit={handleCreate}>
          <div className="env-create-row">
            <input
              ref={newEnvInputRef}
              className="env-create-input"
              placeholder="New environment name…"
              value={newEnvName}
              onChange={(e) => { setNewEnvName(e.target.value); setCreateErr('') }}
              aria-label="New environment name"
            />
            <button
              type="submit"
              className="btn-sm btn-sm-primary"
              disabled={creating || !newEnvName.trim()}
            >
              {creating ? '…' : 'Create'}
            </button>
          </div>
          {createErr && (
            <div className="field-error" style={{ marginTop: '4px' }}>{createErr}</div>
          )}
        </form>

        <div className="settings-divider" />

        {/* Environment list */}
        {envsLoading ? (
          <div className="history-loading">
            <div className="spinner-lg" />
          </div>
        ) : environments.length === 0 ? (
          <div className="env-list-empty">No environments yet — create one above.</div>
        ) : (
          <div className="env-list" role="listbox" aria-label="Environments">
            {environments.map((env) => (
              <div
                key={env.id}
                className={`env-list-item ${editingEnvId === env.id ? 'active' : ''}`}
                onClick={() => setEditingEnvId(env.id)}
                role="option"
                aria-selected={editingEnvId === env.id}
              >
                <span className="env-list-item-name">{env.name}</span>
                <span className="env-list-item-count">
                  {(env.variables || []).length} var{(env.variables || []).length !== 1 ? 's' : ''}
                </span>
                <div className="env-list-item-actions">
                  {/* Select / deselect as active */}
                  <button
                    className="btn-icon"
                    title={activeEnvironment?.id === env.id ? 'Deselect' : 'Use this environment'}
                    onClick={(e) => {
                      e.stopPropagation()
                      selectEnvironment(activeEnvironment?.id === env.id ? null : env.id)
                    }}
                    aria-label={activeEnvironment?.id === env.id ? 'Deselect environment' : 'Select environment'}
                  >
                    {activeEnvironment?.id === env.id ? (
                      // Checkmark (active)
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      // Circle (inactive)
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="9" />
                      </svg>
                    )}
                  </button>
                  {/* Delete */}
                  <button
                    className="btn-icon"
                    style={{ color: 'var(--text-subtle)' }}
                    title="Delete environment"
                    onClick={(e) => { e.stopPropagation(); handleDelete(env) }}
                    aria-label={`Delete ${env.name}`}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14H6L5 6" />
                      <path d="M10 11v6M14 11v6" />
                      <path d="M9 6V4h6v2" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Variables panel for the selected environment */}
        {editingEnv && (
          <>
            <div className="settings-divider" />
            <div className="env-vars-section">
              <div className="env-vars-header">
                <span className="env-vars-title">
                  Variables — <span style={{ color: 'var(--text-secondary)', textTransform: 'none', letterSpacing: 0 }}>{editingEnv.name}</span>
                </span>
                <span className="env-vars-hint">Use <code style={{ color: 'var(--orange)', fontSize: '11px' }}>{'{{variableName}}'}</code> in your request URLs &amp; headers</span>
              </div>
              <div className="env-vars-table-wrap">
                <EnvVarTable
                  key={editingEnv.id}
                  variables={editingEnv.variables}
                  environmentId={editingEnv.id}
                  onAdd={handleAddVar}
                  onEdit={handleEditVar}
                  onRemove={handleRemoveVar}
                />
              </div>
            </div>
          </>
        )}

        <div className="modal-footer" style={{ marginTop: '4px' }}>
          <button className="btn-sm btn-sm-ghost" onClick={onClose} type="button">Close</button>
        </div>
      </Modal>
    </div>
  )
}

// ── Public component: the selector strip that sits above the URL bar ──────────

export default function EnvironmentSelector() {
  const {
    environments,
    envsLoaded,
    envsLoading,
    activeEnvironment,
    loadEnvironments,
    selectEnvironment,
  } = useEnvironment()

  const [showManager, setShowManager] = useState(false)

  // Load environments once on mount (lazy — only when this strip is rendered)
  useEffect(() => {
    if (!envsLoaded && !envsLoading) {
      loadEnvironments()
    }
  }, [envsLoaded, envsLoading, loadEnvironments])

  const handleSelectChange = (e) => {
    const val = e.target.value
    selectEnvironment(val === '' ? null : Number(val))
  }

  return (
    <>
      <div className="env-selector-wrap" aria-label="Environment selector">
        <span className="env-selector-label">Environment</span>

        <select
          className="env-selector-select"
          value={activeEnvironment?.id ?? ''}
          onChange={handleSelectChange}
          aria-label="Active environment"
          disabled={envsLoading}
        >
          <option value="">— No Environment —</option>
          {environments.map((env) => (
            <option key={env.id} value={env.id}>
              {env.name}
            </option>
          ))}
        </select>

        <button
          className="env-selector-btn"
          onClick={() => setShowManager(true)}
          type="button"
          aria-label="Manage environments"
          title="Create and manage environments and variables"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.07 4.93a10 10 0 010 14.14M4.93 4.93a10 10 0 000 14.14" />
          </svg>
          Manage
        </button>

        {activeEnvironment && (
          <div className="env-active-pill" aria-live="polite">
            <span className="env-active-pill-dot" />
            <span className="env-active-pill-name">{activeEnvironment.name}</span>
            <span style={{ color: 'var(--text-subtle)' }}>active</span>
          </div>
        )}
      </div>

      {showManager && (
        <EnvironmentManagerModal onClose={() => setShowManager(false)} />
      )}
    </>
  )
}
