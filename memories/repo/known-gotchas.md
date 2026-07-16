# LunaClock — known gotchas

**Updated:** 2026-07-15

## Single-file app

- **All logic in `clock7.html`** — search before duplicating functions; large file (~3.8k lines)
- **No build step** — CDN deps (QRCode, fonts, Mixkit, Quotable); handle network failures gracefully
- **Cookie path** derives from URL pathname — opening as `file://` or wrong server path breaks persistence vs production
- **Flip digits are canvas** (`FlipEngine`) — CSS 3D faces are unused when `.has-canvas`; mode switch / `stopAllTimers` must call `FlipEngine.cancelAll()` (via `stopDisplayLoop`) so mid-flip never bleeds into the next mode
- **One rAF display loop** — clock / stopwatch / pomodoro time sampling lives in `displayFrame`; do not reintroduce per-mode `setInterval` for digit updates
- **Playwright smoke** — `npm test` (desktop + Pixel 7); agent browser QA via Playwright MCP in `.cursor/mcp.json.example` (`npx @playwright/mcp@latest`). Reject rustwright (alpha) for this repo

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
