import { useState, useCallback } from 'react'
import { lightsLogic, lightsHolo, lightsCommand } from '../api/client.js'

// ── Data ──────────────────────────────────────────────────────────────────────

const LOGIC_TARGETS = [
  { value: '0', label: 'All Logics + PSI' },
  { value: '1', label: 'Front Logic' },
  { value: '3', label: 'Rear Logic' },
  { value: '4', label: 'Front PSI' },
  { value: '5', label: 'Rear PSI' },
]

const LOGIC_EFFECTS = [
  { value: 0,  label: 'Normal (default)' },
  { value: 1,  label: 'Alarm' },
  { value: 2,  label: 'Failure' },
  { value: 3,  label: 'Leia' },
  { value: 4,  label: 'March' },
  { value: 5,  label: 'Single Colour' },
  { value: 6,  label: 'Flashing Colour' },
  { value: 7,  label: 'Flip Flop' },
  { value: 8,  label: 'Flip Flop Alt' },
  { value: 9,  label: 'Colour Swap' },
  { value: 10, label: 'Rainbow' },
  { value: 14, label: 'Lights Out' },
  { value: 19, label: 'Roaming Pixel' },
  { value: 20, label: 'Horizontal Scanline' },
  { value: 21, label: 'Vertical Scanline' },
  { value: 22, label: 'Fire' },
  { value: 24, label: 'Pulse' },
  { value: 99, label: 'Random' },
]

const LOGIC_COLOURS = [
  { value: 0, label: 'Default' },
  { value: 1, label: 'Red' },
  { value: 2, label: 'Orange' },
  { value: 3, label: 'Yellow' },
  { value: 4, label: 'Green' },
  { value: 5, label: 'Cyan' },
  { value: 6, label: 'Blue' },
  { value: 7, label: 'Purple' },
  { value: 8, label: 'Magenta' },
  { value: 9, label: 'Pink' },
]

const HP_TARGETS = [
  { value: 'A', label: 'All HPs' },
  { value: 'F', label: 'Front HP' },
  { value: 'R', label: 'Rear HP' },
  { value: 'T', label: 'Top HP' },
  { value: 'X', label: 'Front + Rear' },
  { value: 'Y', label: 'Front + Top' },
  { value: 'Z', label: 'Rear + Top' },
]

const HP_SEQUENCES = [
  { value: 1, label: 'Leia (blue)' },
  { value: 2, label: 'Flicker' },
  { value: 3, label: 'Pulse' },
  { value: 4, label: 'Cycle' },
  { value: 5, label: 'Solid Colour' },
  { value: 6, label: 'Rainbow' },
  { value: 7, label: 'Short Circuit' },
]

const HP_COLOURS = [
  { value: 0, label: 'Random' },
  { value: 1, label: 'Red' },
  { value: 2, label: 'Yellow' },
  { value: 3, label: 'Green' },
  { value: 4, label: 'Cyan' },
  { value: 5, label: 'Blue' },
  { value: 6, label: 'Magenta' },
  { value: 7, label: 'Orange' },
  { value: 8, label: 'Purple' },
  { value: 9, label: 'White' },
]

// Quick full-droid presets — sends multiple commands
const PRESETS = [
  {
    label: 'Normal',
    colour: '#666',
    commands: [
      { type: 'logic', params: { target: '0', effect: 0, colour: 0, speed: 0, duration: 0 } },
      { type: 'holo',  params: { target: 'A', sequence: 1, colour: 5, duration: 0 } },
    ],
  },
  {
    label: 'Leia',
    colour: '#4ade80',
    commands: [
      { type: 'logic', params: { target: '0', effect: 3, colour: 0, speed: 0, duration: 0 } },
      { type: 'holo',  params: { target: 'A', sequence: 1, colour: 5, duration: 0 } },
    ],
  },
  {
    label: 'Alarm',
    colour: '#ef4444',
    commands: [
      { type: 'logic', params: { target: '0', effect: 1, colour: 1, speed: 2, duration: 0 } },
    ],
  },
  {
    label: 'Rainbow',
    colour: '#a855f7',
    commands: [
      { type: 'logic', params: { target: '0', effect: 10, colour: 0, speed: 3, duration: 0 } },
      { type: 'holo',  params: { target: 'A', sequence: 6, colour: 0, duration: 0 } },
    ],
  },
  {
    label: 'Fire',
    colour: '#f97316',
    commands: [
      { type: 'logic', params: { target: '0', effect: 22, colour: 1, speed: 2, duration: 0 } },
    ],
  },
  {
    label: 'Lights Out',
    colour: '#374151',
    commands: [
      { type: 'logic', params: { target: '0', effect: 14, colour: 0, speed: 0, duration: 0 } },
      { type: 'raw',   command: 'HP A clear' },
    ],
  },
]

// ── Shared styles ─────────────────────────────────────────────────────────────

const sel = {
  background: 'var(--bg-secondary)',
  color: 'var(--text-primary)',
  border: '1px solid var(--border)',
  borderRadius: '4px',
  padding: '5px 8px',
  fontSize: '0.85rem',
}

const sectionHead = {
  fontSize: '0.75rem',
  fontWeight: 700,
  color: 'var(--text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  marginTop: '18px',
  marginBottom: '6px',
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function Lights() {
  // Logic state
  const [logicTarget,   setLogicTarget]   = useState('0')
  const [logicEffect,   setLogicEffect]   = useState(0)
  const [logicColour,   setLogicColour]   = useState(0)
  const [logicSpeed,    setLogicSpeed]    = useState(0)
  const [logicDuration, setLogicDuration] = useState(0)

  // Holo state
  const [holoTarget,    setHoloTarget]    = useState('A')
  const [holoSeq,       setHoloSeq]       = useState(1)
  const [holoColour,    setHoloColour]    = useState(0)
  const [holoDuration,  setHoloDuration]  = useState(0)

  // Raw command
  const [rawCmd,   setRawCmd]   = useState('')
  const [feedback, setFeedback] = useState(null)

  function flash(msg, ok = true) {
    setFeedback({ msg, ok })
    setTimeout(() => setFeedback(null), 2500)
  }

  async function sendLogic() {
    const r = await lightsLogic({ target: logicTarget, effect: logicEffect, colour: logicColour, speed: logicSpeed, duration: logicDuration }).catch(e => ({ ok: false, error: String(e) }))
    flash(r.ok ? `Sent: ${r.command}${r.mock ? ' (mock)' : ''}` : `Error: ${r.error}`, r.ok)
  }

  async function sendHolo() {
    const r = await lightsHolo({ target: holoTarget, sequence: holoSeq, colour: holoColour, duration: holoDuration }).catch(e => ({ ok: false, error: String(e) }))
    flash(r.ok ? `Sent: ${r.command}${r.mock ? ' (mock)' : ''}` : `Error: ${r.error}`, r.ok)
  }

  async function sendRaw() {
    if (!rawCmd.trim()) return
    const r = await lightsCommand(rawCmd.trim()).catch(e => ({ ok: false, error: String(e) }))
    flash(r.ok ? `Sent: ${r.command}${r.mock ? ' (mock)' : ''}` : `Error: ${r.error}`, r.ok)
  }

  const runPreset = useCallback(async (preset) => {
    for (const step of preset.commands) {
      if (step.type === 'logic') await lightsLogic(step.params).catch(() => {})
      else if (step.type === 'holo') await lightsHolo(step.params).catch(() => {})
      else if (step.type === 'raw')  await lightsCommand(step.command).catch(() => {})
    }
    flash(`${preset.label} activated`)
  }, [])

  return (
    <div style={{ padding: '14px', maxWidth: '700px' }}>

      {/* Feedback bar */}
      {feedback && (
        <div style={{
          marginBottom: '10px', padding: '8px 12px', borderRadius: '6px',
          background: feedback.ok ? 'var(--bg-surface)' : 'rgba(239,68,68,0.15)',
          border: `1px solid ${feedback.ok ? 'var(--border)' : 'var(--danger)'}`,
          color: feedback.ok ? 'var(--text-secondary)' : 'var(--danger)',
          fontSize: '0.82rem', fontFamily: 'monospace',
        }}>
          {feedback.msg}
        </div>
      )}

      {/* Quick presets */}
      <div style={sectionHead}>Quick Presets</div>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
        {PRESETS.map(p => (
          <button
            key={p.label}
            onClick={() => runPreset(p)}
            style={{
              padding: '8px 18px', border: 'none', borderRadius: '6px',
              background: p.colour, color: '#fff', fontWeight: 700,
              fontSize: '0.85rem', cursor: 'pointer', letterSpacing: '0.02em',
            }}
          >{p.label}</button>
        ))}
      </div>

      {/* ── Logic Displays ── */}
      <div style={sectionHead}>Logic Displays</div>
      <div style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border)',
        borderRadius: '8px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px',
      }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', minWidth: 48 }}>Target</label>
          <select style={{ ...sel, flex: 1, minWidth: 140 }} value={logicTarget} onChange={e => setLogicTarget(e.target.value)}>
            {LOGIC_TARGETS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', minWidth: 48 }}>Effect</label>
          <select style={{ ...sel, flex: 1, minWidth: 160 }} value={logicEffect} onChange={e => setLogicEffect(Number(e.target.value))}>
            {LOGIC_EFFECTS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
          </select>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', minWidth: 48 }}>Colour</label>
          <select style={{ ...sel, flex: 1 }} value={logicColour} onChange={e => setLogicColour(Number(e.target.value))}>
            {LOGIC_COLOURS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Speed</label>
          <select style={{ ...sel, width: 80 }} value={logicSpeed} onChange={e => setLogicSpeed(Number(e.target.value))}>
            {[0,1,2,3,4,5,6,7,8,9].map(v => <option key={v} value={v}>{v === 0 ? '0 (fast)' : v === 9 ? '9 (slow)' : v}</option>)}
          </select>
          <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Duration</label>
          <input
            style={{ ...sel, width: 60 }} type="number" min="0" max="99"
            value={logicDuration} onChange={e => setLogicDuration(Number(e.target.value))}
          />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>s (0=∞)</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={sendLogic} style={{
            padding: '7px 22px', background: 'var(--btn-primary)', color: 'var(--btn-primary-text)',
            border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 600,
          }}>Send</button>
        </div>
      </div>

      {/* ── Holoprojectors ── */}
      <div style={sectionHead}>Holoprojectors</div>
      <div style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border)',
        borderRadius: '8px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px',
      }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', minWidth: 60 }}>Target</label>
          <select style={{ ...sel, flex: 1, minWidth: 140 }} value={holoTarget} onChange={e => setHoloTarget(e.target.value)}>
            {HP_TARGETS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', minWidth: 60 }}>Sequence</label>
          <select style={{ ...sel, flex: 1, minWidth: 140 }} value={holoSeq} onChange={e => setHoloSeq(Number(e.target.value))}>
            {HP_SEQUENCES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', minWidth: 60 }}>Colour</label>
          <select style={{ ...sel, flex: 1 }} value={holoColour} onChange={e => setHoloColour(Number(e.target.value))}>
            {HP_COLOURS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Duration</label>
          <input
            style={{ ...sel, width: 60 }} type="number" min="0" max="99"
            value={holoDuration} onChange={e => setHoloDuration(Number(e.target.value))}
          />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>s (0=∞)</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={sendHolo} style={{
            padding: '7px 22px', background: 'var(--btn-primary)', color: 'var(--btn-primary-text)',
            border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 600,
          }}>Send</button>
        </div>
      </div>

      {/* ── Raw Command ── */}
      <div style={sectionHead}>Raw Command</div>
      <div style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border)',
        borderRadius: '8px', padding: '14px',
        display: 'flex', gap: '8px', alignItems: 'center',
      }}>
        <input
          style={{ ...sel, flex: 1, fontFamily: 'monospace' }}
          placeholder="e.g. LE030000  or  HPA0015"
          value={rawCmd}
          onChange={e => setRawCmd(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendRaw()}
        />
        <button onClick={sendRaw} style={{
          padding: '7px 18px', background: 'var(--btn-primary)', color: 'var(--btn-primary-text)',
          border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap',
        }}>Send</button>
      </div>

      {/* ── Command reference ── */}
      <div style={sectionHead}>Command Reference</div>
      <div style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border)',
        borderRadius: '8px', padding: '14px', fontSize: '0.78rem',
        color: 'var(--text-secondary)', lineHeight: 1.7,
      }}>
        <div><strong>Logic:</strong> <code>LE&lt;target&gt;&lt;effect(2)&gt;&lt;colour&gt;&lt;speed&gt;&lt;time(2)&gt;</code></div>
        <div style={{ color: 'var(--text-muted)', marginBottom: 8 }}>
          Target: 0=all 1=front 3=rear 4=FPSI 5=RPSI &nbsp;·&nbsp; Time in seconds, 00=continuous
        </div>
        <div><strong>Holo:</strong> <code>HP&lt;target&gt;0&lt;seq(2)&gt;&lt;colour&gt;[|&lt;duration&gt;]</code></div>
        <div style={{ color: 'var(--text-muted)' }}>
          Target: A=all F=front R=rear T=top X=F+R Y=F+T Z=R+T
        </div>
      </div>
    </div>
  )
}
