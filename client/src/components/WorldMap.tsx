import { motion, AnimatePresence } from "framer-motion";
import { useMemo, useState, useEffect, useRef, useCallback, memo } from "react";
import * as topojson from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import type { Feature, FeatureCollection, MultiPolygon, Polygon } from "geojson";
import { geoNaturalEarth1, geoPath, geoGraticule } from "d3-geo";

// Throttle helper using requestAnimationFrame
function useThrottledCallback<T extends (...args: any[]) => void>(
  callback: T,
  deps: React.DependencyList
): T {
  const frameRef = useRef<number | null>(null);
  const callbackRef = useRef(callback);

  // Update the callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useCallback(
    ((...args: Parameters<T>) => {
      if (frameRef.current !== null) return;

      frameRef.current = requestAnimationFrame(() => {
        frameRef.current = null;
        callbackRef.current(...args);
      });
    }) as T,
    deps
  );
}

// Convert country code to flag emoji
function countryCodeToFlag(countryCode: string): string {
  const code = countryCode.toUpperCase();
  // Regional indicator symbols: A=🇦 (U+1F1E6), B=🇧 (U+1F1E7), etc.
  const offset = 0x1F1E6 - 65; // 65 is ASCII for 'A'
  return String.fromCodePoint(
    code.charCodeAt(0) + offset,
    code.charCodeAt(1) + offset
  );
}

// Memoized edge dot component to prevent re-renders when zoom changes
interface EdgeDotProps {
  edge: EdgeLocation;
  coords: { x: number; y: number };
  isConnected: boolean;
  sizeScale: number;
  onEdgeClick: (edge: EdgeLocation) => void;
  onHoverStart: (edge: EdgeLocation, e: React.MouseEvent) => void;
  onHoverEnd: () => void;
}

const EdgeDot = memo(function EdgeDot({
  edge,
  coords,
  isConnected,
  sizeScale,
  onEdgeClick,
  onHoverStart,
  onHoverEnd,
}: EdgeDotProps) {
  return (
    <g
      style={{ cursor: "pointer" }}
      onClick={(e) => {
        e.stopPropagation();
        onEdgeClick(edge);
      }}
      onMouseEnter={(e) => onHoverStart(edge, e)}
      onMouseLeave={onHoverEnd}
    >
      {/* Pulse effect for connected edge - using CSS animations for performance */}
      {isConnected && (
        <g className="pulse-animation">
          <circle
            cx={coords.x}
            cy={coords.y}
            r={20 * sizeScale}
            fill="rgba(249, 115, 22, 0.2)"
            className="animate-pulse-slow"
          />
          <circle
            cx={coords.x}
            cy={coords.y}
            r={14 * sizeScale}
            fill="rgba(249, 115, 22, 0.3)"
            className="animate-pulse-slow-delayed"
          />
        </g>
      )}

      {/* Edge dot */}
      <circle
        cx={coords.x}
        cy={coords.y}
        r={(isConnected ? 7 : 4) * sizeScale}
        className={`transition-colors duration-300 ${
          isConnected
            ? "fill-orange-500"
            : "fill-slate-400 hover:fill-orange-400"
        }`}
        filter={isConnected ? "url(#glow)" : undefined}
      />

      {/* Hover effect */}
      <circle
        cx={coords.x}
        cy={coords.y}
        r={12 * sizeScale}
        fill="transparent"
        className="hover:fill-orange-500/10"
      />

      {/* Label for connected edge */}
      {isConnected && (
        <g>
          <text
            x={coords.x}
            y={coords.y - 18 * sizeScale}
            textAnchor="middle"
            className="fill-orange-400 font-bold"
            style={{ fontSize: `${11 * sizeScale}px` }}
          >
            {edge.city}
          </text>
          <text
            x={coords.x}
            y={coords.y - 6 * sizeScale}
            textAnchor="middle"
            className="fill-slate-400"
            style={{ fontSize: `${9 * sizeScale}px` }}
          >
            {edge.code}
          </text>
        </g>
      )}
    </g>
  );
}, (prevProps, nextProps) => {
  // Custom comparison - only re-render if these specific props change
  return (
    prevProps.isConnected === nextProps.isConnected &&
    prevProps.sizeScale === nextProps.sizeScale &&
    prevProps.edge.code === nextProps.edge.code
  );
});

export interface EdgeLocation {
  code: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
}

interface WorldMapProps {
  edges: EdgeLocation[];
  userLocation: {
    latitude: string;
    longitude: string;
    colo: string;
  } | null;
  onEdgeClick: (edge: EdgeLocation) => void;
}

// SVG dimensions
const WIDTH = 1000;
const HEIGHT = 500;

// Natural Earth projection setup
const projection = geoNaturalEarth1()
  .scale(180)
  .translate([WIDTH / 2, HEIGHT / 2]);

const pathGenerator = geoPath(projection);

// Create graticule for grid lines
const graticule = geoGraticule()
  .step([30, 30]);

// Convert lat/lng to SVG coordinates using Natural Earth projection
function toSvgCoords(lat: number, lng: number) {
  const coords = projection([lng, lat]);
  return coords ? { x: coords[0], y: coords[1] } : { x: WIDTH / 2, y: HEIGHT / 2 };
}

export const WorldMap = memo(function WorldMap({ edges, userLocation, onEdgeClick }: WorldMapProps) {
  const [landPath, setLandPath] = useState<string>("");
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [hoveredEdge, setHoveredEdge] = useState<EdgeLocation | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Cache bounding rect to avoid layout thrashing
  const cachedRectRef = useRef<DOMRect | null>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Zoom constraints
  const MIN_ZOOM = 1;
  const MAX_ZOOM = 4;

  const handleZoomIn = () => {
    setZoom((z) => Math.min(z * 1.5, MAX_ZOOM));
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoom / 1.5, MIN_ZOOM);
    setZoom(newZoom);
    // Reset pan if zooming out to 1x
    if (newZoom === 1) {
      setPan({ x: 0, y: 0 });
    }
  };

  const handleZoomReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Calculate viewBox based on zoom and pan
  const viewBoxWidth = WIDTH / zoom;
  const viewBoxHeight = HEIGHT / zoom;

  // Center point of the map
  const centerX = WIDTH / 2;
  const centerY = HEIGHT / 2;

  // Calculate pan limits (how far we can pan from center in each direction)
  const maxPanX = Math.max(0, (WIDTH - viewBoxWidth) / 2);
  const maxPanY = Math.max(0, (HEIGHT - viewBoxHeight) / 2);

  // Clamp pan values
  const clampedPanX = Math.max(-maxPanX, Math.min(maxPanX, pan.x));
  const clampedPanY = Math.max(-maxPanY, Math.min(maxPanY, pan.y));

  // ViewBox starts at center minus half the view size, plus pan offset
  const viewBoxX = centerX - viewBoxWidth / 2 + clampedPanX;
  const viewBoxY = centerY - viewBoxHeight / 2 + clampedPanY;

  // Mouse/touch event handlers for panning - optimized with cached rect
  const handleMouseDown = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (zoom <= 1 || !svgRef.current) return;
    // Cache the bounding rect at drag start
    cachedRectRef.current = svgRef.current.getBoundingClientRect();
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    setIsDragging(true);
  }, [zoom]);

  // Throttled mouse move handler using requestAnimationFrame
  const handleMouseMove = useThrottledCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDragging || !cachedRectRef.current) return;

    const rect = cachedRectRef.current;
    const scaleX = viewBoxWidth / rect.width;
    const scaleY = viewBoxHeight / rect.height;

    const dx = (e.clientX - dragStartRef.current.x) * scaleX;
    const dy = (e.clientY - dragStartRef.current.y) * scaleY;

    setPan(prev => ({
      x: prev.x - dx,
      y: prev.y - dy
    }));
    dragStartRef.current = { x: e.clientX, y: e.clientY };
  }, [isDragging, viewBoxWidth, viewBoxHeight]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    cachedRectRef.current = null;
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsDragging(false);
    cachedRectRef.current = null;
  }, []);

  // Touch event handlers - optimized
  const handleTouchStart = useCallback((e: React.TouchEvent<SVGSVGElement>) => {
    if (zoom <= 1 || e.touches.length !== 1 || !svgRef.current) return;
    cachedRectRef.current = svgRef.current.getBoundingClientRect();
    dragStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    setIsDragging(true);
  }, [zoom]);

  // Throttled touch move handler
  const handleTouchMove = useThrottledCallback((e: React.TouchEvent<SVGSVGElement>) => {
    if (!isDragging || !cachedRectRef.current || e.touches.length !== 1) return;

    const rect = cachedRectRef.current;
    const scaleX = viewBoxWidth / rect.width;
    const scaleY = viewBoxHeight / rect.height;

    const dx = (e.touches[0].clientX - dragStartRef.current.x) * scaleX;
    const dy = (e.touches[0].clientY - dragStartRef.current.y) * scaleY;

    setPan(prev => ({
      x: prev.x - dx,
      y: prev.y - dy
    }));
    dragStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, [isDragging, viewBoxWidth, viewBoxHeight]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    cachedRectRef.current = null;
  }, []);

  // Generate graticule path
  const graticulePath = useMemo(() => {
    return pathGenerator(graticule()) || "";
  }, []);

  // Load TopoJSON data
  useEffect(() => {
    fetch("/world-110m.json")
      .then((res) => res.json())
      .then((topology: Topology<{ land: GeometryCollection }>) => {
        const land = topojson.feature(topology, topology.objects.land) as
          FeatureCollection<Polygon | MultiPolygon> | Feature<Polygon | MultiPolygon>;

        // Use D3 geoPath to generate SVG path from GeoJSON
        const path = pathGenerator(land as any) || "";
        setLandPath(path);
      })
      .catch((err) => console.error("Failed to load world map:", err));
  }, []);

  const userCoords = userLocation
    ? {
        lat: parseFloat(userLocation.latitude),
        lng: parseFloat(userLocation.longitude),
      }
    : null;

  const connectedEdge = useMemo(() => {
    if (userLocation?.colo) {
      return edges.find((e) => e.code === userLocation.colo);
    }
    return null;
  }, [userLocation, edges]);

  const userSvgCoords = userCoords
    ? toSvgCoords(userCoords.lat, userCoords.lng)
    : null;
  const connectedSvgCoords = connectedEdge
    ? toSvgCoords(connectedEdge.lat, connectedEdge.lng)
    : null;

  // Scale factor for maintaining constant screen size
  const sizeScale = 1 / zoom;

  // Memoized hover handlers to prevent recreation
  const handleEdgeHoverStart = useCallback((edge: EdgeLocation, e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setTooltipPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    setHoveredEdge(edge);
  }, []);

  const handleEdgeHoverEnd = useCallback(() => {
    setHoveredEdge(null);
  }, []);

  // Pre-calculate edge coordinates - memoized to avoid recalculation
  const edgeCoords = useMemo(() => {
    return edges.map(edge => ({
      edge,
      coords: toSvgCoords(edge.lat, edge.lng)
    }));
  }, [edges]);

  return (
    <div ref={containerRef} className="w-full h-full flex items-center justify-center p-4 md:p-8 relative">
      <svg
        ref={svgRef}
        viewBox={`${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}`}
        className="w-full h-full max-w-6xl"
        style={{
          filter: "drop-shadow(0 0 60px rgba(249, 115, 22, 0.08))",
          cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Definitions - using fixed blur values for performance */}
        <defs>
          <linearGradient
            id="connectionGradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#F97316" />
          </linearGradient>
          <filter id="glow" filterUnits="userSpaceOnUse">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background */}
        <rect x={viewBoxX - 100} y={viewBoxY - 100} width={viewBoxWidth + 200} height={viewBoxHeight + 200} fill="#0f172a" />

        {/* Grid lines using D3 graticule (curved for Natural Earth) */}
        {graticulePath && (
          <path
            d={graticulePath}
            fill="none"
            stroke="rgba(71, 85, 105, 0.2)"
            strokeWidth={0.5 * sizeScale}
          />
        )}

        {/* Land masses */}
        {landPath && (
          <motion.path
            d={landPath}
            fill="rgba(51, 65, 85, 0.6)"
            stroke="rgba(100, 116, 139, 0.5)"
            strokeWidth={0.5 * sizeScale}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
          />
        )}

        {/* Connection line from user to edge */}
        {userSvgCoords && connectedSvgCoords && (
          <motion.line
            x1={userSvgCoords.x}
            y1={userSvgCoords.y}
            x2={connectedSvgCoords.x}
            y2={connectedSvgCoords.y}
            stroke="url(#connectionGradient)"
            strokeWidth={2 * sizeScale}
            strokeDasharray={`${8 * sizeScale},${4 * sizeScale}`}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.2, delay: 0.5, ease: "easeOut" }}
            filter="url(#glow)"
          />
        )}

        {/* Edge location dots - using memoized component */}
        {edgeCoords.map(({ edge, coords }) => (
          <EdgeDot
            key={edge.code}
            edge={edge}
            coords={coords}
            isConnected={connectedEdge?.code === edge.code}
            sizeScale={sizeScale}
            onEdgeClick={onEdgeClick}
            onHoverStart={handleEdgeHoverStart}
            onHoverEnd={handleEdgeHoverEnd}
          />
        ))}

        {/* User location marker - using CSS animations for pulse rings */}
        {userSvgCoords && (
          <g>
            {/* Pulse rings with CSS animation classes */}
            <circle
              cx={userSvgCoords.x}
              cy={userSvgCoords.y}
              r={18 * sizeScale}
              fill="none"
              stroke="rgba(59, 130, 246, 0.4)"
              strokeWidth={2 * sizeScale}
              className="animate-pulse-ring"
            />
            <circle
              cx={userSvgCoords.x}
              cy={userSvgCoords.y}
              r={13 * sizeScale}
              fill="none"
              stroke="rgba(59, 130, 246, 0.6)"
              strokeWidth={1.5 * sizeScale}
              className="animate-pulse-ring-delayed"
            />

            {/* User dot with white border */}
            <circle
              cx={userSvgCoords.x}
              cy={userSvgCoords.y}
              r={8 * sizeScale}
              className="fill-blue-500"
              filter="url(#glow)"
            />
            <circle
              cx={userSvgCoords.x}
              cy={userSvgCoords.y}
              r={8 * sizeScale}
              fill="none"
              stroke="white"
              strokeWidth={2 * sizeScale}
            />

            {/* "You" label */}
            <text
              x={userSvgCoords.x}
              y={userSvgCoords.y + 22 * sizeScale}
              textAnchor="middle"
              className="fill-blue-400 font-semibold"
              style={{ fontSize: `${10 * sizeScale}px` }}
            >
              You
            </text>
          </g>
        )}
      </svg>

      {/* Legend */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-4 md:bottom-8 left-4 md:left-8 flex flex-wrap gap-4 md:gap-6 text-xs md:text-sm text-slate-400"
      >
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500 ring-2 ring-white" />
          <span>Your Location</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-orange-500" />
          <span>Connected Edge</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-400" />
          <span>Cloudflare Edge ({edges.length})</span>
        </div>
      </motion.div>

      {/* Zoom Controls */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-4 md:bottom-8 right-4 md:right-8 flex flex-col gap-1"
      >
        <button
          onClick={handleZoomIn}
          disabled={zoom >= MAX_ZOOM}
          className="w-10 h-10 bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded-t-lg flex items-center justify-center text-slate-300 hover:bg-slate-800 hover:text-orange-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Zoom in"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
        <button
          onClick={handleZoomReset}
          disabled={zoom === 1}
          className="w-10 h-10 bg-slate-900/80 backdrop-blur-sm border-x border-slate-700/50 flex items-center justify-center text-slate-300 hover:bg-slate-800 hover:text-orange-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Reset zoom"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
        </button>
        <button
          onClick={handleZoomOut}
          disabled={zoom <= MIN_ZOOM}
          className="w-10 h-10 bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded-b-lg flex items-center justify-center text-slate-300 hover:bg-slate-800 hover:text-orange-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Zoom out"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </motion.div>

      {/* Zoom indicator */}
      {zoom !== 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute top-4 right-4 px-2 py-1 bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded text-xs text-slate-400"
        >
          {Math.round(zoom * 100)}% · Drag to pan
        </motion.div>
      )}

      {/* Edge hover tooltip */}
      <AnimatePresence>
        {hoveredEdge && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className="absolute pointer-events-none z-50"
            style={{
              left: tooltipPos.x + 12,
              top: tooltipPos.y - 20,
            }}
          >
            <div className="bg-slate-900/95 backdrop-blur-sm border border-slate-700/50 rounded-lg px-3 py-2 shadow-xl flex items-center gap-2">
              <span className="text-xl leading-none">{countryCodeToFlag(hoveredEdge.country)}</span>
              <div className="flex flex-col">
                <span className="text-white font-medium text-sm">{hoveredEdge.city}</span>
                <span className="text-slate-400 text-xs">{hoveredEdge.code}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
