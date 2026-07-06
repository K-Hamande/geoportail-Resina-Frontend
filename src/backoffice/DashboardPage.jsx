import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../shared/AuthContext";
import { adminGet } from "../shared/backofficeApiClient";
import { apiGet } from "../shared/apiClient";
import { getStatusLabel } from "../shared/statusStyles";
import Topbar from "./Topbar";

function badgeClass(status) {
  if (status === "KO") return "badge-ko";
  if (status === "WARN") return "badge-warn";
  if (status === "OK") return "badge-ok";
  return "badge-unknown";
}

function DashboardPage() {
  const { getAuthHeader } = useAuth();
  const [sites, setSites] = useState([]);
  const [attentionDetail, setAttentionDetail] = useState([]);
  const [erreur, setErreur] = useState(null);
  const [chargement, setChargement] = useState(true);

  async function charger() {
    setChargement(true);
    try {
      const [adminSites, mapSites] = await Promise.all([
        adminGet("/backoffice/api/v1/sites", getAuthHeader()),
        apiGet("/api/v1/sites/map"),
      ]);

      const statusBySiteId = {};
      mapSites.forEach((s) => { statusBySiteId[s.siteId] = s.statutGlobal; });

      const merged = adminSites.map((site) => ({
        ...site,
        statutGlobal: site.actif ? statusBySiteId[site.siteId] ?? "UNKNOWN" : null,
      }));
      setSites(merged);

      // Pour les sites en anomalie UNIQUEMENT, on recupere le detail
      // ANPTIC + LAN separement (deux appels par site en anomalie -
      // acceptable car ce sous-ensemble reste petit).
      const enAnomalie = merged.filter((s) => s.statutGlobal === "WARN" || s.statutGlobal === "KO");
      const details = await Promise.all(
        enAnomalie.map(async (site) => {
          const [anptic, lan] = await Promise.all([
            apiGet(`/api/v1/site/${site.siteId}/anptic`),
            apiGet(`/api/v1/site/${site.siteId}/lan`),
          ]);
          return { ...site, statutAnptic: anptic.status, statutLan: lan.globalStatus };
        })
      );
      setAttentionDetail(details);
    } catch (err) {
      setErreur(err.message);
    } finally {
      setChargement(false);
    }
  }

  useEffect(() => {
    charger();
  }, []);

  const sitesActifs = sites.filter((s) => s.actif).length;
  const disponibles = sites.filter((s) => s.statutGlobal === "OK").length;
  const degrades = sites.filter((s) => s.statutGlobal === "WARN").length;
  const horsService = sites.filter((s) => s.statutGlobal === "KO").length;

  if (chargement) {
    return <p style={{ padding: "32px" }}>Chargement...</p>;
  }

  return (
    <>
      <Topbar title="Tableau de bord" subtitle={`Vue d'ensemble des sites et de l'état de la plateforme — ${sites.length} sites configurés`} onRefresh={charger} />

      <div className="backoffice-content">
        {erreur && <p style={{ color: "var(--color-ko)" }}>Erreur : {erreur}</p>}

        <div className="kpi-grid">
          <div className="kpi-card">
            <div className="kpi-label">Sites actifs</div>
            <div className="kpi-value">{sitesActifs}</div>
            <div className="kpi-sub">sur {sites.length} sites configurés</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Disponibles</div>
            <div className="kpi-value kpi-ok-text">{disponibles}</div>
            <div className="kpi-sub">connexion ANPTIC active</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Dégradés</div>
            <div className="kpi-value kpi-warn-text">{degrades}</div>
            <div className="kpi-sub">débit inférieur au seuil</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Hors service</div>
            <div className="kpi-value kpi-ko-text">{horsService}</div>
            <div className="kpi-sub">{attentionDetail.filter((s) => s.statutGlobal === "KO").map((s) => s.ville).join(", ") || "—"}</div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <h2>Sites nécessitant une attention</h2>
            <div className="panel-header-actions">
              <Link to="/backoffice/sites" className="btn-primary" style={{ textDecoration: "none", display: "inline-block" }}>
                + Ajouter un site
              </Link>
            </div>
          </div>

          {attentionDetail.length === 0 && <p>Aucun site en anomalie actuellement.</p>}

          {attentionDetail.length > 0 && (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Site</th>
                  <th>Statut ANPTIC</th>
                  <th>Statut LAN</th>
                  <th>Dernière MAJ</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {attentionDetail.map((site) => (
                  <tr key={site.siteId}>
                    <td>
                      <div className="site-name-cell">{site.nom}</div>
                      <div className="site-location-cell">{site.ville}</div>
                    </td>
                    <td>
                      <span className={`status-badge ${badgeClass(site.statutAnptic)}`}>{getStatusLabel(site.statutAnptic)}</span>
                    </td>
                    <td>
                      <span className={`status-badge ${badgeClass(site.statutLan)}`}>{getStatusLabel(site.statutLan)}</span>
                    </td>
                    <td>à l'instant</td>
                    <td>
                      <Link to="/backoffice/sites" className="btn-link">Voir →</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}

export default DashboardPage;