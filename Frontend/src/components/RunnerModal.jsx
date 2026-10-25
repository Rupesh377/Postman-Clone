import { useState, useEffect, useRef } from 'react'
import Modal from './Modal'
import { getRequestsByCollectionApi, getRequestsByFolderApi } from '../api/requestApi'
import { getFoldersApi } from '../api/collectionApi'
import { executeRequestApi, getMyEnvironmentsApi } from '../api/environmentApi'
import { useEnvironment } from '../context/EnvironmentContext'
import '../styles/app.css'

export default function RunnerModal({ collection, onClose }) {
  const [requests, setRequests] = useState([])
  const [loading, setLoading]   = useState(true)
  const [running, setRunning]   = useState(false)
  const [results, setResults]   = useState({})
  const stoppedRef              = useRef(false)

  const {
    environments,
    envsLoaded,
    activeEnvironment,
    createEnvironment,
    selectEnvironment,
  } = useEnvironment()

  const getTargetEnvId = async () => {
    if (activeEnvironment?.id) return activeEnvironment.id

    let list = environments
    if (!envsLoaded) {
      try {
        const res = await getMyEnvironmentsApi()
        list = res.data || []
      } catch {
        list = []
      }
    }

    if (list && list.length > 0) {
      const envId = list[0].id
      selectEnvironment(envId)
      return envId
    }

    const created = await createEnvironment('Default')
    selectEnvironment(created.id)
    return created.id
  }

  const runRequests = async (reqs) => {
    if (!reqs || !reqs.length) return
    stoppedRef.current = false
    setRunning(true)
    setResults({})

    try {
      const envId = await getTargetEnvId()

      for (let i = 0; i < reqs.length; i++) {
        if (stoppedRef.current) break
        const req = reqs[i]

        setResults((prev) => ({
          ...prev,
          [req.id]: { running: true },
        }))

        try {
          const res = await executeRequestApi(req.id, envId)
          if (stoppedRef.current) break

          const dto = res.data
          const status = dto.statusCode ?? 0
          const time = dto.responseTime ?? 0
          const passed = status > 0 && status < 400

          setResults((prev) => ({
            ...prev,
            [req.id]: { status, time, passed, running: false },
          }))
        } catch (err) {
          if (stoppedRef.current) break
          const status = err.response?.status ?? 0
          const time = err.response?.data?.responseTime ?? 0
          const passed = status > 0 && status < 400

          setResults((prev) => ({
            ...prev,
            [req.id]: { status, time, passed, running: false },
          }))
        }
      }
    } catch {
      // ignore
    } finally {
      setRunning(false)
    }
  }

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true)
      try {
        const [rootRes, foldersRes] = await Promise.all([
          getRequestsByCollectionApi(collection.id),
          getFoldersApi(collection.id),
        ])
        const rootReqs = rootRes.data || []
        const folders  = foldersRes.data || []

        const folderReqs = await Promise.all(
          folders.map((f) =>
            getRequestsByFolderApi(f.id)
              .then((r) => r.data || [])
              .catch(() => [])
          )
        )
        const all = [...rootReqs, ...folderReqs.flat()]
        if (mounted) {
          setRequests(all)
          setLoading(false)
          if (all.length > 0) {
            runRequests(all)
          }
        }
      } catch {
        if (mounted) {
          setRequests([])
          setLoading(false)
        }
      }
    }

    load()
    return () => {
      mounted = false
      stoppedRef.current = true
    }
  }, [collection.id])

  const handleStop = () => {
    stoppedRef.current = true
    setRunning(false)
  }

  let passedCount = 0
  let failedCount = 0
  let totalTime   = 0

  Object.values(results).forEach((r) => {
    if (r.status !== undefined) {
      if (r.passed) passedCount++
      else failedCount++
      totalTime += r.time || 0
    }
  })

  const statusClass = (code) => {
    if (!code || code === 0) return 'status-err'
    if (code < 300) return 'status-ok'
    if (code < 400) return 'status-redir'
    return 'status-err'
  }

  return (
    <Modal
      title={`Run Collection: ${collection.name}`}
      onClose={onClose}
      wide
      footer={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            {running ? 'Running…' : `${requests.length} requests`}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="btn-sm btn-sm-ghost"
              onClick={onClose}
            >
              Close
            </button>
            <button
              type="button"
              className="btn-sm btn-sm-danger"
              onClick={handleStop}
              disabled={!running}
            >
              Stop
            </button>
            <button
              type="button"
              className="btn-sm btn-sm-primary"
              onClick={() => runRequests(requests)}
              disabled={running || loading || requests.length === 0}
            >
              Run again
            </button>
          </div>
        </div>
      }
    >
      <div className="runner-summary">
        <div className="runner-summary-item" style={{ color: 'var(--success)' }}>
          <span>Passed:</span> <strong>{passedCount}</strong>
        </div>
        <div className="runner-summary-item" style={{ color: 'var(--error)' }}>
          <span>Failed:</span> <strong>{failedCount}</strong>
        </div>
        <div className="runner-summary-item" style={{ color: 'var(--text-secondary)', marginLeft: 'auto' }}>
          <span>Total time:</span> <strong>{totalTime}ms</strong>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '13px' }}>
          Loading requests…
        </div>
      ) : requests.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '13px' }}>
          No requests in this collection.
        </div>
      ) : (
        <div className="runner-list">
          {requests.map((req) => {
            const res = results[req.id]
            return (
              <div key={req.id} className="runner-row">
                <span className={`method-badge method-${req.method}`}>{req.method}</span>
                <span className="runner-name" title={req.name || req.url}>
                  {req.name || req.url || 'Untitled'}
                </span>
                <span className={`runner-status ${statusClass(res?.status)}`}>
                  {res?.status !== undefined ? res.status : (res?.running ? '…' : '—')}
                </span>
                <span className="runner-time">
                  {res?.time != null ? `${res.time}ms` : '—'}
                </span>
                <span style={{ minWidth: 60, textAlign: 'right' }}>
                  {res?.running ? (
                    <span className="badge-running">RUNNING</span>
                  ) : res?.status !== undefined ? (
                    res.passed ? (
                      <span className="badge-pass">PASS</span>
                    ) : (
                      <span className="badge-fail">FAIL</span>
                    )
                  ) : (
                    <span className="badge-pending">PENDING</span>
                  )}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </Modal>
  )
}
