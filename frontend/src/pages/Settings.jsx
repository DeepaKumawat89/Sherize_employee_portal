import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bell, CircleHelp, Copy, CreditCard, FileText, LockKeyhole, LogOut, Mail, ShieldCheck, Trash2, UserRound } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useSecurity } from '../context/SecurityContext'
import { Alert, cardClass, inputClass, PageHeader, primaryButton, secondaryButton } from '../components/ui'
import { errorMessage } from '../shared/utils/format'

export default function SettingsPage() {
  const { profile, logout } = useAuth()
  const security = useSecurity()
  const navigate = useNavigate()
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [securityError, setSecurityError] = useState('')
  const [securityNotice, setSecurityNotice] = useState('')
  const signOut = async () => { await logout(); navigate('/login', { replace: true }) }
  const savePin = async () => {
    setSecurityError(''); setSecurityNotice('')
    try { if (pin !== confirmPin) throw new Error('PIN values do not match.'); await security.setPasscode(pin); setPin(''); setConfirmPin(''); setSecurityNotice('Portal lock enabled on this browser.') } catch (error) { setSecurityError(errorMessage(error)) }
  }
  const removePin = async () => {
    setSecurityError(''); setSecurityNotice('')
    try { await security.clearPasscode(pin); setPin(''); setSecurityNotice('Portal lock disabled on this browser.') } catch (error) { setSecurityError(errorMessage(error)) }
  }
  const sections = [
    ['Account', [['/profile/edit', 'Edit profile', 'Personal and work information', UserRound], ['/profile/bank', 'Bank / UPI details', 'Withdrawal destination', CreditCard], ['/profile/kyc', 'KYC verification', 'Identity and work access', ShieldCheck], ['/notifications', 'Notifications', 'Task and payout updates', Bell]]],
    ['Support & legal', [['/inbox', 'Inbox', 'Messages with support', Mail], ['/help', 'Help centre', 'FAQs and contact options', CircleHelp], ['/privacy', 'Privacy policy', 'How Sherize handles your data', FileText], ['/terms', 'Terms of service', 'Employee platform terms', FileText]]],
  ]
  return <><PageHeader eyebrow="Employee account" title="Settings" description="Manage your profile, support and account access." />
    <section className={`${cardClass} mb-6 flex flex-col gap-4 p-5 sm:flex-row sm:items-center`}><span className="grid size-14 place-items-center rounded-2xl bg-indigo-100 text-xl font-black text-indigo-700">{(profile.fullName || profile.name || 'E')[0]}</span><div className="min-w-0 flex-1"><h2 className="font-black text-slate-950">{profile.fullName || profile.name || 'Employee'}</h2><p className="mt-1 text-sm text-slate-500">{profile.workerId || 'Employee ID not assigned'}</p></div>{profile.workerId && <button type="button" onClick={() => navigator.clipboard.writeText(profile.workerId)} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-600 hover:bg-slate-50"><Copy size={15} />Copy ID</button>}</section>
    {sections.map(([title, items]) => <section key={title} className={`${cardClass} mb-6 overflow-hidden`}><header className="border-b border-slate-200 px-5 py-4"><h2 className="text-sm font-black uppercase tracking-wider text-slate-500">{title}</h2></header>{items.map(([path, label, description, Icon]) => <Link key={path} to={path} className="flex items-center gap-4 border-b border-slate-100 p-5 last:border-0 hover:bg-slate-50"><span className="grid size-10 place-items-center rounded-xl bg-slate-100 text-slate-600"><Icon size={18} /></span><span className="min-w-0 flex-1"><strong className="block text-sm text-slate-900">{label}</strong><small className="mt-1 block text-xs text-slate-500">{description}</small></span></Link>)}</section>)}
    <section className={`${cardClass} mb-6 p-5 sm:p-6`}><div className="flex items-start gap-4"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-600"><LockKeyhole size={20} /></span><div><h2 className="font-black text-slate-950">Portal lock</h2><p className="mt-1 text-sm leading-6 text-slate-500">{security.enabled ? 'Enabled. The portal locks when this browser tab is backgrounded.' : 'Protect this browser with a local 4–6 digit PIN.'}</p></div></div>{securityNotice && <div className="mt-4"><Alert type="success" onClose={() => setSecurityNotice('')}>{securityNotice}</Alert></div>}{securityError && <div className="mt-4"><Alert onClose={() => setSecurityError('')}>{securityError}</Alert></div>}<div className="mt-5 grid gap-3 sm:grid-cols-2"><input type="password" inputMode="numeric" maxLength={6} value={pin} onChange={(event) => setPin(event.target.value.replace(/\D/g, ''))} className={inputClass} placeholder={security.enabled ? 'Current PIN' : 'New PIN'} />{!security.enabled && <input type="password" inputMode="numeric" maxLength={6} value={confirmPin} onChange={(event) => setConfirmPin(event.target.value.replace(/\D/g, ''))} className={inputClass} placeholder="Confirm PIN" />}</div><div className="mt-4 flex flex-wrap gap-2">{security.enabled ? <><button type="button" onClick={() => security.lock()} className={primaryButton}>Lock now</button><button type="button" onClick={removePin} className={secondaryButton}>Disable lock</button></> : <button type="button" onClick={savePin} className={primaryButton}>Enable portal lock</button>}</div></section>
    <section className={`${cardClass} overflow-hidden`}><button type="button" onClick={signOut} className="flex w-full items-center gap-4 border-b border-slate-100 p-5 text-left hover:bg-rose-50"><span className="grid size-10 place-items-center rounded-xl bg-rose-50 text-rose-600"><LogOut size={18} /></span><span><strong className="block text-sm text-rose-700">Sign out</strong><small className="mt-1 block text-xs text-slate-500">End this browser session</small></span></button><a href="mailto:info@sherize.in?subject=Sherize%20Account%20Deletion%20Request&body=Please%20delete%20my%20Sherize%20account%20and%20associated%20personal%20data.%0A%0ARegistered%20email%20or%20Employee%20ID%3A%20" className="flex items-center gap-4 p-5 hover:bg-rose-50"><span className="grid size-10 place-items-center rounded-xl bg-rose-50 text-rose-600"><Trash2 size={18} /></span><span><strong className="block text-sm text-rose-700">Request account deletion</strong><small className="mt-1 block text-xs text-slate-500">Delete your account and associated personal data</small></span></a></section>
  </>
}
