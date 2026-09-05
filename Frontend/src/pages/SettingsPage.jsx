import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Topbar from '../components/Topbar'
import api from '../api/axiosInstance'
import { logoutApi } from '../api/authApi'
import '../styles/app.css'

export default function SettingsPage() {
  const { user, accessToken, login, logout } = useAuth()
  const navigate = useNavigate()

  const [profileForm, setProfileForm] = useState({ name: user?.name || '' })
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileMsg, setProfileMsg] = useState(null)

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [pwErrors, setPwErrors] = useState({})
  const [pwSaving, setPwSaving] = useState(false)
  const [pwMsg, setPwMsg] = useState(null)

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
    if (pwForm.newPassword !== pwForm.confirmPassword) errs.confirmPassword = 'Passwords don\'t match'
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
    navigate('/login')
  }

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U'

  return (
    <div className="app-shell" style={{ flexDirection: 'column' }}>
      <Topbar title="Settings" />

      <div className="settings-page" style={{ margin: '0 auto', width: '100%' }}>

        {/* ── Profile ── */}
        <section className="settings-section">
          <div className="settings-section-meta">
            <h2 className="settings-section-title">Profile</h2>
            <p className="settings-section-desc">Your display name and account details.</p>
          </div>
          <div className="settings-section-body">
            {/* Avatar + name row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
              <div style={{
                width: 44, height: 44,
                borderRadius: 'var(--radius-sm)',
                background: 'var(--orange)', color: '#fff',
                fontSize: '15px', fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, letterSpacing: 0,
              }}>
                {initials}
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.2px' }}>
                  {user?.name}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{user?.email}</div>
              </div>
            </div>

            {profileMsg && (
              <div className={`alert alert-${profileMsg.type}`}>{profileMsg.text}</div>
            )}

            <form onSubmit={handleProfileSave} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="field">
                <label className="field-label" htmlFor="s-name">Display name</label>
                <input
                  id="s-name" name="name"
                  className="field-input"
                  value={profileForm.name}
                  onChange={handleProfileChange}
                  placeholder="Your name"
                />
              </div>
              <div className="field">
                <label className="field-label">Email</label>
                <input
                  className="field-input"
                  value={user?.email || ''}
                  disabled
                  style={{ opacity: 0.4, cursor: 'not-allowed' }}
                />
                <span style={{ fontSize: '11.5px', color: 'var(--text-subtle)' }}>
                  Email address can't be changed.
                </span>
              </div>
              <div>
                <button
                  type="submit"
                  className="btn-sm btn-sm-primary"
                  disabled={profileSaving || !profileForm.name.trim()}
                >
                  {profileSaving ? 'Saving…' : 'Save name'}
                </button>
              </div>
            </form>
          </div>
        </section>

        {/* ── Change Password ── */}
        <section className="settings-section">
          <div className="settings-section-meta">
            <h2 className="settings-section-title">Password</h2>
            <p className="settings-section-desc">
              Update your password. You'll stay signed in on this device after changing it.
            </p>
          </div>
          <div className="settings-section-body">
            {pwMsg && (
              <div className={`alert alert-${pwMsg.type}`}>{pwMsg.text}</div>
            )}
            <form onSubmit={handlePwSave} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { id: 'cur-pw',  name: 'currentPassword', label: 'Current password',      placeholder: 'Your current password', ac: 'current-password' },
                { id: 'new-pw',  name: 'newPassword',      label: 'New password',           placeholder: 'Min. 8 characters',     ac: 'new-password' },
                { id: 'conf-pw', name: 'confirmPassword',  label: 'Confirm new password',   placeholder: 'Re-enter new password', ac: 'new-password' },
              ].map(({ id, name, label, placeholder, ac }) => (
                <div className="field" key={name}>
                  <label className="field-label" htmlFor={id}>{label}</label>
                  <input
                    id={id} name={name} type="password"
                    className={`field-input${pwErrors[name] ? ' input-error' : ''}`}
                    value={pwForm[name]}
                    onChange={handlePwChange}
                    placeholder={placeholder}
                    autoComplete={ac}
                  />
                  {pwErrors[name] && <span className="field-error">{pwErrors[name]}</span>}
                </div>
              ))}
              <div>
                <button type="submit" className="btn-sm btn-sm-primary" disabled={pwSaving}>
                  {pwSaving ? 'Updating…' : 'Update password'}
                </button>
              </div>
            </form>
          </div>
        </section>

        {/* ── Account ── */}
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
                {user?.provider
                  ? user.provider.charAt(0).toUpperCase() + user.provider.slice(1).toLowerCase()
                  : 'Email & password'}
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
