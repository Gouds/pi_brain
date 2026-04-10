import { useContext, useState, useRef } from 'react'
import { ProfileContext } from '../context/ProfileContext.js'
import { BUILTIN_PROFILES } from '../profiles/builtins.js'
import { createProfile, updateProfile, deleteProfile } from '../api/profiles.js'
import { profileUploadImage, profileDeleteImage, profileGetImageUrl } from '../api/client.js'

const REQUIRED_COLOR_KEYS = [
  '--bg-primary', '--bg-secondary', '--bg-tertiary', '--bg-surface', '--bg-hover',
  '--border', '--border-strong', '--accent', '--accent-dim',
  '--text-primary', '--text-secondary', '--text-muted',
  '--success', '--danger',
  '--btn-primary', '--btn-primary-text',
]

const ALL_FEATURES = ['home', 'dome', 'body', 'audio', 'scripts', 'lights']

const EMPTY_FORM = {
  id: '',
  label: '',
  layout: 'sidebar',
  robot_name: '',
  api_url: 'http://localhost:8000',
  features: [...ALL_FEATURES],
  base_style_id: 'dark',
}

function ColorField({ name, value, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
      <div style={{ width: 18, height: 18, flexShrink: 0, background: value,
        border: '1px solid var(--border-strong)' }} />
      <span style={{ fontSize: 10, color: 'var(--text-secondary)', width: 140, flexShrink: 0,
        fontFamily: 'monospace' }}>{name}</span>
      <input value={value} onChange={e => onChange(name, e.target.value)} style={{ flex: 1, minWidth: 0 }} />
    </div>
  )
}

function slugify(str) {
  return str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

function validateImport(data) {
  if (!data || typeof data !== 'object') return 'Invalid JSON object'
  if (!data.id || !/^[a-z0-9-]+$/.test(data.id)) return 'Missing or invalid id (must be lowercase slug)'
  if (!data.label) return 'Missing label'
  if (!['sidebar', 'touch'].includes(data.layout)) return 'layout must be "sidebar" or "touch"'
  if (!data.colors || typeof data.colors !== 'object') return 'Missing colors object'
  for (const key of REQUIRED_COLOR_KEYS) {
    if (!(key in data.colors)) return `Missing color key: ${key}`
  }
  if (!data.robot || !data.robot.name || !data.robot.api_url || !Array.isArray(data.robot.features)) {
    return 'Missing or invalid robot field (needs name, api_url, features[])'
  }
  return null
}

/* ── Style Tile ───────────────────────────────────────────────────────────── */

const SWATCH_KEYS = ['--bg-primary', '--bg-secondary', '--accent', '--text-primary', '--border-strong']

function StyleTile({ style, onUseAsTemplate }) {
  return (
    <div style={{
      border: '1px solid var(--border)',
      padding: '0.6rem 0.75rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.4rem',
    }}>
      <div style={{ display: 'flex', gap: 4 }}>
        {SWATCH_KEYS.map(key => (
          <div
            key={key}
            title={key}
            style={{
              width: 14, height: 14,
              background: style.colors[key],
              border: '1px solid rgba(128,128,128,0.3)',
              flexShrink: 0,
            }}
          />
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 600 }}>
          {style.label}
        </span>
        <span style={{
          fontSize: 9,
          padding: '1px 5px',
          border: '1px solid var(--border-strong)',
          color: 'var(--text-secondary)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}>
          {style.layout}
        </span>
      </div>
      <button
        style={{
          background: 'transparent',
          border: '1px solid var(--border-strong)',
          color: 'var(--text-secondary)',
          padding: '2px 8px',
          cursor: 'pointer',
          fontSize: 11,
          fontFamily: 'var(--font-ui)',
          alignSelf: 'flex-start',
        }}
        onClick={() => onUseAsTemplate(style.id)}
      >
        Use as template
      </button>
    </div>
  )
}

/* ── Robot Card ───────────────────────────────────────────────────────────── */

function RobotCard({ profile, isActive, onActivate, onEdit, onDelete, onExport }) {
  const cardStyle = isActive
    ? { border: '1px solid var(--accent)', background: 'var(--accent-dim)' }
    : { border: '1px solid var(--border)' }

  const imgRef = useRef(null)
  const [imgKey, setImgKey] = useState(0)
  const [imgError, setImgError] = useState(false)

  function handleImageUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    profileUploadImage(file, profile.id)
      .then(() => { setImgError(false); setImgKey(k => k + 1) })
      .catch(() => {})
    e.target.value = ''
  }

  function handleImageDelete() {
    if (!confirm('Delete robot image?')) return
    profileDeleteImage(profile.id)
      .then(() => setImgError(true))
      .catch(() => {})
  }

  return (
    <div style={{
      ...cardStyle,
      padding: '0.6rem 0.75rem',
      marginBottom: '0.5rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.3rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 13 }}>
          {profile.label}
        </span>
        <span style={{
          fontSize: 10,
          padding: '1px 6px',
          border: '1px solid var(--border-strong)',
          color: 'var(--text-secondary)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}>
          {profile.layout}
        </span>
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
        {profile.robot.name} — {profile.robot.api_url}
      </div>
      <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.2rem', flexWrap: 'wrap' }}>
        {!isActive ? (
          <button className="btn-save" onClick={() => onActivate(profile.id)}>Activate</button>
        ) : (
          <span style={{ fontSize: 11, color: 'var(--accent)', alignSelf: 'center' }}>✓ Active</span>
        )}
        <button
          className="btn-save"
          style={{ borderColor: 'var(--border-strong)', color: 'var(--text-secondary)' }}
          onClick={() => onEdit(profile)}
        >
          Edit
        </button>
        <button className="btn-danger" onClick={() => onDelete(profile.id)}>Delete</button>
        <button
          style={{
            background: 'transparent',
            border: '1px solid var(--border-strong)',
            color: 'var(--text-secondary)',
            padding: '2px 8px',
            cursor: 'pointer',
            fontSize: 11,
            fontFamily: 'var(--font-ui)',
          }}
          onClick={() => onExport(profile)}
        >
          Export JSON
        </button>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
        {!imgError && (
          <img
            key={imgKey}
            src={`${profileGetImageUrl(profile.id)}?t=${imgKey}`}
            alt="Robot"
            onError={() => setImgError(true)}
            style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 4, border: '1px solid var(--border)' }}
          />
        )}
        <input ref={imgRef} type="file" accept=".png,.jpg,.jpeg,.gif,.webp" style={{ display: 'none' }} onChange={handleImageUpload} />
        <button style={{ fontSize: 11, padding: '2px 8px' }} onClick={() => imgRef.current?.click()}>
          {imgError ? 'Upload Image' : 'Change Image'}
        </button>
        {!imgError && (
          <button className="btn-danger" style={{ fontSize: 11, padding: '2px 8px' }} onClick={handleImageDelete}>
            Remove Image
          </button>
        )}
      </div>
    </div>
  )
}

/* ── Robot Form ───────────────────────────────────────────────────────────── */

function RobotForm({ editingProfile, initialStyleId = 'dark', onSave, onCancel }) {
  const { wideMode } = useContext(ProfileContext)
  const isEdit = Boolean(editingProfile)
  const [form, setForm] = useState(() => {
    if (editingProfile) {
      return {
        id: editingProfile.id,
        label: editingProfile.label,
        layout: editingProfile.layout,
        robot_name: editingProfile.robot.name,
        api_url: editingProfile.robot.api_url,
        features: [...editingProfile.robot.features],
        base_style_id: initialStyleId,
        colors: { '--btn-primary': '#2563eb', '--btn-primary-text': '#ffffff', ...editingProfile.colors },
      }
    }
    const base = BUILTIN_PROFILES.find(p => p.id === initialStyleId) ?? BUILTIN_PROFILES[0]
    return { ...EMPTY_FORM, base_style_id: base.id, layout: base.layout, colors: { ...base.colors } }
  })
  const [idManual, setIdManual] = useState(isEdit)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  function handleLabelChange(e) {
    const label = e.target.value
    setForm(f => ({ ...f, label, id: idManual ? f.id : slugify(label) }))
  }

  function handleIdChange(e) {
    setIdManual(true)
    setForm(f => ({ ...f, id: e.target.value }))
  }

  function toggleFeature(feat) {
    setForm(f => ({
      ...f,
      features: f.features.includes(feat)
        ? f.features.filter(x => x !== feat)
        : [...f.features, feat],
    }))
  }

  async function handleSave() {
    setError('')
    if (!form.id || !/^[a-z0-9-]+$/.test(form.id)) {
      setError('ID must be a lowercase slug (letters, numbers, hyphens)')
      return
    }
    if (!form.label.trim()) {
      setError('Label is required')
      return
    }

    const payload = {
      id: form.id,
      label: form.label,
      layout: form.layout,
      builtin: false,
      colors: form.colors,
      robot: {
        name: form.robot_name || 'My Robot',
        api_url: form.api_url || 'http://localhost:8000',
        features: form.features,
      },
    }

    setSaving(true)
    try {
      if (isEdit) {
        await updateProfile(editingProfile.id, payload)
      } else {
        await createProfile(payload)
      }
      onSave(form.id)
    } catch {
      setError('Save failed — check the backend is running')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <h2>{isEdit ? 'Edit Robot' : 'New Robot'}</h2>

      {error && (
        <p style={{ color: 'var(--danger)', fontSize: 12, margin: '0 0 0.5rem 0' }}>{error}</p>
      )}

      <div className="admin-form" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Label</div>
            <input value={form.label} onChange={handleLabelChange} placeholder="R2-D2" style={{ width: 160 }} />
          </div>
          <div>
            <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>ID</div>
            <input value={form.id} onChange={handleIdChange} placeholder="r2-d2" style={{ width: 130 }} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'flex-end', marginTop: '0.4rem' }}>
          <div>
            <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Robot Name</div>
            <input value={form.robot_name} onChange={e => setForm(f => ({ ...f, robot_name: e.target.value }))} placeholder="My Robot" style={{ width: 130 }} />
          </div>
          <div>
            <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>API URL</div>
            <input value={form.api_url} onChange={e => setForm(f => ({ ...f, api_url: e.target.value }))} placeholder="http://192.168.x.x:8000" style={{ width: 200 }} />
            {form.api_url && !/^https?:\/\//.test(form.api_url) && (
              <div style={{ fontSize: 10, color: 'var(--danger)', marginTop: 2 }}>
                Must start with http:// or https://
              </div>
            )}
          </div>
        </div>

        <div style={{ marginTop: '0.4rem' }}>
          <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Layout</div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            {['sidebar', 'touch'].map(l => (
              <label key={l} style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 12 }}>
                <input type="radio" name="layout" value={l} checked={form.layout === l}
                  onChange={() => setForm(f => ({ ...f, layout: l }))} />
                {l}
              </label>
            ))}
          </div>
        </div>

        <div style={{ marginTop: '0.4rem' }}>
          <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Features</div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {ALL_FEATURES.map(feat => (
              <label key={feat} style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 12 }}>
                <input type="checkbox" checked={form.features.includes(feat)} onChange={() => toggleFeature(feat)} />
                {feat}
              </label>
            ))}
          </div>
        </div>

        {!isEdit && (
          <div style={{ marginTop: '0.4rem' }}>
            <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Style</div>
            <select
              value={form.base_style_id}
              onChange={e => {
                const styleId = e.target.value
                const style = BUILTIN_PROFILES.find(p => p.id === styleId)
                setForm(f => ({ ...f, base_style_id: styleId, layout: style?.layout ?? f.layout, colors: { ...(style?.colors ?? f.colors) } }))
              }}
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-strong)',
                color: 'var(--text-primary)',
                padding: '4px 8px',
                fontSize: 12,
                fontFamily: 'var(--font-ui)',
                outline: 'none',
              }}
            >
              {BUILTIN_PROFILES.map(s => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </div>
        )}

        <div style={{ marginTop: '0.4rem' }}>
          <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 4,
            textTransform: 'uppercase', letterSpacing: '0.06em' }}>Colours</div>
          <div style={{ display: 'grid',
            gridTemplateColumns: wideMode ? '1fr 1fr' : '1fr', gap: '0 1.5rem' }}>
            {REQUIRED_COLOR_KEYS.map(key => (
              <ColorField key={key} name={key} value={form.colors?.[key] ?? ''}
                onChange={(k, v) => setForm(f => ({ ...f, colors: { ...f.colors, [k]: v } }))} />
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
          <button className="btn-save" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button className="btn-danger" style={{ borderColor: 'var(--border-strong)', color: 'var(--text-secondary)' }}
            onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

/* ── Main Profiles Page ───────────────────────────────────────────────────── */

export default function Profiles() {
  const { activeProfile, allProfiles, activateProfile, refreshUserProfiles } = useContext(ProfileContext)
  const userProfiles = allProfiles.filter(p => !p.builtin)

  const [view, setView] = useState('list') // 'list' | 'form'
  const [editingProfile, setEditingProfile] = useState(null)
  const [initialStyleId, setInitialStyleId] = useState('dark')
  const [importError, setImportError] = useState('')
  const fileInputRef = useRef()

  function openNewRobot(styleId = 'dark') {
    setInitialStyleId(styleId)
    setEditingProfile(null)
    setView('form')
  }

  function handleActivate(id) {
    activateProfile(id)
  }

  function handleEdit(profile) {
    setEditingProfile(profile)
    setInitialStyleId('dark')
    setView('form')
  }

  async function handleDelete(id) {
    if (!confirm(`Delete robot "${id}"?`)) return
    try {
      await deleteProfile(id)
      await refreshUserProfiles()
      if (activeProfile?.id === id) activateProfile(userProfiles.find(p => p.id !== id)?.id ?? 'dark')
    } catch {
      alert('Delete failed — check the backend is running')
    }
  }

  function handleExport(profile) {
    const blob = new Blob([JSON.stringify(profile, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${profile.id}.profile.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleSaveForm(savedId) {
    await refreshUserProfiles()
    activateProfile(savedId)
    setView('list')
    setEditingProfile(null)
  }

  function handleCancelForm() {
    setView('list')
    setEditingProfile(null)
  }

  function handleImportClick() {
    setImportError('')
    fileInputRef.current?.click()
  }

  async function handleFileChange(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    const text = await file.text()
    let data
    try {
      data = JSON.parse(text)
    } catch {
      setImportError('Invalid JSON file')
      return
    }

    const validationError = validateImport(data)
    if (validationError) {
      setImportError(validationError)
      return
    }

    data.builtin = false

    const isBuiltin = BUILTIN_PROFILES.some(p => p.id === data.id)
    if (isBuiltin) {
      setImportError(`Cannot import over built-in style "${data.id}"`)
      return
    }

    const existingUser = userProfiles.find(p => p.id === data.id)
    if (existingUser && !confirm(`Robot "${data.id}" already exists. Overwrite?`)) return

    try {
      if (existingUser) {
        await updateProfile(data.id, data)
      } else {
        await createProfile(data)
      }
      await refreshUserProfiles()
      activateProfile(data.id)
      setImportError('')
    } catch {
      setImportError('Import failed — check the backend is running')
    }
  }

  if (view === 'form') {
    return (
      <RobotForm
        editingProfile={editingProfile}
        initialStyleId={initialStyleId}
        onSave={handleSaveForm}
        onCancel={handleCancelForm}
      />
    )
  }

  return (
    <div>
      {/* ── Styles ── */}
      <h3 style={{ margin: '0 0 0.5rem 0', fontSize: 13, textTransform: 'uppercase',
        letterSpacing: '0.08em', color: 'var(--text-secondary)' }}>
        Styles
      </h3>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
        gap: '0.5rem',
        marginBottom: '1.5rem',
      }}>
        {BUILTIN_PROFILES.map(style => (
          <StyleTile key={style.id} style={style} onUseAsTemplate={openNewRobot} />
        ))}
      </div>

      {/* ── Robots ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <h3 style={{ margin: 0, fontSize: 13, textTransform: 'uppercase',
          letterSpacing: '0.08em', color: 'var(--text-secondary)' }}>
          Your Robots
        </h3>
        <button className="btn-save" onClick={() => openNewRobot()}>New Robot</button>
        <button
          style={{
            background: 'transparent',
            border: '1px solid var(--border-strong)',
            color: 'var(--text-secondary)',
            padding: '2px 10px',
            cursor: 'pointer',
            fontSize: 11,
            fontFamily: 'var(--font-ui)',
          }}
          onClick={handleImportClick}
        >
          Import JSON
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </div>

      {importError && (
        <p style={{ color: 'var(--danger)', fontSize: 12, margin: '0 0 0.5rem 0' }}>{importError}</p>
      )}

      {userProfiles.length === 0 && (
        <p style={{ color: 'var(--text-muted)', fontSize: 12, margin: '0.5rem 0' }}>
          No robots yet. Pick a style above or click New Robot to get started.
        </p>
      )}

      {userProfiles.map(profile => (
        <RobotCard
          key={profile.id}
          profile={profile}
          isActive={activeProfile?.id === profile.id}
          onActivate={handleActivate}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onExport={handleExport}
        />
      ))}
    </div>
  )
}
