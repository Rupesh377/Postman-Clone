import { useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import InputField from '../components/InputField'
import { resetPasswordApi } from '../api/authApi'
import '../styles/authPage.css'

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token') || ''

  const [form, setForm] = useState({ newPassword: '', confirmPassword: '' })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setErrors(prev => ({ ...prev, [e.target.name]: '' }))
    setServerError('')
  }

  const validate = () => {
    const newErrors = {}
    if (!form.newPassword) newErrors.newPassword = 'Password is required'
    else if (form.newPassword.length < 8) newErrors.newPassword = 'Must be at least 8 characters'
    if (!form.confirmPassword) newErrors.confirmPassword = 'Please confirm your password'
    else if (form.newPassword !== form.confirmPassword) newErrors.confirmPassword = 'Passwords do not match'
    return newErrors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!token) { setServerError('Invalid or missing reset token.'); return }
    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) { setErrors(validationErrors); return }

    setLoading(true)
    try {
      await resetPasswordApi(token, form.newPassword)
      setSuccess(true)
    } catch (err) {
      const msg = err.response?.data?.message || 'Reset failed. The link may have expired.'
      setServerError(msg)
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <AuthLayout title="Invalid Link" subtitle="This password reset link is not valid">
        <div className="auth-success-state">
          <div className="success-icon error-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
          </div>
          <p className="success-text">This reset link is invalid or has expired.</p>
          <Link to="/forgot-password" className="btn btn-primary" style={{textDecoration:'none',textAlign:'center'}}>
            Request a new link
          </Link>
        </div>
      </AuthLayout>
    )
  }

  if (success) {
    return (
      <AuthLayout title="Password updated!" subtitle="Your password has been changed successfully">
        <div className="auth-success-state">
          <div className="success-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="1.5">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <p className="success-text">Your password has been reset successfully. You can now sign in with your new password.</p>
          <button className="btn btn-primary" onClick={() => navigate('/login')}>
            Go to Sign In
          </button>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Set new password" subtitle="Choose a strong password for your account">
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
          label="New password"
          type="password"
          name="newPassword"
          value={form.newPassword}
          onChange={handleChange}
          placeholder="Min. 8 characters"
          error={errors.newPassword}
          autoComplete="new-password"
        />

        <InputField
          label="Confirm new password"
          type="password"
          name="confirmPassword"
          value={form.confirmPassword}
          onChange={handleChange}
          placeholder="Re-enter your new password"
          error={errors.confirmPassword}
          autoComplete="new-password"
        />

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? <span className="spinner" /> : 'Reset Password'}
        </button>

        <p className="auth-switch">
          <Link to="/login" className="link-accent">← Back to Sign In</Link>
        </p>
      </form>
    </AuthLayout>
  )
}
