import { useState, useRef, useCallback } from 'react'
import { domeSpin, domeStop } from '../api/client.js'

const sectionHead = {
  fontSize: '0.75rem',
  fontWeight: 700,
  color: 'var(--text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  marginTop: '18px',
  marginBottom: '8px',
}

function SpinButton({ label, direction, speed, onStart, onStop }) {
  const pressing = useRef(false)

  function start(e) {
    e.preventDefault()
    if (pressing.current) return
    pressing.current = true
    onStart(direction === 'left' ? -speed : speed)
  }

  function stop(e) {
    e.preventDefault()
    if (!pressing.current) return
    pressing.current = false
    onStop()
  }

  const isLeft = direction === 'left'

  return (
    <button
      onPointerDown={start}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      style={{
        flex: 1,
        padding: '32px 10px',
        fontSize: '2rem',
        fontWeight: 900,
        border: 'none',
        borderRadius: '10px',
        background: 'var(--bg-surface)',
        color: 'var(--text-primary)',
        cursor: 'pointer',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        touchAction: 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '6px',
        borderLeft: isLeft ? '3px solid var(--accent)' : 'none',
        borderRight: !isLeft ? '3px solid var(--accent)' : 'none',
      }}
    >
      <span>{isLeft ? '◀' : '▶'}</span>
      <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
    </button>
  )
}

export default function Control() {
  const [speed, setSpeed] = useState(50)
  const [status, setStatus] = useState(null)

  const handleStart = useCallback((effectiveSpeed) => {
    domeSpin(effectiveSpeed).catch(() => {})
    setStatus(effectiveSpeed > 0 ? 'right' : 'left')
  }, [])

  const handleStop = useCallback(() => {
    domeStop().catch(() => {})
    setStatus(null)
  }, [])

  return (
    <div style={{ padding: '14px', maxWidth: '500px' }}>

      {/* Status indicator */}
      <div style={{
        height: '6px',
        borderRadius: '3px',
        marginBottom: '16px',
        background: status === null
          ? 'var(--bg-surface)'
          : status === 'left'
            ? 'var(--accent)'
            : 'var(--btn-primary)',
        transition: 'background 0.15s',
      }} />

      {/* Dome Spin */}
      <div style={sectionHead}>Dome Rotation</div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
        <SpinButton label="Left"  direction="left"  speed={speed} onStart={handleStart} onStop={handleStop} />
        <SpinButton label="Right" direction="right" speed={speed} onStart={handleStart} onStop={handleStop} />
      </div>

      {/* Speed */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', minWidth: 42 }}>Speed</span>
        <input
          type="range" min={10} max={100} value={speed}
          onChange={e => setSpeed(Number(e.target.value))}
          style={{ flex: 1, accentColor: 'var(--accent)' }}
        />
        <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', minWidth: 36, textAlign: 'right' }}>{speed}%</span>
      </div>

      <p style={{ marginTop: '18px', fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
        Hold Left or Right to spin the dome. Release to stop.
      </p>
    </div>
  )
}
