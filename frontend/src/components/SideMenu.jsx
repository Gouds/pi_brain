import { useContext } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ProfileContext } from '../context/ProfileContext.js'

const TOP_LINKS = [
  { to: '/',       label: 'Home',         feature: 'home' },
  { to: '/dome',   label: 'Dome Control', feature: 'dome' },
  { to: '/body',   label: 'Body Control', feature: 'body' },
  { to: '/audio',  label: 'Audio',        feature: 'audio' },
]

const BOTTOM_LINKS = [
  { to: '/scripts',    label: 'Scripting',  feature: 'scripts' },
  { to: '/simulation', label: 'Simulation' },
  { to: '/settings',   label: 'Settings' },
  { to: '/debug',      label: 'Debug' },
  { to: '/shutdown',   label: 'Shutdown' },
]

function NavLink({ to, label, location }) {
  const isActive = location.pathname === to
  return (
    <li>
      <Link to={to} className={isActive ? 'active' : ''}>
        {label}
      </Link>
    </li>
  )
}

export default function SideMenu({ side, visible }) {
  const location = useLocation()
  const { activeProfile } = useContext(ProfileContext)
  const features = activeProfile?.robot?.features ?? []
  const cls = `sidemenu ${side === 'right' ? 'right' : ''} ${visible ? '' : 'hidden'}`

  const visibleTop = TOP_LINKS.filter(l => !l.feature || features.includes(l.feature))
  const visibleBottom = BOTTOM_LINKS.filter(l => !l.feature || features.includes(l.feature))

  return (
    <nav className={cls}>
      <div className="topmenu">
        <ul>
          {visibleTop.map(link => (
            <NavLink key={link.to} {...link} location={location} />
          ))}
        </ul>
      </div>
      <div className="bottommenu">
        <ul>
          {visibleBottom.map(link => (
            <NavLink key={link.to} {...link} location={location} />
          ))}
        </ul>
      </div>
    </nav>
  )
}
