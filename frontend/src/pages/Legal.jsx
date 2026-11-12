import { FileText, ShieldCheck } from 'lucide-react'
import { cardClass, PageHeader } from '../components/ui'

const privacy = [
  ['Information we collect', 'Sherize stores the profile, contact, verification, task, call, payment and support information required to operate your employee account.'],
  ['How information is used', 'Information is used to maintain and secure your account, assign and review work, process payouts, provide support and comply with legal obligations.'],
  ['Firebase security', 'Authentication and role-based Firestore Security Rules restrict employees to permitted data. Sensitive backend credentials remain in deployed Cloud Functions.'],
  ['Documents and recordings', 'KYC documents and task-related recordings are stored securely and accessed only for identity, quality, compliance and dispute-review purposes.'],
  ['Your choices', 'You may update profile data from the portal or request account deletion by contacting info@sherize.in.'],
]
const terms = [
  ['Employee account', 'Keep issued credentials confidential. Each individual may maintain only one employee account, and account sharing is prohibited.'],
  ['Task conduct', 'Follow campaign instructions, protect customer information, submit truthful outcomes and do not manipulate calls, leads, recordings or task progress.'],
  ['Review and payouts', 'Task submissions may require quality review. Earnings become withdrawable only after approval and are subject to the configured minimum withdrawal amount.'],
  ['Verification', 'Approved KYC and complete payment details may be required before work or withdrawals. False documents may result in account suspension.'],
  ['Availability', 'Tasks, campaigns and platform features may be paused, withdrawn or placed into maintenance when operationally necessary.'],
]

export default function Legal({ type }) {
  const isPrivacy = type === 'privacy'
  const content = isPrivacy ? privacy : terms
  return <><PageHeader eyebrow="Sherize policies" title={isPrivacy ? 'Privacy policy' : 'Terms of service'} description={isPrivacy ? 'How employee information is collected, protected and used.' : 'Rules for using the Sherize employee platform.'} /><section className={`${cardClass} mx-auto max-w-4xl p-6 sm:p-8`}><span className="grid size-12 place-items-center rounded-2xl bg-indigo-50 text-indigo-600">{isPrivacy ? <ShieldCheck /> : <FileText />}</span><div className="mt-7 space-y-8">{content.map(([title, body]) => <article key={title}><h2 className="text-lg font-black text-slate-950">{title}</h2><p className="mt-2 text-sm leading-7 text-slate-600">{body}</p></article>)}</div><p className="mt-10 border-t border-slate-200 pt-6 text-xs leading-6 text-slate-500">Questions may be sent to info@sherize.in. Support hours: Monday–Saturday, 10 AM–7 PM IST.</p></section></>
}
