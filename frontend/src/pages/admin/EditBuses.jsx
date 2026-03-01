import { useState, useEffect, useContext } from 'react'
import {
  profileAdminGetBuses   as adminGetBuses,
  profileAdminAddBus     as adminAddBus,
  profileAdminUpdateBus  as adminUpdateBus,
  profileAdminDeleteBus  as adminDeleteBus,
} from '../../api/client.js'
import { ProfileContext } from '../../context/ProfileContext.js'

const BLANK = { name: '', address: '', scl_pin: '', sda_pin: '' }

export default function EditBuses() {
  const { activeProfile } = useContext(ProfileContext)
  const [buses, setBuses] = useState([])
  const [form, setForm] = useState(BLANK)
  const [editIndex, setEditIndex] = useState(null)

  function load() {
    adminGetBuses().then(setBuses).catch(() => {})
  }

  useEffect(load, [activeProfile?.id])

  function handleFormChange(e) {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
  }

  function handleAdd(e) {
    e.preventDefault()
    adminAddBus(form).then(data => { setBuses(data); setForm(BLANK) }).catch(() => {})
  }

  function handleEditChange(index, field, value) {
    setBuses(prev => prev.map((b, i) => i === index ? { ...b, [field]: value } : b))
    setEditIndex(index)
  }

  function handleSave(index) {
    adminUpdateBus(index, buses[index]).then(data => { setBuses(data); setEditIndex(null) }).catch(() => {})
  }

  function handleDelete(index) {
    if (!confirm('Delete this bus?')) return
    adminDeleteBus(index).then(setBuses).catch(() => {})
  }

  return (
    <div>
      <h3>Edit I2C Buses</h3>

      <form className="admin-form" onSubmit={handleAdd}>
        {Object.keys(BLANK).map(k => (
          <input
            key={k}
            name={k}
            placeholder={k}
            value={form[k]}
            onChange={handleFormChange}
          />
        ))}
        <button type="submit">Add</button>
      </form>

      <table className="admin-table">
        <thead>
          <tr>
            <th>Name</th><th>Address</th><th>SCL Pin</th><th>SDA Pin</th><th></th>
          </tr>
        </thead>
        <tbody>
          {buses.map((b, i) => (
            <tr key={i}>
              {['name', 'address', 'scl_pin', 'sda_pin'].map(f => (
                <td key={f}>
                  <input
                    value={b[f] ?? ''}
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
