import { useState } from 'react'
import { Link } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import InputField from '../components/InputField'
import { forgotPasswordApi } from '../api/authApi'
import '../styles/authPage.css'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [serverError, setServerError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setEmail(e.target.value)
    setEmailError('')
    setServerError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email) { setEmailError('Email is required'); return }
    if (!/\S+@\S+\.\S+/.test(email)) { setEmailError('Enter a valid email'); return }

    setLoading(true)
    try {
      await forgotPasswordApi(email)
      setSuccess(true)
    } catch (err) {
      const msg = err.response?.data?.message || 'Something went wrong. Please try again.'
      setServerError(msg)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <AuthLayout title="Check your email" subtitle="We've sent you a reset link">
        <div className="auth-success-state">
          <div className="success-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#FF6C37" strokeWidth="1.5">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013 7.77 19.79 19.79 0 01.21 4.13 2 2 0 012.22 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 9.91a16 16 0 006.18 6.18l1.07-.45a2 2 0 012.11.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
            </svg>
          </div>
          <p className="success-text">
            We sent a password reset link to <strong>{email}</strong>.
            Check your inbox and follow the instructions.
          </p>
          <p className="success-subtext">Didn't receive it? Check your spam folder.</p>
          <button
            className="btn btn-secondary"
            onClick={() => { setSuccess(false); setEmail('') }}
          >
            Try a different email
          </button>
          <p className="auth-switch">
            <Link to="/login" className="link-accent">← Back to Sign In</Link>
          </p>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Forgot password?"
      subtitle="Enter your email and we'll send you a reset link"
    >
      <form onSubmit={handleSubmit} className="auth-form" noValidate>
        {serverError && (
          <div className="alert alert-error" role="alert">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
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
        />

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? <span className="spinner" /> : 'Send Reset Link'}
        </button>

        <p className="auth-switch">
          <Link to="/login" className="link-accent">← Back to Sign In</Link>
        </p>
      </form>
    </AuthLayout>
  )
}
