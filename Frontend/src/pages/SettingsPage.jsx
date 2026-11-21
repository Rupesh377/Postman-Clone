import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Topbar from '../components/Topbar'
import { logoutApi } from '../api/authApi'
import '../styles/app.css'
import '../styles/settings-page.css'

const NAV_SECTIONS = [
  { id: 'profile',    label: 'Profile',    icon: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  )},
  { id: 'account',   label: 'Account',    icon: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
    </svg>
  )},
  { id: 'appearance', label: 'Appearance', icon: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  )},
]

export default function SettingsPage() {
  const { user, accessToken, logout } = useAuth()
  const navigate = useNavigate()
  const [activeSection, setActiveSection] = useState('profile')
  const [theme, setTheme] = useState(
    () => document.documentElement.dataset.theme || localStorage.getItem('theme') || 'dark'
  )

  const handleLogout = async () => {
    try { await logoutApi(accessToken) } catch {}
    logout()
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
    <div className="app-shell" style={{ flexDirection: 'column' }}>
      <Topbar title="Settings" />

      <div className="sp-layout">
        {/* ── Sidebar nav ── */}
        <nav className="sp-nav">
          <div className="sp-nav-heading">Settings</div>
          {NAV_SECTIONS.map((s) => (
            <button
              key={s.id}
              className={`sp-nav-item${activeSection === s.id ? ' sp-nav-item--active' : ''}`}
              onClick={() => setActiveSection(s.id)}
            >
              {s.icon}
              {s.label}
            </button>
          ))}
        </nav>

        {/* ── Main content ── */}
        <main className="sp-main">
          <div className="sp-page-header">
            <h1 className="sp-page-title">
              {NAV_SECTIONS.find((s) => s.id === activeSection)?.label}
            </h1>
            <p className="sp-page-subtitle">
              {activeSection === 'profile'    && 'Your public profile information.'}
              {activeSection === 'account'    && 'Role, verification status, and session management.'}
              {activeSection === 'appearance' && 'Customize how APIForge looks for you.'}
            </p>
          </div>

          {/* ─── Profile ─── */}
          {activeSection === 'profile' && (
            <div className="sp-card">
              {/* Avatar row */}
              <div className="sp-avatar-row">
                <div className="sp-avatar">{initials}</div>
                <div>
                  <div className="sp-avatar-name">{displayName}</div>
                  <div className="sp-avatar-email">{displayEmail}</div>
                </div>
              </div>

              <div className="sp-divider" />

              <div className="settings-section-body">
                <div className="field">
                  <label className="field-label">Display name</label>
                  <input
                    className="field-input"
                    value={displayName}
                    readOnly
                    style={{ opacity: 0.55, cursor: 'default' }}
                  />
                  <span className="sp-field-hint">Name is set by your sign-in provider.</span>
                </div>
                <div className="field">
                  <label className="field-label">Email address</label>
                  <input
                    className="field-input"
                    value={displayEmail}
                    readOnly
                    style={{ opacity: 0.45, cursor: 'default' }}
                  />
                  <span className="sp-field-hint">Managed by your identity provider.</span>
                </div>
              </div>
            </div>
          )}

          {/* ─── Account ─── */}
          {activeSection === 'account' && (
            <div className="sp-card">
              <div className="settings-row">
                <span className="settings-row-label">Role</span>
                <span className={`role-badge role-${user?.role || 'USER'}`}>{user?.role || 'USER'}</span>
              </div>
              <div className="settings-row">
                <span className="settings-row-label">Email verified</span>
                <span style={{
                  fontSize: '13px', fontWeight: 600,
                  color: user?.emailVerified ? 'var(--success)' : 'var(--error)',
                  display: 'flex', alignItems: 'center', gap: '5px',
                }}>
                  {user?.emailVerified ? (
                    <>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      Verified
                    </>
                  ) : (
                    <>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                      Not verified
                    </>
                  )}
                </span>
              </div>
              <div className="settings-row">
                <span className="settings-row-label">Sign-in method</span>
                <span className="settings-row-value">{formatSignInMethod(user?.provider)}</span>
              </div>

              <div className="sp-divider" style={{ margin: '8px 0 16px' }} />

              <div>
                <p className="sp-danger-label">Danger zone</p>
                <p className="sp-danger-desc">Signing out will end your current session on this device.</p>
                <button className="btn-sm btn-sm-danger" onClick={handleLogout} style={{ marginTop: 10 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                    <polyline points="16 17 21 12 16 7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                  Sign out
                </button>
              </div>
            </div>
          )}

          {/* ─── Appearance ─── */}
          {activeSection === 'appearance' && (
            <div className="sp-card">
              <div className="sp-setting-row">
                <div>
                  <div className="sp-setting-label">Theme</div>
                  <div className="sp-setting-desc">Choose between dark and light interface.</div>
                </div>
                <div className="sp-theme-toggle">
                  <button
                    className={`sp-theme-btn${theme === 'dark' ? ' sp-theme-btn--active' : ''}`}
                    onClick={() => setThemeMode('dark')}
                    aria-pressed={theme === 'dark'}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                    </svg>
                    Dark
                  </button>
                  <button
                    className={`sp-theme-btn${theme === 'light' ? ' sp-theme-btn--active' : ''}`}
                    onClick={() => setThemeMode('light')}
                    aria-pressed={theme === 'light'}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
