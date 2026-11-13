import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { collection, query, where } from 'firebase/firestore'
import { BriefcaseBusiness, CheckCircle2, Clock3, IndianRupee, LoaderCircle, LogIn, MapPin, Send, X } from 'lucide-react'
import { db } from '../services/firebase'
import { callExistingFunction } from '../services/employee'
import { useCollection } from '../hooks/useFirestore'
import { useAuth } from '../context/AuthContext'
import { Alert, EmptyState, inputClass, primaryButton, secondaryButton, StatusPill } from '../components/ui'
import { errorMessage } from '../shared/utils/format'

export default function Jobs() {
  const { user, profile, logout } = useAuth()
  const openingsQuery = useMemo(() => query(collection(db, 'job_postings'), where('status', '==', 'open')), [])
  const { data: openings, loading, error } = useCollection(openingsQuery)
  const applicationsQuery = useMemo(() => user ? query(collection(db, 'job_applications'), where('applicantUid', '==', user.uid)) : null, [user])
  const { data: applications } = useCollection(applicationsQuery)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState({ name: profile?.fullName || profile?.name || '', phone: profile?.phone || profile?.phoneNumber || '', email: profile?.email || user?.email || '' })
  const [submitting, setSubmitting] = useState(false)
  const [notice, setNotice] = useState('')
  const [formError, setFormError] = useState('')
  const applied = useMemo(() => Object.fromEntries(applications.map((item) => [item.jobId, item.status || 'applied'])), [applications])

  const submit = async (event) => {
    event.preventDefault()
    const phone = form.phone.replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '')
    if (form.name.trim().length < 2 || !/^[6-9]\d{9}$/.test(phone) || (form.email.trim() && !/^\S+@\S+\.\S+$/.test(form.email.trim()))) {
      setFormError('Enter a valid name and 10-digit mobile number. Email is optional but must be valid when provided.')
      return
    }
    setSubmitting(true)
    setFormError('')
    try {
      await callExistingFunction('submitPublicApplication', { jobId: selected.id, jobTitle: selected.title || 'Opening', name: form.name.trim(), phone, email: form.email.trim() })
      setNotice('Application submitted. Our team will contact you for an interview.')
      setSelected(null)
    } catch (nextError) {
      setFormError(errorMessage(nextError, 'Could not submit your application.'))
    } finally {
      setSubmitting(false)
    }
  }

  return <div className="min-h-screen bg-slate-50">
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur-xl"><div className="mx-auto flex h-20 max-w-6xl items-center gap-3 px-4 sm:px-6"><span className="grid size-10 place-items-center rounded-xl bg-indigo-600 font-black text-white">S</span><div><strong className="block text-base text-slate-950">Sherize</strong><span className="text-xs text-slate-500">Job Portal</span></div><div className="ml-auto">{user ? <button type="button" onClick={logout} className={secondaryButton}>Sign out</button> : <Link to="/login" className={secondaryButton}><LogIn size={17} />Employee login</Link>}</div></div></header>
    <main>
      <section className="overflow-hidden bg-slate-950"><div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24"><div className="max-w-3xl"><p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-300">Careers at Sherize</p><h1 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-6xl">Build your career from wherever you are.</h1><p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">Explore verified remote opportunities, apply securely, and join our employee network after a short review.</p></div></div></section>
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        {notice && <div className="mb-6"><Alert type="success" onClose={() => setNotice('')}>{notice}</Alert></div>}
        {user && profile?.onboardingStatus === 'applicant' && <div className="mb-8 flex items-start gap-4 rounded-2xl border border-indigo-200 bg-indigo-50 p-5"><Clock3 className="mt-0.5 shrink-0 text-indigo-600" /><div><h2 className="font-bold text-indigo-950">Application workspace</h2><p className="mt-1 text-sm leading-6 text-indigo-800">Apply below and track your status. Once hired, Sherize will issue employee credentials and unlock the task workspace.</p></div></div>}
        <div className="mb-7"><p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">Current opportunities</p><h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Open positions</h2></div>
        {loading ? <div className="grid min-h-64 place-items-center"><LoaderCircle className="animate-spin text-indigo-600" /></div> : error ? <Alert>{errorMessage(error, 'Unable to load openings.')}</Alert> : openings.length === 0 ? <EmptyState icon={BriefcaseBusiness} title="No openings right now" description="Please check back soon for new Sherize opportunities." /> : <div className="grid gap-5 md:grid-cols-2">{openings.map((job) => <article key={job.id} className="flex flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-start justify-between gap-4"><span className="grid size-12 place-items-center rounded-2xl bg-indigo-50 text-indigo-600"><BriefcaseBusiness size={22} /></span>{applied[job.id] && <StatusPill status={applied[job.id]} />}</div><h3 className="mt-5 text-xl font-black text-slate-950">{job.title || 'Employee opening'}</h3><div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-500">{job.location && <span className="inline-flex items-center gap-1.5"><MapPin size={16} />{job.location}</span>}{job.payNote && <span className="inline-flex items-center gap-1.5"><IndianRupee size={16} />{job.payNote}</span>}</div>{job.description && <p className="mt-4 flex-1 text-sm leading-6 text-slate-600">{job.description}</p>}<button type="button" disabled={Boolean(applied[job.id])} onClick={() => setSelected(job)} className={`${primaryButton} mt-6 w-full`}>{applied[job.id] ? <><CheckCircle2 size={18} />Applied</> : <><Send size={18} />Apply now</>}</button></article>)}</div>}
      </section>
    </main>
    {selected && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4 backdrop-blur-sm"><form onSubmit={submit} className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl sm:p-8"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wider text-indigo-600">Apply for</p><h2 className="mt-1 text-xl font-black text-slate-950">{selected.title}</h2></div><button type="button" onClick={() => setSelected(null)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"><X size={20} /></button></div>{formError && <div className="mt-5"><Alert>{formError}</Alert></div>}<div className="mt-6 space-y-4">{[['name', 'Full name', 'text'], ['phone', '10-digit mobile number', 'tel'], ['email', 'Email address (optional)', 'email']].map(([key, label, type]) => <label key={key} className="block"><span className="mb-2 block text-sm font-bold text-slate-700">{label}</span><input type={type} value={form[key]} onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))} className={inputClass} /></label>)}</div><button type="submit" disabled={submitting} className={`${primaryButton} mt-6 w-full`}>{submitting ? <LoaderCircle className="animate-spin" size={18} /> : <Send size={18} />}Submit application</button></form></div>}
  </div>
}
