# Zenith Hub

## Current State
The Trip Manager is fully implemented with TripManagerPage (list view), TripDetailPage (tabs: Itinerary, Route Map, Packing, Budget), and RouteMapCanvas (custom HTML5 canvas with grid background and animated pins — no real geography). The Sidebar and App.tsx both include the Trip Manager route. The feature is fully functional but the map is not geographically accurate.

## Requested Changes (Diff)

### Add
- `LeafletRouteMap.tsx` component using Leaflet.js + OpenStreetMap tiles
- Geocoding of waypoint names via Nominatim API (free, no API key required)
- Real markers on actual map locations with popups showing waypoint names
- Polyline drawn between geocoded waypoints in order
- Auto-fit map bounds to show all waypoints
- Loading state while geocoding
- Fallback message when waypoints have no recognizable locations

### Modify
- `TripDetailPage.tsx` — replace `<RouteMapCanvas>` with `<LeafletRouteMap>`
- Install `leaflet` and `@types/leaflet` npm packages
- Import Leaflet CSS in LeafletRouteMap component

### Remove
- `RouteMapCanvas.tsx` (replaced by LeafletRouteMap)

## Implementation Plan
1. Add `leaflet` + `@types/leaflet` as dependencies
2. Create `src/frontend/src/components/LeafletRouteMap.tsx`:
   - Accept `waypoints: TripWaypoint[]` prop
   - On waypoint change, geocode each name via `https://nominatim.openstreetmap.org/search?q=<name>&format=json&limit=1`
   - Initialize Leaflet map with OpenStreetMap tiles
   - Plot L.marker for each geocoded location with popup
   - Draw L.polyline connecting waypoints in order
   - Fit map bounds to all markers
   - Show spinner during geocoding
   - Empty state when no waypoints added
3. Update `TripDetailPage.tsx` to import and use `LeafletRouteMap` instead of `RouteMapCanvas`
4. Delete `RouteMapCanvas.tsx`
