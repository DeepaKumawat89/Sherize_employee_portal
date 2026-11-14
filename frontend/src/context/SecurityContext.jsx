import { createContext, useContext, useEffect, useState } from 'react'
import { LockKeyhole, ShieldCheck } from 'lucide-react'
import { useAuth } from './AuthContext'
import { Alert, inputClass, primaryButton } from '../components/ui'

const SecurityContext = createContext(null)

async function hashPin(pin) {
  const bytes = new TextEncoder().encode(`sherize-employee-portal:${pin}`)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, '0')).join('')
}

export function SecurityProvider({ children }) {
  const { user } = useAuth()
  const key = user ? `sherize_portal_pin:${user.uid}` : ''
  const [enabled, setEnabled] = useState(false)
  const [locked, setLocked] = useState(false)
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const active = Boolean(key && localStorage.getItem(key))
    setEnabled(active)
    setLocked(false)
    setPin('')
  }, [key])

  useEffect(() => {
    const listener = () => {
      if (document.visibilityState === 'hidden' && enabled && user) setLocked(true)
    }
    document.addEventListener('visibilitychange', listener)
    return () => document.removeEventListener('visibilitychange', listener)
  }, [enabled, user])

  const setPasscode = async (nextPin) => {
    if (!/^\d{4,6}$/.test(nextPin)) throw new Error('Use a 4–6 digit PIN.')
    localStorage.setItem(key, await hashPin(nextPin))
    setEnabled(true)
  }
  const checkPasscode = async (candidate) => Boolean(key && localStorage.getItem(key) === await hashPin(candidate))
  const clearPasscode = async (candidate) => {
    if (!(await checkPasscode(candidate))) throw new Error('Current PIN is incorrect.')
    localStorage.removeItem(key)
    setEnabled(false)
    setLocked(false)
  }
  const unlock = async (event) => {
    event.preventDefault()
    if (await checkPasscode(pin)) { setLocked(false); setPin(''); setError('') } else setError('Incorrect PIN. Please try again.')
  }
  const value = { enabled, locked, setPasscode, clearPasscode, checkPasscode, lock: () => enabled && setLocked(true) }

  return <SecurityContext.Provider value={value}>{children}{locked && user && <div className="fixed inset-0 z-[100] grid place-items-center overflow-y-auto bg-slate-950 p-3 sm:p-4"><form onSubmit={unlock} className="my-auto w-full max-w-sm rounded-3xl bg-white p-5 text-center shadow-2xl sm:p-8"><span className="mx-auto grid size-14 place-items-center rounded-2xl bg-indigo-50 text-indigo-600"><LockKeyhole size={26} /></span><h1 className="mt-5 text-2xl font-black text-slate-950">Portal locked</h1><p className="mt-2 text-sm leading-6 text-slate-500">Enter your local employee portal PIN to continue.</p>{error && <div className="mt-5 text-left"><Alert>{error}</Alert></div>}<input type="password" inputMode="numeric" maxLength={6} value={pin} onChange={(event) => setPin(event.target.value.replace(/\D/g, ''))} className={`${inputClass} mt-6 text-center text-2xl font-black tracking-[0.45em]`} autoFocus /><button type="submit" className={`${primaryButton} mt-5 w-full`}><ShieldCheck size={18} />Unlock</button></form></div>}</SecurityContext.Provider>
}

export function useSecurity() {
  const value = useContext(SecurityContext)
  if (!value) throw new Error('useSecurity must be used inside SecurityProvider')
  return value
}
