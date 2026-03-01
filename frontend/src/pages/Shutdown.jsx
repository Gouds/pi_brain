import { useState } from 'react'
import { shutdown } from '../api/client.js'

export default function Shutdown() {
  const [confirmed, setConfirmed] = useState(false)
  const [message, setMessage] = useState(null)

  function handleShutdown() {
    shutdown()
      .then(data => setMessage(data?.message ?? 'Shutting down…'))
      .catch(() => setMessage('Shutdown command sent.'))
  }

  return (
    <div>
      <h2>Shutdown</h2>
      {message ? (
        <p>{message}</p>
      ) : !confirmed ? (
        <>
          <p>Are you sure you want to shut down the Raspberry Pi?</p>
          <button onClick={() => setConfirmed(true)}>Yes, Shutdown</button>
        </>
      ) : (
        <>
          <p>This will shut down the Pi. You will lose access until it is powered back on.</p>
          <button onClick={handleShutdown}>Confirm Shutdown</button>
          <button onClick={() => setConfirmed(false)} style={{ marginLeft: '1rem' }}>Cancel</button>
        </>
      )}
    </div>
  )
}
