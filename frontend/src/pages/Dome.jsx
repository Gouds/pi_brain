import { useState, useEffect, useRef, useContext } from 'react'
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
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', background: 'var(--bg-hover)', padding: '2px 7px', borderRadius: '3px' }}>
          {servo.group || servo.bus}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <input
          type="range" min={0} max={180} value={pos}
          style={{ flex: 1, accentColor: 'var(--accent)' }}
          onChange={e => setPos(Number(e.target.value))}
          onMouseUp={() => act(() => profileServoMove(servo.name, pos))}
          onTouchEnd={() => act(() => profileServoMove(servo.name, pos))}
          disabled={busy}
        />
        <span style={{ minWidth: '38px', textAlign: 'right', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{pos}°</span>
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={() => act(() => profileServoOpen(servo.name))}
          disabled={busy}
          style={{ flex: 1, padding: '10px', background: 'var(--success)', color: '#fff', border: 'none', borderRadius: '4px', cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? 0.6 : 1, fontWeight: 500, fontSize: '1rem' }}
        >Open</button>
        <button
          onClick={() => act(() => profileServoClose(servo.name))}
          disabled={busy}
          style={{ flex: 1, padding: '10px', background: 'var(--danger)', color: '#fff', border: 'none', borderRadius: '4px', cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? 0.6 : 1, fontWeight: 500, fontSize: '1rem' }}
        >Close</button>
      </div>
    </div>
  )
}

const NAV_BTN = {
  background: 'var(--bg-surface)',
  border: '1px solid var(--border)',
  borderRadius: '6px',
  color: 'var(--text-primary)',
  fontSize: '1.4rem',
  padding: '8px 14px',
  cursor: 'pointer',
  userSelect: 'none',
  flexShrink: 0,
}

export default function Dome() {
  const { activeProfile } = useContext(ProfileContext)
  const [servos, setServos] = useState([])
  const [positions, setPositions] = useState({})
  const [activeTab, setActiveTab] = useState('All')
  const swipeRef = useRef(null)
  const pointerX = useRef(null)

  useEffect(() => {
    if (!activeProfile?.id) return
    profileAdminGetServos(activeProfile.id)
      .then(all => {
        const filtered = (Array.isArray(all) ? all : []).filter(s => s.bus === 'dome')
        setServos(filtered)
        const init = {}
        filtered.forEach(s => { init[s.name] = s.position ?? s.default_position ?? 90 })
        setPositions(init)
      })
      .catch(() => { setServos([]); setPositions({}) })
  }, [activeProfile?.id])

  // Ordered unique groups — "All" always first
  const groups = ['All', ...([...new Set(servos.map(s => s.group).filter(Boolean))])]
  // Servos without a group are only visible under "All"
  const visible = activeTab === 'All' ? servos : servos.filter(s => s.group === activeTab)

  function goTab(dir) {
    const idx = groups.indexOf(activeTab)
    const next = (idx + dir + groups.length) % groups.length
    setActiveTab(groups[next])
  }

  function onPointerDown(e) { pointerX.current = e.clientX }
  function onPointerUp(e) {
    if (pointerX.current === null) return
    const dx = e.clientX - pointerX.current
    pointerX.current = null
    if (Math.abs(dx) < 50) return
    goTab(dx < 0 ? 1 : -1)
  }

  function setPos(name, val) { setPositions(p => ({ ...p, [name]: val })) }

  function openAll() {
    setPositions(p => { const n = { ...p }; visible.forEach(s => { n[s.name] = s.open_position }); return n })
    visible.forEach(s => profileServoOpen(s.name).catch(() => {}))
  }
  function closeAll() {
    setPositions(p => { const n = { ...p }; visible.forEach(s => { n[s.name] = s.close_position }); return n })
    visible.forEach(s => profileServoClose(s.name).catch(() => {}))
  }

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

      {/* Tab bar */}
      {groups.length > 1 && (
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
          {groups.map(g => (
            <button
              key={g}
              onClick={() => setActiveTab(g)}
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                border: '1px solid var(--border)',
                background: activeTab === g ? 'var(--accent)' : 'var(--bg-surface)',
                color: activeTab === g ? '#fff' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontWeight: activeTab === g ? 600 : 400,
                whiteSpace: 'nowrap',
                fontSize: '0.9rem',
              }}
            >{g}</button>
          ))}
        </div>
      )}

      {/* Open All / Close All */}
      {visible.length > 0 && (
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={openAll} style={{ padding: '10px 18px', background: 'var(--success)', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 500 }}>Open All</button>
          <button onClick={closeAll} style={{ padding: '10px 18px', background: 'var(--danger)', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 500 }}>Close All</button>
        </div>
      )}

      {/* Card grid with swipe + arrow nav */}
      {servos.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)' }}>
          No dome servos configured. Go to{' '}
          <a href="#/admin/servos" style={{ color: 'var(--accent)' }}>Admin → Servos</a>
          {' '}and add servos with bus set to <strong>dome</strong>.
        </p>
      ) : (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
          {/* Left arrow */}
          {groups.length > 1 && (
            <button style={NAV_BTN} onClick={() => goTab(-1)}>‹</button>
          )}

          {/* Cards */}
          <div
            ref={swipeRef}
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
            style={{
              flex: 1,
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: '12px',
              touchAction: 'pan-y',
            }}
          >
            {visible.length === 0 && (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No servos in this group.</p>
            )}
            {visible.map((servo, i) => (
              <ServoCard
                key={`${servo.bus}-${servo.id}-${i}`}
                servo={servo}
                pos={positions[servo.name] ?? servo.open_position}
                setPos={val => setPos(servo.name, val)}
              />
            ))}
          </div>

          {/* Right arrow */}
          {groups.length > 1 && (
            <button style={NAV_BTN} onClick={() => goTab(1)}>›</button>
          )}
        </div>
      )}
    </div>
  )
}
