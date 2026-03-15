import { useState, useEffect, useContext, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ProfileContext } from '../../context/ProfileContext.js'
import {
  profileGetJoystickConfig,
  profileSaveJoystickConfig,
  profileAdminGetServos,
  profileGetAudioCategories,
  profileGetScriptList,
  arduinoGetConfig,
  arduinoSaveConfig,
  arduinoFlashUrl,
} from '../../api/client.js'

const AXIS_TYPES = [
  { value: '', label: '— unbound —' },
  { value: 'servo_move', label: 'Servo — Move' },
]

const BTN_TYPES = [
  { value: '', label: '— unbound —' },
  { value: 'servo_open', label: 'Servo — Open' },
  { value: 'servo_close', label: 'Servo — Close' },
  { value: 'servo_open_all', label: 'Servo — Open All' },
  { value: 'servo_close_all', label: 'Servo — Close All' },
  { value: 'audio_play', label: 'Audio — Play file' },
  { value: 'audio_random', label: 'Audio — Random category' },
  { value: 'script_run', label: 'Script — Run' },
  { value: 'estop', label: 'E-Stop' },
]

const sel = {
  background: 'var(--bg-secondary)',
  color: 'var(--text-primary)',
  border: '1px solid var(--border)',
  borderRadius: '4px',
  padding: '4px 6px',
  fontSize: '0.85rem',
}

const inp = {
  ...sel,
  width: '60px',
}

const AXIS_LABELS = {
  left_x: 'Left X (left/right)',
  left_y: 'Left Y (up/down)',
  right_x: 'Right X (twist)',
  right_y: 'Right Y (up/down)',
}

const BTN_LABELS = {
  b1: 'Button 1',
  b2: 'Button 2',
  b3: 'Button 3',
}

function ActionFields({ action, onChange, servos, categories, scripts, typeOptions }) {
  const type = action?.type ?? ''

  function set(field, val) {
    onChange({ ...(action ?? {}), type, [field]: val })
  }

  function setType(newType) {
    if (!newType) { onChange(null); return }
    onChange({ type: newType })
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
      <select style={{ ...sel, minWidth: '180px' }} value={type} onChange={e => setType(e.target.value)}>
        {typeOptions.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
      </select>

      {(type === 'servo_move' || type === 'servo_open' || type === 'servo_close') && (
        <select style={{ ...sel, minWidth: '130px' }} value={action?.servo ?? ''} onChange={e => set('servo', e.target.value)}>
          <option value="">— servo —</option>
          {servos.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
        </select>
      )}

      {type === 'servo_move' && (
        <>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Min</span>
          <input style={inp} type="number" min="0" max="180" value={action?.min_angle ?? 0} onChange={e => set('min_angle', Number(e.target.value))} />
          <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Max</span>
          <input style={inp} type="number" min="0" max="180" value={action?.max_angle ?? 180} onChange={e => set('max_angle', Number(e.target.value))} />
          <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>°</span>
        </>
      )}

      {type === 'audio_random' && (
        <select style={{ ...sel, minWidth: '130px' }} value={action?.category ?? ''} onChange={e => set('category', e.target.value)}>
          <option value="">— category —</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      )}

      {type === 'audio_play' && (
        <input
          style={{ ...sel, width: '160px' }}
          placeholder="filename.mp3"
          value={action?.file ?? ''}
          onChange={e => set('file', e.target.value)}
        />
      )}

      {type === 'script_run' && (
        <select style={{ ...sel, minWidth: '150px' }} value={action?.name ?? ''} onChange={e => set('name', e.target.value)}>
          <option value="">— script —</option>
          {scripts.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      )}
    </div>
  )
}

const PIN_LABELS = {
  left_x:  'Left Joystick X',
  left_y:  'Left Joystick Y',
  right_x: 'Right Joystick X',
  right_y: 'Right Joystick Y',
  btn1:    'Button 1',
  btn2:    'Button 2',
  btn3:    'Button 3',
  estop:   'E-Stop',
}

export default function ControllerConfig() {
  const { activeProfile } = useContext(ProfileContext)
  const navigate = useNavigate()

  const [config, setConfig] = useState(null)
  const [servos, setServos] = useState([])
  const [categories, setCategories] = useState([])
  const [scripts, setScripts] = useState([])
  const [status, setStatus] = useState(null)

  // Arduino config
  const [arduinoConfig, setArduinoConfig] = useState(null)
  const [arduinoStatus, setArduinoStatus] = useState(null)
  const [flashLog, setFlashLog] = useState([])
  const [flashing, setFlashing] = useState(false)
  const logEndRef = useRef(null)

  useEffect(() => {
    if (!activeProfile?.id) return
    const pid = activeProfile.id
    Promise.all([
      profileGetJoystickConfig(pid),
      profileAdminGetServos(pid).catch(() => []),
      profileGetAudioCategories(pid).catch(() => []),
      profileGetScriptList(pid).catch(() => []),
      arduinoGetConfig().catch(() => null),
    ]).then(([jc, sv, cats, scr, ard]) => {
      setConfig(jc)
      setServos(Array.isArray(sv) ? sv : [])
      setCategories(Array.isArray(cats) ? cats : [])
      setScripts(Array.isArray(scr) ? scr.map(s => s.replace(/\.scr$/, '')) : [])
      if (ard) setArduinoConfig(ard)
    })
  }, [activeProfile?.id])

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [flashLog])

  function setAxis(key, action) {
    setConfig(c => ({ ...c, axes: { ...c.axes, [key]: action } }))
  }

  function setButton(key, action) {
    setConfig(c => ({ ...c, buttons: { ...c.buttons, [key]: action } }))
  }

  async function save() {
    try {
      await profileSaveJoystickConfig(config, activeProfile.id)
      setStatus('Saved!')
      setTimeout(() => setStatus(null), 2000)
    } catch {
      setStatus('Save failed')
    }
  }

  async function saveArduino() {
    try {
      await arduinoSaveConfig(arduinoConfig)
      setArduinoStatus('Saved!')
      setTimeout(() => setArduinoStatus(null), 2000)
    } catch {
      setArduinoStatus('Save failed')
    }
  }

  function setPin(key, val) {
    setArduinoConfig(c => ({ ...c, pins: { ...c.pins, [key]: val } }))
  }

  function setArduinoField(key, val) {
    setArduinoConfig(c => ({ ...c, [key]: val }))
  }

  async function flash() {
    setFlashing(true)
    setFlashLog([])
    // Save config first so the sketch is regenerated
    await arduinoSaveConfig(arduinoConfig).catch(() => {})
    const es = new EventSource(arduinoFlashUrl())
    es.onmessage = e => setFlashLog(prev => [...prev, e.data])
    es.addEventListener('done', e => {
      setFlashLog(prev => [...prev, e.data === 'success' ? '✓ Flash complete!' : `✗ Failed: ${e.data}`])
      setFlashing(false)
      es.close()
    })
    es.onerror = () => {
      setFlashLog(prev => [...prev, '✗ Connection error'])
      setFlashing(false)
      es.close()
    }
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
    minWidth: '160px',
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
    <div style={{ padding: '16px', maxWidth: '860px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button onClick={() => navigate('/admin')} style={{ ...sel, cursor: 'pointer', padding: '5px 10px' }}>← Admin</button>
        <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Controller Config</h2>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Profile: {activeProfile?.label}</span>
        <button onClick={save} style={{ marginLeft: 'auto', padding: '6px 18px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>Save</button>
        {status && <span style={{ color: status === 'Saved!' ? 'var(--success)' : 'var(--danger)', fontSize: '0.85rem' }}>{status}</span>}
      </div>

      {/* Deadzone */}
      <div style={rowStyle}>
        <span style={labelStyle}>Dead zone (0–512)</span>
        <input
          style={{ ...inp, width: '70px' }}
          type="number" min="0" max="512"
          value={config.deadzone ?? 30}
          onChange={e => setConfig(c => ({ ...c, deadzone: Number(e.target.value) }))}
        />
        <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Stick values within ±this of centre (512) are ignored</span>
      </div>

      {/* Axes */}
      <div style={sectionHead}>Axes</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {Object.keys(AXIS_LABELS).map(key => (
          <div key={key} style={rowStyle}>
            <span style={labelStyle}>{AXIS_LABELS[key]}</span>
            <ActionFields
              action={config.axes?.[key] ?? null}
              onChange={action => setAxis(key, action)}
              servos={servos}
              categories={categories}
              scripts={scripts}
              typeOptions={AXIS_TYPES}
            />
          </div>
        ))}
      </div>

      {/* Buttons */}
      <div style={sectionHead}>Buttons</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {Object.keys(BTN_LABELS).map(key => (
          <div key={key} style={rowStyle}>
            <span style={labelStyle}>{BTN_LABELS[key]}</span>
            <ActionFields
              action={config.buttons?.[key] ?? null}
              onChange={action => setButton(key, action)}
              servos={servos}
              categories={categories}
              scripts={scripts}
              typeOptions={BTN_TYPES}
            />
          </div>
        ))}
      </div>

      {/* E-Stop */}
      <div style={sectionHead}>E-Stop</div>
      <div style={{ ...rowStyle, color: 'var(--danger)', fontWeight: 600, fontSize: '0.85rem' }}>
        Always stops all scripts and halts motion — not configurable.
      </div>

      {/* Arduino Config */}
      {arduinoConfig && (<>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '28px', marginBottom: '4px', flexWrap: 'wrap' }}>
          <span style={{ ...sectionHead, margin: 0 }}>Arduino Configuration</span>
          <button
            onClick={saveArduino}
            style={{ padding: '4px 14px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}
          >Save Config</button>
          {arduinoStatus && <span style={{ color: arduinoStatus === 'Saved!' ? 'var(--success)' : 'var(--danger)', fontSize: '0.82rem' }}>{arduinoStatus}</span>}
        </div>

        {/* Port + Baud */}
        <div style={{ ...rowStyle, marginBottom: '6px' }}>
          <span style={labelStyle}>Serial Port</span>
          <input style={{ ...sel, width: '140px' }} value={arduinoConfig.port ?? '/dev/ttyUSB0'} onChange={e => setArduinoField('port', e.target.value)} placeholder="/dev/ttyUSB0" />
          <span style={labelStyle}>Baud Rate</span>
          <input style={{ ...inp, width: '80px' }} type="number" value={arduinoConfig.baud ?? 9600} onChange={e => setArduinoField('baud', Number(e.target.value))} />
        </div>

        {/* Pins */}
        <div style={sectionHead}>Pin Assignments</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '6px' }}>
          {Object.keys(PIN_LABELS).map(key => (
            <div key={key} style={rowStyle}>
              <span style={{ ...labelStyle, minWidth: '130px' }}>{PIN_LABELS[key]}</span>
              <input
                style={{ ...inp, width: '60px' }}
                value={arduinoConfig.pins?.[key] ?? ''}
                onChange={e => setPin(key, e.target.value)}
                placeholder="A0"
              />
            </div>
          ))}
        </div>

        {/* Tuning */}
        <div style={sectionHead}>Tuning</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '16px' }}>
          {[
            { key: 'deadzone',         label: 'Dead zone',          unit: '' },
            { key: 'change_threshold', label: 'Change threshold',   unit: '' },
            { key: 'keepalive_ms',     label: 'Keepalive interval', unit: 'ms' },
            { key: 'sample_ms',        label: 'Sample rate',        unit: 'ms' },
          ].map(({ key, label, unit }) => (
            <div key={key} style={rowStyle}>
              <span style={{ ...labelStyle, minWidth: '130px' }}>{label}</span>
              <input style={{ ...inp, width: '70px' }} type="number" value={arduinoConfig[key] ?? ''} onChange={e => setArduinoField(key, Number(e.target.value))} />
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
            Saves config, generates sketch, compiles and uploads via arduino-cli
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
      </>)}
    </div>
  )
}
