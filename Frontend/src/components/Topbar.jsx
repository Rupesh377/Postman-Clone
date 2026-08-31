import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AppLogo from './AppLogo'
import NavDrawer from './NavDrawer'
import { logoutApi } from '../api/authApi'
import '../styles/app.css'

export default function Topbar({ title, onTitleSave, onMenuToggle }) {
  const { user, accessToken, logout } = useAuth()
  const navigate = useNavigate()

  const [menuOpen, setMenuOpen]     = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing]       = useState(false)
  const [editVal, setEditVal]       = useState(title || '')

  const menuRef  = useRef(null)
  const titleRef = useRef(null)

  // keep editVal in sync if title prop changes (e.g. after save)
  useEffect(() => {
    if (!editing) setEditVal(title || '')
  }, [title, editing])

  // close user-menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = async () => {
    try { await logoutApi(accessToken) } catch {}
    logout()
    navigate('/login')
  }

  const startEdit = () => {
    if (!onTitleSave) return   // read-only if no save handler provided
    setEditVal(title || '')
    setEditing(true)
    setTimeout(() => titleRef.current?.select(), 0)
  }

  const commitEdit = () => {
    setEditing(false)
    const trimmed = editVal.trim()
    if (trimmed && trimmed !== title) onTitleSave(trimmed)
    else setEditVal(title || '')
  }

  const handleTitleKey = (e) => {
    if (e.key === 'Enter')  commitEdit()
    if (e.key === 'Escape') { setEditing(false); setEditVal(title || '') }
  }

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U'

  return (
    <>
      <header className="topbar">
        {/* Hamburger — opens the global nav drawer */}
        <button
          className="btn-icon"
          onClick={() => setDrawerOpen(true)}
          aria-label="Open navigation"
          title="Workspaces & collections"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6"  x2="21" y2="6"  />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        <Link to="/dashboard" className="topbar-brand">
          <AppLogo size={26} />
          <span>APIForge</span>
        </Link>

        {title !== undefined && (
          <>
            <div className="topbar-sep" />

            {editing ? (
              <input
                ref={titleRef}
                className="topbar-title-input"
                value={editVal}
                onChange={(e) => setEditVal(e.target.value)}
                onBlur={commitEdit}
                onKeyDown={handleTitleKey}
                aria-label="Rename workspace"
                maxLength={100}
              />
            ) : (
              <span
                className={`topbar-title ${onTitleSave ? 'topbar-title--editable' : ''}`}
                onClick={startEdit}
                title={onTitleSave ? 'Click to rename' : title}
              >
                {title || 'Untitled'}
                {onTitleSave && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    style={{ marginLeft: 4, opacity: 0.4, flexShrink: 0 }}>
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                )}
              </span>
            )}
          </>
        )}

        <div className="topbar-actions">
          <div className="dropdown" ref={menuRef}>
            <button
              className="topbar-avatar"
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="User menu"
              aria-expanded={menuOpen}
            >
              {initials}
            </button>

            {menuOpen && (
              <div className="dropdown-menu" role="menu">
                <div style={{ padding: '8px 12px 6px', borderBottom: '1px solid var(--border)', marginBottom: '4px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{user?.name || 'User'}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{user?.email || ''}</div>
                </div>

                <Link to="/settings" className="dropdown-item" role="menuitem" onClick={() => setMenuOpen(false)}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
                  </svg>
                  Settings
                </Link>

                <Link to="/dashboard" className="dropdown-item" role="menuitem" onClick={() => setMenuOpen(false)}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                    <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
                  </svg>
                  Dashboard
                </Link>

                <div className="dropdown-sep" />

                <button className="dropdown-item danger" role="menuitem" onClick={handleLogout}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                    <polyline points="16 17 21 12 16 7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <NavDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  )
}
