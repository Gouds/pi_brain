import { useState, useEffect, useContext } from 'react'
import { ProfileContext } from '../context/ProfileContext.js'
import { profileAdminGetServos, profileServoOpen, profileServoClose, profileServoMove } from '../api/client.js'

function ServoCard({ servo, pos, setPos }) {
  const [busy, setBusy] = useState(false)

  async function act(fn) {
    if (busy) return
    setBusy(true)
    try {
      const r = await fn().catch(() => null)
      if (r?.position !== undefined) setPos(r.position)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border)',
      borderRadius: '6px',
      padding: '14px',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{servo.name}</span>
        <span style={{
          fontSize: '0.72rem',
          color: 'var(--text-muted)',
          background: 'var(--bg-hover)',
          padding: '2px 7px',
          borderRadius: '3px',
        }}>{servo.bus}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <input
          type="range"
          min={0} max={180}
          value={pos}
          style={{ flex: 1, accentColor: 'var(--accent)' }}
          onChange={e => setPos(Number(e.target.value))}
          onMouseUp={() => act(() => profileServoMove(servo.name, pos))}
          onTouchEnd={() => act(() => profileServoMove(servo.name, pos))}
          disabled={busy}
        />
        <span style={{
          minWidth: '38px',
          textAlign: 'right',
          color: 'var(--text-secondary)',
          fontSize: '0.85rem',
        }}>{pos}°</span>
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={() => act(() => profileServoOpen(servo.name))}
          disabled={busy}
          style={{
            flex: 1,
            padding: '8px',
            background: 'var(--success)',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: busy ? 'not-allowed' : 'pointer',
            opacity: busy ? 0.6 : 1,
            fontWeight: 500,
          }}
        >Open</button>
        <button
          onClick={() => act(() => profileServoClose(servo.name))}
          disabled={busy}
          style={{
            flex: 1,
            padding: '8px',
            background: 'var(--danger)',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: busy ? 'not-allowed' : 'pointer',
            opacity: busy ? 0.6 : 1,
            fontWeight: 500,
          }}
        >Close</button>
      </div>
    </div>
  )
}

export default function Body() {
  const { activeProfile } = useContext(ProfileContext)
  const [servos, setServos] = useState([])
  const [positions, setPositions] = useState({})

  useEffect(() => {
    if (!activeProfile?.id) return
    profileAdminGetServos(activeProfile.id)
      .then(all => {
        const filtered = (Array.isArray(all) ? all : []).filter(s => s.bus === 'body')
        setServos(filtered)
        const init = {}
        filtered.forEach(s => { init[s.name] = s.position ?? s.default_position ?? 90 })
        setPositions(init)
      })
      .catch(() => { setServos([]); setPositions({}) })
  }, [activeProfile?.id])

  function setPos(name, val) {
    setPositions(p => ({ ...p, [name]: val }))
  }

  function openAll() {
    setPositions(p => {
      const next = { ...p }
      servos.forEach(s => { next[s.name] = s.open_position })
      return next
    })
    servos.forEach(s => profileServoOpen(s.name).catch(() => {}))
  }

  function closeAll() {
    setPositions(p => {
      const next = { ...p }
      servos.forEach(s => { next[s.name] = s.close_position })
      return next
    })
    servos.forEach(s => profileServoClose(s.name).catch(() => {}))
  }

  return (
    <div style={{ padding: '16px' }}>
      {servos.length > 0 && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button
            onClick={openAll}
            style={{ padding: '8px 18px', background: 'var(--success)', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 500 }}
          >Open All</button>
          <button
            onClick={closeAll}
            style={{ padding: '8px 18px', background: 'var(--danger)', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 500 }}
          >Close All</button>
        </div>
      )}

      {servos.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)' }}>
          No body servos configured. Go to{' '}
          <a href="#/admin/servos" style={{ color: 'var(--accent)' }}>Admin → Servos</a>
          {' '}and add servos with bus set to <strong>body</strong>.
        </p>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: '12px',
        }}>
          {servos.map((servo, i) => (
            <ServoCard
              key={`${servo.bus}-${servo.id}-${i}`}
              servo={servo}
              pos={positions[servo.name] ?? servo.open_position}
              setPos={val => setPos(servo.name, val)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
