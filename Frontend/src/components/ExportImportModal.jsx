import { useState, useRef } from 'react'
import Modal from './Modal'
import { getFoldersApi, createFolderApi } from '../api/collectionApi'
import { getRequestsByCollectionApi, getRequestsByFolderApi, createRequestApi } from '../api/requestApi'

async function exportCollection(collection) {
  const foldersRes = await getFoldersApi(collection.id)
  const folders = foldersRes.data || []

  const rootReqsRes = await getRequestsByCollectionApi(collection.id)
  const rootRequests = (rootReqsRes.data || []).filter((r) => !r.folderId)

  const foldersWithReqs = await Promise.all(
    folders.map(async (f) => {
      const rRes = await getRequestsByFolderApi(f.id)
      return { ...f, requests: rRes.data || [] }
    })
  )

  return {
    name: collection.name,
    description: collection.description,
    requests: rootRequests,
    folders: foldersWithReqs,
  }
}

function mapPostmanRequest(item) {
  const req = typeof item?.request === 'object' && item.request !== null ? item.request : {}
  const method = typeof req.method === 'string' && req.method ? req.method.toUpperCase() : 'GET'
  const url = typeof item?.request === 'string' ? item.request : (typeof req.url === 'string' ? req.url : (req.url?.raw || ''))

  let headers = null
  if (Array.isArray(req.header)) {
    const hObj = {}
    for (const h of req.header) {
      if (!h.disabled && h.key) {
        hObj[h.key] = h.value ?? ''
      }
    }
    if (Object.keys(hObj).length > 0) headers = JSON.stringify(hObj)
  }

  let queryParams = null
  if (Array.isArray(req.url?.query)) {
    const qObj = {}
    for (const q of req.url.query) {
      if (!q.disabled && q.key) {
        qObj[q.key] = q.value ?? ''
      }
    }
    if (Object.keys(qObj).length > 0) queryParams = JSON.stringify(qObj)
  }

  const body = req.body?.mode === 'raw' ? (req.body?.raw ?? null) : null

  return {
    name: item?.name || 'Untitled Request',
    method,
    url,
    headers,
    queryParams,
    body,
  }
}

function parsePostmanItems(items, parentName = '') {
  const requests = []
  const folders = []

  for (const item of items || []) {
    if (Array.isArray(item.item)) {
      const folderName = parentName ? `${parentName} / ${item.name || 'Folder'}` : (item.name || 'Folder')
      const nested = parsePostmanItems(item.item, folderName)
      folders.push({ name: folderName, requests: nested.requests })
      folders.push(...nested.folders)
    } else {
      requests.push(item)
    }
  }

  return { requests, folders }
}

async function importCollection(workspaceId, data, createCollectionFn, createFolderFn) {
  const isPostmanV2 = Boolean(data?.info?.schema?.includes('collection/v2') && Array.isArray(data?.item))
  let col
  let folderCount = 0
  let reqCount = 0

  if (isPostmanV2) {
    const desc = typeof data.info?.description === 'string'
      ? data.info.description
      : (data.info?.description?.content || undefined)
    col = await createCollectionFn({ name: data.info?.name || 'Imported Collection', description: desc })
    const colId = col.id

    const { requests: rootReqs, folders } = parsePostmanItems(data.item)

    for (const item of rootReqs) {
      const reqData = mapPostmanRequest(item)
      await createRequestApi(colId, { ...reqData, folderId: null })
      reqCount++
    }

    for (const folder of folders) {
      const f = await createFolderFn(colId, { name: folder.name })
      folderCount++
      for (const item of folder.requests || []) {
        const reqData = mapPostmanRequest(item)
        await createRequestApi(colId, { ...reqData, folderId: f.id })
        reqCount++
      }
    }
  } else {
    col = await createCollectionFn({ name: data.name || 'Imported', description: data.description })
    const colId = col.id

    for (const req of data.requests || []) {
      await createRequestApi(colId, { name: req.name, method: req.method, url: req.url, headers: req.headers, queryParams: req.queryParams, body: req.body, folderId: null })
      reqCount++
    }
    for (const folder of data.folders || []) {
      const f = await createFolderFn(colId, { name: folder.name })
      folderCount++
      for (const req of folder.requests || []) {
        await createRequestApi(colId, { name: req.name, method: req.method, url: req.url, headers: req.headers, queryParams: req.queryParams, body: req.body, folderId: f.id })
        reqCount++
      }
    }
  }

  return {
    col,
    summary: { collections: 1, folders: folderCount, requests: reqCount },
  }
}

export default function ExportImportModal({ collection, workspaceId, onClose, onImported, addCollection, addFolder }) {
  const [mode, setMode] = useState(collection ? 'export' : 'import')
  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState(null)
  const [summary, setSummary] = useState(null)
  const fileRef = useRef(null)

  const handleExport = async () => {
    setExporting(true); setError(null)
    try {
      const data = await exportCollection(collection)
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `${collection.name.replace(/\s+/g, '_')}.json`
      a.click(); URL.revokeObjectURL(a.href)
    } catch (e) { setError(e.response?.data?.message || 'Export failed') }
    finally { setExporting(false) }
  }

  const handleImport = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true); setError(null); setSummary(null)
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      const res = await importCollection(workspaceId, data, addCollection, addFolder)
      setSummary(res.summary)
      onImported?.(res.col)
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Import failed')
      onImported?.()
    } finally {
      setImporting(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <Modal title="Export / Import" onClose={onClose}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {collection && (
          <button className={`btn-sm ${mode === 'export' ? 'btn-sm-primary' : 'btn-sm-ghost'}`}
            onClick={() => { setMode('export'); setError(null); setSummary(null) }}>Export</button>
        )}
        <button className={`btn-sm ${mode === 'import' ? 'btn-sm-primary' : 'btn-sm-ghost'}`}
          onClick={() => { setMode('import'); setError(null); setSummary(null) }}>Import</button>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 10 }}>{error}</div>}
      {summary && (
        <div className="alert alert-success" style={{ marginBottom: 10 }}>
          Imported {summary.collections} collection{summary.collections !== 1 ? 's' : ''}, {summary.folders} folder{summary.folders !== 1 ? 's' : ''}, {summary.requests} request{summary.requests !== 1 ? 's' : ''}.
        </div>
      )}

      {mode === 'export' && collection && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Export <strong style={{ color: 'var(--text-primary)' }}>{collection.name}</strong> as JSON including all folders and requests.
          </div>
          <button className="btn-sm btn-sm-primary" style={{ alignSelf: 'flex-start' }}
            onClick={handleExport} disabled={exporting}>
            {exporting ? 'Exporting…' : 'Download JSON'}
          </button>
        </div>
      )}

      {mode === 'import' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Import a collection JSON file. A new collection will be created.
          </div>
          <input ref={fileRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-sm btn-sm-primary"
              onClick={() => fileRef.current?.click()} disabled={importing}>
              {importing ? 'Importing…' : 'Choose file'}
            </button>
            {summary && (
              <button className="btn-sm btn-sm-ghost" onClick={onClose}>
                Done
              </button>
            )}
          </div>
        </div>
      )}
    </Modal>
  )
}
