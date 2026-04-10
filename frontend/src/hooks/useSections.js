import { useState, useEffect } from 'react'
import { getSections } from '../api/client.js'

const STORAGE_KEY = 'pi-sections-cache'

// Shared in-memory state so all mounted components update together
const _listeners = new Set()
let _fetching = false

function getStored() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') ?? null } catch { return null }
}

function broadcast(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  _listeners.forEach(fn => fn(data))
}

export function invalidateSections() {
  localStorage.removeItem(STORAGE_KEY)
}

export function refreshSections() {
  _fetching = true
  getSections()
    .then(data => { broadcast(Array.isArray(data) ? data : []) })
    .catch(() => {})
    .finally(() => { _fetching = false })
}

export function useSections() {
  const [sections, setSections] = useState(() => getStored() ?? [])

  useEffect(() => {
    _listeners.add(setSections)
    // Always refresh from server; show stale localStorage data in the meantime
    if (!_fetching) refreshSections()
    return () => { _listeners.delete(setSections) }
  }, [])

  return sections
}
