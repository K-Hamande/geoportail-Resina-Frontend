import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import { useAuth } from "../shared/AuthContext";
import { adminGet, adminPut } from "../shared/backofficeApiClient";
import { buildColoredMarkerIcon } from "../shared/mapMarkers";
import LocationPicker from "./LocationPicker";
import Topbar from "./Topbar";

const CENTRE_BURKINA_FASO = [12.2, -1.5];

function CartographyPage() {
  const { getAuthHeader } = useAuth();
  const [items, setItems] = useState([]);
  const [siteId, setSiteId] = useState(null);
  const [erreur, setErreur] = useState(null);
  const [succes, setSucces] = useState(false);
  const [enregistrement, setEnregistrement] = useState(false);
  const [brouillon, setBrouillon] = useState({ latitude: null, longitude: null, infoAuSurvol: "" });

  function charger() {
    adminGet("/backoffice/api/v1/cartography", getAuthHeader())
      .then((data) => {
        setItems(data);
        if (data.length > 0 && !siteId) setSiteId(data[0].siteId);
      })
      .catch((err) => setErreur(err.message));
  }

  useEffect(() => {
    charger();
  }, []);

  useEffect(() => {
    const item = items.find((i) => i.siteId === siteId);
    if (item) {
      setBrouillon({ latitude: item.latitude, longitude: item.longitude, infoAuSurvol: item.infoAuSurvol ?? "" });
    }
    setSucces(false);
  }, [siteId, items]);

  async function enregistrer() {
    setErreur(null);
    setSucces(false);
    setEnregistrement(true);
    try {
      await adminPut(`/backoffice/api/v1/sites/${siteId}/cartography`, getAuthHeader(), {
        latitude: brouillon.latitude,
        longitude: brouillon.longitude,
        infoAuSurvol: brouillon.infoAuSurvol,
      });
      setSucces(true);
      charger();
    } catch (err) {
      setErreur(err.message);
    } finally {
      setEnregistrement(false);
    }
  }

  function exporterGeoJson() {
    const geojson = {
      type: "FeatureCollection",
      features: items
        .filter((i) => i.latitude != null && i.longitude != null)
        .map((i) => ({
          type: "Feature",
          properties: { siteId: i.siteId, nom: i.nom, infoAuSurvol: i.infoAuSurvol },
          geometry: { type: "Point", coordinates: [i.longitude, i.latitude] },
        })),
    };
    // Genere un fichier telechargeable directement depuis le navigateur,
    // sans avoir besoin d'un endpoint backend dedie : on construit un
    // Blob (fichier en memoire) et on simule un clic sur un lien de
    // telechargement.
    const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: "application/geo+json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sites-resina.geojson";
    a.click();
    URL.revokeObjectURL(url);
  }

  const centreCarte = brouillon.latitude != null && brouillon.longitude != null
    ? [brouillon.latitude, brouillon.longitude]
    : CENTRE_BURKINA_FASO;

  return (
    <>
      <Topbar title="Cartographie" subtitle="Positionnement des sites sur la carte du Burkina Faso" onRefresh={charger} />

      <div className="backoffice-content">
        {erreur && <p style={{ color: "var(--color-ko)" }}>Erreur : {erreur}</p>}

        <div className="panel">
          <div className="panel-header">
            <h2>Coordonnées GPS des sites</h2>
            <div className="panel-header-actions">
              <button className="btn-outline" onClick={exporterGeoJson}>Exporter GeoJSON</button>
            </div>
          </div>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Site</th>
                <th>Latitude</th>
                <th>Longitude</th>
                <th>Info au survol</th>
                <th>Statut carte</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.siteId}>
                  <td className="site-name-cell">{item.nom}</td>
                  <td>{item.latitude ?? "—"}</td>
                  <td>{item.longitude ?? "—"}</td>
                  <td>{item.infoAuSurvol ?? "—"}</td>
                  <td>
                    <span className={`status-badge ${item.positionne ? "badge-ok" : "badge-warn"}`}>
                      {item.positionne ? "Positionné" : "À positionner"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="panel">
          <div className="panel-header">
            <h2>Positionner un site</h2>
          </div>

          <div className="form-field" style={{ maxWidth: "320px", marginBottom: "16px" }}>
            <label>Site à positionner</label>
            <select value={siteId || ""} onChange={(e) => setSiteId(e.target.value)}>
              {items.map((item) => (
                <option key={item.siteId} value={item.siteId}>{item.nom}</option>
              ))}
            </select>
          </div>

          <p style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>
            Cliquez sur la carte pour définir la position du site sélectionné.
          </p>

          <MapContainer center={centreCarte} zoom={brouillon.latitude != null ? 12 : 7} className="map-container" key={siteId}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <LocationPicker onPick={(lat, lng) => setBrouillon((prev) => ({ ...prev, latitude: lat, longitude: lng }))} />
            {brouillon.latitude != null && brouillon.longitude != null && (
              <Marker position={[brouillon.latitude, brouillon.longitude]} icon={buildColoredMarkerIcon("OK")} />
            )}
          </MapContainer>

          <div className="form-grid" style={{ marginTop: "16px" }}>
            <div className="form-field">
              <label>Latitude</label>
              <input type="number" step="0.0001" value={brouillon.latitude ?? ""} readOnly />
            </div>
            <div className="form-field">
              <label>Longitude</label>
              <input type="number" step="0.0001" value={brouillon.longitude ?? ""} readOnly />
            </div>
            <div className="form-field" style={{ gridColumn: "span 2" }}>
              <label>Info affichée au survol / clic</label>
              <input
                value={brouillon.infoAuSurvol}
                onChange={(e) => setBrouillon((prev) => ({ ...prev, infoAuSurvol: e.target.value }))}
                placeholder="ex: Hub central RESINA"
              />
            </div>
          </div>

          {succes && <p style={{ color: "var(--color-ok)" }}>Position enregistrée avec succès.</p>}

          <div className="modal-actions" style={{ justifyContent: "flex-start", marginTop: "16px" }}>
            <button className="btn-primary" onClick={enregistrer} disabled={enregistrement || brouillon.latitude == null}>
              {enregistrement ? "Enregistrement..." : "Enregistrer la position"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default CartographyPage;