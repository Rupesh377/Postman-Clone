import '../styles/authLayout.css'

// APIForge logo inline SVG
const AppLogo = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="32" height="32" rx="8" fill="#FF6C37"/>
    <path d="M8 22l4-12h2l2 6 2-6h2l4 12h-2.5l-1-3h-4l-1 3H8zm5-5h3l-1.5-4.5L13 17z" fill="white"/>
    <circle cx="24" cy="10" r="3" fill="white" fillOpacity="0.9"/>
  </svg>
)

export default function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="auth-root">
      {/* Left decorative panel */}
      <div className="auth-left">
        <div className="auth-left-content">
          <div className="auth-brand">
            <AppLogo />
            <span className="auth-brand-name">APIForge</span>
          </div>
          <h1 className="auth-tagline">
            Build. Test.<br />Ship APIs faster.
          </h1>
          <p className="auth-desc">
            Design, test, and collaborate on your APIs with ease.
            Trusted by developers around the world.
          </p>
          <div className="auth-stats">
            <div className="auth-stat">
              <span className="auth-stat-num">10M+</span>
              <span className="auth-stat-label">API Calls/day</span>
            </div>
            <div className="auth-stat">
              <span className="auth-stat-num">50K+</span>
              <span className="auth-stat-label">Developers</span>
            </div>
            <div className="auth-stat">
              <span className="auth-stat-num">99.9%</span>
              <span className="auth-stat-label">Uptime</span>
            </div>
          </div>
        </div>
        <div className="auth-left-illustration">
          <div className="illustration-circle c1" />
          <div className="illustration-circle c2" />
          <div className="illustration-circle c3" />
        </div>
      </div>

      {/* Right form panel */}
      <div className="auth-right">
        <div className="auth-card">
          <div className="auth-card-header">
            <div className="auth-card-logo">
              <AppLogo />
            </div>
            <h2 className="auth-card-title">{title}</h2>
            {subtitle && <p className="auth-card-subtitle">{subtitle}</p>}
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
