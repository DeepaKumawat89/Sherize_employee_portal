import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { CheckCircle2, Info, Landmark, LoaderCircle, Save, Smartphone } from 'lucide-react'
import { db } from '../services/firebase'
import { useAuth } from '../context/AuthContext'
import { Alert, cardClass, inputClass, PageHeader, primaryButton } from '../components/ui'
import { errorMessage } from '../shared/utils/format'

const modes = [
  ['upi', 'UPI ID', 'Fastest · instant transfer', Smartphone],
  ['bank', 'Bank account', 'NEFT / IMPS transfer', Landmark],
]

const bankFields = [
  ['accountHolder', 'Account holder name', 'As printed on your bank account', 'sm:col-span-2'],
  ['accountNumber', 'Account number', 'Enter account number', ''],
  ['ifscCode', 'IFSC code', 'e.g. HDFC0001234', ''],
  ['bankName', 'Bank name', 'e.g. HDFC Bank', 'sm:col-span-2'],
]

const labelClass = 'mb-2 block text-sm font-bold text-slate-700'

export default function BankDetails() {
  const { user, profile, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState('upi')
  const [form, setForm] = useState({ upiId: '', accountNumber: '', ifscCode: '', bankName: '', accountHolder: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const bank = profile.bankDetails || {}
    setMode(bank.paymentMode || 'upi')
    setForm((current) => ({ ...current, ...bank }))
  }, [profile])

  const change = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }))

  const save = async (event) => {
    event.preventDefault()
    setError('')
    if (mode === 'upi' && !/^\S+@\S+$/.test(form.upiId.trim())) {
      setError('Enter a valid UPI ID, such as name@upi.')
      return
    }
    if (mode === 'bank' && (!form.accountHolder.trim() || form.accountNumber.trim().length < 9 || !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(form.ifscCode.trim().toUpperCase()) || !form.bankName.trim())) {
      setError('Enter a valid account holder, account number, IFSC code and bank name.')
      return
    }
    setSaving(true)
    try {
      const bankDetails = mode === 'upi'
        ? { paymentMode: 'upi', upiId: form.upiId.trim(), upiVerified: false, updatedAt: serverTimestamp() }
        : { paymentMode: 'bank', accountNumber: form.accountNumber.trim(), ifscCode: form.ifscCode.trim().toUpperCase(), bankName: form.bankName.trim(), accountHolder: form.accountHolder.trim(), updatedAt: serverTimestamp() }
      await updateDoc(doc(db, 'users', user.uid), { bankDetails })
      await refreshProfile()
      navigate('/profile', { replace: true })
    } catch (nextError) {
      setError(errorMessage(nextError, 'Failed to save payment details.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <PageHeader eyebrow="Payout destination" title="Bank / UPI details" description="Add the payment destination used for employee withdrawal requests." />

      {error && <div className="mb-5 mx-auto max-w-3xl"><Alert onClose={() => setError('')}>{error}</Alert></div>}

      <form onSubmit={save} className={`${cardClass} mx-auto max-w-3xl overflow-hidden`}>
        <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 to-indigo-300" />

        <div className="p-4 min-[380px]:p-5 sm:p-8">
          {/* Mode selector */}
          <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">Payment method</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {modes.map(([value, label, description, Icon]) => {
              const selected = mode === value
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setMode(value)}
                  aria-pressed={selected}
                  className={`group relative flex min-w-0 items-center gap-3 rounded-2xl border p-3 text-left transition min-[380px]:gap-4 min-[380px]:p-4 ${selected ? 'border-indigo-500 bg-indigo-50/70 ring-4 ring-indigo-500/10' : 'border-slate-200 hover:border-indigo-200 hover:bg-slate-50'}`}
                >
                  <span className={`grid size-12 shrink-0 place-items-center rounded-xl transition ${selected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-600'}`}><Icon size={21} /></span>
                  <span className="min-w-0 flex-1">
                    <strong className="block text-sm font-black text-slate-900">{label}</strong>
                    <small className="mt-1 block text-xs text-slate-500">{description}</small>
                  </span>
                  {selected && <CheckCircle2 size={20} className="shrink-0 text-indigo-600" />}
                </button>
              )
            })}
          </div>

          {/* Fields */}
          <div className="mt-8 border-t border-slate-100 pt-7">
            <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">{mode === 'upi' ? 'UPI details' : 'Bank account details'}</p>
            <div className="mt-4 grid gap-5 sm:grid-cols-2">
              {mode === 'upi' ? (
                <label className="sm:col-span-2">
                  <span className={labelClass}>UPI ID</span>
                  <input name="upiId" value={form.upiId} onChange={change} className={inputClass} placeholder="name@upi" autoComplete="off" />
                </label>
              ) : (
                bankFields.map(([name, label, placeholder, span]) => (
                  <label key={name} className={span}>
                    <span className={labelClass}>{label}</span>
                    <input
                      name={name}
                      value={form[name]}
                      onChange={change}
                      className={`${inputClass} ${name === 'ifscCode' ? 'uppercase' : ''}`}
                      placeholder={placeholder}
                      inputMode={name === 'accountNumber' ? 'numeric' : undefined}
                      autoComplete="off"
                    />
                  </label>
                ))
              )}
            </div>
          </div>

          <p className="mt-6 flex items-start gap-2.5 rounded-xl bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-500 ring-1 ring-inset ring-slate-100">
            <Info size={15} className="mt-0.5 shrink-0 text-indigo-500" />
            Double-check these details. Withdrawal requests are sent to the destination saved here.
          </p>

          <button type="submit" disabled={saving} className={`${primaryButton} mt-6 w-full sm:w-auto`}>
            {saving ? <LoaderCircle className="animate-spin" size={18} /> : <Save size={18} />}Save payment details
          </button>
        </div>
      </form>
    </>
  )
}
