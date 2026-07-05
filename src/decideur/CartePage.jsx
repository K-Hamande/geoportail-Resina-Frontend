import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { Link } from "react-router-dom";
import { apiGet } from "../shared/apiClient";
import { buildColoredMarkerIcon } from "../shared/mapMarkers";
import { getStatusLabel } from "../shared/statusStyles";
import DecideurLayout from "./DecideurLayout";

const CENTRE_BURKINA_FASO = [12.2, -1.5];

function CartePage() {
  const [sites, setSites] = useState([]);
  const [erreur, setErreur] = useState(null);

  useEffect(() => {
    apiGet("/api/v1/sites/map").then(setSites).catch((err) => setErreur(err.message));
  }, []);

  return (
    <DecideurLayout>
      {erreur && <p style={{ color: "var(--color-ko)" }}>Erreur : {erreur}</p>}

      <MapContainer center={CENTRE_BURKINA_FASO} zoom={7} className="map-container">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {sites
          .filter((site) => site.latitude != null && site.longitude != null)
          .map((site) => (
            <Marker key={site.siteId} position={[site.latitude, site.longitude]} icon={buildColoredMarkerIcon(site.statutGlobal)}>
              <Popup>
                <strong>{site.nom}</strong>
                <br />
                {site.ville}
                <br />
                Statut : {getStatusLabel(site.statutGlobal)}
                <br />
                <Link to={`/?site=${site.siteId}`}>Voir ce site →</Link>
              </Popup>
            </Marker>
          ))}
      </MapContainer>
    </DecideurLayout>
  );
}

export default CartePage;