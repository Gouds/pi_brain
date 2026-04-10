import { useState, useEffect } from 'react'
import {
  adminGetSections,
  adminAddSection,
  adminUpdateSection,
  adminDeleteSection,
} from '../../api/client.js'
import { invalidateSections } from '../../hooks/useSections.js'

const BLANK = { id: '', label: '' }

function slugify(str) {
  return str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

export default function EditSections() {
  const [sections, setSections] = useState([])
  const [form, setForm] = useState(BLANK)
  const [editIndex, setEditIndex] = useState(null)

  function load() {
    adminGetSections().then(setSections).catch(() => {})
  }

  useEffect(load, [])

  function handleChange(e) {
    const { name, value } = e.target
    setForm(f => ({
      ...f,
      [name]: value,
      ...(name === 'label' && !f._idManual ? { id: slugify(value) } : {}),
    }))
  }

  function handleIdChange(e) {
    setForm(f => ({ ...f, id: slugify(e.target.value), _idManual: true }))
  }

  function handleAdd(e) {
    e.preventDefault()
    if (!form.id || !form.label) return
    adminAddSection({ id: form.id, label: form.label })
      .then(data => { setSections(data); setForm(BLANK); invalidateSections() })
      .catch(() => {})
  }

  function handleEditChange(index, field, value) {
    setSections(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s))
    setEditIndex(index)
  }

  function handleSave(index) {
    const { id, label } = sections[index]
    adminUpdateSection(index, { id, label })
      .then(data => { setSections(data); setEditIndex(null); invalidateSections() })
      .catch(() => {})
  }

  function handleDelete(index) {
    if (!confirm(`Delete section "${sections[index].label}"? Servos assigned to it will fall back to their bus name.`)) return
    adminDeleteSection(index)
      .then(data => { setSections(data); invalidateSections() })
      .catch(() => {})
  }

  return (
    <div>
      <h3>Sections</h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: 0 }}>
        Sections appear in the nav menu. Assign servos to a section via <a href="#/admin/servos" style={{ color: 'var(--accent)' }}>Admin → Servos</a>.
      </p>

      <form className="admin-form" onSubmit={handleAdd}>
        <input
          name="label"
          placeholder="Label (e.g. Head)"
          value={form.label}
          onChange={handleChange}
        />
        <input
          name="id"
          placeholder="ID (e.g. head)"
          value={form.id}
          onChange={handleIdChange}
        />
        <button type="submit">Add</button>
      </form>

      <table className="admin-table">
        <thead>
          <tr>
            <th>Label</th>
            <th>ID (slug)</th>
            <th>Route</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {sections.map((s, i) => (
            <tr key={i}>
              <td>
                <input
                  value={s.label}
                  onChange={e => handleEditChange(i, 'label', e.target.value)}
                />
              </td>
              <td>
                <input
                  value={s.id}
                  onChange={e => handleEditChange(i, 'id', slugify(e.target.value))}
                />
              </td>
              <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                #/section/{s.id}
              </td>
              <td>
                {editIndex === i && (
                  <button className="btn-save" onClick={() => handleSave(i)}>Save</button>
                )}
                <button className="btn-danger" onClick={() => handleDelete(i)}>Del</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
