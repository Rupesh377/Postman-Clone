import { useState } from 'react'
import { Link } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import InputField from '../components/InputField'
import { resendVerificationApi } from '../api/authApi'
import '../styles/authPage.css'

export default function ResendVerificationPage() {
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [serverError, setServerError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  const handleChange = (e) => {
    setEmail(e.target.value)
    setEmailError('')
    setServerError('')
  }

  const startCooldown = () => {
    let secs = 60
    setCooldown(secs)
    const interval = setInterval(() => {
      secs -= 1
      setCooldown(secs)
      if (secs <= 0) clearInterval(interval)
    }, 1000)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (loading || cooldown > 0) return

    if (!email.trim()) { setEmailError('Email is required'); return }
    if (!/\S+@\S+\.\S+/.test(email.trim())) { setEmailError('Enter a valid email address'); return }

    setLoading(true)
    setServerError('')
    try {
      await resendVerificationApi(email.trim())
      setSuccess(true)
      startCooldown()
    } catch (err) {
      const msg = err.response?.data?.message || 'Something went wrong. Please try again.'
      setServerError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleResendAgain = () => {
    if (cooldown > 0) return
    setSuccess(false)
    setServerError('')
  }

  // ── Success screen ─────────────────────────────────────────────────────────
  if (success) {
    return (
      <AuthLayout title="Check your inbox" subtitle="Verification email requested">
        <div className="auth-success-state">
          <div className="success-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#FF6C37" strokeWidth="1.5">
              <path d="M22 13V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h9" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              <path d="m16 19 2 2 4-4" />
            </svg>
          </div>

          <p className="success-text">
            If <strong>{email}</strong> matches a local account that is not yet verified,
            a new verification link has been sent.
          </p>
          <p className="success-subtext">
            Check your inbox and spam folder. The link expires in 15 minutes.
          </p>

          {cooldown > 0 ? (
            <p style={{ fontSize: '12px', color: 'var(--text-subtle)', margin: 0 }}>
              You can request another link in {cooldown}s
            </p>
          ) : (
            <button className="btn btn-secondary" onClick={handleResendAgain}>
              Try a different email
            </button>
          )}

          <p className="auth-switch">
            <Link to="/login" className="link-accent">← Back to Sign In</Link>
          </p>
        </div>
      </AuthLayout>
    )
  }

  // ── Form screen ────────────────────────────────────────────────────────────
  return (
    <AuthLayout
      title="Resend verification email"
      subtitle="Enter your email to request a new verification link"
    >
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
          label="Email address"
          type="email"
          name="email"
          value={email}
          onChange={handleChange}
          placeholder="you@example.com"
          error={emailError}
          autoComplete="email"
          autoFocus
        />

        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading || cooldown > 0}
          aria-busy={loading}
        >
          {loading ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <span className="spinner" />
              Sending…
            </span>
          ) : cooldown > 0 ? (
            `Resend available in ${cooldown}s`
          ) : (
            'Send Verification Email'
          )}
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
          <p className="auth-switch">
            Already verified?{' '}
            <Link to="/login" className="link-accent">Sign in</Link>
          </p>
          <p className="auth-switch">
            <Link to="/register" className="link-accent">Create a new account</Link>
          </p>
        </div>
      </form>
    </AuthLayout>
  )
}
