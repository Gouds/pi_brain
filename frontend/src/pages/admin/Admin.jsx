import { Link } from 'react-router-dom'

export default function Admin() {
  return (
    <div>
      <h2>Admin</h2>
      <ul>
        <li><Link to="/admin/servos">Edit Servos</Link></li>
        <li><Link to="/admin/buses">Edit I2C Buses</Link></li>
        <li><Link to="/admin/connection">Connection</Link></li>
      </ul>
    </div>
  )
}
