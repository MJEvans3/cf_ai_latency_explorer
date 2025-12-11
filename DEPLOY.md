# Deployment Instructions

## One-Time Setup: Register Workers.dev Subdomain

Before deploying, you need to register a `workers.dev` subdomain (one-time setup):

1. Visit: https://dash.cloudflare.com/66c75f783559206baa45dfaae342943e/workers/onboarding
2. Click "Get started" or "Register subdomain"
3. Choose a subdomain name (e.g., `paperogami` or `cf_ai_latency_explorer`)
4. Complete the registration

## Deploy

Once the subdomain is registered, run:

```bash
npm run deploy
```

Or manually:

```bash
cd client && npm run build && cd .. && npx wrangler deploy
```

Your app will be live at: `https://cf_ai_latency_explorer.<your-subdomain>.workers.dev`

## What's Deployed

- ✅ Frontend React app with TopoJSON world map
- ✅ Cloudflare Worker backend with `/api/location` endpoint (real-time location data)
- ✅ Cloudflare Worker backend with `/api/edges` endpoint
- ✅ Cloudflare Worker backend with `/api/chat` endpoint (Workers AI - Llama 3.3)

## Features Enabled After Deployment

- **Real location data**: Uses Cloudflare's `request.cf` to detect your actual city, country, and edge location
- **AI chat**: Workers AI will respond with real answers about edge computing and latency
- **Global edge network**: App served from Cloudflare's 300+ edge locations worldwide

