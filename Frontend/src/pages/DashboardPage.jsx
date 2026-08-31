import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Topbar from '../components/Topbar'
import Modal from '../components/Modal'
import {
  getMyWorkspacesApi,
  createWorkspaceApi,
  deleteWorkspaceApi,
} from '../api/workspaceApi'
import '../styles/app.css'

const VISIBILITY_OPTIONS = ['PRIVATE', 'TEAM', 'PUBLIC']

function WorkspaceIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [workspaces, setWorkspaces] = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)
  const [showModal, setShowModal]   = useState(false)

  // New workspace form
  const [form, setForm]   = useState({ name: '', description: '', visibility: 'PRIVATE' })
  const [formErr, setFormErr] = useState({})
  const [saving, setSaving]   = useState(false)
  const [saveErr, setSaveErr] = useState('')

  useEffect(() => {
    fetchWorkspaces()
  }, [])

  const fetchWorkspaces = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await getMyWorkspacesApi()
      setWorkspaces(res.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load workspaces')
    } finally {
      setLoading(false)
    }
  }

  const handleFormChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setFormErr((prev) => ({ ...prev, [e.target.name]: '' }))
    setSaveErr('')
  }

  const validate = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Name is required'
    return errs
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setFormErr(errs); return }

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

  const handleDelete = async (e, ws) => {
    e.stopPropagation()
    if (!window.confirm(`Delete workspace "${ws.name}"? This cannot be undone.`)) return
    try {
      await deleteWorkspaceApi(ws.id)
      setWorkspaces((prev) => prev.filter((w) => w.id !== ws.id))
    } catch {
      alert('Failed to delete workspace')
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
        {/* Header */}
        <div className="dashboard-header">
          <h1 className="dashboard-heading">Welcome back, {firstName} 👋</h1>
          <p className="dashboard-subheading">
            {workspaces.length === 0
              ? 'Create your first workspace to get started'
              : `You have ${workspaces.length} workspace${workspaces.length !== 1 ? 's' : ''}`}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="alert alert-error" style={{ marginBottom: '24px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="dashboard-grid">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="workspace-card"
                style={{ minHeight: 160, opacity: 0.4, animation: 'pulse 1.4s ease-in-out infinite', pointerEvents: 'none' }}
              />
            ))}
          </div>
        )}

        {/* Workspace grid */}
        {!loading && (
          <div className="dashboard-grid">
            {workspaces.map((ws) => (
              <div
                key={ws.id}
                className="workspace-card"
                onClick={() => navigate(`/workspace/${ws.id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/workspace/${ws.id}`) }}
                aria-label={`Open workspace ${ws.name}`}
              >
                <div className="workspace-card-icon">
                  <WorkspaceIcon />
                </div>
                <div className="workspace-card-name">{ws.name}</div>
                {ws.description && (
                  <div className="workspace-card-desc">{ws.description}</div>
                )}
                <div className="workspace-card-footer">
                  <span className={`visibility-badge visibility-${ws.visibility}`}>
                    {ws.visibility?.toLowerCase()}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="workspace-card-owner">
                      {ws.ownerName}
                    </span>
                    <button
                      className="btn-icon"
                      style={{ padding: '4px', color: 'var(--text-subtle)' }}
                      onClick={(e) => handleDelete(e, ws)}
                      aria-label={`Delete ${ws.name}`}
                      title="Delete workspace"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                        <path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Create new card */}
            <div
              className="workspace-card workspace-card-new"
              onClick={() => setShowModal(true)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter') setShowModal(true) }}
              aria-label="Create new workspace"
            >
              <div className="workspace-card-new-icon">
                <PlusIcon />
              </div>
              <span className="workspace-card-new-text">New Workspace</span>
            </div>
          </div>
        )}
      </div>

      {/* Create workspace modal */}
      {showModal && (
        <Modal title="New Workspace" onClose={closeModal}>
          <form onSubmit={handleCreate}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {saveErr && (
                <div className="alert alert-error">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {saveErr}
                </div>
              )}

              <div className="field">
                <label className="field-label" htmlFor="ws-name">Name *</label>
                <input
                  id="ws-name"
                  name="name"
                  className={`field-input ${formErr.name ? 'input-error' : ''}`}
                  placeholder="My Workspace"
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
                  placeholder="What's this workspace for?"
                  value={form.description}
                  onChange={handleFormChange}
                  rows={3}
                />
              </div>

              <div className="field">
                <label className="field-label" htmlFor="ws-vis">Visibility</label>
                <select
                  id="ws-vis"
                  name="visibility"
                  className="field-select"
                  value={form.visibility}
                  onChange={handleFormChange}
                >
                  {VISIBILITY_OPTIONS.map((v) => (
                    <option key={v} value={v}>
                      {v.charAt(0) + v.slice(1).toLowerCase()}
                      {v === 'PRIVATE' && ' — Only you'}
                      {v === 'TEAM'    && ' — Team members'}
                      {v === 'PUBLIC'  && ' — Anyone'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="modal-footer" style={{ marginTop: '20px' }}>
              <button type="button" className="btn-sm btn-sm-ghost" onClick={closeModal}>
                Cancel
              </button>
              <button type="submit" className="btn-sm btn-sm-primary" disabled={saving}>
                {saving ? 'Creating…' : 'Create Workspace'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.25; }
        }
      `}</style>
    </div>
  )
}
