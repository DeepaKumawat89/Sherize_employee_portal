import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bell, Check, ChevronRight, CircleHelp, Copy, CreditCard, FileText, LockKeyhole, LogOut, Mail, ShieldCheck, Trash2, UserRound } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useSecurity } from '../context/SecurityContext'
import { Alert, cardClass, inputClass, PageHeader, primaryButton, secondaryButton } from '../components/ui'
import { errorMessage } from '../shared/utils/format'

const groups = [
  {
    title: 'Account',
    description: 'Your profile, payouts and verification',
    items: [
      { to: '/profile/edit', label: 'Edit profile', hint: 'Personal and work information', Icon: UserRound },
      { to: '/profile/bank', label: 'Bank / UPI details', hint: 'Withdrawal destination', Icon: CreditCard },
      { to: '/profile/kyc', label: 'KYC verification', hint: 'Identity and work access', Icon: ShieldCheck },
      { to: '/notifications', label: 'Notifications', hint: 'Task and payout updates', Icon: Bell },
    ],
  },
  {
    title: 'Support & legal',
    description: 'Get help and read our policies',
    items: [
      { to: '/inbox', label: 'Inbox', hint: 'Messages with support', Icon: Mail },
      { to: '/help', label: 'Help centre', hint: 'FAQs and contact options', Icon: CircleHelp },
      { to: '/privacy', label: 'Privacy policy', hint: 'How Sherize handles your data', Icon: FileText },
      { to: '/terms', label: 'Terms of service', hint: 'Employee platform terms', Icon: FileText },
    ],
  },
]

const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-inset'

function Group({ title, description, children }) {
  return (
    <section className={`${cardClass} mb-6 overflow-hidden`}>
      <header className="border-b border-slate-100 bg-slate-50/70 px-5 py-4">
        <h2 className="text-base font-black text-slate-950">{title}</h2>
        {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
      </header>
      <div className="divide-y divide-slate-100">{children}</div>
    </section>
  )
}

function IconBadge({ children, tone = 'slate' }) {
  const tones = {
    slate: 'bg-slate-100 text-slate-600 group-hover:bg-indigo-50 group-hover:text-indigo-600',
    rose: 'bg-rose-50 text-rose-600 group-hover:bg-rose-100',
  }
  return <span className={`grid size-11 shrink-0 place-items-center rounded-xl transition-colors ${tones[tone]}`}>{children}</span>
}

export default function SettingsPage() {
  const { profile, logout } = useAuth()
  const security = useSecurity()
  const navigate = useNavigate()
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [securityError, setSecurityError] = useState('')
  const [securityNotice, setSecurityNotice] = useState('')
  const [copied, setCopied] = useState(false)

  const displayName = profile.fullName || profile.name || 'Employee'
  const initial = displayName[0].toUpperCase()

  const signOut = async () => { await logout(); navigate('/login', { replace: true }) }

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(profile.workerId)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch { /* clipboard unavailable */ }
  }

  const savePin = async () => {
    setSecurityError(''); setSecurityNotice('')
    try {
      if (pin !== confirmPin) throw new Error('PIN values do not match.')
      await security.setPasscode(pin)
      setPin(''); setConfirmPin('')
      setSecurityNotice('Portal lock enabled on this browser.')
    } catch (error) { setSecurityError(errorMessage(error)) }
  }

  const removePin = async () => {
    setSecurityError(''); setSecurityNotice('')
    try {
      await security.clearPasscode(pin)
      setPin('')
      setSecurityNotice('Portal lock disabled on this browser.')
    } catch (error) { setSecurityError(errorMessage(error)) }
  }

  const onPinKey = (action) => (event) => { if (event.key === 'Enter') action() }
  const digitsOnly = (setter) => (event) => setter(event.target.value.replace(/\D/g, ''))

  return (
    <>
      <PageHeader eyebrow="Employee account" title="Settings" description="Manage your profile, support and account access." />

      {/* Profile summary */}
      <section className={`${cardClass} mb-6 overflow-hidden`}>
        <div className="h-16 bg-gradient-to-r from-indigo-600 to-indigo-400" />
        <div className="flex flex-col gap-4 px-4 pb-5 min-[380px]:px-5 sm:flex-row sm:items-end sm:px-6">
          <span className="-mt-8 grid size-16 shrink-0 place-items-center rounded-2xl bg-indigo-100 text-2xl font-black text-indigo-700 shadow-sm ring-4 ring-white">
            {initial}
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-black text-slate-950">{displayName}</h2>
            <p className="mt-0.5 text-sm text-slate-500">
              {profile.workerId ? <>Employee ID <span className="font-bold text-slate-700">{profile.workerId}</span></> : 'Employee ID not assigned'}
            </p>
          </div>
          {profile.workerId && (
            <button
              type="button"
              onClick={copyId}
              aria-live="polite"
              className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border px-4 text-xs font-bold transition-colors ${
                copied ? 'border-indigo-200 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500`}
            >
              {copied ? <Check size={15} /> : <Copy size={15} />}
              {copied ? 'Copied' : 'Copy ID'}
            </button>
          )}
        </div>
      </section>

      {/* Link groups */}
      {groups.map(({ title, description, items }) => (
        <Group key={title} title={title} description={description}>
          {items.map(({ to, label, hint, Icon }) => (
            <Link key={to} to={to} className={`group flex items-center gap-4 p-4 transition-colors hover:bg-slate-50 sm:px-5 ${focusRing}`}>
              <IconBadge><Icon size={19} /></IconBadge>
              <span className="min-w-0 flex-1">
                <strong className="block text-sm font-bold text-slate-900">{label}</strong>
                <small className="mt-0.5 block text-xs text-slate-500">{hint}</small>
              </span>
              <ChevronRight size={18} className="shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-indigo-500" />
            </Link>
          ))}
        </Group>
      ))}

      {/* Portal lock */}
      <section className={`${cardClass} mb-6 p-4 min-[380px]:p-5 sm:p-6`}>
        <div className="flex items-start gap-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
            <LockKeyhole size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-black text-slate-950">Portal lock</h2>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${security.enabled ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>
                {security.enabled ? 'On' : 'Off'}
              </span>
            </div>
            <p className="mt-1 max-w-prose text-sm leading-6 text-slate-500">
              {security.enabled
                ? 'The portal locks when this browser tab is in the background. Enter your PIN to turn the lock off.'
                : 'Protect this browser with a local 4–6 digit PIN. It stays on this device.'}
            </p>
          </div>
        </div>

        {securityNotice && <div className="mt-4"><Alert type="success" onClose={() => setSecurityNotice('')}>{securityNotice}</Alert></div>}
        {securityError && <div className="mt-4"><Alert onClose={() => setSecurityError('')}>{securityError}</Alert></div>}

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <input
            type="password"
            inputMode="numeric"
            autoComplete="off"
            maxLength={6}
            value={pin}
            onChange={digitsOnly(setPin)}
            onKeyDown={onPinKey(security.enabled ? removePin : savePin)}
            className={`${inputClass} tracking-[0.35em]`}
            placeholder={security.enabled ? 'Current PIN' : 'New PIN'}
            aria-label={security.enabled ? 'Current PIN' : 'New PIN'}
          />
          {!security.enabled && (
            <input
              type="password"
              inputMode="numeric"
              autoComplete="off"
              maxLength={6}
              value={confirmPin}
              onChange={digitsOnly(setConfirmPin)}
              onKeyDown={onPinKey(savePin)}
              className={`${inputClass} tracking-[0.35em]`}
              placeholder="Confirm PIN"
              aria-label="Confirm PIN"
            />
          )}
        </div>

        <div className="mt-4 flex flex-col gap-2 min-[380px]:flex-row min-[380px]:flex-wrap [&>*]:w-full min-[380px]:[&>*]:w-auto">
          {security.enabled ? (
            <>
              <button type="button" onClick={() => security.lock()} className={primaryButton}>Lock now</button>
              <button type="button" onClick={removePin} className={secondaryButton}>Turn off lock</button>
            </>
          ) : (
            <button type="button" onClick={savePin} className={primaryButton}>Turn on portal lock</button>
          )}
        </div>
      </section>

      {/* Session & danger zone */}
      <Group title="Session" description="Sign out or remove your account">
        <button type="button" onClick={signOut} className={`group flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-rose-50 sm:px-5 ${focusRing}`}>
          <IconBadge tone="rose"><LogOut size={19} /></IconBadge>
          <span className="min-w-0 flex-1">
            <strong className="block text-sm font-bold text-rose-700">Sign out</strong>
            <small className="mt-0.5 block text-xs text-slate-500">End this browser session</small>
          </span>
          <ChevronRight size={18} className="shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-rose-500" />
        </button>
        <a
          href="mailto:info@sherize.in?subject=Sherize%20Account%20Deletion%20Request&body=Please%20delete%20my%20Sherize%20account%20and%20associated%20personal%20data.%0A%0ARegistered%20email%20or%20Employee%20ID%3A%20"
          className={`group flex items-center gap-4 p-4 transition-colors hover:bg-rose-50 sm:px-5 ${focusRing}`}
        >
          <IconBadge tone="rose"><Trash2 size={19} /></IconBadge>
          <span className="min-w-0 flex-1">
            <strong className="block text-sm font-bold text-rose-700">Request account deletion</strong>
            <small className="mt-0.5 block text-xs text-slate-500">Delete your account and associated personal data</small>
          </span>
          <ChevronRight size={18} className="shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-rose-500" />
        </a>
      </Group>
    </>
  )
}
