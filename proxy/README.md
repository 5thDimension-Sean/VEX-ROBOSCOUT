# VEX robotScout — token proxy

The VEX Events API allows CORS, so the browser can call it directly — but that
would put your Bearer token in the public web bundle. This Cloudflare Worker
keeps the token server-side (a Worker secret) and forwards requests.

## Deploy (free Cloudflare account)

```bash
npm install -g wrangler
cd proxy
wrangler login
wrangler secret put VEX_API_TOKEN      # paste your events.vex.com Bearer token
wrangler deploy
```

`wrangler deploy` prints a URL like `https://vex-robotscout-proxy.<you>.workers.dev`.

## Wire the app to it

- **Local web dev:** put it in `.env` → `EXPO_PUBLIC_VEX_PROXY_URL=https://…workers.dev`
- **GitHub Pages build:** add it as a repo **variable** named `EXPO_PUBLIC_VEX_PROXY_URL`
  (Settings → Secrets and variables → Actions → Variables).

With the proxy URL set, the app calls the Worker and **no token ships in the web
bundle**. Without it (native / local dev), the app calls events.vex.com directly
with the token in `.env`.

## Lock it down

`ALLOWED_ORIGINS` in `src/index.js` restricts which sites' browsers may use the
proxy. Keep your Pages origin and remove localhost entries for production.
