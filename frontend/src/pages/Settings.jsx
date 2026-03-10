import { useContext } from 'react'
import { Link } from 'react-router-dom'
import { ProfileContext } from '../context/ProfileContext.js'

export default function Settings() {
  const { activeProfile } = useContext(ProfileContext)

  return (
    <div>
      <h2>Settings</h2>

      <h3>Profile</h3>
      <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 0.5rem 0' }}>
        Active: <strong style={{ color: 'var(--text-primary)' }}>{activeProfile?.label ?? '—'}</strong>
        {' '}({activeProfile?.robot?.name ?? '—'})
      </p>
      <div className="settings-links">
        <Link to="/profiles">Manage Profiles</Link>
      </div>

      <h3>Audio</h3>
      <div className="settings-links">
        <Link to="/audio-library">Audio Library</Link>
      </div>

      <h3>Admin</h3>
      <div className="settings-links">
        <Link to="/admin">Servo &amp; Bus Config</Link>
      </div>

      <h3>System</h3>
      <div className="settings-links">
        <Link to="/simulation">Simulation</Link>
        <Link to="/debug">Debug</Link>
        <Link to="/shutdown">Shutdown</Link>
      </div>
    </div>
  )
}
