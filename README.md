<div align="center">

# Discord Quest Completer 🌐

*Auto-completes active Discord quests with a sleek, live terminal interface.*

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Platform: Windows](https://img.shields.io/badge/Platform-Windows-informational.svg)]()
[![Discord](https://img.shields.io/badge/Discord-Desktop-5865F2.svg)]()

</div>

---

### *Working on the first releases!* 

---

## ⚠️ Disclaimer

This uses internal and undocumented Discord APIs. It may break after updates. Use at your own risk. This is for educational and personal use only. I am not responsible for any account actions taken against you.

## ✨ Features

- [x] **Live Terminal UI:** A dark-themed console panel that tracks your progress without getting spammed by Discord's internal logs.
- [ ] **Native Notifications:** Plays a sound and sends a desktop notification when everything is done.
- [x] **Zero Dependencies:** Pure JavaScript. No external files, no downloads, no token required.

## 🚀 How to Use

1. Open the **Discord Desktop App**.
2. Press `Ctrl + Shift + I` to open Developer Tools.
3. Go to the **Console** tab.
4. Type `allow pasting` and press `Enter`.
5. Copy the entire content of `script.js` and paste it into the console.
6. Press `Enter` to run. Keep the console open until it finishes.

> **Note:** It only works on the desktop app. The browser version is not supported.

## 🛠️ Supported Quests

| Task Type | Description |
| :--- | :--- |
| `WATCH_VIDEO` | Watch a video for a set duration. |
| `WATCH_VIDEO_ON_MOBILE` | Watch a video on the mobile app. |
| `PLAY_ON_DESKTOP` | Play a specific game on PC. |
| `STREAM_ON_DESKTOP` | Stream a game in a voice channel. |
| `PLAY_ACTIVITY` | Play a Discord activity. |

## ⚙️ How It Works

The script hooks into Discord's internal modules using `webpackChunkdiscord_app`. It intercepts the console to hide Discord's noisy RTC and DirectVideo logs, replacing them with a custom UI. 

It simulates quest progress by sending API requests to Discord's own endpoints. **Your Discord token is never requested, stored, or transmitted by this script.**

## 📜 License

Distributed under the MIT License. Feel free to use, modify, and share.
