import { useMemo, useState } from 'react'
import { collection, limit, query, where } from 'firebase/firestore'
import { ChevronDown, ChevronUp, History } from 'lucide-react'
import { db } from '../services/firebase'
import { useAuth } from '../context/AuthContext'
import { usePlatform } from '../context/PlatformContext'
import { useCollection } from '../hooks/useFirestore'
import { EmptyState, PageHeader, StatusPill, cardClass } from '../components/ui'
import { dateValue, formatDate, money, normalizeStatus } from '../shared/utils/format'

const terminal = new Set(['completed', 'rejected', 'revoked', 'cancelled', 'out_of_tat', 'expired', 'approved'])

export default function TaskHistory() {
  const { user } = useAuth()
  const platform = usePlatform()
  const [expanded, setExpanded] = useState(new Set())
  const historyQuery = useMemo(() => query(collection(db, 'task_assignments'), where('userId', '==', user.uid), limit(200)), [user.uid])
  const { data, loading } = useCollection(historyQuery)
  const groups = useMemo(() => {
    const result = new Map()
    data.filter((item) => terminal.has(normalizeStatus(item.status)) || (dateValue(item.tatDeadline) && dateValue(item.tatDeadline) < new Date())).sort((a, b) => (dateValue(b.assignedAt || b.acceptedAt)?.getTime() || 0) - (dateValue(a.assignedAt || a.acceptedAt)?.getTime() || 0)).forEach((item) => {
      const label = formatDate(item.assignedAt || item.acceptedAt)
      result.set(label, [...(result.get(label) || []), item])
    })
    return [...result.entries()]
  }, [data])

  const toggle = (label) => setExpanded((current) => { const next = new Set(current); if (next.has(label)) next.delete(label); else next.add(label); return next })
  return <><PageHeader eyebrow="Work record" title="Task history" description="Review completed, expired, revoked and reviewed assignments." />{!loading && groups.length === 0 ? <EmptyState icon={History} title="No history yet" description="Completed assignments will appear here." /> : <div className="space-y-4">{groups.map(([label, items]) => { const open = expanded.has(label); const earned = items.filter((item) => ['completed', 'approved'].includes(normalizeStatus(item.status))).reduce((sum, item) => sum + Number(item.payout || 0), 0); return <section key={label} className={`${cardClass} overflow-hidden`}><button type="button" onClick={() => toggle(label)} className="flex w-full items-center gap-4 p-5 text-left hover:bg-slate-50"><div className="min-w-0 flex-1"><h2 className="font-black text-slate-950">{label}</h2><p className="mt-1 text-xs text-slate-500">{items.length} task{items.length === 1 ? '' : 's'}{platform.earningsSystemEnabled ? ` · ${money(earned)} earned` : ''}</p></div>{open ? <ChevronUp size={20} /> : <ChevronDown size={20} />}</button>{open && <div className="border-t border-slate-200">{items.map((item) => <article key={item.id} className="flex flex-col gap-3 border-b border-slate-100 p-5 last:border-0 sm:flex-row sm:items-center"><div className="min-w-0 flex-1"><p className="text-xs font-bold uppercase tracking-wider text-indigo-600">{item.taskCode || item.clientName || 'Task'}</p><h3 className="mt-1 font-bold text-slate-900">{item.title || item.taskTitle || 'Employee task'}</h3><p className="mt-1 text-xs text-slate-500">{Number(item.leadsProcessed || 0)} leads processed</p></div><div className="flex items-center gap-3"><StatusPill status={item.status} />{platform.earningsSystemEnabled && <strong className="text-sm text-slate-900">{money(item.payout)}</strong>}</div></article>)}</div>}</section> } )}</div>}</>
}
