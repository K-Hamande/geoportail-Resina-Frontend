import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../shared/AuthContext";
import { adminGet, adminPost } from "../shared/backofficeApiClient";
import Topbar from "./Topbar";

function SitesPage() {
  const { getAuthHeader } = useAuth();
  const [sites, setSites] = useState([]);
  const [filtreNom, setFiltreNom] = useState("");
  const [erreur, setErreur] = useState(null);
  const [chargement, setChargement] = useState(true);

  function charger() {
    setChargement(true);
    adminGet("/backoffice/api/v1/sites", getAuthHeader())
      .then(setSites)
      .catch((err) => setErreur(err.message))
      .finally(() => setChargement(false));
  }

  useEffect(() => {
    charger();
  }, []);

  async function toggleActive(site) {
    const action = site.actif ? "deactivate" : "activate";
    try {
      await adminPost(`/backoffice/api/v1/sites/${site.siteId}/${action}`, getAuthHeader());
      charger();
    } catch (err) {
      setErreur(err.message);
    }
  }

  const sitesFiltres = sites.filter((site) =>
    site.nom.toLowerCase().includes(filtreNom.toLowerCase())
  );

  if (chargement) {
    return <p style={{ padding: "32px" }}>Chargement...</p>;
  }

  return (
    <>
      <Topbar title="Gestion des sites" subtitle={`${sites.length} sites configurés`} onRefresh={charger} />

      <div className="backoffice-content">
        {erreur && <p style={{ color: "var(--color-ko)" }}>Erreur : {erreur}</p>}

        <div className="panel">
          <div className="panel-header">
            <h2>Sites configurés — {sitesFiltres.length} sites</h2>
            <div className="panel-header-actions">
              <input
                className="filter-input"
                placeholder="Filtrer par nom..."
                value={filtreNom}
                onChange={(e) => setFiltreNom(e.target.value)}
              />
              <Link to="/backoffice/sites/new" className="btn-primary" style={{ textDecoration: "none", display: "inline-block" }}>
                + Nouveau site
              </Link>
            </div>
          </div>

          <table className="admin-table">
            <thead>
              <tr>
                <th>Nom du site</th>
                <th>Ville</th>
                <th>Nœud NetXMS</th>
                <th>Équipements</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sitesFiltres.map((site) => (
                <tr key={site.siteId}>
                  <td className="site-name-cell">{site.nom}</td>
                  <td>{site.ville}</td>
                  <td>{site.netxmsNodeId}</td>
                  <td>{site.nombreEquipements} éqpt.</td>
                  <td>
                    <span className={`status-badge ${site.actif ? "badge-ok" : "badge-unknown"}`}>
                      {site.actif ? "Actif" : "Désactivé"}
                    </span>
                  </td>
                  <td className="table-actions">
                    <Link to={`/backoffice/sites/${site.siteId}/edit`} className="btn-outline" style={{ textDecoration: "none" }}>
                      Modifier
                    </Link>
                    <button className="btn-link" onClick={() => toggleActive(site)}>
                      {site.actif ? "Désactiver" : "Activer"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {sitesFiltres.length === 0 && <p>Aucun site ne correspond à ce filtre.</p>}
        </div>
      </div>
    </>
  );
}

export default SitesPage;