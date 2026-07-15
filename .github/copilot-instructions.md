# LunaClock — Copilot Agent Instructions

## Session Continuity Bootstrap (Mandatory)

At the start of every non-trivial session, run before writing code:

1. Read `.github/copilot-instructions.md` (this file — LunaClock conventions + safety rules)
2. Read `memories/repo/index.md`, `open-loops.md`, `known-gotchas.md`
3. Read `D:\Obsidian\Obsidian\00_Brain\AI Agent Methodology.md` — universal rules
4. Read `D:\Obsidian\Obsidian\00_Brain\Conventions\Response Footer Contract.md` — session context + footer (do not duplicate the template here; link only)
5. Read vault `Operations/AI Session Bridge.md` and `Operations/Session Summaries.md`
6. Produce a 3-line kickoff summary: objective · constraints · next action

Cursor workspaces: footer enforced by `.cursor/rules/response-footer.mdc`; see `AGENTS.md`.

## Project identity

| Item | Value |
|------|-------|
| App | Teen flip clock — stopwatch, pomodoro, settings sync |
| Ship file | `clock7.html` (single-file HTML/CSS/JS) |
| Repo | `D:\VS Code Projects\LunaClock` |
| Vault | `D:\Obsidian\Obsidian\40_VSCode\LunaClock` |
| Live | https://clock.petralian.com |
| Build | None — static upload |

## Architecture

One file ships production:

| File | Role |
|------|------|
| `clock7.html` | Entire app — UI, styles, logic, settings, modes |
| `clock.html`–`clock6.html` | Legacy iterations — reference only unless backporting |
| `responsive-flip-countdown/` | Third-party flip animation reference — not the ship target |

## LunaClock rules (do not break)

1. **Mobile-first** — pill buttons only; no Luna Pink color preset
2. **Mode bar order:** Stopwatch → Clock → Pomodoro (Clock default)
3. **Mode label** matches menu text (not "Flip Clock")
4. **Profile name** first in settings
5. **Inversion mode** via CSS variables — preserve teen-friendly contrast
6. **Settings:** cookies + LUNA7 code + QR — pathname-derived cookie path
7. **Edit `clock7.html` in place** — no split/refactor without explicit v8 plan

## Deploy

1. Test locally: open `clock7.html` or `python -m http.server`
2. Upload `clock7.html` to clock.petralian.com static host
3. Smoke: clock flip, modes, settings sync, inversion, mobile layout

## Testing

No automated test suite. Manual checklist in `README.md` after every change.

## Universal engineering rules

- Minimize scope — one concern per change when possible
- Match existing patterns inside `clock7.html` before adding helpers
- Every work reply: Session context (top) + v3.1 footer (bottom) per [[Conventions/Response Footer Contract]]
- Do not skip vault/session updates because the user asked for code only
- Read `.instructions.md` for full LunaClock conventions
