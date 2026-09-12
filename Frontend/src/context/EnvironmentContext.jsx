import { createContext, useContext, useState, useCallback } from 'react'
import {
  getMyEnvironmentsApi,
  createEnvironmentApi,
  deleteEnvironmentApi,
  addVariableApi,
  updateVariableApi,
  deleteVariableApi,
} from '../api/environmentApi'

const EnvironmentContext = createContext(null)

export function EnvironmentProvider({ children }) {
  // List of all environments (EnvironmentResponseDTO[])
  const [environments, setEnvironments] = useState([])
  const [envsLoaded, setEnvsLoaded] = useState(false)
  const [envsLoading, setEnvsLoading] = useState(false)

  // The currently selected environment object (or null = "No Environment")
  const [activeEnvironment, setActiveEnvironment] = useState(null)

  // ── Load ────────────────────────────────────────────────────────────────────

  const loadEnvironments = useCallback(async () => {
    if (envsLoading) return
    setEnvsLoading(true)
    try {
      const res = await getMyEnvironmentsApi()
      setEnvironments(res.data)
      setEnvsLoaded(true)
    } catch {
      setEnvironments([])
    } finally {
      setEnvsLoading(false)
    }
  }, [envsLoading])

  // ── Create / Delete environment ─────────────────────────────────────────────

  const createEnvironment = useCallback(async (name) => {
    const res = await createEnvironmentApi({ name })
    const created = res.data
    setEnvironments((prev) => [...prev, created])
    return created
  }, [])

  const removeEnvironment = useCallback(async (environmentId) => {
    await deleteEnvironmentApi(environmentId)
    setEnvironments((prev) => prev.filter((e) => e.id !== environmentId))
    setActiveEnvironment((prev) => (prev?.id === environmentId ? null : prev))
  }, [])

  // ── Variable helpers (optimistic updates on the in-memory list) ─────────────

  const addVariable = useCallback(async (environmentId, variableKey, variableValue) => {
    const res = await addVariableApi(environmentId, { variableKey, variableValue })
    const newVar = res.data
    setEnvironments((prev) =>
      prev.map((env) =>
        env.id === environmentId
          ? { ...env, variables: [...(env.variables || []), newVar] }
          : env
      )
    )
    // Keep activeEnvironment in sync
    setActiveEnvironment((prev) =>
      prev?.id === environmentId
        ? { ...prev, variables: [...(prev.variables || []), newVar] }
        : prev
    )
    return newVar
  }, [])

  const editVariable = useCallback(async (environmentId, variableId, variableKey, variableValue) => {
    const res = await updateVariableApi(environmentId, variableId, { variableKey, variableValue })
    const updated = res.data
    const patchVars = (vars) =>
      (vars || []).map((v) => (v.id === variableId ? updated : v))

    setEnvironments((prev) =>
      prev.map((env) =>
        env.id === environmentId ? { ...env, variables: patchVars(env.variables) } : env
      )
    )
    setActiveEnvironment((prev) =>
      prev?.id === environmentId ? { ...prev, variables: patchVars(prev.variables) } : prev
    )
    return updated
  }, [])

  const removeVariable = useCallback(async (environmentId, variableId) => {
    await deleteVariableApi(environmentId, variableId)
    const filterVars = (vars) => (vars || []).filter((v) => v.id !== variableId)

    setEnvironments((prev) =>
      prev.map((env) =>
        env.id === environmentId ? { ...env, variables: filterVars(env.variables) } : env
      )
    )
    setActiveEnvironment((prev) =>
      prev?.id === environmentId ? { ...prev, variables: filterVars(prev.variables) } : prev
    )
  }, [])

  // ── Select environment ───────────────────────────────────────────────────────

  /**
   * Select an environment by id, or pass null to clear the selection.
   * Looks up the full object from the already-loaded list.
   */
  const selectEnvironment = useCallback(
    (environmentId) => {
      if (!environmentId) {
        setActiveEnvironment(null)
        return
      }
      const found = environments.find((e) => e.id === environmentId) || null
      setActiveEnvironment(found)
    },
    [environments]
  )

  return (
    <EnvironmentContext.Provider
      value={{
        environments,
        envsLoaded,
        envsLoading,
        activeEnvironment,
        loadEnvironments,
        createEnvironment,
        removeEnvironment,
        addVariable,
        editVariable,
        removeVariable,
        selectEnvironment,
      }}
    >
      {children}
    </EnvironmentContext.Provider>
  )
}

export function useEnvironment() {
  const ctx = useContext(EnvironmentContext)
  if (!ctx) throw new Error('useEnvironment must be used inside EnvironmentProvider')
  return ctx
}
