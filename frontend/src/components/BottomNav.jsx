import { useContext } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ProfileContext } from '../context/ProfileContext.js'

/* ---- Inline SVG icons ---- */

function HomeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z"/>
      <polyline points="9,21 9,13 15,13 15,21"/>
    </svg>
  )
}

function DomeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 18A7 7 0 0 1 19 18"/>
      <line x1="3" y1="18" x2="21" y2="18"/>
      <line x1="12" y1="11" x2="12" y2="18"/>
    </svg>
  )
}

function BodyIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="7" y="9" width="10" height="10" rx="1"/>
      <rect x="9" y="5" width="6" height="4" rx="0.5"/>
      <line x1="4" y1="12" x2="7" y2="12"/>
      <line x1="4" y1="15" x2="7" y2="15"/>
      <line x1="17" y1="12" x2="20" y2="12"/>
      <line x1="17" y1="15" x2="20" y2="15"/>
    </svg>
  )
}

function AudioIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11,5 6,9 2,9 2,15 6,15 11,19"/>
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
    </svg>
  )
}

function ScriptsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="6,4 20,12 6,20"/>
    </svg>
  )
}

function LightsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4"/>
      <line x1="12" y1="2" x2="12" y2="5"/>
      <line x1="12" y1="19" x2="12" y2="22"/>
      <line x1="4.22" y1="4.22" x2="6.34" y2="6.34"/>
      <line x1="17.66" y1="17.66" x2="19.78" y2="19.78"/>
      <line x1="2" y1="12" x2="5" y2="12"/>
      <line x1="19" y1="12" x2="22" y2="12"/>
      <line x1="4.22" y1="19.78" x2="6.34" y2="17.66"/>
      <line x1="17.66" y1="6.34" x2="19.78" y2="4.22"/>
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
    </svg>
  )
}

/* ---- Nav items ---- */

const NAV_ITEMS = [
  { to: '/',         label: 'Home',     Icon: HomeIcon,     feature: 'home' },
  { to: '/dome',     label: 'Dome',     Icon: DomeIcon,     feature: 'dome' },
  { to: '/body',     label: 'Body',     Icon: BodyIcon,     feature: 'body' },
  { to: '/audio',    label: 'Audio',    Icon: AudioIcon,    feature: 'audio' },
  { to: '/scripts',  label: 'Scripts',  Icon: ScriptsIcon,  feature: 'scripts' },
  { to: '/lights',   label: 'Lights',   Icon: LightsIcon,   feature: 'lights' },
  { to: '/settings', label: 'Settings', Icon: SettingsIcon },
]

// Routes that should highlight the Settings tab
const SETTINGS_ROUTES = ['/settings', '/admin', '/debug', '/shutdown', '/profiles']

export default function BottomNav() {
  const location = useLocation()
  const { activeProfile } = useContext(ProfileContext)
  const features = activeProfile?.robot?.features ?? []

  const visibleItems = NAV_ITEMS.filter(item => !item.feature || features.includes(item.feature))

  function isActive(to) {
    if (to === '/') return location.pathname === '/'
    if (to === '/settings') {
      return SETTINGS_ROUTES.some(r =>
        location.pathname === r || location.pathname.startsWith(r + '/')
      )
    }
    return location.pathname === to || location.pathname.startsWith(to + '/')
  }

  return (
    <nav className="bottom-nav">
      {visibleItems.map(({ to, label, Icon }) => (
        <Link key={to} to={to} className={isActive(to) ? 'active' : ''}>
          <Icon />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  )
}
