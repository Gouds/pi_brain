import { DEFAULT_API_URL } from '../config.js'

let _apiUrl = DEFAULT_API_URL
export function setApiUrl(url) { _apiUrl = url }
export function getApiUrl() { return _apiUrl }

let _profileId = localStorage.getItem('pi-active-profile') ?? null
export function setProfileId(id) { _profileId = id }
export function getProfileId() { return _profileId }

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

export const domeSpin = (speed) =>
  fetch(`${_apiUrl}/dome/spin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ speed }),
  }).then(r => r.json())

export const domeStop = () =>
  fetch(`${_apiUrl}/dome/stop`, { method: 'POST' }).then(r => r.json())

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

// ── Profile-scoped Audio ──────────────────────────────────────────────────────
export const profileGetAudioList = (pid = _profileId) =>
  fetch(`${_apiUrl}/profiles/${pid}/audio/list`).then(r => r.json())

export const profileStopAudio = (pid = _profileId) =>
  fetch(`${_apiUrl}/profiles/${pid}/audio/stop`).then(r => r.json())

export const profilePlayAudio = (filename, pid = _profileId) =>
  fetch(`${_apiUrl}/profiles/${pid}/audio/play/${encodeURIComponent(filename)}`).then(r => r.json())

export const profilePlayRandomAudio = (prefix, pid = _profileId) =>
  fetch(`${_apiUrl}/profiles/${pid}/audio/random/${encodeURIComponent(prefix)}`).then(r => r.json())

export const profileUploadAudio = (file, pid = _profileId) => {
  const fd = new FormData()
  fd.append('file', file)
  return fetch(`${_apiUrl}/profiles/${pid}/audio/upload`, { method: 'POST', body: fd }).then(r => r.json())
}

export const profileDeleteAudio = (filename, pid = _profileId) =>
  fetch(`${_apiUrl}/profiles/${pid}/audio/${encodeURIComponent(filename)}`, { method: 'DELETE' }).then(r => r.json())

export const profileGetAudioFileUrl = (filename, pid = _profileId) =>
  `${_apiUrl}/profiles/${pid}/audio/file/${encodeURIComponent(filename)}`

// ── Profile Audio Tags ────────────────────────────────────────────────────────
export const profileGetAudioTags = (pid = _profileId) =>
  fetch(`${_apiUrl}/profiles/${pid}/audio/tags`).then(r => r.json())

export const profileSetAudioTag = (filename, category, pid = _profileId) =>
  fetch(`${_apiUrl}/profiles/${pid}/audio/tags/${encodeURIComponent(filename)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ category }),
  }).then(r => r.json())

export const profileClearAudioTag = (filename, pid = _profileId) =>
  fetch(`${_apiUrl}/profiles/${pid}/audio/tags/${encodeURIComponent(filename)}`, {
    method: 'DELETE',
  }).then(r => r.json())

export const profileRenameAudio = (filename, newName, pid = _profileId) =>
  fetch(`${_apiUrl}/profiles/${pid}/audio/rename/${encodeURIComponent(filename)}?new_name=${encodeURIComponent(newName)}`, {
    method: 'PUT',
  }).then(r => r.json())

// ── Profile Audio Categories ──────────────────────────────────────────────────
export const profileGetAudioCategories = (pid = _profileId) =>
  fetch(`${_apiUrl}/profiles/${pid}/audio/categories`).then(r => r.json())

export const profileAddAudioCategory = (name, pid = _profileId) =>
  fetch(`${_apiUrl}/profiles/${pid}/audio/categories/${encodeURIComponent(name)}`, {
    method: 'POST',
  }).then(r => r.json())

export const profileRenameAudioCategory = (oldName, newName, pid = _profileId) =>
  fetch(`${_apiUrl}/profiles/${pid}/audio/categories/${encodeURIComponent(oldName)}?new_name=${encodeURIComponent(newName)}`, {
    method: 'PUT',
  }).then(r => r.json())

export const profileRemoveAudioCategory = (name, pid = _profileId) =>
  fetch(`${_apiUrl}/profiles/${pid}/audio/categories/${encodeURIComponent(name)}`, {
    method: 'DELETE',
  }).then(r => r.json())

// ── Profile-scoped Scripts ────────────────────────────────────────────────────
export const profileGetScriptList = (pid = _profileId) =>
  fetch(`${_apiUrl}/profiles/${pid}/scripts/list`).then(r => r.json())

export const profileStartScript = (name, loop = 0, pid = _profileId) =>
  fetch(`${_apiUrl}/profiles/${pid}/scripts/start/${encodeURIComponent(name)}/${loop}`).then(r => r.json())

export const profileUploadScript = (file, pid = _profileId) => {
  const fd = new FormData()
  fd.append('file', file)
  return fetch(`${_apiUrl}/profiles/${pid}/scripts/upload`, { method: 'POST', body: fd }).then(r => r.json())
}

export const profileDeleteScript = (filename, pid = _profileId) =>
  fetch(`${_apiUrl}/profiles/${pid}/scripts/${encodeURIComponent(filename)}`, { method: 'DELETE' }).then(r => r.json())

export const profileGetScriptContent = (name, pid = _profileId) =>
  fetch(`${_apiUrl}/profiles/${pid}/scripts/${encodeURIComponent(name)}/content`).then(r => r.json())

export const profileSaveScript = (name, content, pid = _profileId) =>
  fetch(`${_apiUrl}/profiles/${pid}/scripts/${encodeURIComponent(name)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  }).then(r => r.json())

// ── Profile-scoped Admin: Servos ──────────────────────────────────────────────
export const profileAdminGetServos = (pid = _profileId) =>
  fetch(`${_apiUrl}/profiles/${pid}/admin/servos`).then(r => r.json())

export const profileAdminAddServo = (servo, pid = _profileId) =>
  fetch(`${_apiUrl}/profiles/${pid}/admin/servos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(servo),
  }).then(r => r.json())

export const profileAdminUpdateServo = (index, servo, pid = _profileId) =>
  fetch(`${_apiUrl}/profiles/${pid}/admin/servos/${index}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(servo),
  }).then(r => r.json())

export const profileAdminDeleteServo = (index, pid = _profileId) =>
  fetch(`${_apiUrl}/profiles/${pid}/admin/servos/${index}`, { method: 'DELETE' }).then(r => r.json())

// ── Profile-scoped Admin: Buses ───────────────────────────────────────────────
export const profileAdminGetBuses = (pid = _profileId) =>
  fetch(`${_apiUrl}/profiles/${pid}/admin/buses`).then(r => r.json())

export const profileAdminAddBus = (bus, pid = _profileId) =>
  fetch(`${_apiUrl}/profiles/${pid}/admin/buses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bus),
  }).then(r => r.json())

export const profileAdminUpdateBus = (index, bus, pid = _profileId) =>
  fetch(`${_apiUrl}/profiles/${pid}/admin/buses/${index}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bus),
  }).then(r => r.json())

export const profileAdminDeleteBus = (index, pid = _profileId) =>
  fetch(`${_apiUrl}/profiles/${pid}/admin/buses/${index}`, { method: 'DELETE' }).then(r => r.json())

// ── Profile-scoped Servo Control ─────────────────────────────────────────────
export const profileServoOpen = (servoName, pid = _profileId) =>
  fetch(`${_apiUrl}/profiles/${pid}/servo/open/${encodeURIComponent(servoName)}`).then(r => r.json())

export const profileServoClose = (servoName, pid = _profileId) =>
  fetch(`${_apiUrl}/profiles/${pid}/servo/close/${encodeURIComponent(servoName)}`).then(r => r.json())

export const profileServoMove = (servoName, angle, pid = _profileId) =>
  fetch(`${_apiUrl}/profiles/${pid}/servo/${encodeURIComponent(servoName)}/move/${angle}`).then(r => r.json())

// ── Arduino Flash ─────────────────────────────────────────────────────────────
export const arduinoGetConfig = () =>
  fetch(`${_apiUrl}/admin/arduino/config`).then(r => r.json())

export const arduinoSaveConfig = (config) =>
  fetch(`${_apiUrl}/admin/arduino/config`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  }).then(r => r.json())

// ── Profile Joystick Config ───────────────────────────────────────────────────
export const profileGetJoystickConfig = (pid = _profileId) =>
  fetch(`${_apiUrl}/profiles/${pid}/joystick`).then(r => r.json())

export const profileSaveJoystickConfig = (config, pid = _profileId) =>
  fetch(`${_apiUrl}/profiles/${pid}/joystick`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  }).then(r => r.json())

export const activateProfileOnBackend = (pid) =>
  fetch(`${_apiUrl}/profiles/${pid}/activate`, { method: 'PUT' }).then(r => r.json()).catch(() => {})

// ── Profile Image ─────────────────────────────────────────────────────────────
export const profileGetImageUrl = (pid = _profileId) =>
  `${_apiUrl}/profiles/${pid}/image`

export const profileUploadImage = (file, pid = _profileId) => {
  const fd = new FormData()
  fd.append('file', file)
  return fetch(`${_apiUrl}/profiles/${pid}/image`, { method: 'POST', body: fd }).then(r => r.json())
}

export const profileDeleteImage = (pid = _profileId) =>
  fetch(`${_apiUrl}/profiles/${pid}/image`, { method: 'DELETE' }).then(r => r.json())

// ── Sections ──────────────────────────────────────────────────────────────────
export const getSections = () =>
  fetch(`${_apiUrl}/sections`).then(r => r.json())

export const adminGetSections = () =>
  fetch(`${_apiUrl}/admin/sections`).then(r => r.json())

export const adminAddSection = (section) =>
  fetch(`${_apiUrl}/admin/sections`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(section),
  }).then(r => r.json())

export const adminUpdateSection = (index, section) =>
  fetch(`${_apiUrl}/admin/sections/${index}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(section),
  }).then(r => r.json())

export const adminDeleteSection = (index) =>
  fetch(`${_apiUrl}/admin/sections/${index}`, { method: 'DELETE' }).then(r => r.json())

// ── Lights (AstroPixels) ─────────────────────────────────────────────────────
export const lightsGetPresets = () =>
  fetch(`${_apiUrl}/lights/presets`).then(r => r.json())

export const lightsAddPreset = (preset) =>
  fetch(`${_apiUrl}/lights/presets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(preset),
  }).then(r => r.json())

export const lightsUpdatePreset = (index, preset) =>
  fetch(`${_apiUrl}/lights/presets/${index}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(preset),
  }).then(r => r.json())

export const lightsDeletePreset = (index) =>
  fetch(`${_apiUrl}/lights/presets/${index}`, { method: 'DELETE' }).then(r => r.json())

export const lightsGetConfig = () =>
  fetch(`${_apiUrl}/lights/config`).then(r => r.json())

export const lightsSaveConfig = (config) =>
  fetch(`${_apiUrl}/lights/config`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  }).then(r => r.json())

export const lightsLogic = (params) =>
  fetch(`${_apiUrl}/lights/logic`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  }).then(r => r.json())

export const lightsHolo = (params) =>
  fetch(`${_apiUrl}/lights/holo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  }).then(r => r.json())

export const lightsCommand = (command) =>
  fetch(`${_apiUrl}/lights/command`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ command }),
  }).then(r => r.json())
