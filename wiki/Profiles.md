# Profiles & Robots

A **profile** is the core concept in Pi Brain. Each profile represents one robot and stores everything specific to it: colour theme, layout, API connection, and all per-robot data (audio files, scripts, servo config).

---

## Profile vs Built-in Style

| Type | Description |
|---|---|
| **Built-in style** | Preset colour themes (dark, light, dark-touch, light-touch). Read-only — used as templates for new robots. |
| **Robot profile** | A user-created profile saved to the backend. Has its own files and configuration. |

---

## Creating a Profile

1. Go to **Settings → Manage Profiles**
2. Pick a style tile to use as a colour template, then click **Use as template** — or click **New Robot** to start from the default dark theme
3. Fill in the form fields (see below)
4. Click **Save**

### Form fields

| Field | Description |
|---|---|
| **Label** | Display name shown in menus and the header |
| **ID** | Lowercase slug (letters, numbers, hyphens). Auto-generated from the label. Used as the folder name on disk — changing it renames the folder. |
| **Robot Name** | Short name shown in the page title bar |
| **API URL** | Full URL of the Pi Brain backend for this robot (e.g. `http://192.168.1.10:8000`) |
| **Layout** | `sidebar` — desktop/browser layout with side navigation. `touch` — bottom nav bar for tablets and touchscreens. |
| **Features** | Which pages are enabled: Home, Dome, Body, Audio, Scripts |
| **Colours** | Full set of CSS custom properties. Edit hex values directly, or use the colour picker swatch. |

---

## Activating a Profile

Click **Activate** on any robot card. The UI immediately switches to that robot's theme, API URL, and data. The active profile is stored in `localStorage` and persists across page reloads.

You can also switch robots quickly from the **🤖 icon** in the header without going to the Profiles page.

---

## Editing a Profile

Click **Edit** on the robot card. All fields are editable including the ID.

> **Renaming the ID** — if you change the ID, Pi Brain automatically renames the `profiles/{old-id}/` directory to `profiles/{new-id}/` on the backend, so all audio files, scripts, tags, and servo config stay linked.

---

## Deleting a Profile

Click **Delete** on the robot card and confirm. This removes the profile from the list **and permanently deletes the `profiles/{id}/` directory** including all uploaded audio, scripts, and configuration for that robot.

---

## Importing & Exporting

**Export** — click **Export JSON** on any robot card to download the profile as a `.profile.json` file. This exports colour theme and settings but not audio files or scripts.

**Import** — click **Import JSON** and select a `.profile.json` file. If a profile with the same ID already exists, you'll be asked to confirm before overwriting.

---

## Colour Themes

Each profile has a full set of CSS custom properties:

| Variable | Purpose |
|---|---|
| `--bg-primary` | Main page background |
| `--bg-secondary` | Sidebar / card backgrounds |
| `--bg-surface` | Raised surface elements |
| `--bg-hover` | Hover state background |
| `--accent` | Primary accent colour (buttons, active states) |
| `--accent-dim` | Muted accent (e.g. now-playing bar background) |
| `--border` | Default border colour |
| `--border-strong` | Prominent borders |
| `--text-primary` | Main text |
| `--text-secondary` | Secondary / muted text |
| `--text-muted` | Placeholder / disabled text |
| `--success` | Success state colour |
| `--danger` | Danger / delete colour |

---

## Robot Image

Each robot card supports an optional image (avatar / photo of your robot):

- Click **Upload Image** on the robot card and choose a `.png`, `.jpg`, `.jpeg`, `.gif`, or `.webp` file
- The image is stored as `profiles/{id}/image.{ext}` on the backend
- Click **Remove Image** to delete it
