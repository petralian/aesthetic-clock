# LunaClock — known gotchas

**Updated:** 2026-07-16

## Single-file app

- **All logic in `clock7.html`** — search before duplicating functions; large file (~6k lines)
- **No build step** — CDN deps (QRCode, fonts, Mixkit, Quotable); handle network failures gracefully
- **Cookie path** derives from URL pathname — opening as `file://` or wrong server path breaks persistence vs production
- **Flip digits are canvas** (`FlipEngine`) — CSS 3D faces are unused when `.has-canvas`; mode switch / `stopAllTimers` must call `FlipEngine.cancelAll()` (via `stopDisplayLoop`) so mid-flip never bleeds into the next mode
- **FlipEngine smoothness** — ease-in-out cubic + perspective foreshortening (`cos/(1+sin/P)`); never zero `cssW`/`cssH` on resize (only reset buffer when size/DPR actually changed); theme tokens cached until `repaintAll` / `invalidateTokens`
- **Canvas digit stretch (2026-07-16)** — HTML canvas defaults to **300×150**. With CSS faces `display:none` and `.flipper-digit { width: auto }`, that intrinsic size blew digits past the grey `#clock` panel. **Must:** fixed `width/min/max: var(--flip-digit-w)`, `.flip-digit-group { width: auto }`, `syncSize` from em/`--flip-digit-w` (never `getBoundingClientRect`), init `canvas.width=1`. Guarded by `tests/layout.spec.js`
- **Digit vertical centering** — FlipEngine uses `actualBoundingBoxAscent/Descent` when available, else a small `h*0.035` downward nudge. Script fonts (Caveat/Pacifico) can still look slightly off — do not chase perfect per-font tuning
- **iOS `<select>` fonts** — closed control can inherit `font-family`; the open picker wheel/list is OS/WebKit-controlled and ignores page CSS (known limitation — no custom select unless product asks)
- **Settings drawer close anim** — parent `.settings-drawer` must delay `visibility: hidden` until after panel/overlay transitions (`transition: visibility 0s linear 0.35s`); instant visibility kill looks like a jump
- **Flip tick sound** — coalesce to one tick per frame / ~45ms; fixed gain envelope; stop prior oscillator so 6 digit flips never stack
- **One rAF display loop** — clock / stopwatch / pomodoro time sampling lives in `displayFrame`; do not reintroduce per-mode `setInterval` for digit updates
- **Clock animates / stopwatch instant** — `flipDigit` forces `setInstant` in stopwatch mode; clock flips on second change only
- **Timezone override** — settings `timezoneSelect` rebuilt by `rebuildTimezoneSelect()` (Auto pinned, UTC± via `Intl` shortOffset, sort by offset minutes, Brussels + Hong Kong); chip `#tzChip` in `#modeRow` beside `#modeIndicator` — **Clock mode only** (`.tz-chip.visible`); digits via `getZonedParts()`; persist `timeZone` in share payload
- **Fullscreen centering** — `.fullscreen-mode #fullscreenStage` must be viewport-fixed with `%` width (not `100vw`/`96vw`); `.clock` should be `width: fit-content; max-width: 100%; margin-inline: auto` — a fixed `min(96vw, 1100px)` slab looked left-biased. Guarded by `tests/fullscreen.spec.js`
- **Page background** — Appearance Default / Upload / Browse stock. Stock = curated Unsplash `images.unsplash.com` URLs (no API key) + attribution chip. Upload = compressed JPEG data URL in `lunaclock_v7_bg_upload` localStorage only (never cookie/share). Compact keys `pbm`/`pbs` for stock mode+id only
- **My Themes compact** — pill rows with swatch + icon Save/Apply (💾/✓); denser than full Save/Apply text buttons
- **Stopwatch ms** — `#millisecondsCard` only in stopwatch; `formatTime` centiseconds (`ms%1000/10`); smaller `--flip-size` on ms card; `setInstant` (no flip spam); **digit bottoms** align with seconds via `align-self:flex-end` + MS label matching H/M/S label footprint (not centered card); hours always shown (`00`); laps use `formatLapTime` → `HH:MM:SS:cs`. Guarded by `tests/layout.spec.js`
- **Pomodoro hours** — always HH:MM:SS (`formatCountdown` returns hours); settings duration rows use `<input type="number" class="val">` synced both ways with range sliders (clamp to min/max, `saveAll`)
- **Playwright** — `npm test` / `npx playwright test` (smoke + visual-qa + timezone + layout + fullscreen; desktop + Pixel 7). Reject rustwright (alpha) for this repo
- **Mode switch paint order** — always `updateControlsForMode()` then `FlipEngine.afterLayout(...)` before sampling digits; painting while `#hoursCard` is still `.hidden` leaves blank/wrong canvas tiles
- **Hold reset** — single rAF timer at `HOLD_RESET_MS = 2000` (no parallel setTimeout); label shows `2.0s`…`0.0s`
- **Deploy** — `scp clock7.html root@46.224.49.175:/www/wwwroot/clock.petralian.com/index.html` then `chown www:www` (user-authorized for this repo)

## UX constraints

- **Luna hates square corners** — all UI chrome must use pills (`border-radius: 9999px`) or generous radius (12px+); color pickers and swatches especially; audit on every settings/UX pass (grep `border-radius`)
- **WCAG AA contrast on every theme** — all themed UI text must pass Lighthouse contrast: 4.5:1 body, 3:1 large/UI components; use `contrastRatio()` + `ensureContrast()` in `applyChromeTextTokens()` / `applyCustomizations()` — never ship light-on-light or grey-on-grey (Lap button, no-laps, mode bar, panels)
- **Light / dark via presets** — no inversion toggle; `body.theme-dark` from bg luminance; legacy `im` import maps to charcoal
- **Pill buttons only** — no Luna Pink preset theme
- **Mode bar order:** Stopwatch → Clock → Pomodoro; Clock is default
- **Mode indicator** must match menu label (not "Flip Clock")
- **Mobile-first** — test narrow viewport; watch `overflow-x` and flip sizing (`--flip-size`)

## Deploy

- Upload **only** `clock7.html` for production (unless host requires index rename)
- Static host comment in HTML documents aaPanel/subfolder behavior

## Session / memory

- **Every work reply:** Session context (top) + v3.1 footer per `00_Brain/Conventions/Response Footer Contract.md`
- **Dual IDE:** VS Code reads `.vscode/mcp.json`; Cursor reads `mcpServers` in user or project MCP config
