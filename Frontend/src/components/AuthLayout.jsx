import AppLogo from './AppLogo'
import '../styles/authLayout.css'

export default function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="auth-root">
      {/* Left panel */}
      <div className="auth-left">
        <div className="auth-left-content">
          <div className="auth-brand">
            <AppLogo size={28} />
            <span className="auth-brand-name">APIForge</span>
          </div>
          <h1 className="auth-tagline">
            HTTP client for developers who prefer working over configuring.
          </h1>
          <p className="auth-desc">
            Save requests, organise them into collections, resolve environment
            variables, and inspect responses — all from the browser.
          </p>
          <div className="auth-features">
            <div className="auth-feature">
              <span className="auth-feature-dot" />
              Collections and folders with drag-free organisation
            </div>
            <div className="auth-feature">
              <span className="auth-feature-dot" />
              Environment variables with {'{{double-brace}}'} syntax
            </div>
            <div className="auth-feature">
              <span className="auth-feature-dot" />
              Execution history per request
            </div>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="auth-right">
        <div className="auth-card">
          <div className="auth-card-header">
            <div className="auth-card-logo">
              <AppLogo size={28} />
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
