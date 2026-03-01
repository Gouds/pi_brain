import { useContext } from 'react'
import { useLocation } from 'react-router-dom'
import { ProfileContext } from '../context/ProfileContext.js'

function ExpandIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <polyline points="13,3 17,3 17,7" />
      <polyline points="7,17 3,17 3,13" />
      <line x1="17" y1="3" x2="11" y2="9" />
      <line x1="3" y1="17" x2="9" y2="11" />
    </svg>
  )
}

function CompressIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <polyline points="11,9 11,5 15,5" />
      <polyline points="9,11 9,15 5,15" />
      <line x1="11" y1="9" x2="17" y2="3" />
      <line x1="9" y1="11" x2="3" y2="17" />
    </svg>
  )
}

const PAGE_TITLES = {
  '/': 'Home',
  '/dome': 'Dome Control',
  '/body': 'Body Control',
  '/audio': 'Audio',
  '/scripts': 'Scripts',
  '/settings': 'Settings',
  '/debug': 'Debug',
  '/shutdown': 'Shutdown',
  '/profiles': 'Profiles',
  '/admin': 'Admin',
  '/admin/servos': 'Edit Servos',
  '/admin/buses': 'Edit Buses',
}

export default function Header({ onMenuToggle, onVolumeOpen }) {
  const location = useLocation()
  const { activeProfile, wideMode, toggleWideMode } = useContext(ProfileContext)
  const page = PAGE_TITLES[location.pathname] ?? 'Pi Brain'
  const robotName = activeProfile?.robot?.name
  const prefix = robotName && robotName !== 'My Robot' ? robotName : 'Pi Brain'
  const title = `${prefix} — ${page}`

  return (
    <header>
      <div className="leftheader" />
      <div className="header-center">
        <h1>{title}</h1>
      </div>
      <div className="rightheader">
        <a className="header-menu-toggle" onClick={onMenuToggle} title="Toggle Menu">
          <img src="/images/icon_menu.png" width="44" height="44" alt="Toggle Menu" />
        </a>
        <a onClick={onVolumeOpen} title="Volume">
          <img src="/images/icon_volume.png" width="44" height="44" alt="Volume" />
        </a>
        <a onClick={() => window.location.reload()} title="Refresh">
          <img src="/images/icon_refresh.png" width="44" height="44" alt="Refresh Page" />
        </a>
        <a onClick={toggleWideMode} title={wideMode ? 'Compact mode' : 'Wide mode'}>
          {wideMode ? <CompressIcon /> : <ExpandIcon />}
        </a>
      </div>
    </header>
  )
}
