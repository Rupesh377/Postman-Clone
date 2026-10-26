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
    const providerParam = searchParams.get('provider') || sessionStorage.getItem('oauth_provider') || 'OAuth'
    sessionStorage.removeItem('oauth_provider')

    if (accessToken && refreshToken) {
      let payload = {}
      try {
        const payloadBase64 = accessToken.split('.')[1]
        if (payloadBase64) {
          const jsonStr = atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'))
          payload = JSON.parse(jsonStr)
        }
      } catch {
        // Fallback
      }

      const isUUIDVal = (v) =>
        typeof v === 'string' &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v.trim())

      const isValidEmailVal = (v) =>
        typeof v === 'string' &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())

      // ID resolution
      const userId = payload.userId || payload.id || (isUUIDVal(payload.sub) ? payload.sub : null)

      // Query params or token claims if available
      const qName = searchParams.get('name')
      const qEmail = searchParams.get('email')

      let userName = qName || payload.name || payload.fullName || null
      if (!userName || isUUIDVal(userName)) {
        if (isValidEmailVal(payload.sub)) {
          userName = payload.sub.split('@')[0]
        } else {
          userName = 'User'
        }
      }

      let userEmail = qEmail || payload.email || null
      if (!userEmail || isUUIDVal(userEmail) || !isValidEmailVal(userEmail)) {
        if (isValidEmailVal(payload.sub)) {
          userEmail = payload.sub
        } else {
          userEmail = null
        }
      }

      const userObj = {
        id: userId,
        name: userName,
        email: userEmail,
        role: payload.role || 'USER',
        emailVerified: typeof payload.emailVerified === 'boolean' ? payload.emailVerified : true,
        provider: providerParam,
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
