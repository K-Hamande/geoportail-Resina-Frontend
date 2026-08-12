import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet } from "../shared/apiClient";
import { getStatusColor } from "../shared/statusStyles";
import { formaterTempsRelatif } from "../shared/timeFormat";
import DecideurLayout from "./DecideurLayout";

const CLE_LUS = "resina-alertes-lues";
const CLE_BANNIERE_MASQUEE = "resina-banniere-masquee";

function chargerIdsLus() {
  try {
    return new Set(JSON.parse(localStorage.getItem(CLE_LUS) ?? "[]"));
  } catch {
    return new Set();
  }
}

function badgeClass(status) {
  if (status === "KO") return "badge-ko";
  if (status === "WARN") return "badge-warn";
  return "badge-ok";
}

function badgeLabel(status) {
  if (status === "KO") return "✕ Indisponible";
  if (status === "WARN") return "⚠ Alerte";
  return "✓ Actif";
}

function AlertesPage() {
  const [incidents, setIncidents] = useState([]);
  const [erreur, setErreur] = useState(null);
  const [idsLus, setIdsLus] = useState(chargerIdsLus);
  const [banniereVisible, setBanniereVisible] = useState(
    sessionStorage.getItem(CLE_BANNIERE_MASQUEE) !== "true"
  );

  function charger() {
    apiGet("/api/v1/incidents").then(setIncidents).catch((err) => setErreur(err.message));
  }

  useEffect(() => {
    charger();
    const intervalle = setInterval(charger, 30000);
    return () => clearInterval(intervalle);
  }, []);

  function marquerCommeLu(id) {
    const nouveaux = new Set(idsLus);
    nouveaux.add(id);
    setIdsLus(nouveaux);
    localStorage.setItem(CLE_LUS, JSON.stringify([...nouveaux]));
  }

  function toutMarquerLu() {
    const tousLesIds = new Set(incidents.map((i) => i.id));
    setIdsLus(tousLesIds);
    localStorage.setItem(CLE_LUS, JSON.stringify([...tousLesIds]));
  }

  function activerAlertes() {
    const tokenSimule = "web-" + Math.random().toString(36).substring(2, 15);
    const sitesUniques = [...new Map(incidents.map((i) => [i.siteId, i])).values()];

    Promise.all(
      sitesUniques.map((site) =>
        fetch(`/api/v1/site/${site.siteId}/notifications/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Resina-Site-Token": "dev-token" },
          body: JSON.stringify({ profil: "Décideur (test navigateur)", plateforme: "WEB", token: tokenSimule }),
        })
      )
    )
      .then(() => setBanniereVisible(false))
      .catch((err) => setErreur(err.message));
  }

  function plusTard() {
    sessionStorage.setItem(CLE_BANNIERE_MASQUEE, "true");
    setBanniereVisible(false);
  }

  const nonLus = incidents.filter((i) => !idsLus.has(i.id)).length;

  return (
    <DecideurLayout>
      {erreur && <p style={{ color: "var(--color-ko)" }}>Erreur : {erreur}</p>}

      {banniereVisible && (
        <div className="alert-banner">
          <p style={{ fontWeight: 700 }}>Activer les alertes en temps réel</p>
          <p>Recevez une notification immédiate en cas de panne sur vos sites RESINA, même lorsque l'application est fermée.</p>
          <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
            <button className="btn-primary" onClick={activerAlertes}>Activer</button>
            <button className="btn-secondary" onClick={plusTard}>Plus tard</button>
          </div>
        </div>
      )}

      <div className="alertes-header-row">
        <div className="floors-title" style={{ marginBottom: 0 }}>
          Alertes récentes ({nonLus})
        </div>
        {incidents.length > 0 && (
          <button className="btn-link" onClick={toutMarquerLu}>Tout marquer lu</button>
        )}
      </div>

      {incidents.length === 0 && <p>Aucune alerte pour le moment.</p>}

      {incidents.map((incident) => {
        const couleur = getStatusColor(incident.nouveauStatut);
        const lu = idsLus.has(incident.id);

        return (
          <div
            key={incident.id}
            className={`status-card alert-card ${lu ? "alert-card-lu" : ""}`}
            style={{ "--card-color": couleur }}
            onClick={() => marquerCommeLu(incident.id)}
          >
            <div className="card-top">
              <div className="card-icon" style={{ position: "relative" }}>
                {incident.type === "ANPTIC" ? "🌐" : "🏢"}
                {!lu && <span className="unread-dot"></span>}
              </div>
              <div className="card-titles">
                <div className="card-title">{incident.siteNom}</div>
                <div className="card-subtitle">{incident.ville}</div>
              </div>
              <span className={`status-badge ${badgeClass(incident.nouveauStatut)}`}>
                {badgeLabel(incident.nouveauStatut)}
              </span>
            </div>

            <p className="alert-message">{incident.message}</p>

            <div className="alert-meta">
              <span className="alert-time">{formaterTempsRelatif(incident.survenuLe)}</span>
              <Link to={`/?site=${incident.siteId}`} className="alert-link" onClick={(e) => e.stopPropagation()}>
                Voir le détail →
              </Link>
            </div>
          </div>
        );
      })}
    </DecideurLayout>
  );
}

export default AlertesPage;