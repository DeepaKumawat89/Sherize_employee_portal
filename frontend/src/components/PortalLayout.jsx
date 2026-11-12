import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  Bell,
  BriefcaseBusiness,
  ChevronDown,
  CircleHelp,
  Construction,
  History,
  Home,
  LogOut,
  Mail,
  Menu,
  Settings,
  UserRound,
  WalletCards,
  X,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { usePlatform } from '../context/PlatformContext'

const navigation = [
  ['/', 'Overview', Home],
  ['/tasks', 'Tasks', BriefcaseBusiness],
  ['/task-history', 'Task history', History],
  ['/earnings', 'Earnings', WalletCards],
  ['/inbox', 'Inbox', Mail],
  ['/notifications', 'Notifications', Bell],
  ['/profile', 'Profile', UserRound],
  ['/help', 'Help', CircleHelp],
  ['/settings', 'Settings', Settings],
]

export default function PortalLayout() {
  const { profile, logout } = useAuth()
  const platform = usePlatform()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  const doLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }
  const links = navigation.filter(([path]) => platform.earningsSystemEnabled || path !== '/earnings')

  if (platform.maintenanceMode) {
    return <main className="grid min-h-screen place-items-center bg-slate-50 p-6 text-center"><div className="max-w-lg"><span className="mx-auto grid size-20 place-items-center rounded-3xl bg-rose-50 text-rose-600"><Construction size={38} /></span><h1 className="mt-7 text-3xl font-black tracking-tight text-slate-950">System under maintenance</h1><p className="mt-4 text-base leading-7 text-slate-600">We are currently performing scheduled maintenance to improve your experience. Please check back later.</p><button type="button" onClick={doLogout} className="mt-7 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 hover:bg-slate-100"><LogOut size={18} />Sign out</button></div></main>
  }

  const sidebar = <div className="flex h-full flex-col bg-slate-950 text-white">
    <div className="flex h-20 items-center gap-3 border-b border-white/10 px-5"><span className="grid size-10 place-items-center rounded-xl bg-indigo-500 font-black">S</span><div><strong className="block text-base">Sherize</strong><span className="text-xs text-slate-400">Employee workspace</span></div></div>
    <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">{links.map(([path, label, Icon]) => <NavLink key={path} to={path} end={path === '/'} onClick={() => setMobileOpen(false)} className={({ isActive }) => `flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition ${isActive ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-950/30' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}><Icon size={19} />{label}</NavLink>)}</nav>
    <div className="border-t border-white/10 p-3"><button type="button" onClick={doLogout} className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold text-slate-300 hover:bg-rose-500/15 hover:text-rose-200"><LogOut size={19} />Sign out</button></div>
  </div>

  return <div className="min-h-screen bg-slate-50 text-slate-900">
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 lg:block">{sidebar}</aside>
    {mobileOpen && <div className="fixed inset-0 z-50 lg:hidden"><button type="button" aria-label="Close navigation" className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} /><aside className="relative h-full w-[min(82vw,19rem)]">{sidebar}<button type="button" className="absolute right-3 top-3 rounded-lg p-2 text-slate-300" onClick={() => setMobileOpen(false)}><X size={20} /></button></aside></div>}
    <div className="lg:pl-64">
      <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
        <button type="button" className="rounded-xl border border-slate-200 p-2.5 text-slate-600 lg:hidden" onClick={() => setMobileOpen(true)}><Menu size={20} /></button>
        <div className="hidden sm:block"><p className="text-xs font-semibold text-slate-400">Employee Portal</p><p className="text-sm font-bold text-slate-900">Welcome back, {(profile?.fullName || profile?.name || 'Employee').split(' ')[0]}</p></div>
        <div className="relative ml-auto"><button type="button" onClick={() => setProfileOpen((value) => !value)} className="flex items-center gap-3 rounded-xl p-1.5 hover:bg-slate-100"><span className="grid size-9 place-items-center overflow-hidden rounded-xl bg-indigo-100 text-sm font-black text-indigo-700">{profile?.profileImage || profile?.profileImageUrl ? <img src={profile.profileImage || profile.profileImageUrl} alt="" className="size-full object-cover" /> : (profile?.fullName || profile?.name || 'E')[0]}</span><span className="hidden text-left md:block"><strong className="block max-w-40 truncate text-sm">{profile?.fullName || profile?.name || 'Employee'}</strong><span className="block text-xs text-slate-400">{profile?.workerId || 'Employee'}</span></span><ChevronDown className="hidden text-slate-400 md:block" size={16} /></button>
          {profileOpen && <div className="absolute right-0 top-14 w-52 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl"><button type="button" onClick={() => { navigate('/profile'); setProfileOpen(false) }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold hover:bg-slate-100"><UserRound size={17} />View profile</button><button type="button" onClick={doLogout} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50"><LogOut size={17} />Sign out</button></div>}
        </div>
      </header>
      <main className="mx-auto w-full max-w-[1500px] p-4 sm:p-6 lg:p-8"><Outlet /></main>
    </div>
  </div>
}
