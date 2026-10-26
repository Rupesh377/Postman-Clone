import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import InputField from '../components/InputField'
import OAuthButtons from '../components/OAuthButtons'
import { loginApi } from '../api/authApi'
import { useAuth } from '../context/AuthContext'
import '../styles/authPage.css'

export default function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { login } = useAuth()

  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState(() => {
    const err = searchParams.get('error')
    return err === 'oauth_failed' ? 'Social sign-in failed. Please try again.' : (err || '')
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const err = searchParams.get('error')
    if (err) {
      setServerError(err === 'oauth_failed' ? 'Social sign-in failed. Please try again.' : err)
    }
  }, [searchParams])

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setErrors(prev => ({ ...prev, [e.target.name]: '' }))
    setServerError('')
  }

  const validate = () => {
    const newErrors = {}
    if (!form.email) newErrors.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = 'Enter a valid email'
    if (!form.password) newErrors.password = 'Password is required'
    return newErrors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (loading) return
    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }
    setLoading(true)
    try {
      const res = await loginApi(form.email.trim(), form.password)
      const data = res.data || {}
      if (data.user) {
        data.user.provider = 'LOCAL'
      }
      login(data)
      navigate('/dashboard')
    } catch (err) {
      const msg = err.response?.data?.message || (err.response?.status === 401 ? 'Invalid email or password' : 'Unable to sign in. Please check your credentials.')
      setServerError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your APIForge account">
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
          placeholder="Enter your password"
          error={errors.password}
          autoComplete="current-password"
        />

        <div className="auth-form-footer-link">
          <Link to="/forgot-password" className="link-muted">Forgot password?</Link>
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading} aria-busy={loading}>
          {loading ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <span className="spinner" />
              Signing in…
            </span>
          ) : 'Sign In'}
        </button>

        <OAuthButtons />

        <p className="auth-switch">
          Don't have an account?{' '}
          <Link to="/register" className="link-accent">Create one</Link>
        </p>
      </form>
    </AuthLayout>
  )
}
