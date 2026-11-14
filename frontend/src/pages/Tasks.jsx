import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, doc, getDoc, limit, query, where } from 'firebase/firestore'
import { ArrowRight, BriefcaseBusiness, CheckCircle2, Clock3, IndianRupee, LoaderCircle, Search, ShieldAlert, Target, UsersRound } from 'lucide-react'
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
  const percent = total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0

  return (
    <article className={`${cardClass} group relative flex flex-col overflow-hidden transition duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-100/60`}>
      <div className="h-1 w-full bg-gradient-to-r from-indigo-500 to-indigo-300" />

      <div className="flex min-w-0 flex-1 flex-col p-4 min-[380px]:p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <span className="grid size-12 place-items-center rounded-2xl bg-indigo-50 text-indigo-600 transition group-hover:bg-indigo-600 group-hover:text-white">
            <BriefcaseBusiness size={22} />
          </span>
          <StatusPill status={assigned ? item.status : 'available'} />
        </div>

        <p className="mt-5 text-xs font-black uppercase tracking-wider text-indigo-600">{item.taskCode || item.clientName || 'Sherize campaign'}</p>
        <h3 className="mt-1 text-lg font-black leading-snug text-slate-950">{item.title || 'Employee task'}</h3>
        {item.description && <p className="mt-2.5 line-clamp-3 text-sm leading-6 text-slate-500">{item.description}</p>}

        <dl className={`mt-5 grid gap-3 text-sm ${earningsEnabled ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {earningsEnabled && (
            <div className="rounded-2xl bg-emerald-50 p-3.5 ring-1 ring-inset ring-emerald-100">
              <dt className="text-xs font-semibold text-emerald-700/70">Payout</dt>
              <dd className="mt-1 flex items-center gap-0.5 text-base font-black text-emerald-700"><IndianRupee size={15} />{money(payout).replace('₹', '')}</dd>
            </div>
          )}
          <div className="rounded-2xl bg-slate-50 p-3.5 ring-1 ring-inset ring-slate-100">
            <dt className="flex items-center gap-1.5 text-xs font-semibold text-slate-400"><Target size={12} />{assigned ? 'Progress' : 'Open slots'}</dt>
            <dd className="mt-1 text-base font-black text-slate-900">{assigned ? `${completed}/${total || '—'}` : slots}<span className="ml-1 text-xs font-semibold text-slate-400">{assigned ? 'leads' : 'available'}</span></dd>
          </div>
        </dl>

        {assigned && total > 0 && (
          <div className="mt-4">
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div className={`h-full rounded-full transition-all duration-500 ${percent >= 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`} style={{ width: `${percent}%` }} />
            </div>
            <p className="mt-1.5 text-right text-xs font-bold text-slate-500">{percent}% complete</p>
          </div>
        )}

        <div className="mt-auto pt-5">
          {item.tatDeadline && (
            <p className="mb-4 flex min-w-0 items-start gap-2 break-words rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold leading-5 text-amber-800 ring-1 ring-inset ring-amber-100">
              <Clock3 size={15} className="shrink-0" />TAT {formatDateTime(item.tatDeadline)}
            </p>
          )}
          <button type="button" onClick={() => onAction(item)} disabled={busy} className={`${assigned ? primaryButton : secondaryButton} w-full`}>
            {busy
              ? <LoaderCircle className="animate-spin" size={18} />
              : assigned
                ? <><CheckCircle2 size={18} />Open assignment<ArrowRight size={16} /></>
                : <><UsersRound size={18} />Accept task</>}
          </button>
        </div>
      </div>
    </article>
  )
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

  const assignedSource = assignments.filter(assignmentIsActive)
  const marketplaceSource = marketplace.filter((item) => item.distributionMode !== 'individual' && Number(item.acceptedCount || 0) < Number(item.totalSlots || item.maxSlots || 1))
  const source = tab === 'assigned' ? assignedSource : marketplaceSource
  const items = source.filter((item) => [item.taskCode, item.title, item.clientName].join(' ').toLowerCase().includes(search.trim().toLowerCase()))
  const loading = tab === 'assigned' ? assignmentsLoading : marketplaceLoading
  const queryError = tab === 'assigned' ? assignmentsError : marketplaceError

  const tabs = [
    ['assigned', 'My assignments', assignedSource.length],
    ['marketplace', 'Marketplace', marketplaceSource.length],
  ]

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

  return (
    <>
      <PageHeader
        eyebrow="Employee operations"
        title="Tasks"
        description="Work on assigned campaigns or accept available marketplace tasks."
        actions={<button type="button" onClick={() => navigate('/task-history')} className={secondaryButton}><Clock3 size={18} />Task history</button>}
      />

      <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-2.5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="grid w-full grid-cols-2 rounded-xl bg-slate-100 p-1 sm:inline-flex sm:w-auto">
          {tabs.map(([value, label, count]) => (
            <button
              key={value}
              type="button"
              onClick={() => setTab(value)}
              className={`flex min-w-0 items-center justify-center gap-1.5 rounded-lg px-2 py-2.5 text-xs font-bold transition min-[380px]:gap-2 min-[380px]:px-3 min-[380px]:text-sm ${tab === value ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {label}
              <span className={`grid min-w-6 place-items-center rounded-full px-1.5 py-0.5 text-xs font-black ${tab === value ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-200 text-slate-500'}`}>{count}</span>
            </button>
          ))}
        </div>
        <label className="relative block w-full sm:max-w-xs">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input value={search} onChange={(event) => setSearch(event.target.value)} className={`${inputClass} pl-10`} placeholder="Search task or code" />
        </label>
      </div>

      {notice && <div className="mb-5"><Alert type="success" onClose={() => setNotice('')}>{notice}</Alert></div>}
      {error && <div className="mb-5"><Alert onClose={() => setError('')}>{error}</Alert></div>}
      {queryError && <div className="mb-5"><Alert>{errorMessage(queryError, 'Unable to load tasks.')}</Alert></div>}

      {loading ? (
        <div className="grid min-h-64 place-items-center"><LoaderCircle className="animate-spin text-indigo-600" size={28} /></div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={tab === 'assigned' ? BriefcaseBusiness : ShieldAlert}
          title={tab === 'assigned' ? 'No active assignments' : 'No marketplace tasks'}
          description={tab === 'assigned' ? 'Accept a marketplace task or wait for an assignment from your team leader.' : 'New opportunities will appear here when they are published.'}
          action={tab === 'assigned' && <button className={primaryButton} onClick={() => setTab('marketplace')}>Browse marketplace</button>}
        />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
          {items.map((item) => (
            <TaskCard
              key={item.id}
              item={item}
              assigned={tab === 'assigned'}
              busy={busy === item.id}
              onAction={tab === 'assigned' ? openAssignment : acceptTask}
              earningsEnabled={platform.earningsSystemEnabled}
            />
          ))}
        </div>
      )}
    </>
  )
}
