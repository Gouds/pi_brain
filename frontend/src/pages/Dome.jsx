import { useState, useEffect } from 'react'
import { getDomeList, openServo, closeServo } from '../api/client.js'

export default function Dome() {
  const [servos, setServos] = useState([])

  useEffect(() => {
    getDomeList().then(setServos).catch(() => {})
  }, [])

  return (
    <div className="servowrapper">
      <div className="diagram">
        <img src="/images/dome.png" width="300" height="300" alt="Dome Diagram" />
      </div>
      <div className="table">
        <table>
          <thead>
            <tr>
              <th>Panel</th>
              <th colSpan={2}>Control</th>
            </tr>
          </thead>
          <tbody>
            {servos.map((servo, i) => (
              <tr key={servo.id ?? i}>
                <td>{i + 1} {servo.name}</td>
                <td><a className="open" onClick={() => openServo(servo.name)}>Open</a></td>
                <td><a className="close" onClick={() => closeServo(servo.name)}>Close</a></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
