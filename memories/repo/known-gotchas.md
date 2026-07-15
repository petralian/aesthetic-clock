# LunaClock — known gotchas

**Updated:** 2026-07-15

## Single-file app

- **All logic in `clock7.html`** — search before duplicating functions; large file (~3.8k lines)
- **No build step** — CDN deps (QRCode, fonts, Mixkit, Quotable); handle network failures gracefully
- **Cookie path** derives from URL pathname — opening as `file://` or wrong server path breaks persistence vs production

## UX constraints

- **Luna hates square corners** — all UI chrome must use pills (`border-radius: 9999px`) or generous radius (12px+); color pickers and swatches especially; audit on every settings/UX pass (grep `border-radius`)
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
