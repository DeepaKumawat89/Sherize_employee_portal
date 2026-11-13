import { AlertCircle, CheckCircle2, X } from 'lucide-react'

export default function Alert({ type = 'error', children, onClose }) {
  const ok = type === 'success'

  return <div className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm ${ok ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800'}`} role="alert">
    {ok ? <CheckCircle2 className="mt-0.5 shrink-0" size={18} /> : <AlertCircle className="mt-0.5 shrink-0" size={18} />}
    <div className="min-w-0 flex-1 leading-6">{children}</div>
    {onClose && <button type="button" onClick={onClose} className="rounded-lg p-1 hover:bg-black/5" aria-label="Dismiss"><X size={16} /></button>}
  </div>
}
