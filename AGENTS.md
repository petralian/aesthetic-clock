# LunaClock — Agent entry point

## Response footer (mandatory)

Every work reply: **Session context** (top) + **v3.1 mode footer** (bottom) per `D:\Obsidian\Obsidian\00_Brain\Conventions\Response Footer Contract.md`. Cursor: `.cursor/rules/response-footer.mdc` (`alwaysApply: true`).

## Session protocol (mandatory)

Before non-trivial work, execute `D:\Obsidian\Obsidian\00_Brain\_Manual Prompts\Start of Session.md`:

1. Read `.github/copilot-instructions.md` (LunaClock conventions + bootstrap)
2. Read vault `D:\Obsidian\Obsidian\40_VSCode\LunaClock\_Home.md`, `Operations/AI Session Bridge.md`, `Operations/Session Summaries.md`, relevant `Features/*`
3. Read repo `memories/repo/index.md`, `open-loops.md`, `known-gotchas.md`
4. Read `00_Brain/AI Agent Methodology.md` and `00_Brain/Conventions/Response Footer Contract.md`
5. Create/update `Operations/Sessions/YYYY-MM-DD <topic>.md` in the vault **before coding**

Do not skip Obsidian updates because the user asked for code only. See `.cursor/rules/session-protocol.mdc`.

## Key paths

| Area | Path |
|------|------|
| Production app | `clock7.html` (single-file — HTML + CSS + JS) |
| Legacy builds | `clock.html` … `clock6.html` |
| Flip countdown reference | `responsive-flip-countdown/` |
| Agent conventions | `.instructions.md` |
| Copilot bootstrap | `.github/copilot-instructions.md` |

**No build step.** Edit `clock7.html` in place; test by opening in browser or static serve.

## Deploy

- **Target:** https://clock.petralian.com
- Upload `clock7.html` to static host (no compile)
- Cookie path derives from URL pathname — test under the same path shape as production when possible

## MCP

- **VS Code:** `.vscode/mcp.json.example` → copy to `.vscode/mcp.json` — `obsidian-lunaclock` dual-path (project vault + `00_Brain`)
- **Cursor:** `.cursor/mcp.json.example` → copy to `~/.cursor/mcp.json` or project `.cursor/mcp.json` (`mcpServers` key)

After wiring: Command Palette → **MCP: Reset Cached Tools**. Verify agent can list files in `00_Brain` and `40_VSCode/LunaClock/Operations/`.
