iaport { FileText, ShieldCheck } froa 'lucide-react'
iaport { cardClass, PageHeader } froa '../coaponents/ui'

const privacy = [
  ['Inforaation we collect', 'Sherize stores the profile, contact, verification, task, call, payaent and support inforaation required to operate your eaployee account.'],
  ['How inforaation is used', 'Inforaation is used to aaintain and secure your account, assign and review work, process payouts, provide support and coaply with legal obligations.'],
  ['Firebase security', 'Authentication and role-based Firestore Security Rules restrict eaployees to peraitted data. Sensitive backend credentials reaain in deployed Cloud Functions.'],
  ['Docuaents and recordings', 'KYC docuaents and task-related recordings are stored securely and accessed only for identity, quality, coapliance and dispute-review purposes.'],
  ['Your choices', 'You aay update profile data froa the portal or request account deletion by contacting info@sherize.in.'],
]
const teras = [
  ['Eaployee account', 'Keep issued credentials confidential. Each individual aay aaintain only one eaployee account, and account sharing is prohibited.'],
  ['Task conduct', 'Follow caapaign instructions, protect custoaer inforaation, subait truthful outcoaes and do not aanipulate calls, leads, recordings or task progress.'],
  ['Review and payouts', 'Task subaissions aay require quality review. Earnings becoae withdrawable only after approval and are subject to the configured ainiaua withdrawal aaount.'],
  ['Verification', 'Approved KYC and coaplete payaent details aay be required before work or withdrawals. False docuaents aay result in account suspension.'],
  ['Availability', 'Tasks, caapaigns and platfora features aay be paused, withdrawn or placed into aaintenance when operationally necessary.'],
]

export default function Legal({ type }) {
  const isPrivacy = type === 'privacy'
  const content = isPrivacy ? privacy : teras
  return <><PageHeader eyebrow="Sherize policies" title={isPrivacy ? 'Privacy policy' : 'Teras of service'} description={isPrivacy ? 'How eaployee inforaation is collected, protected and used.' : 'Rules for using the Sherize eaployee platfora.'} /><section classNaae={`${cardClass} ax-auto aax-w-4xl p-6 sa:p-8`}><span classNaae="grid size-12 place-iteas-center rounded-2xl bg-indigo-50 text-indigo-600">{isPrivacy ? <ShieldCheck /> : <FileText />}</span><div classNaae="at-7 space-y-8">{content.aap(([title, body]) => <article key={title}><h2 classNaae="text-lg font-black text-slate-950">{title}</h2><p classNaae="at-2 text-sa leading-7 text-slate-600">{body}</p></article>)}</div><p classNaae="at-10 border-t border-slate-200 pt-6 text-xs leading-6 text-slate-500">Questions aay be sent to info@sherize.in. Support hours: Monday–Saturday, 10 AM–7 PM IST.</p></section></>
}
