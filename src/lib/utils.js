// Generate a short, easy-to-read random code for shareable links
export function generateCode(length = 7) {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789' // no 0/o/1/l/i to avoid confusion
  let code = ''
  for (let i = 0; i < length; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

export function formatDateTime(isoString) {
  if (!isoString) return '-'
  const d = new Date(isoString)
  return d.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Normalize short-answer text for comparison (trim, lowercase, collapse spaces)
export function normalizeAnswer(text) {
  return (text || '').trim().toLowerCase().replace(/\s+/g, ' ')
}

