import { useState } from 'react'
import Modal from './Modal'

function buildCurl(method, url, headers, body) {
  let cmd = `curl -X ${method} '${url}'`
  if (headers) {
    try {
      const h = JSON.parse(headers)
      Object.entries(h).forEach(([k, v]) => { cmd += `\\\n  -H '${k}: ${v}'` })
    } catch {}
  }
  if (body) cmd += `\\\n  -d '${body.replace(/'/g, "\\'")}'`
  return cmd
}

function buildFetch(method, url, headers, body) {
  const opts = { method }
  if (headers) { try { opts.headers = JSON.parse(headers) } catch {} }
  if (body) opts.body = body
  const optsStr = JSON.stringify(opts, null, 2)
  return `fetch('${url}', ${optsStr})\n  .then(r => r.json())\n  .then(console.log)`
}

function buildAxios(method, url, headers, body) {
  const m = method.toLowerCase()
  const lines = [`import axios from 'axios'`, ``]
  const config = {}
  if (headers) { try { config.headers = JSON.parse(headers) } catch {} }
  const hasBody = body && (m === 'post' || m === 'put' || m === 'patch')
  if (hasBody) {
    lines.push(`axios.${m}('${url}', ${body},`)
    lines.push(`  ${JSON.stringify(config, null, 2).replace(/\n/g, '\n  ')}`)
    lines.push(`)`)
  } else {
    lines.push(`axios.${m}('${url}',`)
    lines.push(`  ${JSON.stringify(config, null, 2).replace(/\n/g, '\n  ')}`)
    lines.push(`)`)
  }
  lines.push(`  .then(res => console.log(res.data))`)
  lines.push(`  .catch(err => console.error(err))`)
  return lines.join('\n')
}

export default function CodeModal({ url, method, headers, body, onClose }) {
  const [tab, setTab] = useState('curl')
  const [copied, setCopied] = useState(false)
  const snippet = tab === 'curl'
    ? buildCurl(method, url, headers, body)
    : tab === 'fetch'
      ? buildFetch(method, url, headers, body)
      : buildAxios(method, url, headers, body)

  const handleCopy = async () => {
    let ok = false
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(snippet)
        ok = true
      }
    } catch {}
    if (!ok) {
      try {
        const ta = document.createElement('textarea')
        ta.value = snippet
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
        ok = true
      } catch {}
    }
    if (ok) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <Modal title="Code snippet" onClose={onClose} wide>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        {[
          { id: 'curl', label: 'cURL' },
          { id: 'fetch', label: 'fetch (JS)' },
          { id: 'axios', label: 'axios (JS)' },
        ].map(({ id, label }) => (
          <button key={id} className={`btn-sm ${tab === id ? 'btn-sm-primary' : 'btn-sm-ghost'}`}
            style={{ height: 24, fontSize: 11 }} onClick={() => { setTab(id); setCopied(false) }}>
            {label}
          </button>
        ))}
      </div>
      <div style={{ position: 'relative' }}>
        <pre style={{
          fontFamily: 'var(--mono)', fontSize: 12, lineHeight: 1.6,
          background: 'var(--bg-void)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)', padding: 12, margin: 0,
          whiteSpace: 'pre-wrap', wordBreak: 'break-all',
          color: 'var(--text-secondary)', maxHeight: '60vh', overflowY: 'auto',
        }}>
          {snippet}
        </pre>
        <button className="btn-sm btn-sm-ghost"
          style={{ position: 'absolute', top: 8, right: 8, fontSize: 11 }}
          onClick={handleCopy}>
          {copied ? '✓ Copied!' : 'Copy'}
        </button>
      </div>
    </Modal>
  )
}
