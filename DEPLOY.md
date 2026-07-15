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

## First-time setup (already done)

1. **Cloudflare:** Add A record `clock` → VPS IP, DNS-only (not proxied).
2. **aaPanel:** Website → Add site → `clock.petralian.com` → Let's Encrypt SSL.
3. **Upload:** Copy `clock7.html` as `index.html` into the site web root.

See `deploy/clock.petralian.com.conf` for a minimal static nginx reference (aaPanel generates its own vhost; this is for manual override if needed).

## Verify

```powershell
curl.exe -sI https://clock.petralian.com/
# Expect: HTTP/1.1 200 OK
```
