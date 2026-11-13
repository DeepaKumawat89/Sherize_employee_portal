import { useMemo, useState } from 'react'
import { collection, doc, limit, orderBy, query, serverTimestamp, setDoc } from 'firebase/firestore'
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { ChevronDown, ChevronUp, CircleHelp, ExternalLink, Headphones, LoaderCircle, Mail, MessageCircle, Phone, Send } from 'lucide-react'
import { db, storage } from '../services/firebase'
import { useAuth } from '../context/AuthContext'
import { useCollection } from '../hooks/useFirestore'
import { Alert, cardClass, inputClass, PageHeader, primaryButton } from '../components/ui'
import { errorMessage, imageFileError } from '../shared/utils/format'

const fallbackFaqs = [
  ['How do I start working on a task?', 'Open Tasks, accept an available marketplace task after KYC approval, then open the assignment and process each lead.'],
  ['When will my earnings be approved?', 'Task submissions are reviewed by the Sherize team. Approved amounts are credited to your employee wallet.'],
  ['How long does KYC verification take?', 'KYC is reviewed manually and typically updates within 24 to 48 hours.'],
  ['How do withdrawals work?', 'Complete your profile and KYC, add bank or UPI details, and request at least the configured minimum amount from Earnings.'],
]

export default function Help() {
  const { user, profile } = useAuth()
  const faqQuery = useMemo(() => query(collection(db, 'faqs'), orderBy('order', 'asc'), limit(100)), [])
  const { data: remoteFaqs } = useCollection(faqQuery)
  const faqs = remoteFaqs.filter((item) => item.isActive !== false).length ? remoteFaqs.filter((item) => item.isActive !== false).map((item) => [item.question, item.answer]) : fallbackFaqs
  const [open, setOpen] = useState(0)
  const [form, setForm] = useState({ issueType: 'Task problem', subject: '', message: '' })
  const [screenshot, setScreenshot] = useState(null)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const submit = async (event) => {
    event.preventDefault(); if (!form.subject.trim() || !form.message.trim()) { setError('Enter a subject and message.'); return } if (form.subject.trim().length > 200 || form.message.trim().length > 4000) { setError('Subject must be 200 characters or fewer and message must be 4,000 characters or fewer.'); return } const screenshotError = screenshot ? imageFileError(screenshot, 10 * 1024 * 1024) : ''; if (screenshotError) { setError(screenshotError); return } setBusy(true); setError('')
    try { let screenshotUrl = null; const requestRef = doc(collection(db, 'support_requests')); if (screenshot) { const fileRef = ref(storage, `support_screenshots/${user.uid}/${requestRef.id}_${Date.now()}.jpg`); await uploadBytes(fileRef, screenshot, { contentType: screenshot.type || 'image/jpeg' }); screenshotUrl = await getDownloadURL(fileRef) } await setDoc(requestRef, { userId: user.uid, name: profile.fullName || profile.name || '', email: profile.email || user.email || '', phone: profile.phone || profile.phoneNumber || '', subject: form.subject.trim(), message: form.message.trim(), status: 'open', issueType: form.issueType, screenshotUrl, createdAt: serverTimestamp() }); setNotice('Support request submitted. Our team will respond through your registered contact details.'); setForm({ issueType: 'Task problem', subject: '', message: '' }); setScreenshot(null) } catch (nextError) { setError(errorMessage(nextError, 'Support request could not be submitted.')) } finally { setBusy(false) }
  }
  return <><PageHeader eyebrow="Employee support" title="Help centre" description="Find answers or contact the Sherize support team." />{notice && <div className="mb-5"><Alert type="success" onClose={() => setNotice('')}>{notice}</Alert></div>}{error && <div className="mb-5"><Alert onClose={() => setError('')}>{error}</Alert></div>}
    <section className="grid gap-4 md:grid-cols-3">{[[Mail, 'Email support', 'info@sherize.in', 'mailto:info@sherize.in'], [Phone, 'Call support', '+91 76720 73746', 'tel:+917672073746'], [MessageCircle, 'WhatsApp', 'Chat with us', 'https://wa.me/917672073746']].map(([Icon, title, value, href]) => <a key={title} href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noreferrer" className={`${cardClass} flex items-center gap-4 p-5 hover:border-indigo-200`}><span className="grid size-11 place-items-center rounded-xl bg-indigo-50 text-indigo-600"><Icon size={20} /></span><span className="min-w-0 flex-1"><strong className="block text-sm text-slate-900">{title}</strong><small className="mt-1 block text-xs text-slate-500">{value}</small></span><ExternalLink size={16} className="text-slate-400" /></a>)}</section>
    <div className="mt-6 grid gap-6 xl:grid-cols-[.9fr_1.1fr]"><section className={`${cardClass} p-5 sm:p-6`}><div className="flex items-center gap-3"><CircleHelp className="text-indigo-600" /><h2 className="text-lg font-black text-slate-950">Frequently asked questions</h2></div><div className="mt-5 divide-y divide-slate-100">{faqs.map(([question, answer], index) => <article key={question}><button type="button" onClick={() => setOpen(open === index ? -1 : index)} className="flex w-full items-center gap-3 py-4 text-left"><span className="flex-1 text-sm font-bold text-slate-900">{question}</span>{open === index ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</button>{open === index && <p className="pb-4 text-sm leading-6 text-slate-500">{answer}</p>}</article>)}</div></section>
      <form onSubmit={submit} className={`${cardClass} p-5 sm:p-6`}><div className="flex items-center gap-3"><Headphones className="text-indigo-600" /><div><h2 className="text-lg font-black text-slate-950">Submit a support request</h2><p className="mt-1 text-sm text-slate-500">Mon–Sat, 10 AM–7 PM IST</p></div></div><div className="mt-5 space-y-4"><label><span className="mb-2 block text-sm font-bold text-slate-700">Issue type</span><select value={form.issueType} onChange={(event) => setForm((current) => ({ ...current, issueType: event.target.value }))} className={inputClass}>{['App crash', 'Task problem', 'Payment issue', 'Call issue', 'KYC issue', 'Other'].map((value) => <option key={value}>{value}</option>)}</select></label><label><span className="mb-2 block text-sm font-bold text-slate-700">Subject</span><input value={form.subject} onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))} className={inputClass} /></label><label><span className="mb-2 block text-sm font-bold text-slate-700">Message</span><textarea rows={5} value={form.message} onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))} className={`${inputClass} py-3`} /></label><label><span className="mb-2 block text-sm font-bold text-slate-700">Screenshot (optional)</span><input type="file" accept="image/*" onChange={(event) => setScreenshot(event.target.files?.[0] || null)} className="block w-full rounded-xl border border-slate-200 bg-white p-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-3 file:py-2 file:font-bold file:text-indigo-700" /></label></div><button type="submit" disabled={busy} className={`${primaryButton} mt-6 w-full`}>{busy ? <LoaderCircle className="animate-spin" size={18} /> : <Send size={18} />}Submit request</button></form></div>
  </>
}
