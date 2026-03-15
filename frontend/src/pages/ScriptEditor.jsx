import { useState, useEffect, useContext } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ProfileContext } from '../context/ProfileContext.js'
import { useRecording } from '../context/RecordingContext.jsx'
import {
  profileAdminGetServos,
  profileGetAudioList,
  profileGetAudioTags,
  profileGetScriptContent,
  profileSaveScript,
} from '../api/client.js'

const STEP_TYPES = [
  { value: 'sleep',        label: 'Wait (sleep)' },
  { value: 'servo_open',   label: 'Servo — Open' },
  { value: 'servo_close',  label: 'Servo — Close' },
  { value: 'servo_move',   label: 'Servo — Move to angle' },
  { value: 'audio_play',   label: 'Audio — Play file' },
  { value: 'audio_random', label: 'Audio — Random by category' },
]

let _uid = 0
function uid() { return ++_uid }

function blankStep(type = 'sleep') {
  return { _id: uid(), type, seconds: '1', servo: '', angle: '90', file: '', category: '' }
}

function parseScr(text) {
  return text.split('\n').map(l => l.trim()).filter(Boolean).map(line => {
    const p = line.split(' ')
    if (p[0] === 'sleep')                              return { _id: uid(), type: 'sleep',        seconds: p[1] ?? '1', servo: '', angle: '90', file: '', category: '' }
    if (p[0] === 'audio' && p[1] === 'play')           return { _id: uid(), type: 'audio_play',   seconds: '1', servo: '', angle: '90', file: p[2] ?? '', category: '' }
    if (p[0] === 'audio' && p[1] === 'random')         return { _id: uid(), type: 'audio_random', seconds: '1', servo: '', angle: '90', file: '', category: p[2] ?? '' }
    if (p[0] === 'servo' && p[1] === 'open')           return { _id: uid(), type: 'servo_open',   seconds: '1', servo: p[2] ?? '', angle: '90', file: '', category: '' }
    if (p[0] === 'servo' && p[1] === 'close')          return { _id: uid(), type: 'servo_close',  seconds: '1', servo: p[2] ?? '', angle: '90', file: '', category: '' }
    if (p[0] === 'servo' && p[1] === 'move')           return { _id: uid(), type: 'servo_move',   seconds: '1', servo: p[2] ?? '', angle: p[3] ?? '90', file: '', category: '' }
    return null
  }).filter(Boolean)
}

function stepsToScr(steps) {
  return steps.map(s => {
    if (s.type === 'sleep')        return `sleep ${s.seconds}`
    if (s.type === 'servo_open')   return `servo open ${s.servo}`
    if (s.type === 'servo_close')  return `servo close ${s.servo}`
    if (s.type === 'servo_move')   return `servo move ${s.servo} ${s.angle}`
    if (s.type === 'audio_play')   return `audio play ${s.file}`
    if (s.type === 'audio_random') return `audio random ${s.category}`
    return ''
  }).filter(Boolean).join('\n')
}

const card = {
  background: 'var(--bg-surface)',
  border: '1px solid var(--border)',
  borderRadius: '6px',
  padding: '10px 12px',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  flexWrap: 'wrap',
}

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
  width: '70px',
}

function StepRow({ step, index, total, servos, audioFiles, categories, onChange, onMove, onDelete }) {
  function set(field, val) { onChange({ ...step, [field]: val }) }

  return (
    <div style={card}>
      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', minWidth: '22px', textAlign: 'right' }}>{index + 1}</span>

      <select style={{ ...sel, minWidth: '190px' }} value={step.type} onChange={e => set('type', e.target.value)}>
        {STEP_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
      </select>

      {step.type === 'sleep' && (
        <>
          <input style={inp} type="number" min="0" step="0.1" value={step.seconds} onChange={e => set('seconds', e.target.value)} />
          <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>seconds</span>
        </>
      )}

      {(step.type === 'servo_open' || step.type === 'servo_close' || step.type === 'servo_move') && (
        <select style={{ ...sel, minWidth: '130px' }} value={step.servo} onChange={e => set('servo', e.target.value)}>
          <option value="">— servo —</option>
          {servos.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
        </select>
      )}

      {step.type === 'servo_move' && (
        <>
          <input style={inp} type="number" min="0" max="180" value={step.angle} onChange={e => set('angle', e.target.value)} />
          <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>°</span>
        </>
      )}

      {step.type === 'audio_play' && (
        <select style={{ ...sel, minWidth: '200px' }} value={step.file} onChange={e => set('file', e.target.value)}>
          <option value="">— file —</option>
          {audioFiles.map(f => <option key={f} value={f}>{f}</option>)}
        </select>
      )}

      {step.type === 'audio_random' && (
        <select style={{ ...sel, minWidth: '150px' }} value={step.category} onChange={e => set('category', e.target.value)}>
          <option value="">— category —</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      )}

      <div style={{ marginLeft: 'auto', display: 'flex', gap: '4px' }}>
        <button onClick={() => onMove(index, -1)} disabled={index === 0}
          style={{ padding: '3px 7px', background: 'var(--bg-hover)', border: '1px solid var(--border)', borderRadius: '3px', cursor: index === 0 ? 'not-allowed' : 'pointer', opacity: index === 0 ? 0.4 : 1 }}>↑</button>
        <button onClick={() => onMove(index, 1)} disabled={index === total - 1}
          style={{ padding: '3px 7px', background: 'var(--bg-hover)', border: '1px solid var(--border)', borderRadius: '3px', cursor: index === total - 1 ? 'not-allowed' : 'pointer', opacity: index === total - 1 ? 0.4 : 1 }}>↓</button>
        <button onClick={() => onDelete(index)}
          style={{ padding: '3px 7px', background: 'var(--danger)', color: '#fff', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>×</button>
      </div>
    </div>
  )
}

export default function ScriptEditor() {
  const { activeProfile } = useContext(ProfileContext)
  const { consumePending } = useRecording()
  const [params] = useSearchParams()
  const navigate = useNavigate()

  const editName = params.get('name') ?? ''
  const [scriptName, setScriptName] = useState(editName)
  const [steps, setSteps] = useState(() => {
    // If we arrived from a recording, seed the steps from it
    return [blankStep()]
  })
  const [servos, setServos] = useState([])
  const [audioFiles, setAudioFiles] = useState([])
  const [categories, setCategories] = useState([])
  const [status, setStatus] = useState(null)
  const [addType, setAddType] = useState('sleep')

  useEffect(() => {
    if (!activeProfile?.id) return
    profileAdminGetServos(activeProfile.id).then(d => setServos(Array.isArray(d) ? d : [])).catch(() => {})
    profileGetAudioList(activeProfile.id).then(d => setAudioFiles(Array.isArray(d) ? d : [])).catch(() => {})
    profileGetAudioTags(activeProfile.id).then(tags => {
      const cats = [...new Set(Object.values(tags))]
      setCategories(cats.length ? cats : ['alarm', 'happy', 'sad', 'misc'])
    }).catch(() => setCategories(['alarm', 'happy', 'sad', 'misc']))

    // Consume steps recorded via the Record button
    const recorded = consumePending()
    if (recorded && recorded.length > 0) {
      const withIds = recorded.map(s => ({ ...s, _id: uid() }))
      setSteps(withIds)
      return
    }

    if (editName) {
      profileGetScriptContent(editName, activeProfile.id)
        .then(d => { if (d?.content) setSteps(parseScr(d.content)) })
        .catch(() => {})
    }
  }, [activeProfile?.id])

  function move(index, dir) {
    setSteps(prev => {
      const next = [...prev]
      const swap = index + dir
      if (swap < 0 || swap >= next.length) return prev;
      [next[index], next[swap]] = [next[swap], next[index]]
      return next
    })
  }

  function updateStep(index, updated) {
    setSteps(prev => prev.map((s, i) => i === index ? updated : s))
  }

  function deleteStep(index) {
    setSteps(prev => prev.filter((_, i) => i !== index))
  }

  function addStep() {
    setSteps(prev => [...prev, blankStep(addType)])
  }

  async function save() {
    if (!scriptName.trim()) { setStatus('error: script name required'); return }
    const content = stepsToScr(steps)
    try {
      await profileSaveScript(scriptName.trim(), content, activeProfile.id)
      setStatus('Saved!')
      setTimeout(() => setStatus(null), 2000)
    } catch {
      setStatus('Save failed')
    }
  }

  const scrPreview = stepsToScr(steps)

  return (
    <div style={{ padding: '16px', maxWidth: '860px' }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button onClick={() => navigate('/scripts')}
          style={{ ...sel, cursor: 'pointer', padding: '5px 10px' }}>← Scripts</button>
        <input
          placeholder="Script name"
          value={scriptName}
          onChange={e => setScriptName(e.target.value)}
          style={{ ...inp, width: '180px', fontSize: '1rem', padding: '5px 8px' }}
        />
        <button onClick={save}
          style={{ padding: '6px 18px', background: 'var(--btn-primary)', color: 'var(--btn-primary-text)', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>
          Save
        </button>
        {status && <span style={{ color: status.startsWith('error') ? 'var(--danger)' : 'var(--success)', fontSize: '0.85rem' }}>{status}</span>}
      </div>

      {/* Step list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }}>
        {steps.length === 0 && (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No steps yet. Add one below.</p>
        )}
        {steps.map((step, i) => (
          <StepRow
            key={step._id}
            step={step}
            index={i}
            total={steps.length}
            servos={servos}
            audioFiles={audioFiles}
            categories={categories}
            onChange={updated => updateStep(i, updated)}
            onMove={move}
            onDelete={deleteStep}
          />
        ))}
      </div>

      {/* Add step row */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '24px' }}>
        <select style={sel} value={addType} onChange={e => setAddType(e.target.value)}>
          {STEP_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <button onClick={addStep}
          style={{ padding: '5px 14px', background: 'var(--success)', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 500 }}>
          + Add Step
        </button>
      </div>

      {/* Script preview */}
      {scrPreview && (
        <details style={{ marginTop: '8px' }}>
          <summary style={{ cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '6px' }}>Preview .scr</summary>
          <pre style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: '4px',
            padding: '10px',
            fontSize: '0.8rem',
            color: 'var(--text-secondary)',
            whiteSpace: 'pre-wrap',
          }}>{scrPreview}</pre>
        </details>
      )}
    </div>
  )
}
