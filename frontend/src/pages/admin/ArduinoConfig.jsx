import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { arduinoGetConfig, arduinoSaveConfig, arduinoFlashUrl } from '../../api/client.js'

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
  left_x:     'Left Joystick X',
  left_y:     'Left Joystick Y',
  left_twist: 'Left Joystick Twist',
  right_x:    'Right Joystick X',
  right_y:    'Right Joystick Y',
  right_twist:'Right Joystick Twist',
  btn1:       'Button 1',
  btn2:       'Button 2',
  btn3:       'Button 3',
  estop:      'E-Stop',
}

export default function ArduinoConfig() {
  const navigate = useNavigate()
  const [config, setConfig] = useState(null)
  const [status, setStatus] = useState(null)
  const [flashLog, setFlashLog] = useState([])
  const [flashing, setFlashing] = useState(false)
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
    setFlashing(true)
    setFlashLog([])
    await arduinoSaveConfig(config).catch(() => {})
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button onClick={() => navigate('/admin')} style={{ ...sel, cursor: 'pointer', padding: '5px 10px' }}>← Admin</button>
        <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Arduino Config</h2>
        <button onClick={save} style={{ marginLeft: 'auto', padding: '6px 18px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>Save</button>
        {status && <span style={{ color: status === 'Saved!' ? 'var(--success)' : 'var(--danger)', fontSize: '0.85rem' }}>{status}</span>}
      </div>

      {/* Port + Baud */}
      <div style={sectionHead}>Serial</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={rowStyle}>
          <span style={labelStyle}>Serial Port</span>
          <input style={{ ...sel, width: '160px' }} value={config.port ?? '/dev/ttyUSB0'} onChange={e => setField('port', e.target.value)} placeholder="/dev/ttyUSB0" />
        </div>
        <div style={rowStyle}>
          <span style={labelStyle}>Baud Rate</span>
          <input style={{ ...inp, width: '90px' }} type="number" value={config.baud ?? 9600} onChange={e => setField('baud', Number(e.target.value))} />
        </div>
      </div>

      {/* Pins */}
      <div style={sectionHead}>Pin Assignments</div>
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
          Saves config, regenerates sketch, compiles and uploads via arduino-cli
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
