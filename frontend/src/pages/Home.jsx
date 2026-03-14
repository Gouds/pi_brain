import { useState, useEffect, useContext } from 'react'
import { getHealth, profileGetImageUrl } from '../api/client.js'
import { ProfileContext } from '../context/ProfileContext.js'

function RobotPlaceholder() {
  return (
    <svg
      viewBox="0 0 100 120"
      width="160"
      height="192"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: 'block', margin: '0 auto', opacity: 0.35 }}
    >
      {/* Head */}
      <rect x="28" y="8" width="44" height="34" rx="8" />
      {/* Antenna */}
      <line x1="50" y1="8" x2="50" y2="2" />
      <circle cx="50" cy="1" r="2" fill="currentColor" stroke="none" />
      {/* Eyes */}
      <circle cx="39" cy="25" r="5" />
      <circle cx="61" cy="25" r="5" />
      <circle cx="39" cy="25" r="2" fill="currentColor" stroke="none" />
      <circle cx="61" cy="25" r="2" fill="currentColor" stroke="none" />
      {/* Body */}
      <rect x="18" y="48" width="64" height="52" rx="8" />
      {/* Neck connector */}
      <line x1="50" y1="42" x2="50" y2="48" />
      {/* Arms */}
      <line x1="10" y1="55" x2="18" y2="55" />
      <line x1="82" y1="55" x2="90" y2="55" />
      {/* Chest panel */}
      <rect x="30" y="58" width="40" height="22" rx="4" />
      {/* Legs */}
      <line x1="35" y1="100" x2="35" y2="115" />
      <line x1="65" y1="100" x2="65" y2="115" />
    </svg>
  )
}

export default function Home() {
  const { activeProfile } = useContext(ProfileContext)
  const [status, setStatus] = useState('Checking…')
  const [imgError, setImgError] = useState(false)

  useEffect(() => {
    function check() {
      getHealth()
        .then(() => setStatus('Online'))
        .catch(() => setStatus('Offline'))
    }
    check()
    const id = setInterval(check, 5000)
    return () => clearInterval(id)
  }, [])

  // Reset image error state when profile switches
  useEffect(() => {
    setImgError(false)
  }, [activeProfile?.id])

  const showImage = !activeProfile?.builtin && !imgError

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '8px', gap: '8px', overflow: 'hidden' }}>
      <div style={{ flex: '1 1 0', minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
        {showImage ? (
          <img
            src={profileGetImageUrl(activeProfile?.id)}
            alt={activeProfile?.robot?.name ?? 'Robot'}
            onError={() => setImgError(true)}
            style={{ maxWidth: '100%', maxHeight: '100%', width: 'auto', height: 'auto', borderRadius: 12, display: 'block' }}
          />
        ) : (
          <RobotPlaceholder />
        )}
      </div>
      <h2 style={{ margin: 0 }}>{activeProfile?.robot?.name ?? 'Pi Brain'}</h2>
      <p className="home-status" style={{ margin: 0 }}>
        API Status:{' '}
        <span className={status === 'Online' ? 'status-online' : 'status-offline'}>
          {status}
        </span>
      </p>
      <p style={{ margin: 0 }}>Use the menu to navigate to controls.</p>
    </div>
  )
}
