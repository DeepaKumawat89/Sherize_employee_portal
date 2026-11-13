import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, doc, getDocs, limit, orderBy, query, updateDoc, where, writeBatch } from 'firebase/firestore'
import { Bell, BellRing, CheckCheck, LoaderCircle } from 'lucide-react'
import { db } from '../services/firebase'
import { useAuth } from '../context/AuthContext'
import { useCollection } from '../hooks/useFirestore'
import { EmptyState, PageHeader, secondaryButton, cardClass } from '../components/ui'
import { errorMessage, formatDateTime } from '../shared/utils/format'

export default function Notifications() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const notificationQuery = useMemo(() => query(collection(db, 'notifications'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'), limit(50)), [user.uid])
  const { data, loading, error } = useCollection(notificationQuery)
  const open = async (item) => { if (!item.read) await updateDoc(doc(db, 'notifications', item.id), { read: true }).catch(() => {}); if (item.relatedTaskId) navigate('/tasks'); else navigate('/notifications') }
  const markAll = async () => { setBusy(true); try { const unread = await getDocs(query(collection(db, 'notifications'), where('userId', '==', user.uid), where('read', '==', false))); const batch = writeBatch(db); unread.forEach((snapshot) => batch.update(snapshot.ref, { read: true })); await batch.commit() } finally { setBusy(false) } }
  return <><PageHeader eyebrow="Employee updates" title="Notifications" description="Task, review, payment and account updates from Sherize." actions={<button type="button" onClick={markAll} disabled={busy || !data.some((item) => !item.read)} className={secondaryButton}>{busy ? <LoaderCircle className="animate-spin" size={18} /> : <CheckCheck size={18} />}Mark all read</button>} />{error ? <p className="text-sm text-rose-600">{errorMessage(error)}</p> : !loading && data.length === 0 ? <EmptyState icon={Bell} title="No notifications" description="Updates about your work and account appear here." /> : <section className={`${cardClass} overflow-hidden`}>{data.map((item) => <button type="button" onClick={() => open(item)} key={item.id} className={`flex w-full items-start gap-4 border-b border-slate-100 p-5 text-left last:border-0 hover:bg-slate-50 ${!item.read ? 'bg-indigo-50/40' : ''}`}><span className={`grid size-11 shrink-0 place-items-center rounded-xl ${!item.read ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}><BellRing size={19} /></span><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><h2 className={`text-sm ${!item.read ? 'font-black text-slate-950' : 'font-bold text-slate-800'}`}>{item.title || 'Sherize update'}</h2>{!item.read && <span className="size-2 rounded-full bg-indigo-600" />}</div><p className="mt-1 text-sm leading-6 text-slate-500">{item.message}</p><p className="mt-2 text-xs text-slate-400">{formatDateTime(item.createdAt)}</p></div></button>)}</section>}</>
}
