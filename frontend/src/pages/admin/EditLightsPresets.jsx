import { useState, useEffect } from 'react'
import { lightsGetPresets, lightsAddPreset, lightsUpdatePreset, lightsDeletePreset } from '../../api/client.js'

const LOGIC_TARGETS  = [{ v:'0',label:'All' },{ v:'1',label:'Front Logic' },{ v:'3',label:'Rear Logic' },{ v:'4',label:'Front PSI' },{ v:'5',label:'Rear PSI' }]
const LOGIC_EFFECTS  = [{ v:0,label:'Normal' },{ v:1,label:'Alarm' },{ v:2,label:'Failure' },{ v:3,label:'Leia' },{ v:4,label:'March' },{ v:5,label:'Single Colour' },{ v:6,label:'Flashing' },{ v:7,label:'Flip Flop' },{ v:8,label:'Flip Flop Alt' },{ v:9,label:'Colour Swap' },{ v:10,label:'Rainbow' },{ v:14,label:'Lights Out' },{ v:19,label:'Roaming Pixel' },{ v:20,label:'H-Scanline' },{ v:21,label:'V-Scanline' },{ v:22,label:'Fire' },{ v:24,label:'Pulse' },{ v:99,label:'Random' }]
const LOGIC_COLOURS  = [{ v:0,label:'Default' },{ v:1,label:'Red' },{ v:2,label:'Orange' },{ v:3,label:'Yellow' },{ v:4,label:'Green' },{ v:5,label:'Cyan' },{ v:6,label:'Blue' },{ v:7,label:'Purple' },{ v:8,label:'Magenta' },{ v:9,label:'Pink' }]
const HP_TARGETS     = [{ v:'A',label:'All' },{ v:'F',label:'Front' },{ v:'R',label:'Rear' },{ v:'T',label:'Top' },{ v:'X',label:'F+R' },{ v:'Y',label:'F+T' },{ v:'Z',label:'R+T' }]
const HP_SEQUENCES   = [{ v:1,label:'Leia' },{ v:2,label:'Flicker' },{ v:3,label:'Pulse' },{ v:4,label:'Cycle' },{ v:5,label:'Solid Colour' },{ v:6,label:'Rainbow' },{ v:7,label:'Short Circuit' }]
const HP_COLOURS     = [{ v:0,label:'Random' },{ v:1,label:'Red' },{ v:2,label:'Yellow' },{ v:3,label:'Green' },{ v:4,label:'Cyan' },{ v:5,label:'Blue' },{ v:6,label:'Magenta' },{ v:7,label:'Orange' },{ v:8,label:'Purple' },{ v:9,label:'White' }]

const BLANK_LOGIC = { type: 'logic', params: { target: '0', effect: 0, colour: 0, speed: 0, duration: 0 }, command: '' }
const BLANK_HOLO  = { type: 'holo',  params: { target: 'A', sequence: 1, colour: 0, duration: 0 }, command: '' }
const BLANK_RAW   = { type: 'raw',   params: {}, command: '' }
const BLANK_PRESET = { label: '', colour: '#2563eb', commands: [] }

const inp = {
  background: 'var(--bg-secondary)',
  color: 'var(--text-primary)',
  border: '1px solid var(--border)',
  borderRadius: '4px',
  padding: '4px 7px',
  fontSize: '0.82rem',
}

function CommandStepEditor({ step, onChange, onRemove }) {
  function setParam(key, val) {
    onChange({ ...step, params: { ...step.params, [key]: val } })
  }
  function setType(type) {
    if (type === 'logic') onChange({ ...BLANK_LOGIC })
    else if (type === 'holo') onChange({ ...BLANK_HOLO })
    else onChange({ ...BLANK_RAW })
  }

  return (
    <div style={{
      background: 'var(--bg-secondary)', border: '1px solid var(--border)',
      borderRadius: '6px', padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: '6px',
    }}>
      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
        <select style={inp} value={step.type} onChange={e => setType(e.target.value)}>
          <option value="logic">Logic</option>
          <option value="holo">Holo</option>
          <option value="raw">Raw</option>
        </select>
        <button onClick={onRemove} style={{ marginLeft: 'auto', background: 'var(--danger)', color: '#fff', border: 'none', borderRadius: '4px', padding: '3px 10px', cursor: 'pointer', fontSize: '0.78rem' }}>Remove</button>
      </div>

      {step.type === 'logic' && (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', alignSelf: 'center' }}>Target</label>
          <select style={inp} value={step.params.target ?? '0'} onChange={e => setParam('target', e.target.value)}>
            {LOGIC_TARGETS.map(t => <option key={t.v} value={t.v}>{t.label}</option>)}
          </select>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', alignSelf: 'center' }}>Effect</label>
          <select style={inp} value={step.params.effect ?? 0} onChange={e => setParam('effect', Number(e.target.value))}>
            {LOGIC_EFFECTS.map(t => <option key={t.v} value={t.v}>{t.label}</option>)}
          </select>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', alignSelf: 'center' }}>Colour</label>
          <select style={inp} value={step.params.colour ?? 0} onChange={e => setParam('colour', Number(e.target.value))}>
            {LOGIC_COLOURS.map(t => <option key={t.v} value={t.v}>{t.label}</option>)}
          </select>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', alignSelf: 'center' }}>Speed</label>
          <select style={inp} value={step.params.speed ?? 0} onChange={e => setParam('speed', Number(e.target.value))}>
            {[0,1,2,3,4,5,6,7,8,9].map(v => <option key={v} value={v}>{v}</option>)}
          </select>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', alignSelf: 'center' }}>Duration</label>
          <input style={{ ...inp, width: '50px' }} type="number" min="0" max="99" value={step.params.duration ?? 0} onChange={e => setParam('duration', Number(e.target.value))} />
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', alignSelf: 'center' }}>s</span>
        </div>
      )}

      {step.type === 'holo' && (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', alignSelf: 'center' }}>Target</label>
          <select style={inp} value={step.params.target ?? 'A'} onChange={e => setParam('target', e.target.value)}>
            {HP_TARGETS.map(t => <option key={t.v} value={t.v}>{t.label}</option>)}
          </select>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', alignSelf: 'center' }}>Sequence</label>
          <select style={inp} value={step.params.sequence ?? 1} onChange={e => setParam('sequence', Number(e.target.value))}>
            {HP_SEQUENCES.map(t => <option key={t.v} value={t.v}>{t.label}</option>)}
          </select>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', alignSelf: 'center' }}>Colour</label>
          <select style={inp} value={step.params.colour ?? 0} onChange={e => setParam('colour', Number(e.target.value))}>
            {HP_COLOURS.map(t => <option key={t.v} value={t.v}>{t.label}</option>)}
          </select>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', alignSelf: 'center' }}>Duration</label>
          <input style={{ ...inp, width: '50px' }} type="number" min="0" max="99" value={step.params.duration ?? 0} onChange={e => setParam('duration', Number(e.target.value))} />
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', alignSelf: 'center' }}>s</span>
        </div>
      )}

      {step.type === 'raw' && (
        <input
          style={{ ...inp, fontFamily: 'monospace', width: '100%', boxSizing: 'border-box' }}
          placeholder="e.g. LE030000"
          value={step.command}
          onChange={e => onChange({ ...step, command: e.target.value })}
        />
      )}
    </div>
  )
}

function PresetEditor({ preset, onSave, onCancel }) {
  const [form, setForm] = useState(() => JSON.parse(JSON.stringify(preset)))

  function setField(key, val) { setForm(f => ({ ...f, [key]: val })) }

  function addStep(type) {
    const step = type === 'logic' ? { ...BLANK_LOGIC } : type === 'holo' ? { ...BLANK_HOLO } : { ...BLANK_RAW }
    setForm(f => ({ ...f, commands: [...f.commands, step] }))
  }

  function updateStep(i, step) {
    setForm(f => { const cmds = [...f.commands]; cmds[i] = step; return { ...f, commands: cmds } })
  }

  function removeStep(i) {
    setForm(f => ({ ...f, commands: f.commands.filter((_, idx) => idx !== i) }))
  }

  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          style={{ ...inp, flex: 1, minWidth: '140px' }}
          placeholder="Preset name"
          value={form.label}
          onChange={e => setField('label', e.target.value)}
        />
        <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Colour</label>
        <input type="color" value={form.colour} onChange={e => setField('colour', e.target.value)}
          style={{ width: '36px', height: '28px', border: 'none', borderRadius: '4px', cursor: 'pointer', background: 'none' }} />
        <div style={{
          width: '60px', height: '28px', borderRadius: '6px', background: form.colour,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: '0.7rem', fontWeight: 700, textShadow: '0 1px 2px rgba(0,0,0,0.5)',
        }}>{form.label || 'Preview'}</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {form.commands.map((step, i) => (
          <CommandStepEditor key={i} step={step} onChange={s => updateStep(i, s)} onRemove={() => removeStep(i)} />
        ))}
      </div>

      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', alignSelf: 'center' }}>Add step:</span>
        <button onClick={() => addStep('logic')} style={{ ...inp, cursor: 'pointer', background: 'var(--bg-hover)' }}>+ Logic</button>
        <button onClick={() => addStep('holo')}  style={{ ...inp, cursor: 'pointer', background: 'var(--bg-hover)' }}>+ Holo</button>
        <button onClick={() => addStep('raw')}   style={{ ...inp, cursor: 'pointer', background: 'var(--bg-hover)' }}>+ Raw</button>
      </div>

      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
        <button onClick={onCancel} style={{ ...inp, cursor: 'pointer' }}>Cancel</button>
        <button onClick={() => onSave(form)} style={{ ...inp, cursor: 'pointer', background: 'var(--btn-primary)', color: 'var(--btn-primary-text)', border: 'none', fontWeight: 600 }}>Save</button>
      </div>
    </div>
  )
}

export default function EditLightsPresets() {
  const [presets, setPresets] = useState([])
  const [editIndex, setEditIndex] = useState(null)  // null = not editing, -1 = new
  const [error, setError] = useState(null)

  function load() {
    lightsGetPresets().then(data => setPresets(Array.isArray(data) ? data : [])).catch(() => {})
  }

  useEffect(load, [])

  function handleSave(form) {
    const p = { label: form.label, colour: form.colour, commands: form.commands }
    const req = editIndex === -1
      ? lightsAddPreset(p)
      : lightsUpdatePreset(editIndex, p)
    req.then(data => { setPresets(Array.isArray(data) ? data : []); setEditIndex(null) })
       .catch(() => setError('Save failed'))
  }

  function handleDelete(i) {
    if (!confirm(`Delete preset "${presets[i].label}"?`)) return
    lightsDeletePreset(i)
      .then(data => setPresets(Array.isArray(data) ? data : []))
      .catch(() => setError('Delete failed'))
  }

  return (
    <div>
      <h3>Light Presets</h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: 0 }}>
        Presets appear on the Lights page as tappable buttons.
      </p>

      {error && <p style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>{error}</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
        {presets.map((p, i) => (
          editIndex === i ? (
            <PresetEditor key={i} preset={p} onSave={handleSave} onCancel={() => setEditIndex(null)} />
          ) : (
            <div key={i} style={{
              background: 'var(--bg-surface)', border: '1px solid var(--border)',
              borderRadius: '6px', padding: '8px 12px',
              display: 'flex', alignItems: 'center', gap: '10px',
            }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: p.colour, flexShrink: 0 }} />
              <span style={{ fontWeight: 600, flex: 1 }}>{p.label}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.commands.length} step{p.commands.length !== 1 ? 's' : ''}</span>
              <button onClick={() => setEditIndex(i)} style={{ ...inp, cursor: 'pointer' }}>Edit</button>
              <button onClick={() => handleDelete(i)} style={{ ...inp, cursor: 'pointer', background: 'var(--danger)', color: '#fff', border: 'none' }}>Del</button>
            </div>
          )
        ))}
      </div>

      {editIndex === -1 ? (
        <PresetEditor preset={BLANK_PRESET} onSave={handleSave} onCancel={() => setEditIndex(null)} />
      ) : (
        <button
          onClick={() => setEditIndex(-1)}
          style={{ ...inp, cursor: 'pointer', background: 'var(--btn-primary)', color: 'var(--btn-primary-text)', border: 'none', fontWeight: 600, padding: '8px 18px' }}
        >+ Add Preset</button>
      )}
    </div>
  )
}
