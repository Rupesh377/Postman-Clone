import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Topbar from '../components/Topbar'
import Modal from '../components/Modal'
import {
  getMyWorkspacesApi,
  createWorkspaceApi,
  deleteWorkspaceApi,
  updateWorkspaceApi,
} from '../api/workspaceApi'
import '../styles/app.css'
import '../styles/dashboard.css'

const VISIBILITY_OPTIONS = ['PRIVATE', 'TEAM', 'PUBLIC']

// ── Inline rename for workspace cards ─────────────────────────
function InlineCardName({ value, onSave }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(value)
  const inputRef = useRef(null)

  useEffect(() => { if (!editing) setVal(value) }, [value, editing])

  const start = (e) => {
    e.stopPropagation()
    setEditing(true)
    setTimeout(() => inputRef.current?.select(), 0)
  }
  const commit = (e) => {
    e?.stopPropagation()
    setEditing(false)
    const t = val.trim()
    if (t && t !== value) onSave(t)
    else setVal(value)
  }
  const onKey = (e) => {
    e.stopPropagation()
    if (e.key === 'Enter') commit()
    if (e.key === 'Escape') { setEditing(false); setVal(value) }
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        className="ws-card-name-input"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={commit}
        onKeyDown={onKey}
        onClick={(e) => e.stopPropagation()}
        maxLength={100}
        autoFocus
      />
    )
  }
  return (
    <div className="workspace-card-name" onDoubleClick={start} title="Double-click to rename">
      {value}
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [workspaces, setWorkspaces] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [deleteId, setDeleteId] = useState(null) // id being deleted — for per-card loading state

  // New workspace form
  const [form, setForm] = useState({ name: '', description: '', visibility: 'PRIVATE' })
  const [formErr, setFormErr] = useState({})
  const [saving, setSaving] = useState(false)
  const [saveErr, setSaveErr] = useState('')

  useEffect(() => { fetchWorkspaces() }, [])

  const fetchWorkspaces = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await getMyWorkspacesApi()
      setWorkspaces(res.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load workspaces. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }

  // ── Navigate into workspace ─────────────────────────────────
  // Explicitly use a named handler so we can confirm it's called.
  const openWorkspace = (id) => {
    navigate(`/workspace/${id}`)
  }

  // ── Rename workspace ────────────────────────────────────────
  const handleRename = async (ws, newName) => {
    try {
      const res = await updateWorkspaceApi(ws.id, {
        name: newName,
        description: ws.description || undefined,
        visibility: ws.visibility,
      })
      setWorkspaces((prev) => prev.map((w) => (w.id === ws.id ? res.data : w)))
    } catch (err) {
      const msg = err.response?.data?.message || 'Rename failed'
      alert(msg)
    }
  }

  // ── Delete workspace ────────────────────────────────────────
  const handleDelete = async (e, ws) => {
    // Stop the click from bubbling up to the card and triggering navigation
    e.preventDefault()
    e.stopPropagation()

    if (!window.confirm(`Delete "${ws.name}"?\n\nThis will permanently remove the workspace and all its collections and requests.`)) return

    setDeleteId(ws.id)
    try {
      await deleteWorkspaceApi(ws.id)
      // Optimistically remove from UI only after confirmed server success
      setWorkspaces((prev) => prev.filter((w) => w.id !== ws.id))
    } catch (err) {
      const status = err.response?.status
      const msg = err.response?.data?.message
      if (status === 403) {
        alert('You don\'t have permission to delete this workspace.')
      } else if (status === 404) {
        // Already gone — remove from UI anyway
        setWorkspaces((prev) => prev.filter((w) => w.id !== ws.id))
      } else {
        alert(msg || `Delete failed (${status ?? 'network error'}). Check the console for details.`)
        console.error('[deleteWorkspace]', err)
      }
    } finally {
      setDeleteId(null)
    }
  }

  // ── Create workspace ────────────────────────────────────────
  const handleFormChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }))
    setFormErr((p) => ({ ...p, [e.target.name]: '' }))
    setSaveErr('')
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) { setFormErr({ name: 'Workspace name is required' }); return }

    setSaving(true)
    setSaveErr('')
    try {
      const res = await createWorkspaceApi({
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        visibility: form.visibility,
      })
      setWorkspaces((prev) => [res.data, ...prev])
      closeModal()
      navigate(`/workspace/${res.data.id}`)
    } catch (err) {
      setSaveErr(err.response?.data?.message || 'Failed to create workspace')
    } finally {
      setSaving(false)
    }
  }

  const closeModal = () => {
    setShowModal(false)
    setForm({ name: '', description: '', visibility: 'PRIVATE' })
    setFormErr({})
    setSaveErr('')
  }

  const firstName = user?.name?.split(' ')[0] || 'there'

  return (
    <div className="app-shell" style={{ flexDirection: 'column' }}>
      <Topbar />

      <div className="dashboard-page">
        {/* ── Header ── */}
        <div className="dash-header">
          <div>
            <h1 className="dash-title">
              {firstName}'s workspaces
            </h1>
            <p className="dash-subtitle">
              {loading
                ? 'Loading…'
                : workspaces.length === 0
                  ? 'Create a workspace to start organising your API requests.'
                  : `${workspaces.length} workspace${workspaces.length !== 1 ? 's' : ''} · pick one to open the request builder`}
            </p>
          </div>
          <button
            className="btn-sm btn-sm-primary dash-new-btn"
            onClick={() => setShowModal(true)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            New workspace
          </button>
        </div>

        {/* ── Error banner ── */}
        {error && (
          <div className="alert alert-error" style={{ marginBottom: '24px' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {error}
            <button className="btn-sm btn-sm-ghost" style={{ marginLeft: 'auto', height: '26px' }} onClick={fetchWorkspaces}>
              Retry
            </button>
          </div>
        )}

        {/* ── Loading skeleton ── */}
        {loading && (
          <div className="dash-grid">
            {[1, 2, 3].map((i) => (
              <div key={i} className="workspace-card dash-skeleton" />
            ))}
          </div>
        )}

        {/* ── Empty state ── */}
        {!loading && !error && workspaces.length === 0 && (
          <div className="dash-empty">
            <div className="dash-empty-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="2" y="3" width="20" height="14" rx="2"/>
                <line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
              </svg>
            </div>
            <h3 className="dash-empty-title">No workspaces yet</h3>
            <p className="dash-empty-desc">
              A workspace holds your collections of API requests. Create one to get started.
            </p>
            <button className="btn-sm btn-sm-primary" onClick={() => setShowModal(true)}>
              Create your first workspace
            </button>
          </div>
        )}

        {/* ── Workspace grid ── */}
        {!loading && workspaces.length > 0 && (
          <div className="dash-grid">
            {workspaces.map((ws) => (
              <div
                key={ws.id}
                className={`workspace-card ${deleteId === ws.id ? 'workspace-card--deleting' : ''}`}
                onClick={() => openWorkspace(ws.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter') openWorkspace(ws.id) }}
                aria-label={`Open workspace ${ws.name}`}
              >
                {/* Top: icon + visibility + actions */}
                <div className="ws-card-top">
                  <div className="workspace-card-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <rect x="2" y="3" width="20" height="14" rx="2"/>
                      <line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
                    </svg>
                  </div>
                  <span className={`visibility-badge visibility-${ws.visibility}`}>
                    {ws.visibility?.toLowerCase()}
                  </span>
                  <div className="ws-card-actions">
                    <button
                      className="ws-card-action-btn"
                      onClick={(e) => handleDelete(e, ws)}
                      aria-label={`Delete ${ws.name}`}
                      title="Delete workspace"
                      disabled={deleteId === ws.id}
                    >
                      {deleteId === ws.id ? (
                        <span className="ws-card-spinner" />
                      ) : (
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                          <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Name — double-click to rename inline */}
                <InlineCardName
                  value={ws.name}
                  onSave={(newName) => handleRename(ws, newName)}
                />

                {/* Description */}
                {ws.description && (
                  <div className="workspace-card-desc">{ws.description}</div>
                )}

                {/* Footer */}
                <div className="ws-card-footer">
                  <span className="workspace-card-owner">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 4 }}>
                      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                    {ws.ownerName}
                  </span>
                  <span className="ws-card-open-hint">Open →</span>
                </div>
              </div>
            ))}

            {/* New workspace card */}
            <button
              className="workspace-card workspace-card-new"
              onClick={() => setShowModal(true)}
              aria-label="Create new workspace"
            >
              <div className="workspace-card-new-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              </div>
              <span className="workspace-card-new-text">New workspace</span>
              <span className="ws-card-new-hint">Organise requests by project or team</span>
            </button>
          </div>
        )}
      </div>

      {/* ── Create workspace modal ── */}
      {showModal && (
        <Modal title="New workspace" onClose={closeModal}>
          <form onSubmit={handleCreate}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {saveErr && (
                <div className="alert alert-error">{saveErr}</div>
              )}

              <div className="field">
                <label className="field-label" htmlFor="ws-name">Name *</label>
                <input
                  id="ws-name"
                  name="name"
                  className={`field-input ${formErr.name ? 'input-error' : ''}`}
                  placeholder="e.g. Payments API, Auth Service…"
                  value={form.name}
                  onChange={handleFormChange}
                  autoFocus
                />
                {formErr.name && <span className="field-error">{formErr.name}</span>}
              </div>

              <div className="field">
                <label className="field-label" htmlFor="ws-desc">Description</label>
                <textarea
                  id="ws-desc"
                  name="description"
                  className="field-textarea"
                  placeholder="What APIs or project does this cover?"
                  value={form.description}
                  onChange={handleFormChange}
                  rows={2}
                />
              </div>

              <div className="field">
                <label className="field-label" htmlFor="ws-vis">Visibility</label>
                <select id="ws-vis" name="visibility" className="field-select" value={form.visibility} onChange={handleFormChange}>
                  <option value="PRIVATE">Private — only you</option>
                  <option value="TEAM">Team — members you invite</option>
                  <option value="PUBLIC">Public — anyone with the link</option>
                </select>
              </div>
            </div>

            <div className="modal-footer" style={{ marginTop: '20px' }}>
              <button type="button" className="btn-sm btn-sm-ghost" onClick={closeModal}>Cancel</button>
              <button type="submit" className="btn-sm btn-sm-primary" disabled={saving}>
                {saving ? 'Creating…' : 'Create workspace'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
