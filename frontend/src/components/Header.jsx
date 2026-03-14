import { useContext, useState, useRef, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ProfileContext } from '../context/ProfileContext.js'
import { useRecording } from '../context/RecordingContext.jsx'

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

function MenuIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <line x1="3" y1="6"  x2="19" y2="6"  />
      <line x1="3" y1="11" x2="19" y2="11" />
      <line x1="3" y1="16" x2="19" y2="16" />
    </svg>
  )
}

function VolumeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="3,8 3,14 7,14 13,18 13,4 7,8" fill="currentColor" stroke="none" />
      <path d="M16,8.5 C17.2,9.8 17.2,12.2 16,13.5" />
      <path d="M18.5,6 C21,8.5 21,13.5 18.5,16" />
    </svg>
  )
}

function RefreshIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19,11 a8,8 0 1,1 -1.5,-4.5" />
      <polyline points="20,3 19,8 14,7" />
    </svg>
  )
}

function RobotIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="6" y="2" width="10" height="8" rx="2" />
      <rect x="3" y="10" width="16" height="9" rx="2" />
      <line x1="11" y1="2" x2="11" y2="0" />
      <circle cx="8.5" cy="6" r="1" fill="currentColor" stroke="none" />
      <circle cx="13.5" cy="6" r="1" fill="currentColor" stroke="none" />
      <line x1="7" y1="14" x2="7" y2="17" />
      <line x1="15" y1="14" x2="15" y2="17" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="19" y1="12" x2="21" y2="12" />
    </svg>
  )
}

function ProfileSwitcher() {
  const { activeProfile, allProfiles, activateProfile } = useContext(ProfileContext)
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  // Only robot profiles (non-builtins) appear in the switcher
  const robotProfiles = allProfiles.filter(p => !p.builtin)

  useEffect(() => {
    if (!open) return
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      <a onClick={() => setOpen(o => !o)} title="Switch Robot" style={{ cursor: 'pointer' }}>
        <RobotIcon />
      </a>
      {open && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          zIndex: 1000,
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: 6,
          minWidth: 180,
          padding: '4px 0',
          boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
        }}>
          {robotProfiles.length === 0 ? (
            <div style={{ padding: '10px 14px', color: 'var(--text-muted)', fontSize: '0.85em' }}>
              No robots yet
            </div>
          ) : (
            robotProfiles.map(p => (
              <div
                key={p.id}
                onClick={() => { activateProfile(p.id); setOpen(false) }}
                style={{
                  padding: '8px 14px',
                  cursor: 'pointer',
                  borderLeft: p.id === activeProfile?.id ? '3px solid var(--accent)' : '3px solid transparent',
                  color: p.id === activeProfile?.id ? 'var(--accent)' : 'var(--text-primary)',
                  background: 'transparent',
                }}
              >
                {p.label}
              </div>
            ))
          )}
          <div
            onClick={() => { setOpen(false); navigate('/profiles') }}
            style={{
              padding: '8px 14px',
              cursor: 'pointer',
              borderTop: '1px solid var(--border)',
              color: 'var(--text-secondary)',
              fontSize: '0.85em',
            }}
          >
            {robotProfiles.length === 0 ? 'Create a robot…' : 'Manage robots…'}
          </div>
        </div>
      )}
    </div>
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
  '/admin/connection': 'Connection',
  '/audio-library': 'Audio Library',
  '/simulation': 'Simulation',
  '/script-editor': 'Script Editor',
}

export default function Header({ onMenuToggle, onVolumeOpen }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { activeProfile, wideMode, toggleWideMode } = useContext(ProfileContext)
  const { isRecording, stop } = useRecording()
  const page = PAGE_TITLES[location.pathname] ?? 'Pi Brain'
  const robotName = activeProfile?.robot?.name
  const prefix = robotName && robotName !== 'My Robot' ? robotName : 'Pi Brain'
  const title = `${prefix} — ${page}`

  function handleStopRecording() {
    stop()
    navigate('/script-editor')
  }

  return (
    <header>
      <div className="leftheader" />
      <div className="header-center">
        <h1>{title}</h1>
      </div>
      <div className="rightheader">
        {isRecording && (
          <a onClick={handleStopRecording} title="Stop recording" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--danger)', animation: 'recpulse 1.2s ease-in-out infinite' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.05em' }}>■ REC</span>
          </a>
        )}
        <a className="header-menu-toggle" onClick={onMenuToggle} title="Toggle Menu">
          <MenuIcon />
        </a>
        <ProfileSwitcher />
        <a onClick={onVolumeOpen} title="Volume">
          <VolumeIcon />
        </a>
        <a onClick={() => window.location.reload()} title="Refresh">
          <RefreshIcon />
        </a>
        <a onClick={toggleWideMode} title={wideMode ? 'Compact mode' : 'Wide mode'}>
          {wideMode ? <CompressIcon /> : <ExpandIcon />}
        </a>
      </div>
    </header>
  )
}
