# LunaClock — clock.petralian.com

Static single-file app served from the Petralian VPS (aaPanel + nginx).

**Live URL:** https://clock.petralian.com/

## What gets deployed

| Local | Server |
|-------|--------|
| `clock7.html` | `/www/wwwroot/clock.petralian.com/index.html` |

No other assets are required — `clock7.html` is self-contained (fonts/QR lib from CDN). The `responsive-flip-countdown/` folder is not used by v7.

## Infrastructure

| Item | Value |
|------|-------|
| DNS | Cloudflare A record `clock` → `46.224.49.175` (dns-only, grey cloud) |
| VPS | `46.224.49.175` (aaPanel PRO, shared with `crm`, `hermes`, `hd`, etc.) |
| Web root | `/www/wwwroot/clock.petralian.com/` |
| nginx vhost | `/www/server/panel/vhost/nginx/clock.petralian.com.conf` |
| SSL | Let's Encrypt via aaPanel (`/www/server/panel/vhost/cert/clock.petralian.com/`) |

## Redeploy (from Windows)

Requires SSH key auth to `root@46.224.49.175` (same key used by Obsidiansync deploy).

```powershell
scp "D:\VS Code Projects\LunaClock\clock7.html" root@46.224.49.175:/www/wwwroot/clock.petralian.com/index.html
ssh root@46.224.49.175 "chown www:www /www/wwwroot/clock.petralian.com/index.html"
```

Then hard-refresh the browser (Ctrl+Shift+R) to bypass cache.

## First-time setup / unblock deploy

If https://clock.petralian.com is down or docroot is missing, do this in aaPanel:

1. **Website → Add site**
   - Domain: `clock.petralian.com`
   - Root: `/www/wwwroot/clock.petralian.com` (aaPanel default is fine)
   - PHP: not required for the clock itself (only if you also deploy shortlink PHP)
2. **SSL** → Let's Encrypt for `clock.petralian.com`
3. **DNS** (Cloudflare): A record `clock` → `46.224.49.175`, DNS-only (grey cloud)
4. **Upload** from Windows (SSH key already works):

```powershell
ssh root@46.224.49.175 "mkdir -p /www/wwwroot/clock.petralian.com"
scp "D:\VS Code Projects\LunaClock\clock7.html" root@46.224.49.175:/www/wwwroot/clock.petralian.com/index.html
ssh root@46.224.49.175 "chown www:www /www/wwwroot/clock.petralian.com/index.html"
```

5. **Verify:** `curl.exe -sI https://clock.petralian.com/` → expect `200`

Optional shortlink API: see `deploy/shortlink/README.md` (needs PHP + SQLite under the same site).

See `deploy/clock.petralian.com.conf` for a minimal static nginx reference (aaPanel generates its own vhost; this is for manual override if needed).

## First-time setup (legacy note)

If the site already exists, skip Add site and only re-run the `scp` steps above.

## Short settings links

Server-side short URLs for sharing settings (SQLite file + PHP — no separate DB service).

| Item | Path |
|------|------|
| Service files | `deploy/shortlink/` |
| SQLite DB | `/www/wwwroot/clock.petralian.com/data/settings.db` |
| nginx extension | `/www/server/panel/vhost/nginx/extension/clock.petralian.com/shortlink.conf` |
| API | `POST https://clock.petralian.com/api/short` → `{"id","url"}` |
| Redirect | `GET https://clock.petralian.com/s/{id}` → `302` to `#i={payload}` |

```powershell
.\deploy\shortlink\deploy-shortlink.ps1
```

See `deploy/shortlink/README.md` for API contract and clock7 integration.

## Verify

```powershell
curl.exe -sI https://clock.petralian.com/
# Expect: HTTP/1.1 200 OK

curl.exe -s -X POST https://clock.petralian.com/api/short -H "Content-Type: application/json" -d "{\"p\":\"test\"}"
# Expect: {"id":"...","url":"https://clock.petralian.com/s/..."}
```
