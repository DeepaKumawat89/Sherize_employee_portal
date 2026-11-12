import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { BriefcaseBusiness, Eye, EyeOff, LoaderCircle, LockKeyhole, Mail, Phone, ShieldCheck, UserRound } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Alert, inputClass, primaryButton, secondaryButton } from '../components/ui'
import { errorMessage } from '../lib/format'

const employeePattern = /^SHR-?(?:\d{4}|\d{6})$/i

export default function Login() {
  const { loginWithEmail, loginWithEmployeeId, sendPhoneOtp, confirmPhoneOtp } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [method, setMethod] = useState('employee')
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(location.state?.error || '')
  const [resend, setResend] = useState(0)

  useEffect(() => {
    if (!resend) return undefined
    const timer = window.setInterval(() => setResend((value) => Math.max(0, value - 1)), 1000)
    return () => window.clearInterval(timer)
  }, [resend])

  const submitCredentials = async (event) => {
    event.preventDefault()
    setError('')
    if (method === 'employee' && !employeePattern.test(identifier.trim())) {
      setError('Enter a valid Employee ID (for example, SHR-4450).')
      return
    }
    if (method === 'email' && !/^\S+@\S+\.\S+$/.test(identifier.trim())) {
      setError('Enter a valid email address.')
      return
    }
    if (!password) {
      setError('Enter your password.')
      return
    }
    setLoading(true)
    try {
      if (method === 'employee') await loginWithEmployeeId(identifier, password)
      else await loginWithEmail(identifier, password)
      navigate('/', { replace: true })
    } catch (nextError) {
      setError(errorMessage(nextError, 'Login failed. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  const requestOtp = async () => {
    setError('')
    if (!/^[6-9]\d{9}$/.test(phone)) {
      setError('Enter a valid 10-digit Indian mobile number.')
      return
    }
    setLoading(true)
    try {
      await sendPhoneOtp(`+91${phone}`)
      setOtpSent(true)
      setResend(30)
    } catch (nextError) {
      setError(errorMessage(nextError, 'Could not send OTP. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  const verifyOtp = async (event) => {
    event.preventDefault()
    if (!/^\d{6}$/.test(otp)) {
      setError('Enter the 6-digit OTP.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await confirmPhoneOtp(otp)
      navigate('/verify-email', { replace: true })
    } catch (nextError) {
      setError(errorMessage(nextError, 'Incorrect or expired OTP.'))
    } finally {
      setLoading(false)
    }
  }

  return <div className="min-h-screen bg-slate-950 lg:grid lg:grid-cols-[1.05fr_.95fr]">
    <section className="relative hidden overflow-hidden p-12 lg:flex lg:flex-col lg:justify-between">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(99,102,241,.38),transparent_34rem),radial-gradient(circle_at_90%_90%,rgba(14,165,233,.18),transparent_28rem)]" />
      <div className="relative flex items-center gap-3"><span className="grid size-11 place-items-center rounded-2xl bg-indigo-500 text-xl font-black text-white">S</span><div><strong className="block text-lg text-white">Sherize</strong><span className="text-sm text-slate-400">Employee Portal</span></div></div>
      <div className="relative max-w-xl"><span className="mb-6 grid size-14 place-items-center rounded-2xl bg-white/10 text-indigo-300 ring-1 ring-white/10"><BriefcaseBusiness size={26} /></span><h1 className="text-5xl font-black leading-tight tracking-tight text-white">Your work, progress and earnings—together.</h1><p className="mt-6 max-w-lg text-lg leading-8 text-slate-300">Access assigned campaigns, complete verified work, track payouts and manage your Sherize employee profile securely.</p></div>
      <p className="relative text-xs text-slate-500">Designed and developed by Novantix Innovation Technologies Pvt Ltd</p>
    </section>

    <section className="flex min-h-screen items-center justify-center bg-white px-4 py-10 sm:px-8">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center gap-3 lg:hidden"><span className="grid size-10 place-items-center rounded-xl bg-indigo-600 font-black text-white">S</span><div><strong className="block">Sherize</strong><span className="text-xs text-slate-500">Employee Portal</span></div></div>
        <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600">Secure employee access</p><h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">Welcome back</h2><p className="mt-2 text-sm leading-6 text-slate-500">Use the credentials issued by Sherize or your verified mobile number.</p>
        <div className="mt-7 grid grid-cols-3 rounded-2xl bg-slate-100 p-1"><button type="button" onClick={() => { setMethod('employee'); setError('') }} className={`rounded-xl px-2 py-2.5 text-xs font-bold ${method === 'employee' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}>Employee ID</button><button type="button" onClick={() => { setMethod('email'); setError('') }} className={`rounded-xl px-2 py-2.5 text-xs font-bold ${method === 'email' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}>Email</button><button type="button" onClick={() => { setMethod('mobile'); setError('') }} className={`rounded-xl px-2 py-2.5 text-xs font-bold ${method === 'mobile' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}>Mobile</button></div>
        {error && <div className="mt-5"><Alert onClose={() => setError('')}>{error}</Alert></div>}

        {method !== 'mobile' ? <form className="mt-6 space-y-4" onSubmit={submitCredentials}>
          <label className="block"><span className="mb-2 block text-sm font-bold text-slate-700">{method === 'employee' ? 'Employee ID' : 'Email address'}</span><span className="relative block">{method === 'employee' ? <UserRound className="absolute left-3.5 top-3.5 text-slate-400" size={19} /> : <Mail className="absolute left-3.5 top-3.5 text-slate-400" size={19} />}<input value={identifier} onChange={(event) => setIdentifier(event.target.value)} className={`${inputClass} pl-11 ${method === 'employee' ? 'uppercase' : ''}`} placeholder={method === 'employee' ? 'SHR-4450' : 'name@example.com'} autoComplete="username" /></span></label>
          <label className="block"><span className="mb-2 block text-sm font-bold text-slate-700">Password</span><span className="relative block"><LockKeyhole className="absolute left-3.5 top-3.5 text-slate-400" size={19} /><input type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} className={`${inputClass} px-11`} placeholder="Enter your password" autoComplete="current-password" /><button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-3 rounded-lg p-1 text-slate-400 hover:text-slate-700" aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={19} /> : <Eye size={19} />}</button></span></label>
          <button type="submit" disabled={loading} className={`${primaryButton} w-full`}>{loading ? <LoaderCircle className="animate-spin" size={18} /> : <ShieldCheck size={18} />}Sign in securely</button>
        </form> : <form className="mt-6 space-y-4" onSubmit={otpSent ? verifyOtp : (event) => { event.preventDefault(); requestOtp() }}>
          <label className="block"><span className="mb-2 block text-sm font-bold text-slate-700">Mobile number</span><span className="relative block"><Phone className="absolute left-3.5 top-3.5 text-slate-400" size={19} /><span className="absolute left-11 top-3.5 text-sm font-semibold text-slate-600">+91</span><input inputMode="numeric" maxLength={10} value={phone} disabled={otpSent} onChange={(event) => setPhone(event.target.value.replace(/\D/g, ''))} className={`${inputClass} pl-[4.6rem]`} placeholder="9876543210" /></span></label>
          {otpSent && <label className="block"><span className="mb-2 block text-sm font-bold text-slate-700">6-digit OTP</span><input inputMode="numeric" maxLength={6} value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, ''))} className={`${inputClass} text-center text-xl font-black tracking-[0.45em]`} placeholder="000000" autoFocus /></label>}
          <button type="submit" disabled={loading} className={`${primaryButton} w-full`}>{loading && <LoaderCircle className="animate-spin" size={18} />}{otpSent ? 'Verify OTP' : 'Send OTP'}</button>
          {otpSent && <button type="button" disabled={loading || resend > 0} onClick={requestOtp} className={`${secondaryButton} w-full`}>{resend ? `Resend in 00:${String(resend).padStart(2, '0')}` : 'Resend OTP'}</button>}
          <div id="employee-recaptcha" />
        </form>}
        <div className="mt-8 border-t border-slate-200 pt-6 text-center"><button type="button" onClick={() => navigate('/jobs')} className="inline-flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-700"><BriefcaseBusiness size={17} />Looking for work? View openings</button></div>
      </div>
    </section>
  </div>
}
