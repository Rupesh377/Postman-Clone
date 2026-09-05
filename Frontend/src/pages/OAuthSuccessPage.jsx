import { useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function OAuthSuccessPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { login } = useAuth()

  useEffect(() => {
    const accessToken = searchParams.get('accessToken')
    const refreshToken = searchParams.get('refreshToken')

    if (accessToken && refreshToken) {
      login({ accessToken, refreshToken, user: null })
      navigate('/dashboard', { replace: true })
    } else {
      navigate('/login?error=oauth_failed', { replace: true })
    }
  }, [])

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      background: 'var(--bg-dark)',
      color: 'var(--text-primary)',
      flexDirection: 'column',
      gap: '12px'
    }}>
      <div style={{
        width: '28px', height: '28px',
        border: '2.5px solid rgba(249,115,22,0.2)',
        borderTopColor: 'var(--orange)',
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite'
      }} />
      <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Signing you in…</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
