import { useContext } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ProfileContext } from '../context/ProfileContext.js'
import { useSections } from '../hooks/useSections.js'

const STATIC_TOP = [
  { to: '/',       label: 'Home',  feature: 'home' },
  { to: '/audio',  label: 'Audio', feature: 'audio' },
  { to: '/lights', label: 'Lights', feature: 'lights' },
]

const BOTTOM_LINKS = [
  { to: '/scripts',    label: 'Scripting',  feature: 'scripts' },
  { to: '/simulation', label: 'Simulation' },
  { to: '/settings',   label: 'Settings' },
  { to: '/debug',      label: 'Debug' },
  { to: '/shutdown',   label: 'Shutdown' },
]

function NavLink({ to, label, location }) {
  const isActive = to === '/'
    ? location.pathname === '/'
    : location.pathname === to || location.pathname.startsWith(to + '/')
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
  const sections = useSections()
  const features = activeProfile?.robot?.features ?? []
  const cls = `sidemenu ${side === 'right' ? 'right' : ''} ${visible ? '' : 'hidden'}`

  const sectionLinks = sections.map(s => ({ to: `/section/${s.id}`, label: s.label }))
  const TOP_LINKS = [STATIC_TOP[0], ...sectionLinks, ...STATIC_TOP.slice(1)]

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
