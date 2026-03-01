import { useState, useEffect } from 'react'
import { getAudioList, playAudio, playRandomAudio } from '../api/client.js'

const SOUND_GROUPS = ['alarm', 'happy', 'hum', 'misc', 'quote', 'razz', 'sad', 'sent', 'ooh', 'proc', 'whistle', 'scream', 'theme']

function startsWith(str, prefix) {
  return str.toLowerCase().startsWith(prefix.toLowerCase())
}

export default function Audio() {
  const [files, setFiles] = useState([])
  const [activeTab, setActiveTab] = useState('random')
  const [lastPlayed, setLastPlayed] = useState(null)

  useEffect(() => {
    getAudioList().then(data => {
      const arr = Array.isArray(data) ? data : []
      setFiles([...arr].sort())
    }).catch(() => {})
  }, [])

  function handlePlay(filename) {
    setLastPlayed(filename)
    playAudio(filename).catch(() => {})
  }

  function handleRandom(prefix) {
    setLastPlayed(`random:${prefix}`)
    playRandomAudio(prefix).catch(() => {})
  }

  function filesForGroup(group) {
    return files.filter(f => startsWith(f, group))
  }

  function otherFiles() {
    return files.filter(f => !SOUND_GROUPS.some(g => startsWith(f, g)))
  }

  const allTabs = [...SOUND_GROUPS, 'other', 'random']

  return (
    <div className="audiowrapper">
      {lastPlayed && (
        <div className="audio-info">Playing… {lastPlayed}</div>
      )}
      <div className="tab-container">
        {allTabs.map(tab => (
          <button
            key={tab}
            className={`tablinks${activeTab === tab ? ' active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {SOUND_GROUPS.map(group => (
        activeTab === group && (
          <div key={group} className="tabcontent">
            <div className="items">
              {filesForGroup(group).map(f => (
                <div key={f} className="item">
                  <a onClick={() => handlePlay(f)}>{f.replace(/\.[^.]+$/, '')}</a>
                </div>
              ))}
            </div>
          </div>
        )
      ))}

      {activeTab === 'other' && (
        <div className="tabcontent">
          <div className="audioitems">
            {otherFiles().map(f => (
              <div key={f} className="audioitem">
                <a onClick={() => handlePlay(f)}>{f.replace(/\.[^.]+$/, '')}</a>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'random' && (
        <div className="tabcontent">
          <div className="audioitems">
            {SOUND_GROUPS.map(g => (
              <div key={g} className="audioitem">
                <a onClick={() => handleRandom(g)}>
                  {g.charAt(0).toUpperCase() + g.slice(1)}
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
