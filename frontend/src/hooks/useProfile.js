import { useState, useEffect, useCallback } from 'react'
import { BUILTIN_PROFILES } from '../profiles/builtins.js'
import { getProfiles } from '../api/profiles.js'
import { setApiUrl, setProfileId, activateProfileOnBackend } from '../api/client.js'
import { DEFAULT_API_URL } from '../config.js'

export function useProfile() {
  const [userProfiles, setUserProfiles] = useState([])
  const [loadingProfiles, setLoadingProfiles] = useState(true)
  const [activeProfileId, setActiveProfileId] = useState(
    () => localStorage.getItem('pi-active-profile') ?? 'dark'
  )
  const [wideMode, setWideMode] = useState(
    () => localStorage.getItem('pi-wide-mode') === 'true'
  )
  const toggleWideMode = useCallback(() => setWideMode(w => !w), [])

  useEffect(() => {
    if (wideMode) {
      document.body.setAttribute('data-wide', 'true')
    } else {
      document.body.removeAttribute('data-wide')
    }
    localStorage.setItem('pi-wide-mode', String(wideMode))
  }, [wideMode])

  const allProfiles = [...BUILTIN_PROFILES, ...userProfiles]
  const activeProfile =
    allProfiles.find(p => p.id === activeProfileId) ??
    allProfiles.find(p => p.id === 'dark') ??
    BUILTIN_PROFILES[0]

  const refreshUserProfiles = useCallback(() => {
    return getProfiles()
      .then(data => {
        if (Array.isArray(data)) setUserProfiles(data)
      })
      .catch(() => {
        // Backend offline — built-ins still work
      })
      .finally(() => setLoadingProfiles(false))
  }, [])

  // Fetch user profiles on mount
  useEffect(() => {
    refreshUserProfiles()
  }, [refreshUserProfiles])

  // Apply profile: inject CSS vars, set layout attr, update API URL, persist
  useEffect(() => {
    if (!activeProfile) return

    // Inject CSS custom properties
    const vars = Object.entries(activeProfile.colors)
      .map(([k, v]) => `  ${k}: ${v};`)
      .join('\n')
    const css = `:root {\n${vars}\n}\nbody { background: var(--bg-primary); }`
    let styleEl = document.getElementById('pi-profile-vars')
    if (!styleEl) {
      styleEl = document.createElement('style')
      styleEl.id = 'pi-profile-vars'
      document.head.appendChild(styleEl)
    }
    styleEl.textContent = css

    // Set layout attribute
    const layout = activeProfile.layout ?? 'sidebar'
    document.querySelector('.wrapper')?.setAttribute('data-layout', layout)
    document.body.setAttribute('data-layout', layout)

    // Update API URL and profile ID (fall back to auto-detected default)
    setApiUrl(activeProfile.robot.api_url || DEFAULT_API_URL)
    setProfileId(activeProfile.id)
    activateProfileOnBackend(activeProfile.id)

    // Persist active profile ID
    localStorage.setItem('pi-active-profile', activeProfile.id)
  }, [activeProfile])

  const activateProfile = useCallback((id) => {
    setActiveProfileId(id)
  }, [])

  return {
    activeProfile,
    allProfiles,
    userProfiles,
    loadingProfiles,
    activateProfile,
    refreshUserProfiles,
    wideMode,
    toggleWideMode,
  }
}
