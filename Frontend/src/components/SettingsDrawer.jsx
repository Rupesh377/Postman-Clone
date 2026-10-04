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

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') closeSettings() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [closeSettings])

  const handleLogout = async () => {
    try { await logoutApi(accessToken) } catch {}
    logout()
    closeSettings()
    navigate('/login')
  }

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U'

  return (
    <>
      <div
        className={`sd-backdrop${open ? ' sd-backdrop--visible' : ''}`}
        onClick={closeSettings}
        aria-hidden="true"
      />

      <aside className={`sd-panel${open ? ' sd-panel--open' : ''}`} aria-label="Settings">
        <div className="sd-header">
          <span className="sd-header-title">Settings</span>
          <button className="sd-close" onClick={closeSettings} aria-label="Close settings">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="sd-body">
          <section className="sd-section">
            <h2 className="sd-section-title">Profile</h2>

            <div className="sd-avatar-row">
              <div className="sd-avatar">{initials}</div>
              <div>
                <div className="sd-avatar-name">{user?.name}</div>
                <div className="sd-avatar-email">{user?.email}</div>
              </div>
            </div>

            <div className="field" style={{ marginTop: 10 }}>
              <label className="field-label">Display name</label>
              <input className="field-input" value={user?.name || ''} readOnly
                style={{ opacity: 0.5, cursor: 'default' }} />
            </div>
            <div className="field" style={{ marginTop: 8 }}>
              <label className="field-label">Email</label>
              <input className="field-input" value={user?.email || ''} readOnly
                style={{ opacity: 0.4, cursor: 'default' }} />
            </div>
          </section>

          <div className="sd-divider" />

          <section className="sd-section">
            <h2 className="sd-section-title">Account</h2>

            <div className="sd-info-row">
              <span className="sd-info-label">Role</span>
              <span className={`role-badge role-${user?.role || 'USER'}`}>{user?.role || 'USER'}</span>
            </div>
            <div className="sd-info-row">
              <span className="sd-info-label">Email verified</span>
              <span style={{ fontSize: '13px', fontWeight: 600, color: user?.emailVerified ? 'var(--success)' : 'var(--error)' }}>
                {user?.emailVerified ? 'Verified' : 'Not verified'}
              </span>
            </div>
            <div className="sd-info-row">
              <span className="sd-info-label">Sign-in method</span>
              <span className="sd-info-value">
                {user?.provider
                  ? user.provider.charAt(0).toUpperCase() + user.provider.slice(1).toLowerCase()
                  : 'Email & password'}
              </span>
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
      </aside>
    </>
  )
}
