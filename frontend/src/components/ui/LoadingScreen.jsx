import { LoaderCircle } from 'lucide-react'

export default function LoadingScreen({ label = 'Loading your workspace…' }) {
  return <div className="grid min-h-screen place-items-center bg-slate-50 px-6"><div className="flex flex-col items-center gap-4 text-slate-600"><LoaderCircle className="animate-spin text-indigo-600" size={30} /><p className="text-sm font-semibold">{label}</p></div></div>
}
