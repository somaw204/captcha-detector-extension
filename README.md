
# CAPTCHA Detector Extension — Always-On Real-Time Monitoring

**Version:** Latest (vX.X)

---

## Overview

The CAPTCHA Detector extension has been upgraded to run **always-on** with **real-time monitoring** across all websites, delivering a professional-grade, continuous CAPTCHA tracking experience.

---

## Key Features

### 🔄 Always-On Features
- **Persistent Panel:**  
  - No close button — the panel can’t be fully closed.  
  - Always visible on-screen, regardless of website or tab.  
  - Auto-recovery recreates the panel if accidentally removed.

### ⏱ Real-Time Detection
- Scans every 2 seconds automatically.  
- Live status updates with a real-time CAPTCHA count.  
- Dynamic **LIVE (X/Y)** badge showing CAPTCHAs found vs total.  
- Instant pop-up notifications on CAPTCHA appearance or disappearance.

### 👀 Enhanced Monitoring
- Uses a **MutationObserver** to detect dynamic content changes.  
- Scans triggered by user interactions like clicks and scrolls.  
- Monitors network requests to catch newly loaded CAPTCHAs.  
- Browser notifications alert you on status changes.

### 🎨 Improved User Interface
- Pulsing live status badge indicating active monitoring.  
- Real-time detection counter in **X/Y** format.  
- Hoverable timestamps show last scan/update time.  
- Smooth status animations for feedback on detection changes.

### ⚙️ Updated Controls
- **Force Detection:** Manual scan button in popup.  
- **Minimize Only:** Toggle button minimizes instead of closing panel.  
- Enhanced popup shows real-time status and controls.  
- Persistent user settings saved between sessions.

---

## How It Works

1. **Install Extension:** Panel appears immediately on installation.  
2. **Visit Any Website:** Automatic CAPTCHA scanning starts.  
3. **Real-Time Updates:** Status refreshes every 2 seconds.  
4. **Cross-Page Persistence:** Panel remains visible when navigating across sites.  
5. **Live Notifications:** Instant alerts for CAPTCHA status changes.

---

## Benefits

- Never miss a CAPTCHA with continuous monitoring.  
- Stay instantly aware with real-time status updates.  
- Monitor CAPTCHA presence across multiple tabs and sites.  
- Fully automatic, zero maintenance required.  
- Professional-grade security dashboard feel for researchers and developers.

---

## Why Do I Sometimes See "Detection Not Available on This Page"?

Due to browser security policies, the extension **cannot run on certain page types**, including but not limited to:

- **Browser internal pages:**  
  `chrome://extensions/`, `chrome://settings/`, `about:config`, etc.  
- **New tab pages:**  
  `chrome://newtab/`, `about:newtab`, and custom new tab extensions.  
- **Extension stores:**  
  Chrome Web Store, Firefox Add-ons store pages.  
- **Local files:**  
  `file://` URLs require special permissions.  
- **SSL error pages:**  
  Pages like "Your connection is not private".  
- **Sites with strict Content Security Policy (CSP) or sandboxed iframes.**

### What’s New in This Version Regarding This?

- Improved error handling to detect and report why detection is unavailable.  
- Disabled controls on restricted pages to avoid confusion.  
- Clear, informative feedback displayed in the popup.  

---

## Troubleshooting Guide

For detailed info on restrictions and how to test:

- Use regular websites like `google.com`, `github.com`, or news sites.  
- For local files, enable **"Allow access to file URLs"** in your browser extension settings.  
- For development, serve local files via HTTP (e.g., `python -m http.server`) instead of opening directly.

---

## Installation

Install from your browser’s extension store or load as unpacked extension in developer mode.

---

## Feedback & Contributions

Your feedback and suggestions are welcome! Feel free to open issues or pull requests for improvements.

---

## License

MIT License © [Your Name or Organization]

