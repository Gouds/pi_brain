import { useState, useEffect } from 'react'
import { getScriptList, getRunningScripts, startScript, stopScript, stopAllScripts } from '../api/client.js'

export default function Scripts() {
  const [scripts, setScripts] = useState([])
  const [running, setRunning] = useState({})

  function refresh() {
    getRunningScripts().then(data => setRunning(data?.running_scripts ?? {})).catch(() => {})
  }

  useEffect(() => {
    getScriptList().then(data => {
      const arr = Array.isArray(data) ? data : []
      setScripts([...arr].sort())
    }).catch(() => {})
    refresh()
  }, [])

  function handleStart(name, loop) {
    startScript(name, loop).then(refresh).catch(() => {})
  }

  function handleStop(id) {
    stopScript(id).then(refresh).catch(() => {})
  }

  function handleStopAll() {
    stopAllScripts().then(refresh).catch(() => {})
  }

  const cleanName = (f) => f.replace(/\.scr$/i, '').replace(/^"|"$/g, '').trim()

  return (
    <div>
      <div className="script-container">
        <h3>Running Scripts</h3>
        <div className="items">
          {Object.entries(running).map(([id, details]) => (
            <div key={id} className="script-item">
              <span>{details.script_name}</span>
              <button onClick={() => handleStop(id)}>Stop</button>
            </div>
          ))}
          {Object.keys(running).length === 0 && <div>No scripts running.</div>}
        </div>
      </div>

      <div className="script-container">
        <h3>All Scripts</h3>
        <div className="script-item">
          <button onClick={handleStopAll}>Stop All</button>
        </div>
        {scripts.map(f => (
          <div key={f} className="script-item">
            <span>{cleanName(f)}</span>
            <button onClick={() => handleStart(cleanName(f), 0)}>Play Once</button>
            <button onClick={() => handleStart(cleanName(f), 1)}>Loop</button>
          </div>
        ))}
      </div>
    </div>
  )
}
