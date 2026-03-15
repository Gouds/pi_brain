import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { arduinoGetConfig, arduinoSaveConfig, getApiUrl } from '../../api/client.js'

const sel = {
  background: 'var(--bg-secondary)',
  color: 'var(--text-primary)',
  border: '1px solid var(--border)',
  borderRadius: '4px',
  padding: '4px 6px',
  fontSize: '0.85rem',
}

const inp = { ...sel, width: '60px' }

const PIN_LABELS = {
  left_x:      'Left Joystick X',
  left_y:      'Left Joystick Y',
  left_twist:  'Left Joystick Twist',
  right_x:     'Right Joystick X',
  right_y:     'Right Joystick Y',
  right_twist: 'Right Joystick Twist',
  btn1:        'Button 1',
  btn2:        'Button 2',
  btn3:        'Button 3',
  estop:       'E-Stop',
}

// ── Calibration Wizard ────────────────────────────────────────────────────────

const AXIS_STEPS = [
  { key: 'left_x',     label: 'LEFT joystick',  motion: 'left and right' },
  { key: 'left_y',     label: 'LEFT joystick',  motion: 'up and down' },
  { key: 'left_twist', label: 'LEFT joystick',  motion: 'twist (rotate)' },
  { key: 'right_x',   label: 'RIGHT joystick', motion: 'left and right' },
  { key: 'right_y',   label: 'RIGHT joystick', motion: 'up and down' },
  { key: 'right_twist', label: 'RIGHT joystick', motion: 'twist (rotate)' },
]

// Order that the Arduino sends values — matches config pin keys
const SLOT_ORDER = ['left_x', 'left_y', 'left_twist', 'right_x', 'right_y', 'right_twist']
const SLOT_KEYS  = ['lx', 'ly', 'lt', 'rx', 'ry', 'rt']

function CalibrationWizard({ config, onDone, onCancel }) {
  const [step, setStep]           = useState(0)
  const [values, setValues]       = useState({ lx: 512, ly: 512, lt: 512, rx: 512, ry: 512, rt: 512 })
  const [baseline, setBaseline]   = useState(null)
  const [detected, setDetected]   = useState(null)   // slot index 0-5
  const [mapping, setMapping]     = useState({})      // key → pin string
  const esRef                     = useRef(null)

  // (re)connect SSE stream on mount and keep values fresh
  useEffect(() => {
    const es = new EventSource(`${getApiUrl()}/joystick/stream`)
    esRef.current = es
    es.onmessage = e => {
      try {
        const d = JSON.parse(e.data)
        setValues(d)
      } catch {}
    }
    return () => es.close()
  }, [])

  // On step change: reset baseline after a short settle
  useEffect(() => {
    setBaseline(null)
    setDetected(null)
    const t = setTimeout(() => {
      setValues(v => { setBaseline(v); return v })
    }, 600)
    return () => clearTimeout(t)
  }, [step])

  // Detect which slot is moving most vs baseline
  useEffect(() => {
    if (!baseline) return
    let maxDelta = 40  // minimum movement to count as "detected"
    let maxIdx   = null
    SLOT_KEYS.forEach((k, i) => {
      const delta = Math.abs((values[k] ?? 512) - (baseline[k] ?? 512))
      if (delta > maxDelta) { maxDelta = delta; maxIdx = i }
    })
    setDetected(maxIdx)
  }, [values, baseline])

  function confirm() {
    if (detected === null) return
    const axisKey  = AXIS_STEPS[step].key
    const slotKey  = SLOT_ORDER[detected]
    const pin      = config.pins?.[slotKey] ?? `A${detected}`
    setMapping(m => ({ ...m, [axisKey]: pin }))
    advance()
  }

  function skip() {
    // Keep existing pin for this axis
    const axisKey = AXIS_STEPS[step].key
    setMapping(m => ({ ...m, [axisKey]: config.pins?.[axisKey] ?? `A${step}` }))
    advance()
  }

  function advance() {
    if (step + 1 >= AXIS_STEPS.length) {
      esRef.current?.close()
      onDone(mapping)
    } else {
      setStep(s => s + 1)
    }
  }

  const current = AXIS_STEPS[step]

  const overlayStyle = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
  }
  const boxStyle = {
    background: 'var(--bg-primary)', border: '1px solid var(--border)',
    borderRadius: '8px', padding: '24px', width: '420px', maxWidth: '95vw',
  }

  return (
    <div style={overlayStyle}>
      <div style={boxStyle}>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
          Step {step + 1} of {AXIS_STEPS.length}
        </div>
        <h3 style={{ margin: '0 0 6px', fontSize: '1rem' }}>
          {current.label.replace('LEFT', '').replace('RIGHT', '').trim()} Axis Calibration
        </h3>
        <div style={{ marginBottom: '16px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Move <strong>{current.label}</strong> {current.motion}
        </div>

        {/* Live bars */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
          {SLOT_KEYS.map((k, i) => {
            const val   = values[k] ?? 512
            const pct   = Math.round((val / 1023) * 100)
            const isTop = detected === i
            return (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  width: '40px', fontSize: '0.75rem', color: isTop ? 'var(--accent)' : 'var(--text-muted)',
                  fontWeight: isTop ? 700 : 400,
                }}>
                  {config.pins?.[SLOT_ORDER[i]] ?? `A${i}`}
                </span>
                <div style={{ flex: 1, height: '10px', background: 'var(--bg-hover)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${pct}%`, height: '100%',
                    background: isTop ? 'var(--accent)' : 'var(--border)',
                    transition: 'width 0.05s',
                  }} />
                </div>
                <span style={{ width: '34px', fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'right' }}>{val}</span>
              </div>
            )
          })}
        </div>

        {detected !== null ? (
          <div style={{ marginBottom: '12px', fontSize: '0.85rem', color: 'var(--accent)' }}>
            ✓ Movement detected on pin <strong>{config.pins?.[SLOT_ORDER[detected]] ?? `A${detected}`}</strong> — assign to <strong>{current.key.replace('_', ' ')}</strong>?
          </div>
        ) : (
          <div style={{ marginBottom: '12px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Waiting for movement…
          </div>
        )}

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={confirm}
            disabled={detected === null}
            style={{
              padding: '7px 18px', background: detected !== null ? 'var(--accent)' : 'var(--bg-hover)',
              color: '#fff', border: 'none', borderRadius: '4px', cursor: detected !== null ? 'pointer' : 'not-allowed',
              fontWeight: 600,
            }}
          >Confirm</button>
          <button
            onClick={skip}
            style={{ padding: '7px 14px', background: 'var(--bg-surface)', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer' }}
          >Skip</button>
          <button
            onClick={() => { esRef.current?.close(); onCancel() }}
            style={{ marginLeft: 'auto', padding: '7px 14px', background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer' }}
          >Cancel</button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ArduinoConfig() {
  const navigate = useNavigate()
  const [config, setConfig]       = useState(null)
  const [status, setStatus]       = useState(null)
  const [flashLog, setFlashLog]   = useState([])
  const [flashing, setFlashing]   = useState(false)
  const [wizarding, setWizarding] = useState(false)
  const logEndRef = useRef(null)

  useEffect(() => {
    arduinoGetConfig().then(setConfig).catch(() => {})
  }, [])

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [flashLog])

  function setPin(key, val) {
    setConfig(c => ({ ...c, pins: { ...c.pins, [key]: val } }))
  }

  function setField(key, val) {
    setConfig(c => ({ ...c, [key]: val }))
  }

  async function save() {
    try {
      await arduinoSaveConfig(config)
      setStatus('Saved!')
      setTimeout(() => setStatus(null), 2000)
    } catch {
      setStatus('Save failed')
    }
  }

  async function flash() {
    const controllerUrl = (config.controller_url ?? '').trim().replace(/\/$/, '')
    if (!controllerUrl) {
      setFlashLog(['✗ Set the Controller URL before flashing'])
      return
    }

    setFlashing(true)
    setFlashLog([`Connecting to controller at ${controllerUrl}…`])

    // Save config to brain Pi first (persistence), then push to controller Pi
    await arduinoSaveConfig(config).catch(() => {})

    try {
      await fetch(`${controllerUrl}/admin/arduino/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
    } catch {
      setFlashLog(prev => [...prev, '✗ Could not reach controller — is server.py running?'])
      setFlashing(false)
      return
    }

    const es = new EventSource(`${controllerUrl}/admin/arduino/flash`)
    es.onmessage = e => setFlashLog(prev => [...prev, e.data])
    es.addEventListener('done', e => {
      setFlashLog(prev => [...prev, e.data === 'success' ? '✓ Flash complete!' : `✗ Failed: ${e.data}`])
      setFlashing(false)
      es.close()
    })
    es.onerror = () => {
      setFlashLog(prev => [...prev, '✗ Connection lost'])
      setFlashing(false)
      es.close()
    }
  }

  function handleWizardDone(mapping) {
    // mapping: { left_x: 'A2', left_y: 'A0', ... }
    setConfig(c => ({ ...c, pins: { ...c.pins, ...mapping } }))
    setWizarding(false)
    setStatus('Pins updated — remember to Save & Flash!')
  }

  if (!config) return <div style={{ padding: 16 }}>Loading…</div>

  const rowStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px 10px',
    background: 'var(--bg-surface)',
    border: '1px solid var(--border)',
    borderRadius: '6px',
    flexWrap: 'wrap',
  }

  const labelStyle = {
    minWidth: '140px',
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    fontWeight: 500,
  }

  const sectionHead = {
    fontSize: '0.78rem',
    fontWeight: 700,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginTop: '16px',
    marginBottom: '4px',
  }

  return (
    <div style={{ padding: '16px', maxWidth: '760px' }}>
      {wizarding && (
        <CalibrationWizard
          config={config}
          onDone={handleWizardDone}
          onCancel={() => setWizarding(false)}
        />
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button onClick={() => navigate('/admin')} style={{ ...sel, cursor: 'pointer', padding: '5px 10px' }}>← Admin</button>
        <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Arduino Config</h2>
        <button onClick={save} style={{ marginLeft: 'auto', padding: '6px 18px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>Save</button>
        {status && <span style={{ color: status === 'Saved!' ? 'var(--success)' : 'var(--danger)', fontSize: '0.85rem' }}>{status}</span>}
      </div>

      {/* Controller URL */}
      <div style={sectionHead}>Controller Pi</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={rowStyle}>
          <span style={labelStyle}>Controller URL</span>
          <input
            style={{ ...sel, width: '220px' }}
            value={config.controller_url ?? ''}
            onChange={e => setField('controller_url', e.target.value)}
            placeholder="http://192.168.x.x:8001"
          />
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Mini backend running on the controller Pi</span>
        </div>
      </div>

      {/* Serial */}
      <div style={sectionHead}>Serial</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={rowStyle}>
          <span style={labelStyle}>Board FQBN</span>
          <input style={{ ...sel, width: '260px' }} value={config.fqbn ?? 'arduino:avr:nano:cpu=atmega328old'} onChange={e => setField('fqbn', e.target.value)} placeholder="arduino:avr:nano:cpu=atmega328old" />
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>e.g. arduino:avr:uno · arduino:avr:nano:cpu=atmega328old</span>
        </div>
        <div style={rowStyle}>
          <span style={labelStyle}>Serial Port</span>
          <input style={{ ...sel, width: '160px' }} value={config.port ?? '/dev/ttyUSB0'} onChange={e => setField('port', e.target.value)} placeholder="/dev/ttyUSB0" />
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>USB port on the controller Pi</span>
        </div>
        <div style={rowStyle}>
          <span style={labelStyle}>Baud Rate</span>
          <input style={{ ...inp, width: '90px' }} type="number" value={config.baud ?? 9600} onChange={e => setField('baud', Number(e.target.value))} />
        </div>
      </div>

      {/* Pins */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '16px', marginBottom: '4px' }}>
        <span style={{ ...sectionHead, margin: 0 }}>Pin Assignments</span>
        <button
          onClick={() => setWizarding(true)}
          style={{ padding: '3px 12px', fontSize: '0.78rem', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}
        >Calibrate Pins…</button>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Move each axis to auto-detect</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
        {Object.keys(PIN_LABELS).map(key => (
          <div key={key} style={rowStyle}>
            <span style={labelStyle}>{PIN_LABELS[key]}</span>
            <input
              style={{ ...inp, width: '60px' }}
              value={config.pins?.[key] ?? ''}
              onChange={e => setPin(key, e.target.value)}
              placeholder="A0"
            />
          </div>
        ))}
      </div>

      {/* Tuning */}
      <div style={sectionHead}>Tuning</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
        {[
          { key: 'deadzone',         label: 'Dead zone',          unit: '' },
          { key: 'change_threshold', label: 'Change threshold',   unit: '' },
          { key: 'keepalive_ms',     label: 'Keepalive interval', unit: 'ms' },
          { key: 'sample_ms',        label: 'Sample rate',        unit: 'ms' },
        ].map(({ key, label, unit }) => (
          <div key={key} style={rowStyle}>
            <span style={labelStyle}>{label}</span>
            <input style={{ ...inp, width: '70px' }} type="number" value={config[key] ?? ''} onChange={e => setField(key, Number(e.target.value))} />
            {unit && <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{unit}</span>}
          </div>
        ))}
      </div>

      {/* Flash */}
      <div style={sectionHead}>Flash Arduino</div>
      <div style={{ marginBottom: '8px' }}>
        <button
          onClick={flash}
          disabled={flashing}
          style={{ padding: '8px 22px', background: flashing ? 'var(--bg-hover)' : 'var(--success)', color: '#fff', border: 'none', borderRadius: '4px', cursor: flashing ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '0.9rem', opacity: flashing ? 0.7 : 1 }}
        >{flashing ? 'Flashing…' : 'Compile & Flash'}</button>
        <span style={{ marginLeft: '12px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          Sends config to controller Pi, compiles and uploads via arduino-cli there
        </span>
      </div>

      {flashLog.length > 0 && (
        <div style={{
          background: '#111',
          border: '1px solid var(--border)',
          borderRadius: '4px',
          padding: '10px 12px',
          fontSize: '0.75rem',
          color: '#ccc',
          fontFamily: 'monospace',
          maxHeight: '260px',
          overflowY: 'auto',
          whiteSpace: 'pre-wrap',
          lineHeight: '1.5',
        }}>
          {flashLog.map((line, i) => (
            <div key={i} style={{ color: line.startsWith('✓') ? '#4caf50' : line.startsWith('✗') ? '#f44336' : '#ccc' }}>{line}</div>
          ))}
          <div ref={logEndRef} />
        </div>
      )}
    </div>
  )
}
