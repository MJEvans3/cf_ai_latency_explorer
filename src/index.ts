import { EDGE_LOCATIONS, getEdgeByCode } from "./data/edges";

export interface Env {
  AI: Ai;
}

const SYSTEM_PROMPT = `You are an expert on Cloudflare's global edge network and latency optimization. You help users understand:

1. How edge computing reduces latency by processing requests closer to users
2. Cloudflare's global network spanning 300+ cities in 100+ countries
3. Why the user is connected to their specific data center
4. Technical concepts like RTT (Round Trip Time), TTFB (Time To First Byte), and CDN caching
5. How Cloudflare is within 50ms of 95% of the Internet-connected population

Be concise, friendly, and technically accurate. Use simple analogies to explain complex concepts.
When discussing the user's connection, reference their specific location data if available.
Keep responses brief (2-3 sentences) unless asked for more detail.

Important facts:
- Each Cloudflare data center is named with a 3-letter IATA airport code (like LHR for London Heathrow)
- Requests are automatically routed to the nearest healthy data center
- Edge computing means running code closer to users instead of in a central location`;

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const url = new URL(request.url);

    // CORS headers for development
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // API endpoint to get user's location from request.cf
    if (url.pathname === "/api/location") {
      const cf = (request as any).cf as
        | {
            colo?: string;
            city?: string;
            country?: string;
            latitude?: string;
            longitude?: string;
            timezone?: string;
            region?: string;
            regionCode?: string;
            asn?: number;
            asOrganization?: string;
          }
        | undefined;

      const locationData = {
        colo: cf?.colo || "Unknown",
        city: cf?.city || "Unknown",
        country: cf?.country || "Unknown",
        latitude: cf?.latitude || "0",
        longitude: cf?.longitude || "0",
        timezone: cf?.timezone || "Unknown",
        region: cf?.region || "Unknown",
        regionCode: cf?.regionCode || "Unknown",
        asn: cf?.asn || 0,
        asOrganization: cf?.asOrganization || "Unknown",
      };

      return new Response(JSON.stringify(locationData), {
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });
    }

    // API endpoint to get all edge locations
    if (url.pathname === "/api/edges") {
      return new Response(JSON.stringify(EDGE_LOCATIONS), {
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });
    }

    // Chat API endpoint with streaming
    if (url.pathname === "/api/chat" && request.method === "POST") {
      try {
        const body = await request.json() as {
          message: string;
          history?: Array<{ role: string; content: string }>;
          location?: {
            city: string;
            country: string;
            colo: string;
          };
        };

        const { message, history = [], location } = body;

        // Build context with user location
        let contextPrompt = SYSTEM_PROMPT;
        if (location) {
          const edge = getEdgeByCode(location.colo);
          contextPrompt += `\n\nCurrent user connection info:
- User location: ${location.city}, ${location.country}
- Connected to edge: ${location.colo}${edge ? ` (${edge.city}, ${edge.country})` : ""}`;
        }

        // Build messages array
        const messages = [
          { role: "system" as const, content: contextPrompt },
          ...history.map((m) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          })),
          { role: "user" as const, content: message },
        ];

        // Call Workers AI with streaming
        const response = await env.AI.run(
          "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
          {
            messages,
            stream: true,
            max_tokens: 500,
          }
        );

        // Return the stream directly
        return new Response(response as ReadableStream, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            ...corsHeaders,
          },
        });
      } catch (error) {
        console.error("Chat error:", error);
        return new Response(
          JSON.stringify({ error: "Failed to process chat request" }),
          {
            status: 500,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders,
            },
          }
        );
      }
    }

    // For all other paths, let Cloudflare serve static assets
    return new Response("Not Found", {
      status: 404,
      headers: corsHeaders,
    });
  },
};
