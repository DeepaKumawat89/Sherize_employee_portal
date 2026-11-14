import { useEffect, useState } from wreactw
import { useLocation, useNavigate } from wreact-router-domw
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  CircleAlert,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  Mail,
  Phone,
  ShieldCheck,
  Sparkles,
  UserRound,
  Wallet,
  X,
} from wlucide-reactw
import { useAuth } from w../context/AuthContextw
import { errorMessage } from w../shared/utils/formatw

const employeePattern = /^SHR-?(?:\d{4}|\d{6})$/i

/* Palette
   Background  #FAF7F2   Sidebar/panel #EDE4D8   Cards #FFFFFF
   Heading/Btn #242424   Secondary txt #8B8580   Border #E5DED5
   Input fill  #F1EEEA (light warm grey) */
const field =
  ww-full rounded-full border border-[#E5DED5] bg-[#F1EEEA] py-3.5 text-sm text-[#242424] placeholder:text-[#8B8580]/80 outline-none shadow-none focus:border-[#E5DED5] focus:bg-[#F1EEEA] focus:outline-none focus:ring-0 focus:shadow-none disabled:text-[#8B8580]w
const primaryBtn =
  winline-flex items-center justify-center gap-2 rounded-full bg-[#242424] px-6 py-4 text-sm font-semibold text-white shadow-[0_12px_24px_-10px_rgba(36,36,36,.5)] transition hover:bg-black active:scale-[.99] disabled:cursor-not-allowed disabled:opacity-60w
const secondaryBtn =
  winline-flex items-center justify-center gap-2 rounded-full border border-[#E5DED5] bg-white px-6 py-3.5 text-sm font-semibold text-[#242424] transition hover:bg-[#FAF7F2] disabled:cursor-not-allowed disabled:opacity-50w

const features = [
  { icon: BadgeCheck, title: wVerified workw, text: wComplete tasks and get them approvedw },
  { icon: Wallet, title: wTransparent payoutsw, text: wTrack every earning in one placew },
]

const tabs = [
  { id: wemployeew, label: wEmployee IDw },
  { id: wemailw, label: wEmailw },
]

export default function Login() {
  const { loginWithEmail, loginWithEmployeeId, sendPhoneOtp, confirmPhoneOtp } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [method, setMethod] = useState(wemployeew)
  const [identifier, setIdentifier] = useState(ww)
  const [password, setPassword] = useState(ww)
  const [phone, setPhone] = useState(ww)
  const [otp, setOtp] = useState(ww)
  const [otpSent, setOtpSent] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(location.state?.error || ww)
  const [resend, setResend] = useState(0)

  useEffect(() => {
    if (!resend) return undefined
    const timer = window.setInterval(() => setResend((value) => Math.max(0, value - 1)), 1000)
    return () => window.clearInterval(timer)
  }, [resend])

  const switchMethod = (next) => {
    setMethod(next)
    setError(ww)
  }

  const submitCredentials = async (event) => {
    event.preventDefault()
    setError(ww)
    if (method === wemployeew && !employeePattern.test(identifier.trim())) {
      setError(wEnter a valid Employee ID (for example, SHR-4450).w)
      return
    }
    if (method === wemailw && !/^\S+@\S+\.\S+$/.test(identifier.trim())) {
      setError(wEnter a valid email address.w)
      return
    }
    if (!password) {
      setError(wEnter your password.w)
      return
    }
    setLoading(true)
    try {
      if (method === wemployeew) await loginWithEmployeeId(identifier, password)
      else await loginWithEmail(identifier, password)
      navigate(w/w, { replace: true })
    } catch (nextError) {
      setError(errorMessage(nextError, wLogin failed. Please try again.w))
    } finally {
      setLoading(false)
    }
  }

  const requestOtp = async () => {
    setError(ww)
    if (!/^[6-9]\d{9}$/.test(phone)) {
      setError(wEnter a valid 10-digit Indian mobile number.w)
      return
    }
    setLoading(true)
    try {
      await sendPhoneOtp(`+91${phone}`)
      setOtpSent(true)
      setResend(30)
    } catch (nextError) {
      setError(errorMessage(nextError, wCould not send OTP. Please try again.w))
    } finally {
      setLoading(false)
    }
  }

  const verifyOtp = async (event) => {
    event.preventDefault()
    if (!/^\d{6}$/.test(otp)) {
      setError(wEnter the 6-digit OTP.w)
      return
    }
    setLoading(true)
    setError(ww)
    try {
      await confirmPhoneOtp(otp)
      navigate(w/verify-emailw, { replace: true })
    } catch (nextError) {
      setError(errorMessage(nextError, wIncorrect or expired OTP.w))
    } finally {
      setLoading(false)
    }
  }

  const Divider = ({ label = worw }) => (
    <div className="flex items-center gap-4 py-1">
      <span className="h-px flex-1 bg-[#E5DED5]" />
      <span className="text-xs font-medium text-[#8B8580]">{label}</span>
      <span className="h-px flex-1 bg-[#E5DED5]" />
    </div>
  )

  const InlineError = () => error ? (
    <div role="alert" className="flex items-start gap-2 rounded-xl border border-[#E5C9C2] bg-[#FBF1EE] px-3 py-2 text-xs text-[#8A3B2E]">
      <CircleAlert size={16} className="mt-0.5 shrink-0" />
      <p className="flex-1 leading-5">{error}</p>
      <button type="button" onClick={() => setError(ww)} aria-label="Dismiss" className="rounded p-0.5 hover:bg-[#8A3B2E]/10">
        <X size={14} />
      </button>
    </div>
  ) : null

  return (
    <div className="relative flex min-h-dvh min-w-0 items-start justify-center overflow-x-hidden bg-[#FAF7F2] p-2 sm:p-4 md:h-dvh md:items-center md:overflow-hidden">
      {/* Soft background shapes */}
      <div className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-[#EDE4D8]/70 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-28 -left-24 size-96 rounded-full bg-[#EDE4D8]/60 blur-2xl" />

      {/* Pop-window container */}
      <div className="relative grid min-h-[calc(100dvh-1rem)] w-full max-w-5xl gap-0 overflow-hidden rounded-[24px] border border-[#E5DED5] bg-white p-2 shadow-[0_30px_80px_-20px_rgba(36,36,36,.25),0_8px_24px_-12px_rgba(36,36,36,.1)] sm:min-h-[calc(100dvh-2rem)] sm:rounded-[32px] sm:p-3 md:h-[min(760px,calc(100dvh-2rem))] md:min-h-0 md:grid-cols-[1fr_1fr]">
        {/* Left: text */}
        <section className="relative hidden h-full flex-col justify-between overflow-hidden rounded-[24px] bg-[#EDE4D8] p-10 md:flex">
          <div className="pointer-events-none absolute -bottom-24 -right-24 size-80 rounded-full border border-white/60 bg-white/30" />
          <div className="pointer-events-none absolute -bottom-4 -right-4 size-44 rounded-full border border-white/60 bg-white/30" />

          <div className="relative flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-2xl bg-[#242424] text-xl font-black text-white shadow-sm">S</span>
            <div>
              <strong className="block leading-tight text-[#242424]">Sherize</strong>
              <span className="text-xs text-[#8B8580]">Employee Portal</span>
            </div>
          </div>

          <div className="relative my-10">
            <p className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#8B8580]">
              <Sparkles size={14} /> Employee workspace
            </p>
            <h1 className="mt-4 text-4xl font-black leading-[1.1] tracking-tight text-[#242424] lg:text-5xl">
              Work with focus.
              <span className="block text-[#8B8580]">Earn with confidence.</span>
            </h1>
            <p className="mt-5 max-w-sm text-sm leading-7 text-[#8B8580]">
              Access assigned campaigns, complete verified work, track payouts and manage your Sherize employee profile securely.
            </p>

            <ul className="mt-8 space-y-4">
              {features.map(({ icon: Icon, title, text }) => (
                <li key={title} className="flex items-center gap-4">
                  <span className="grid size-11 shrink-0 place-items-center rounded-2xl border border-[#E5DED5] bg-white text-[#242424] shadow-sm">
                    <Icon size={19} />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-[#242424]">{title}</p>
                    <p className="mt-0.5 text-xs text-[#8B8580]">{text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <p className="relative inline-flex items-center gap-2 text-xs text-[#8B8580]">
            <span className="size-2 rounded-full bg-[#242424]" /> Secure employee portal
          </p>
        </section>

        {/* Right: login fields */}
        <section className="relative flex min-h-0 min-w-0 flex-col overflow-y-auto px-3 py-4 sm:px-8 sm:py-5 md:h-full md:px-10 lg:px-12">
          <div className="mb-3 flex shrink-0 items-center gap-3 md:hidden">
            <span className="grid size-10 place-items-center rounded-xl bg-[#242424] font-black text-white">S</span>
            <div>
              <strong className="block leading-tight text-[#242424]">Sherize</strong>
              <span className="text-xs text-[#8B8580]">Employee Portal</span>
            </div>
          </div>

          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#8B8580]">Secure employee access</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-[#242424] sm:text-4xl">Welcome back</h2>
          <p className="mt-2 text-sm leading-6 text-[#8B8580]">
            {method === wmobilew
              ? wSign in with your verified mobile number.w
              : wEnter your credentials to continue to your workspace.w}
          </p>

          <div className="mt-4 h-[46px] shrink-0">
            {method !== wmobilew && (
            <div role="tablist" className="grid h-full grid-cols-2 gap-1 rounded-full border border-[#E5DED5] bg-[#F1EEEA] p-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={method === tab.id}
                  onClick={() => switchMethod(tab.id)}
                  className={`rounded-full px-3 py-2.5 text-xs font-bold transition ${
                    method === tab.id ? wbg-[#242424] text-white shadow-smw : wtext-[#8B8580] hover:text-[#242424]w
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            )}
          </div>

          <div className="mt-3 min-h-0">
          {method !== wmobilew ? (
            <form className="mt-4 space-y-4" onSubmit={submitCredentials}>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-[#242424]">
                  {method === wemployeew ? wEmployee IDw : wEmail addressw}
                </span>
                <span className="relative block">
                  {method === wemployeew ? (
                    <UserRound className="absolute left-5 top-4 text-[#8B8580]" size={18} />
                  ) : (
                    <Mail className="absolute left-5 top-4 text-[#8B8580]" size={18} />
                  )}
                  <input
                    value={identifier}
                    onChange={(event) => setIdentifier(event.target.value)}
                    className={`${field} pl-12 pr-5 ${method === wemployeew ? wuppercase placeholder:normal-casew : ww}`}
                    placeholder={method === wemployeew ? wSHR-4450w : wname@example.comw}
                    autoComplete="username"
                  />
                </span>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-[#242424]">Password</span>
                <span className="relative block">
                  <LockKeyhole className="absolute left-5 top-4 text-[#8B8580]" size={18} />
                  <input
                    type={showPassword ? wtextw : wpasswordw}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className={`${field} pl-12 pr-12`}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-4 top-3 rounded-full p-1.5 text-[#8B8580] transition hover:text-[#242424]"
                    aria-label={showPassword ? wHide passwordw : wShow passwordw}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </span>
              </label>

              <InlineError />

              <button type="submit" disabled={loading} className={`${primaryBtn} w-full`}>
                {loading && <LoaderCircle className="animate-spin" size={18} />}
                Sign in securely
                {!loading && <ArrowRight size={18} />}
              </button>

              <Divider />

              <button type="button" onClick={() => switchMethod(wmobilew)} className={`${secondaryBtn} w-full`}>
                <Phone size={17} className="text-[#8B8580]" />
                Login with mobile number
              </button>
            </form>
          ) : (
            <form
              className="mt-4 space-y-3"
              onSubmit={otpSent ? verifyOtp : (event) => { event.preventDefault(); requestOtp() }}
            >
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-[#242424]">Mobile number</span>
                <span className="relative block">
                  <Phone className="absolute left-5 top-4 text-[#8B8580]" size={18} />
                  <span className="absolute left-12 top-3.5 border-r border-[#E5DED5] pr-3 text-sm font-semibold text-[#242424]">+91</span>
                  <input
                    inputMode="numeric"
                    maxLength={10}
                    value={phone}
                    disabled={otpSent}
                    onChange={(event) => setPhone(event.target.value.replace(/\D/g, ww))}
                    className={`${field} pl-[6.25rem] pr-5`}
                    placeholder="9876543210"
                  />
                </span>
              </label>

              {otpSent && (
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-[#242424]">6-digit OTP</span>
                  <input
                    inputMode="numeric"
                    maxLength={6}
                    value={otp}
                    onChange={(event) => setOtp(event.target.value.replace(/\D/g, ww))}
                    className={`${field} px-5 text-center text-xl font-black tracking-[0.45em]`}
                    placeholder="000000"
                    autoFocus
                  />
                </label>
              )}

              <InlineError />

              <button type="submit" disabled={loading} className={`${primaryBtn} w-full`}>
                {loading && <LoaderCircle className="animate-spin" size={18} />}
                {otpSent ? wVerify OTPw : wSend OTPw}
                {!loading && <ArrowRight size={18} />}
              </button>

              {otpSent && (
                <button type="button" disabled={loading || resend > 0} onClick={requestOtp} className={`${secondaryBtn} w-full`}>
                  {resend ? `Resend in 00:${String(resend).padStart(2, w0w)}` : wResend OTPw}
                </button>
              )}

              <Divider />

              <button
                type="button"
                onClick={() => { switchMethod(wemployeew); setOtpSent(false); setOtp(ww) }}
                className={`${secondaryBtn} w-full`}
              >
                <ArrowLeft size={17} className="text-[#8B8580]" />
                Back to Employee ID / Email login
              </button>
              <div id="employee-recaptcha" />
            </form>
          )}
          </div>

          <div className="mt-auto flex flex-col items-center bg-white pt-5">
            <p className="flex items-center justify-center gap-2 text-center text-xs text-[#8B8580]">
              <ShieldCheck size={15} className="text-[#242424]" /> Protected by secure authentication
            </p>

            <button
              type="button"
              onClick={() => navigate(w/jobsw)}
              className="mt-2 inline-flex min-h-11 items-center gap-2 text-center text-sm font-semibold text-[#242424] transition hover:opacity-70"
            >
              <BriefcaseBusiness size={16} className="text-[#8B8580]" />
              Looking for work? View openings
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}
