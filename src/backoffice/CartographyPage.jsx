import { useEffect, useMemo, useState } from "react";
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
  const [recherche, setRecherche] = useState("");
  const [seulementAPositionner, setSeulementAPositionner] = useState(false);
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

  const itemsFiltres = useMemo(() => {
    const texte = recherche.trim().toLowerCase();
    return items.filter((item) => {
      if (seulementAPositionner && item.positionne) return false;
      if (!texte) return true;
      return item.nom.toLowerCase().includes(texte);
    });
  }, [items, recherche, seulementAPositionner]);

  const sitePositionnes = items.filter((i) => i.latitude != null && i.longitude != null);

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
    const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: "application/geo+json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sites-resina.geojson";
    a.click();
    URL.revokeObjectURL(url);
  }

  const siteSelectionne = items.find((i) => i.siteId === siteId);
  const centreCarte = brouillon.latitude != null && brouillon.longitude != null
    ? [brouillon.latitude, brouillon.longitude]
    : CENTRE_BURKINA_FASO;

  return (
    <>
      <Topbar title="Cartographie" subtitle={`Positionnement des sites — ${sitePositionnes.length} sur ${items.length} déjà positionnés`} onRefresh={charger} />

      <div className="backoffice-content">
        {erreur && <p style={{ color: "var(--color-ko)" }}>Erreur : {erreur}</p>}

        <div className="panel-header" style={{ marginBottom: "16px" }}>
          <h2 style={{ margin: 0 }}>Carte des sites</h2>
          <div className="panel-header-actions">
            <button className="btn-outline" onClick={exporterGeoJson}>Exporter GeoJSON</button>
          </div>
        </div>

        {/* .map-layout / .map-sidebar : meme composant visuel que la carte
            cote Decideur (carte a gauche, liste filtrable a droite a partir
            de 1024px, empile en dessous sur petit ecran). */}
        <div className="map-layout">
          <MapContainer center={centreCarte} zoom={brouillon.latitude != null ? 12 : 7} className="map-container" key={siteId}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <LocationPicker onPick={(lat, lng) => setBrouillon((prev) => ({ ...prev, latitude: lat, longitude: lng }))} />

{items
              .filter((item) => item.latitude != null && item.longitude != null && item.siteId !== siteId)
              .map((item) => (
                <Marker key={item.siteId} position={[item.latitude, item.longitude]} icon={buildColoredMarkerIcon("UNKNOWN")} />
              ))}

            {brouillon.latitude != null && brouillon.longitude != null && (
              <Marker position={[brouillon.latitude, brouillon.longitude]} icon={buildColoredMarkerIcon("OK")} />
            )}
          </MapContainer>

          <div className="map-sidebar">
            <div className="form-field" style={{ marginBottom: "8px" }}>
              <input
                type="text"
                placeholder="Rechercher un site…"
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
              />
            </div>

            <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", marginBottom: "10px", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={seulementAPositionner}
                onChange={(e) => setSeulementAPositionner(e.target.checked)}
              />
              À positionner uniquement
            </label>

            <div className="map-sidebar-count">
              {itemsFiltres.length} site{itemsFiltres.length > 1 ? "s" : ""}
            </div>

            <div className="map-sidebar-list">
              {itemsFiltres.map((item) => (
                <button
                  type="button"
                  key={item.siteId}
                  className="map-site-item"
                  style={{ border: "none", width: "100%", cursor: "pointer", background: item.siteId === siteId ? "#E9F1FB" : "transparent" }}
                  onClick={() => setSiteId(item.siteId)}
                >
                  <div>
                    <div className="map-site-item-name">{item.nom}</div>
                    <div className="map-site-item-ville">{item.positionne ? "Positionné" : "Non positionné"}</div>
                  </div>
<span className={`status-badge ${item.positionne ? "badge-unknown" : "badge-warn"}`}>
                    {item.positionne ? "Positionné" : "À positionner"}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {siteSelectionne && (
          <div className="panel" style={{ marginTop: "16px" }}>
            <div className="panel-header">
              <h2>Positionner : {siteSelectionne.nom}</h2>
            </div>

            <p style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>
              Cliquez sur la carte ci-dessus pour définir/modifier la position de ce site.
            </p>

            <div className="form-grid">
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

            <div className="modal-actions" style={{ justifyContent: "flex-start", marginTop: "8px" }}>
              <button className="btn-primary" onClick={enregistrer} disabled={enregistrement || brouillon.latitude == null}>
                {enregistrement ? "Enregistrement..." : "Enregistrer la position"}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default CartographyPage;