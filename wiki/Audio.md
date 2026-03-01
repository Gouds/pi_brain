# Audio System

Pi Brain's audio system is split across two pages:

| Page | Purpose |
|---|---|
| **Audio** (sidebar nav) | Play sounds — card grid, category tabs, random playback |
| **Settings → Audio Library** | Manage files — upload, categorise, rename, delete |

Audio files and their metadata are stored per-robot profile under `profiles/{id}/audio/`.

---

## Supported Formats

`.mp3`, `.wav`, `.ogg`

---

## Audio Library

Navigate to **Settings → Audio Library** to manage your robot's audio files.

### Categories tab

Categories are labels you define for organising your audio files. Each robot has its own category list.

- **Add** — type a name and click Add. The name `other` is reserved by the system and cannot be used.
- **Rename** — click ✏ next to a category, type the new name, and press Enter or click away. All files tagged with the old name are automatically retagged.
- **Delete** — click ✗ to remove a category from the list. Files tagged with it keep their tag but will appear under **Other** on the Audio page until retagged.

The file count next to each category name shows how many uploaded files are currently tagged with it.

### Files tab

#### Uploading

1. Optionally type a **category** in the field (the dropdown shows your defined categories)
2. Click **Upload Files** and select one or more audio files — multiple files can be selected at once
3. The button shows upload progress (`Uploading 2 / 5…`) while files are being sent
4. All selected files are tagged with the category you entered (if any)

#### Managing files

Each file row shows:

| Element | Action |
|---|---|
| Filename | Display only |
| Category input | Type or pick from dropdown — saves automatically when you click away |
| ✏ | Rename the file — type new name, press Enter or click away to confirm |
| ✗ | Delete the file permanently |

> Renaming a file also updates its tag entry so the category assignment is preserved.

---

## Audio Page

The Audio page is for **playback only**. Navigate to it from the sidebar.

### Layout

**Now playing bar** — appears at the top when a file or random play is active, showing the filename.

**Category tabs** — one tab per category defined in your Audio Library, plus **All** (shows everything) and **Other** (appears only if any files have no matching category).

**Card grid** — each file appears as a card with a play icon and filename. Clicking a card plays it.

### Playing audio

- **Single file** — click any card. On a Pi, audio plays through the Pi's speaker via pygame. In dev mode, it plays in your browser.
- **Random** — each category section (and each category tab) has a **Random** button that picks a random file from that category and plays it.

### How categories are assigned for display

1. If the file has an explicit tag matching a defined category → shown in that category
2. Otherwise → shown in **Other**

---

## Audio in Dev Mode

When running locally without a Pi, the backend cannot play audio through speakers (pygame is not available). Instead:

1. The backend responds with `played: false`
2. The frontend falls back to browser audio, fetching the file directly from the backend and playing it through your computer's speakers

This happens automatically — no configuration needed.

---

## File Storage

All files for a robot are stored at:

```
profiles/{robot-id}/
├── audio/                    # Audio files (.mp3, .wav, .ogg)
├── audio_tags.json           # { "filename.mp3": "category-name" }
└── audio_categories.json     # ["alarm", "quotes", "custom-cat"]
```

These files are created automatically when you first upload or tag something.
