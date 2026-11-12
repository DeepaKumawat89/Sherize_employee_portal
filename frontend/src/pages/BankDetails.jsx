import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { Landmark, LoaderCircle, Save, Smartphone } from 'lucide-react'
import { db } from '../services/firebase'
import { useAuth } from '../context/AuthContext'
import { Alert, cardClass, inputClass, PageHeader, primaryButton } from '../components/ui'
import { errorMessage } from '../lib/format'

export default function BankDetails() {
  const { user, profile, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState('upi')
  const [form, setForm] = useState({ upiId: '', accountNumber: '', ifscCode: '', bankName: '', accountHolder: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => { const bank = profile.bankDetails || {}; setMode(bank.paymentMode || 'upi'); setForm((current) => ({ ...current, ...bank })) }, [profile])
  const change = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  const save = async (event) => {
    event.preventDefault(); setError('')
    if (mode === 'upi' && !/^\S+@\S+$/.test(form.upiId.trim())) { setError('Enter a valid UPI ID, such as name@upi.'); return }
    if (mode === 'bank' && (!form.accountHolder.trim() || form.accountNumber.trim().length < 9 || !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(form.ifscCode.trim().toUpperCase()) || !form.bankName.trim())) { setError('Enter a valid account holder, account number, IFSC code and bank name.'); return }
    setSaving(true)
    try {
      const bankDetails = mode === 'upi' ? { paymentMode: 'upi', upiId: form.upiId.trim(), upiVerified: false, updatedAt: serverTimestamp() } : { paymentMode: 'bank', accountNumber: form.accountNumber.trim(), ifscCode: form.ifscCode.trim().toUpperCase(), bankName: form.bankName.trim(), accountHolder: form.accountHolder.trim(), updatedAt: serverTimestamp() }
      await updateDoc(doc(db, 'users', user.uid), { bankDetails }); await refreshProfile(); navigate('/profile', { replace: true })
    } catch (nextError) { setError(errorMessage(nextError, 'Failed to save payment details.')) } finally { setSaving(false) }
  }
  return <><PageHeader eyebrow="Payout destination" title="Bank / UPI details" description="Add the payment destination used for employee withdrawal requests." />{error && <div className="mb-5"><Alert onClose={() => setError('')}>{error}</Alert></div>}<form onSubmit={save} className={`${cardClass} mx-auto max-w-3xl p-5 sm:p-7`}><div className="grid gap-4 sm:grid-cols-2">{[['upi', 'UPI ID', 'Fastest · instant transfer', Smartphone], ['bank', 'Bank account', 'NEFT / IMPS transfer', Landmark]].map(([value, label, description, Icon]) => <button key={value} type="button" onClick={() => setMode(value)} className={`flex items-center gap-4 rounded-2xl border p-4 text-left transition ${mode === value ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-500/10' : 'border-slate-200 hover:bg-slate-50'}`}><span className={`grid size-11 place-items-center rounded-xl ${mode === value ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}><Icon size={20} /></span><span><strong className="block text-sm text-slate-900">{label}</strong><small className="mt-1 block text-xs text-slate-500">{description}</small></span></button>)}</div><div className="mt-7 grid gap-4 sm:grid-cols-2">{mode === 'upi' ? <label className="sm:col-span-2"><span className="mb-2 block text-sm font-bold text-slate-700">UPI ID</span><input name="upiId" value={form.upiId} onChange={change} className={inputClass} placeholder="name@upi" /></label> : <>{[['accountHolder', 'Account holder name'], ['accountNumber', 'Account number'], ['ifscCode', 'IFSC code'], ['bankName', 'Bank name']].map(([name, label]) => <label key={name}><span className="mb-2 block text-sm font-bold text-slate-700">{label}</span><input name={name} value={form[name]} onChange={change} className={`${inputClass} ${name === 'ifscCode' ? 'uppercase' : ''}`} /></label>)}</>}</div><button type="submit" disabled={saving} className={`${primaryButton} mt-7 w-full sm:w-auto`}>{saving ? <LoaderCircle className="animate-spin" size={18} /> : <Save size={18} />}Save payment details</button></form></>
}
