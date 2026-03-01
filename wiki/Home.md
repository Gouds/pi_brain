# Pi Brain

Pi Brain is a web-based control interface for Raspberry Pi robots and droids. It runs on the Pi and is accessed from any device on the same network — a phone, tablet, or browser — giving you a touch-friendly dashboard to control audio, servos, GPIO, and scripts.

---

## Features

- **Robot Profiles** — each robot gets its own profile with custom colours, layout, API URL, and per-robot audio/scripts/servo config
- **Audio** — upload sound files, organise them into categories, and play them from a card grid with one tap
- **Scripts** — upload and run `.scr` automation scripts that chain audio and servo commands
- **Servo / Bus Control** — manage I²C buses and servo positions through the admin interface
- **GPIO** — control GPIO pins directly from the web UI
- **Volume** — global volume control accessible from the header
- **Touch layout** — switch any profile to a bottom-nav touch layout for tablet/touchscreen use

---

## Wiki Pages

| Page | Description |
|---|---|
| [Installation](Installation) | Set up Pi Brain on a Raspberry Pi or a dev machine |
| [Getting Started](Getting-Started) | Create your first robot and find your way around the UI |
| [Profiles & Robots](Profiles) | Manage robot profiles, layouts, and colour themes |
| [Audio System](Audio) | Upload audio, manage categories, and play sounds |
| [Admin — Servos & Buses](Admin) | Configure I²C buses and servo endpoints |
| [Development Guide](Development) | Run Pi Brain locally, understand the code structure |

---

## Quick Start

```bash
git clone https://github.com/Gouds/pi_brain.git
cd pi_brain
bash start_dev.sh
```

Then open **http://localhost:5173** in your browser.

> For Raspberry Pi deployment see the [Installation](Installation) page.
