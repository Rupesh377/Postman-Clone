import { useState, useEffect, useRef } from 'react'
import { useWorkspace } from '../context/WorkspaceContext'
import { useToast } from '../context/ToastContext'
import { deleteRequestApi, createRequestApi, updateRequestApi } from '../api/requestApi'
import { updateCollectionApi, updateFolderApi } from '../api/collectionApi'
import Modal from './Modal'
import ExportImportModal from './ExportImportModal'
import RunnerModal from './RunnerModal'
import '../styles/app.css'

const FolderIcon = ({ open }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    {open
      ? <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
      : <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
    }
  </svg>
)

const CollectionIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
  </svg>
)

const RequestIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
  </svg>
)

const ChevronIcon = ({ open }) => (
  <svg
    width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
    style={{ transform: open ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform 0.15s ease', flexShrink: 0 }}
  >
    <polyline points="9 18 15 12 9 6" />
  </svg>
)

const PlusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
)

const TrashIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
    <path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
  </svg>
)

function MethodBadge({ method }) {
  return <span className={`method-badge method-${method}`}>{method}</span>
}

function RequestItem({ request, active, onSelect, onDelete, onDuplicate, onRename }) {
  const [renaming, setRenaming] = useState(false)
  const [renameVal, setRenameVal] = useState(request.name || '')
  const inputRef = useRef(null)

  const startRename = (e) => { e.stopPropagation(); setRenameVal(request.name || ''); setRenaming(true); setTimeout(() => inputRef.current?.select(), 0) }
  const commitRename = () => {
    setRenaming(false)
    const t = renameVal.trim()
    if (t && t !== request.name) onRename(request, t)
    else setRenameVal(request.name || '')
  }

  return (
    <div
      className={`tree-item ${active ? 'active' : ''}`}
      onClick={() => onSelect(request)}
      title={request.name || request.url}
    >
      <MethodBadge method={request.method} />
      {renaming ? (
        <input
          ref={inputRef}
          className="tree-inline-edit"
          value={renameVal}
          onChange={(e) => setRenameVal(e.target.value)}
          onBlur={commitRename}
          onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') { setRenaming(false); setRenameVal(request.name || '') } }}
          onClick={(e) => e.stopPropagation()}
          maxLength={100}
        />
      ) : (
        <span className="tree-item-label">{request.name || request.url || 'Untitled'}</span>
      )}
      <div className="tree-item-actions">
        <button className="tree-item-action-btn" title="Rename" onClick={startRename} aria-label="Rename request">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        <button className="tree-item-action-btn" title="Duplicate" onClick={(e) => { e.stopPropagation(); onDuplicate(request) }} aria-label="Duplicate request">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
          </svg>
        </button>
        <button
          className="tree-item-action-btn danger"
          title="Delete request"
          onClick={(e) => { e.stopPropagation(); onDelete(request) }}
          aria-label="Delete request"
        >
          <TrashIcon />
        </button>
      </div>
    </div>
  )
}

function InlineEdit({ value, onSave, className }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal]         = useState(value)
  const inputRef              = useRef(null)

  useEffect(() => { if (!editing) setVal(value) }, [value, editing])

  const start = (e) => { e.stopPropagation(); setEditing(true); setTimeout(() => inputRef.current?.select(), 0) }
  const commit = () => {
    setEditing(false)
    const t = val.trim()
    if (t && t !== value) onSave(t)
    else setVal(value)
  }
  const onKey = (e) => {
    e.stopPropagation()
    if (e.key === 'Enter')  commit()
    if (e.key === 'Escape') { setEditing(false); setVal(value) }
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        className="tree-inline-edit"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={commit}
        onKeyDown={onKey}
        onClick={(e) => e.stopPropagation()}
        maxLength={100}
        aria-label="Rename"
      />
    )
  }
  return (
    <span className={`tree-item-label ${className || ''}`} onDoubleClick={start} title="Double-click to rename">
      {value}
    </span>
  )
}

function FolderNode({ folder, collectionId, activeRequestId, onSelectRequest, onDeleteFolder, onDeleteRequest, onRenameFolder, onNewRequest, onDuplicateRequest, onRenameRequest }) {
  const [open, setOpen] = useState(false)
  const { requests, loadRequestsForFolder } = useWorkspace()
  const key = `fold_${folder.id}`
  const folderRequests = requests[key]

  const toggle = () => {
    const next = !open
    setOpen(next)
    if (next && !folderRequests) {
      loadRequestsForFolder(folder.id)
    }
  }

  return (
    <div>
      <div className="tree-item" onClick={toggle} title={folder.name}>
        <ChevronIcon open={open} />
        <span className="tree-item-icon"><FolderIcon open={open} /></span>
        <InlineEdit
          value={folder.name}
          onSave={(name) => onRenameFolder(folder, name)}
        />
        <div className="tree-item-actions">
          <button
            className="tree-item-action-btn"
            title="Add request to folder"
            onClick={(e) => { e.stopPropagation(); setOpen(true); if (!folderRequests) loadRequestsForFolder(folder.id); onNewRequest(collectionId, folder.id) }}
            aria-label="Add request to folder"
          >
            <PlusIcon />
          </button>
          <button
            className="tree-item-action-btn danger"
            title="Delete folder"
            onClick={(e) => { e.stopPropagation(); onDeleteFolder(folder) }}
            aria-label="Delete folder"
          >
            <TrashIcon />
          </button>
        </div>
      </div>

      {open && (
        <div className="tree-children">
          {!folderRequests && (
            <div className="tree-hint">Loading…</div>
          )}
          {folderRequests?.length === 0 && (
            <div className="tree-hint">No requests — save one from the builder</div>
          )}
          {folderRequests?.map((req) => (
            <RequestItem
              key={req.id}
              request={req}
              active={activeRequestId === req.id}
              onSelect={onSelectRequest}
              onDelete={(r) => onDeleteRequest(r, collectionId, folder.id)}
              onDuplicate={(r) => onDuplicateRequest(r, collectionId)}
              onRename={onRenameRequest}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function CollectionNode({ collection, activeRequestId, onSelectRequest, onDeleteCollection, onRenameCollection, onNewRequest, onDuplicateRequest, onRenameRequest, onRequestDeleted, onFolderDeleted, onRunCollection }) {
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [showAddFolder, setShowAddFolder] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [folderName, setFolderName] = useState('')
  const [saving, setSaving] = useState(false)

  const {
    folders,
    requests,
    loadFolders,
    loadRequestsForCollection,
    addFolder,
    removeFolder,
    removeRequestFromStore,
  } = useWorkspace()

  const colFolders = folders[collection.id]
  const colRequests = requests[`col_${collection.id}`]

  const toggle = () => {
    const next = !open
    setOpen(next)
    if (next) {
      if (!colFolders) loadFolders(collection.id)
      if (!colRequests) loadRequestsForCollection(collection.id)
    }
  }

  const handleAddFolder = async (e) => {
    e.preventDefault()
    if (!folderName.trim()) return
    setSaving(true)
    try {
      await addFolder(collection.id, { name: folderName.trim() })
      setFolderName('')
      setShowAddFolder(false)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteFolder = async (folder) => {
    if (!window.confirm(`Delete folder "${folder.name}" and its requests?`)) return
    try {
      await removeFolder(collection.id, folder.id)
      onFolderDeleted?.(folder.id)
    } catch {
      toast.error('Failed to delete folder')
    }
  }

  const handleRenameFolder = async (folder, newName) => {
    try {
      await updateFolderApi(folder.id, { name: newName, description: folder.description })
      loadFolders(collection.id)
    } catch {
      toast.error('Failed to rename folder')
    }
  }

  const handleDeleteRequest = async (request, colId, folderId) => {
    if (!window.confirm(`Delete "${request.name || request.url}"?`)) return
    try {
      await deleteRequestApi(request.id)
      removeRequestFromStore(colId, folderId, request.id)
      onRequestDeleted?.(request.id)
    } catch {
      toast.error('Failed to delete request')
    }
  }

  return (
    <div style={{ marginBottom: '2px' }}>
      <div className="tree-item" onClick={toggle} title={collection.name}>
        <ChevronIcon open={open} />
        <span className="tree-item-icon" style={{ color: 'var(--orange)' }}>
          <CollectionIcon />
        </span>
        <InlineEdit
          value={collection.name}
          onSave={(name) => onRenameCollection(collection, name)}
        />
        <div className="tree-item-actions">
          <button
            className="tree-item-action-btn"
            title="Add to collection"
            onClick={(e) => { e.stopPropagation(); setShowMenu((v) => !v) }}
            aria-label="Add to collection"
          >
            <PlusIcon />
          </button>
          {showMenu && (
            <div
              className="tree-add-menu"
              onMouseLeave={() => setShowMenu(false)}
            >
              <button
                className="tree-add-menu-item"
                onClick={(e) => { e.stopPropagation(); setShowMenu(false); onRunCollection?.(collection) }}
              >
                Run
              </button>
              <button
                className="tree-add-menu-item"
                onClick={(e) => { e.stopPropagation(); setShowMenu(false); setOpen(true); onNewRequest(collection.id, null) }}
              >
                New Request
              </button>
              <button
                className="tree-add-menu-item"
                onClick={(e) => { e.stopPropagation(); setShowMenu(false); setOpen(true); setShowAddFolder(true) }}
              >
                New Folder
              </button>
            </div>
          )}
          <button
            className="tree-item-action-btn danger"
            title="Delete collection"
            onClick={(e) => { e.stopPropagation(); onDeleteCollection(collection) }}
            aria-label="Delete collection"
          >
            <TrashIcon />
          </button>
        </div>
      </div>

      {open && (
        <div className="tree-children">
          {!colFolders && <div className="tree-hint">Loading…</div>}
          {colFolders?.map((folder) => (
            <FolderNode
              key={folder.id}
              folder={folder}
              collectionId={collection.id}
              activeRequestId={activeRequestId}
              onSelectRequest={onSelectRequest}
              onDeleteFolder={handleDeleteFolder}
              onRenameFolder={handleRenameFolder}
              onDeleteRequest={handleDeleteRequest}
              onNewRequest={onNewRequest}
              onDuplicateRequest={onDuplicateRequest}
              onRenameRequest={onRenameRequest}
            />
          ))}

          {colRequests?.map((req) => (
            <RequestItem
              key={req.id}
              request={req}
              active={activeRequestId === req.id}
              onSelect={onSelectRequest}
              onDelete={(r) => handleDeleteRequest(r, collection.id, null)}
              onDuplicate={(r) => onDuplicateRequest(r, collection.id)}
              onRename={onRenameRequest}
            />
          ))}

          {showAddFolder && (
            <form onSubmit={handleAddFolder} style={{ display: 'flex', gap: '6px', padding: '6px 4px' }}>
              <input
                className="kv-input"
                style={{ flex: 1, height: '30px', fontSize: '12px' }}
                placeholder="Folder name"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                autoFocus
              />
              <button type="submit" className="btn-sm btn-sm-primary"
                style={{ height: '30px', padding: '0 10px', fontSize: '12px' }} disabled={saving}>
                Add
              </button>
              <button type="button" className="btn-sm btn-sm-ghost"
                style={{ height: '30px', padding: '0 8px', fontSize: '12px' }}
                onClick={() => { setShowAddFolder(false); setFolderName('') }}>
                ✕
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  )
}

export default function Sidebar({ workspace, onSelectRequest, activeRequestId, collapsed, onNewRequest, onRequestDeleted, onRequestRenamed, onCollectionDeleted, onFolderDeleted }) {
  const toast = useToast()
  const [showAddCollection, setShowAddCollection] = useState(false)
  const [collectionName, setCollectionName] = useState('')
  const [collectionDesc, setCollectionDesc] = useState('')
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  const { collections, loading, error, loadCollections, addCollection, removeCollection, addRequestToStore, addFolder } = useWorkspace()

  useEffect(() => { loadCollections() }, [loadCollections])

  const [showImportExport, setShowImportExport] = useState(false)
  const [exportTarget, setExportTarget] = useState(null)
  const [runnerCollection, setRunnerCollection] = useState(null)

  const handleDuplicateRequest = async (request, collectionId) => {
    try {
      const res = await createRequestApi(collectionId, {
        name: `${request.name} (copy)`,
        method: request.method,
        url: request.url,
        headers: request.headers,
        queryParams: request.queryParams,
        body: request.body,
        folderId: request.folderId || null,
      })
      addRequestToStore(collectionId, res.data)
    } catch { toast.error('Failed to duplicate request') }
  }

  const handleRenameRequest = async (request, newName) => {
    try {
      const res = await updateRequestApi(request.id, {
        name: newName, method: request.method, url: request.url,
        headers: request.headers, queryParams: request.queryParams,
        body: request.body, folderId: request.folderId || null,
      })
      loadCollections()
      onRequestRenamed?.(res.data || { ...request, name: newName })
    } catch { toast.error('Failed to rename request') }
  }

  const handleAddCollection = async (e) => {
    e.preventDefault()
    if (!collectionName.trim()) return
    setSaving(true)
    try {
      await addCollection({ name: collectionName.trim(), description: collectionDesc.trim() || undefined })
      setCollectionName('')
      setCollectionDesc('')
      setShowAddCollection(false)
    } catch {
      toast.error('Failed to create collection')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteCollection = async (collection) => {
    if (!window.confirm(`Delete "${collection.name}" and all its folders and requests? This cannot be undone.`)) return
    try {
      await removeCollection(collection.id)
      onCollectionDeleted?.(collection.id)
    } catch {
      toast.error('Failed to delete collection')
    }
  }

  const handleRenameCollection = async (collection, newName) => {
    try {
      await updateCollectionApi(collection.id, { name: newName, description: collection.description })
      loadCollections()
    } catch {
      toast.error('Failed to rename collection')
    }
  }

  return (
    <aside className={`sidebar${collapsed ? ' collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-workspace-name-label">
          {workspace?.name || 'Workspace'}
        </div>
        <input
          className="kv-input"
          style={{ marginTop: 6, width: '100%', height: 26, fontSize: 12 }}
          placeholder="Search…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search collections and requests"
        />
      </div>

      <nav className="sidebar-nav" aria-label="Collections">
        <div className="tree-section">
          <div className="tree-section-header">
            <span className="tree-section-label">Collections</span>
            <div style={{ display: 'flex', gap: 2 }}>
              <button
                className="tree-add-btn"
                onClick={() => { setExportTarget(null); setShowImportExport(true) }}
                title="Import collection"
                aria-label="Import collection"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
              </button>
              <button
                className="tree-add-btn"
                onClick={() => setShowAddCollection(true)}
                title="New collection"
                aria-label="Add collection"
              >
                <PlusIcon />
              </button>
            </div>
          </div>

          {loading && (
            <div style={{ padding: '12px 8px', fontSize: '12px', color: 'var(--text-subtle)' }}>Loading…</div>
          )}
          {error && (
            <div style={{ padding: '8px', fontSize: '12px', color: 'var(--error)' }}>{error}</div>
          )}
          {!loading && !error && collections.length === 0 && (
            <div style={{ padding: '12px 8px 4px', fontSize: '12px', color: 'var(--text-subtle)', lineHeight: 1.6 }}>
              No collections yet. Hit <strong style={{ color: 'var(--text-muted)' }}>+</strong> to create your first one.
            </div>
          )}

          {collections
            .filter((c) => !search.trim() || c.name.toLowerCase().includes(search.toLowerCase()))
            .map((col) => (
            <CollectionNode
              key={col.id}
              collection={col}
              activeRequestId={activeRequestId}
              onSelectRequest={onSelectRequest}
              onDeleteCollection={handleDeleteCollection}
              onRenameCollection={handleRenameCollection}
              onNewRequest={onNewRequest}
              onDuplicateRequest={handleDuplicateRequest}
              onRenameRequest={handleRenameRequest}
              onRequestDeleted={onRequestDeleted}
              onFolderDeleted={onFolderDeleted}
              onRunCollection={(c) => setRunnerCollection(c)}
            />
          ))}
        </div>
      </nav>

      {showAddCollection && (
        <Modal title="New Collection" onClose={() => { setShowAddCollection(false); setCollectionName(''); setCollectionDesc('') }}>
          <form onSubmit={handleAddCollection}>
            <div className="modal-body" style={{ gap: '14px', display: 'flex', flexDirection: 'column' }}>
              <div className="field">
                <label className="field-label" htmlFor="col-name">Name</label>
                <input
                  id="col-name"
                  className="field-input"
                  placeholder="My Collection"
                  value={collectionName}
                  onChange={(e) => setCollectionName(e.target.value)}
                  autoFocus
                  required
                />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="col-desc">Description (optional)</label>
                <textarea
                  id="col-desc"
                  className="field-textarea"
                  placeholder="What's this collection for?"
                  value={collectionDesc}
                  onChange={(e) => setCollectionDesc(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <div className="modal-footer" style={{ marginTop: '20px' }}>
              <button
                type="button"
                className="btn-sm btn-sm-ghost"
                onClick={() => { setShowAddCollection(false); setCollectionName(''); setCollectionDesc('') }}
              >
                Cancel
              </button>
              <button type="submit" className="btn-sm btn-sm-primary" disabled={saving || !collectionName.trim()}>
                {saving ? 'Creating…' : 'Create'}
              </button>
            </div>
          </form>
        </Modal>
      )}
      {showImportExport && (
        <ExportImportModal
          collection={exportTarget}
          onClose={() => { setShowImportExport(false); setExportTarget(null) }}
          onImported={() => loadCollections()}
          addCollection={async (data) => { const r = await addCollection(data); return r }}
          addFolder={async (colId, data) => { const r = await addFolder(colId, data); return r }}
        />
      )}
      {runnerCollection && (
        <RunnerModal
          collection={runnerCollection}
          onClose={() => setRunnerCollection(null)}
        />
      )}
    </aside>
  )
}
