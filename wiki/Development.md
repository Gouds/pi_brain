# Development Guide

This page covers running Pi Brain locally, the project structure, and how the frontend and backend fit together.

---

## Running in Dev Mode

```bash
git clone https://github.com/Gouds/pi_brain.git
cd pi_brain
bash start_dev.sh
```

`start_dev.sh` will:
1. Create a Python virtual environment (`venv/`) if one doesn't exist
2. Install Python dependencies from `requirements.txt`
3. Install npm packages if `node_modules/` is missing
4. Start the FastAPI backend on port **8000** with `--reload` (auto-restarts on file changes)
5. Start the Vite dev server on port **5173** with hot module replacement

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| Swagger UI | http://localhost:8000/docs |
| ReDoc | http://localhost:8000/redoc |

Press **Ctrl+C** to stop both servers.

---

## Hardware Mocks

When running on a non-Pi machine, hardware libraries are automatically mocked:

| Library | Mock behaviour |
|---|---|
| `RPi.GPIO` | All GPIO calls are no-ops, logged to console |
| `pygame` | Audio play calls log `[MOCK AUDIO] would play: filename` |
| Adafruit ServoKit | Servo moves are no-ops |

The mocks live in `mocks/` and are imported automatically when the real libraries aren't available.

**Audio in dev mode** — the frontend detects when the backend couldn't play audio (`played: false` in the response) and falls back to streaming the file via the browser's Audio API so you can hear sounds while developing.

---

## Project Structure

```
pi_brain/
├── app.py                      # All FastAPI routes
├── start_dev.sh                # Dev startup script
├── requirements.txt            # Python deps (dev)
├── requirements-pi.txt         # Python deps (Pi hardware)
├── configs/
│   ├── servo_config.json       # Global servo & I²C bus config
│   ├── pin_config.json         # GPIO pin definitions
│   └── profiles.json           # Saved robot profiles
├── profiles/                   # Per-robot runtime data
│   └── {robot-id}/
│       ├── audio/
│       ├── scripts/
│       ├── audio_tags.json
│       ├── audio_categories.json
│       ├── servo_config.json
│       └── image.{ext}
├── plugins/
│   ├── audio/audio_control.py
│   ├── dome/dome_control.py
│   ├── body/body_control.py
│   └── script/script_control.py
├── mocks/                      # Hardware stubs for dev
└── frontend/
    ├── src/
    │   ├── App.jsx             # Routes
    │   ├── api/
    │   │   ├── client.js       # All fetch wrappers
    │   │   └── profiles.js     # Profile CRUD helpers
    │   ├── components/         # Header, SideMenu, Footer, etc.
    │   ├── context/
    │   │   └── ProfileContext.js
    │   ├── hooks/
    │   │   └── useProfile.js   # Active profile, CSS vars, API URL sync
    │   ├── pages/
    │   │   ├── Audio.jsx       # Play-only audio page
    │   │   ├── AudioLibrary.jsx
    │   │   ├── Profiles.jsx
    │   │   ├── Settings.jsx
    │   │   ├── Scripts.jsx
    │   │   └── admin/
    │   │       ├── Admin.jsx
    │   │       ├── EditServos.jsx
    │   │       └── EditBuses.jsx
    │   └── profiles/
    │       └── builtins.js     # Built-in colour themes (frontend-only)
    └── dist/                   # Production build output
```

---

## Backend — Key Concepts

**Single file** — all API routes are in `app.py`. The file is long but logically sectioned with comments.

**Profile-scoped routes** — most data is scoped to a robot profile: `/profiles/{profile_id}/audio/...`, `/profiles/{profile_id}/scripts/...`, etc. This means each robot is fully independent.

**Config files** — global config lives in `configs/`. Per-robot config lives in `profiles/{id}/`. Both are plain JSON, human-readable and hand-editable.

**CORS** — fully open (`allow_origins=["*"]`) so the frontend on port 5173 can talk to the backend on port 8000 without a proxy.

---

## Frontend — Key Concepts

**HashRouter** — React Router uses hash-based URLs (`/#/audio`, `/#/settings`) so the built app can be served as static files without any server-side routing config.

**ProfileContext** — wraps the whole app. Provides `activeProfile`, `allProfiles`, `activateProfile()`, `wideMode`, etc. Consumed via `useContext(ProfileContext)` in any component.

**useProfile hook** — drives the profile system: fetches user profiles from the backend, injects CSS custom properties into `<style>` tags, sets the `data-layout` attribute on `.wrapper`, syncs the API URL and profile ID into `client.js`, and persists the active profile ID in `localStorage`.

**client.js** — all `fetch()` calls live here. It tracks `_apiUrl` (the active robot's backend URL) and `_profileId` (the active robot's ID). Both are updated whenever the profile changes.

---

## Adding a New Page

1. Create `frontend/src/pages/MyPage.jsx`
2. Add the route in `frontend/src/App.jsx`:
   ```jsx
   import MyPage from './pages/MyPage.jsx'
   // ...
   <Route path="/my-page" element={<MyPage />} />
   ```
3. Add a title in `frontend/src/components/Header.jsx`:
   ```js
   '/my-page': 'My Page',
   ```
4. Add a nav link in `frontend/src/components/SideMenu.jsx` or `BottomNav.jsx`

---

## Adding a New API Endpoint

All endpoints go in `app.py`. Follow the existing pattern:

```python
@app.get("/profiles/{profile_id}/my-resource", tags=["Admin"])
async def my_endpoint(profile_id: str):
    # ...
    return {"data": "..."}
```

Add the corresponding fetch wrapper in `frontend/src/api/client.js`:

```js
export const myEndpoint = (pid = _profileId) =>
  fetch(`${_apiUrl}/profiles/${pid}/my-resource`).then(r => r.json())
```

---

## Environment Variables

The frontend reads `VITE_API_URL` from `frontend/.env` as the default API URL (used before a profile is activated):

```
# frontend/.env
VITE_API_URL=http://localhost:8000
```

`start_dev.sh` copies `frontend/.env.example` to `frontend/.env` automatically on first run if the file doesn't exist.
