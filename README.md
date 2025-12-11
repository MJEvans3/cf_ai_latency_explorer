# CF AI Latency Explorer

An AI-powered demo showcasing Cloudflare's global edge network. See exactly which data center is serving your requests and chat with an AI assistant that explains edge computing concepts.

> **Repository Name**: `cf_ai_latency_explorer` - Prefixed with `cf_ai_` as required by Cloudflare Agentic AI Challenge submission guidelines.

![Latency Explorer Demo](https://img.shields.io/badge/Cloudflare-Workers-orange?style=flat-square&logo=cloudflare)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)
![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat-square&logo=react)

## Demo
The app is deployed at: [https://cf_ai_latency_explorer.paperogami.workers.dev/](https://cf_ai_latency_explorer.paperogami.workers.dev/)

Open the deployed app and you'll see:

1. **Your location** pinned on an interactive world map
2. **The Cloudflare edge** serving your request (highlighted in orange)
3. **An animated connection line** showing your path to the edge
4. **AI chat** to ask questions about latency and edge computing

## Features

- **Real-time Location Detection**: Uses Cloudflare's `request.cf` object to detect your city, country, and the serving data center
- **Interactive World Map**: SVG map with Natural Earth projection showing 50+ Cloudflare edge locations with smooth animations
- **Zoom Controls**: Zoom in/out buttons to explore the map in detail
- **AI Chat Assistant**: Powered by Workers AI (Llama 3.3 70B) - ask anything about edge computing and latency
- **Beautiful Animations**: Framer Motion powers smooth transitions, pulsing indicators, and the loading sequence
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

| Component | Technology |
|-----------|------------|
| Backend | Cloudflare Workers |
| AI | Workers AI - Llama 3.3 70B |
| Frontend | React 18 + TypeScript |
| Map Projection | D3.js (Natural Earth) |
| Styling | Tailwind CSS |
| Animations | Framer Motion |
| Build | Vite |

## Quick Start

### Prerequisites

- Node.js 18+
- npm or pnpm
- A Cloudflare account (free tier works)
- Wrangler CLI (`npm install -g wrangler`)

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd cf_ai_latency_explorer

# Install backend dependencies
npm install

# Install frontend dependencies
cd client && npm install && cd ..

# Login to Cloudflare (if not already)
wrangler login
```

### Development

Run the backend and frontend in parallel:

```bash
# Terminal 1 - Backend (Workers)
npm run dev

# Terminal 2 - Frontend (Vite)
cd client && npm run dev
```

Then open `http://localhost:5173` in your browser.

> **Note**: The `/api/location` endpoint returns mock data locally since `request.cf` is only available on Cloudflare's network. Deploy to see real data!

### Deployment

```bash
# Build frontend and deploy to Cloudflare
npm run deploy
```

Your app will be live at `https://cf_ai_latency_explorer.<your-subdomain>.workers.dev`
Refer to deploy.md 


## Project Structure

```
cf_ai_latency_explorer/
├── src/
│   ├── index.ts          # Worker entry point
│   └── data/
│       └── edges.ts      # 50+ Cloudflare edge locations
├── client/
│   ├── src/
│   │   ├── App.tsx       # Main React app
│   │   └── components/
│   │       ├── WorldMap.tsx      # Interactive SVG map (Natural Earth projection)
│   │       ├── Chat.tsx          # AI chat interface
│   │       ├── ConnectionInfo.tsx # Status display
│   │       └── Loader.tsx        # Loading animation
│   └── ...
├── wrangler.jsonc        # Cloudflare configuration
├── PROMPTS.md            # AI prompts used during development
└── README.md
```

## How It Works

### Location Detection

When you visit the app, the Worker reads your location from Cloudflare's `request.cf` object:

```typescript
const location = {
  colo: request.cf?.colo,      // "LHR" - 3-letter IATA code
  city: request.cf?.city,      // "London"
  country: request.cf?.country, // "GB"
  latitude: request.cf?.latitude,
  longitude: request.cf?.longitude,
};
```

### AI Chat

The chat is powered by Workers AI running Llama 3.3 70B. The agent maintains context about your location:

```typescript
const response = await env.AI.run(
  "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
  {
    messages: [
      { role: "system", content: systemPrompt },
      ...chatHistory,
    ],
    stream: true,
  }
);
```

### State Persistence

The agent uses Durable Objects with built-in SQLite to persist:
- Conversation history
- Visited edge locations
- User preferences

## Sample Questions

Try asking the AI:
- "What is edge computing?"
- "How does Cloudflare reduce latency?"
- "Why am I connected to this data center?"
- "What does 50ms latency mean for users?"
- "Tell me about the Tokyo data center"

## Configuration

### Environment Variables

The app uses Cloudflare bindings configured in `wrangler.jsonc`:

```jsonc
{
  "durable_objects": {
    "bindings": [{ "name": "LatencyAgent", "class_name": "LatencyAgent" }]
  },
  "ai": { "binding": "AI" }
}
```

No external API keys required - Workers AI is included!

## Why This Project?

This project demonstrates:

1. **Understanding of Cloudflare's edge network** - The core value proposition
2. **Modern full-stack development** - React + Workers + Durable Objects
3. **AI integration** - Using Workers AI for practical features
4. **Attention to UX** - Polished animations and responsive design
5. **Production-ready code** - TypeScript, proper error handling, clean architecture

## Author

Built for the Cloudflare Agentic AI Challenge

## License

MIT
