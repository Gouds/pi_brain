import { useState } from 'react'
import { getApiUrl, setApiUrl } from '../../api/client.js'

const LS_KEY = 'pi-api-url'

function autoDetectUrl() {
  if (window.location.hostname !== 'localhost') {
    return `http://${window.location.hostname}:8000`
  }
  return 'http://localhost:8000'
}

export default function Connection() {
  const [custom, setCustom] = useState(localStorage.getItem(LS_KEY) ?? '')
  const [testStatus, setTestStatus] = useState(null) // null | 'ok' | 'error'
  const [saved, setSaved] = useState(false)

  const autoUrl = autoDetectUrl()

  function flash() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  function handleSave() {
    const url = custom.trim()
    if (url) {
      localStorage.setItem(LS_KEY, url)
      setApiUrl(url)
    } else {
      localStorage.removeItem(LS_KEY)
      setApiUrl(autoUrl)
    }
    setTestStatus(null)
    flash()
  }

  function handleClear() {
    setCustom('')
    localStorage.removeItem(LS_KEY)
    setApiUrl(autoUrl)
    setTestStatus(null)
    flash()
  }

  async function handleTest() {
    setTestStatus(null)
    const url = (custom.trim() || autoUrl).replace(/\/$/, '')
    try {
      const r = await fetch(`${url}/health`).then(r => r.json())
      setTestStatus(r?.status === 'ok' ? 'ok' : 'error')
    } catch {
      setTestStatus('error')
    }
  }

  const infoStyle = {
    padding: '10px 14px',
    background: 'var(--bg-surface)',
    border: '1px solid var(--border)',
    borderRadius: 6,
    fontSize: '0.85rem',
    marginBottom: 12,
  }

  return (
    <div>
      <h3>Connection</h3>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 16 }}>
        Configure which backend API this frontend connects to.
        By default the API is auto-detected from the current hostname — no rebuild needed when your IP changes.
      </p>

      <div style={infoStyle}>
        <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>Auto-detected URL</div>
        <code style={{ color: 'var(--accent)' }}>{autoUrl}</code>
      </div>

      <div style={infoStyle}>
        <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>Currently active URL</div>
        <code style={{ color: 'var(--text-primary)' }}>{getApiUrl()}</code>
      </div>

      <h4 style={{ margin: '20px 0 6px' }}>Manual Override</h4>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 10 }}>
        Set a custom API URL (e.g. if the backend runs on a different host or port).
        Leave blank to use auto-detect. Saved to browser storage — no rebuild required.
      </p>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
        <input
          type="text"
          value={custom}
          onChange={e => { setCustom(e.target.value); setTestStatus(null) }}
          placeholder={autoUrl}
          style={{
            flex: 1, minWidth: 220,
            padding: '8px 10px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 4,
            color: 'var(--text-primary)',
            fontSize: '0.9rem',
          }}
        />
        <button
          onClick={handleSave}
          style={{ padding: '8px 16px', background: 'var(--btn-primary)', color: 'var(--btn-primary-text)', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 500 }}
        >Save</button>
        <button
          onClick={handleClear}
          style={{ padding: '8px 16px', background: 'var(--bg-hover)', border: '1px solid var(--border)', borderRadius: 4, cursor: 'pointer', color: 'var(--text-primary)' }}
        >Clear</button>
        <button
          onClick={handleTest}
          style={{ padding: '8px 16px', background: 'var(--bg-hover)', border: '1px solid var(--border)', borderRadius: 4, cursor: 'pointer', color: 'var(--text-primary)' }}
        >Test</button>
      </div>

      {saved && (
        <p style={{ color: 'var(--accent)', fontSize: '0.85rem' }}>
          Saved. Reload the page to apply across all profiles.
        </p>
      )}
      {testStatus === 'ok' && (
        <p style={{ color: 'var(--accent)', fontSize: '0.85rem' }}>Connection successful.</p>
      )}
      {testStatus === 'error' && (
        <p style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>Could not reach the backend at that URL.</p>
      )}
    </div>
  )
}
