const LS_KEY = 'pi-api-url'

export function normalizeApiUrl(url) {
  if (!url) return url
  if (/^https?:\/\//.test(url)) return url
  return `http://${url}`
}

function resolveDefaultApiUrl() {
  // 1. localStorage manual override
  const stored = localStorage.getItem(LS_KEY)
  if (stored) return normalizeApiUrl(stored)

  // 2. Auto-detect: same hostname the frontend was loaded from, port 8000
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    return `http://${window.location.hostname}:8000`
  }

  // 3. Dev fallback
  return import.meta.env.VITE_API_URL ?? 'http://localhost:8000'
}

export const DEFAULT_API_URL = resolveDefaultApiUrl()
