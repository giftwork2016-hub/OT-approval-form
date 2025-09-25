import type { CompanySite, ProofLocation } from "./types";

export function isPointInsideCircle(
  point: ProofLocation,
  site: CompanySite & { geofenceType: "circle"; centerLat: number; centerLng: number; radiusM: number }
): boolean {
  const distance = haversineDistance(point.lat, point.lng, site.centerLat, site.centerLng);
  return distance <= site.radiusM;
}

export function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) + Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export function evaluateGeofence(point: ProofLocation | undefined, sites: CompanySite[]): {
  inGeofence: boolean;
  siteId: string | null;
} {
  if (!point) {
    return { inGeofence: false, siteId: null };
  }
  for (const site of sites) {
    if (site.geofenceType === "circle" && site.centerLat && site.centerLng && site.radiusM) {
      const circleSite = {
        ...site,
        geofenceType: "circle" as const,
        centerLat: site.centerLat,
        centerLng: site.centerLng,
        radiusM: site.radiusM,
      };
      if (isPointInsideCircle(point, circleSite)) {
        return { inGeofence: true, siteId: site.id };
      }
    }
  }
  return { inGeofence: false, siteId: null };
}
