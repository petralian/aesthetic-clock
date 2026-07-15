# LunaClock (aesthetic-clock)

Teen-focused flip clock — made by Luna & Nathan. Single-file static HTML app (no build step).

**Live:** https://clock.petralian.com  
**GitHub:** https://github.com/petralian/aesthetic-clock  
**Main file:** `clock7.html` (current production build)

## Stack

- HTML · CSS · vanilla JavaScript
- CDN: QRCode.js, Google Fonts, Mixkit sounds, Quotable API
- No `package.json` — no npm install required

## Local development

**Quickest:** open `clock7.html` directly in a browser (double-click or drag into Chrome/Edge).

**Static server (recommended for cookies/path behavior):**

```powershell
# Python 3 — run from the repo root after cloning aesthetic-clock
python -m http.server 8080
# → http://localhost:8080/clock7.html
```

```powershell
# npx (if Node is installed)
npx --yes serve .
```

Older iterations (`clock.html` … `clock6.html`) are kept for reference; ship changes in `clock7.html` unless starting a new major version file.

## Deploy

Target: **https://clock.petralian.com** (static hosting, e.g. aaPanel).

1. Upload `clock7.html` to the site subfolder (see HTML comment in file for cookie path behavior).
2. Verify live: flip clock, settings sync (LUNA7 code + QR), stopwatch, pomodoro, light/dark preset themes.
3. No build step — what you upload is what runs.

## Contributing & docs

| Doc | Purpose |
|-----|---------|
| `AGENTS.md` | Agent bootstrap, key paths, MCP (optional for contributors) |
| `.instructions.md` | LunaClock coding conventions |
| `.github/copilot-instructions.md` | Copilot bootstrap |
| `memories/repo/` | Maintainer session notes |

## Test baseline

No automated test suite. Manual smoke test after edits:

- [ ] Clock flips (12h and 24h)
- [ ] Mode bar: Stopwatch → Clock → Pomodoro (Clock default)
- [ ] Settings persist (cookies) + LUNA7 code export/import
- [ ] Light/dark preset theme groups (WCAG contrast)
- [ ] Mobile viewport (pill buttons, no horizontal scroll)
