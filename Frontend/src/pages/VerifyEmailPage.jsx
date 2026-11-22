import { useState, useEffect, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { verifyEmailApi } from '../api/authApi'
import '../styles/authPage.css'

// ── Icons ─────────────────────────────────────────────────────────────────────

function MailCheckIcon() {
  return (
    <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 13V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h9" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
      <path d="m16 19 2 2 4-4" />
    </svg>
  )
}

function MailXIcon() {
  return (
    <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 13V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h9" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
      <path d="m17 17 4 4m0-4-4 4" />
    </svg>
  )
}

function SpinnerIcon() {
  return (
    <div style={{
      width: 52, height: 52,
      border: '3px solid rgba(255,108,55,0.15)',
      borderTopColor: 'var(--orange)',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
    }} />
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''

  const [status, setStatus] = useState('idle') // idle | loading | success | error
  const [message, setMessage] = useState('')
  const calledRef = useRef(false)

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('No verification token found in the link. Please use the link sent to your email.')
      return
    }

    if (calledRef.current) return
    calledRef.current = true

    setStatus('loading')
    verifyEmailApi(token)
      .then((res) => {
        setStatus('success')
        setMessage(res.data?.message || 'Email verified successfully. You can now log in.')
      })
      .catch((err) => {
        setStatus('error')
        const serverMsg = err.response?.data?.message || err.response?.data?.error
        setMessage(serverMsg || 'Verification failed. The link may be invalid or expired.')
      })
  }, [token])

  const isExpired = message?.toLowerCase().includes('expired')
  const isAlreadyUsed = message?.toLowerCase().includes('already been used') || message?.toLowerCase().includes('already verified')

  return (
    <div className="verify-email-page">
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .verify-email-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-dark);
          padding: 24px;
        }
        .verify-card {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 48px 40px;
          max-width: 440px;
          width: 100%;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
          animation: fadeSlideUp 0.3s ease-out;
          box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        }
        .verify-icon-wrap {
          width: 80px; height: 80px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
        }
        .verify-icon-wrap--loading { background: var(--orange-faint); }
        .verify-icon-wrap--success {
          background: rgba(34,197,94,0.1);
          border: 1px solid rgba(34,197,94,0.25);
          color: #22c55e;
        }
        .verify-icon-wrap--error {
          background: rgba(240,75,71,0.1);
          border: 1px solid rgba(240,75,71,0.2);
          color: var(--error);
        }
        .verify-title {
          font-size: 20px;
          font-weight: 700;
          color: var(--text-primary);
          letter-spacing: -0.4px;
          margin: 0;
        }
        .verify-desc {
          font-size: 13.5px;
          color: var(--text-muted);
          line-height: 1.65;
          margin: 0;
          max-width: 340px;
        }
        .verify-loading-label {
          font-size: 13px;
          color: var(--text-subtle);
          font-style: italic;
        }
        .verify-actions {
          display: flex;
          flex-direction: column;
          gap: 10px;
          width: 100%;
          margin-top: 4px;
        }
        .verify-brand {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }
        .verify-brand-dot {
          width: 8px; height: 8px;
          border-radius: 50%;
          background: var(--orange);
        }
        .verify-brand-name {
          font-size: 15px;
          font-weight: 700;
          color: var(--text-primary);
          letter-spacing: -0.3px;
        }
      `}</style>

      <div className="verify-card">
        {/* Brand */}
        <div className="verify-brand">
          <div className="verify-brand-dot" />
          <span className="verify-brand-name">APIForge</span>
        </div>

        {/* Loading State */}
        {status === 'idle' || status === 'loading' ? (
          <>
            <div className="verify-icon-wrap verify-icon-wrap--loading">
              <SpinnerIcon />
            </div>
            <h1 className="verify-title">Verifying your email…</h1>
            <p className="verify-desc">Please wait while we confirm your email address.</p>
            <span className="verify-loading-label">This takes just a moment</span>
          </>
        ) : null}

        {/* Success State */}
        {status === 'success' && (
          <>
            <div className="verify-icon-wrap verify-icon-wrap--success">
              <MailCheckIcon />
            </div>
            <h1 className="verify-title">Email verified!</h1>
            <p className="verify-desc">
              Your email address has been confirmed. Your account is now fully active — you can sign in.
            </p>
            <div className="verify-actions">
              <Link to="/login" className="btn btn-primary" style={{ textDecoration: 'none', textAlign: 'center' }}>
                Go to Sign In
              </Link>
            </div>
          </>
        )}

        {/* Error State */}
        {status === 'error' && (
          <>
            <div className="verify-icon-wrap verify-icon-wrap--error">
              <MailXIcon />
            </div>
            <h1 className="verify-title">
              {isAlreadyUsed ? 'Already verified' : isExpired ? 'Link expired' : 'Verification failed'}
            </h1>
            <p className="verify-desc">{message}</p>

            <div className="verify-actions">
              {/* Already verified — just go to login */}
              {isAlreadyUsed && (
                <Link to="/login" className="btn btn-primary" style={{ textDecoration: 'none', textAlign: 'center' }}>
                  Go to Sign In
                </Link>
              )}

              {/* Expired or invalid — offer resend + login */}
              {!isAlreadyUsed && (
                <>
                  <Link to="/resend-verification" className="btn btn-primary" style={{ textDecoration: 'none', textAlign: 'center' }}>
                    Request a new verification link
                  </Link>
                  <Link to="/login" className="btn btn-secondary" style={{ textDecoration: 'none', textAlign: 'center' }}>
                    Back to Sign In
                  </Link>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
