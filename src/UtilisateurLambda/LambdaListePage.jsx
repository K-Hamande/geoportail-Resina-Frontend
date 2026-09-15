import { useEffect, useState } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import L from "leaflet";
import { LandPlot, Building2, Cable } from "lucide-react";
import { apiGet } from "../shared/apiClient";
import ErrorBanner from "../shared/ErrorBanner";
import LambdaLayout from "./LambdaLayout";

// Page d'accueil publique de la partie lambda : contenu de la maquette
// "Page public_Geoportail.html" (couverture RESINA par commune - carte +
// statistiques nationales), mais habille avec l'identite visuelle de
// l'appli (memes classes .lambda-*, memes couleurs que le reste du
// dashboard) plutot que le style propre de la maquette. L'ancienne liste
// individuelle des 352 sites (OK/KO) a ete retiree.

const COULEUR_PAR_STATUT = {
  CONNECTEE: "#0D9B5A",
  PARTIELLE: "#C97C0A",
  NON_CONNECTEE: "#C9CDD3",
};
const COULEUR_SITE = "#0A3D7A";
const COULEUR_FIBRE = "#A2366F";

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

const CENTRE_BURKINA_FASO = [12.2, -1.5];
const RAYON_ANNEAU = 54;
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

  return (
    <LambdaLayout>
      <section className="lambda-hero-banner lambda-fade-up">
        <div className="lambda-hero-ring-wrap">
          <svg viewBox="0 0 140 140" width="128" height="128" className="lambda-hero-ring-svg">
            <circle cx="70" cy="70" r={RAYON_ANNEAU} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="12" />
            <circle
              cx="70" cy="70" r={RAYON_ANNEAU} fill="none" stroke="#3DDC97" strokeWidth="12"
              strokeDasharray={`${arcAnneau} ${PERIMETRE_ANNEAU}`} strokeLinecap="round"
              transform="rotate(-90 70 70)"
            />
          </svg>
          <div className="lambda-hero-ring-center">
            <div className="lambda-hero-ring-value">{Math.round(pctAnime)}%</div>
            <div className="lambda-hero-ring-label">couvert</div>
          </div>
        </div>
        <div className="lambda-hero-banner-text">
          <span className="lambda-hero-kicker">Réseau Informatique National de l'Administration</span>
          <h1>La couverture nationale du RESINA, commune par commune</h1>
          <p>
            Ce portail présente l'état d'avancement du raccordement des communes, des sites administratifs
            et des liaisons en fibre optique du RESINA sur l'ensemble du territoire.
          </p>
        </div>
      </section>

      <ErrorBanner message={erreur} onRetry={charger} />

      <div className="lambda-map-card lambda-fade-up">
        <div className="lambda-map-card-head">
          <h2 className="lambda-map-card-title">Carte de couverture nationale</h2>
          <span className="lambda-live-badge"><span className="live-dot"></span> Données en direct</span>
        </div>
        {chargement && <p style={{ textAlign: "center", padding: "40px" }}>Chargement de la carte...</p>}
        {!chargement && geojson && (
          <MapContainer center={CENTRE_BURKINA_FASO} zoom={7} className="lambda-map">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <GeoJSON data={geojson} style={styleCommune} onEachFeature={surChaqueCommune} />
            {liaisonsGeojson && (
              <GeoJSON data={liaisonsGeojson} style={styleLiaison} onEachFeature={surChaqueLiaison} />
            )}
            {sitesGeojson && (
              <GeoJSON data={sitesGeojson} pointToLayer={pointVersMarqueurSite} onEachFeature={surChaqueSite} />
            )}
          </MapContainer>
        )}
        <div className="lambda-map-legend">
          <span className="lambda-map-legend-item">
            <span className="lambda-map-legend-dot" style={{ background: COULEUR_PAR_STATUT.CONNECTEE }}></span>
            Commune connectée
          </span>
          <span className="lambda-map-legend-item">
            <span className="lambda-map-legend-dot" style={{ background: COULEUR_PAR_STATUT.PARTIELLE }}></span>
            Traversée par une liaison
          </span>
          <span className="lambda-map-legend-item">
            <span className="lambda-map-legend-dot" style={{ background: COULEUR_PAR_STATUT.NON_CONNECTEE }}></span>
            Non desservie
          </span>
          <span className="lambda-map-legend-item">
            <span className="lambda-map-legend-dot" style={{ background: COULEUR_SITE }}></span>
            Site administratif connecté
          </span>
          <span className="lambda-map-legend-item">
            <span className="lambda-map-legend-line" style={{ background: COULEUR_FIBRE }}></span>
            Fibre optique
          </span>
        </div>
      </div>

      {stats && (
        <div className="lambda-stats">
          <div className="lambda-stat-card lambda-stat-ok lambda-fade-up lambda-delay-1">
            <span className="lambda-stat-icon"><LandPlot size={19} color="#0D9B5A" /></span>
            <div>
              <div className="lambda-stat-value">{Math.round(communesAnime)}</div>
              <div className="lambda-stat-label">communes connectées au RESINA</div>
              <div className="lambda-stat-note">sur {stats.totalCommunes} communes que compte le territoire national</div>
            </div>
          </div>
          <div className="lambda-stat-card lambda-fade-up lambda-delay-2">
            <span className="lambda-stat-icon"><Building2 size={19} color="#0A3D7A" /></span>
            <div>
              <div className="lambda-stat-value">{Math.round(sitesAnime).toLocaleString("fr-FR")}</div>
              <div className="lambda-stat-label">sites administratifs raccordés</div>
              <div className="lambda-stat-note">ministères, préfectures, mairies, services déconcentrés</div>
            </div>
          </div>
          <div className="lambda-stat-card lambda-stat-warn lambda-fade-up lambda-delay-3">
            <span className="lambda-stat-icon"><Cable size={19} color="#C97C0A" /></span>
            <div>
              <div className="lambda-stat-value">{Math.round(kmAnime).toLocaleString("fr-FR")} km</div>
              <div className="lambda-stat-label">de liaisons en fibre optique</div>
              <div className="lambda-stat-note">dorsale nationale et bretelles régionales</div>
            </div>
          </div>
        </div>
      )}
    </LambdaLayout>
  );
}

export default LambdaListePage;
