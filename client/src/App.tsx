import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader } from "./components/Loader";
import { WorldMap, EdgeLocation } from "./components/WorldMap";
import { Chat } from "./components/Chat";
import { ConnectionInfo } from "./components/ConnectionInfo";

interface LocationData {
  colo: string;
  city: string;
  country: string;
  latitude: string;
  longitude: string;
  timezone: string;
  region: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

// Shared transition config for synchronized animations
const PANEL_TRANSITION = {
  type: "tween" as const,
  duration: 0.35,
  ease: [0.25, 0.1, 0.25, 1.0],
};

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [edges, setEdges] = useState<EdgeLocation[]>([]);
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 640 : false
  );

  // Track window size for responsive chat behavior
  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 640);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fetch location and edges on mount
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch both in parallel
        const [locationRes, edgesRes] = await Promise.all([
          fetch("/api/location"),
          fetch("/api/edges"),
        ]);

        const location = await locationRes.json();
        const edgesData = await edgesRes.json();

        setLocationData(location);
        setEdges(edgesData);
      } catch (err) {
        console.error("Failed to fetch data:", err);
        // Set demo data for local development
        setLocationData({
          colo: "LHR",
          city: "London",
          country: "GB",
          latitude: "51.5074",
          longitude: "-0.1278",
          timezone: "Europe/London",
          region: "England",
        });
      } finally {
        // Show loading for at least 1.8s for visual impact
        setTimeout(() => setIsLoading(false), 1800);
      }
    }

    fetchData();
  }, []);

  // Handle sending messages via HTTP POST to the chat endpoint
  const handleSendMessage = useCallback(
    async (content: string) => {
      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: "user",
        content,
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsChatLoading(true);

      try {
        // Send message to chat API
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: content,
            history: messages.map((m) => ({ role: m.role, content: m.content })),
            location: locationData,
          }),
        });

        if (!response.ok) {
          throw new Error("Chat request failed");
        }

        // Handle streaming response
        if (response.body) {
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let fullResponse = "";
          let buffer = "";
          const assistantId = `assistant-${Date.now()}`;

          // Add empty assistant message
          setMessages((prev) => [
            ...prev,
            { id: assistantId, role: "assistant", content: "" },
          ]);

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;

            // Workers AI streams in SSE format: "data: {json}\n\n"
            const lines = buffer.split("\n");
            buffer = lines.pop() || ""; // Keep incomplete line in buffer

            for (const line of lines) {
              const trimmed = line.trim();
              if (trimmed.startsWith("data: ")) {
                const data = trimmed.slice(6);
                if (data === "[DONE]") continue;
                try {
                  const parsed = JSON.parse(data);
                  if (parsed.response) {
                    fullResponse += parsed.response;
                  }
                } catch {
                  // If not JSON, might be raw text
                  fullResponse += data;
                }
              }
            }

            // Update the assistant message with accumulated content
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantId ? { ...msg, content: fullResponse } : msg
              )
            );
          }
        } else {
          // Non-streaming fallback
          const data = await response.json();
          const assistantMessage: Message = {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            content: data.response || "Sorry, I couldn't generate a response.",
          };
          setMessages((prev) => [...prev, assistantMessage]);
        }
      } catch (err) {
        console.error("Chat error:", err);
        const errorMessage: Message = {
          id: `error-${Date.now()}`,
          role: "assistant",
          content:
            "Sorry, I encountered an error. Please make sure you're running this on Cloudflare Workers to use the AI features.",
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsChatLoading(false);
      }
    },
    [messages, locationData]
  );

  // Handle edge click - memoized to prevent WorldMap re-renders
  const handleEdgeClick = useCallback((edge: EdgeLocation) => {
    setShowChat(true);
    handleSendMessage(
      `Tell me about the ${edge.city} (${edge.code}) data center.`
    );
  }, [handleSendMessage]);

  // Find the connected edge city
  const connectedEdge = edges.find((e) => e.code === locationData?.colo);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-hidden">
      <AnimatePresence>{isLoading && <Loader />}</AnimatePresence>

      {!isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="h-screen flex flex-col"
        >
          {/* Header */}
          <motion.header
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="p-3 md:p-4 flex items-center justify-between border-b border-slate-800/50 backdrop-blur-sm bg-slate-900/30 shrink-0"
          >
            <div className="flex items-center gap-3">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20"
              >
                <GlobeIcon className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </motion.div>
              <div>
                <h1 className="text-white font-semibold text-sm md:text-base">
                  Latency Explorer
                </h1>
                <p className="text-slate-400 text-xs hidden sm:block">
                  See how close you are to the edge
                </p>
              </div>
            </div>
            <ConnectionInfo
              location={locationData}
              edgeCity={connectedEdge?.city}
            />
          </motion.header>

          {/* Main Content */}
          <main className="flex-1 flex overflow-hidden relative">
            {/* Map Section - animated margin for smooth transition */}
            <motion.div
              className="flex-1 relative map-container-animated"
              initial={{ marginRight: 0 }}
              animate={{
                marginRight: showChat && isDesktop ? 384 : 0,
              }}
              transition={PANEL_TRANSITION}
            >
              <WorldMap
                edges={edges}
                userLocation={locationData}
                onEdgeClick={handleEdgeClick}
              />

              {/* Info cards */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.5 }}
                className="absolute top-4 left-4 space-y-2"
              >
                <div className="bg-slate-900/80 backdrop-blur border border-slate-700/50 rounded-xl p-3 max-w-xs">
                  <p className="text-orange-400 font-semibold text-sm">
                    300+ Edge Locations
                  </p>
                  <p className="text-slate-400 text-xs mt-1">
                    Cloudflare operates in 100+ countries, within 50ms of 95% of
                    the world's Internet-connected population.
                  </p>
                </div>
              </motion.div>
            </motion.div>

            {/* Chat Panel - always in DOM, slides in/out smoothly */}
            <motion.div
              className="fixed top-0 bottom-0 right-0 w-full sm:w-96 z-20 chat-panel-animated"
              initial={{ x: "100%" }}
              animate={{
                x: showChat ? 0 : "100%",
              }}
              transition={PANEL_TRANSITION}
              style={{
                pointerEvents: showChat ? "auto" : "none",
                visibility: showChat ? "visible" : "hidden",
              }}
            >
              <Chat
                messages={messages}
                onSendMessage={handleSendMessage}
                isLoading={isChatLoading}
                onClose={() => setShowChat(false)}
                userCity={locationData?.city}
              />
            </motion.div>
          </main>

          {/* Chat Toggle Button */}
          <AnimatePresence>
            {!showChat && (
              <motion.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2 }}
                onClick={() => setShowChat(true)}
                className="fixed bottom-6 right-6 md:bottom-44 md:right-8 w-14 h-14 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-xl shadow-orange-500/30 flex items-center justify-center z-30"
                aria-label="Open chat"
              >
                <ChatIcon className="w-6 h-6" />
              </motion.button>
            )}
          </AnimatePresence>

          {/* Footer hint */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2 }}
            className="absolute bottom-6 left-6 text-slate-500 text-xs hidden md:block"
          >
            Click any edge location to learn more
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

function GlobeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function ChatIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
      />
    </svg>
  );
}
