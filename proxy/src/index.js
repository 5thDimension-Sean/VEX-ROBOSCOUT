/**
 * VEX robotScout — token proxy (Cloudflare Worker).
 *
 * The VEX Events API allows CORS, so a browser CAN call it directly — but that
 * would bundle your Bearer token into the public site. This Worker keeps the
 * token server-side (as a Worker secret) and forwards requests, so nothing
 * sensitive ships in the client.
 *
 * Deploy:
 *   npm i -g wrangler
 *   wrangler secret put VEX_API_TOKEN
 *   wrangler deploy
 *
 * Then point the web app at the Worker URL via EXPO_PUBLIC_VEX_PROXY_URL.
 */

const TARGET = 'https://events.vex.com/api/v2';

const ALLOWED_ORIGINS = [
  'https://5thdimension-sean.github.io',
  'http://localhost:8081',
  'http://localhost:8082',
];

function corsHeaders(origin) {
  const allow = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Accept, Content-Type',
    'Vary': 'Origin',
  };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }
    if (request.method !== 'GET') {
      return new Response('Method not allowed', { status: 405, headers: corsHeaders(origin) });
    }

    const url = new URL(request.url);
    const target = TARGET + url.pathname + url.search;

    const upstream = await fetch(target, {
      headers: {
        Authorization: `Bearer ${env.VEX_API_TOKEN}`,
        Accept: 'application/json',
      },
    });

    const body = await upstream.text();
    return new Response(body, {
      status: upstream.status,
      headers: {
        ...corsHeaders(origin),
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300',
      },
    });
  },
};
