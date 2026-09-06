import { createContext, useContext, useState } from 'react'

const SettingsContext = createContext(null)

export function SettingsProvider({ children }) {
  const [open, setOpen] = useState(false)
  return (
    <SettingsContext.Provider value={{ open, openSettings: () => setOpen(true), closeSettings: () => setOpen(false) }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  return useContext(SettingsContext)
}
