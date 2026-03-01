import { useState, useEffect, useContext, useRef } from 'react'
import {
  profileGetAudioList,
  profileGetAudioTags,
  profileSetAudioTag,
  profileClearAudioTag,
  profileUploadAudio,
  profileDeleteAudio,
  profileRenameAudio,
  profileGetAudioCategories,
  profileAddAudioCategory,
  profileRenameAudioCategory,
  profileRemoveAudioCategory,
} from '../api/client.js'
import { ProfileContext } from '../context/ProfileContext.js'

export default function AudioLibrary() {
  const { activeProfile } = useContext(ProfileContext)
  const [tab, setTab] = useState('files')

  // ── shared state ────────────────────────────────────────────────────────────
  const [files, setFiles] = useState([])
  const [tags, setTags] = useState({})
  const [categories, setCategories] = useState([])

  // ── files tab state ─────────────────────────────────────────────────────────
  const [uploadProgress, setUploadProgress] = useState(null)
  const [uploadCategory, setUploadCategory] = useState('')
  const [renamingFile, setRenamingFile] = useState(null)
  const [newFileName, setNewFileName] = useState('')
  const uploadRef = useRef(null)

  // ── categories tab state ────────────────────────────────────────────────────
  const [newCategory, setNewCategory] = useState('')
  const [renamingCategory, setRenamingCategory] = useState(null)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [categoryError, setCategoryError] = useState('')

  function load() {
    if (!activeProfile?.id) return
    Promise.all([
      profileGetAudioList().catch(() => []),
      profileGetAudioTags().catch(() => ({})),
      profileGetAudioCategories().catch(() => []),
    ]).then(([fileList, tagMap, cats]) => {
      setFiles(Array.isArray(fileList) ? [...fileList].sort() : [])
      setTags(tagMap && typeof tagMap === 'object' ? tagMap : {})
      setCategories(Array.isArray(cats) ? cats : [])
    })
  }

  useEffect(() => { load() }, [activeProfile?.id])


  // ── files tab handlers ──────────────────────────────────────────────────────
  async function handleUpload(e) {
    const selected = Array.from(e.target.files ?? [])
    if (!selected.length) return
    setUploadProgress({ done: 0, total: selected.length })
    const cat = uploadCategory.trim()
    try {
      for (let i = 0; i < selected.length; i++) {
        setUploadProgress({ done: i, total: selected.length })
        const file = selected[i]
        await profileUploadAudio(file)
        if (cat) await profileSetAudioTag(file.name, cat)
      }
      setUploadCategory('')
      e.target.value = ''
      load()
    } catch (err) {
      console.error(err)
    } finally {
      setUploadProgress(null)
    }
  }

  async function handleTagBlur(filename, value) {
    if (!value.trim()) {
      await profileClearAudioTag(filename).catch(() => {})
    } else {
      await profileSetAudioTag(filename, value.trim()).catch(() => {})
    }
    profileGetAudioTags().then(t => setTags(t ?? {})).catch(() => {})
  }

  async function handleDeleteFile(filename) {
    if (!confirm(`Delete ${filename}?`)) return
    await profileDeleteAudio(filename).catch(() => {})
    load()
  }

  async function handleRenameFile(filename) {
    if (!newFileName.trim() || newFileName === filename) {
      setRenamingFile(null)
      return
    }
    await profileRenameAudio(filename, newFileName.trim()).catch(() => {})
    setRenamingFile(null)
    load()
  }

  // ── categories tab handlers ─────────────────────────────────────────────────
  async function handleAddCategory(e) {
    e.preventDefault()
    const name = newCategory.trim()
    if (!name) return
    if (name.toLowerCase() === 'other') {
      setCategoryError('"other" is reserved by the system and cannot be used as a category name.')
      return
    }
    if (categories.includes(name)) return
    const updated = await profileAddAudioCategory(name).catch(() => null)
    if (updated) setCategories(updated)
    setNewCategory('')
    setCategoryError('')
  }

  async function handleRenameCategory(oldName) {
    const name = newCategoryName.trim()
    setRenamingCategory(null)
    if (!name || name === oldName) return
    if (name.toLowerCase() === 'other') {
      setCategoryError('"other" is reserved by the system and cannot be used as a category name.')
      return
    }
    const updated = await profileRenameAudioCategory(oldName, name).catch(() => null)
    if (updated) {
      setCategories(updated)
      // Reflect tag changes locally without a full reload
      setTags(prev => {
        const next = { ...prev }
        for (const f in next) if (next[f] === oldName) next[f] = name
        return next
      })
    }
  }

  async function handleRemoveCategory(name) {
    const updated = await profileRemoveAudioCategory(name).catch(() => null)
    if (updated) setCategories(updated)
  }

  // ── render ──────────────────────────────────────────────────────────────────
  return (
    <div>
      <h2>Audio Library</h2>

      <div className="tab-container" style={{ marginBottom: 12 }}>
        <button
          className={`tablinks${tab === 'files' ? ' active' : ''}`}
          onClick={() => setTab('files')}
        >
          Files {files.length > 0 && `(${files.length})`}
        </button>
        <button
          className={`tablinks${tab === 'categories' ? ' active' : ''}`}
          onClick={() => setTab('categories')}
        >
          Categories {categories.length > 0 && `(${categories.length})`}
        </button>
      </div>

      {/* ── Files tab ── */}
      {tab === 'files' && (
        <div>
          <div style={{ marginBottom: 12, padding: 10, background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 6 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => uploadRef.current?.click()} disabled={uploadProgress !== null}>
                {uploadProgress !== null
                  ? `Uploading ${uploadProgress.done + 1} / ${uploadProgress.total}…`
                  : 'Upload Files'}
              </button>
              <input
                ref={uploadRef}
                type="file"
                accept=".mp3,.wav,.ogg"
                multiple
                style={{ display: 'none' }}
                onChange={handleUpload}
              />
              <input
                type="text"
                placeholder="Category (optional)"
                value={uploadCategory}
                onChange={e => setUploadCategory(e.target.value)}
                list="cat-list"
                style={{ flex: 1, minWidth: 120 }}
              />
            </div>
          </div>

          <datalist id="cat-list">
            {[...categories].sort().map(c => <option key={c} value={c} />)}
          </datalist>

          {files.length === 0 && (
            <p style={{ color: 'var(--text-muted)' }}>No audio files uploaded yet.</p>
          )}
          {files.map(filename => (
            <div
              key={filename}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 0',
                borderBottom: '1px solid var(--border)',
              }}
            >
              {renamingFile === filename ? (
                <input
                  autoFocus
                  value={newFileName}
                  onChange={e => setNewFileName(e.target.value)}
                  onBlur={() => handleRenameFile(filename)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleRenameFile(filename)
                    if (e.key === 'Escape') setRenamingFile(null)
                  }}
                  style={{ flex: 1 }}
                />
              ) : (
                <span style={{ flex: 1, fontSize: '0.9em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {filename}
                </span>
              )}
              <input
                type="text"
                defaultValue={tags[filename] ?? ''}
                placeholder="category"
                list="cat-list"
                onBlur={e => handleTagBlur(filename, e.target.value)}
                style={{ width: 110, fontSize: '0.85em' }}
              />
              <button
                title="Rename"
                style={{ padding: '2px 6px', fontSize: '0.85em' }}
                onClick={() => { setRenamingFile(filename); setNewFileName(filename) }}
              >✏</button>
              <button
                title="Delete"
                className="btn-danger"
                style={{ padding: '2px 6px', fontSize: '0.85em' }}
                onClick={() => handleDeleteFile(filename)}
              >✗</button>
            </div>
          ))}
        </div>
      )}

      {/* ── Categories tab ── */}
      {tab === 'categories' && (
        <div>
          <form onSubmit={handleAddCategory} style={{ display: 'flex', gap: 8, marginBottom: categoryError ? 4 : 12 }}>
            <input
              type="text"
              placeholder="New category…"
              value={newCategory}
              onChange={e => { setNewCategory(e.target.value); setCategoryError('') }}
              style={{ flex: 1 }}
            />
            <button type="submit">Add</button>
          </form>
          {categoryError && (
            <p style={{ margin: '0 0 12px 0', fontSize: '0.82em', color: 'var(--color-error, #e05)' }}>
              {categoryError}
            </p>
          )}

          {categories.length === 0 && (
            <p style={{ color: 'var(--text-muted)' }}>No categories yet.</p>
          )}
          {categories.map(cat => {
            const fileCount = Object.values(tags).filter(t => t === cat).length
            return (
              <div
                key={cat}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 0',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                {renamingCategory === cat ? (
                  <input
                    autoFocus
                    value={newCategoryName}
                    onChange={e => setNewCategoryName(e.target.value)}
                    onBlur={() => handleRenameCategory(cat)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleRenameCategory(cat)
                      if (e.key === 'Escape') setRenamingCategory(null)
                    }}
                    style={{ flex: 1 }}
                  />
                ) : (
                  <>
                    <span style={{ flex: 1 }}>{cat}</span>
                    <span style={{ fontSize: '0.8em', color: 'var(--text-muted)' }}>
                      {fileCount} {fileCount === 1 ? 'file' : 'files'}
                    </span>
                  </>
                )}
                <button
                  title="Rename"
                  style={{ padding: '2px 6px', fontSize: '0.85em' }}
                  onClick={() => { setRenamingCategory(cat); setNewCategoryName(cat) }}
                >✏</button>
                <button
                  title="Delete"
                  className="btn-danger"
                  style={{ padding: '2px 6px', fontSize: '0.85em' }}
                  onClick={() => handleRemoveCategory(cat)}
                >✗</button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
