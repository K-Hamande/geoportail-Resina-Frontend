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
      // Un SEUL appel supplementaire (en plus de la liste admin des sites) :
      // /sites/map contient deja le statut ANPTIC ET le statut LAN de
      // chaque site, calcules en une seule passe cote serveur. Plus
      // besoin de refaire 2 appels par site en anomalie (avant : jusqu'a
      // 1500+ requetes simultanees sur un reseau de cette taille -> le
      // navigateur echouait avec "Failed to fetch").
      const [adminSites, mapSites] = await Promise.all([
        adminGet("/backoffice/api/v1/sites", getAuthHeader()),
        apiGet("/api/v1/sites/map"),
      ]);

      const mapBySiteId = {};
      mapSites.forEach((s) => { mapBySiteId[s.siteId] = s; });

      const merged = adminSites.map((site) => {
        const infosCarte = site.actif ? mapBySiteId[site.siteId] : null;
        return {
          ...site,
          statutGlobal: infosCarte ? infosCarte.statutGlobal : null,
          statutAnptic: infosCarte ? infosCarte.statutAnptic : null,
          statutLan: infosCarte ? infosCarte.statutLan : null,
        };
      });
      setSites(merged);

      const enAnomalie = merged.filter((s) => s.statutGlobal === "WARN" || s.statutGlobal === "KO");
      setAttentionDetail(enAnomalie);
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
            <div className="kpi-sub">{attentionDetail.filter((s) => s.statutGlobal === "KO").slice(0, 5).map((s) => s.ville).join(", ") || "—"}</div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <h2>Sites nécessitant une attention {attentionDetail.length > 0 ? `(${attentionDetail.length})` : ""}</h2>
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
                  {/* <th>Actions</th> */}
                </tr>
              </thead>
              <tbody>
                {/* Sur un reseau de cette taille, la liste complete peut etre
                    tres longue (des centaines de sites) - on n'affiche que
                    les 50 premiers dans le tableau, le compteur du titre
                    donne le total reel. */}
                {attentionDetail.slice(0, 50).map((site) => (
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
                    {/* <td>
                      <Link to="/backoffice/sites" className="btn btn-info" style={{ color: "white" }} >Voir →</Link>
                    </td> */}
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