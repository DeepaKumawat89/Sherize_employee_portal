import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import {
  RecaptchaVerifier,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  signOut,
} from 'firebase/auth'
import { doc, getDoc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore'
import { auth, db } from '../services/firebase'
import { callExistingFunction } from '../services/employee'
import { errorMessage } from '../lib/format'

const AuthContext = createContext(null)
const NON_EMPLOYEE_ROLES = new Set(['admin', 'super_admin', 'task_review_admin', 'kyc_admin', 'payment_admin', 'support_admin', 'developer', 'team_leader', 'team_lead', 'client'])

function rolesOf(profile = {}) {
  return new Set([profile.role, ...(Array.isArray(profile.roles) ? profile.roles : [])].filter(Boolean).map((role) => String(role).toLowerCase()))
}

function isEmployeeProfile(profile = {}) {
  const roles = rolesOf(profile)
  return ![...roles].some((role) => NON_EMPLOYEE_ROLES.has(role))
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [restoreError, setRestoreError] = useState('')
  const confirmationRef = useRef(null)
  const recaptchaRef = useRef(null)

  const loadProfile = useCallback(async (firebaseUser) => {
    const snapshot = await getDoc(doc(db, 'users', firebaseUser.uid))
    if (!snapshot.exists()) throw new Error('Your employee profile is unavailable. Contact support.')
    const nextProfile = { uid: firebaseUser.uid, ...snapshot.data() }
    if (!isEmployeeProfile(nextProfile)) {
      await signOut(auth)
      throw new Error('This portal is available to employees only.')
    }
    setProfile(nextProfile)
    return nextProfile
  }, [])

  useEffect(() => onAuthStateChanged(auth, async (firebaseUser) => {
    setLoading(true)
    setRestoreError('')
    setUser(firebaseUser)
    if (!firebaseUser) {
      setProfile(null)
      setLoading(false)
      return
    }
    try {
      await loadProfile(firebaseUser)
    } catch (error) {
      setProfile(null)
      setRestoreError(errorMessage(error, 'Unable to restore your employee workspace.'))
    } finally {
      setLoading(false)
    }
  }), [loadProfile])

  // Keep server-reviewed employee fields (KYC, onboarding, role and account
  // status) current just like SherizeApp's profile streams.
  useEffect(() => {
    if (!user) return undefined
    return onSnapshot(doc(db, 'users', user.uid), async (snapshot) => {
      if (!snapshot.exists()) {
        setProfile(null)
        setRestoreError('Your employee profile is unavailable. Contact support.')
        return
      }
      const nextProfile = { uid: user.uid, ...snapshot.data() }
      if (!isEmployeeProfile(nextProfile)) {
        setProfile(null)
        setRestoreError('This portal is available to employees only.')
        await signOut(auth)
        return
      }
      setProfile(nextProfile)
      setRestoreError('')
    }, (error) => setRestoreError(errorMessage(error, 'Unable to refresh your employee profile.')))
  }, [user])

  const loginWithEmail = async (email, password) => {
    try {
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password)
      await loadProfile(credential.user)
    } catch (error) {
      const code = error?.code
      if (['auth/invalid-credential', 'auth/wrong-password', 'auth/user-not-found'].includes(code)) throw new Error('Incorrect email or password.')
      if (code === 'auth/user-disabled') throw new Error('This account has been disabled. Contact support.')
      throw new Error(errorMessage(error, 'Login failed. Please try again.'))
    }
  }

  const loginWithEmployeeId = async (employeeId, password) => {
    try {
      const response = await callExistingFunction('resolveEmployeeLogin', { employeeId: employeeId.trim() })
      const loginEmail = response.data?.loginEmail || ''
      if (!loginEmail.endsWith('@sherize.app')) throw new Error('Employee ID or password is incorrect.')
      await loginWithEmail(loginEmail, password)
    } catch (error) {
      if (error?.code === 'functions/invalid-argument') throw new Error('Enter a valid Employee ID (for example, SHR-4450).')
      if (/incorrect|invalid-credential|user-not-found/i.test(error?.message || '')) throw new Error('Employee ID or password is incorrect.')
      throw error
    }
  }

  const sendPhoneOtp = async (phone) => {
    recaptchaRef.current?.clear()
    recaptchaRef.current = new RecaptchaVerifier(auth, 'employee-recaptcha', { size: 'invisible' })
    confirmationRef.current = await signInWithPhoneNumber(auth, phone, recaptchaRef.current)
  }

  const confirmPhoneOtp = async (otp) => {
    if (!confirmationRef.current) throw new Error('OTP session expired. Request a new code.')
    const credential = await confirmationRef.current.confirm(otp)
    const userReference = doc(db, 'users', credential.user.uid)
    const existing = await getDoc(userReference)
    const workerId = existing.data()?.workerId || `SHR-${Math.floor(1000 + Math.random() * 9000)}`
    await setDoc(userReference, {
      uid: credential.user.uid,
      phoneNumber: credential.user.phoneNumber || '',
      phoneVerified: true,
      phoneVerifiedAt: serverTimestamp(),
      role: existing.data()?.role || 'worker',
      workerId,
      ...(!existing.exists() ? { createdAt: serverTimestamp() } : {}),
    }, { merge: true })
    await loadProfile(credential.user)
  }

  const logout = () => signOut(auth)
  const refreshProfile = () => auth.currentUser ? loadProfile(auth.currentUser) : Promise.resolve(null)

  const value = {
    user,
    profile,
    loading,
    restoreError,
    loginWithEmail,
    loginWithEmployeeId,
    sendPhoneOtp,
    confirmPhoneOtp,
    logout,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside AuthProvider')
  return value
}
