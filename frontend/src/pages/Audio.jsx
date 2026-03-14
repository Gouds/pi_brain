import { useState, useEffect, useContext, useRef } from 'react'
import {
  profileGetAudioList,
  profilePlayAudio,
  profilePlayRandomAudio,
  profileStopAudio,
  profileGetAudioTags,
  profileGetAudioCategories,
  profileGetAudioFileUrl,
} from '../api/client.js'
import { ProfileContext } from '../context/ProfileContext.js'
import { useRecording } from '../context/RecordingContext.jsx'

function getCategory(filename, tags, categories) {
  const tag = tags[filename]
  if (tag && categories.includes(tag)) return tag
  return 'other'
}

function PlayIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="9" />
      <polygon points="9,7 16,11 9,15" fill={active ? 'currentColor' : 'none'} />
    </svg>
  )
}

function AudioCard({ filename, playing, onPlay }) {
  const [hovered, setHovered] = useState(false)
  const isPlaying = playing === filename
  const displayName = filename.replace(/\.[^.]+$/, '')

  return (
    <div
      onClick={() => onPlay(filename)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        height: 48,
        padding: '0 10px',
        borderRadius: 4,
        border: `1px solid ${isPlaying ? 'var(--accent)' : 'var(--border)'}`,
        background: isPlaying
          ? 'var(--accent-dim)'
          : hovered
            ? 'var(--bg-hover)'
            : 'var(--bg-surface)',
        cursor: 'pointer',
        overflow: 'hidden',
        transition: 'background 0.15s',
      }}
    >
      <div style={{ flexShrink: 0, color: isPlaying ? 'var(--accent)' : 'currentColor' }}>
        <PlayIcon active={isPlaying} />
      </div>
      <span style={{
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        fontSize: '0.85em',
      }}>
        {displayName}
      </span>
    </div>
  )
}

export default function Audio() {
  const { activeProfile } = useContext(ProfileContext)
  const { isRecording, record } = useRecording()
  const [files, setFiles] = useState([])
  const [tags, setTags] = useState({})
  const [categories, setCategories] = useState([])
  const [activeTab, setActiveTab] = useState('all')
  const [playing, setPlaying] = useState(null)
  const audioRef = useRef(null)

  useEffect(() => {
    if (!activeProfile?.id) return
    Promise.all([
      profileGetAudioList().catch(() => []),
      profileGetAudioTags().catch(() => ({})),
      profileGetAudioCategories().catch(() => []),
    ]).then(([fileList, tagMap, cats]) => {
      setFiles(Array.isArray(fileList) ? [...fileList].sort() : [])
      setTags(tagMap && typeof tagMap === 'object' ? tagMap : {})
      setCategories(Array.isArray(cats) ? cats : [])
    })
  }, [activeProfile?.id])

  const categorised = {}
  for (const f of files) {
    const cat = getCategory(f, tags, categories)
    if (!categorised[cat]) categorised[cat] = []
    categorised[cat].push(f)
  }

  // Show all defined categories (even empty) + 'other' only if files land there
  const hasOther = (categorised['other']?.length ?? 0) > 0
  const tabs = ['all', ...categories, ...(hasOther ? ['other'] : [])]

  function stopBrowserAudio() {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
  }

  async function handlePlay(filename) {
    stopBrowserAudio()
    setPlaying(filename)
    const result = await profilePlayAudio(filename).catch(() => null)
    if (isRecording) record({ type: 'audio_play', file: filename })
    if (!result?.played) {
      const audio = new window.Audio(profileGetAudioFileUrl(filename))
      audioRef.current = audio
      audio.onended = () => setPlaying(null)
      audio.play().catch(() => {})
    }
  }

  async function handleRandom(category) {
    stopBrowserAudio()
    const result = await profilePlayRandomAudio(category).catch(() => null)
    const filename = result?.filename ?? null
    setPlaying(filename ?? `random:${category}`)
    if (isRecording) record({ type: 'audio_random', category })
    if (!result?.played && filename) {
      const audio = new window.Audio(profileGetAudioFileUrl(filename))
      audioRef.current = audio
      audio.onended = () => setPlaying(null)
      audio.play().catch(() => {})
    }
  }

  function handleStop() {
    stopBrowserAudio()
    setPlaying(null)
    profileStopAudio().catch(() => {})
  }

  function renderCardGrid(fileList) {
    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
        gap: 6,
      }}>
        {fileList.map(f => (
          <AudioCard key={f} filename={f} playing={playing} onPlay={handlePlay} />
        ))}
      </div>
    )
  }

  return (
    <div className="audiowrapper">
      {playing && (
        <div style={{
          padding: '8px 12px',
          marginBottom: 8,
          borderRadius: 4,
          background: 'var(--accent-dim)',
          border: '1px solid var(--accent)',
          fontSize: '0.85em',
          color: 'var(--accent)',
        }}>
          Now playing: {playing.startsWith('random:') ? `Random ${playing.slice(7)}` : playing.replace(/\.[^.]+$/, '')}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8, gap: 8 }}>
        <div className="tab-container" style={{ flex: 1, marginBottom: 0 }}>
          {tabs.map(tab => (
            <button
              key={tab}
              className={`tablinks${activeTab === tab ? ' active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'all'
                ? 'All'
                : `${tab.charAt(0).toUpperCase() + tab.slice(1)} (${categorised[tab]?.length ?? 0})`
              }
            </button>
          ))}
        </div>
        {playing && (
          <button
            onClick={handleStop}
            style={{
              flexShrink: 0,
              padding: '4px 12px',
              background: 'var(--danger)',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: '0.85em',
            }}
          >&#9646;&#9646; Stop</button>
        )}
      </div>

      <div style={{ overflowY: 'auto' }}>
        {activeTab === 'all' ? (
          tabs.slice(1).filter(cat => (categorised[cat]?.length ?? 0) > 0).map(cat => (
            <div key={cat} style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <h3 style={{ margin: 0, fontSize: '0.9em', textTransform: 'capitalize' }}>{cat}</h3>
                <button
                  style={{ fontSize: '0.75em', padding: '2px 8px' }}
                  onClick={() => handleRandom(cat)}
                >
                  Random
                </button>
              </div>
              {renderCardGrid(categorised[cat])}
            </div>
          ))
        ) : (
          <div>
            <div style={{ marginBottom: 8 }}>
              <button
                style={{ fontSize: '0.85em', padding: '4px 12px' }}
                onClick={() => handleRandom(activeTab)}
              >
                Random {activeTab}
              </button>
            </div>
            {renderCardGrid(categorised[activeTab] ?? [])}
          </div>
        )}
      </div>
    </div>
  )
}
