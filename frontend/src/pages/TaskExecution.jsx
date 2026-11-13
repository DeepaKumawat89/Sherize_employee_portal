import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { collection, doc, getDoc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore'
import { Ban, CalendarClock, CheckCircle2, Clock3, FileText, LoaderCircle, PhoneCall, PhoneForwarded, PhoneMissed, PhoneOff, RefreshCw, ThumbsDown, ThumbsUp } from 'lucide-react'
import { auth, db } from '../services/firebase'
import { callEmployeeApi, callExistingFunction } from '../services/employee'
import { useDocument } from '../hooks/useFirestore'
import { Alert, cardClass, PageHeader, primaryButton, secondaryButton, StatusPill, inputClass } from '../components/ui'
import { errorMessage, formatDateTime } from '../shared/utils/format'

const outcomes = [
  ['interested', 'Interested', ThumbsUp],
  ['not_interested', 'Not interested', ThumbsDown],
  ['callback', 'Callback', PhoneForwarded],
  ['no_answer', 'No answer', PhoneMissed],
  ['wrong_number', 'Wrong number', Ban],
]

export default function TaskExecution() {
  const { assignmentId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const assignmentRef = useMemo(() => doc(db, 'task_assignments', assignmentId), [assignmentId])
  const { data: liveAssignment, loading: assignmentLoading, error: assignmentError } = useDocument(assignmentRef)
  const assignment = liveAssignment || location.state?.assignment
  const [task, setTask] = useState(null)
  const [progress, setProgress] = useState(null)
  const [guidance, setGuidance] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [outcome, setOutcome] = useState('')
  const [notes, setNotes] = useState('')
  const [requeueAt, setRequeueAt] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [call, setCall] = useState({ id: '', sid: '', seconds: 0, active: false, connecting: false, ended: false })
  const callTimer = useRef(null)
  const callUnsubscribe = useRef(null)

  const fetchProgress = useCallback(async () => {
    callUnsubscribe.current?.()
    callUnsubscribe.current = null
    window.clearInterval(callTimer.current)
    const response = await callExistingFunction('getTaskAssignmentProgress', { assignmentId, claimLead: true })
    if (response.data?.taskId && assignment?.taskId && response.data.taskId !== assignment.taskId) {
      throw new Error('This assignment belongs to a different task.')
    }
    setProgress(response.data)
    setOutcome('')
    setNotes('')
    setRequeueAt('')
    setSubmitted(false)
    setCall({ id: '', sid: '', seconds: 0, active: false, connecting: false, ended: false })
  }, [assignment?.taskId, assignmentId])

  useEffect(() => {
    let active = true
    async function initialize() {
      if (!assignment?.taskId) return
      setLoading(true)
      setError('')
      try {
        const taskSnapshot = await getDoc(doc(db, 'tasks', assignment.taskId))
        if (!taskSnapshot.exists()) throw new Error('This task is no longer available.')
        const taskData = { id: taskSnapshot.id, ...taskSnapshot.data() }
        const seen = new Set()
        const sections = [['INSTRUCTIONS', taskData.instructions], ['DESCRIPTION', taskData.description], ['CALL SCRIPT', taskData.script || assignment.script]].filter(([, value]) => typeof value === 'string' && value.trim() && !seen.has(value.trim()) && seen.add(value.trim()))
        if (active) { setTask(taskData); setGuidance(sections); await fetchProgress() }
      } catch (nextError) { if (active) setError(errorMessage(nextError, 'Unable to open this assignment.')) } finally { if (active) setLoading(false) }
    }
    initialize()
    return () => { active = false }
  }, [assignment?.taskId, assignment?.script, assignmentId, fetchProgress])

  useEffect(() => () => {
    window.clearInterval(callTimer.current)
    callUnsubscribe.current?.()
  }, [])

  const startTimer = () => {
    window.clearInterval(callTimer.current)
    callTimer.current = window.setInterval(() => setCall((current) => ({ ...current, seconds: current.seconds + 1 })), 1000)
  }

  const applyCallUpdate = (data = {}) => {
    const accepted = Boolean(String(data.exotelCallSid || '').trim())
    const terminal = ['completed', 'failed'].includes(String(data.status || '').toLowerCase())
    setCall((current) => ({ ...current, sid: data.exotelCallSid || current.sid, seconds: Math.max(current.seconds, Number(data.duration || 0)), connecting: !accepted && !terminal, active: accepted && !terminal, ended: terminal }))
    if (terminal) window.clearInterval(callTimer.current)
    else if (accepted) startTimer()
  }

  const startCall = async () => {
    const lead = progress?.lead
    if (!lead?.phone || !auth.currentUser) return
    setCall((current) => ({ ...current, connecting: true, ended: false }))
    try {
      const reference = doc(collection(db, 'calls'))
      await setDoc(reference, { callId: reference.id, taskId: assignment.taskId, assignmentId, userId: auth.currentUser.uid, leadId: lead.id, customerPhone: lead.phone, status: 'initiated', recordingUrl: null, exotelCallSid: null, duration: 0, startedAt: serverTimestamp(), endedAt: null })
      setCall((current) => ({ ...current, id: reference.id }))
      callUnsubscribe.current?.()
      callUnsubscribe.current = onSnapshot(reference, (snapshot) => applyCallUpdate(snapshot.data()))
      const result = await callEmployeeApi('start-call', { callId: reference.id, userId: auth.currentUser.uid, taskId: assignment.taskId, assignmentId, leadId: lead.id, customerPhone: lead.phone })
      setCall((current) => ({ ...current, sid: result.callSid || current.sid, connecting: false, active: !current.ended }))
      startTimer()
    } catch (nextError) {
      setError(errorMessage(nextError, 'Failed to connect the call.'))
      setCall((current) => ({ ...current, connecting: false }))
      callUnsubscribe.current?.()
      callUnsubscribe.current = null
    }
  }

  const endCall = async () => {
    window.clearInterval(callTimer.current)
    setCall((current) => ({ ...current, active: false }))
    if (call.id && auth.currentUser) callEmployeeApi('end-call', { callId: call.id, userId: auth.currentUser.uid }).catch(() => {})
  }

  const submit = async () => {
    setError('')
    if (!outcome) { setError('Select a call outcome.'); return }
    const requeue = ['callback', 'no_answer'].includes(outcome)
    const requeueDate = requeueAt ? new Date(requeueAt) : null
    if (requeue && (!requeueDate || requeueDate < new Date(Date.now() + 60000))) { setError('Set a retry time at least one minute from now.'); return }
    if (call.seconds < 5 && !['no_answer', 'wrong_number'].includes(outcome)) { setError('A minimum five-second call duration is required.'); return }
    setSubmitting(true)
    try {
      const response = await callExistingFunction('submitTaskWork', { taskId: assignment.taskId, assignmentId, leadId: progress.lead.id, outcome, ...(requeueDate ? { requeueAt: requeueDate.getTime() } : {}), notes: notes.trim(), callDuration: call.seconds, callSid: call.sid || null, callId: call.id || null, workerName: auth.currentUser.displayName || auth.currentUser.email || 'Unknown Employee' })
      setProgress((current) => ({ ...current, leadsProcessed: Number(response.data?.leadsProcessed || current.leadsProcessed) }))
      setSubmitted(true)
    } catch (nextError) { setError(errorMessage(nextError, 'Failed to submit this lead.')) } finally { setSubmitting(false) }
  }

  const seconds = `${String(Math.floor(call.seconds / 60)).padStart(2, '0')}:${String(call.seconds % 60).padStart(2, '0')}`
  const deadline = progress?.tatDeadline ? new Date(Number(progress.tatDeadline)) : null
  const overdue = deadline && deadline < new Date()
  const lead = progress?.lead
  if (assignmentLoading || loading) return <div className="grid min-h-96 place-items-center"><LoaderCircle className="animate-spin text-indigo-600" size={30} /></div>
  if (assignmentError || !assignment) return <Alert>{errorMessage(assignmentError, 'Assignment not found.')}</Alert>

  return <>
    <PageHeader eyebrow={task?.taskCode || 'Active assignment'} title={task?.title || assignment.title || 'Task execution'} description={`${task?.clientName || assignment.clientName || 'Sherize campaign'} · ${Number(progress?.leadsProcessed || 0)}/${Number(progress?.totalLeads || assignment.totalLeads || 0)} leads processed`} actions={<><StatusPill status={progress?.status || assignment.status} /><button className={secondaryButton} onClick={() => navigate('/tasks')}>Back to tasks</button></>} />
    {error && <div className="mb-5"><Alert onClose={() => setError('')}>{error}</Alert></div>}{overdue && <div className="mb-5"><Alert>This assignment has exceeded its TAT and can no longer accept work.</Alert></div>}
    {!lead ? <div className={`${cardClass} p-10 text-center`}><CheckCircle2 className="mx-auto text-emerald-600" size={42} /><h2 className="mt-4 text-xl font-black text-slate-950">All available leads processed</h2><p className="mt-2 text-sm text-slate-500">There are no more leads available for this assignment.</p></div> : submitted ? <div className={`${cardClass} p-10 text-center`}><CheckCircle2 className="mx-auto text-emerald-600" size={46} /><h2 className="mt-4 text-xl font-black text-slate-950">Lead submitted</h2><p className="mt-2 text-sm text-slate-500">The outcome was saved securely for review.</p><button type="button" onClick={fetchProgress} className={`${primaryButton} mt-6`}><RefreshCw size={18} />Next lead</button></div> : <div className="grid gap-6 xl:grid-cols-[.9fr_1.1fr]">
      <div className="space-y-5"><section className={`${cardClass} p-5 sm:p-6`}><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wider text-indigo-600">Current lead</p><h2 className="mt-2 text-xl font-black text-slate-950">{lead.name || 'Unknown customer'}</h2><p className="mt-1 text-sm text-slate-500">{String(lead.phone || '').replace(/(\d{2})\d+(\d{2})/, '$1••••••$2')}</p></div>{lead.isRequeued && <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700"><RefreshCw size={13} />Retry #{lead.requeueCount || 1}</span>}</div>{deadline && <p className="mt-5 flex items-center gap-2 rounded-xl bg-slate-50 p-3 text-xs font-semibold text-slate-600"><Clock3 size={15} />TAT deadline: {formatDateTime(deadline)}</p>}</section>{guidance.map(([title, text]) => <section key={title} className={`${cardClass} p-5 sm:p-6`}><p className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-indigo-600"><FileText size={16} />{title}</p><p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-700">{text}</p></section>)}</div>
      <div className="space-y-5"><section className={`${cardClass} p-5 sm:p-6`}><div className="text-center"><PhoneCall className={`mx-auto ${call.active ? 'text-emerald-600' : 'text-slate-400'}`} size={30} /><p className="mt-3 font-mono text-4xl font-black tracking-tight text-slate-950">{seconds}</p><p className="mt-1 text-xs font-semibold text-slate-400">{call.connecting ? 'Connecting through Exotel…' : call.active ? 'Call in progress' : call.ended ? 'Call ended' : 'Ready to call'}</p></div><div className="mt-6">{call.active ? <button type="button" onClick={endCall} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 text-sm font-bold text-white hover:bg-rose-700"><PhoneOff size={18} />End call</button> : <button type="button" onClick={startCall} disabled={call.connecting || overdue} className={`${primaryButton} w-full`}>{call.connecting ? <LoaderCircle className="animate-spin" size={18} /> : <PhoneCall size={18} />}Connect via Exotel</button>}</div></section>
        <section className={`${cardClass} p-5 sm:p-6`}><h2 className="font-black text-slate-950">Call outcome</h2><div className="mt-4 flex flex-wrap gap-2">{outcomes.map(([value, label, Icon]) => <button type="button" key={value} onClick={() => { setOutcome(value); if (!['callback', 'no_answer'].includes(value)) setRequeueAt('') }} className={`inline-flex min-h-10 items-center gap-2 rounded-xl border px-3 text-xs font-bold transition ${outcome === value ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}><Icon size={15} />{label}</button>)}</div>{['callback', 'no_answer'].includes(outcome) && <label className="mt-5 block"><span className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-700"><CalendarClock size={17} />Retry date and time</span><input type="datetime-local" min={new Date(Date.now() + 60000).toISOString().slice(0, 16)} value={requeueAt} onChange={(event) => setRequeueAt(event.target.value)} className={inputClass} /><span className="mt-2 block text-xs leading-5 text-slate-500">Only this lead returns for retry under the same task.</span></label>}<label className="mt-5 block"><span className="mb-2 block text-sm font-bold text-slate-700">Call notes (optional)</span><textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={4} className={`${inputClass} resize-y py-3`} placeholder="Record useful details from the conversation…" /></label><button type="button" onClick={submit} disabled={submitting || overdue} className={`${primaryButton} mt-5 w-full`}>{submitting ? <LoaderCircle className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}Submit lead outcome</button></section>
      </div>
    </div>}
  </>
}
