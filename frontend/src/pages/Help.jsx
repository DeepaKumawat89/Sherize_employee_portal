import { useMemo, useState } from 'react'
import { collection, doc, limit, orderBy, query, serverTimestamp, setDoc } from 'firebase/firestore'
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { ChevronDown, CircleHelp, Clock3, ExternalLink, Headphones, LoaderCircle, Mail, MessageCircle, Paperclip, Phone, Send, X } from 'lucide-react'
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

const contacts = [
  [Mail, 'Email support', 'info@sherize.in', 'mailto:info@sherize.in', 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white'],
  [Phone, 'Call support', '+91 76720 73746', 'tel:+917672073746', 'bg-amber-50 text-amber-600 group-hover:bg-amber-500 group-hover:text-white'],
  [MessageCircle, 'WhatsApp', 'Chat with us', 'https://wa.me/917672073746', 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white'],
]

const issueTypes = ['App crash', 'Task problem', 'Payment issue', 'Call issue', 'KYC issue', 'Other']
const labelClass = 'mb-2 block text-sm font-bold text-slate-700'

export default function Help() {
  const { user, profile } = useAuth()
  const faqQuery = useMemo(() => query(collection(db, 'faqs'), orderBy('order', 'asc'), limit(100)), [])
  const { data: remoteFaqs } = useCollection(faqQuery)
  const activeFaqs = remoteFaqs.filter((item) => item.isActive !== false)
  const faqs = activeFaqs.length ? activeFaqs.map((item) => [item.question, item.answer]) : fallbackFaqs
  const [open, setOpen] = useState(0)
  const [form, setForm] = useState({ issueType: 'Task problem', subject: '', message: '' })
  const [screenshot, setScreenshot] = useState(null)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  const setField = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }))

  const submit = async (event) => {
    event.preventDefault()
    if (!form.subject.trim() || !form.message.trim()) {
      setError('Enter a subject and message.')
      return
    }
    if (form.subject.trim().length > 200 || form.message.trim().length > 4000) {
      setError('Subject must be 200 characters or fewer and message must be 4,000 characters or fewer.')
      return
    }
    const screenshotError = screenshot ? imageFileError(screenshot, 10 * 1024 * 1024) : ''
    if (screenshotError) {
      setError(screenshotError)
      return
    }
    setBusy(true)
    setError('')
    try {
      let screenshotUrl = null
      const requestRef = doc(collection(db, 'support_requests'))
      if (screenshot) {
        const fileRef = ref(storage, `support_screenshots/${user.uid}/${requestRef.id}_${Date.now()}.jpg`)
        await uploadBytes(fileRef, screenshot, { contentType: screenshot.type || 'image/jpeg' })
        screenshotUrl = await getDownloadURL(fileRef)
      }
      await setDoc(requestRef, {
        userId: user.uid,
        name: profile.fullName || profile.name || '',
        email: profile.email || user.email || '',
        phone: profile.phone || profile.phoneNumber || '',
        subject: form.subject.trim(),
        message: form.message.trim(),
        status: 'open',
        issueType: form.issueType,
        screenshotUrl,
        createdAt: serverTimestamp(),
      })
      setNotice('Support request submitted. Our team will respond through your registered contact details.')
      setForm({ issueType: 'Task problem', subject: '', message: '' })
      setScreenshot(null)
    } catch (nextError) {
      setError(errorMessage(nextError, 'Support request could not be submitted.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PageHeader eyebrow="Employee support" title="Help centre" description="Find answers or contact the Sherize support team." />

      {notice && <div className="mb-5"><Alert type="success" onClose={() => setNotice('')}>{notice}</Alert></div>}
      {error && <div className="mb-5"><Alert onClose={() => setError('')}>{error}</Alert></div>}

      {/* Contact options */}
      <section className="grid gap-4 md:grid-cols-3">
        {contacts.map(([Icon, title, value, href, tone]) => (
          <a
            key={title}
            href={href}
            target={href.startsWith('http') ? '_blank' : undefined}
            rel="noreferrer"
            className={`${cardClass} group flex min-w-0 items-center gap-3 p-4 min-[380px]:gap-4 min-[380px]:p-5 transition duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-100/60`}
          >
            <span className={`grid size-12 shrink-0 place-items-center rounded-2xl transition ${tone}`}><Icon size={21} /></span>
            <span className="min-w-0 flex-1">
              <strong className="block text-sm font-black text-slate-900">{title}</strong>
              <small className="mt-1 block truncate text-sm text-slate-500">{value}</small>
            </span>
            <ExternalLink size={16} className="shrink-0 text-slate-300 transition group-hover:text-indigo-500" />
          </a>
        ))}
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[.9fr_1.1fr] xl:items-start">
        {/* FAQs */}
        <section className={`${cardClass} p-5 sm:p-7`}>
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-xl bg-indigo-50 text-indigo-600"><CircleHelp size={21} /></span>
            <div>
              <h2 className="text-lg font-black text-slate-950">Frequently asked questions</h2>
              <p className="mt-0.5 text-sm text-slate-500">Quick answers to common questions</p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {faqs.map(([question, answer], index) => {
              const isOpen = open === index
              return (
                <article key={question} className={`overflow-hidden rounded-2xl border transition ${isOpen ? 'border-indigo-200 bg-indigo-50/40' : 'border-slate-200 hover:border-indigo-200'}`}>
                  <button type="button" onClick={() => setOpen(isOpen ? -1 : index)} aria-expanded={isOpen} className="flex w-full items-center gap-3 p-4 text-left">
                    <span className={`grid size-8 shrink-0 place-items-center rounded-lg text-xs font-black ${isOpen ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>{index + 1}</span>
                    <span className={`flex-1 text-sm font-bold ${isOpen ? 'text-indigo-900' : 'text-slate-900'}`}>{question}</span>
                    <ChevronDown size={18} className={`shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-indigo-600' : 'text-slate-400'}`} />
                  </button>
                  {isOpen && <p className="px-4 pb-4 pl-15 text-sm leading-6 text-slate-600" style={{ paddingLeft: '3.5rem' }}>{answer}</p>}
                </article>
              )
            })}
          </div>
        </section>

        {/* Support form */}
        <form onSubmit={submit} className={`${cardClass} p-5 sm:p-7`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-xl bg-indigo-50 text-indigo-600"><Headphones size={21} /></span>
              <div>
                <h2 className="text-lg font-black text-slate-950">Submit a support request</h2>
                <p className="mt-0.5 text-sm text-slate-500">We’ll reply on your registered contact details</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-inset ring-emerald-100">
              <Clock3 size={13} />Mon–Sat, 10 AM–7 PM IST
            </span>
          </div>

          <div className="mt-6 space-y-5">
            <label className="block">
              <span className={labelClass}>Issue type</span>
              <select value={form.issueType} onChange={setField('issueType')} className={inputClass}>
                {issueTypes.map((value) => <option key={value}>{value}</option>)}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 flex justify-between text-sm font-bold text-slate-700">
                <span>Subject</span>
                <span className={`text-xs font-semibold ${form.subject.length > 200 ? 'text-red-600' : 'text-slate-400'}`}>{form.subject.length}/200</span>
              </span>
              <input value={form.subject} onChange={setField('subject')} className={inputClass} placeholder="Briefly describe the problem" />
            </label>

            <label className="block">
              <span className="mb-2 flex justify-between text-sm font-bold text-slate-700">
                <span>Message</span>
                <span className={`text-xs font-semibold ${form.message.length > 4000 ? 'text-red-600' : 'text-slate-400'}`}>{form.message.length}/4000</span>
              </span>
              <textarea rows={5} value={form.message} onChange={setField('message')} className={`${inputClass} py-3`} placeholder="Share what happened, and what you expected" />
            </label>

            <div>
              <span className={labelClass}>Screenshot <span className="font-semibold text-slate-400">(optional)</span></span>
              {screenshot ? (
                <div className="flex items-center gap-3 rounded-2xl border border-indigo-200 bg-indigo-50/50 p-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-indigo-100 text-indigo-600"><Paperclip size={18} /></span>
                  <p className="min-w-0 flex-1 truncate text-sm font-bold text-slate-900">{screenshot.name}</p>
                  <button type="button" onClick={() => setScreenshot(null)} aria-label="Remove screenshot" className="grid size-9 place-items-center rounded-lg text-slate-500 transition hover:bg-white hover:text-slate-900"><X size={17} /></button>
                </div>
              ) : (
                <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 p-4 transition hover:border-indigo-300 hover:bg-indigo-50/40">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-slate-500 ring-1 ring-slate-200"><Paperclip size={18} /></span>
                  <span className="text-sm">
                    <strong className="block font-bold text-slate-800">Attach a screenshot</strong>
                    <small className="text-xs text-slate-500">PNG or JPG, up to 10 MB</small>
                  </span>
                  <input type="file" accept="image/*" onChange={(event) => setScreenshot(event.target.files?.[0] || null)} className="sr-only" />
                </label>
              )}
            </div>
          </div>

          <button type="submit" disabled={busy} className={`${primaryButton} mt-7 w-full`}>
            {busy ? <LoaderCircle className="animate-spin" size={18} /> : <Send size={18} />}Submit request
          </button>
        </form>
      </div>
    </>
  )
}
