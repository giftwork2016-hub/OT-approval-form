"use client";

import "leaflet/dist/leaflet.css";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";
import L from "leaflet";

const DefaultIcon = L.icon({
  iconUrl: "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconRetinaUrl: "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface GeoMapProps {
  position: { lat: number; lng: number };
  onDrag?: ((position: { lat: number; lng: number }) => void) | undefined;
}

function DraggableMarker({ position, onDrag }: GeoMapProps) {
  useMapEvents({
    dragend(event) {
      const marker = event.target as L.Marker;
      const latlng = marker.getLatLng();
      onDrag?.({ lat: latlng.lat, lng: latlng.lng });
    },
  });

  return (
    <Marker
      draggable
      position={position}
      eventHandlers={{
        dragend: (event) => {
          const latlng = (event.target as L.Marker).getLatLng();
          onDrag?.({ lat: latlng.lat, lng: latlng.lng });
        },
      }}
    />
  );
}

export function GeoMap({ position, onDrag }: GeoMapProps) {
  return (
    <MapContainer center={position} zoom={17} className="h-52 w-full rounded-2xl" scrollWheelZoom={false}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
      <DraggableMarker position={position} onDrag={onDrag} />
    </MapContainer>
  );
}
