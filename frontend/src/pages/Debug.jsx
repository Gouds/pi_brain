import { getApiUrl } from '../api/client.js'

export default function Debug() {
  const apiUrl = getApiUrl()
  return (
    <div>
      <h2>Debug</h2>
      <p><strong>API URL:</strong> {apiUrl}</p>
      <p>
        <a href={`${apiUrl}/docs`} target="_blank" rel="noreferrer">Open API Docs (Swagger)</a>
      </p>
      <p>
        <a href={`${apiUrl}/health`} target="_blank" rel="noreferrer">Health Check</a>
      </p>
    </div>
  )
}
