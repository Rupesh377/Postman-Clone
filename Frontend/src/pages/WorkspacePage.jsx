import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Topbar from '../components/Topbar'
import Sidebar from '../components/Sidebar'
import RequestBuilder from '../components/RequestBuilder'
import Modal from '../components/Modal'
import { WorkspaceProvider, useWorkspace } from '../context/WorkspaceContext'
import { EnvironmentProvider } from '../context/EnvironmentContext'
import { useToast } from '../context/ToastContext'
import {
  getWorkspaceApi,
  updateWorkspaceApi,
  getMembersApi,
  inviteMemberApi,
  removeMemberApi,
  updateMemberRoleApi,
} from '../api/workspaceApi'
import '../styles/app.css'

const ROLES = ['ADMIN', 'EDITOR', 'VIEWER']

function MembersPanel({ workspaceId, onClose }) {
  const toast = useToast()
  const [members, setMembers]       = useState([])
  const [loading, setLoading]       = useState(true)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole]   = useState('EDITOR')
  const [inviting, setInviting]       = useState(false)
  const [inviteErr, setInviteErr]     = useState('')

  useEffect(() => {
    getMembersApi(workspaceId)
      .then((r) => setMembers(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [workspaceId])

  const handleInvite = async (e) => {
    e.preventDefault()
    if (!inviteEmail.trim()) return
    setInviting(true)
    setInviteErr('')
    try {
      const res = await inviteMemberApi(workspaceId, { email: inviteEmail.trim(), role: inviteRole })
      setMembers((prev) => [...prev, res.data])
      setInviteEmail('')
    } catch (err) {
      setInviteErr(err.response?.data?.message || 'Failed to invite member')
    } finally {
      setInviting(false)
    }
  }

  const handleRemove = async (member) => {
    if (!window.confirm(`Remove ${member.name} from this workspace?`)) return
    try {
      await removeMemberApi(workspaceId, member.id)
      setMembers((prev) => prev.filter((m) => m.id !== member.id))
    } catch {
      toast.error('Failed to remove member')
    }
  }

  const handleRoleChange = async (member, newRole) => {
    try {
      const res = await updateMemberRoleApi(workspaceId, member.id, newRole)
      setMembers((prev) => prev.map((m) => (m.id === member.id ? res.data : m)))
    } catch {
      toast.error('Failed to update role')
    }
  }

  const initials = (name) =>
    (name || '?').split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <Modal title="Workspace Members" onClose={onClose}>
      {/* Invite form */}
      <form onSubmit={handleInvite}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', marginBottom: '4px' }}>
          <div className="field" style={{ flex: 1 }}>
            <label className="field-label" htmlFor="invite-email">Invite by email</label>
            <input
              id="invite-email"
              className="field-input"
              type="email"
              placeholder="colleague@example.com"
              value={inviteEmail}
              onChange={(e) => { setInviteEmail(e.target.value); setInviteErr('') }}
            />
          </div>
          <div className="field" style={{ width: '110px' }}>
            <label className="field-label" htmlFor="invite-role">Role</label>
            <select
              id="invite-role"
              className="field-select"
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
            >
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <button
            type="submit"
            className="btn-sm btn-sm-primary"
            disabled={inviting || !inviteEmail.trim()}
            style={{ height: '38px', marginBottom: '0' }}
          >
            {inviting ? '…' : 'Invite'}
          </button>
        </div>
        {inviteErr && <div className="field-error" style={{ marginBottom: '8px' }}>{inviteErr}</div>}
      </form>

      <div className="settings-divider" />

      {/* Members list */}
      {loading ? (
        <div className="page-loader" style={{ height: '80px' }}>
          <div className="spinner-lg" />
        </div>
      ) : members.length === 0 ? (
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '16px' }}>
          No members yet
        </p>
      ) : (
        <div className="members-list">
          {members.map((m) => (
            <div key={m.id} className="member-row">
              <div className="member-avatar">{initials(m.name)}</div>
              <div className="member-info">
                <div className="member-name">{m.name}</div>
                <div className="member-email">{m.email}</div>
              </div>
              {m.role === 'OWNER' ? (
                <span className="role-badge role-OWNER">Owner</span>
              ) : (
                <select
                  className="field-select"
                  style={{ width: '100px', height: '30px', fontSize: '12px', padding: '0 8px' }}
                  value={m.role}
                  onChange={(e) => handleRoleChange(m, e.target.value)}
                >
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              )}
              {m.role !== 'OWNER' && (
                <button
                  className="btn-icon"
                  style={{ color: '#ef4444' }}
                  onClick={() => handleRemove(m)}
                  aria-label={`Remove ${m.name}`}
                  title="Remove member"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </Modal>
  )
}

function EditWorkspaceModal({ workspace, onClose, onSaved }) {
  const [form, setForm]   = useState({ name: workspace.name, description: workspace.description || '', visibility: workspace.visibility })
  const [saving, setSaving] = useState(false)
  const [err, setErr]       = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) { setErr('Name is required'); return }
    setSaving(true)
    setErr('')
    try {
      const res = await updateWorkspaceApi(workspace.id, {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        visibility: form.visibility,
      })
      onSaved(res.data)
      onClose()
    } catch (e) {
      setErr(e.response?.data?.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title="Edit Workspace" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {err && <div className="alert alert-error">{err}</div>}
          <div className="field">
            <label className="field-label" htmlFor="ew-name">Name</label>
            <input id="ew-name" className="field-input" value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} autoFocus />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="ew-desc">Description</label>
            <textarea id="ew-desc" className="field-textarea" rows={3} value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="ew-vis">Visibility</label>
            <select id="ew-vis" className="field-select" value={form.visibility}
              onChange={(e) => setForm((p) => ({ ...p, visibility: e.target.value }))}>
              <option value="PRIVATE">Private</option>
              <option value="TEAM">Team</option>
              <option value="PUBLIC">Public</option>
            </select>
          </div>
        </div>
        <div className="modal-footer" style={{ marginTop: '20px' }}>
          <button type="button" className="btn-sm btn-sm-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-sm btn-sm-primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function NoRequestSelected({ onNew }) {
  return (
    <div className="empty-state" style={{ flex: 1, justifyContent: 'center' }}>
      <div className="empty-state-icon">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <line x1="22" y1="2" x2="11" y2="13" />
          <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
      </div>
      <div className="empty-state-title">No request open</div>
      <div className="empty-state-desc">
        Select a saved request from the sidebar, or create a new one to start testing.
      </div>
      <button className="btn-sm btn-sm-primary" onClick={onNew} style={{ marginTop: '8px' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        New Request
      </button>
    </div>
  )
}

// Inner component — must live inside WorkspaceProvider so useWorkspace() works.
// Owns all the request/collection selection state so handleNewRequest can
// default activeCollection to the first available collection.
function WorkspaceContent({ workspace, onWorkspaceSaved }) {
  const { collections, loadCollections } = useWorkspace()

  const [sidebarCollapsed, setSidebar] = useState(false)
  const [openTabs, setOpenTabs]         = useState([])
  const [activeTabId, setActiveTabId]   = useState(null)
  const [showMembers, setShowMembers]   = useState(false)
  const [showEdit, setShowEdit]         = useState(false)

  // Load collections on mount so handleNewRequest can default to collections[0].
  useEffect(() => {
    loadCollections()
  }, [loadCollections])

  const activeTab = openTabs.find((t) => t.tabId === activeTabId) || null

  const handleSelectRequest = (request) => {
    const existing = openTabs.find((t) => t.request?.id === request.id)
    if (existing) {
      setActiveTabId(existing.tabId)
    } else {
      const tabId = 'tab-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7)
      const newTab = {
        tabId,
        request,
        collectionId: request.collectionId,
        folderId: request.folderId || null,
        dirty: false,
      }
      setOpenTabs((prev) => [...prev, newTab])
      setActiveTabId(tabId)
    }
  }

  const handleNewRequest = (collectionId, folderId) => {
    const tabId = 'tab-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7)
    const newTab = {
      tabId,
      request: null,
      collectionId: collectionId ?? activeTab?.collectionId ?? collections[0]?.id ?? null,
      folderId: folderId ?? null,
      dirty: false,
    }
    setOpenTabs((prev) => [...prev, newTab])
    setActiveTabId(tabId)
  }

  useEffect(() => {
    const hasDirty = openTabs.some((t) => t.dirty)
    if (!hasDirty) return

    const handleBeforeUnload = (e) => {
      e.preventDefault()
      e.returnValue = ''
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [openTabs])

  const closeTabsByPredicate = (predicate) => {
    setOpenTabs((prevTabs) => {
      const tabsToClose = prevTabs.filter(predicate)
      if (tabsToClose.length === 0) return prevTabs

      const nextTabs = prevTabs.filter((t) => !predicate(t))

      setActiveTabId((currentActiveId) => {
        if (!tabsToClose.some((t) => t.tabId === currentActiveId)) {
          return currentActiveId
        }
        if (nextTabs.length === 0) {
          return null
        }
        const activeIdx = prevTabs.findIndex((t) => t.tabId === currentActiveId)
        const nextIdx = Math.min(activeIdx, nextTabs.length - 1)
        return nextTabs[nextIdx >= 0 ? nextIdx : 0].tabId
      })

      return nextTabs
    })
  }

  const handleCloseTab = (tabIdToClose) => {
    const tabToClose = openTabs.find((t) => t.tabId === tabIdToClose)
    if (!tabToClose) return
    if (tabToClose.dirty) {
      if (!window.confirm('Discard unsaved changes?')) {
        return
      }
    }
    closeTabsByPredicate((t) => t.tabId === tabIdToClose)
  }

  const handleRequestDeleted = (requestId) => {
    closeTabsByPredicate((t) => t.request?.id === requestId)
  }

  const handleRequestRenamed = (updatedRequest) => {
    setOpenTabs((prev) =>
      prev.map((t) =>
        t.request?.id === updatedRequest.id
          ? { ...t, request: { ...t.request, ...updatedRequest } }
          : t
      )
    )
  }

  const handleCollectionDeleted = (collectionId) => {
    closeTabsByPredicate((t) => t.collectionId === collectionId || t.request?.collectionId === collectionId)
  }

  const handleFolderDeleted = (folderId) => {
    closeTabsByPredicate((t) => t.folderId === folderId || t.request?.folderId === folderId)
  }

  const handleTabSaved = (tabId, savedRequest) => {
    setOpenTabs((prev) =>
      prev.map((t) =>
        t.tabId === tabId
          ? {
              ...t,
              request: savedRequest,
              collectionId: savedRequest.collectionId || t.collectionId,
              folderId: savedRequest.folderId ?? t.folderId,
              dirty: false,
            }
          : t
      )
    )
  }

  const handleTabDirtyChange = (tabId, dirty) => {
    setOpenTabs((prev) =>
      prev.map((t) => (t.tabId === tabId ? { ...t, dirty } : t))
    )
  }

  return (
      <div className="app-shell" style={{ flexDirection: 'column' }}>
        {/* Topbar — title is editable; saves via PUT /api/workspaces/:id */}
        <Topbar
          title={workspace?.name}
          onTitleSave={async (newName) => {
            try {
              const res = await updateWorkspaceApi(workspace.id, {
                name: newName,
                description: workspace.description || undefined,
                visibility: workspace.visibility,
              })
              onWorkspaceSaved(res.data)
            } catch {
            }
          }}
          onMenuToggle={() => setSidebar((c) => !c)}
        />

        {/* Workspace action bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 16px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-panel)',
          flexShrink: 0,
        }}>
          <span className={`visibility-badge visibility-${workspace?.visibility}`}>
            {workspace?.visibility?.toLowerCase()}
          </span>
          {workspace?.description && (
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {workspace.description}
            </span>
          )}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
            <button className="btn-sm btn-sm-ghost" onClick={() => setShowMembers(true)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 00-3-3.87" />
                <path d="M16 3.13a4 4 0 010 7.75" />
              </svg>
              Members
            </button>
            <button className="btn-sm btn-sm-ghost" onClick={() => setShowEdit(true)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Edit
            </button>
          </div>
        </div>

        {/* Main body: sidebar + content */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
          {/* Mobile backdrop — tap to close sidebar */}
          {!sidebarCollapsed && (
            <div
              className="sidebar-backdrop"
              onClick={() => setSidebar(true)}
            />
          )}

          <Sidebar
            workspace={workspace}
            onSelectRequest={handleSelectRequest}
            activeRequestId={activeTab?.request?.id}
            collapsed={sidebarCollapsed}
            onNewRequest={handleNewRequest}
            onRequestDeleted={handleRequestDeleted}
            onRequestRenamed={handleRequestRenamed}
            onCollectionDeleted={handleCollectionDeleted}
            onFolderDeleted={handleFolderDeleted}
          />

          {/* Content area */}
          <div className="main-content">
            {openTabs.length === 0 || !activeTab ? (
              <NoRequestSelected onNew={() => handleNewRequest()} />
            ) : (
              <>
                <div className="req-tab-strip">
                  {openTabs.map((tab) => {
                    const method = tab.request?.method || 'GET'
                    const name = tab.request?.name || 'Untitled'
                    const isActive = tab.tabId === activeTabId
                    return (
                      <div
                        key={tab.tabId}
                        className={`req-tab ${isActive ? 'active' : ''}`}
                        onClick={() => setActiveTabId(tab.tabId)}
                        title={name}
                      >
                        <span className={`method-badge method-${method}`}>{method}</span>
                        <span className="req-tab-name">{name}</span>
                        {tab.dirty && <span className="req-tab-dirty" title="Unsaved changes" />}
                        <button
                          type="button"
                          className="req-tab-close"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleCloseTab(tab.tabId)
                          }}
                          aria-label={`Close ${name} tab`}
                          title="Close"
                        >
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      </div>
                    )
                  })}
                  <button
                    type="button"
                    className="req-tab-add"
                    onClick={() => handleNewRequest()}
                    title="New Request"
                    aria-label="New tab"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </button>
                </div>
                <RequestBuilder
                  key={activeTab.tabId}
                  request={activeTab.request}
                  collectionId={activeTab.collectionId || activeTab.request?.collectionId}
                  folderId={activeTab.folderId}
                  onSaved={(saved) => handleTabSaved(activeTab.tabId, saved)}
                  onDirtyChange={(dirty) => handleTabDirtyChange(activeTab.tabId, dirty)}
                  onNew={() => handleNewRequest()}
                />
              </>
            )}
          </div>
        </div>

        {showMembers && (
          <MembersPanel workspaceId={workspace.id} onClose={() => setShowMembers(false)} />
        )}
        {showEdit && (
          <EditWorkspaceModal
            workspace={workspace}
            onClose={() => setShowEdit(false)}
            onSaved={onWorkspaceSaved}
          />
        )}
      </div>
  )
}

export default function WorkspacePage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [workspace, setWorkspace] = useState(null)
  const [wsLoading, setWsLoading] = useState(true)
  const [wsError, setWsError]     = useState(null)

  useEffect(() => {
    setWsLoading(true)
    setWsError(null)
    getWorkspaceApi(id)
      .then((r) => setWorkspace(r.data))
      .catch((err) => {
        if (err.response?.status === 403 || err.response?.status === 404) {
          navigate('/dashboard')
        } else {
          setWsError(err.response?.data?.message || 'Failed to load workspace')
        }
      })
      .finally(() => setWsLoading(false))
  }, [id])

  if (wsLoading) {
    return (
      <div className="app-shell" style={{ flexDirection: 'column' }}>
        <Topbar onMenuToggle={() => {}} />
        <div className="page-loader"><div className="spinner-lg" /></div>
      </div>
    )
  }

  if (wsError) {
    return (
      <div className="app-shell" style={{ flexDirection: 'column' }}>
        <Topbar onMenuToggle={() => {}} />
        <div className="empty-state" style={{ flex: 1 }}>
          <div className="empty-state-title">Something went wrong</div>
          <div className="empty-state-desc">{wsError}</div>
          <button className="btn-sm btn-sm-primary" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <EnvironmentProvider>
    <WorkspaceProvider workspaceId={id}>
      <WorkspaceContent
        workspace={workspace}
        onWorkspaceSaved={setWorkspace}
      />
    </WorkspaceProvider>
    </EnvironmentProvider>
  )
}
