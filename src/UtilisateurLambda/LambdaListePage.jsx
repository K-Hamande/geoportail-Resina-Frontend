import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, GeoJSON, ZoomControl } from "react-leaflet";
import L from "leaflet";
import { Menu, UserRound, ChevronDown, LogOut, Building2, Landmark, Cable } from "lucide-react";
import { apiGet } from "../shared/apiClient";
import ErrorBanner from "../shared/ErrorBanner";
import { estConnecteDecideur, getDecideurAuth, clearDecideurAuth } from "../shared/decideurAuth";

// Page d'accueil publique de la partie lambda : reproduction fidele de
// la maquette "page user lambda.jpeg" (sidebar avec anneau de couverture
// + 3 statistiques empilees, carte plein ecran avec legende flottante),
// habillee avec l'identite visuelle de l'appli (memes classes .lambda-*,
// memes couleurs navy/vert que le reste du dashboard). Page auto-portee
// (n'utilise plus LambdaLayout) pour pouvoir piloter le bouton menu
// mobile qui replie/deplie la colonne de statistiques.

const COULEUR_PAR_STATUT = {
  CONNECTEE: "#0D9B5A",
  PARTIELLE: "#C97C0A",
  NON_CONNECTEE: "#C9CDD3",
};
const COULEUR_SITE = "#0A3D7A";
const COULEUR_FIBRE = "#5B6478";

function styleCommune(feature) {
  const couleur = COULEUR_PAR_STATUT[feature.properties.statut] ?? COULEUR_PAR_STATUT.NON_CONNECTEE;
  return {
    fillColor: couleur,
    fillOpacity: feature.properties.statut === "NON_CONNECTEE" ? 0.25 : 0.55,
    color: couleur,
    weight: 1,
  };
}

function surChaqueCommune(feature, layer) {
  const { nom, statut, nombreSitesConnectes } = feature.properties;
  const libelleStatut = statut === "CONNECTEE"
    ? `${nombreSitesConnectes} site${nombreSitesConnectes > 1 ? "s" : ""} raccordé${nombreSitesConnectes > 1 ? "s" : ""}`
    : statut === "PARTIELLE"
      ? "Traversée par une liaison, aucun site raccordé"
      : "Non desservie";
  layer.bindPopup(`<strong>${nom}</strong><br/>${libelleStatut}`);
  layer.on({
    mouseover: (e) => e.target.setStyle({ weight: 2.5, fillOpacity: 0.75 }),
    mouseout: (e) => e.target.setStyle(styleCommune(feature)),
  });
}

function pointVersMarqueurSite(feature, latlng) {
  return L.circleMarker(latlng, {
    radius: 4,
    fillColor: COULEUR_SITE,
    fillOpacity: 0.9,
    color: "#fff",
    weight: 1,
  });
}

function surChaqueSite(feature, layer) {
  const { nom, ministere } = feature.properties;
  layer.bindPopup(`<strong>${nom}</strong>${ministere ? `<br/>${ministere}` : ""}`);
}

function styleLiaison() {
  return { color: COULEUR_FIBRE, weight: 2, opacity: 0.85 };
}

function surChaqueLiaison(feature, layer) {
  const { nom } = feature.properties;
  if (nom) layer.bindPopup(`<strong>${nom}</strong>`);
}

const RAYON_ANNEAU = 58;
const PERIMETRE_ANNEAU = 2 * Math.PI * RAYON_ANNEAU;

// Anime un nombre de 0 jusqu'a sa valeur cible des que les donnees sont
// chargees (effet "compteur" sur les statistiques et l'anneau de
// couverture) plutot que de l'afficher d'un bloc.
function useCompteurAnime(valeurCible) {
  const [valeur, setValeur] = useState(0);

  useEffect(() => {
    if (valeurCible == null) return;
    let frame;
    const debut = performance.now();
    const duree = 1100;
    function etape(maintenant) {
      const t = Math.min(1, (maintenant - debut) / duree);
      const assoupli = 1 - Math.pow(1 - t, 3);
      setValeur(valeurCible * assoupli);
      if (t < 1) frame = requestAnimationFrame(etape);
    }
    frame = requestAnimationFrame(etape);
    return () => cancelAnimationFrame(frame);
  }, [valeurCible]);

  return valeur;
}

function LambdaListePage() {
  const [stats, setStats] = useState(null);
  const [geojson, setGeojson] = useState(null);
  const [sitesGeojson, setSitesGeojson] = useState(null);
  const [liaisonsGeojson, setLiaisonsGeojson] = useState(null);
  const [erreur, setErreur] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [sidebarOuverte, setSidebarOuverte] = useState(false);

  const navigate = useNavigate();
  const connecte = estConnecteDecideur();
  const auth = getDecideurAuth();

  function deconnecter() {
    clearDecideurAuth();
    navigate("/login");
  }

  function charger() {
    setErreur(null);
    Promise.all([
      apiGet("/api/v1/couverture/stats"),
      apiGet("/api/v1/couverture/communes/geojson"),
      apiGet("/api/v1/couverture/sites/geojson"),
      apiGet("/api/v1/couverture/liaisons/geojson"),
    ])
      .then(([statsData, geojsonData, sitesData, liaisonsData]) => {
        setStats(statsData);
        setGeojson(geojsonData);
        setSitesGeojson(sitesData);
        setLiaisonsGeojson(liaisonsData);
      })
      .catch((e) => setErreur(e.message))
      .finally(() => setChargement(false));
  }

  useEffect(() => { charger(); }, []);

  const pctConnectees = stats && stats.totalCommunes > 0
    ? Math.round((stats.communesConnectees / stats.totalCommunes) * 100)
    : 0;
  const pctAnime = useCompteurAnime(stats ? pctConnectees : null);
  const communesAnime = useCompteurAnime(stats ? stats.communesConnectees : null);
  const sitesAnime = useCompteurAnime(stats ? stats.sitesRaccordes : null);
  const kmAnime = useCompteurAnime(stats ? stats.kmLiaisons : null);
  const arcAnneau = (pctAnime / 100) * PERIMETRE_ANNEAU;

  // Cadre la carte sur l'emprise reelle des communes plutot qu'un
  // center+zoom fixe, pour que le territoire remplisse tout l'espace
  // disponible quel que soit le format de l'ecran (au lieu de flotter,
  // petit, au milieu d'une carte trop dezoomee).
  const emprise = geojson ? L.geoJSON(geojson).getBounds() : null;

  return (
    <div className="lambda-shell lambda-shell-plein">
      <header className="lambda-header">
        <div className="flag-bar"></div>
        <div className="lambda-header-inner">
          <button
            className="lambda-menu-toggle"
            onClick={() => setSidebarOuverte((v) => !v)}
            aria-label="Ouvrir le panneau de statistiques"
          >
            <Menu size={20} />
          </button>
          <div className="lambda-brand">
            <img src="/logo_anptic_ok.png" alt="ANPTIC" className="lambda-logo" />
            <div className="lambda-brand-text">
              <span className="lambda-brand-line1">GéoPortail</span>
              <span className="lambda-brand-line2">RESINA</span>
            </div>
          </div>

          {connecte ? (
            <div className="lambda-user">
              <span className="lambda-user-name">{auth?.role}</span>
              <button className="lambda-logout" onClick={deconnecter} title="Se déconnecter"><LogOut size={15} /></button>
            </div>
          ) : (
            <button className="lambda-connexion-btn" onClick={() => navigate("/login")}>
              <UserRound size={15} />
              Connexion décideur
              <ChevronDown size={14} />
            </button>
          )}
        </div>
      </header>

      <div className={`lambda-couverture-body ${sidebarOuverte ? "lambda-sidebar-ouverte" : ""}`}>
        {sidebarOuverte && (
          <div className="lambda-sidebar-fond" onClick={() => setSidebarOuverte(false)}></div>
        )}
        <aside className="lambda-sidebar">
          <div className="lambda-ring-card">
            <div className="lambda-ring-wrap">
              <svg viewBox="0 0 140 140" width="150" height="150" className="lambda-ring-svg">
                <circle cx="70" cy="70" r={RAYON_ANNEAU} fill="none" stroke="#E7ECF2" strokeWidth="13" />
                <circle
                  cx="70" cy="70" r={RAYON_ANNEAU} fill="none" stroke="#0D9B5A" strokeWidth="13"
                  strokeDasharray={`${arcAnneau} ${PERIMETRE_ANNEAU}`} strokeLinecap="round"
                  transform="rotate(-90 70 70)"
                />
              </svg>
              <div className="lambda-ring-center">
                <div className="lambda-ring-value">{Math.round(pctAnime)}%</div>
              </div>
            </div>
            <div className="lambda-ring-label">Couverture nationale</div>
          </div>

          {stats && (
            <div className="lambda-stats-dark">
              <div className="lambda-stat-dark">
                <span className="lambda-stat-dark-icon"><Building2 size={18} /></span>
                <div className="lambda-stat-dark-texte">
                  <div className="lambda-stat-dark-label">Communes connectées</div>
                  <div className="lambda-stat-dark-valeur">{Math.round(communesAnime)} <span>communes</span></div>
                  <div className="lambda-stat-dark-note">sur {stats.totalCommunes} communes</div>
                </div>
              </div>
              <div className="lambda-stat-dark">
                <span className="lambda-stat-dark-icon"><Landmark size={18} /></span>
                <div className="lambda-stat-dark-texte">
                  <div className="lambda-stat-dark-label">Sites administratifs raccordés</div>
                  <div className="lambda-stat-dark-valeur">{Math.round(sitesAnime).toLocaleString("fr-FR")} <span>sites</span></div>
                  <div className="lambda-stat-dark-note">Ministères, Préfectures, etc.</div>
                </div>
              </div>
              <div className="lambda-stat-dark">
                <span className="lambda-stat-dark-icon"><Cable size={18} /></span>
                <div className="lambda-stat-dark-texte">
                  <div className="lambda-stat-dark-label">Liaisons fibre optique</div>
                  <div className="lambda-stat-dark-valeur">{Math.round(kmAnime).toLocaleString("fr-FR")} <span>km</span></div>
                  <div className="lambda-stat-dark-note">Réseau national &amp; régional</div>
                </div>
              </div>
            </div>
          )}
        </aside>

        <div className="lambda-map-full-wrap">
          {erreur && <div className="lambda-map-erreur"><ErrorBanner message={erreur} onRetry={charger} /></div>}
          {chargement && <p style={{ textAlign: "center", padding: "40px" }}>Chargement de la carte...</p>}
          {!chargement && geojson && (
            <MapContainer
              bounds={emprise}
              boundsOptions={{ padding: [8, 8] }}
              zoomSnap={0.1}
              zoomControl={false}
              className="lambda-map-full"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <ZoomControl position="bottomright" />
              <GeoJSON data={geojson} style={styleCommune} onEachFeature={surChaqueCommune} />
              {liaisonsGeojson && (
                <GeoJSON data={liaisonsGeojson} style={styleLiaison} onEachFeature={surChaqueLiaison} />
              )}
              {sitesGeojson && (
                <GeoJSON data={sitesGeojson} pointToLayer={pointVersMarqueurSite} onEachFeature={surChaqueSite} />
              )}
            </MapContainer>
          )}

          <div className="lambda-map-legend-flottante">
            <span className="lambda-legende-item">
              <span className="lambda-legende-carre" style={{ background: COULEUR_PAR_STATUT.CONNECTEE }}></span>
              Connectée
            </span>
            <span className="lambda-legende-item">
              <span className="lambda-legende-carre" style={{ background: COULEUR_PAR_STATUT.PARTIELLE }}></span>
              En cours
            </span>
            <span className="lambda-legende-item">
              <span className="lambda-legende-ligne" style={{ background: COULEUR_FIBRE }}></span>
              Fibre
            </span>
            <span className="lambda-legende-item">
              <span className="lambda-legende-carre" style={{ background: COULEUR_PAR_STATUT.NON_CONNECTEE }}></span>
              Non Desservie
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LambdaListePage;
