import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../services/firebase'
import { useAuth } from './AuthContext'

const defaults = {
  minWithdrawalAmount: 100,
  platformCommission: 10,
  maxTaskPayout: 500,
  maintenanceMode: false,
  earningsSystemEnabled: true,
  announcement: '',
}
const PlatformContext = createContext(defaults)

export function PlatformProvider({ children }) {
  const { user } = useAuth()
  const [settings, setSettings] = useState(defaults)

  useEffect(() => {
    if (!user) {
      setSettings(defaults)
      return undefined
    }
    return onSnapshot(doc(db, 'platform_settings', 'main'), (snapshot) => {
      setSettings({ ...defaults, ...(snapshot.data() || {}) })
    }, () => setSettings(defaults))
  }, [user])

  return <PlatformContext.Provider value={useMemo(() => settings, [settings])}>{children}</PlatformContext.Provider>
}

export const usePlatform = () => useContext(PlatformContext)
