import { useState, useEffect } from 'react'
import { getVolume, setVolume } from '../api/client.js'

export default function VolumePopup({ open, onClose }) {
  const [volume, setVol] = useState(50)

  useEffect(() => {
    if (open) {
      getVolume().then(data => {
        if (data?.volume !== undefined) setVol(data.volume)
      }).catch(() => {})
    }
  }, [open])

  function handleChange(e) {
    const v = Number(e.target.value)
    setVol(v)
    setVolume(v).catch(() => {})
  }

  return (
    <div className={`popup ${open ? 'open' : ''}`}>
      <button className="popup-close" onClick={onClose}>&times;</button>
      <div className="volhead">Volume</div>
      <input
        type="range"
        min="0"
        max="100"
        value={volume}
        onChange={handleChange}
      />
      <div>{volume}%</div>
    </div>
  )
}
