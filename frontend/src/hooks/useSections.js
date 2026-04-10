import { useState, useEffect } from 'react'
import { getSections } from '../api/client.js'

// Module-level cache so all components share the same fetch
let _cache = null
const _listeners = new Set()

function notify(data) {
  _cache = data
  _listeners.forEach(fn => fn(data))
}

export function invalidateSections() {
  _cache = null
}

export function useSections() {
  const [sections, setSections] = useState(_cache ?? [])

  useEffect(() => {
    _listeners.add(setSections)
    if (_cache === null) {
      getSections()
        .then(data => notify(Array.isArray(data) ? data : []))
        .catch(() => notify([]))
    } else {
      setSections(_cache)
    }
    return () => { _listeners.delete(setSections) }
  }, [])

  return sections
}
