import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet } from "../shared/apiClient";
import { getStatusLabel } from "../shared/statusStyles";
import DecideurLayout from "./DecideurLayout";

function classFor(status) {
  if (status === "KO") return "ko";
  if (status === "WARN") return "warn";
  return "ok";
}

function AlertesPage() {
  const [sites, setSites] = useState([]);
  const [erreur, setErreur] = useState(null);
  const [permissionDemandee, setPermissionDemandee] = useState(false);

  useEffect(() => {
    apiGet("/api/v1/sites/map").then(setSites).catch((err) => setErreur(err.message));
  }, []);

  const alertes = sites.filter((site) => site.statutGlobal !== "OK");

  function activerAlertes() {
    const tokenSimule = "web-" + Math.random().toString(36).substring(2, 15);
    Promise.all(
      alertes.map((site) =>
        fetch(`/api/v1/site/${site.siteId}/notifications/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Resina-Site-Token": "dev-token" },
          body: JSON.stringify({ profil: "Décideur (test navigateur)", plateforme: "WEB", token: tokenSimule }),
        })
      )
    )
      .then(() => setPermissionDemandee(true))
      .catch((err) => setErreur(err.message));
  }

  return (
    <DecideurLayout>
      {erreur && <p style={{ color: "var(--color-ko)" }}>Erreur : {erreur}</p>}

      {!permissionDemandee && (
        <div className="alert-banner">
          <p style={{ fontWeight: 700 }}>Activer les alertes en temps réel</p>
          <p>Recevez une notification immédiate en cas de panne sur vos sites RESINA.</p>
          <button className="btn-primary" onClick={activerAlertes}>
            Activer
          </button>
        </div>
      )}

      <div className="floors-title">Alertes récentes ({alertes.length})</div>

      {alertes.length === 0 && <p>Aucune alerte active — tous les sites sont opérationnels.</p>}

      {alertes.map((site) => (
        <div key={site.siteId} className={`floor-row ${classFor(site.statutGlobal)}`} style={{ marginBottom: "12px" }}>
          <span className={`floor-dot ${classFor(site.statutGlobal)}`}></span>
          <div>
            <div className="floor-name">
              {site.nom} — {site.ville}
            </div>
            <div className="floor-detail">Statut : {getStatusLabel(site.statutGlobal)}</div>
            <Link to={`/?site=${site.siteId}`}>Voir le détail →</Link>
          </div>
        </div>
      ))}
    </DecideurLayout>
  );
}

export default AlertesPage;