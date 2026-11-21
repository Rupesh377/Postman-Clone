import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useSettings } from '../context/SettingsContext'
import { useNavigate } from 'react-router-dom'
import { logoutApi } from '../api/authApi'
import '../styles/settings-drawer.css'

export default function SettingsDrawer() {
  const { open, closeSettings } = useSettings()
  const { user, accessToken, logout } = useAuth()
  const navigate = useNavigate()
  const [theme, setTheme] = useState(
    () => document.documentElement.dataset.theme || localStorage.getItem('theme') || 'dark'
  )

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') closeSettings() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [closeSettings])

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  const handleLogout = async () => {
    try { await logoutApi(accessToken) } catch {}
    logout()
    closeSettings()
    navigate('/login')
  }

  const setThemeMode = (mode) => {
    setTheme(mode)
    localStorage.setItem('theme', mode)
    document.documentElement.dataset.theme = mode
  }

  const isUUIDVal = (val) =>
    typeof val === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val.trim())

  const displayName  = !user?.name  || isUUIDVal(user.name)  ? 'User'              : user.name
  const displayEmail = !user?.email || isUUIDVal(user.email) ? 'Email unavailable' : user.email

  const initials = displayName !== 'User'
    ? displayName.split(' ').filter(Boolean).map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U'

  const formatSignInMethod = (provider) => {
    if (!provider) return 'Email & password'
    const p = String(provider).toUpperCase()
    if (p === 'GOOGLE') return 'Google'
    if (p === 'GITHUB') return 'GitHub'
    if (p === 'LOCAL')  return 'Email & password'
    return provider.charAt(0).toUpperCase() + provider.slice(1).toLowerCase()
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`sd-backdrop${open ? ' sd-backdrop--visible' : ''}`}
        onClick={closeSettings}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <aside
        className={`sd-panel${open ? ' sd-panel--open' : ''}`}
        aria-label="Settings"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="sd-header">
          <div className="sd-header-left">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              style={{ color: 'var(--orange)', flexShrink: 0 }}>
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
            </svg>
            <span className="sd-header-title">Settings</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="sd-esc-hint">ESC</span>
            <button className="sd-close" onClick={closeSettings} aria-label="Close settings">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="sd-body">

          {/* ── Profile ── */}
          <section className="sd-section">
            <h2 className="sd-section-title">Profile</h2>

            <div className="sd-avatar-row">
              <div className="sd-avatar">{initials}</div>
              <div>
                <div className="sd-avatar-name">{displayName}</div>
                <div className="sd-avatar-email">{displayEmail}</div>
              </div>
            </div>

            <div className="field" style={{ marginTop: 10 }}>
              <label className="field-label">Display name</label>
              <input className="field-input" value={displayName} readOnly
                style={{ opacity: 0.5, cursor: 'default' }} />
            </div>
            <div className="field" style={{ marginTop: 8 }}>
              <label className="field-label">Email</label>
              <input className="field-input" value={displayEmail} readOnly
                style={{ opacity: 0.4, cursor: 'default' }} />
            </div>
          </section>

          <div className="sd-divider" />

          {/* ── Appearance ── */}
          <section className="sd-section">
            <h2 className="sd-section-title">Appearance</h2>
            <div className="sd-theme-row">
              <span className="sd-info-label">Theme</span>
              <div className="sd-theme-toggle">
                <button
                  className={`sd-theme-btn${theme === 'dark' ? ' sd-theme-btn--active' : ''}`}
                  onClick={() => setThemeMode('dark')}
                  aria-pressed={theme === 'dark'}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                  </svg>
                  Dark
                </button>
                <button
                  className={`sd-theme-btn${theme === 'light' ? ' sd-theme-btn--active' : ''}`}
                  onClick={() => setThemeMode('light')}
                  aria-pressed={theme === 'light'}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="5"/>
                    <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                    <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                  </svg>
                  Light
                </button>
              </div>
            </div>
          </section>

          <div className="sd-divider" />

          {/* ── Account ── */}
          <section className="sd-section">
            <h2 className="sd-section-title">Account</h2>

            <div className="sd-info-row">
              <span className="sd-info-label">Role</span>
              <span className={`role-badge role-${user?.role || 'USER'}`}>{user?.role || 'USER'}</span>
            </div>
            <div className="sd-info-row">
              <span className="sd-info-label">Email verified</span>
              <span style={{
                fontSize: '12.5px', fontWeight: 600,
                color: user?.emailVerified ? 'var(--success)' : 'var(--error)',
                display: 'flex', alignItems: 'center', gap: '4px',
              }}>
                {user?.emailVerified ? (
                  <>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Verified
                  </>
                ) : (
                  <>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                    Not verified
                  </>
                )}
              </span>
            </div>
            <div className="sd-info-row">
              <span className="sd-info-label">Sign-in method</span>
              <span className="sd-info-value">{formatSignInMethod(user?.provider)}</span>
            </div>

            <button className="btn-sm btn-sm-danger" onClick={handleLogout} style={{ marginTop: 16 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Sign out
            </button>
          </section>
        </div>

        {/* Footer */}
        <div className="sd-footer">
          <span className="sd-footer-hint">Press <kbd className="sd-kbd">Esc</kbd> to close</span>
        </div>
      </aside>
    </>
  )
}
