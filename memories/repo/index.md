# LunaClock — repo memory (machine-readable)

**Updated:** 2026-07-15

## Identity

- **App:** Teen-focused flip clock (stopwatch, pomodoro, settings sync) — Luna & Nathan
- **Repo:** `D:\VS Code Projects\LunaClock`
- **Vault:** `D:\Obsidian\Obsidian\40_VSCode\LunaClock`
- **Ship file:** `clock7.html`
- **Deploy:** https://clock.petralian.com — static upload, no build

## Bootstrap order (mandatory every non-trivial session)

1. `D:\Obsidian\Obsidian\00_Brain\_Manual Prompts\Start of Session.md` — execute fully
2. `.github/copilot-instructions.md` — LunaClock conventions
3. This folder: `memories/repo/index.md`, `open-loops.md`, `known-gotchas.md`
4. `00_Brain/AI Agent Methodology.md`
5. `00_Brain/Conventions/Response Footer Contract.md` — session context + footer
6. Vault: `Operations/AI Session Bridge.md` → `Session Summaries.md` → relevant `Features/*`
7. Create/update `Operations/Sessions/YYYY-MM-DD <topic>.md` **before coding**
8. Confirm `.cursor/rules/response-footer.mdc` (`alwaysApply: true`)

## Key paths

| Area | Path |
|------|------|
| Production | `clock7.html` |
| Conventions | `.instructions.md` |
| Agent entry | `AGENTS.md` |
| Copilot | `.github/copilot-instructions.md` |
| Cursor rules | `.cursor/rules/response-footer.mdc`, `session-protocol.mdc` |

## MCP

- **VS Code:** `obsidian-lunaclock` in `.vscode/mcp.json.example` — dual-path filesystem (LunaClock vault + `00_Brain`)
- **Cursor:** `.cursor/mcp.json.example` — copy to `~/.cursor/mcp.json`; uses `mcpServers` key

## Current priority (2026-07-15)

v7 live at clock.petralian.com. Scaffold + vault wired. Next: v8 planning (task list, lo-fi sounds, streaks) per vault open loops.
