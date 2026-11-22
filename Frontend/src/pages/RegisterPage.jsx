import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import InputField from '../components/InputField'
import OAuthButtons from '../components/OAuthButtons'
import { registerApi } from '../api/authApi'
import { useAuth } from '../context/AuthContext'
import '../styles/authPage.css'

function getStrength(pwd) {
  if (!pwd) return 0
  let score = 0
  if (pwd.length >= 8) score++
  if (/[A-Z]/.test(pwd)) score++
  if (/[0-9]/.test(pwd)) score++
  if (/[^A-Za-z0-9]/.test(pwd)) score++
  return score
}

const STRENGTH_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong']
const STRENGTH_COLORS = ['', '#ef4444', '#f97316', '#eab308', '#22c55e']

export default function RegisterPage() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)
  // After successful registration — show account info & verification notice
  const [registered, setRegistered] = useState(null) // { email, emailVerified }

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setErrors(prev => ({ ...prev, [e.target.name]: '' }))
    setServerError('')
  }

  const validate = () => {
    const newErrors = {}
    if (!form.name || form.name.trim().length < 2) newErrors.name = 'Name must be at least 2 characters'
    if (!form.email) newErrors.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = 'Enter a valid email'
    if (!form.password) newErrors.password = 'Password is required'
    else if (form.password.length < 8) newErrors.password = 'Password must be at least 8 characters'
    return newErrors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (loading) return
    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) { setErrors(validationErrors); return }

    setLoading(true)
    try {
      const res = await registerApi(form.name.trim(), form.email.trim(), form.password)
      const data = res.data || {}
      if (data.user) data.user.provider = 'LOCAL'

      const emailVerified = data.user?.emailVerified ?? false
      const registeredEmail = data.user?.email || form.email.trim()

      // Log the user in (backend issues JWT regardless of verification status)
      login(data)

      // Show post-registration screen — user chooses when to continue
      setRegistered({ email: registeredEmail, emailVerified })
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Try again.'
      setServerError(msg)
    } finally {
      setLoading(false)
    }
  }

  const strength = getStrength(form.password)

  // ── Post-registration success screen ──────────────────────────────────────
  if (registered) {
    return (
      <AuthLayout title="Account created!" subtitle="Welcome to APIForge">
        <div className="auth-success-state">
          <div className="success-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="1.5">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>

          <p className="success-text">
            Your account has been created for <strong>{registered.email}</strong>.
          </p>

          {!registered.emailVerified && (
            <div className="alert" role="note" style={{
              background: 'rgba(255,108,55,0.08)',
              border: '1px solid rgba(255,108,55,0.25)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 14px',
              fontSize: '12.5px',
              color: 'var(--text-secondary)',
              textAlign: 'left',
              width: '100%',
              lineHeight: 1.6,
            }}>
              <strong style={{ color: 'var(--orange)' }}>Email not yet verified.</strong>
              {' '}Your account works, but you can verify your email address at any time.{' '}
              <Link to="/resend-verification" className="link-accent" style={{ fontSize: '12.5px' }}>
                Send verification link →
              </Link>
            </div>
          )}

          <p className="success-subtext">Your account is ready. Click below to continue.</p>

          <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
            Go to Dashboard
          </button>
        </div>
      </AuthLayout>
    )
  }

  // ── Registration form ─────────────────────────────────────────────────────
  return (
    <AuthLayout title="Create your account" subtitle="Join developers building with APIForge">
      <form onSubmit={handleSubmit} className="auth-form" noValidate>
        {serverError && (
          <div className="alert alert-error" role="alert">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {serverError}
          </div>
        )}

        <InputField
          label="Full name"
          type="text"
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="John Doe"
          error={errors.name}
          autoComplete="name"
          autoFocus
        />

        <InputField
          label="Email address"
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder="you@example.com"
          error={errors.email}
          autoComplete="email"
        />

        <InputField
          label="Password"
          type="password"
          name="password"
          value={form.password}
          onChange={handleChange}
          placeholder="Min. 8 characters"
          error={errors.password}
          autoComplete="new-password"
        />

        {form.password && (
          <div className="password-strength">
            <div className="strength-bars">
              {[1, 2, 3, 4].map(i => (
                <div
                  key={i}
                  className="strength-bar"
                  style={{ backgroundColor: i <= strength ? STRENGTH_COLORS[strength] : 'var(--border-mid)' }}
                />
              ))}
            </div>
            <span className="strength-label" style={{ color: STRENGTH_COLORS[strength] }}>
              {STRENGTH_LABELS[strength]}
            </span>
          </div>
        )}

        <button type="submit" className="btn btn-primary" disabled={loading} aria-busy={loading}>
          {loading ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <span className="spinner" />
              Creating account…
            </span>
          ) : 'Create Account'}
        </button>

        <OAuthButtons />

        <p className="auth-switch">
          Already have an account?{' '}
          <Link to="/login" className="link-accent">Sign in</Link>
        </p>
      </form>
    </AuthLayout>
  )
}
