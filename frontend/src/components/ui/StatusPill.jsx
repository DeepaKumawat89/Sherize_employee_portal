export default function StatusPill({ status }) {
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
