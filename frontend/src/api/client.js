import { DEFAULT_API_URL } from '../config.js'

let _apiUrl = DEFAULT_API_URL
export function setApiUrl(url) { _apiUrl = url }
export function getApiUrl() { return _apiUrl }

// ── Health ────────────────────────────────────────────────────────────────────
export const getHealth = () =>
  fetch(`${_apiUrl}/health`).then(r => r.json())

// ── Audio ─────────────────────────────────────────────────────────────────────
export const getAudioList = () =>
  fetch(`${_apiUrl}/audio/list/`).then(r => r.json())

export const playAudio = (filename) =>
  fetch(`${_apiUrl}/audio/${encodeURIComponent(filename)}`).then(r => r.json())

export const playRandomAudio = (prefix) =>
  fetch(`${_apiUrl}/audio/random/${encodeURIComponent(prefix)}`).then(r => r.json())

export const getVolume = () =>
  fetch(`${_apiUrl}/volume`).then(r => r.json())

export const setVolume = (level) =>
  fetch(`${_apiUrl}/volume/${level}`, { method: 'PUT' }).then(r => r.json())

// ── Dome ──────────────────────────────────────────────────────────────────────
export const getDomeList = () =>
  fetch(`${_apiUrl}/dome/list`).then(r => r.json())

// ── Body ──────────────────────────────────────────────────────────────────────
export const getBodyList = () =>
  fetch(`${_apiUrl}/body/list`).then(r => r.json())

// ── Servo ─────────────────────────────────────────────────────────────────────
export const openServo = (name) =>
  fetch(`${_apiUrl}/servo/open/${encodeURIComponent(name)}`).then(r => r.json())

export const closeServo = (name) =>
  fetch(`${_apiUrl}/servo/close/${encodeURIComponent(name)}`).then(r => r.json())

// ── Scripts ───────────────────────────────────────────────────────────────────
export const getScriptList = () =>
  fetch(`${_apiUrl}/script/list/`).then(r => r.json())

export const getRunningScripts = () =>
  fetch(`${_apiUrl}/script/list_running`).then(r => r.json())

export const startScript = (name, loop = 0) =>
  fetch(`${_apiUrl}/script/start/${encodeURIComponent(name)}/${loop}`).then(r => r.json())

export const stopScript = (id) =>
  fetch(`${_apiUrl}/script/stop/${encodeURIComponent(id)}`).then(r => r.json())

export const stopAllScripts = () =>
  fetch(`${_apiUrl}/script/stop_all`).then(r => r.json())

// ── Admin: Servos ─────────────────────────────────────────────────────────────
export const adminGetServos = () =>
  fetch(`${_apiUrl}/admin/servos`).then(r => r.json())

export const adminAddServo = (servo) =>
  fetch(`${_apiUrl}/admin/servos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(servo),
  }).then(r => r.json())

export const adminUpdateServo = (index, servo) =>
  fetch(`${_apiUrl}/admin/servos/${index}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(servo),
  }).then(r => r.json())

export const adminDeleteServo = (index) =>
  fetch(`${_apiUrl}/admin/servos/${index}`, { method: 'DELETE' }).then(r => r.json())

// ── Admin: Buses ──────────────────────────────────────────────────────────────
export const adminGetBuses = () =>
  fetch(`${_apiUrl}/admin/buses`).then(r => r.json())

export const adminAddBus = (bus) =>
  fetch(`${_apiUrl}/admin/buses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bus),
  }).then(r => r.json())

export const adminUpdateBus = (index, bus) =>
  fetch(`${_apiUrl}/admin/buses/${index}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bus),
  }).then(r => r.json())

export const adminDeleteBus = (index) =>
  fetch(`${_apiUrl}/admin/buses/${index}`, { method: 'DELETE' }).then(r => r.json())

// ── System ────────────────────────────────────────────────────────────────────
export const shutdown = () =>
  fetch(`${_apiUrl}/shutdown`).then(r => r.json())
