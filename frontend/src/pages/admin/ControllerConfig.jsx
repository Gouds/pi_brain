import { useState, useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { ProfileContext } from '../../context/ProfileContext.js'
import {
  profileGetJoystickConfig,
  profileSaveJoystickConfig,
  profileAdminGetServos,
  profileGetAudioCategories,
  profileGetScriptList,
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

const inp = { ...sel, width: '60px' }

const AXIS_LABELS = {
  left_x:     'Left X (left/right)',
  left_y:     'Left Y (up/down)',
  left_twist: 'Left Twist (rotate)',
  right_x:    'Right X (left/right)',
  right_y:    'Right Y (up/down)',
  right_twist:'Right Twist (rotate)',
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

export default function ControllerConfig() {
  const { activeProfile } = useContext(ProfileContext)
  const navigate = useNavigate()

  const [config, setConfig] = useState(null)
  const [servos, setServos] = useState([])
  const [categories, setCategories] = useState([])
  const [scripts, setScripts] = useState([])
  const [status, setStatus] = useState(null)

  useEffect(() => {
    if (!activeProfile?.id) return
    const pid = activeProfile.id
    Promise.all([
      profileGetJoystickConfig(pid),
      profileAdminGetServos(pid).catch(() => []),
      profileGetAudioCategories(pid).catch(() => []),
      profileGetScriptList(pid).catch(() => []),
    ]).then(([jc, sv, cats, scr]) => {
      setConfig(jc)
      setServos(Array.isArray(sv) ? sv : [])
      setCategories(Array.isArray(cats) ? cats : [])
      setScripts(Array.isArray(scr) ? scr.map(s => s.replace(/\.scr$/, '')) : [])
    })
  }, [activeProfile?.id])

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
    </div>
  )
}
