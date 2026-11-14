import { useEffect, useMemo, useState } from 'react'
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { CheckCircle2, Clock3, FileCheck2, FileText, Image, LoaderCircle, LockKeyhole, ShieldAlert, ShieldCheck, Upload } from 'lucide-react'
import { db, storage } from '../services/firebase'
import { useAuth } from '../context/AuthContext'
import { useDocument } from '../hooks/useFirestore'
import { Alert, cardClass, PageHeader, primaryButton, StatusPill } from '../components/ui'
import { errorMessage, imageFileError, normalizeStatus } from '../shared/utils/format'

const documentRows = [
  ['profile', 'Profile photo', 'A clear recent photograph', Image],
  ['aadhaar', 'Aadhaar card', 'All details must be clearly visible', FileText],
  ['pan', 'PAN card', 'Name and PAN number must be readable', FileCheck2],
]

export default function Kyc() {
  const { user } = useAuth()
  const profileRef = useMemo(() => doc(db, 'users', user.uid), [user.uid])
  const { data: profile } = useDocument(profileRef)
  const [files, setFiles] = useState({ profile: null, aadhaar: null, pan: null })
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const status = normalizeStatus(profile?.kycStatus || profile?.kyc_status, 'unverified')
  const disabled = ['pending', 'approved', 'verified'].includes(status)
  const isVerified = ['approved', 'verified'].includes(status)
  const existing = { profile: profile?.profileImageUrl, aadhaar: profile?.aadhaarUrl || profile?.aadharUrl, pan: profile?.panUrl }

  // Preview URLs for newly chosen files, released when replaced or on unmount
  const previews = useMemo(() => Object.fromEntries(Object.entries(files).map(([key, file]) => [key, file ? URL.createObjectURL(file) : null])), [files])
  useEffect(() => () => Object.values(previews).forEach((url) => url && URL.revokeObjectURL(url)), [previews])

  const readyCount = documentRows.filter(([key]) => files[key] || existing[key]).length

  const banner = isVerified
    ? { icon: CheckCircle2, title: 'Identity verified', text: 'Approved KYC is on file. You can accept employee tasks.', tone: 'bg-emerald-50 text-emerald-700', border: 'border-emerald-100', iconTone: 'bg-emerald-100 text-emerald-700' }
    : status === 'pending'
      ? { icon: Clock3, title: 'Verification under review', text: 'Sherize typically reviews documents within 24–48 hours.', tone: 'bg-amber-50 text-amber-800', border: 'border-amber-100', iconTone: 'bg-amber-100 text-amber-700' }
      : status === 'rejected'
        ? { icon: ShieldAlert, title: 'Resubmission required', text: profile?.kycRejectionReason || profile?.rejectionReason || 'Review the document quality and submit all documents again.', tone: 'bg-red-50 text-red-800', border: 'border-red-100', iconTone: 'bg-red-100 text-red-700' }
        : { icon: ShieldCheck, title: 'Verification required', text: 'Approved KYC is required before accepting employee tasks.', tone: 'bg-indigo-50 text-indigo-800', border: 'border-indigo-100', iconTone: 'bg-indigo-100 text-indigo-600' }
  const BannerIcon = banner.icon

  const submit = async () => {
    setError('')
    setNotice('')
    if (!files.profile || !files.aadhaar || !files.pan) {
      setError('Upload all three required KYC documents.')
      return
    }
    const invalidFile = Object.values(files).map((file) => imageFileError(file, 5 * 1024 * 1024)).find(Boolean)
    if (invalidFile) {
      setError(invalidFile)
      return
    }
    setBusy(true)
    try {
      const current = normalizeStatus(profile?.kycStatus || profile?.kyc_status, '')
      if (['approved', 'pending'].includes(current)) throw new Error(`KYC is already ${current}. It cannot be resubmitted.`)
      const upload = async (key) => {
        const reference = ref(storage, `kyc/${user.uid}/${key}.jpg`)
        await uploadBytes(reference, files[key], { contentType: files[key].type || 'image/jpeg' })
        return getDownloadURL(reference)
      }
      const [profileImageUrl, aadhaarUrl, panUrl] = await Promise.all([upload('profile'), upload('aadhaar'), upload('pan')])
      await updateDoc(profileRef, { profileImageUrl, aadhaarUrl, panUrl, kycStatus: 'pending', submittedAt: serverTimestamp() })
      setNotice('KYC documents submitted successfully for review.')
    } catch (nextError) {
      setError(errorMessage(nextError, 'Failed to submit KYC.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Identity verification"
        title="KYC verification"
        description="Submit the same documents required by SherizeApp for employee work access."
        actions={<StatusPill status={status} />}
      />

      {notice && <div className="mb-5"><Alert type="success" onClose={() => setNotice('')}>{notice}</Alert></div>}
      {error && <div className="mb-5"><Alert onClose={() => setError('')}>{error}</Alert></div>}

      <section className={`${cardClass} overflow-hidden`}>
        {/* Status banner */}
        <div className={`flex items-start gap-3 border-b p-4 min-[380px]:gap-4 min-[380px]:p-5 sm:p-6 ${banner.tone} ${banner.border}`}>
          <span className={`grid size-12 shrink-0 place-items-center rounded-2xl ${banner.iconTone}`}><BannerIcon size={23} /></span>
          <div className="min-w-0">
            <h2 className="font-black text-slate-950">{banner.title}</h2>
            <p className="mt-1 text-sm leading-6">{banner.text}</p>
          </div>
        </div>

        {/* Documents */}
        <div className="p-4 min-[380px]:p-5 sm:p-7">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">Required documents</p>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{readyCount}/3 ready</span>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            {documentRows.map(([key, title, description, Icon], index) => {
              const preview = previews[key] || existing[key]
              const ready = Boolean(files[key] || existing[key])
              return (
                <article key={key} className={`flex flex-col rounded-2xl border p-4 transition ${ready ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-200 bg-slate-50/50'}`}>
                  <div className="flex items-center gap-3">
                    <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${ready ? 'bg-emerald-100 text-emerald-700' : 'bg-white text-slate-500 ring-1 ring-slate-200'}`}>
                      {ready ? <CheckCircle2 size={20} /> : <Icon size={20} />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-black text-slate-950">{title}</h3>
                      <p className="text-xs font-semibold text-slate-400">Step 0{index + 1}</p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-500">{description}</p>

                  {preview && (
                    <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
                      <img src={preview} alt={`${title} preview`} className="h-36 w-full object-cover" />
                    </div>
                  )}

                  <label className={`mt-auto flex min-h-11 items-center justify-center gap-2 rounded-xl border border-dashed px-3 text-sm font-bold transition ${disabled ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400' : 'cursor-pointer border-indigo-300 bg-indigo-50 text-indigo-700 hover:bg-indigo-100'}`} style={{ marginTop: preview ? '1rem' : '1rem' }}>
                    {!disabled && <Upload size={16} />}
                    {files[key] ? 'Replace file' : existing[key] ? 'Document submitted' : 'Choose image'}
                    <input type="file" accept="image/*" disabled={disabled} onChange={(event) => setFiles((current) => ({ ...current, [key]: event.target.files?.[0] || null }))} className="sr-only" />
                  </label>
                </article>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col gap-4 border-t border-slate-200 bg-slate-50/60 p-4 min-[380px]:p-5 sm:flex-row sm:items-center sm:p-6">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-600"><LockKeyhole size={19} /></span>
          <p className="flex-1 text-sm leading-6 text-slate-600">Documents are stored in the existing secured Firebase Storage paths and used only for identity verification.</p>
          {!isVerified && (
            <button type="button" onClick={submit} disabled={disabled || busy || !files.profile || !files.aadhaar || !files.pan} className={`${primaryButton} w-full sm:w-auto`}>
              {busy ? <LoaderCircle className="animate-spin" size={18} /> : <ShieldCheck size={18} />}
              {status === 'rejected' ? 'Resubmit documents' : 'Submit for review'}
            </button>
          )}
        </div>
      </section>
    </>
  )
}
