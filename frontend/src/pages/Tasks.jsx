import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, doc, getDoc, limit, query, where } from 'firebase/firestore'
import { BriefcaseBusiness, CheckCircle2, Clock3, IndianRupee, LoaderCircle, Search, ShieldAlert, UsersRound } from 'lucide-react'
import { db } from '../services/firebase'
import { useAuth } from '../context/AuthContext'
import { usePlatform } from '../context/PlatformContext'
import { useCollection } from '../hooks/useFirestore'
import { callExistingFunction } from '../services/employee'
import { Alert, cardClass, EmptyState, inputClass, PageHeader, primaryButton, secondaryButton, StatusPill } from '../components/ui'
import { dateValue, errorMessage, formatDateTime, isKycApproved, money, normalizeStatus } from '../shared/utils/format'

const activeStatuses = ['active', 'in_progress', 'accepted', 'pending', 'assigned', 'pending_admin_review']
const terminalStatuses = new Set(['completed', 'rejected', 'revoked', 'cancelled', 'out_of_tat', 'expired', 'approved'])

function assignmentIsActive(item) {
  const status = normalizeStatus(item.status, 'active')
  if (terminalStatuses.has(status) || status === 'out_of_tat_processing') return false
  const deadline = dateValue(item.tatDeadline)
  return !deadline || deadline > new Date()
}

function TaskCard({ item, assigned = false, onAction, busy, earningsEnabled }) {
  const total = Number(item.totalLeads || item.totalVolume || 0)
  const completed = Number(item.leadsProcessed || item.completedLeads || 0)
  const payout = Number(item.payout || item.payoutPerUnit || 0)
  const slots = Math.max(0, Number(item.totalSlots || item.maxSlots || 1) - Number(item.acceptedCount || 0))
  return <article className={`${cardClass} flex flex-col p-5 sm:p-6`}>
    <div className="flex items-start justify-between gap-3"><span className="grid size-11 place-items-center rounded-xl bg-indigo-50 text-indigo-600"><BriefcaseBusiness size={21} /></span><StatusPill status={assigned ? item.status : 'available'} /></div>
    <p className="mt-5 text-xs font-black uppercase tracking-wider text-indigo-600">{item.taskCode || item.clientName || 'Sherize campaign'}</p><h3 className="mt-1 text-lg font-black text-slate-950">{item.title || 'Employee task'}</h3>{item.description && <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-500">{item.description}</p>}
    <dl className={`mt-5 grid gap-3 text-sm ${earningsEnabled ? 'grid-cols-2' : 'grid-cols-1'}`}>{earningsEnabled && <div className="rounded-xl bg-slate-50 p-3"><dt className="text-xs text-slate-400">Payout</dt><dd className="mt-1 flex items-center gap-1 font-bold text-slate-900"><IndianRupee size={14} />{money(payout).replace('₹', '')}</dd></div>}<div className="rounded-xl bg-slate-50 p-3"><dt className="text-xs text-slate-400">{assigned ? 'Progress' : 'Open slots'}</dt><dd className="mt-1 font-bold text-slate-900">{assigned ? `${completed}/${total || '—'} leads` : `${slots} available`}</dd></div></dl>
    {item.tatDeadline && <p className="mt-4 flex items-center gap-2 text-xs font-semibold text-slate-500"><Clock3 size={15} />TAT {formatDateTime(item.tatDeadline)}</p>}
    <button type="button" onClick={() => onAction(item)} disabled={busy} className={`${assigned ? primaryButton : secondaryButton} mt-5 w-full`}>{busy ? <LoaderCircle className="animate-spin" size={18} /> : assigned ? <><CheckCircle2 size={18} />Open assignment</> : <><UsersRound size={18} />Accept task</>}</button>
  </article>
}

export default function Tasks() {
  const { user, profile } = useAuth()
  const platform = usePlatform()
  const navigate = useNavigate()
  const [tab, setTab] = useState('assigned')
  const [search, setSearch] = useState('')
  const [busy, setBusy] = useState('')
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const assignedQuery = useMemo(() => query(collection(db, 'task_assignments'), where('userId', '==', user.uid), where('status', 'in', activeStatuses), limit(100)), [user.uid])
  const marketplaceQuery = useMemo(() => query(collection(db, 'tasks'), where('status', '==', 'active'), where('remainingSlots', '>', 0), where('totalLeads', '>', 0), limit(50)), [])
  const { data: assignments, loading: assignmentsLoading, error: assignmentsError } = useCollection(assignedQuery)
  const { data: marketplace, loading: marketplaceLoading, error: marketplaceError } = useCollection(marketplaceQuery)
  const source = tab === 'assigned' ? assignments.filter(assignmentIsActive) : marketplace.filter((item) => item.distributionMode !== 'individual' && Number(item.acceptedCount || 0) < Number(item.totalSlots || item.maxSlots || 1))
  const items = source.filter((item) => [item.taskCode, item.title, item.clientName].join(' ').toLowerCase().includes(search.trim().toLowerCase()))
  const loading = tab === 'assigned' ? assignmentsLoading : marketplaceLoading
  const queryError = tab === 'assigned' ? assignmentsError : marketplaceError

  const openAssignment = (assignment) => navigate(`/tasks/${assignment.id}`, { state: { assignment } })
  const acceptTask = async (task) => {
    setError('')
    setNotice('')
    if (!isKycApproved(profile)) {
      setError('You need approved KYC before accepting tasks. Complete verification to unlock work.')
      return
    }
    setBusy(task.id)
    try {
      const latestProfile = await getDoc(doc(db, 'users', user.uid))
      if (!isKycApproved(latestProfile.data() || {})) throw new Error('Your KYC must be approved before you can accept tasks.')
      const result = await callExistingFunction('acceptMarketplaceTask', { taskId: task.id })
      setNotice(`Task accepted successfully. ${Number(result.data?.acceptedCount || 0)} slot(s) accepted.`)
      setTab('assigned')
    } catch (nextError) {
      setError(errorMessage(nextError, 'This task could not be accepted.'))
    } finally {
      setBusy('')
    }
  }

  return <>
    <PageHeader eyebrow="Employee operations" title="Tasks" description="Work on assigned campaigns or accept available marketplace tasks." actions={<button type="button" onClick={() => navigate('/task-history')} className={secondaryButton}><Clock3 size={18} />Task history</button>} />
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="inline-flex rounded-2xl bg-slate-200/70 p-1">{[['assigned', 'My assignments'], ['marketplace', 'Marketplace']].map(([value, label]) => <button key={value} type="button" onClick={() => setTab(value)} className={`rounded-xl px-4 py-2.5 text-sm font-bold transition ${tab === value ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}>{label}</button>)}</div><label className="relative block w-full sm:max-w-xs"><Search className="absolute left-3.5 top-3.5 text-slate-400" size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} className={`${inputClass} pl-10`} placeholder="Search task or code" /></label></div>
    {notice && <div className="mb-5"><Alert type="success" onClose={() => setNotice('')}>{notice}</Alert></div>}{error && <div className="mb-5"><Alert onClose={() => setError('')}>{error}</Alert></div>}{queryError && <div className="mb-5"><Alert>{errorMessage(queryError, 'Unable to load tasks.')}</Alert></div>}
    {loading ? <div className="grid min-h-64 place-items-center"><LoaderCircle className="animate-spin text-indigo-600" size={28} /></div> : items.length === 0 ? <EmptyState icon={tab === 'assigned' ? BriefcaseBusiness : ShieldAlert} title={tab === 'assigned' ? 'No active assignments' : 'No marketplace tasks'} description={tab === 'assigned' ? 'Accept a marketplace task or wait for an assignment from your team leader.' : 'New opportunities will appear here when they are published.'} action={tab === 'assigned' && <button className={primaryButton} onClick={() => setTab('marketplace')}>Browse marketplace</button>} /> : <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">{items.map((item) => <TaskCard key={item.id} item={item} assigned={tab === 'assigned'} busy={busy === item.id} onAction={tab === 'assigned' ? openAssignment : acceptTask} earningsEnabled={platform.earningsSystemEnabled} />)}</div>}
  </>
}
