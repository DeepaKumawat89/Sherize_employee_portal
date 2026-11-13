export function dateValue(value) {
  if (!value) return null
  if (typeof value.toDate === 'function') return value.toDate()
  if (value instanceof Date) return value
  if (typeof value === 'number') return new Date(value)
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export function formatDate(value, options = {}) {
  const date = dateValue(value)
  if (!date) return 'Not recorded'
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...options,
  }).format(date)
}

export function formatDateTime(value) {
  const date = dateValue(value)
  if (!date) return 'Not recorded'
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function money(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(value) || 0)
}

export function errorMessage(error, fallback = 'Something went wrong. Please try again.') {
  const message = error?.message || error?.details || ''
  return String(message).replace(/^Firebase:\s*/i, '').replace(/^\[[^\]]+\]\s*/, '') || fallback
}

export function normalizeStatus(value, fallback = 'pending') {
  return String(value || fallback).trim().toLowerCase()
}

export function profileMissing(profile = {}) {
  const bank = profile.bankDetails || {}
  const paymentReady = (bank.paymentMode || 'upi') === 'upi'
    ? Boolean(String(bank.upiId || '').trim())
    : Boolean(String(bank.accountNumber || '').trim() && String(bank.ifscCode || '').trim())
  return [
    ['Full name', profile.fullName || profile.name],
    ['Email', profile.email],
    ['Phone', profile.phone || profile.phoneNumber],
    ['Gender', profile.gender],
    ['Date of birth', profile.dateOfBirth],
    ['City', profile.city],
    ['Bank / UPI details', paymentReady],
  ].filter(([, value]) => !value || !String(value).trim()).map(([label]) => label)
}

export function isKycApproved(profile = {}) {
  return ['approved', 'verified'].includes(normalizeStatus(profile.kycStatus || profile.kyc_status, 'unverified'))
}

export function imageFileError(file, maxBytes, allowedTypes = ['image/jpeg', 'image/png']) {
  if (!file) return ''
  if (!allowedTypes.includes(file.type)) return 'Choose a JPEG or PNG image.'
  if (file.size >= maxBytes) return `Image size must be less than ${Math.round(maxBytes / 1024 / 1024)} MB.`
  return ''
}
