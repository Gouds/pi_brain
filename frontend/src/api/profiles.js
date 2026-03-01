import { getApiUrl } from './client.js'

export const getProfiles = () =>
  fetch(`${getApiUrl()}/profiles`).then(r => r.json())

export const getProfile = (id) =>
  fetch(`${getApiUrl()}/profiles/${encodeURIComponent(id)}`).then(r => r.json())

export const createProfile = (profile) =>
  fetch(`${getApiUrl()}/profiles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profile),
  }).then(r => r.json())

export const updateProfile = (id, profile) =>
  fetch(`${getApiUrl()}/profiles/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profile),
  }).then(r => r.json())

export const deleteProfile = (id) =>
  fetch(`${getApiUrl()}/profiles/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  }).then(r => r.json())
