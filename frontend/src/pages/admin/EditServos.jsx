import { useState, useEffect } from 'react'
import { adminGetServos, adminAddServo, adminUpdateServo, adminDeleteServo } from '../../api/client.js'

const BLANK = { id: 0, name: '', bus: '', default_position: 0, open_position: 0, close_position: 0, position: 0 }

export default function EditServos() {
  const [servos, setServos] = useState([])
  const [form, setForm] = useState(BLANK)
  const [editIndex, setEditIndex] = useState(null)

  function load() {
    adminGetServos().then(setServos).catch(() => {})
  }

  useEffect(load, [])

  function handleFormChange(e) {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: isNaN(value) || value === '' ? value : Number(value) }))
  }

  function handleAdd(e) {
    e.preventDefault()
    adminAddServo(form).then(data => { setServos(data); setForm(BLANK) }).catch(() => {})
  }

  function handleEditChange(index, field, value) {
    setServos(prev => prev.map((s, i) =>
      i === index ? { ...s, [field]: isNaN(value) || value === '' ? value : Number(value) } : s
    ))
    setEditIndex(index)
  }

  function handleSave(index) {
    adminUpdateServo(index, servos[index]).then(data => { setServos(data); setEditIndex(null) }).catch(() => {})
  }

  function handleDelete(index) {
    if (!confirm('Delete this servo?')) return
    adminDeleteServo(index).then(setServos).catch(() => {})
  }

  const numFields = ['id', 'default_position', 'open_position', 'close_position', 'position']

  return (
    <div>
      <h3>Edit Servos</h3>

      <form className="admin-form" onSubmit={handleAdd}>
        {Object.keys(BLANK).map(k => (
          <input
            key={k}
            name={k}
            placeholder={k}
            value={form[k]}
            onChange={handleFormChange}
            type={numFields.includes(k) ? 'number' : 'text'}
          />
        ))}
        <button type="submit">Add</button>
      </form>

      <table className="admin-table">
        <thead>
          <tr>
            <th>ID</th><th>Name</th><th>Bus</th><th>Default</th><th>Open</th><th>Close</th><th>Pos</th><th></th>
          </tr>
        </thead>
        <tbody>
          {servos.map((s, i) => (
            <tr key={i}>
              {['id', 'name', 'bus', 'default_position', 'open_position', 'close_position', 'position'].map(f => (
                <td key={f}>
                  <input
                    value={s[f] ?? ''}
                    type={numFields.includes(f) ? 'number' : 'text'}
                    onChange={e => handleEditChange(i, f, e.target.value)}
                  />
                </td>
              ))}
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
