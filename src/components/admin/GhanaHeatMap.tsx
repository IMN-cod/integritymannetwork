"use client";

import { useEffect, useRef, useState } from "react";

interface RegionData {
  name: string;
  lat: number;
  lng: number;
  count: number;
}

interface GhanaHeatMapProps {
  regions: RegionData[];
}

export default function GhanaHeatMap({ regions }: GhanaHeatMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    let cancelled = false;

    async function initMap() {
      // Dynamic import — Leaflet must load client-side only
      const L = (await import("leaflet")).default;

      // Inject Leaflet CSS if not already present
      if (!document.querySelector('link[href*="leaflet"]')) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        link.crossOrigin = "";
        document.head.appendChild(link);
        // Wait for CSS to load
        await new Promise<void>((resolve) => {
          link.onload = () => resolve();
          link.onerror = () => resolve();
        });
      }

      if (cancelled || !mapRef.current) return;

      // Ghana center & bounds
      const ghanaCenter: [number, number] = [7.9465, -1.0232];
      const map = L.map(mapRef.current, {
        center: ghanaCenter,
        zoom: 7,
        minZoom: 6,
        maxZoom: 12,
        zoomControl: true,
        attributionControl: false,
        scrollWheelZoom: true,
      });

      // Sleek dark tile layer (CartoDB Dark Matter)
      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        {
          subdomains: "abcd",
          maxZoom: 19,
        }
      ).addTo(map);

      // Small attribution
      L.control.attribution({ position: "bottomright", prefix: false }).addTo(map);

      mapInstanceRef.current = map;

      // Add heatmap circles
      const maxCount = Math.max(...regions.map((r) => r.count), 1);

      regions.forEach((region) => {
        if (region.count === 0) {
          // Dim marker for zero-activity regions
          L.circleMarker([region.lat, region.lng], {
            radius: 5,
            fillColor: "#475569",
            fillOpacity: 0.4,
            color: "#64748b",
            weight: 1,
          })
            .bindTooltip(
              `<div style="text-align:center;font-family:system-ui">
                <strong>${region.name}</strong><br/>
                <span style="color:#94a3b8">No activity</span>
              </div>`,
              { direction: "top", className: "heatmap-tooltip" }
            )
            .addTo(map);
          return;
        }

        const intensity = region.count / maxCount;
        const radius = Math.max(12, Math.min(45, intensity * 45));

        // Color gradient: low = amber, medium = orange, high = red
        const color = getHeatColor(intensity);

        // Outer glow
        L.circle([region.lat, region.lng], {
          radius: radius * 800,
          fillColor: color,
          fillOpacity: 0.12,
          color: color,
          weight: 0,
        }).addTo(map);

        // Middle ring
        L.circle([region.lat, region.lng], {
          radius: radius * 450,
          fillColor: color,
          fillOpacity: 0.25,
          color: color,
          weight: 0,
        }).addTo(map);

        // Core hotspot
        const marker = L.circleMarker([region.lat, region.lng], {
          radius: Math.max(8, radius * 0.5),
          fillColor: color,
          fillOpacity: 0.85,
          color: "#fff",
          weight: 2,
        })
          .bindTooltip(
            `<div style="text-align:center;font-family:system-ui;min-width:100px">
              <strong style="font-size:13px">${region.name}</strong><br/>
              <span style="font-size:18px;font-weight:700;color:${color}">${region.count}</span><br/>
              <span style="font-size:10px;color:#94a3b8">${intensity >= 0.75 ? "🔥 Hot Zone" : intensity >= 0.5 ? "⚡ Active" : intensity >= 0.25 ? "📍 Moderate" : "💤 Low"}</span>
            </div>`,
            { direction: "top", className: "heatmap-tooltip" }
          )
          .addTo(map);

        // Pulse animation for top regions
        if (intensity >= 0.6) {
          const pulseIcon = L.divIcon({
            className: "pulse-marker",
            html: `<div style="
              width: ${radius * 1.2}px;
              height: ${radius * 1.2}px;
              background: ${color};
              border-radius: 50%;
              opacity: 0.3;
              animation: pulse-ring 2s ease-out infinite;
            "></div>`,
            iconSize: [radius * 1.2, radius * 1.2],
            iconAnchor: [radius * 0.6, radius * 0.6],
          });
          L.marker([region.lat, region.lng], { icon: pulseIcon, interactive: false }).addTo(map);
        }

        // Count label
        if (region.count > 0) {
          const labelIcon = L.divIcon({
            className: "count-label",
            html: `<div style="
              font-size: ${radius > 20 ? 13 : 10}px;
              font-weight: 700;
              color: white;
              text-shadow: 0 1px 3px rgba(0,0,0,0.8);
              text-align: center;
              pointer-events: none;
            ">${region.count}</div>`,
            iconSize: [40, 20],
            iconAnchor: [20, 10],
          });
          L.marker([region.lat, region.lng], { icon: labelIcon, interactive: false }).addTo(map);
        }
      });

      // Legend
      const LControl = L.Control.extend({
        onAdd() {
          const div = L.DomUtil.create("div", "heatmap-legend");
          div.innerHTML = `
          <div style="
            background: rgba(15,23,42,0.9);
            border: 1px solid rgba(100,116,139,0.3);
            border-radius: 8px;
            padding: 10px 14px;
            font-family: system-ui;
            font-size: 11px;
            color: #e2e8f0;
            backdrop-filter: blur(8px);
          ">
            <div style="font-weight:700;margin-bottom:6px;font-size:12px">Engagement Zones</div>
            <div style="display:flex;flex-direction:column;gap:4px">
              <div style="display:flex;align-items:center;gap:6px">
                <span style="width:10px;height:10px;border-radius:50%;background:#ef4444;display:inline-block"></span> Hot Zone
              </div>
              <div style="display:flex;align-items:center;gap:6px">
                <span style="width:10px;height:10px;border-radius:50%;background:#f97316;display:inline-block"></span> Active
              </div>
              <div style="display:flex;align-items:center;gap:6px">
                <span style="width:10px;height:10px;border-radius:50%;background:#eab308;display:inline-block"></span> Moderate
              </div>
              <div style="display:flex;align-items:center;gap:6px">
                <span style="width:10px;height:10px;border-radius:50%;background:#22c55e;display:inline-block"></span> Low
              </div>
              <div style="display:flex;align-items:center;gap:6px">
                <span style="width:10px;height:10px;border-radius:50%;background:#475569;display:inline-block"></span> No Activity
              </div>
            </div>
          </div>
        `;
          return div;
        },
      });
      new LControl({ position: "bottomleft" }).addTo(map);

      setReady(true);

      // Force recalculate size after render
      setTimeout(() => map.invalidateSize(), 100);
    }

    initMap();

    return () => {
      cancelled = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [regions]);

  return (
    <div className="relative w-full">
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 rounded-xl z-10">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-slate-400">Loading map...</span>
          </div>
        </div>
      )}
      <div
        ref={mapRef}
        className="w-full rounded-xl overflow-hidden"
        style={{ height: "480px" }}
      />
      {/* Inject animation keyframes */}
      <style>{`
        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 0.3; }
          100% { transform: scale(2.5); opacity: 0; }
        }
        .pulse-marker {
          background: none !important;
          border: none !important;
        }
        .count-label {
          background: none !important;
          border: none !important;
        }
        .heatmap-tooltip {
          background: rgba(15,23,42,0.95) !important;
          border: 1px solid rgba(100,116,139,0.3) !important;
          border-radius: 8px !important;
          padding: 8px 12px !important;
          box-shadow: 0 8px 32px rgba(0,0,0,0.4) !important;
          color: #e2e8f0 !important;
        }
        .heatmap-tooltip::before {
          border-top-color: rgba(15,23,42,0.95) !important;
        }
        .leaflet-container {
          background: #0f172a !important;
          font-family: system-ui, -apple-system, sans-serif;
        }
      `}</style>
    </div>
  );
}

function getHeatColor(intensity: number): string {
  if (intensity >= 0.75) return "#ef4444"; // red — hot zone
  if (intensity >= 0.5) return "#f97316";  // orange — active
  if (intensity >= 0.25) return "#eab308"; // yellow — moderate 
  return "#22c55e";                         // green — low
}
