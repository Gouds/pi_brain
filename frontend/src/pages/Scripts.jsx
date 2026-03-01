import { useState, useEffect, useRef, useContext } from 'react'
import {
  profileGetScriptList,
  profileStartScript,
  profileUploadScript,
  profileDeleteScript,
} from '../api/client.js'
import { getRunningScripts, stopScript, stopAllScripts } from '../api/client.js'
import { ProfileContext } from '../context/ProfileContext.js'

export default function Scripts() {
  const { activeProfile } = useContext(ProfileContext)
  const isBuiltin = activeProfile?.builtin ?? true

  const [scripts, setScripts] = useState([])
  const [running, setRunning] = useState({})
  const uploadRef = useRef(null)

  function refresh() {
    getRunningScripts().then(data => setRunning(data?.running_scripts ?? {})).catch(() => {})
  }

  function loadScripts() {
    profileGetScriptList().then(data => {
      const arr = Array.isArray(data) ? data : []
      setScripts([...arr].sort())
    }).catch(() => {})
  }

  useEffect(() => {
    loadScripts()
    refresh()
  }, [activeProfile?.id])

  function handleStart(name, loop) {
    profileStartScript(name, loop).then(refresh).catch(() => {})
  }

  function handleStop(id) {
    stopScript(id).then(refresh).catch(() => {})
  }

  function handleStopAll() {
    stopAllScripts().then(refresh).catch(() => {})
  }

  function handleUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    profileUploadScript(file).then(loadScripts).catch(() => {})
    e.target.value = ''
  }

  function handleDelete(filename) {
    if (!confirm(`Delete ${filename}?`)) return
    profileDeleteScript(filename).then(loadScripts).catch(() => {})
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
          {!isBuiltin && (
            <>
              <button onClick={() => uploadRef.current?.click()}>Upload Script</button>
              <input
                ref={uploadRef}
                type="file"
                accept=".scr"
                style={{ display: 'none' }}
                onChange={handleUpload}
              />
            </>
          )}
        </div>
        {scripts.map(f => (
          <div key={f} className="script-item">
            <span>{cleanName(f)}</span>
            <button onClick={() => handleStart(cleanName(f), 0)}>Play Once</button>
            <button onClick={() => handleStart(cleanName(f), 1)}>Loop</button>
            {!isBuiltin && (
              <button className="btn-danger" onClick={() => handleDelete(f)}>Del</button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
