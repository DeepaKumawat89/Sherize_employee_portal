import { AlertCircle, CheckCircle2, LoaderCircle, X } from 'lucide-react'

export function LoadingScreen({ label = 'Loading your workspace…' }) {
  return <div className="grid min-h-screen place-items-center bg-slate-50 px-6"><div className="flex flex-col items-center gap-4 text-slate-600"><LoaderCircle className="animate-spin text-indigo-600" size={30} /><p className="text-sm font-semibold">{label}</p></div></div>
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return <div className="flex min-h-64 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center">
    {Icon && <span className="mb-4 grid size-14 place-items-center rounded-2xl bg-slate-100 text-slate-500"><Icon size={24} /></span>}
    <h3 className="text-base font-bold text-slate-900">{title}</h3>
    {description && <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">{description}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>
}

export function Alert({ type = 'error', children, onClose }) {
  const ok = type === 'success'
  return <div className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm ${ok ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800'}`} role="alert">
    {ok ? <CheckCircle2 className="mt-0.5 shrink-0" size={18} /> : <AlertCircle className="mt-0.5 shrink-0" size={18} />}
    <div className="min-w-0 flex-1 leading-6">{children}</div>
    {onClose && <button type="button" onClick={onClose} className="rounded-lg p-1 hover:bg-black/5" aria-label="Dismiss"><X size={16} /></button>}
  </div>
}

export function PageHeader({ eyebrow, title, description, actions }) {
  return <header className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">{eyebrow}</p><h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">{title}</h1>{description && <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{description}</p>}</div>
    {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
  </header>
}

export function StatusPill({ status }) {
  const value = String(status || 'pending').toLowerCase()
  const colors = value.includes('approv') || value.includes('complete') || value === 'active' || value === 'open'
    ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
    : value.includes('reject') || value.includes('fail') || value.includes('cancel') || value.includes('expired')
      ? 'bg-rose-50 text-rose-700 ring-rose-200'
      : value.includes('progress') || value.includes('review') || value.includes('pending')
        ? 'bg-amber-50 text-amber-700 ring-amber-200'
        : 'bg-slate-100 text-slate-600 ring-slate-200'
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold capitalize ring-1 ring-inset ${colors}`}>{value.replaceAll('_', ' ')}</span>
}

export const primaryButton = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50'
export const secondaryButton = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50'
export const inputClass = 'min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 disabled:bg-slate-100'
export const cardClass = 'rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)]'
