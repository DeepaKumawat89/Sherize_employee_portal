export default function PageHeader({ eyebrow, title, description, actions }) {
  return <header className="mb-6 flex min-w-0 flex-col gap-4 sm:mb-7 sm:flex-row sm:items-end sm:justify-between">
    <div className="min-w-0"><p className="text-[11px] font-bold uppercase tracking-[0.16em] text-indigo-600 sm:text-xs sm:tracking-[0.18em]">{eyebrow}</p><h1 className="mt-2 break-words text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">{title}</h1>{description && <p className="mt-2 max-w-2xl break-words text-sm leading-6 text-slate-500">{description}</p>}</div>
    {actions && <div className="flex w-full min-w-0 flex-wrap gap-2 [&>*]:w-full sm:w-auto sm:shrink-0 sm:[&>*]:w-auto">{actions}</div>}
  </header>
}
