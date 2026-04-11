import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { lightsGetPresets, lightsLogic, lightsHolo, lightsCommand } from '../api/client.js'

async function runPreset(preset) {
  for (const step of preset.commands) {
    if (step.type === 'logic') await lightsLogic(step.params).catch(() => {})
    else if (step.type === 'holo') await lightsHolo(step.params).catch(() => {})
    else if (step.type === 'raw') await lightsCommand(step.command).catch(() => {})
  }
}

export default function LightsPresets() {
  const [presets, setPresets] = useState([])
  const [active, setActive] = useState(null)
  const [feedback, setFeedback] = useState(null)

  useEffect(() => {
    lightsGetPresets().then(data => setPresets(Array.isArray(data) ? data : [])).catch(() => {})
  }, [])

  const handlePreset = useCallback(async (preset, index) => {
    setActive(index)
    setFeedback(null)
    try {
      await runPreset(preset)
      setFeedback({ msg: `${preset.label} activated`, ok: true })
    } catch {
      setFeedback({ msg: 'Error running preset', ok: false })
    } finally {
      setActive(null)
      setTimeout(() => setFeedback(null), 2500)
    }
  }, [])

  return (
    <div style={{ padding: '14px', maxWidth: '700px' }}>

      {feedback && (
        <div style={{
          marginBottom: '12px', padding: '8px 12px', borderRadius: '6px',
          background: feedback.ok ? 'var(--bg-surface)' : 'rgba(239,68,68,0.15)',
          border: `1px solid ${feedback.ok ? 'var(--border)' : 'var(--danger)'}`,
          color: feedback.ok ? 'var(--text-secondary)' : 'var(--danger)',
          fontSize: '0.82rem',
        }}>
          {feedback.msg}
        </div>
      )}

      {presets.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)' }}>
          No presets yet. <Link to="/admin/lights-presets" style={{ color: 'var(--accent)' }}>Add one in Admin</Link>.
        </p>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
          gap: '10px',
        }}>
          {presets.map((p, i) => (
            <button
              key={i}
              onClick={() => handlePreset(p, i)}
              disabled={active !== null}
              style={{
                padding: '22px 10px',
                border: 'none',
                borderRadius: '10px',
                background: p.colour || '#666',
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: active !== null ? 'wait' : 'pointer',
                opacity: active !== null && active !== i ? 0.6 : 1,
                letterSpacing: '0.02em',
                textShadow: '0 1px 3px rgba(0,0,0,0.4)',
                transition: 'opacity 0.15s',
              }}
            >
              {active === i ? '…' : p.label}
            </button>
          ))}
        </div>
      )}

      <div style={{ marginTop: '20px', paddingTop: '14px', borderTop: '1px solid var(--border)' }}>
        <Link
          to="/lights/advanced"
          style={{ color: 'var(--text-muted)', fontSize: '0.82rem', textDecoration: 'none' }}
        >
          Advanced editor →
        </Link>
      </div>
    </div>
  )
}
