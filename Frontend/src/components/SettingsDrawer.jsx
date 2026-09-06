import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useSettings } from '../context/SettingsContext'
import { useNavigate } from 'react-router-dom'
import api from '../api/axiosInstance'
import { logoutApi } from '../api/authApi'
import '../styles/settings-drawer.css'

export default function SettingsDrawer() {
  const { open, closeSettings } = useSettings()
  const { user, accessToken, login, logout } = useAuth()
  const navigate = useNavigate()

  const [profileForm, setProfileForm] = useState({ name: user?.name || '' })
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileMsg, setProfileMsg] = useState(null)

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [pwErrors, setPwErrors] = useState({})
  const [pwSaving, setPwSaving] = useState(false)
  const [pwMsg, setPwMsg] = useState(null)

  // sync name when user changes
  useEffect(() => {
    if (open) setProfileForm({ name: user?.name || '' })
  }, [open, user?.name])

  // close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') closeSettings() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [closeSettings])

  const handleProfileChange = (e) => {
    setProfileForm((p) => ({ ...p, [e.target.name]: e.target.value }))
    setProfileMsg(null)
  }

  const handleProfileSave = async (e) => {
    e.preventDefault()
    if (!profileForm.name.trim()) return
    setProfileSaving(true)
    setProfileMsg(null)
    try {
      const stored = JSON.parse(localStorage.getItem('user') || '{}')
      const updated = { ...stored, name: profileForm.name.trim() }
      localStorage.setItem('user', JSON.stringify(updated))
      login({ accessToken, refreshToken: localStorage.getItem('refreshToken'), user: updated })
      setProfileMsg({ type: 'success', text: 'Name updated.' })
    } catch {
      setProfileMsg({ type: 'error', text: 'Failed to update.' })
    } finally {
      setProfileSaving(false)
    }
  }

  const handlePwChange = (e) => {
    setPwForm((p) => ({ ...p, [e.target.name]: e.target.value }))
    setPwErrors((p) => ({ ...p, [e.target.name]: '' }))
    setPwMsg(null)
  }

  const validatePw = () => {
    const errs = {}
    if (!pwForm.currentPassword) errs.currentPassword = 'Required'
    if (!pwForm.newPassword) errs.newPassword = 'Required'
    else if (pwForm.newPassword.length < 8) errs.newPassword = 'Min 8 characters'
    if (pwForm.newPassword !== pwForm.confirmPassword) errs.confirmPassword = "Passwords don't match"
    return errs
  }

  const handlePwSave = async (e) => {
    e.preventDefault()
    const errs = validatePw()
    if (Object.keys(errs).length) { setPwErrors(errs); return }
    setPwSaving(true)
    setPwMsg(null)
    try {
      await api.post('/api/v1/auth/change-password', {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      })
      setPwMsg({ type: 'success', text: 'Password changed.' })
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      setPwMsg({ type: 'error', text: err.response?.data?.message || 'Failed to change password.' })
    } finally {
      setPwSaving(false)
    }
  }

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
      {/* Backdrop */}
      <div
        className={`sd-backdrop${open ? ' sd-backdrop--visible' : ''}`}
        onClick={closeSettings}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <aside className={`sd-panel${open ? ' sd-panel--open' : ''}`} aria-label="Settings">
        {/* Header */}
        <div className="sd-header">
          <span className="sd-header-title">Settings</span>
          <button className="sd-close" onClick={closeSettings} aria-label="Close settings">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Scrollable content */}
        <div className="sd-body">

          {/* Profile section */}
          <section className="sd-section">
            <h2 className="sd-section-title">Profile</h2>
            <p className="sd-section-desc">Your display name and account details.</p>

            <div className="sd-avatar-row">
              <div className="sd-avatar">{initials}</div>
              <div>
                <div className="sd-avatar-name">{user?.name}</div>
                <div className="sd-avatar-email">{user?.email}</div>
              </div>
            </div>

            {profileMsg && (
              <div className={`alert alert-${profileMsg.type}`} style={{ marginBottom: 8 }}>{profileMsg.text}</div>
            )}

            <form onSubmit={handleProfileSave} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div className="field">
                <label className="field-label" htmlFor="sd-name">Display name</label>
                <input id="sd-name" name="name" className="field-input" value={profileForm.name}
                  onChange={handleProfileChange} placeholder="Your name" />
              </div>
              <div className="field">
                <label className="field-label">Email</label>
                <input className="field-input" value={user?.email || ''} disabled
                  style={{ opacity: 0.4, cursor: 'not-allowed' }} />
                <span style={{ fontSize: '11.5px', color: 'var(--text-subtle)' }}>Email can't be changed.</span>
              </div>
              <button type="submit" className="btn-sm btn-sm-primary"
                disabled={profileSaving || !profileForm.name.trim()} style={{ alignSelf: 'flex-start' }}>
                {profileSaving ? 'Saving…' : 'Save name'}
              </button>
            </form>
          </section>

          <div className="sd-divider" />

          {/* Password section */}
          <section className="sd-section">
            <h2 className="sd-section-title">Password</h2>
            <p className="sd-section-desc">Update your password.</p>

            {pwMsg && (
              <div className={`alert alert-${pwMsg.type}`} style={{ marginBottom: 8 }}>{pwMsg.text}</div>
            )}

            <form onSubmit={handlePwSave} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { id: 'sd-cur', name: 'currentPassword', label: 'Current password', placeholder: 'Your current password', ac: 'current-password' },
                { id: 'sd-new', name: 'newPassword', label: 'New password', placeholder: 'Min. 8 characters', ac: 'new-password' },
                { id: 'sd-conf', name: 'confirmPassword', label: 'Confirm new password', placeholder: 'Re-enter new password', ac: 'new-password' },
              ].map(({ id, name, label, placeholder, ac }) => (
                <div className="field" key={name}>
                  <label className="field-label" htmlFor={id}>{label}</label>
                  <input id={id} name={name} type="password"
                    className={`field-input${pwErrors[name] ? ' input-error' : ''}`}
                    value={pwForm[name]} onChange={handlePwChange}
                    placeholder={placeholder} autoComplete={ac} />
                  {pwErrors[name] && <span className="field-error">{pwErrors[name]}</span>}
                </div>
              ))}
              <button type="submit" className="btn-sm btn-sm-primary" disabled={pwSaving} style={{ alignSelf: 'flex-start' }}>
                {pwSaving ? 'Updating…' : 'Update password'}
              </button>
            </form>
          </section>

          <div className="sd-divider" />

          {/* Account section */}
          <section className="sd-section">
            <h2 className="sd-section-title">Account</h2>
            <p className="sd-section-desc">Role, verification status, and session.</p>

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
