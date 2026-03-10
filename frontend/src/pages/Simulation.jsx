import { useState, useEffect, useContext, useRef, useCallback } from 'react'
import { ProfileContext } from '../context/ProfileContext.js'
import {
  profileAdminGetBuses,
  profileAdminGetServos,
  profileServoOpen,
  profileServoClose,
  profileServoMove,
} from '../api/client.js'

// ── Servo Gauge ───────────────────────────────────────────────────────────────
// Semicircle arc (flat side down). 0° = left, 90° = up, 180° = right.

function ServoGauge({ position, openPos, closePos }) {
  const cx = 54, cy = 54, r = 42

  function toPoint(deg) {
    const clamped = Math.max(0, Math.min(180, deg))
    const rad = ((180 - clamped) * Math.PI) / 180
    return { x: cx + r * Math.cos(rad), y: cy - r * Math.sin(rad) }
  }

  const arc = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`
  const needle = toPoint(position ?? 90)
  const oMark = openPos !== undefined ? toPoint(openPos) : null
  const cMark = closePos !== undefined ? toPoint(closePos) : null

  return (
    <svg width="108" height="70" viewBox="0 0 108 70">
      {/* Track */}
      <path d={arc} stroke="var(--border)" strokeWidth="5" fill="none" strokeLinecap="round" />

      {/* Filled arc up to current position */}
      {(() => {
        const pos = Math.max(0, Math.min(180, position ?? 90))
        const startRad = Math.PI         // 0°  → left
        const endRad = ((180 - pos) * Math.PI) / 180
        // Draw arc from left (0°) to needle angle
        const x1 = cx + r * Math.cos(startRad)
        const y1 = cy - r * Math.sin(startRad)
        const x2 = cx + r * Math.cos(endRad)
        const y2 = cy - r * Math.sin(endRad)
        const largeArc = pos > 90 ? 0 : 1
        return (
          <path
            d={`M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`}
            stroke="var(--accent)"
            strokeWidth="5"
            fill="none"
            strokeLinecap="round"
            opacity="0.35"
          />
        )
      })()}

      {/* Open position marker */}
      {oMark && (
        <circle cx={oMark.x} cy={oMark.y} r="4" fill="var(--accent)" />
      )}

      {/* Close position marker */}
      {cMark && (
        <circle cx={cMark.x} cy={cMark.y} r="4" fill="var(--danger)" />
      )}

      {/* Needle */}
      <line
        x1={cx} y1={cy}
        x2={needle.x} y2={needle.y}
        stroke="var(--text-primary)" strokeWidth="2.5" strokeLinecap="round"
      />

      {/* Pivot */}
      <circle cx={cx} cy={cy} r="5" fill="var(--text-primary)" />
      <circle cx={cx} cy={cy} r="2.5" fill="var(--bg-surface)" />

      {/* Angle label */}
      <text
        x={cx} y={cy + 15}
        textAnchor="middle" fontSize="11"
        fill="var(--text-secondary)" fontFamily="monospace"
      >{position ?? 90}°</text>
    </svg>
  )
}

// ── Servo Card ────────────────────────────────────────────────────────────────

function ServoCard({ servo, onUpdate }) {
  const [pos, setPos] = useState(servo.position ?? servo.default_position ?? 90)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (servo.position !== undefined) setPos(servo.position)
  }, [servo.position])

  async function act(fn) {
    if (busy) return
    setBusy(true)
    try {
      const result = await fn().catch(() => null)
      if (result?.position !== undefined) {
        setPos(result.position)
        onUpdate?.()
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border)',
      borderRadius: 8,
      padding: '14px 12px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 8,
      width: 148,
    }}>
      <span style={{
        fontWeight: 600,
        fontSize: '0.82rem',
        color: 'var(--text-primary)',
        textAlign: 'center',
        width: '100%',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>{servo.name}</span>

      <ServoGauge
        position={pos}
        openPos={servo.open_position}
        closePos={servo.close_position}
      />

      <input
        type="range" min={0} max={180} value={pos}
        style={{ width: '100%', accentColor: 'var(--accent)' }}
        onChange={e => setPos(Number(e.target.value))}
        onMouseUp={() => act(() => profileServoMove(servo.name, pos))}
        onTouchEnd={() => act(() => profileServoMove(servo.name, pos))}
        disabled={busy}
      />

      <div style={{ display: 'flex', gap: 6, width: '100%' }}>
        <button
          onClick={() => act(() => profileServoOpen(servo.name))}
          disabled={busy}
          style={{
            flex: 1, padding: '6px 0',
            background: 'var(--accent)', color: '#fff',
            border: 'none', borderRadius: 4,
            cursor: busy ? 'not-allowed' : 'pointer',
            opacity: busy ? 0.6 : 1,
            fontSize: '0.78rem', fontWeight: 600,
          }}
        >Open</button>
        <button
          onClick={() => act(() => profileServoClose(servo.name))}
          disabled={busy}
          style={{
            flex: 1, padding: '6px 0',
            background: 'var(--danger)', color: '#fff',
            border: 'none', borderRadius: 4,
            cursor: busy ? 'not-allowed' : 'pointer',
            opacity: busy ? 0.6 : 1,
            fontSize: '0.78rem', fontWeight: 600,
          }}
        >Close</button>
      </div>

      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', gap: 8 }}>
        <span title="Open position" style={{ color: 'var(--accent)' }}>● {servo.open_position ?? '—'}°</span>
        <span title="Close position" style={{ color: 'var(--danger)' }}>● {servo.close_position ?? '—'}°</span>
      </div>
    </div>
  )
}

// ── Topology Diagram ──────────────────────────────────────────────────────────

function TopologyDiagram({ buses, servos }) {
  const busGroups = buses.map(b => ({
    ...b,
    servos: servos.filter(s => s.bus === b.name),
  }))

  const ROW_H = 70
  const BUS_W = 130, BUS_H = 58
  const TAG_H = 18, TAG_W = 170
  const totalRows = buses.length
  const HEIGHT = Math.max(100, totalRows * ROW_H + 20)
  const PI_H = Math.max(70, totalRows * ROW_H - 10)
  const PI_X = 10, PI_Y = (HEIGHT - PI_H) / 2
  const PI_W = 72
  const BUS_X = 110
  const TAG_X = BUS_X + BUS_W + 18

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${TAG_X + TAG_W + 16} ${HEIGHT}`}
      style={{ minWidth: 460 }}
    >
      {/* Pi block */}
      <rect x={PI_X} y={PI_Y} width={PI_W} height={PI_H} rx="8"
        fill="var(--bg-secondary)" stroke="var(--accent)" strokeWidth="2" />
      <text x={PI_X + PI_W / 2} y={PI_Y + PI_H / 2 - 8} textAnchor="middle" fontSize="12" fontWeight="700" fill="var(--accent)">RPi</text>
      <text x={PI_X + PI_W / 2} y={PI_Y + PI_H / 2 + 6} textAnchor="middle" fontSize="9" fill="var(--text-muted)">Raspberry Pi</text>
      <text x={PI_X + PI_W / 2} y={PI_Y + PI_H / 2 + 18} textAnchor="middle" fontSize="8" fill="var(--text-muted)">I2C Host</text>

      {busGroups.map((bus, bi) => {
        const busY = bi * ROW_H + (HEIGHT - totalRows * ROW_H) / 2 + (ROW_H - BUS_H) / 2
        const busMidY = busY + BUS_H / 2
        const piMidY = PI_Y + PI_H / 2

        // Connector: Pi right edge → bus left edge
        const piRX = PI_X + PI_W
        const busLX = BUS_X

        // Servo tag positions
        const tagCount = bus.servos.length
        const tagGroupH = tagCount * (TAG_H + 4) - 4
        const tagStartY = busMidY - tagGroupH / 2

        return (
          <g key={bus.name}>
            {/* Pi → Bus cubic bezier */}
            <path
              d={`M ${piRX} ${piMidY} C ${(piRX + busLX) / 2} ${piMidY} ${(piRX + busLX) / 2} ${busMidY} ${busLX} ${busMidY}`}
              stroke="var(--border)" strokeWidth="1.5" fill="none"
            />

            {/* Bus block */}
            <rect x={BUS_X} y={busY} width={BUS_W} height={BUS_H} rx="6"
              fill="var(--bg-secondary)" stroke="var(--border)" strokeWidth="1.5" />
            <text x={BUS_X + BUS_W / 2} y={busY + 17} textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--text-primary)">{bus.name}</text>
            <text x={BUS_X + BUS_W / 2} y={busY + 30} textAnchor="middle" fontSize="9" fill="var(--text-muted)">{bus.address}</text>
            <text x={BUS_X + BUS_W / 2} y={busY + 42} textAnchor="middle" fontSize="8" fill="var(--text-muted)">{bus.scl_pin} / {bus.sda_pin}</text>
            <text x={BUS_X + BUS_W / 2} y={busY + 53} textAnchor="middle" fontSize="8" fill="var(--text-muted)">{bus.servos.length} servo{bus.servos.length !== 1 ? 's' : ''}</text>

            {/* Bus → servo connectors + tags */}
            {bus.servos.map((servo, si) => {
              const tagY = tagStartY + si * (TAG_H + 4)
              const tagMidY = tagY + TAG_H / 2
              return (
                <g key={servo.name}>
                  <path
                    d={`M ${BUS_X + BUS_W} ${busMidY} C ${TAG_X - 10} ${busMidY} ${TAG_X - 10} ${tagMidY} ${TAG_X} ${tagMidY}`}
                    stroke="var(--border)" strokeWidth="1" fill="none" strokeDasharray="4 2"
                  />
                  <rect x={TAG_X} y={tagY} width={TAG_W} height={TAG_H} rx="4"
                    fill="var(--bg-hover)" stroke="var(--border)" strokeWidth="0.8" />
                  <circle cx={TAG_X + 8} cy={tagY + TAG_H / 2} r="3"
                    fill={servo.position !== undefined && servo.open_position !== undefined
                      ? (servo.position <= servo.open_position + 5 ? 'var(--accent)' : 'var(--danger)')
                      : 'var(--text-muted)'} />
                  <text x={TAG_X + 18} y={tagY + 12} fontSize="9" fill="var(--text-primary)">{servo.name}</text>
                  <text x={TAG_X + TAG_W - 6} y={tagY + 12} textAnchor="end" fontSize="9" fill="var(--text-muted)" fontFamily="monospace">
                    {servo.position !== undefined ? `${servo.position}°` : '—'}
                  </text>
                </g>
              )
            })}

            {tagCount === 0 && (
              <text x={TAG_X + 8} y={busMidY + 4} fontSize="9" fill="var(--text-muted)" fontStyle="italic">no servos</text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Simulation() {
  const { activeProfile } = useContext(ProfileContext)
  const [buses, setBuses] = useState([])
  const [servos, setServos] = useState([])
  const [autoRefresh, setAutoRefresh] = useState(false)
  const intervalRef = useRef(null)

  const load = useCallback(() => {
    if (!activeProfile?.id) return
    Promise.all([
      profileAdminGetBuses(activeProfile.id).catch(() => []),
      profileAdminGetServos(activeProfile.id).catch(() => []),
    ]).then(([b, s]) => {
      setBuses(Array.isArray(b) ? b : [])
      setServos(Array.isArray(s) ? s : [])
    })
  }, [activeProfile?.id])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(load, 2000)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [autoRefresh, load])

  const busGroups = buses.map(b => ({
    ...b,
    servos: servos.filter(s => s.bus === b.name),
  }))

  const isEmpty = buses.length === 0

  return (
    <div style={{ padding: 16 }}>

      {/* ── Topology ── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h2 style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            Hardware Topology
          </h2>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button
              onClick={load}
              style={{ padding: '4px 12px', background: 'var(--bg-hover)', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--text-primary)', cursor: 'pointer', fontSize: '0.8rem' }}
            >Refresh</button>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: 'var(--text-secondary)', cursor: 'pointer', userSelect: 'none' }}>
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={e => setAutoRefresh(e.target.checked)}
                style={{ accentColor: 'var(--accent)' }}
              />
              Auto (2s)
            </label>
          </div>
        </div>

        {isEmpty ? (
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            No hardware configured for this profile. Go to{' '}
            <a href="#/admin/buses" style={{ color: 'var(--accent)' }}>Admin → Buses</a>
            {' '}and{' '}
            <a href="#/admin/servos" style={{ color: 'var(--accent)' }}>Admin → Servos</a>
            {' '}to set up your hardware.
          </p>
        ) : (
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: 16,
            overflowX: 'auto',
          }}>
            <TopologyDiagram buses={buses} servos={servos} />
          </div>
        )}

        {/* Legend */}
        {!isEmpty && (
          <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <span><span style={{ color: 'var(--accent)' }}>●</span> Open position</span>
            <span><span style={{ color: 'var(--danger)' }}>●</span> Close position</span>
            <span style={{ marginLeft: 'auto', fontStyle: 'italic' }}>
              {activeProfile?.id ? `Profile: ${activeProfile.label ?? activeProfile.id}` : ''}
              {autoRefresh ? ' · Live' : ''}
            </span>
          </div>
        )}
      </div>

      {/* ── Servo Panels ── */}
      {busGroups.map(bus => bus.servos.length > 0 && (
        <div key={bus.name} style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 10 }}>
            <h2 style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              {bus.name}
            </h2>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{bus.address}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{bus.scl_pin}/{bus.sda_pin}</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {bus.servos.map((servo, i) => (
              <ServoCard
                key={`${servo.bus}-${servo.id}-${i}`}
                servo={servo}
                onUpdate={load}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
