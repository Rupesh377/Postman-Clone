import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Topbar from '../components/Topbar'
import { logoutApi } from '../api/authApi'
import '../styles/app.css'

export default function SettingsPage() {
  const { user, accessToken, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try { await logoutApi(accessToken) } catch {}
    logout()
    navigate('/login')
  }

  const isUUIDVal = (val) =>
    typeof val === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val.trim())

  const displayName = !user?.name || isUUIDVal(user.name) ? 'User' : user.name
  const displayEmail = !user?.email || isUUIDVal(user.email) ? 'Email unavailable' : user.email

  const initials = displayName !== 'User'
    ? displayName.split(' ').filter(Boolean).map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U'

  const formatSignInMethod = (provider) => {
    if (!provider) return 'Email & password'
    const p = String(provider).toUpperCase()
    if (p === 'GOOGLE') return 'Google'
    if (p === 'GITHUB') return 'GitHub'
    if (p === 'LOCAL') return 'Email & password'
    return provider.charAt(0).toUpperCase() + provider.slice(1).toLowerCase()
  }

  return (
    <div className="app-shell" style={{ flexDirection: 'column' }}>
      <Topbar title="Settings" />

      <div className="settings-page">

        <section className="settings-section">
          <div className="settings-section-meta">
            <h2 className="settings-section-title">Profile</h2>
            <p className="settings-section-desc">Your account details.</p>
          </div>
          <div className="settings-section-body">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
              <div style={{
                width: 44, height: 44, borderRadius: 'var(--radius-sm)',
                background: 'var(--orange)', color: '#fff',
                fontSize: '15px', fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                {initials}
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{displayName}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{displayEmail}</div>
              </div>
            </div>

            <div className="field">
              <label className="field-label">Display name</label>
              <input className="field-input" value={displayName} readOnly
                style={{ opacity: 0.5, cursor: 'default' }} />
            </div>
            <div className="field">
              <label className="field-label">Email</label>
              <input className="field-input" value={displayEmail} readOnly
                style={{ opacity: 0.4, cursor: 'default' }} />
            </div>
          </div>
        </section>

        <section className="settings-section">
          <div className="settings-section-meta">
            <h2 className="settings-section-title">Account</h2>
            <p className="settings-section-desc">Role, verification status, and session.</p>
          </div>
          <div className="settings-section-body">
            <div className="settings-row">
              <span className="settings-row-label">Role</span>
              <span className={`role-badge role-${user?.role || 'USER'}`}>{user?.role || 'USER'}</span>
            </div>
            <div className="settings-row">
              <span className="settings-row-label">Email verified</span>
              <span style={{ fontSize: '13px', color: user?.emailVerified ? 'var(--success)' : 'var(--error)', fontWeight: 600 }}>
                {user?.emailVerified ? 'Verified' : 'Not verified'}
              </span>
            </div>
            <div className="settings-row">
              <span className="settings-row-label">Sign-in method</span>
              <span className="settings-row-value">
                {formatSignInMethod(user?.provider)}
              </span>
            </div>
            <div style={{ paddingTop: '16px' }}>
              <button className="btn-sm btn-sm-danger" onClick={handleLogout}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Sign out
              </button>
            </div>
          </div>
        </section>

      </div>
    </div>
  )
}
