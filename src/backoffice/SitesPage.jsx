import { useEffect, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { useAuth } from "../shared/AuthContext";
import { adminGet, adminPost } from "../shared/backofficeApiClient";

const TAILLE_PAGE = 20;

function SitesPage() {
  const { auth, setReduit, reduit } = useOutletContext();
  const { getAuthHeader } = useAuth();
  const [sites, setSites] = useState([]);
  const [filtreNom, setFiltreNom] = useState("");
  const [pageCourante, setPageCourante] = useState(1);
  const [erreur, setErreur] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [derniereMaj, setDerniereMaj] = useState(new Date());

  function charger() {
    setChargement(true);
    adminGet("/backoffice/api/v1/sites", getAuthHeader())
      .then((data) => {
        setSites(data);
        setDerniereMaj(new Date());
      })
      .catch((err) => setErreur(err.message))
      .finally(() => setChargement(false));
  }

  useEffect(() => {
    charger();
  }, []);

  // Retour a la page 1 quand la recherche change (sinon on peut se
  // retrouver sur une page vide si les resultats filtrés sont peu nombreux)
  useEffect(() => {
    setPageCourante(1);
  }, [filtreNom]);

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

  const totalPages = Math.max(1, Math.ceil(sitesFiltres.length / TAILLE_PAGE));
  const pageActuelle = Math.min(pageCourante, totalPages);
  const debut = (pageActuelle - 1) * TAILLE_PAGE;
  const fin = debut + TAILLE_PAGE;
  const sitesPage = sitesFiltres.slice(debut, fin);

  const nomAdmin = (auth?.username || "admin").split(".")[0].toUpperCase();
  const initiales = nomAdmin.substring(0, 2);
  const heureMaj = derniereMaj.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  // Fabrique la liste des numeros de page a afficher, avec des "..." pour
  // les grands sauts, style : 1 ... 4 5 [6] 7 8 ... 82
  function numerosPagesAffiches() {
    const pages = [];
    const rayon = 2; // combien de pages on montre de chaque cote de la page courante
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= pageActuelle - rayon && i <= pageActuelle + rayon)) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== "...") {
        pages.push("...");
      }
    }
    return pages;
  }

  return (
    <>
      <div className="dashboard-topbar">
        <button className="topbar-collapse-btn" onClick={() => setReduit(!reduit)} aria-label="Basculer la barre latérale">☰</button>
        <div className="topbar-titles">
          <h1 className="topbar-title-welcome">Gestion des sites</h1>
          <p className="topbar-subtitle">{sites.length} sites configurés sur le réseau RESINA</p>
        </div>
        <div className="topbar-actions">
          <div className="topbar-live-badge-compact">
            <span className="live-dot"></span>
            <div>
              <div className="topbar-live-label">EN DIRECT</div>
              <div className="topbar-live-sub">Données actualisées à {heureMaj}</div>
            </div>
          </div>
          <button className="topbar-refresh" onClick={charger}>⟳ Actualiser</button>
          <div className="topbar-user">
            <div className="topbar-user-avatar">{initiales}</div>
            <div className="topbar-user-info">
              <div className="topbar-user-name">Admin {nomAdmin}</div>
              <div className="topbar-user-role">Super Administrateur</div>
            </div>
          </div>
        </div>
      </div>

      <div className="backoffice-content dashboard-content">
        {erreur && <p style={{ color: "var(--bo-ko)" }}>Erreur : {erreur}</p>}

        <div className="panel attention-panel">
          <div className="panel-header">
            <h2>🏢 Sites configurés <span className="attention-count" style={{ background: "var(--bo-primary)" }}>{sitesFiltres.length}</span></h2>
            <div className="panel-header-actions">
              <input
                className="attention-search"
                placeholder="Rechercher un site…"
                value={filtreNom}
                onChange={(e) => setFiltreNom(e.target.value)}
              />
              <Link to="/backoffice/sites/new" className="topbar-refresh" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
                + Nouveau site
              </Link>
            </div>
          </div>

          {chargement && <p>Chargement...</p>}

          {!chargement && sitesPage.length > 0 && (
            <>
              <table className="admin-table attention-table">
                <thead>
                  <tr>
                    <th>SITE</th>
                    <th>VILLE</th>
                    <th>NŒUD NETXMS</th>
                    <th>ÉQUIPEMENTS</th>
                    <th>STATUT</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {sitesPage.map((site) => (
                    <tr key={site.siteId}>
                      <td><div className="site-name-cell">🏢 {site.nom}</div></td>
                      <td>{site.ville}</td>
                      <td className="alerte-cell">{site.netxmsNodeId ?? "—"}</td>
                      <td>{site.nombreEquipements ?? 0}</td>
                      <td>
                        <span className={`status-pill ${site.actif ? "pill-ok" : "pill-ko"}`}>
                          ● {site.actif ? "Actif" : "Inactif"}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <Link to={`/backoffice/sites/${site.siteId}/edit`} className="btn-voir">✏️ Modifier</Link>
                          <button className="btn-voir" onClick={() => toggleActive(site)}>
                            {site.actif ? "⏸ Désactiver" : "▶ Activer"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="pagination-bar">
                <div className="pagination-info">
                  Affichage de <strong>{debut + 1}</strong> à <strong>{Math.min(fin, sitesFiltres.length)}</strong> sur <strong>{sitesFiltres.length}</strong> site(s)
                </div>
                <div className="pagination-controls">
                  <button
                    className="pagination-btn"
                    onClick={() => setPageCourante(pageActuelle - 1)}
                    disabled={pageActuelle === 1}
                  >
                    ← Précédent
                  </button>
                  {numerosPagesAffiches().map((n, idx) =>
                    n === "..." ? (
                      <span key={`ellipsis-${idx}`} className="pagination-ellipsis">…</span>
                    ) : (
                      <button
                        key={n}
                        className={`pagination-btn ${n === pageActuelle ? "pagination-btn-active" : ""}`}
                        onClick={() => setPageCourante(n)}
                      >
                        {n}
                      </button>
                    )
                  )}
                  <button
                    className="pagination-btn"
                    onClick={() => setPageCourante(pageActuelle + 1)}
                    disabled={pageActuelle === totalPages}
                  >
                    Suivant →
                  </button>
                </div>
              </div>
            </>
          )}

          {!chargement && sitesFiltres.length === 0 && (
            <p>Aucun site trouvé pour cette recherche.</p>
          )}
        </div>
      </div>
    </>
  );
}

export default SitesPage;