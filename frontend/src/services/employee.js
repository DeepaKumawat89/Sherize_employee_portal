import {
  doc,
  runTransaction,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { db, functions } from './firebase'

export const callExistingFunction = (name, payload = {}) => httpsCallable(functions, name)(payload)

export async function callEmployeeApi(path, payload) {
  const { auth } = await import('./firebase')
  const user = auth.currentUser
  if (!user) throw new Error('Your session has expired. Please sign in again.')
  const token = await user.getIdToken()
  const emulator = import.meta.env.DEV && import.meta.env.VITE_USE_EMULATOR === 'true'
  const baseUrl = emulator
    ? `http://127.0.0.1:5001/${import.meta.env.VITE_FIREBASE_PROJECT_ID}/us-central1/api`
    : 'https://us-central1-sherize-bpo.cloudfunctions.net/api'
  const response = await fetch(`${baseUrl}/${path.replace(/^\//, '')}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(body.error || body.message || 'The request could not be completed.')
  return body
}

// SherizeApp intentionally verifies email OTPs through the callable's HTTP
// endpoint. The function can revoke the current token after changing the Auth
// email, so the client must not force-refresh or reload the Firebase user.
export async function verifyExistingEmailOtp(otp, email) {
  const { auth } = await import('./firebase')
  const user = auth.currentUser
  if (!user) throw new Error('Your session has expired. Please sign in again.')
  const token = await user.getIdToken()
  const emulator = import.meta.env.DEV && import.meta.env.VITE_USE_EMULATOR === 'true'
  const endpoint = emulator
    ? `http://127.0.0.1:5001/${import.meta.env.VITE_FIREBASE_PROJECT_ID}/us-central1/verifyEmailOtp`
    : 'https://us-central1-sherize-bpo.cloudfunctions.net/verifyEmailOtp'
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ data: { otp, email } }),
  })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(body.error?.message || body.error || 'Verification failed.')
  return body.result || body.data || body
}

export function todayKey(date = new Date()) {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-')
}

function closeOpenSegment(segments, now, expectedBreak) {
  const index = segments.length - 1
  const current = segments[index]
  if (!current || current.end || Boolean(current.type === 'break') !== expectedBreak) {
    throw new Error('The current work session is inconsistent.')
  }
  segments[index] = { ...current, end: Timestamp.fromDate(now) }
  return current.start?.toDate?.() || now
}

export async function transitionWorkSession(uid, action) {
  const date = todayKey()
  const reference = doc(db, 'work_sessions', `${uid}_${date}`)
  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(reference)
    const raw = snapshot.data() || {}
    const status = raw.status || 'idle'
    const segments = Array.isArray(raw.segments) ? raw.segments.map((item) => ({ ...item })) : []
    const events = Array.isArray(raw.events) ? raw.events.map((item) => ({ ...item })) : []
    const now = new Date()
    const at = Timestamp.fromDate(now)
    const update = {}

    if (action === 'start_day') {
      if (status !== 'idle' || raw.startedAt) throw new Error('This work day has already started.')
      segments.push({ type: 'work', start: at, end: null })
      events.push({ type: 'start_day', at })
      Object.assign(update, { status: 'active', startedAt: at })
    } else if (action === 'start_break') {
      if (status !== 'active') throw new Error('A break can only start while working.')
      closeOpenSegment(segments, now, false)
      segments.push({ type: 'break', start: at, end: null })
      events.push({ type: 'break_start', at })
      update.status = 'on_break'
    } else if (action === 'resume_work') {
      if (status !== 'on_break') throw new Error('Work can only resume from an active break.')
      const started = closeOpenSegment(segments, now, true)
      events.push({ type: 'break_end', at, durationSeconds: Math.floor((now - started) / 1000) })
      segments.push({ type: 'work', start: at, end: null })
      update.status = 'active'
    } else if (action === 'end_day') {
      if (!['active', 'on_break'].includes(status)) throw new Error('This work day has already ended.')
      const onBreak = status === 'on_break'
      const started = closeOpenSegment(segments, now, onBreak)
      if (onBreak) events.push({ type: 'break_end', at, durationSeconds: Math.floor((now - started) / 1000) })
      events.push({ type: 'end_day', at })
      Object.assign(update, { status: 'ended', endedAt: at })
    } else {
      throw new Error('Unknown work-session action.')
    }

    const seconds = (type) => segments.filter((segment) => segment.type === type && segment.end).reduce((total, segment) => {
      return total + Math.max(0, Math.floor((segment.end.toDate() - segment.start.toDate()) / 1000))
    }, 0)
    transaction.set(reference, {
      userId: uid,
      date,
      segments,
      events,
      totalWorkedSeconds: seconds('work'),
      totalBreakSeconds: seconds('break'),
      lastEventAt: at,
      updatedAt: serverTimestamp(),
      ...(!snapshot.exists() || !raw.createdAt ? { createdAt: serverTimestamp() } : {}),
      ...update,
    }, { merge: true })
  })
}

