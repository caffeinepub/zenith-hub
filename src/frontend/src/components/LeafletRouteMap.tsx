import L from "leaflet";
import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
// @ts-ignore
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
// @ts-ignore
import iconUrl from "leaflet/dist/images/marker-icon.png";
// @ts-ignore
import shadowUrl from "leaflet/dist/images/marker-shadow.png";
import type { TripWaypoint } from "../hooks/useQueries";

// Fix Leaflet default icon issue with Vite
(L.Icon.Default.prototype as any)._getIconUrl = undefined;
L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl });

interface LeafletRouteMapProps {
  waypoints: TripWaypoint[];
}

interface GeoPoint {
  lat: number;
  lng: number;
  name: string;
}

export default function LeafletRouteMap({ waypoints }: LeafletRouteMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const polylineRef = useRef<L.Polyline | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [20.5937, 78.9629],
      zoom: 5,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "\u00a9 OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Geocode and render waypoints
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing markers and polyline
    for (const m of markersRef.current) {
      m.remove();
    }
    markersRef.current = [];
    if (polylineRef.current) {
      polylineRef.current.remove();
      polylineRef.current = null;
    }

    if (waypoints.length === 0) {
      mapRef.current.setView([20.5937, 78.9629], 5);
      return;
    }

    const geocode = async () => {
      setLoading(true);
      setError(null);
      const points: GeoPoint[] = [];

      for (const wp of waypoints) {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(wp.name)}&format=json&limit=1`,
            { headers: { Accept: "application/json" } },
          );
          const data = await res.json();
          if (data && data.length > 0) {
            points.push({
              lat: Number.parseFloat(data[0].lat),
              lng: Number.parseFloat(data[0].lon),
              name: wp.name,
            });
          }
        } catch {
          // skip failed geocodes
        }
      }

      if (!mapRef.current) return;

      if (points.length === 0) {
        setError("Could not locate waypoints on map. Check spelling.");
        setLoading(false);
        return;
      }

      const latlngs: L.LatLngExpression[] = [];

      for (let i = 0; i < points.length; i++) {
        const pt = points[i];
        const marker = L.marker([pt.lat, pt.lng])
          .addTo(mapRef.current!)
          .bindPopup(`<b>#${i + 1} ${pt.name}</b>`);
        markersRef.current.push(marker);
        latlngs.push([pt.lat, pt.lng]);
      }

      if (latlngs.length > 1) {
        polylineRef.current = L.polyline(latlngs, {
          color: "#f59e0b",
          weight: 3,
          dashArray: "8, 6",
          opacity: 0.9,
        }).addTo(mapRef.current);
      }

      const bounds = L.latLngBounds(latlngs as L.LatLngExpression[]);
      mapRef.current.fitBounds(bounds, { padding: [40, 40] });

      setLoading(false);
    };

    geocode();
  }, [waypoints]);

  return (
    <div
      className="relative w-full rounded-xl overflow-hidden border border-border"
      style={{ height: "320px" }}
    >
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/70 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <span className="text-sm text-muted-foreground">
              Locating waypoints\u2026
            </span>
          </div>
        </div>
      )}
      {!loading && error && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/70">
          <p className="text-sm text-destructive px-4 text-center">{error}</p>
        </div>
      )}
      {waypoints.length === 0 && !loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <p className="text-sm text-muted-foreground">
            Add waypoints to see them on the map
          </p>
        </div>
      )}
      <div
        ref={containerRef}
        className="w-full h-full"
        data-ocid="trip.map_marker"
      />
    </div>
  );
}
