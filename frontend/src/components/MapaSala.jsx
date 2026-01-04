import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Polyline, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix dos ícones (Vite + Leaflet)
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// 👉 Mete aqui as coordenadas “fixas” do edifício/entrada da ESTG (ajustas depois se quiseres)
const ESTG_COORDS = { lat: 41.693333, lng: -8.846667 };

export default function MapaSala({ sala }) {
  const [userPos, setUserPos] = useState(null);

  // pedir localização (opcional)
  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPos({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      () => {
        // se o user recusar, não faz mal – fica só o marcador da ESTG
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  const destination = useMemo(() => ESTG_COORDS, []);
  const polyline = useMemo(() => {
    if (!userPos) return null;
    return [
      [userPos.lat, userPos.lng],
      [destination.lat, destination.lng],
    ];
  }, [userPos, destination]);

  const openDirections = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${destination.lat},${destination.lng}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="map-section">
      <div className="map-card">
        <MapContainer
          center={[destination.lat, destination.lng]}
          zoom={17}
          scrollWheelZoom={false}
          dragging={true}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <Marker position={[destination.lat, destination.lng]}>
            <Popup>
              <strong>ESTG</strong>
              <br />
              Sala {sala?.nome ?? ""}
            </Popup>
          </Marker>

          {userPos && (
            <>
              <Marker position={[userPos.lat, userPos.lng]}>
                <Popup>A tua localização</Popup>
              </Marker>

              {/* Linha simples (tipo “rota”) */}
              {polyline && <Polyline positions={polyline} />}
            </>
          )}
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
