import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getMyWorkspacesApi } from '../api/workspaceApi'
import { getCollectionsApi } from '../api/collectionApi'
import AppLogo from './AppLogo'
import '../styles/navDrawer.css'

// ── tiny icons ────────────────────────────────────────────────
const WorkspaceIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="3" width="20" height="14" rx="2"/>
    <line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
  </svg>
)
const ColIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
  </svg>
)
const ChevronRight = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
)
const SearchIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
)

// ── Single workspace row with lazy-loaded collections ─────────
function WorkspaceRow({ ws, isActive, onNavigate }) {
  const [open, setOpen] = useState(isActive)
  const [collections, setCollections] = useState(null)
  const [loading, setLoading] = useState(false)

  const toggle = async () => {
    const next = !open
    setOpen(next)
    if (next && collections === null) {
      setLoading(true)
      try {
        const res = await getCollectionsApi(ws.id)
        setCollections(res.data)
      } catch {
        setCollections([])
      } finally {
        setLoading(false)
      }
    }
  }

  return (
    <div className={`nd-ws-row ${isActive ? 'nd-ws-row--active' : ''}`}>
      <div className="nd-ws-header" onClick={toggle} role="button" tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter') toggle() }}>
        <span className="nd-ws-chevron" style={{ transform: open ? 'rotate(90deg)' : 'none' }}>
          <ChevronRight />
        </span>
        <span className="nd-ws-icon"><WorkspaceIcon /></span>
        <span className="nd-ws-name">{ws.name}</span>
        <span className={`nd-vis-dot nd-vis-${ws.visibility}`} title={ws.visibility} />
      </div>

      {open && (
        <div className="nd-collections">
          {loading && (
            <div className="nd-row-hint">Loading collections…</div>
          )}
          {!loading && collections?.length === 0 && (
            <div className="nd-row-hint">No collections yet</div>
          )}
          {collections?.map((col) => (
            <div
              key={col.id}
              className="nd-col-row"
              onClick={() => onNavigate(`/workspace/${ws.id}`, col)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter') onNavigate(`/workspace/${ws.id}`, col) }}
            >
              <span className="nd-col-icon"><ColIcon /></span>
              <span className="nd-col-name">{col.name}</span>
            </div>
          ))}
          <div
            className="nd-col-row nd-col-row--open"
            onClick={() => onNavigate(`/workspace/${ws.id}`)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') onNavigate(`/workspace/${ws.id}`) }}
          >
            Open workspace →
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main drawer ───────────────────────────────────────────────
export default function NavDrawer({ open, onClose }) {
  const navigate = useNavigate()
  const { id: activeId } = useParams()
  const drawerRef = useRef(null)

  const [workspaces, setWorkspaces] = useState(null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)

  // Load workspaces when drawer opens
  useEffect(() => {
    if (open && workspaces === null) {
      setLoading(true)
      getMyWorkspacesApi()
        .then((r) => setWorkspaces(r.data))
        .catch(() => setWorkspaces([]))
        .finally(() => setLoading(false))
    }
  }, [open])

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  // Focus trap / close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (open && drawerRef.current && !drawerRef.current.contains(e.target)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open, onClose])

  const handleNavigate = (path) => {
    navigate(path)
    onClose()
  }

  const filtered = search.trim()
    ? (workspaces || []).filter((w) =>
        w.name.toLowerCase().includes(search.toLowerCase())
      )
    : (workspaces || [])

  return (
    <>
      {/* Backdrop */}
      <div
        className={`nd-backdrop ${open ? 'nd-backdrop--visible' : ''}`}
        aria-hidden="true"
        onClick={onClose}
      />

      {/* Drawer panel */}
      <aside
        ref={drawerRef}
        className={`nd-drawer ${open ? 'nd-drawer--open' : ''}`}
        aria-label="Navigation"
        role="navigation"
      >
        {/* Header */}
        <div className="nd-header">
          <AppLogo size={24} />
          <span className="nd-header-title">APIForge</span>
          <button className="nd-close-btn" onClick={onClose} aria-label="Close navigation">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="nd-search-wrap">
          <SearchIcon />
          <input
            className="nd-search"
            placeholder="Search workspaces…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search workspaces"
          />
        </div>

        {/* Section label */}
        <div className="nd-section-label">Your Workspaces</div>

        {/* Content */}
        <div className="nd-list">
          {loading && (
            <div className="nd-loading">
              <div className="nd-spinner" />
              <span>Loading…</span>
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="nd-empty">
              {search ? `No workspaces match "${search}"` : 'No workspaces yet.'}
            </div>
          )}

          {filtered.map((ws) => (
            <WorkspaceRow
              key={ws.id}
              ws={ws}
              isActive={String(ws.id) === String(activeId)}
              onNavigate={handleNavigate}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="nd-footer">
          <button
            className="nd-footer-btn"
            onClick={() => handleNavigate('/dashboard')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
            </svg>
            All Workspaces
          </button>
          <button
            className="nd-footer-btn"
            onClick={() => handleNavigate('/settings')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
            </svg>
            Settings
          </button>
        </div>
      </aside>
    </>
  )
}
