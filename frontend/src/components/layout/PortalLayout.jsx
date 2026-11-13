import { useState } from 'react'
import { createPortal } from 'react-dom'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  Bell,
  AlertTriangle,
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
import { useAuth } from '../../context/AuthContext'
import { usePlatform } from '../../context/PlatformContext'

const navigation = [
  ['/', 'Overview', Home],
  ['/tasks', 'Tasks', BriefcaseBusiness],
  ['/task-history', 'Task history', History],
  ['/earnings', 'Earnings', WalletCards],
  ['/inbox', 'Inbox', Mail],
  ['/notifications', 'Notifications', Bell],
  ['/help', 'Help', CircleHelp],
]

export default function PortalLayout() {
  const { profile, logout } = useAuth()
  const platform = usePlatform()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  const doLogout = async () => {
    await logout()
    setShowLogoutConfirm(false)
    navigate('/login', { replace: true })
  }
  const links = navigation.filter(([path]) => platform.earningsSystemEnabled || path !== '/earnings')

  if (platform.maintenanceMode) {
    return <main className="grid min-h-screen place-items-center bg-slate-50 p-6 text-center"><div className="max-w-lg"><span className="mx-auto grid size-20 place-items-center rounded-3xl bg-rose-50 text-rose-600"><Construction size={38} /></span><h1 className="mt-7 text-3xl font-black tracking-tight text-slate-950">System under maintenance</h1><p className="mt-4 text-base leading-7 text-slate-600">We are currently performing scheduled maintenance to improve your experience. Please check back later.</p><button type="button" onClick={doLogout} className="mt-7 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 hover:bg-slate-100"><LogOut size={18} />Sign out</button></div></main>
  }

  const sidebar = <div className="flex h-full flex-col overflow-hidden rounded-r-[28px] border-r border-[#d5dce6] bg-[linear-gradient(180deg,#f8fafc_0%,#eef2f7_62%,#e8edf3_100%)] text-text-main shadow-[12px_0_36px_rgba(23,36,58,0.08)]">
    <div className="relative mx-3 mt-3 flex items-center gap-3 rounded-2xl border border-white/80 bg-white/75 px-3 pb-5 pt-4 shadow-[0_6px_18px_rgba(23,36,58,0.05)]">
      <button type="button" onClick={() => setMobileOpen(false)} className="absolute right-3 top-3 grid size-9 place-items-center rounded-xl text-text-muted hover:bg-white hover:text-text-main lg:hidden" aria-label="Close navigation panel"><X size={19} /></button>
      <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-white text-xl font-extrabold text-primary shadow-sm">S</span>
      <div className="min-w-0"><p className="text-lg font-bold leading-tight text-text-main">Sherize</p><p className="mt-1 whitespace-nowrap text-[9px] font-bold uppercase tracking-[0.14em] text-primary">Employee Portal</p></div>
    </div>
    <p className="mb-2 mt-6 px-5 text-[10px] font-bold uppercase tracking-[0.18em] text-text-light">Workspace</p>
    <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 pb-4" aria-label="Employee navigation">{links.map(([path, label, Icon]) => <NavLink key={path} to={path} end={path === '/'} onClick={() => setMobileOpen(false)} className={({ isActive }) => `group flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm transition duration-200 ${isActive ? 'bg-white font-semibold text-text-main shadow-[0_6px_14px_rgba(23,36,58,0.08),inset_3px_0_0_var(--color-primary)]' : 'font-medium text-text-muted hover:translate-x-0.5 hover:bg-white/80 hover:text-text-main'}`}><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/55 text-text-muted transition group-hover:bg-primary-soft group-hover:text-primary"><Icon size={18} /></span><span className="truncate">{label}</span></NavLink>)}</nav>
    <div className="border-t border-[#d5dce6] bg-white/35 p-3">
      <NavLink to="/profile" onClick={() => setMobileOpen(false)} className={({ isActive }) => `mb-1 flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition ${isActive ? 'bg-white font-semibold text-text-main shadow-sm' : 'font-medium text-text-muted hover:bg-white/80 hover:text-text-main'}`}><UserRound size={20} /><span>My Profile</span></NavLink>
      <NavLink to="/settings" onClick={() => setMobileOpen(false)} className={({ isActive }) => `mb-1 flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition ${isActive ? 'bg-white font-semibold text-text-main shadow-sm' : 'font-medium text-text-muted hover:bg-white/80 hover:text-text-main'}`}><Settings size={20} /><span>Settings</span></NavLink>
      <button type="button" onClick={() => setShowLogoutConfirm(true)} className="flex w-full items-center gap-3 rounded-xl border border-rose-200 bg-white px-4 py-3 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"><LogOut size={20} />Logout</button>
    </div>
  </div>

  return <div className="min-h-screen bg-background text-text-main">
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[var(--sidebar-width)] lg:block">{sidebar}</aside>
    <button type="button" aria-label="Close navigation" onClick={() => setMobileOpen(false)} className={`fixed inset-0 z-40 bg-[rgba(15,23,42,0.42)] backdrop-blur-sm transition-opacity lg:hidden ${mobileOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`} />
    <aside className={`fixed inset-y-0 left-0 z-50 w-[min(82vw,var(--sidebar-width))] transition-transform duration-300 lg:hidden ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>{sidebar}</aside>
    <div className="lg:pl-[var(--sidebar-width)]">
      <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
        <button type="button" className="rounded-xl border border-border bg-white p-2.5 text-text-muted shadow-sm hover:bg-primary-soft hover:text-primary lg:hidden" onClick={() => setMobileOpen(true)}><Menu size={20} /></button>
        <div className="hidden sm:block"><p className="text-xs font-semibold text-slate-400">Employee Portal</p><p className="text-sm font-bold text-slate-900">Welcome back, {(profile?.fullName || profile?.name || 'Employee').split(' ')[0]}</p></div>
        <div className="relative ml-auto"><button type="button" onClick={() => setProfileOpen((value) => !value)} className="flex items-center gap-3 rounded-xl p-1.5 hover:bg-primary-soft"><span className="grid size-9 place-items-center overflow-hidden rounded-xl bg-primary-soft text-sm font-black text-primary">{profile?.profileImage || profile?.profileImageUrl ? <img src={profile.profileImage || profile.profileImageUrl} alt="" className="size-full object-cover" /> : (profile?.fullName || profile?.name || 'E')[0]}</span><span className="hidden text-left md:block"><strong className="block max-w-40 truncate text-sm">{profile?.fullName || profile?.name || 'Employee'}</strong><span className="block text-xs text-text-light">{profile?.workerId || 'Employee'}</span></span><ChevronDown className="hidden text-text-light md:block" size={16} /></button>
          {profileOpen && <div className="absolute right-0 top-14 w-52 rounded-2xl border border-border bg-white p-2 shadow-xl"><button type="button" onClick={() => { navigate('/profile'); setProfileOpen(false) }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold hover:bg-primary-soft"><UserRound size={17} />View profile</button><button type="button" onClick={() => { setProfileOpen(false); setShowLogoutConfirm(true) }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50"><LogOut size={17} />Sign out</button></div>}
        </div>
      </header>
      <main className="mx-auto w-full max-w-[1500px] p-4 sm:p-6 lg:p-8"><Outlet /></main>
    </div>
    {showLogoutConfirm && createPortal(<div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[rgba(15,23,42,0.55)] p-5 backdrop-blur-sm" onClick={(event) => { if (event.target === event.currentTarget) setShowLogoutConfirm(false) }}><div role="alertdialog" aria-modal="true" aria-labelledby="employee-logout-title" className="w-full max-w-[420px] rounded-[24px] border border-white/70 bg-white p-6 shadow-elevated"><div className="mb-5 flex items-start justify-between gap-4"><span className="grid size-12 place-items-center rounded-2xl bg-rose-50 text-rose-600"><AlertTriangle size={23} /></span><button type="button" aria-label="Close logout confirmation" onClick={() => setShowLogoutConfirm(false)} className="grid size-9 place-items-center rounded-xl border border-border bg-white text-text-muted hover:bg-background hover:text-text-main"><X size={18} /></button></div><h2 id="employee-logout-title" className="mb-2 text-xl font-bold text-text-main">Logout from your account?</h2><p className="mb-6 text-sm leading-6 text-text-muted">You will need to sign in again to access the employee portal.</p><div className="flex justify-end gap-3 max-sm:flex-col-reverse"><button type="button" onClick={() => setShowLogoutConfirm(false)} className="inline-flex min-h-10 items-center justify-center rounded-xl border border-border bg-white px-5 py-2.5 text-sm font-semibold text-text-main hover:bg-background max-sm:w-full">Cancel</button><button type="button" onClick={doLogout} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 max-sm:w-full"><LogOut size={16} />Yes, logout</button></div></div></div>, document.body)}
  </div>
}
