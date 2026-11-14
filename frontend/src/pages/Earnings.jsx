import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { collection, doc, limit, orderBy, query, where } from 'firebase/firestore'
import { ArrowDownLeft, ArrowUpRight, Banknote, Clock3, IndianRupee, LoaderCircle, WalletCards, X } from 'lucide-react'
import { db } from '../services/firebase'
import { useAuth } from '../context/AuthContext'
import { usePlatform } from '../context/PlatformContext'
import { useCollection, useDocument } from '../hooks/useFirestore'
import { callExistingFunction } from '../services/employee'
import { Alert, cardClass, EmptyState, inputClass, PageHeader, primaryButton, secondaryButton, StatusPill } from '../components/ui'
import { dateValue, errorMessage, formatDateTime, isKycApproved, money, profileMissing } from '../shared/utils/format'

export default function Earnings() {
  const { user, profile } = useAuth()
  const platform = usePlatform()
  const [filter, setFilter] = useState('all')
  const [withdrawOpen, setWithdrawOpen] = useState(false)
  const [withdrawal, setWithdrawal] = useState({ amount: '', paymentMethod: 'upi', paymentDetails: '' })
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const walletRef = useMemo(() => doc(db, 'worker_wallets', user.uid), [user.uid])
  const transactionQuery = useMemo(() => {
    const constraints = [where('userId', '==', user.uid)]
    if (filter === 'credit' || filter === 'debit') constraints.push(where('type', '==', filter))
    constraints.push(orderBy('createdAt', 'desc'), limit(50))
    return query(collection(db, 'transactions'), ...constraints)
  }, [user.uid, filter])
  const pendingQuery = useMemo(() => query(collection(db, 'task_submissions'), where('userId', '==', user.uid), where('status', 'in', ['pending_admin_review', 'pending_payment']), limit(100)), [user.uid])
  const { data: wallet } = useDocument(walletRef)
  const { data: transactions, loading, error: transactionError } = useCollection(transactionQuery)
  const { data: pending } = useCollection(pendingQuery)
  const pendingAmount = pending.reduce((sum, item) => sum + Number(item.payout || 0), 0)
  const startToday = new Date(); startToday.setHours(0, 0, 0, 0)
  const today = transactions.filter((item) => item.type === 'credit' && item.status !== 'failed' && (dateValue(item.createdAt)?.getTime() || 0) >= startToday.getTime()).reduce((sum, item) => sum + Number(item.amount || 0), 0)
  const missing = profileMissing(profile)
  const canWithdraw = isKycApproved(profile) && missing.length === 0 && Number(wallet?.balance || 0) >= Number(platform.minWithdrawalAmount || 100)

  const openWithdrawal = () => {
    if (!isKycApproved(profile)) { setError('Complete KYC approval before requesting a withdrawal.'); return }
    if (missing.length) { setError(`Complete your profile before withdrawing: ${missing.join(', ')}.`); return }
    setWithdrawal((current) => ({ ...current, amount: String(Math.floor(Number(wallet?.balance || 0))) }))
    setWithdrawOpen(true)
  }

  const requestWithdrawal = async (event) => {
    event.preventDefault()
    const amount = Number(withdrawal.amount)
    if (!Number.isFinite(amount) || amount < Number(platform.minWithdrawalAmount || 100)) { setError(`Minimum withdrawal is ${money(platform.minWithdrawalAmount || 100)}.`); return }
    if (amount > Number(wallet?.balance || 0)) { setError('Amount exceeds your withdrawable balance.'); return }
    if (!withdrawal.paymentDetails.trim()) { setError('Enter the payment details for this withdrawal.'); return }
    setBusy(true); setError('')
    try {
      const response = await callExistingFunction('requestWithdrawal', { amount, paymentMethod: withdrawal.paymentMethod, paymentDetails: withdrawal.paymentDetails.trim() })
      setNotice(response.data?.message || 'Withdrawal requested successfully.')
      setWithdrawOpen(false)
    } catch (nextError) { setError(errorMessage(nextError, 'Withdrawal request failed.')) } finally { setBusy(false) }
  }

  if (!platform.earningsSystemEnabled) return <EmptyState icon={WalletCards} title="Earnings are not available right now" description="Your earnings history remains safe and will return when the system is enabled." />
  return <>
    <PageHeader eyebrow="Employee finance" title="Earnings" description="Track approved payouts, pending work and withdrawal activity." actions={<button type="button" onClick={openWithdrawal} disabled={!canWithdraw} className={primaryButton}><Banknote size={18} />Withdraw funds</button>} />
    {notice && <div className="mb-5"><Alert type="success" onClose={() => setNotice('')}>{notice}</Alert></div>}{error && <div className="mb-5"><Alert onClose={() => setError('')}>{error}</Alert></div>}{transactionError && <div className="mb-5"><Alert>{errorMessage(transactionError, 'Unable to load transactions.')}</Alert></div>}
    {!isKycApproved(profile) && <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:flex-row sm:items-center"><div className="flex-1"><h2 className="font-black text-amber-900">KYC approval required</h2><p className="mt-1 text-sm leading-6 text-amber-800">You can track earnings now, but withdrawals unlock after identity verification.</p></div><Link to="/profile/kyc" className={`${secondaryButton} w-full sm:w-auto`}>Complete KYC</Link></div>}
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[['Available balance', wallet?.balance, WalletCards, 'bg-indigo-50 text-indigo-700'], ['Lifetime earned', wallet?.totalEarned, IndianRupee, 'bg-emerald-50 text-emerald-700'], ['Earned today', today, ArrowDownLeft, 'bg-sky-50 text-sky-700'], ['Pending review', pendingAmount, Clock3, 'bg-amber-50 text-amber-700']].map(([label, value, Icon, color]) => <article key={label} className={`${cardClass} p-5`}><span className={`grid size-11 place-items-center rounded-xl ${color}`}><Icon size={20} /></span><p className="mt-4 text-sm font-semibold text-slate-500">{label}</p><strong className="mt-1 block break-words text-xl font-black text-slate-950 min-[380px]:text-2xl">{money(value)}</strong></article>)}</section>
    <section className={`${cardClass} mt-6 overflow-hidden`}><header className="flex flex-col gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"><div><h2 className="text-lg font-black text-slate-950">Transaction history</h2><p className="mt-1 text-sm text-slate-500">Latest credits and withdrawal debits</p></div><div className="inline-flex rounded-xl bg-slate-100 p-1">{[['all', 'All'], ['credit', 'Credits'], ['debit', 'Debits']].map(([value, label]) => <button key={value} type="button" onClick={() => setFilter(value)} className={`rounded-lg px-3 py-2 text-xs font-bold ${filter === value ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}>{label}</button>)}</div></header>{loading ? <div className="grid min-h-52 place-items-center"><LoaderCircle className="animate-spin text-indigo-600" /></div> : transactions.length === 0 ? <div className="p-6"><EmptyState icon={WalletCards} title="No transactions" description="Approved earnings and withdrawals appear here." /></div> : <div>{transactions.map((item) => { const credit = item.type === 'credit'; return <article key={item.id} className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 border-b border-slate-100 p-4 last:border-0 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center sm:gap-4 sm:px-6"><span className={`grid size-11 shrink-0 place-items-center rounded-xl ${credit ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{credit ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}</span><div className="min-w-0 flex-1"><h3 className="truncate text-sm font-bold text-slate-900">{item.title || item.description || (credit ? 'Task payout' : 'Withdrawal')}</h3><p className="mt-1 text-xs text-slate-500">{formatDateTime(item.createdAt)}</p></div><div className="col-start-2 text-left sm:col-start-auto sm:text-right"><strong className={`block text-sm ${credit ? 'text-emerald-700' : 'text-slate-900'}`}>{credit ? '+' : '-'}{money(Math.abs(Number(item.amount || 0)))}</strong><span className="mt-1 inline-block"><StatusPill status={item.status || 'success'} /></span></div></article>})}</div>}</section>
    {withdrawOpen && <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-950/60 p-3 backdrop-blur-sm sm:p-4"><form onSubmit={requestWithdrawal} className="my-auto max-h-[calc(100dvh-1.5rem)] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl sm:max-h-[calc(100dvh-2rem)] sm:p-8"><div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-indigo-600">Secure payout</p><h2 className="mt-1 text-xl font-black text-slate-950">Request withdrawal</h2></div><button type="button" onClick={() => setWithdrawOpen(false)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"><X size={20} /></button></div><p className="mt-3 text-sm leading-6 text-slate-500">Available {money(wallet?.balance)} · Minimum {money(platform.minWithdrawalAmount || 100)}</p><div className="mt-6 space-y-4"><label className="block"><span className="mb-2 block text-sm font-bold text-slate-700">Amount</span><input type="number" min={platform.minWithdrawalAmount || 100} max={wallet?.balance || 0} step="1" value={withdrawal.amount} onChange={(event) => setWithdrawal((current) => ({ ...current, amount: event.target.value }))} className={inputClass} /></label><label className="block"><span className="mb-2 block text-sm font-bold text-slate-700">Payment method</span><select value={withdrawal.paymentMethod} onChange={(event) => setWithdrawal((current) => ({ ...current, paymentMethod: event.target.value }))} className={inputClass}><option value="upi">UPI</option><option value="bank_account">Bank account</option></select></label><label className="block"><span className="mb-2 block text-sm font-bold text-slate-700">Payment details</span><textarea rows={3} value={withdrawal.paymentDetails} onChange={(event) => setWithdrawal((current) => ({ ...current, paymentDetails: event.target.value }))} className={`${inputClass} py-3`} placeholder={withdrawal.paymentMethod === 'upi' ? 'name@upi' : 'Account number and IFSC code'} /></label></div><button type="submit" disabled={busy} className={`${primaryButton} mt-6 w-full`}>{busy ? <LoaderCircle className="animate-spin" size={18} /> : <Banknote size={18} />}Submit request</button></form></div>}
  </>
}
