import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Polyline, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Entrada fixa (ajusta depois)
const ENTRADA_ESTG = { lat: 41.693333, lng: -8.846667 };

// helper OSRM (rota a pé)
async function fetchRouteOSRM(from, to) {
  const url =
    `https://router.project-osrm.org/route/v1/foot/` +
    `${from.lng},${from.lat};${to.lng},${to.lat}` +
    `?overview=full&geometries=geojson`;

  const r = await fetch(url);
  const data = await r.json();

  const coords = data?.routes?.[0]?.geometry?.coordinates;
  if (!coords) return null;

  // OSRM -> [lng, lat] ; Leaflet -> [lat, lng]
  return coords.map(([lng, lat]) => [lat, lng]);
}

export default function MapaSala({ sala }) {
  const [userPos, setUserPos] = useState(null);
  const [route, setRoute] = useState(null);

  const destination = useMemo(() => ENTRADA_ESTG, []);

  // pedir localização (opcional)
  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        // se recusar, ok
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  // buscar rota quando tiver userPos
  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!userPos) {
        setRoute(null);
        return;
      }
      const r = await fetchRouteOSRM(userPos, destination);
      if (!cancelled) setRoute(r);
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [userPos, destination]);

  const openDirections = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${destination.lat},${destination.lng}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="map-section">
      <div className="map-card">
        <MapContainer center={[destination.lat, destination.lng]} zoom={17} scrollWheelZoom={false}>
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <Marker position={[destination.lat, destination.lng]}>
            <Popup>
              <strong>Entrada ESTG</strong>
              <br />
              Sala {sala?.nome ?? ""}
            </Popup>
          </Marker>

          {userPos && (
            <Marker position={[userPos.lat, userPos.lng]}>
              <Popup>A tua localização</Popup>
            </Marker>
          )}

          {/* rota real */}
          {route && <Polyline positions={route} />}
        </MapContainer>
      </div>

      <div className="map-actions">
        <button type="button" className="btn-map" onClick={openDirections}>
          Abrir direções
        </button>
      </div>
    </div>
  );
}
