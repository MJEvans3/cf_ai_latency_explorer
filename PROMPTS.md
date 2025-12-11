# AI Prompts Used in Development

This document lists the AI prompts used for guidance during the development of CF AI Latency Explorer.

---

## 1. Cloudflare Workers AI Streaming Setup

```
How do I set up streaming responses with Cloudflare Workers AI using the Llama 3.3 70B model?
I need to return a text/event-stream response and handle it on the client side with proper
SSE parsing. What headers do I need and how should I structure the wrangler.toml bindings?
```

---

## 2. D3.js Natural Earth Projection for World Map

```
I'm building a world map visualization in React. How do I use d3-geo with the Natural Earth
projection to convert latitude/longitude coordinates to SVG x/y positions? I'm loading
TopoJSON data and need to render land masses with geoPath. What's the correct setup for
projection.scale() and projection.translate() for a 1000x500 SVG?
```

---

## 3. Country Code to Flag Emoji Conversion

```
How do I convert a 2-letter ISO country code (like "US" or "GB") to its corresponding
flag emoji in JavaScript? I need a function that works with Unicode regional indicator symbols.
```

---

## 4. SVG ViewBox Zoom and Pan Implementation

```
I'm implementing zoom and pan for an SVG map in React. How do I calculate the viewBox
values based on zoom level and pan offset? I need to clamp the pan so users can't drag
beyond the map boundaries. The base dimensions are 1000x500 with zoom range 1x to 4x.
```

---

## 5. Parsing SSE Streams with Incomplete JSON Chunks

```
I'm consuming a Server-Sent Events stream from Workers AI where JSON data can be split
across multiple chunks. How do I properly buffer incomplete lines and parse the "data: {json}"
format? I need to handle the [DONE] signal and accumulate the response text incrementally.
```

---

## 6. Framer Motion Slide-in Panel with Cubic Bezier Easing

```
How do I create a smooth slide-in animation for a chat panel using Framer Motion? I want
the panel to slide in from the right while the main content area smoothly adjusts its
margin. What cubic-bezier values give a natural, non-bouncy easing curve?
```

---

## In-App AI System Prompt

The following system prompt is used for the AI chat assistant (`src/index.ts`):

```
You are an expert on Cloudflare's global edge network and latency optimization.
You help users understand:

1. How edge computing reduces latency by processing requests closer to users
2. Cloudflare's global network spanning 300+ cities in 100+ countries
3. Why the user is connected to their specific data center
4. Technical concepts like RTT (Round Trip Time), TTFB (Time To First Byte),
   and CDN caching
5. How Cloudflare is within 50ms of 95% of the Internet-connected population

Be concise, friendly, and technically accurate. Use simple analogies to explain
complex concepts. When discussing the user's connection, reference their specific
location data if available. Keep responses brief (2-3 sentences) unless asked
for more detail.

Important facts:
- Each Cloudflare data center is named with a 3-letter IATA airport code
  (like LHR for London Heathrow)
- Requests are automatically routed to the nearest healthy data center
- Edge computing means running code closer to users instead of in a central
  location
```

---

*Some components built with AI guidance*
