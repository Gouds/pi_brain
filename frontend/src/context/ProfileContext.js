import { createContext } from 'react'

export const ProfileContext = createContext({
  activeProfile: null,
  allProfiles: [],
  userProfiles: [],
  loadingProfiles: true,
  activateProfile: () => {},
  refreshUserProfiles: () => Promise.resolve(),
  wideMode: false,
  toggleWideMode: () => {},
})
