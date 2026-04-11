import { useContext } from 'react'
import { Link } from 'react-router-dom'
import { ProfileContext } from '../context/ProfileContext.js'

export default function Settings() {
  const { activeProfile, mobileLayout, toggleMobileLayout } = useContext(ProfileContext)

  return (
    <div>
      <h2>Settings</h2>

      <h3>View</h3>
      <div style={{ marginBottom: '0.75rem' }}>
        <button
          onClick={toggleMobileLayout}
          style={{
            padding: '8px 16px',
            background: mobileLayout ? 'var(--btn-primary)' : 'var(--bg-surface)',
            color: mobileLayout ? 'var(--btn-primary-text)' : 'var(--text-secondary)',
            border: '1px solid var(--border-strong)',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
            fontFamily: 'var(--font-ui)',
            fontWeight: 600,
            transition: 'background 0.15s, color 0.15s',
          }}
        >
          {mobileLayout ? 'Mobile View (on)' : 'Mobile View (off)'}
        </button>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
          Switches to a fluid full-screen layout for phone browsers. Saved on this device only.
        </div>
      </div>

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
