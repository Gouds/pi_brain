# Admin — Servos & Buses

The Admin section lets you configure the I²C buses and servo endpoints that Pi Brain uses to physically move your robot's parts.

Navigate to **Settings → Admin → Servo & Bus Config**, or go directly to `/admin` in the sidebar.

---

## I²C Buses

An I²C bus connects a servo controller board (such as the Adafruit PCA9685 / ServoKit) to the Pi.

### Fields

| Field | Description |
|---|---|
| **Name** | Identifier used when assigning servos (e.g. `dome`, `body`) |
| **Address** | I²C hex address of the board (e.g. `0x40`) |
| **SCL Pin** | Clock pin label (e.g. `SCL`) |
| **SDA Pin** | Data pin label (e.g. `SDA`) |

### Managing buses

Go to **Admin → Edit Buses**:

- **Add** — fill in the form and click Add Bus
- **Edit** — click Edit on a bus row, modify fields, click Save
- **Delete** — click Delete and confirm

Buses are saved to `configs/servo_config.json` immediately.

---

## Servos

Each servo is a single output channel on a servo board, mapped to a named action (e.g. `dome_rotate`, `utility_arm`).

### Fields

| Field | Description |
|---|---|
| **ID** | Channel number on the servo board (0–15) |
| **Name** | Human-readable name (e.g. `dome_rotate`) |
| **Bus** | Which I²C bus this servo is on (must match a bus name) |
| **Default Position** | Starting position (0–180 degrees) |
| **Open Position** | Position used by the "open" command |
| **Close Position** | Position used by the "close" command |

### Managing servos

Go to **Admin → Edit Servos**:

- **Add** — fill in the form and click Add Servo
- **Edit** — click Edit on a servo row, modify fields, click Save
- **Delete** — click Delete and confirm

### Per-robot servo config

Each robot profile also has its own servo config stored at `profiles/{id}/servo_config.json`. This allows different robots to have different servo layouts without sharing the global config.

Access per-robot servo settings through the same Admin pages — they automatically use the active profile's config when a robot profile is active.

---

## Global vs Per-Robot Config

| Config | Location | Used for |
|---|---|---|
| Global | `configs/servo_config.json` | Default servo/bus layout when no robot profile is active |
| Per-robot | `profiles/{id}/servo_config.json` | Robot-specific overrides |

---

## GPIO Pins

GPIO pin definitions are stored in `configs/pin_config.json`. Pins can be toggled on/off from the GPIO page (available at `/GPIO/list` in the API).

Pin config is currently edited directly in the JSON file — a UI editor may be added in a future release.
