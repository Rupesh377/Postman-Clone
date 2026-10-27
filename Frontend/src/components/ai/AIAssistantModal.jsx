import { useState, useEffect } from 'react'
import GenerateBodyPanel from './GenerateBodyPanel'
import SuggestHeadersPanel from './SuggestHeadersPanel'
import ExplainResponsePanel from './ExplainResponsePanel'
import GenerateDocsPanel from './GenerateDocsPanel'
import GenerateTestsPanel from './GenerateTestsPanel'
import TestAssertionEditor from './TestAssertionEditor'
import GenerateAndRunTestsPanel from './GenerateAndRunTestsPanel'
import {
  SparklesIcon,
  CodeBracketIcon,
  HeadersIcon,
  DocumentTextIcon,
  BeakerIcon,
  PlayIcon,
  BoltIcon,
  CheckIcon,
} from './aiIcons'

export default function AIAssistantModal({
  isOpen,
  initialTool = 'body',
  onClose,
  // Request props
  requestId,
  requestName,
  url,
  method,
  headers,
  body,
  response,
  environmentId,
  environmentName,
  // State modification actions
  onApplyBody,
  onApplyHeaders,
  onSaveFirst,
}) {
  const [activeTool, setActiveTool] = useState(initialTool)
  const [transferredAssertions, setTransferredAssertions] = useState(null)

  useEffect(() => {
    if (initialTool) {
      setActiveTool(initialTool)
    }
  }, [initialTool, isOpen])

  // ESC to close
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleTransferToRunner = (assertions) => {
    setTransferredAssertions(assertions)
    setActiveTool('runner')
  }

  const navItems = [
    { id: 'body', label: 'Body Generator', icon: CodeBracketIcon, section: 'Authoring' },
    { id: 'headers', label: 'Header Suggestions', icon: HeadersIcon, section: 'Authoring' },
    { id: 'explain', label: 'Response Explainer', icon: SparklesIcon, section: 'Analysis' },
    { id: 'docs', label: 'API Documentation', icon: DocumentTextIcon, section: 'Analysis' },
    { id: 'tests', label: 'Test Case Generator', icon: BeakerIcon, section: 'Testing' },
    { id: 'runner', label: 'Test Runner (Assertions)', icon: PlayIcon, section: 'Testing' },
    { id: 'gen-and-run', label: '1-Click Gen & Run', icon: BoltIcon, section: 'Testing' },
  ]

  return (
    <div className="ai-modal-overlay" onClick={onClose}>
      <div className="ai-modal-container" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        {/* Top Header */}
        <div className="ai-modal-header">
          <div className="ai-modal-header-left">
            <div className="ai-brand-badge">
              <span className="ai-brand-sparkle">
                <SparklesIcon size={18} />
              </span>
              <span>APIForge Spring AI</span>
            </div>
            <div className="ai-req-context-badge">
              <span style={{ color: 'var(--orange)', fontWeight: 700 }}>{method}</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{url || 'No URL'}</span>
            </div>
          </div>
          <button
            type="button"
            className="ai-modal-close-btn"
            onClick={onClose}
            aria-label="Close AI Assistant"
            title="Close (Esc)"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body Layout: Sidebar + Main Content */}
        <div className="ai-modal-body">
          <nav className="ai-modal-sidebar" aria-label="AI Tools Navigation">
            <div className="ai-sidebar-section-title">Request Authoring</div>
            {navItems
              .filter((item) => item.section === 'Authoring')
              .map((item) => {
                const Icon = item.icon
                const isActive = activeTool === item.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`ai-nav-item ${isActive ? 'active' : ''}`}
                    onClick={() => setActiveTool(item.id)}
                  >
                    <span className="ai-nav-item-icon">
                      <Icon size={16} />
                    </span>
                    <span>{item.label}</span>
                  </button>
                )
              })}

            <div className="ai-sidebar-section-title">Response Analysis</div>
            {navItems
              .filter((item) => item.section === 'Analysis')
              .map((item) => {
                const Icon = item.icon
                const isActive = activeTool === item.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`ai-nav-item ${isActive ? 'active' : ''}`}
                    onClick={() => setActiveTool(item.id)}
                  >
                    <span className="ai-nav-item-icon">
                      <Icon size={16} />
                    </span>
                    <span>{item.label}</span>
                  </button>
                )
              })}

            <div className="ai-sidebar-section-title">Quality & Testing</div>
            {navItems
              .filter((item) => item.section === 'Testing')
              .map((item) => {
                const Icon = item.icon
                const isActive = activeTool === item.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`ai-nav-item ${isActive ? 'active' : ''}`}
                    onClick={() => setActiveTool(item.id)}
                  >
                    <span className="ai-nav-item-icon">
                      <Icon size={16} />
                    </span>
                    <span>{item.label}</span>
                  </button>
                )
              })}
          </nav>

          <main className="ai-modal-content-area">
            {activeTool === 'body' && (
              <GenerateBodyPanel
                currentBody={body}
                onApplyBody={onApplyBody}
                onClose={onClose}
              />
            )}

            {activeTool === 'headers' && (
              <SuggestHeadersPanel
                url={url}
                method={method}
                body={body}
                existingHeaders={headers}
                onApplyHeaders={onApplyHeaders}
              />
            )}

            {activeTool === 'explain' && (
              <ExplainResponsePanel
                response={response}
              />
            )}

            {activeTool === 'docs' && (
              <GenerateDocsPanel
                url={url}
                method={method}
                headers={headers}
                body={body}
                response={response}
              />
            )}

            {activeTool === 'tests' && (
              <GenerateTestsPanel
                url={url}
                method={method}
                body={body}
                response={response}
                onTransferToRunner={handleTransferToRunner}
              />
            )}

            {activeTool === 'runner' && (
              <TestAssertionEditor
                requestId={requestId}
                requestName={requestName}
                environmentId={environmentId}
                environmentName={environmentName}
                onSaveFirst={onSaveFirst}
                initialAssertions={transferredAssertions}
              />
            )}

            {activeTool === 'gen-and-run' && (
              <GenerateAndRunTestsPanel
                requestId={requestId}
                requestName={requestName}
                url={url}
                method={method}
                body={body}
                response={response}
                environmentId={environmentId}
                environmentName={environmentName}
                onSaveFirst={onSaveFirst}
              />
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
