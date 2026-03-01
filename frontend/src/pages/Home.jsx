import { useState, useEffect } from 'react'
import { getHealth } from '../api/client.js'

export default function Home() {
  const [status, setStatus] = useState('Checking…')

  useEffect(() => {
    function check() {
      getHealth()
        .then(() => setStatus('Online'))
        .catch(() => setStatus('Offline'))
    }
    check()
    const id = setInterval(check, 5000)
    return () => clearInterval(id)
  }, [])

  return (
    <div>
      <h2>Welcome to Pi Brain</h2>
      <p className="home-status">
        API Status:{' '}
        <span className={status === 'Online' ? 'status-online' : 'status-offline'}>
          {status}
        </span>
      </p>
      <p>Use the menu to navigate to controls.</p>
    </div>
  )
}
