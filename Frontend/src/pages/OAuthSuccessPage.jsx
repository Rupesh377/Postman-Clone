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
      let userObj = { name: 'User', email: '' }
      try {
        const payloadBase64 = accessToken.split('.')[1]
        if (payloadBase64) {
          const jsonStr = atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'))
          const payload = JSON.parse(jsonStr)
          userObj = {
            id: payload.userId || payload.id || null,
            name: payload.name || payload.fullName || payload.sub?.split('@')[0] || 'User',
            email: payload.email || payload.sub || '',
          }
        }
      } catch {
        // Fallback to default user object
      }

      login({ accessToken, refreshToken, user: userObj })
      navigate('/dashboard', { replace: true })
    } else {
      navigate('/login?error=oauth_failed', { replace: true })
    }
  }, [searchParams, navigate, login])

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
