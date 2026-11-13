// import { Link } from 'react-router-dom'
// import { Bell, BriefcaseBusiness, CheckCircle2, CircleHelp, CreditCard, Edit3, Mail, MapPin, Settings, ShieldCheck, UserRound } from 'lucide-react'
// import { useAuth } from '../context/AuthContext'
// import { usePlatform } from '../context/PlatformContext'
// import { cardClass, PageHeader, primaryButton, StatusPill } from '../components/ui'
// import { isKycApproved, money, normalizeStatus, profileMissing } from '../shared/utils/format'

// export default function Profile() {
//   const { profile } = useAuth()
//   const platform = usePlatform()
//   const kyc = normalizeStatus(profile.kycStatus || profile.kyc_status, 'unverified')
//   const missing = profileMissing(profile)
//   const details = [
//     ['Employee ID', profile.workerId || 'Not assigned'],
//     ['Email', profile.email || 'Not added'],
//     ['Phone', profile.phone || profile.phoneNumber || 'Not added'],
//     ['Gender', profile.gender || 'Not added'],
//     ['Date of birth', profile.dateOfBirth || 'Not added'],
//     ['Location', [profile.city, profile.state].filter(Boolean).join(', ') || 'Not added'],
//     ['Language', profile.language || 'Not added'],
//     ['Education', profile.education || 'Not added'],
//     ['Experience', profile.experience || 'Not added'],
//     ['Equipment', [profile.deviceType, profile.internetType, profile.headsetAvailable === 'Yes' ? 'Headset' : ''].filter(Boolean).join(' · ') || 'Not added'],
//   ]
//   const actions = [
//     ['/profile/bank', 'Bank / UPI details', CreditCard],
//     ['/profile/kyc', 'KYC verification', ShieldCheck],
//     ['/notifications', 'Notifications', Bell],
//     ['/inbox', 'Inbox', Mail],
//     ['/help', 'Help centre', CircleHelp],
//     ['/settings', 'Settings', Settings],
//   ]
//   return <>
//     <PageHeader eyebrow="Employee identity" title="Profile" description="Review your employee information, verification and account preferences." actions={<Link to="/profile/edit" className={primaryButton}><Edit3 size={18} />Edit profile</Link>} />
//     <section className={`${cardClass} overflow-hidden`}><div className="bg-slate-950 p-6 text-white sm:p-8"><div className="flex flex-col gap-5 sm:flex-row sm:items-center"><span className="grid size-24 shrink-0 place-items-center overflow-hidden rounded-3xl bg-indigo-500 text-3xl font-black">{profile.profileImage || profile.profileImageUrl ? <img src={profile.profileImage || profile.profileImageUrl} alt="" className="size-full object-cover" /> : (profile.fullName || profile.name || 'E')[0]}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-3"><h2 className="truncate text-2xl font-black">{profile.fullName || profile.name || 'Employee'}</h2><StatusPill status={isKycApproved(profile) ? 'verified' : kyc} /></div><p className="mt-2 text-sm text-slate-300">{profile.workerId || 'Employee ID pending'}</p><p className="mt-1 flex items-center gap-1.5 text-sm text-slate-400"><MapPin size={15} />{[profile.city, profile.state].filter(Boolean).join(', ') || 'Location not added'}</p></div>{platform.earningsSystemEnabled && <div className="rounded-2xl bg-white/10 p-4 sm:text-right"><p className="text-xs text-slate-400">Wallet balance</p><strong className="mt-1 block text-xl">{money(profile.walletBalance || profile.earnings)}</strong></div>}</div></div>{missing.length > 0 && <div className="border-b border-amber-200 bg-amber-50 px-6 py-4 text-sm text-amber-900"><strong>Profile incomplete:</strong> {missing.join(', ')}</div>}<div className="grid gap-px bg-slate-200 sm:grid-cols-2 xl:grid-cols-3">{details.map(([label, value]) => <div key={label} className="bg-white p-5"><dt className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</dt><dd className="mt-2 break-words text-sm font-bold text-slate-900">{value}</dd></div>)}</div></section>
//     <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{actions.map(([path, label, Icon]) => <Link key={path} to={path} className={`${cardClass} flex items-center gap-4 p-5 transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md`}><span className="grid size-11 place-items-center rounded-xl bg-indigo-50 text-indigo-600"><Icon size={20} /></span><span className="font-bold text-slate-900">{label}</span></Link>)}</section>
//     <section className={`${cardClass} mt-6 p-6`}><div className="flex items-center gap-3"><BriefcaseBusiness className="text-indigo-600" /><div><h2 className="font-black text-slate-950">Work profile</h2><p className="mt-1 text-sm text-slate-500">{Number(profile.totalTasksCompleted || profile.completedTasks || 0)} completed tasks · {Number(profile.rating || 0).toFixed(1)} rating</p></div><CheckCircle2 className="ml-auto text-emerald-600" /></div></section>
//   </>
// }

import { Link } from 'react-router-dom'
import { Bell, ChevronRight, CircleHelp, CreditCard, Edit3, Mail, MapPin, Settings, ShieldCheck, TriangleAlert } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { usePlatform } from '../context/PlatformContext'
import { cardClass, PageHeader, primaryButton, StatusPill } from '../components/ui'
import { isKycApproved, money, normalizeStatus, profileMissing } from '../shared/utils/format'

export default function Profile() {
  const { profile } = useAuth()
  const platform = usePlatform()
  const kyc = normalizeStatus(profile.kycStatus || profile.kyc_status, 'unverified')
  const missing = profileMissing(profile)
  const name = profile.fullName || profile.name || 'Employee'
  const location = [profile.city, profile.state].filter(Boolean).join(', ')
  const avatar = profile.profileImage || profile.profileImageUrl

  const stats = [
    ['Completed tasks', Number(profile.totalTasksCompleted || profile.completedTasks || 0)],
    ['Rating', Number(profile.rating || 0).toFixed(1)],
    ...(platform.earningsSystemEnabled ? [['Wallet balance', money(profile.walletBalance || profile.earnings)]] : []),
  ]

  const details = [
    ['Employee ID', profile.workerId || 'Not assigned'],
    ['Email', profile.email || 'Not added'],
    ['Phone', profile.phone || profile.phoneNumber || 'Not added'],
    ['Gender', profile.gender || 'Not added'],
    ['Date of birth', profile.dateOfBirth || 'Not added'],
    ['Location', location || 'Not added'],
    ['Language', profile.language || 'Not added'],
    ['Education', profile.education || 'Not added'],
    ['Experience', profile.experience || 'Not added'],
    ['Equipment', [profile.deviceType, profile.internetType, profile.headsetAvailable === 'Yes' ? 'Headset' : ''].filter(Boolean).join(' · ') || 'Not added'],
  ]

  const actions = [
    ['/profile/bank', 'Bank / UPI details', CreditCard],
    ['/profile/kyc', 'KYC verification', ShieldCheck],
    ['/notifications', 'Notifications', Bell],
    ['/inbox', 'Inbox', Mail],
    ['/help', 'Help centre', CircleHelp],
    ['/settings', 'Settings', Settings],
  ]

  return (
    <>
      <PageHeader
        eyebrow="Employee identity"
        title="Profile"
        description="Review your employee information, verification and account preferences."
        actions={<Link to="/profile/edit" className={primaryButton}><Edit3 size={18} />Edit profile</Link>}
      />

      <section className={`${cardClass} overflow-hidden`}>
        {/* Hero */}
        <div className="relative overflow-hidden bg-slate-950 p-6 text-white sm:p-8">
          <div className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-indigo-500/25 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 left-1/3 size-56 rounded-full bg-emerald-500/10 blur-3xl" />

          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
            <span className="grid size-24 shrink-0 place-items-center overflow-hidden rounded-3xl bg-indigo-500 text-4xl font-black uppercase ring-4 ring-white/10">
              {avatar ? <img src={avatar} alt="" className="size-full object-cover" /> : name[0]}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="truncate text-2xl font-black tracking-tight sm:text-3xl">{name}</h2>
                <StatusPill status={isKycApproved(profile) ? 'verified' : kyc} />
              </div>
              <p className="mt-2 text-sm font-semibold text-indigo-200">{profile.workerId || 'Employee ID pending'}</p>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-400"><MapPin size={15} />{location || 'Location not added'}</p>
            </div>
          </div>

          <dl className="relative mt-7 grid divide-x divide-white/10 rounded-2xl bg-white/5 ring-1 ring-white/10" style={{ gridTemplateColumns: `repeat(${stats.length}, minmax(0, 1fr))` }}>
            {stats.map(([label, value]) => (
              <div key={label} className="px-4 py-4 text-center sm:px-6">
                <dt className="text-xs font-semibold text-slate-400">{label}</dt>
                <dd className="mt-1 truncate text-xl font-black sm:text-2xl">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Incomplete notice */}
        {missing.length > 0 && (
          <div className="flex items-start gap-3 border-b border-amber-200 bg-amber-50 px-6 py-4 text-sm text-amber-900">
            <TriangleAlert size={18} className="mt-0.5 shrink-0 text-amber-600" />
            <p className="leading-6"><strong>Profile incomplete:</strong> {missing.join(', ')}</p>
          </div>
        )}

        {/* Details */}
        <div className="p-6 sm:p-8">
          <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600">Personal details</h3>
          <dl className="mt-5 grid gap-x-8 gap-y-6 sm:grid-cols-2 xl:grid-cols-3">
            {details.map(([label, value]) => {
              const empty = value === 'Not added' || value === 'Not assigned'
              return (
                <div key={label} className="min-w-0 border-l-2 border-slate-100 pl-4">
                  <dt className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</dt>
                  <dd className={`mt-1.5 break-words text-sm font-bold ${empty ? 'text-slate-400' : 'text-slate-900'}`}>{value}</dd>
                </div>
              )
            })}
          </dl>
        </div>

        {/* Quick links */}
        <div className="border-t border-slate-200 bg-slate-50/60 p-3 sm:p-4">
          <h3 className="px-3 pb-2 pt-2 text-xs font-bold uppercase tracking-wider text-indigo-600">Account</h3>
          <nav className="grid gap-1 sm:grid-cols-2 xl:grid-cols-3">
            {actions.map(([path, label, Icon]) => (
              <Link key={path} to={path} className="group flex items-center gap-3 rounded-xl p-3 transition hover:bg-white hover:shadow-sm">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-600 transition group-hover:bg-indigo-600 group-hover:text-white"><Icon size={19} /></span>
                <span className="flex-1 text-sm font-bold text-slate-900">{label}</span>
                <ChevronRight size={16} className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-indigo-500" />
              </Link>
            ))}
          </nav>
        </div>
      </section>
    </>
  )
}
