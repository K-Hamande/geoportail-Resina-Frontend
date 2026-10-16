import { useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { buildColoredMarkerIcon } from "../shared/mapMarkers";
import { getStatusLabel, getStatusIcon } from "../shared/statusStyles";
import { ChevronRight } from "lucide-react";
import { useSiteSelection } from "../shared/SiteSelectionContext";
import DecideurLayout from "./DecideurLayout";

const CENTRE_BURKINA_FASO = [12.2, -1.5];
const ZOOM_SITE_SELECTIONNE = 14;

function badgeClassFor(statut) {
  if (statut === "KO") return "badge-ko";
  if (statut === "WARN") return "badge-warn";
  if (statut === "UNKNOWN") return "badge-unknown";
  return "badge-ok";
}

function CartePage() {
  // mapSites vient du SiteSelectionProvider (partage avec DecideurLayout,
  // une seule requete/minute pour toute la session) : cette page n'a plus
  // besoin de son propre fetch + intervalle de /api/v1/sites/map.
  const { mapSites: sites, definirSiteSansNaviguer } = useSiteSelection();
  const [recherche, setRecherche] = useState("");
  const mapRef = useRef(null);

  // Choisir un site ici (marqueur ou liste laterale) filtre/centre la
  // carte elle-meme au lieu de rediriger vers "Mon site" (contrairement
  // au selecteur du header) : on met a jour le site selectionne partage
  // et on fait voler la carte vers ses coordonnees.
  function voirSite(site) {
    definirSiteSansNaviguer(site.siteId);
    mapRef.current?.flyTo([site.latitude, site.longitude], ZOOM_SITE_SELECTIONNE);
  }

  // Remplace le lien "Leaflet" par defaut du controle d'attribution par
  // la marque ANPTIC, en conservant le texte de copyright OpenStreetMap
  // (obligatoire du point de vue licence) deja passe via TileLayer.
  function handleMapRef(map) {
    if (!map || mapRef.current === map) return;
    mapRef.current = map;
    map.attributionControl.setPrefix("ANPTIC");
  }

  const sitesAvecCoordonnees = useMemo(
    () => sites.filter((site) => site.latitude != null && site.longitude != null),
    [sites]
  );

  const sitesFiltres = useMemo(() => {
    const texte = recherche.trim().toLowerCase();
    if (!texte) return sitesAvecCoordonnees;
    return sitesAvecCoordonnees.filter(
      (site) =>
        site.nom.toLowerCase().includes(texte) || site.ville.toLowerCase().includes(texte)
    );
  }, [sitesAvecCoordonnees, recherche]);

  return (
    <DecideurLayout plainePage>
      {/* Sur mobile/tablette : uniquement la carte, pleine largeur (comportement
          d'origine inchangé). A partir de 1024px, .map-layout devient un
          2-colonnes carte + liste (voir index.css). */}
      <div className="map-layout">
        <MapContainer ref={handleMapRef} center={CENTRE_BURKINA_FASO} zoom={7} className="map-container">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {sitesAvecCoordonnees.map((site) => {
            const StatutIcone = getStatusIcon(site.statutGlobal);
            return (
              <Marker
                key={site.siteId}
                position={[site.latitude, site.longitude]}
                icon={buildColoredMarkerIcon(site.statutGlobal)}
              >
                <Popup>
                  <strong>{site.nom}</strong>
                  <br />
                  {site.ville}
                  <br />
                  Statut : <StatutIcone size={12} strokeWidth={3} style={{ verticalAlign: "-1px" }} /> {getStatusLabel(site.statutGlobal)}
                  <br />
                  <button type="button" className="map-popup-link" onClick={() => voirSite(site)}>
                    Voir ce site <ChevronRight size={13} />
                  </button>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {/* Visible uniquement a partir de 1024px (voir .map-sidebar en CSS) */}
        <div className="map-sidebar">
          <div className="form-field" style={{ marginBottom: "12px" }}>
            <input
              type="text"
              placeholder="Rechercher un site…"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
            />
          </div>

          <div className="map-sidebar-count">
            {sitesFiltres.length} site{sitesFiltres.length > 1 ? "s" : ""}
          </div>

          <div className="map-sidebar-list">
            {sitesFiltres.map((site) => {
              const StatutIcone = getStatusIcon(site.statutGlobal);
              return (
                <button
                  type="button"
                  key={site.siteId}
                  onClick={() => voirSite(site)}
                  className="map-site-item"
                >
                  <div>
                    <div className="map-site-item-name">{site.nom}</div>
                    <div className="map-site-item-ville">{site.ville}</div>
                  </div>
                  <span className={`status-badge ${badgeClassFor(site.statutGlobal)}`}>
                    <StatutIcone size={12} strokeWidth={3} /> {getStatusLabel(site.statutGlobal)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </DecideurLayout>
  );
}

export default CartePage;