// import { useEffect, useMemo, useState } from 'react'
// import { Link } from 'react-router-dom'
// import { collection, doc, limit, query, serverTimestamp, updateDoc, where } from 'firebase/firestore'
// import { Banknote, BellRing, BriefcaseBusiness, CheckCircle2, Clock3, Coffee, LoaderCircle, Pause, Play, Save, ShieldCheck, TimerReset, UserRound } from 'lucide-react'
// import { db } from '../services/firebase'
// import { useAuth } from '../context/AuthContext'
// import { usePlatform } from '../context/PlatformContext'
// import { useCollection, useDocument } from '../hooks/useFirestore'
// import { transitionWorkSession, todayKey } from '../services/employee'
// import { Alert, cardClass, inputClass, PageHeader, primaryButton, secondaryButton } from '../components/ui'
// import { errorMessage, isKycApproved, money, profileMissing } from '../shared/utils/format'

// function elapsed(session) {
//   if (!session?.startedAt) return 0
//   const end = session.endedAt?.toDate?.() || new Date()
//   return Math.max(0, Math.floor((end - session.startedAt.toDate()) / 1000))
// }

// function duration(seconds) {
//   const hours = Math.floor(seconds / 3600)
//   const minutes = Math.floor((seconds % 3600) / 60)
//   return `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m`
// }

// export default function Dashboard() {
//   const { user, profile } = useAuth()
//   const platform = usePlatform()
//   const walletRef = useMemo(() => doc(db, 'worker_wallets', user.uid), [user.uid])
//   const sessionRef = useMemo(() => doc(db, 'work_sessions', `${user.uid}_${todayKey()}`), [user.uid])
//   const assignmentQuery = useMemo(() => query(collection(db, 'task_assignments'), where('userId', '==', user.uid), limit(50)), [user.uid])
//   const pendingQuery = useMemo(() => query(collection(db, 'task_submissions'), where('userId', '==', user.uid), where('status', 'in', ['pending_admin_review', 'pending_payment']), limit(30)), [user.uid])
//   const approvedQuery = useMemo(() => query(collection(db, 'task_submissions'), where('userId', '==', user.uid), where('status', '==', 'approved'), limit(1)), [user.uid])
//   const { data: wallet } = useDocument(walletRef)
//   const { data: session } = useDocument(sessionRef)
//   const { data: assignments } = useCollection(assignmentQuery)
//   const { data: pending } = useCollection(pendingQuery)
//   const { data: approved } = useCollection(approvedQuery)
//   const [sessionBusy, setSessionBusy] = useState(false)
//   const [sessionError, setSessionError] = useState('')
//   const [progressNote, setProgressNote] = useState('')
//   const [progressPercent, setProgressPercent] = useState(0)

//   useEffect(() => {
//     setProgressNote(session?.progressNote || '')
//     setProgressPercent(Number(session?.progressPercent || 0))
//   }, [session?.progressNote, session?.progressPercent])

//   const status = session?.status || 'idle'
//   const counts = assignments.reduce((result, assignment) => {
//     const state = String(assignment.status || '').toLowerCase()
//     if (['active', 'in_progress', 'accepted', 'assigned'].includes(state)) result.active += 1
//     else if (['pending', 'pending_admin_review'].includes(state)) result.pending += 1
//     else if (['completed', 'approved'].includes(state)) result.done += 1
//     return result
//   }, { active: 0, pending: 0, done: 0 })
//   const pendingAmount = pending.reduce((total, item) => total + Number(item.payout || 0), 0)
//   const missing = profileMissing(profile)
//   const checklist = [
//     ['Complete your profile', missing.filter((item) => item !== 'Bank / UPI details').length === 0, '/profile/edit', UserRound],
//     ['Verify your identity', isKycApproved(profile), '/profile/kyc', ShieldCheck],
//     ['Complete your first task', approved.length > 0, '/tasks', CheckCircle2],
//   ]

//   const sessionAction = async (action) => {
//     setSessionBusy(true)
//     setSessionError('')
//     try { await transitionWorkSession(user.uid, action) } catch (error) { setSessionError(errorMessage(error)) } finally { setSessionBusy(false) }
//   }
//   const saveProgress = async () => {
//     if (!session) return
//     setSessionBusy(true); setSessionError('')
//     try { await updateDoc(sessionRef, { progressNote: progressNote.trim(), progressPercent: Math.max(0, Math.min(100, Number(progressPercent))), updatedAt: serverTimestamp() }) } catch (error) { setSessionError(errorMessage(error, 'Unable to save today’s progress.')) } finally { setSessionBusy(false) }
//   }

//   return <>
//     <PageHeader eyebrow="Employee overview" title={`Good to see you, ${(profile.fullName || profile.name || 'Employee').split(' ')[0]}`} description="Track your day, assignments and earnings from one workspace." actions={<Link className={primaryButton} to="/tasks"><BriefcaseBusiness size={18} />Find tasks</Link>} />
//     {platform.announcement?.trim() && <div className="mb-6 flex gap-3 rounded-2xl border border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-900"><BellRing className="shrink-0 text-indigo-600" size={20} /><p className="leading-6">{platform.announcement}</p></div>}
//     {sessionError && <div className="mb-6"><Alert onClose={() => setSessionError('')}>{sessionError}</Alert></div>}

//     <div className="grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(280px,.75fr)] xl:items-stretch">

//     <section className={`${cardClass} overflow-hidden p-5 sm:p-6`}><div className="flex flex-col gap-6 xl:flex-row xl:items-center"><div className="flex min-w-0 flex-1 items-center gap-4"><span className={`grid size-14 shrink-0 place-items-center rounded-2xl ${status === 'active' ? 'bg-emerald-100 text-emerald-700' : status === 'on_break' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}><Clock3 size={25} /></span><div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Today’s work session</p><h2 className="mt-1 text-xl font-black capitalize text-slate-950">{status.replace('_', ' ')}</h2><p className="mt-1 text-sm text-slate-500">Elapsed {duration(elapsed(session))} · Daily target 08h 00m</p></div></div><div className="flex flex-wrap gap-2">{status === 'idle' && <button disabled={sessionBusy} onClick={() => sessionAction('start_day')} className={primaryButton}>{sessionBusy ? <LoaderCircle className="animate-spin" size={18} /> : <Play size={18} />}Start day</button>}{status === 'active' && <><button disabled={sessionBusy} onClick={() => sessionAction('start_break')} className={secondaryButton}><Coffee size={18} />Start break</button><button disabled={sessionBusy} onClick={() => sessionAction('end_day')} className={primaryButton}><Pause size={18} />End day</button></>}{status === 'on_break' && <><button disabled={sessionBusy} onClick={() => sessionAction('resume_work')} className={primaryButton}><Play size={18} />Resume work</button><button disabled={sessionBusy} onClick={() => sessionAction('end_day')} className={secondaryButton}><TimerReset size={18} />End day</button></>}</div></div>{session && <div className="mt-6 grid gap-4 border-t border-slate-200 pt-5 lg:grid-cols-[1fr_220px_auto] lg:items-end"><label><span className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Today’s progress note</span><input value={progressNote} onChange={(event) => setProgressNote(event.target.value)} className={inputClass} placeholder="What did you complete today?" /></label><label><span className="mb-2 flex justify-between text-xs font-bold uppercase tracking-wider text-slate-500"><span>Progress</span><span>{progressPercent}%</span></span><input type="range" min="0" max="100" step="5" value={progressPercent} onChange={(event) => setProgressPercent(event.target.value)} className="h-12 w-full accent-indigo-600" /></label><button type="button" disabled={sessionBusy} onClick={saveProgress} className={secondaryButton}><Save size={17} />Save</button></div>}</section>

//     <section className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1 xl:grid-rows-3">{[
//       ['Active assignments', counts.active, BriefcaseBusiness, 'bg-indigo-50 text-indigo-700'],
//       ['Pending review', counts.pending, Clock3, 'bg-amber-50 text-amber-700'],
//       ['Completed tasks', counts.done, CheckCircle2, 'bg-emerald-50 text-emerald-700'],
//     ].map(([label, value, Icon, color]) => <article key={label} className={`${cardClass} flex min-h-24 items-center gap-4 p-4`}><span className={`grid size-11 shrink-0 place-items-center rounded-xl ${color}`}><Icon size={20} /></span><div className="min-w-0"><p className="text-sm font-semibold text-slate-500">{label}</p><strong className="mt-1 block text-2xl font-black text-slate-950">{value}</strong></div></article>)}</section>
//     </div>

//     <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
//       <section className={`${cardClass} p-5 sm:p-6`}><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-indigo-600">Getting started</p><h2 className="mt-1 text-xl font-black text-slate-950">Employee checklist</h2></div><span className="text-sm font-bold text-slate-500">{checklist.filter(([, done]) => done).length}/3</span></div><div className="mt-5 space-y-3">{checklist.map(([label, done, path, Icon]) => <Link key={label} to={path} className="flex items-center gap-4 rounded-2xl border border-slate-200 p-4 transition hover:border-indigo-200 hover:bg-indigo-50/40"><span className={`grid size-10 place-items-center rounded-xl ${done ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{done ? <CheckCircle2 size={20} /> : <Icon size={20} />}</span><div className="min-w-0 flex-1"><p className="font-bold text-slate-900">{label}</p><p className="mt-0.5 text-xs text-slate-500">{done ? 'Completed' : 'Action required'}</p></div><span className={`text-xs font-bold ${done ? 'text-emerald-600' : 'text-indigo-600'}`}>{done ? 'Done' : 'Continue'}</span></Link>)}</div></section>
//       {platform.earningsSystemEnabled && <section className={`${cardClass} bg-slate-950 p-6 text-white`}><span className="grid size-12 place-items-center rounded-2xl bg-white/10 text-indigo-300"><Banknote size={23} /></span><p className="mt-6 text-sm font-semibold text-slate-400">Available balance</p><strong className="mt-1 block text-4xl font-black">{money(wallet?.balance)}</strong><div className="mt-5 flex items-center justify-between rounded-2xl bg-white/5 p-4"><span className="text-sm text-slate-400">Pending review</span><b>{money(pendingAmount)}</b></div><Link to="/earnings" className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-white text-sm font-bold text-slate-950 hover:bg-slate-100">View earnings</Link></section>}
//     </div>
//   </>
// }

import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { collection, doc, limit, query, serverTimestamp, updateDoc, where } from 'firebase/firestore'
import { ArrowRight, Banknote, BellRing, BriefcaseBusiness, CheckCircle2, Clock3, Coffee, LoaderCircle, Pause, Play, Save, ShieldCheck, TimerReset, UserRound } from 'lucide-react'
import { db } from '../services/firebase'
import { useAuth } from '../context/AuthContext'
import { usePlatform } from '../context/PlatformContext'
import { useCollection, useDocument } from '../hooks/useFirestore'
import { transitionWorkSession, todayKey } from '../services/employee'
import { Alert, cardClass, inputClass, PageHeader, primaryButton, secondaryButton } from '../components/ui'
import { errorMessage, isKycApproved, money, profileMissing } from '../shared/utils/format'

const DAILY_TARGET_SECONDS = 8 * 3600

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

const STATUS_STYLES = {
  active: {
    label: 'Working',
    icon: 'bg-emerald-100 text-emerald-700',
    pill: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    dot: 'bg-emerald-500',
    bar: 'bg-emerald-500',
    accent: 'from-emerald-400 to-emerald-600',
  },
  on_break: {
    label: 'On break',
    icon: 'bg-amber-100 text-amber-700',
    pill: 'bg-amber-50 text-amber-700 ring-amber-200',
    dot: 'bg-amber-500',
    bar: 'bg-amber-500',
    accent: 'from-amber-400 to-amber-600',
  },
  idle: {
    label: 'Not started',
    icon: 'bg-slate-100 text-slate-600',
    pill: 'bg-slate-100 text-slate-600 ring-slate-200',
    dot: 'bg-slate-400',
    bar: 'bg-indigo-500',
    accent: 'from-slate-300 to-slate-400',
  },
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
  const [, setTick] = useState(0)

  useEffect(() => {
    setProgressNote(session?.progressNote || '')
    setProgressPercent(Number(session?.progressPercent || 0))
  }, [session?.progressNote, session?.progressPercent])

  const status = session?.status || 'idle'
  const theme = STATUS_STYLES[status] || STATUS_STYLES.idle

  // Keep the elapsed timer fresh while the day is running
  useEffect(() => {
    if (status !== 'active') return undefined
    const id = setInterval(() => setTick((value) => value + 1), 30000)
    return () => clearInterval(id)
  }, [status])

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
  const checklistDone = checklist.filter(([, done]) => done).length

  const elapsedSeconds = elapsed(session)
  const targetPercent = Math.min(100, Math.round((elapsedSeconds / DAILY_TARGET_SECONDS) * 100))

  const stats = [
    ['Active assignments', counts.active, BriefcaseBusiness, 'bg-indigo-50 text-indigo-700'],
    ['Pending review', counts.pending, Clock3, 'bg-amber-50 text-amber-700'],
    ['Completed tasks', counts.done, CheckCircle2, 'bg-emerald-50 text-emerald-700'],
  ]

  const sessionAction = async (action) => {
    setSessionBusy(true)
    setSessionError('')
    try {
      await transitionWorkSession(user.uid, action)
    } catch (error) {
      setSessionError(errorMessage(error))
    } finally {
      setSessionBusy(false)
    }
  }

  const saveProgress = async () => {
    if (!session) return
    setSessionBusy(true)
    setSessionError('')
    try {
      await updateDoc(sessionRef, {
        progressNote: progressNote.trim(),
        progressPercent: Math.max(0, Math.min(100, Number(progressPercent))),
        updatedAt: serverTimestamp(),
      })
    } catch (error) {
      setSessionError(errorMessage(error, 'Unable to save today’s progress.'))
    } finally {
      setSessionBusy(false)
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Employee overview"
        title={`Good to see you, ${(profile.fullName || profile.name || 'Employee').split(' ')[0]}`}
        description="Track your day, assignments and earnings from one workspace."
        actions={<Link className={primaryButton} to="/tasks"><BriefcaseBusiness size={18} />Find tasks</Link>}
      />

      {platform.announcement?.trim() && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-50 to-white p-4 text-sm text-indigo-900 shadow-sm">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-indigo-100 text-indigo-600"><BellRing size={18} /></span>
          <p className="self-center leading-6">{platform.announcement}</p>
        </div>
      )}

      {sessionError && <div className="mb-6"><Alert onClose={() => setSessionError('')}>{sessionError}</Alert></div>}

      {/* Session + stats */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(280px,.75fr)] xl:items-stretch">
        <section className={`${cardClass} relative overflow-hidden`}>
          <div className={`h-1.5 w-full bg-gradient-to-r ${theme.accent}`} />
          <div className="p-4 min-[380px]:p-5 sm:p-7">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 items-center gap-3 min-[380px]:gap-4 sm:gap-5">
                <span className={`grid size-14 shrink-0 place-items-center rounded-2xl min-[380px]:size-16 ${theme.icon}`}><Clock3 size={28} /></span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Today’s work session</p>
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ring-inset ${theme.pill}`}>
                      <span className={`size-1.5 rounded-full ${theme.dot} ${status === 'active' ? 'animate-pulse' : ''}`} />
                      {theme.label}
                    </span>
                  </div>
                  <h2 className="mt-1.5 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">{duration(elapsedSeconds)}</h2>
                  <p className="mt-1 text-sm text-slate-500">of 08h 00m daily target</p>
                </div>
              </div>

              <div className="flex flex-col gap-2.5 min-[400px]:flex-row min-[400px]:flex-wrap [&>*]:w-full min-[400px]:[&>*]:w-auto">
                {status === 'idle' && (
                  <button disabled={sessionBusy} onClick={() => sessionAction('start_day')} className={primaryButton}>
                    {sessionBusy ? <LoaderCircle className="animate-spin" size={18} /> : <Play size={18} />}Start day
                  </button>
                )}
                {status === 'active' && (
                  <>
                    <button disabled={sessionBusy} onClick={() => sessionAction('start_break')} className={secondaryButton}><Coffee size={18} />Start break</button>
                    <button disabled={sessionBusy} onClick={() => sessionAction('end_day')} className={primaryButton}><Pause size={18} />End day</button>
                  </>
                )}
                {status === 'on_break' && (
                  <>
                    <button disabled={sessionBusy} onClick={() => sessionAction('resume_work')} className={primaryButton}><Play size={18} />Resume work</button>
                    <button disabled={sessionBusy} onClick={() => sessionAction('end_day')} className={secondaryButton}><TimerReset size={18} />End day</button>
                  </>
                )}
              </div>
            </div>

            {/* Target progress */}
            <div className="mt-6">
              <div className="mb-2 flex items-center justify-between text-xs font-bold text-slate-500">
                <span className="uppercase tracking-wider">Daily target</span>
                <span className="text-slate-700">{targetPercent}%</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div className={`h-full rounded-full transition-all duration-500 ${theme.bar}`} style={{ width: `${targetPercent}%` }} />
              </div>
            </div>

            {session && (
              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
                <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_220px_auto] lg:items-end">
                  <label>
                    <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Today’s progress note</span>
                    <input value={progressNote} onChange={(event) => setProgressNote(event.target.value)} className={inputClass} placeholder="What did you complete today?" />
                  </label>
                  <label>
                    <span className="mb-2 flex justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
                      <span>Progress</span>
                      <span className="text-indigo-600">{progressPercent}%</span>
                    </span>
                    <input type="range" min="0" max="100" step="5" value={progressPercent} onChange={(event) => setProgressPercent(event.target.value)} className="h-12 w-full accent-indigo-600" />
                  </label>
                  <button type="button" disabled={sessionBusy} onClick={saveProgress} className={secondaryButton}>
                    <Save size={17} />Save
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1 xl:grid-rows-3">
          {stats.map(([label, value, Icon, color]) => (
            <article key={label} className={`${cardClass} group flex min-h-28 items-center gap-4 p-5 transition hover:-translate-y-0.5 hover:shadow-md`}>
              <span className={`grid size-12 shrink-0 place-items-center rounded-2xl ${color}`}><Icon size={22} /></span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-500">{label}</p>
                <strong className="mt-0.5 block text-3xl font-black tracking-tight text-slate-950">{value}</strong>
              </div>
            </article>
          ))}
        </section>
      </div>

      {/* Checklist + wallet */}
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
          <section className={`${cardClass} p-4 min-[380px]:p-5 sm:p-7`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">Getting started</p>
              <h2 className="mt-1 text-xl font-black text-slate-950">Employee checklist</h2>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-600">{checklistDone}/{checklist.length}</span>
          </div>

          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-500" style={{ width: `${(checklistDone / checklist.length) * 100}%` }} />
          </div>

          <div className="mt-5 space-y-3">
            {checklist.map(([label, done, path, Icon]) => (
              <Link
                key={label}
                to={path}
                className={`group flex min-w-0 items-center gap-3 rounded-2xl border p-3 min-[380px]:gap-4 min-[380px]:p-4 ${done ? 'border-emerald-100 bg-emerald-50/40' : 'border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/40'} transition`}
              >
                <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${done ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-600'}`}>
                  {done ? <CheckCircle2 size={20} /> : <Icon size={20} />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-900">{label}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{done ? 'Completed' : 'Action required'}</p>
                </div>
                {done
                  ? <span className="shrink-0 text-xs font-bold text-emerald-600">Done</span>
                  : <span className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-indigo-600"><span className="hidden min-[380px]:inline">Continue</span><ArrowRight size={14} className="transition group-hover:translate-x-0.5" /></span>}
              </Link>
            ))}
          </div>
        </section>

        {platform.earningsSystemEnabled && (
          <section className={`${cardClass} relative overflow-hidden bg-slate-950 p-5 text-white sm:p-7`}>
            <div className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-indigo-500/25 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-10 size-48 rounded-full bg-emerald-500/10 blur-3xl" />
            <div className="relative flex h-full flex-col">
              <span className="grid size-12 place-items-center rounded-2xl bg-white/10 text-indigo-300 ring-1 ring-white/10"><Banknote size={23} /></span>
              <p className="mt-6 text-sm font-semibold text-slate-400">Available balance</p>
              <strong className="mt-1 block break-words text-3xl font-black tracking-tight min-[380px]:text-4xl sm:text-5xl">{money(wallet?.balance)}</strong>
              <div className="mt-6 flex flex-col gap-2 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10 min-[380px]:flex-row min-[380px]:items-center min-[380px]:justify-between">
                <span className="flex items-center gap-2 text-sm text-slate-400"><span className="size-2 rounded-full bg-amber-400" />Pending review</span>
                <b className="text-amber-300">{money(pendingAmount)}</b>
              </div>
              <Link to="/earnings" className="mt-auto inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-white pt-0 text-sm font-bold text-slate-950 transition hover:bg-slate-100" style={{ marginTop: '1.25rem' }}>
                View earnings<ArrowRight size={16} />
              </Link>
            </div>
          </section>
        )}
      </div>
    </>
  )
}
