# Getting Started

This page walks you through Pi Brain from first launch to playing your first sound.

---

## 1. First Launch

Start Pi Brain with:

```bash
bash start_dev.sh
```

Open **http://localhost:5173** in your browser. You'll land on the Home page with a default dark theme and no robot configured yet.

---

## 2. Create Your First Robot Profile

A **profile** represents one robot. It stores the robot's name, the API URL of its Pi, colour theme, layout, and all its audio/script/servo data.

1. Click the **Settings** link in the sidebar (or swipe up the bottom nav on touch layout)
2. Click **Manage Profiles**
3. Under **Your Robots**, click **New Robot**
4. Fill in:
   - **Label** — a display name (e.g. `R2-D2`)
   - **ID** — auto-generated from the label; used as the folder name on disk (e.g. `r2-d2`)
   - **Robot Name** — used in the header title
   - **API URL** — the address of the Pi's backend (e.g. `http://192.168.1.42:8000`). Use `http://localhost:8000` while developing locally.
   - **Layout** — `sidebar` for desktop/browser, `touch` for a tablet or Pi touchscreen
   - **Features** — tick which pages to enable (Home, Dome, Body, Audio, Scripts)
   - **Style** — pick a base colour theme to start from
5. Click **Save**

The profile is now active. The header will show your robot's name and the colour theme will update immediately.

---

## 3. Navigating the UI

### Sidebar layout

| Element | Purpose |
|---|---|
| Left sidebar | Main navigation links |
| Header — ☰ icon | Cycle menu: left → right → hidden |
| Header — 🤖 icon | Switch between robots |
| Header — 🔊 icon | Open volume slider |
| Header — ↺ icon | Reload the page |
| Header — ⤢ icon | Toggle wide / compact mode |

### Touch layout

The sidebar is replaced by a **bottom navigation bar** for easier thumb access on tablets and touchscreens.

---

## 4. Upload Your First Audio File

1. Go to **Settings → Audio Library**
2. Switch to the **Categories** tab and add a category (e.g. `quotes`)
3. Switch to the **Files** tab
4. Click **Upload Files**, select one or more `.mp3`, `.wav`, or `.ogg` files
5. Optionally type a category in the field next to the upload button before selecting files — all uploaded files will be tagged with it

---

## 5. Play Audio

1. Go to the **Audio** page from the sidebar
2. Your files appear as cards grouped by category
3. Tap a card to play it — on a real Pi, audio plays through the Pi's speaker. In dev mode, it plays in your browser.
4. Use **Random** to pick a random file from a category
5. The **All** tab shows every category at once; individual category tabs filter to just that group

---

## 6. Set the Pi's API URL

When you're ready to connect to a real Pi:

1. Edit your robot profile (Profiles → Edit)
2. Change the **API URL** to `http://<your-pi-ip>:8000`
3. Save — all API calls immediately route to the Pi

You can have multiple profiles pointing to different robots or different Pis.
