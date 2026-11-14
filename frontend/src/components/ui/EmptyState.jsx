export default function EmptyState({ icon: Icon, title, description, action }) {
  return <div className="flex min-h-56 min-w-0 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white p-5 text-center sm:min-h-64 sm:p-8">
    {Icon && <span className="mb-4 grid size-14 place-items-center rounded-2xl bg-slate-100 text-slate-500"><Icon size={24} /></span>}
    <h3 className="text-base font-bold text-slate-900">{title}</h3>
    {description && <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">{description}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>
}
