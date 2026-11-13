import { useMemo, useState } from 'react'
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { FileCheck2, FileText, Image, LoaderCircle, LockKeyhole, ShieldCheck } from 'lucide-react'
import { db, storage } from '../services/firebase'
import { useAuth } from '../context/AuthContext'
import { useDocument } from '../hooks/useFirestore'
import { Alert, cardClass, PageHeader, primaryButton, StatusPill } from '../components/ui'
import { errorMessage, imageFileError, normalizeStatus } from '../shared/utils/format'

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
  const existing = { profile: profile?.profileImageUrl, aadhaar: profile?.aadhaarUrl || profile?.aadharUrl, pan: profile?.panUrl }

  const submit = async () => {
    setError(''); setNotice('')
    if (!files.profile || !files.aadhaar || !files.pan) { setError('Upload all three required KYC documents.'); return }
    const invalidFile = Object.values(files).map((file) => imageFileError(file, 5 * 1024 * 1024)).find(Boolean)
    if (invalidFile) { setError(invalidFile); return }
    setBusy(true)
    try {
      const current = normalizeStatus(profile?.kycStatus || profile?.kyc_status, '')
      if (['approved', 'pending'].includes(current)) throw new Error(`KYC is already ${current}. It cannot be resubmitted.`)
      const upload = async (key) => { const reference = ref(storage, `kyc/${user.uid}/${key}.jpg`); await uploadBytes(reference, files[key], { contentType: files[key].type || 'image/jpeg' }); return getDownloadURL(reference) }
      const [profileImageUrl, aadhaarUrl, panUrl] = await Promise.all([upload('profile'), upload('aadhaar'), upload('pan')])
      await updateDoc(profileRef, { profileImageUrl, aadhaarUrl, panUrl, kycStatus: 'pending', submittedAt: serverTimestamp() })
      setNotice('KYC documents submitted successfully for review.')
    } catch (nextError) { setError(errorMessage(nextError, 'Failed to submit KYC.')) } finally { setBusy(false) }
  }

  const documentRows = [
    ['profile', 'Profile photo', 'A clear recent photograph', Image],
    ['aadhaar', 'Aadhaar card', 'All details must be clearly visible', FileText],
    ['pan', 'PAN card', 'Name and PAN number must be readable', FileCheck2],
  ]
  return <><PageHeader eyebrow="Identity verification" title="KYC verification" description="Submit the same documents required by SherizeApp for employee work access." actions={<StatusPill status={status} />} />{notice && <div className="mb-5"><Alert type="success" onClose={() => setNotice('')}>{notice}</Alert></div>}{error && <div className="mb-5"><Alert onClose={() => setError('')}>{error}</Alert></div>}
    <section className={`${cardClass} p-5 sm:p-6`}><div className="flex gap-4"><span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-indigo-50 text-indigo-600"><ShieldCheck size={23} /></span><div><h2 className="font-black text-slate-950">{status === 'approved' || status === 'verified' ? 'Identity verified' : status === 'pending' ? 'Verification under review' : status === 'rejected' ? 'Resubmission required' : 'Verification required'}</h2><p className="mt-1 text-sm leading-6 text-slate-500">{status === 'pending' ? 'Sherize typically reviews documents within 24–48 hours.' : status === 'rejected' ? profile?.kycRejectionReason || profile?.rejectionReason || 'Review the document quality and submit all documents again.' : 'Approved KYC is required before accepting employee tasks.'}</p></div></div></section>
    <section className="mt-6 grid gap-5 lg:grid-cols-3">{documentRows.map(([key, title, description, Icon], index) => <article key={key} className={`${cardClass} p-5`}><div className="flex items-start justify-between"><span className="grid size-11 place-items-center rounded-xl bg-slate-100 text-slate-600"><Icon size={20} /></span><span className="text-xs font-black text-slate-300">0{index + 1}</span></div><h3 className="mt-4 font-black text-slate-950">{title}</h3><p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>{(files[key] || existing[key]) && <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-slate-50"><img src={files[key] ? URL.createObjectURL(files[key]) : existing[key]} alt={`${title} preview`} className="h-36 w-full object-cover" /></div>}<label className={`mt-4 flex min-h-11 items-center justify-center rounded-xl border border-dashed px-3 text-sm font-bold ${disabled ? 'cursor-not-allowed bg-slate-100 text-slate-400' : 'cursor-pointer border-indigo-300 bg-indigo-50 text-indigo-700 hover:bg-indigo-100'}`}>{files[key] ? 'Replace file' : existing[key] ? 'Document submitted' : 'Choose image'}<input type="file" accept="image/*" disabled={disabled} onChange={(event) => setFiles((current) => ({ ...current, [key]: event.target.files?.[0] || null }))} className="sr-only" /></label></article>)}</section>
    <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center"><LockKeyhole className="shrink-0 text-indigo-600" /><p className="flex-1 text-sm leading-6 text-slate-600">Documents are stored in the existing secured Firebase Storage paths and used only for identity verification.</p>{!['approved', 'verified'].includes(status) && <button type="button" onClick={submit} disabled={disabled || busy || !files.profile || !files.aadhaar || !files.pan} className={primaryButton}>{busy ? <LoaderCircle className="animate-spin" size={18} /> : <ShieldCheck size={18} />}{status === 'rejected' ? 'Resubmit documents' : 'Submit for review'}</button>}</div>
  </>
}
