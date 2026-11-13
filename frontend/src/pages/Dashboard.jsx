import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { collection, doc, limit, query, serverTimestamp, updateDoc, where } from 'firebase/firestore'
import { Banknote, BellRing, BriefcaseBusiness, CheckCircle2, Clock3, Coffee, IndianRupee, LoaderCircle, Pause, Play, Save, ShieldCheck, TimerReset, UserRound } from 'lucide-react'
import { db } from '../services/firebase'
import { useAuth } from '../context/AuthContext'
import { usePlatform } from '../context/PlatformContext'
import { useCollection, useDocument } from '../hooks/useFirestore'
import { transitionWorkSession, todayKey } from '../services/employee'
import { Alert, cardClass, inputClass, PageHeader, primaryButton, secondaryButton } from '../components/ui'
import { errorMessage, isKycApproved, money, profileMissing } from '../shared/utils/format'

function elapsed(session) {
  if (!session?.startedAt) return 0
  const end = session.endedAt?.toDate?.() || new Date()
  return Math.max(0, Math.floor((end - session.startedAt.toDate()) / 1000))
}

function duration(seconds) {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  return `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m`
}

export default function Dashboard() {
  const { user, profile } = useAuth()
  const platform = usePlatform()
  const walletRef = useMemo(() => doc(db, 'worker_wallets', user.uid), [user.uid])
  const sessionRef = useMemo(() => doc(db, 'work_sessions', `${user.uid}_${todayKey()}`), [user.uid])
  const assignmentQuery = useMemo(() => query(collection(db, 'task_assignments'), where('userId', '==', user.uid), limit(50)), [user.uid])
  const pendingQuery = useMemo(() => query(collection(db, 'task_submissions'), where('userId', '==', user.uid), where('status', 'in', ['pending_admin_review', 'pending_payment']), limit(30)), [user.uid])
  const approvedQuery = useMemo(() => query(collection(db, 'task_submissions'), where('userId', '==', user.uid), where('status', '==', 'approved'), limit(1)), [user.uid])
  const { data: wallet } = useDocument(walletRef)
  const { data: session } = useDocument(sessionRef)
  const { data: assignments } = useCollection(assignmentQuery)
  const { data: pending } = useCollection(pendingQuery)
  const { data: approved } = useCollection(approvedQuery)
  const [sessionBusy, setSessionBusy] = useState(false)
  const [sessionError, setSessionError] = useState('')
  const [progressNote, setProgressNote] = useState('')
  const [progressPercent, setProgressPercent] = useState(0)

  useEffect(() => {
    setProgressNote(session?.progressNote || '')
    setProgressPercent(Number(session?.progressPercent || 0))
  }, [session?.progressNote, session?.progressPercent])

  const status = session?.status || 'idle'
  const counts = assignments.reduce((result, assignment) => {
    const state = String(assignment.status || '').toLowerCase()
    if (['active', 'in_progress', 'accepted', 'assigned'].includes(state)) result.active += 1
    else if (['pending', 'pending_admin_review'].includes(state)) result.pending += 1
    else if (['completed', 'approved'].includes(state)) result.done += 1
    return result
  }, { active: 0, pending: 0, done: 0 })
  const pendingAmount = pending.reduce((total, item) => total + Number(item.payout || 0), 0)
  const missing = profileMissing(profile)
  const checklist = [
    ['Complete your profile', missing.filter((item) => item !== 'Bank / UPI details').length === 0, '/profile/edit', UserRound],
    ['Verify your identity', isKycApproved(profile), '/profile/kyc', ShieldCheck],
    ['Complete your first task', approved.length > 0, '/tasks', CheckCircle2],
  ]

  const sessionAction = async (action) => {
    setSessionBusy(true)
    setSessionError('')
    try { await transitionWorkSession(user.uid, action) } catch (error) { setSessionError(errorMessage(error)) } finally { setSessionBusy(false) }
  }
  const saveProgress = async () => {
    if (!session) return
    setSessionBusy(true); setSessionError('')
    try { await updateDoc(sessionRef, { progressNote: progressNote.trim(), progressPercent: Math.max(0, Math.min(100, Number(progressPercent))), updatedAt: serverTimestamp() }) } catch (error) { setSessionError(errorMessage(error, 'Unable to save today’s progress.')) } finally { setSessionBusy(false) }
  }

  return <>
    <PageHeader eyebrow="Employee overview" title={`Good to see you, ${(profile.fullName || profile.name || 'Employee').split(' ')[0]}`} description="Track your day, assignments and earnings from one workspace." actions={<Link className={primaryButton} to="/tasks"><BriefcaseBusiness size={18} />Find tasks</Link>} />
    {platform.announcement?.trim() && <div className="mb-6 flex gap-3 rounded-2xl border border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-900"><BellRing className="shrink-0 text-indigo-600" size={20} /><p className="leading-6">{platform.announcement}</p></div>}
    {sessionError && <div className="mb-6"><Alert onClose={() => setSessionError('')}>{sessionError}</Alert></div>}

    <section className={`${cardClass} overflow-hidden p-5 sm:p-6`}><div className="flex flex-col gap-6 xl:flex-row xl:items-center"><div className="flex min-w-0 flex-1 items-center gap-4"><span className={`grid size-14 shrink-0 place-items-center rounded-2xl ${status === 'active' ? 'bg-emerald-100 text-emerald-700' : status === 'on_break' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}><Clock3 size={25} /></span><div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Today’s work session</p><h2 className="mt-1 text-xl font-black capitalize text-slate-950">{status.replace('_', ' ')}</h2><p className="mt-1 text-sm text-slate-500">Elapsed {duration(elapsed(session))} · Daily target 08h 00m</p></div></div><div className="flex flex-wrap gap-2">{status === 'idle' && <button disabled={sessionBusy} onClick={() => sessionAction('start_day')} className={primaryButton}>{sessionBusy ? <LoaderCircle className="animate-spin" size={18} /> : <Play size={18} />}Start day</button>}{status === 'active' && <><button disabled={sessionBusy} onClick={() => sessionAction('start_break')} className={secondaryButton}><Coffee size={18} />Start break</button><button disabled={sessionBusy} onClick={() => sessionAction('end_day')} className={primaryButton}><Pause size={18} />End day</button></>}{status === 'on_break' && <><button disabled={sessionBusy} onClick={() => sessionAction('resume_work')} className={primaryButton}><Play size={18} />Resume work</button><button disabled={sessionBusy} onClick={() => sessionAction('end_day')} className={secondaryButton}><TimerReset size={18} />End day</button></>}</div></div>{session && <div className="mt-6 grid gap-4 border-t border-slate-200 pt-5 lg:grid-cols-[1fr_220px_auto] lg:items-end"><label><span className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Today’s progress note</span><input value={progressNote} onChange={(event) => setProgressNote(event.target.value)} className={inputClass} placeholder="What did you complete today?" /></label><label><span className="mb-2 flex justify-between text-xs font-bold uppercase tracking-wider text-slate-500"><span>Progress</span><span>{progressPercent}%</span></span><input type="range" min="0" max="100" step="5" value={progressPercent} onChange={(event) => setProgressPercent(event.target.value)} className="h-12 w-full accent-indigo-600" /></label><button type="button" disabled={sessionBusy} onClick={saveProgress} className={secondaryButton}><Save size={17} />Save</button></div>}</section>

    <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[
      ['Active assignments', counts.active, BriefcaseBusiness, 'bg-indigo-50 text-indigo-700'],
      ['Pending review', counts.pending, Clock3, 'bg-amber-50 text-amber-700'],
      ['Completed tasks', counts.done, CheckCircle2, 'bg-emerald-50 text-emerald-700'],
      ...(platform.earningsSystemEnabled ? [['Wallet balance', money(wallet?.balance), IndianRupee, 'bg-violet-50 text-violet-700']] : []),
    ].map(([label, value, Icon, color]) => <article key={label} className={`${cardClass} p-5`}><span className={`grid size-11 place-items-center rounded-xl ${color}`}><Icon size={20} /></span><p className="mt-4 text-sm font-semibold text-slate-500">{label}</p><strong className="mt-1 block text-2xl font-black text-slate-950">{value}</strong></article>)}</section>

    <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
      <section className={`${cardClass} p-5 sm:p-6`}><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-indigo-600">Getting started</p><h2 className="mt-1 text-xl font-black text-slate-950">Employee checklist</h2></div><span className="text-sm font-bold text-slate-500">{checklist.filter(([, done]) => done).length}/3</span></div><div className="mt-5 space-y-3">{checklist.map(([label, done, path, Icon]) => <Link key={label} to={path} className="flex items-center gap-4 rounded-2xl border border-slate-200 p-4 transition hover:border-indigo-200 hover:bg-indigo-50/40"><span className={`grid size-10 place-items-center rounded-xl ${done ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{done ? <CheckCircle2 size={20} /> : <Icon size={20} />}</span><div className="min-w-0 flex-1"><p className="font-bold text-slate-900">{label}</p><p className="mt-0.5 text-xs text-slate-500">{done ? 'Completed' : 'Action required'}</p></div><span className={`text-xs font-bold ${done ? 'text-emerald-600' : 'text-indigo-600'}`}>{done ? 'Done' : 'Continue'}</span></Link>)}</div></section>
      {platform.earningsSystemEnabled && <section className={`${cardClass} bg-slate-950 p-6 text-white`}><span className="grid size-12 place-items-center rounded-2xl bg-white/10 text-indigo-300"><Banknote size={23} /></span><p className="mt-6 text-sm font-semibold text-slate-400">Available balance</p><strong className="mt-1 block text-4xl font-black">{money(wallet?.balance)}</strong><div className="mt-5 flex items-center justify-between rounded-2xl bg-white/5 p-4"><span className="text-sm text-slate-400">Pending review</span><b>{money(pendingAmount)}</b></div><Link to="/earnings" className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-white text-sm font-bold text-slate-950 hover:bg-slate-100">View earnings</Link></section>}
    </div>
  </>
}
