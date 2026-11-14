import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { Camera, LoaderCircle, Save, UserRound } from 'lucide-react'
import { db, storage } from '../services/firebase'
import { useAuth } from '../context/AuthContext'
import { Alert, cardClass, inputClass, PageHeader, primaryButton } from '../components/ui'
import { errorMessage, imageFileError } from '../shared/utils/format'

const initial = { fullName: '', email: '', phone: '', gender: '', dateOfBirth: '', houseNumber: '', area: '', landmark: '', city: '', state: '', pincode: '', language: '', education: '', experience: '', headsetAvailable: 'No', deviceType: '', internetType: '' }
const languages = ['English', 'Hindi', 'Telugu', 'Tamil', 'Kannada', 'Malayalam']
const education = ['Uneducated', 'Below SSC', 'SSC', 'Intermediate', 'Graduation', 'Post Graduation']

export default function EditProfile() {
  const { user, profile, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState(initial)
  const [photo, setPhoto] = useState(null)
  const [preview, setPreview] = useState(profile.profileImage || profile.profileImageUrl || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => setForm(Object.fromEntries(Object.keys(initial).map((key) => [key, profile[key] ?? initial[key]]))), [profile])
  const change = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  const choosePhoto = (event) => { const file = event.target.files?.[0]; if (!file) return; const validation = imageFileError(file, 5 * 1024 * 1024); if (validation) { setError(validation); event.target.value = ''; return } setError(''); setPhoto(file); setPreview(URL.createObjectURL(file)) }

  const save = async (event) => {
    event.preventDefault(); setError('')
    if (!form.fullName.trim()) { setError('Full name is required.'); return }
    const requestedEmail = form.email.trim().toLowerCase()
    const currentEmail = String(profile.email || user.email || '').trim().toLowerCase()
    const emailChanged = requestedEmail !== currentEmail
    if (emailChanged && !/^\S+@\S+\.\S+$/.test(requestedEmail)) { setError('Enter a valid email address.'); return }
    if (form.phone && form.phone.replace(/\D/g, '').length < 10) { setError('Phone number must contain at least 10 digits.'); return }
    if (form.dateOfBirth) { const birthday = new Date(form.dateOfBirth); const cutoff = new Date(); cutoff.setFullYear(cutoff.getFullYear() - 18); if (birthday > cutoff) { setError('You must be at least 18 years old.'); return } }
    setSaving(true)
    try {
      let profileImage = profile.profileImage || profile.profileImageUrl || ''
      if (photo) { const reference = ref(storage, `profile/${user.uid}/profile.jpg`); await uploadBytes(reference, photo, { contentType: photo.type }); profileImage = await getDownloadURL(reference) }
      const profileFields = Object.fromEntries(Object.entries(form).filter(([key]) => key !== 'email'))
      await setDoc(doc(db, 'users', user.uid), { ...profileFields, ...(profileImage ? { profileImage } : {}), updatedAt: serverTimestamp() }, { merge: true })
      await refreshProfile()
      if (emailChanged) {
        navigate('/verify-email', { replace: true, state: { changeEmail: true, email: requestedEmail, returnTo: '/profile' } })
      } else {
        navigate('/profile', { replace: true })
      }
    } catch (nextError) { setError(errorMessage(nextError, 'Failed to save your profile.')) } finally { setSaving(false) }
  }

  const fields = (items) => items.map(([name, label, type = 'text', placeholder = '']) => <label key={name} className="block"><span className="mb-2 block text-sm font-bold text-slate-700">{label}</span><input name={name} type={type} value={form[name]} onChange={change} placeholder={placeholder} className={inputClass} /></label>)
  return <><PageHeader eyebrow="Account details" title="Edit profile" description="Keep your personal, address and work information accurate." />{error && <div className="mb-5"><Alert onClose={() => setError('')}>{error}</Alert></div>}<form onSubmit={save} className="min-w-0 space-y-6"><section className={`${cardClass} flex flex-col items-center gap-5 p-5 sm:flex-row sm:p-6`}><span className="grid size-24 place-items-center overflow-hidden rounded-3xl bg-indigo-100 text-2xl font-black text-indigo-700">{preview ? <img src={preview} alt="Profile preview" className="size-full object-cover" /> : <UserRound size={34} />}</span><div className="text-center sm:text-left"><h2 className="font-black text-slate-950">Profile photo</h2><p className="mt-1 text-sm text-slate-500">Use a clear square image, up to 5 MB.</p><label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"><Camera size={17} />Choose image<input type="file" accept="image/*" className="sr-only" onChange={choosePhoto} /></label></div></section>
      <section className={`${cardClass} p-5 sm:p-6`}><h2 className="text-lg font-black text-slate-950">Basic information</h2><div className="mt-5 grid gap-4 md:grid-cols-2">{fields([['fullName', 'Full name'], ['email', 'Email address', 'email'], ['phone', 'Phone number', 'tel'], ['dateOfBirth', 'Date of birth', 'date']])}<label className="block"><span className="mb-2 block text-sm font-bold text-slate-700">Gender</span><select name="gender" value={form.gender} onChange={change} className={inputClass}><option value="">Select</option>{['Female', 'Male', 'Other'].map((value) => <option key={value}>{value}</option>)}</select></label></div></section>
      <section className={`${cardClass} p-5 sm:p-6`}><h2 className="text-lg font-black text-slate-950">Address</h2><div className="mt-5 grid gap-4 md:grid-cols-2">{fields([['houseNumber', 'House number'], ['area', 'Area / street'], ['landmark', 'Landmark'], ['pincode', 'Pincode'], ['city', 'City'], ['state', 'State']])}</div></section>
      <section className={`${cardClass} p-5 sm:p-6`}><h2 className="text-lg font-black text-slate-950">Work preferences and equipment</h2><div className="mt-5 grid gap-4 md:grid-cols-2"><label><span className="mb-2 block text-sm font-bold text-slate-700">Preferred language</span><select name="language" value={form.language} onChange={change} className={inputClass}><option value="">Select</option>{languages.map((value) => <option key={value}>{value}</option>)}</select></label><label><span className="mb-2 block text-sm font-bold text-slate-700">Education</span><select name="education" value={form.education} onChange={change} className={inputClass}><option value="">Select</option>{education.map((value) => <option key={value}>{value}</option>)}</select></label>{fields([['experience', 'Work experience']])}<label><span className="mb-2 block text-sm font-bold text-slate-700">Headset available</span><select name="headsetAvailable" value={form.headsetAvailable} onChange={change} className={inputClass}><option>Yes</option><option>No</option></select></label><label><span className="mb-2 block text-sm font-bold text-slate-700">Device type</span><select name="deviceType" value={form.deviceType} onChange={change} className={inputClass}><option value="">Select</option>{['Android', 'iPhone', 'Laptop', 'Desktop'].map((value) => <option key={value}>{value}</option>)}</select></label><label><span className="mb-2 block text-sm font-bold text-slate-700">Internet type</span><select name="internetType" value={form.internetType} onChange={change} className={inputClass}><option value="">Select</option>{['WiFi', 'Mobile Data', 'Broadband'].map((value) => <option key={value}>{value}</option>)}</select></label></div></section>
      <div className="flex justify-end"><button type="submit" disabled={saving} className={`${primaryButton} w-full sm:w-auto`}>{saving ? <LoaderCircle className="animate-spin" size={18} /> : <Save size={18} />}Save profile</button></div></form></>
}
