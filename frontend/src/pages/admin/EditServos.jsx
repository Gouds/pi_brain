import { useState, useEffect, useContext } from 'react'
import {
  profileAdminGetServos   as adminGetServos,
  profileAdminAddServo    as adminAddServo,
  profileAdminUpdateServo as adminUpdateServo,
  profileAdminDeleteServo as adminDeleteServo,
  profileAdminGetBuses    as adminGetBuses,
} from '../../api/client.js'
import { ProfileContext } from '../../context/ProfileContext.js'

const BLANK = { id: 0, name: '', bus: '', group: '', default_position: 0, open_position: 0, close_position: 0, position: 0, speed: 100 }

export default function EditServos() {
  const { activeProfile } = useContext(ProfileContext)
  const [servos, setServos] = useState([])
  const [buses, setBuses] = useState([])
  const [form, setForm] = useState(BLANK)
  const [editIndex, setEditIndex] = useState(null)

  function load() {
    adminGetServos().then(data => {
      setServos(data)
      const nextId = data.length > 0 ? Math.max(...data.map(s => s.id ?? 0)) + 1 : 0
      setForm(f => ({ ...f, id: nextId }))
    }).catch(() => {})
    adminGetBuses().then(data => {
      setBuses(Array.isArray(data) ? data : [])
    }).catch(() => {})
  }

  useEffect(load, [activeProfile?.id])

  function handleFormChange(e) {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: numFields.includes(name) ? (value === '' ? 0 : Number(value)) : value }))
  }

  function handleAdd(e) {
    e.preventDefault()
    adminAddServo(form).then(data => {
      setServos(data)
      const nextId = data.length > 0 ? Math.max(...data.map(s => s.id ?? 0)) + 1 : 0
      setForm({ ...BLANK, id: nextId, bus: form.bus, group: form.group })
    }).catch(() => {})
  }

  function handleEditChange(index, field, value) {
    setServos(prev => prev.map((s, i) =>
      i === index ? { ...s, [field]: numFields.includes(field) ? (value === '' ? 0 : Number(value)) : value } : s
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

  const numFields = ['id', 'default_position', 'open_position', 'close_position', 'position', 'speed']
  const rowFields = ['id', 'name', 'bus', 'group', 'default_position', 'open_position', 'close_position', 'position', 'speed']

  // Unique groups already used — for quick-fill datalist
  const existingGroups = [...new Set(servos.map(s => s.group).filter(Boolean))]

  return (
    <div>
      <h3>Edit Servos</h3>

      <form className="admin-form" onSubmit={handleAdd}>
        {Object.keys(BLANK).map(k => (
          k === 'bus' ? (
            <select key={k} name={k} value={form[k]} onChange={handleFormChange}>
              <option value="">— bus —</option>
              {buses.map(b => <option key={b.name} value={b.name}>{b.name}</option>)}
            </select>
          ) : k === 'group' ? (
            <span key={k}>
              <input
                name={k}
                placeholder="group"
                value={form[k]}
                onChange={handleFormChange}
                list="group-list"
              />
              <datalist id="group-list">
                {existingGroups.map(g => <option key={g} value={g} />)}
              </datalist>
            </span>
          ) : (
            <input
              key={k}
              name={k}
              placeholder={k}
              value={form[k]}
              onChange={handleFormChange}
              type={numFields.includes(k) ? 'number' : 'text'}
            />
          )
        ))}
        <button type="submit">Add</button>
      </form>

      <table className="admin-table">
        <thead>
          <tr>
            <th>ID</th><th>Name</th><th>Bus</th><th>Group</th><th>Default</th><th>Open</th><th>Close</th><th>Pos</th><th>Speed</th><th></th>
          </tr>
        </thead>
        <tbody>
          {servos.map((s, i) => (
            <tr key={i}>
              {rowFields.map(f => (
                <td key={f}>
                  {f === 'bus' ? (
                    <select value={s[f] ?? ''} onChange={e => handleEditChange(i, f, e.target.value)}>
                      <option value="">—</option>
                      {buses.map(b => <option key={b.name} value={b.name}>{b.name}</option>)}
                    </select>
                  ) : f === 'group' ? (
                    <span>
                      <input
                        value={s[f] ?? ''}
                        list="group-list"
                        onChange={e => handleEditChange(i, f, e.target.value)}
                      />
                    </span>
                  ) : (
                    <input
                      value={s[f] ?? ''}
                      type={numFields.includes(f) ? 'number' : 'text'}
                      onChange={e => handleEditChange(i, f, e.target.value)}
                    />
                  )}
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
