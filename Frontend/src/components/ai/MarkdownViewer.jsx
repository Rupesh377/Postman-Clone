import React, { useState } from 'react'
import { CopyIcon, CheckIcon } from './aiIcons'

function CodeBlock({ code, language }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(code)
      } else {
        const ta = document.createElement('textarea')
        ta.value = code
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
      }
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  return (
    <div className="ai-markdown-code-wrapper">
      <div className="ai-markdown-code-header">
        <span className="ai-markdown-code-lang">{language || 'code'}</span>
        <button
          type="button"
          className="btn-icon-xs"
          onClick={handleCopy}
          title="Copy code"
          aria-label="Copy code"
        >
          {copied ? <CheckIcon size={12} style={{ color: 'var(--success)' }} /> : <CopyIcon size={12} />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <pre className="ai-markdown-code-body">
        <code>{code}</code>
      </pre>
    </div>
  )
}

function renderInline(text) {
  if (!text) return null
  // Regex to match **bold**, `code`, *italic*
  const tokens = []
  let cursor = 0
  const regex = /(\*\*.*?\*\*|`.*?`|\*.*?\*)/g
  let match

  while ((match = regex.exec(text)) !== null) {
    if (match.index > cursor) {
      tokens.push(text.substring(cursor, match.index))
    }
    const token = match[0]
    if (token.startsWith('**') && token.endsWith('**')) {
      tokens.push(<strong key={tokens.length}>{token.slice(2, -2)}</strong>)
    } else if (token.startsWith('`') && token.endsWith('`')) {
      tokens.push(<code key={tokens.length} className="ai-inline-code">{token.slice(1, -1)}</code>)
    } else if (token.startsWith('*') && token.endsWith('*')) {
      tokens.push(<em key={tokens.length}>{token.slice(1, -1)}</em>)
    } else {
      tokens.push(token)
    }
    cursor = regex.lastIndex
  }
  if (cursor < text.length) {
    tokens.push(text.substring(cursor))
  }
  return tokens
}

export default function MarkdownViewer({ content, className = '' }) {
  if (!content) return null

  // Parse lines into blocks
  const lines = content.split('\n')
  const blocks = []
  let inCodeBlock = false
  let codeLang = ''
  let codeBuffer = []
  let listBuffer = []

  const flushList = () => {
    if (listBuffer.length > 0) {
      blocks.push({
        type: 'list',
        items: [...listBuffer],
      })
      listBuffer = []
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Code block delimiters
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        blocks.push({
          type: 'code',
          lang: codeLang,
          code: codeBuffer.join('\n'),
        })
        codeBuffer = []
        inCodeBlock = false
      } else {
        flushList()
        inCodeBlock = true
        codeLang = line.trim().slice(3).trim()
      }
      continue
    }

    if (inCodeBlock) {
      codeBuffer.push(line)
      continue
    }

    // Headings
    if (line.startsWith('# ')) {
      flushList()
      blocks.push({ type: 'h1', text: line.slice(2) })
    } else if (line.startsWith('## ')) {
      flushList()
      blocks.push({ type: 'h2', text: line.slice(3) })
    } else if (line.startsWith('### ')) {
      flushList()
      blocks.push({ type: 'h3', text: line.slice(4) })
    } else if (line.startsWith('#### ')) {
      flushList()
      blocks.push({ type: 'h4', text: line.slice(5) })
    } else if (line.startsWith('> ')) {
      flushList()
      blocks.push({ type: 'blockquote', text: line.slice(2) })
    } else if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      const bulletText = line.trim().slice(2)
      listBuffer.push(bulletText)
    } else if (/^\d+\.\s/.test(line.trim())) {
      const numText = line.trim().replace(/^\d+\.\s/, '')
      listBuffer.push(numText)
    } else if (!line.trim()) {
      flushList()
      // empty line / paragraph break
    } else {
      flushList()
      blocks.push({ type: 'p', text: line })
    }
  }

  if (inCodeBlock && codeBuffer.length > 0) {
    blocks.push({ type: 'code', lang: codeLang, code: codeBuffer.join('\n') })
  }
  flushList()

  return (
    <div className={`ai-markdown-viewer ${className}`}>
      {blocks.map((block, idx) => {
        switch (block.type) {
          case 'h1':
            return <h1 key={idx} className="ai-markdown-h1">{renderInline(block.text)}</h1>
          case 'h2':
            return <h2 key={idx} className="ai-markdown-h2">{renderInline(block.text)}</h2>
          case 'h3':
            return <h3 key={idx} className="ai-markdown-h3">{renderInline(block.text)}</h3>
          case 'h4':
            return <h4 key={idx} className="ai-markdown-h4">{renderInline(block.text)}</h4>
          case 'blockquote':
            return <blockquote key={idx} className="ai-markdown-quote">{renderInline(block.text)}</blockquote>
          case 'list':
            return (
              <ul key={idx} className="ai-markdown-list">
                {block.items.map((item, itemIdx) => (
                  <li key={itemIdx}>{renderInline(item)}</li>
                ))}
              </ul>
            )
          case 'code':
            return <CodeBlock key={idx} code={block.code} language={block.lang} />
          case 'p':
          default:
            return <p key={idx} className="ai-markdown-p">{renderInline(block.text)}</p>
        }
      })}
    </div>
  )
}
