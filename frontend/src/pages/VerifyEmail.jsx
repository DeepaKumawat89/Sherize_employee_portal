import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { LoaderCircle, MailCheck, RefreshCw, ShieldCheck } from 'lucide-react'
import { auth, db } from '../services/firebase'
import { callExistingFunction, verifyExistingEmailOtp } from '../services/employee'
import { Alert, inputClass, primaryButton, secondaryButton } from '../components/ui'
import { errorMessage } from '../shared/utils/format'

export default function VerifyEmail() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resend, setResend] = useState(0)

  useEffect(() => {
    const user = auth.currentUser
    if (!user) { navigate('/login', { replace: true }); return }
    getDoc(doc(db, 'users', user.uid)).then((snapshot) => {
      const data = snapshot.data() || {}
      if (data.emailVerified === true) navigate('/', { replace: true })
      else setEmail(data.email || user.email || '')
    }).catch(() => {})
  }, [navigate])

  useEffect(() => {
    if (!resend) return undefined
    const timer = window.setInterval(() => setResend((value) => Math.max(0, value - 1)), 1000)
    return () => window.clearInterval(timer)
  }, [resend])

  const send = async () => {
    setError('')
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) { setError('Enter a valid email address.'); return }
    setLoading(true)
    try { await callExistingFunction('sendEmailOtp', { email: email.trim() }); setSent(true); setResend(30) } catch (nextError) { setError(errorMessage(nextError, 'Could not send verification OTP.')) } finally { setLoading(false) }
  }

  const verify = async (event) => {
    event.preventDefault(); setError('')
    if (!/^\d{6}$/.test(otp)) { setError('Enter the 6-digit OTP.'); return }
    setLoading(true)
    try { await verifyExistingEmailOtp(otp, email.trim()); navigate('/', { replace: true }) } catch (nextError) { setError(errorMessage(nextError, 'Incorrect or expired OTP.')) } finally { setLoading(false) }
  }

  return <div className="grid min-h-screen place-items-center bg-slate-950 p-4"><form onSubmit={verify} className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl sm:p-8"><span className="grid size-14 place-items-center rounded-2xl bg-indigo-50 text-indigo-600"><MailCheck size={26} /></span><p className="mt-6 text-xs font-black uppercase tracking-[0.18em] text-indigo-600">Account recovery</p><h1 className="mt-2 text-2xl font-black text-slate-950">Verify your email</h1><p className="mt-2 text-sm leading-6 text-slate-500">Add and verify an email address for account recovery and important employee updates.</p>{error && <div className="mt-5"><Alert onClose={() => setError('')}>{error}</Alert></div>}<div className="mt-6 space-y-4"><label><span className="mb-2 block text-sm font-bold text-slate-700">Email address</span><input type="email" value={email} disabled={sent} onChange={(event) => setEmail(event.target.value)} className={inputClass} /></label>{sent && <label><span className="mb-2 block text-sm font-bold text-slate-700">6-digit OTP</span><input inputMode="numeric" maxLength={6} value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, ''))} className={`${inputClass} text-center text-xl font-black tracking-[0.45em]`} autoFocus /></label>}</div>{sent ? <><button type="submit" disabled={loading} className={`${primaryButton} mt-6 w-full`}>{loading ? <LoaderCircle className="animate-spin" size={18} /> : <ShieldCheck size={18} />}Verify email</button><button type="button" disabled={loading || resend > 0} onClick={send} className={`${secondaryButton} mt-3 w-full`}><RefreshCw size={17} />{resend ? `Resend in 00:${String(resend).padStart(2, '0')}` : 'Resend OTP'}</button></> : <button type="button" disabled={loading} onClick={send} className={`${primaryButton} mt-6 w-full`}>{loading ? <LoaderCircle className="animate-spin" size={18} /> : <MailCheck size={18} />}Send verification OTP</button>}</form></div>
}
