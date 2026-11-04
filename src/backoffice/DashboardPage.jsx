import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation, useOutletContext } from "react-router-dom";
import {
  Menu, Sparkle, Bell, Building2, Check, TriangleAlert, Plug,
  Activity, Download, RefreshCw, Eye, Trophy, ThumbsUp, Siren, Circle,
  HelpCircle, ShieldAlert, AlertOctagon, Gauge, ChevronDown,
} from "lucide-react";
import { useAuth } from "../shared/AuthContext";
import { adminGet } from "../shared/backofficeApiClient";
import ErrorBanner from "../shared/ErrorBanner";

// Amendement "Tableau de bord et gestion des sites" : 5 categories de
// sites mutuellement exclusives, en remplacement de la notion generique
// "Sites degrades". cle = valeur de SiteGravite cote backend
// (site.graviteSite, deja calcule par SiteStatusSnapshotService a partir
// du pire code NetXMS du site). classeIcone reutilise les memes couleurs
// que le panneau "Equipements par niveau de gravite" pour rester coherent
// visuellement sur la meme page.
const CATEGORIES_GRAVITE = [
  { cle: "CRITIQUE", libelle: "Sites critiques", Icone: AlertOctagon, classeIcone: "kpi-icon-red", classeValeur: "kpi-value-red" },
  { cle: "MAJEUR", libelle: "Sites majeurs", Icone: TriangleAlert, classeIcone: "kpi-icon-majeur", classeValeur: "kpi-value-majeur" },
  { cle: "MOYEN", libelle: "Sites moyens", Icone: ShieldAlert, classeIcone: "kpi-icon-orange", classeValeur: "kpi-value-orange" },
  { cle: "NORMAL", libelle: "Sites normaux", Icone: Check, classeIcone: "kpi-icon-green", classeValeur: "kpi-value-green" },
  { cle: "INCONNU", libelle: "Sites inconnus", Icone: HelpCircle, classeIcone: "kpi-icon-grey", classeValeur: "kpi-value-grey" },
];

// Pastille de statut reutilisee pour STATUT ANPTIC / RESEAU LOCAL (LAN) -
// gere explicitement UNKNOWN (section II du compte rendu des amendements :
// un site de statut inconnu ne doit pas apparaitre comme "Normal").
function PastilleStatut({ statut }) {
  const config = {
    KO: { classe: "pill-ko", libelle: "Hors service" },
    WARN: { classe: "pill-warn", libelle: "Dégradé" },
    UNKNOWN: { classe: "pill-inconnu", libelle: "Inconnu" },
  }[statut] ?? { classe: "pill-ok", libelle: "Normal" };

  return (
    <span className={`status-pill ${config.classe}`}>
      <Circle size={8} fill="currentColor" stroke="none" /> {config.libelle}
    </span>
  );
}

function DashboardPage() {
  const { auth, setReduit, reduit } = useOutletContext();
  const { getAuthHeader } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sites, setSites] = useState([]);
  const [equipementsTotal, setEquipementsTotal] = useState(0);
  const [gravite, setGravite] = useState(null);
  const [erreur, setErreur] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [derniereMaj, setDerniereMaj] = useState(new Date());
  const [rechercheAnomalie, setRechercheAnomalie] = useState("");
  // Amendement "Tableau de bord et gestion des sites" : categorie de
  // gravite active (Critique/Majeur/Moyen/Normal/Inconnu) - remplace
  // l'ancien systeme a 2 onglets (Degrades/Hors service vs Statut
  // inconnu). Defaut sur "CRITIQUE", la categorie la plus urgente.
  const [categorieActive, setCategorieActive] = useState("CRITIQUE");
  // Panneau "Sante globale" masque par defaut, depliable au clic.
  const [santeDepliee, setSanteDepliee] = useState(false);

  async function charger() {
    setChargement(true);
    try {
      const [adminSites, statuts, equipements, graviteEquipements] = await Promise.all([
        adminGet("/backoffice/api/v1/sites", getAuthHeader()),
        adminGet("/backoffice/api/v1/sites/statuts", getAuthHeader()),
        adminGet("/backoffice/api/v1/equipments/count", getAuthHeader()).catch(() => ({ total: 0 })),
        adminGet("/backoffice/api/v1/equipments/gravite", getAuthHeader()).catch(() => null),
      ]);
      setGravite(graviteEquipements);

      const statutBySiteId = {};
      statuts.forEach((s) => { statutBySiteId[s.siteId] = s; });

      const merged = adminSites.map((site) => ({
        ...site,
        statutGlobal: statutBySiteId[site.siteId]?.statutGlobal ?? null,
        statutAnptic: statutBySiteId[site.siteId]?.statutAnptic ?? null,
        statutLan: statutBySiteId[site.siteId]?.statutLan ?? null,
        graviteSite: statutBySiteId[site.siteId]?.graviteSite ?? "INCONNU",
      }));

      // BUG CORRIGE (compte rendu des amendements, section I) : le KPI
      // "Sites configures" comptait TOUS les sites importes depuis NetXMS,
      // y compris ceux sans aucun equipement rattache (deux pipelines de
      // synchronisation independants, cf. NetxmsSiteImportService vs
      // EquipmentSyncService - rien ne garantit qu'un site importe ait
      // deja ses equipements synchronises). Resultat possible : le nombre
      // de sites affiche pouvait depasser le nombre total d'equipements,
      // ce qui n'a pas de sens pour un reseau ou chaque site supervise a
      // par definition au moins un equipement. On ne retient ici que les
      // sites avec au moins un equipement - tous les KPI de cette page
      // (total, actifs, categories de gravite, anneau de sante) derivent
      // de ce meme ensemble filtre, pour rester coherents entre eux.
      const sitesAvecEquipement = merged.filter((site) => (site.nombreEquipements ?? 0) > 0);

      setSites(sitesAvecEquipement);
      setEquipementsTotal(equipements.total ?? 0);
      setDerniereMaj(new Date());
    } catch (err) {
      setErreur(err.message);
    } finally {
      setChargement(false);
    }
  }

  useEffect(() => {
    charger();
    const intervalle = setInterval(charger, 60000);
    return () => clearInterval(intervalle);
  }, []);

  const total = sites.length;
  const actifs = sites.filter((s) => s.actif).length;
  const ok = sites.filter((s) => s.statutGlobal === "OK").length;
  const warn = sites.filter((s) => s.statutGlobal === "WARN").length;
  const ko = sites.filter((s) => s.statutGlobal === "KO").length;

  const pctOk = actifs > 0 ? ((ok / actifs) * 100).toFixed(1) : "0";
  const pctWarn = actifs > 0 ? ((warn / actifs) * 100).toFixed(1) : "0";
  const pctKo = actifs > 0 ? ((ko / actifs) * 100).toFixed(1) : "0";
  const pctActifs = total > 0 ? ((actifs / total) * 100).toFixed(1) : "0";

  // Amendement "Tableau de bord et gestion des sites" : 5 categories de
  // sites mutuellement exclusives (chaque site n'apparait que dans UNE
  // seule), calculees cote backend (site.graviteSite). Remplace l'ancien
  // panneau "Sites necessitant une attention" (Critiques/Statut inconnu).
  const sitesParCategorie = Object.fromEntries(
    CATEGORIES_GRAVITE.map((cat) => [cat.cle, sites.filter((s) => s.graviteSite === cat.cle)])
  );
  const categorieInfoActive = CATEGORIES_GRAVITE.find((c) => c.cle === categorieActive);
  const sitesCategorieActive = sitesParCategorie[categorieActive] ?? [];
  const sitesCategorieFiltree = sitesCategorieActive.filter((s) => {
    const t = rechercheAnomalie.trim().toLowerCase();
    if (!t) return true;
    return s.nom.toLowerCase().includes(t) || (s.ville || "").toLowerCase().includes(t);
  });
  // Badge de la cloche (alertes) : sites critiques + majeurs, les deux
  // niveaux necessitant reellement une intervention.
  const nombreAlertesUrgentes = sitesParCategorie.CRITIQUE.length + sitesParCategorie.MAJEUR.length;

  const nomAdmin = (auth?.username || "admin").split(".")[0].toUpperCase();
  const initiales = nomAdmin.substring(0, 2);
  const heureMaj = derniereMaj.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  const rayon = 88;
  const perimetre = 2 * Math.PI * rayon;
  const arcOk = (ok / (actifs || 1)) * perimetre;
  const arcWarn = (warn / (actifs || 1)) * perimetre;
  const arcKo = (ko / (actifs || 1)) * perimetre;

  const etatGlobal = parseFloat(pctOk) >= 90 ? "excellent"
    : parseFloat(pctOk) >= 70 ? "bon"
    : parseFloat(pctOk) >= 40 ? "surveiller" : "critique";

  const summaryTexts = {
    excellent: { Icon: Trophy, title: "Réseau global en excellente santé", text: "La majorité des sites RESINA sont opérationnels." },
    bon: { Icon: ThumbsUp, title: "Réseau global en bonne santé", text: `${ok} des ${actifs} sites actifs sont opérationnels.` },
    surveiller: { Icon: TriangleAlert, title: "Réseau global à surveiller", text: `Seulement ${ok} des ${actifs} sites sont opérationnels.` },
    critique: { Icon: Siren, title: "Réseau global en état critique", text: `Seulement ${ok} des ${actifs} sites sont opérationnels.` },
  };
  const summary = summaryTexts[etatGlobal];

  // Navigue vers la page cible, sauf si on s'y trouve deja : dans ce cas
  // on remonte simplement en haut de la page plutot que de ne rien faire
  // (evite qu'un clic sur la cloche/l'avatar semble "casse" quand on est
  // deja sur la page concernee).
  function irOuRemonterEnHaut(chemin) {
    if (location.pathname === chemin) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      navigate(chemin);
    }
  }

  function exporterCSV() {
    const enTete = ["Site", "Ville", "Categorie", "Statut ANPTIC", "Statut LAN", "Derniere alerte"];
    const libelleCategorie = categorieInfoActive?.libelle ?? categorieActive;
    const lignes = sitesCategorieActive.map((s) => [
      s.nom, s.ville || "",
      libelleCategorie,
      s.statutAnptic || "Inconnu",
      s.statutLan || "Inconnu",
      heureMaj,
    ]);
    const csv = [enTete, ...lignes]
      .map((ligne) => ligne.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sites-${categorieActive.toLowerCase()}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <div className="dashboard-topbar">
        <button className="topbar-collapse-btn" onClick={() => setReduit(!reduit)}><Menu size={18} /></button>
        <div className="topbar-titles">
          <h1 className="topbar-title-welcome">Bienvenue, {nomAdmin} <Sparkle size={16} className="wave" /></h1>
          <p className="topbar-subtitle">GéoPortail RESINA — Supervision simplifiée du réseau national</p>
        </div>
        <div className="topbar-actions">
          <div className="topbar-live-badge-compact">
            <span className="live-dot"></span>
            <div>
              <div className="topbar-live-label">EN DIRECT</div>
              <div className="topbar-live-sub">Données actualisées à {heureMaj}</div>
            </div>
          </div>
          <button className="topbar-icon-btn" title="Alertes — voir l'historique des incidents"
            onClick={() => irOuRemonterEnHaut("/backoffice/incidents-historique")}>
            <Bell size={17} />
            {nombreAlertesUrgentes > 0 && (
              <span className="topbar-badge topbar-badge-orange">
                {nombreAlertesUrgentes > 99 ? "99+" : nombreAlertesUrgentes}
              </span>
            )}
          </button>
          <div className="topbar-user" role="button" tabIndex={0} title="Mon profil"
            style={{ cursor: "pointer" }}
            onClick={() => irOuRemonterEnHaut("/backoffice/mon-profil")}
            onKeyDown={(e) => { if (e.key === "Enter") irOuRemonterEnHaut("/backoffice/mon-profil"); }}>
            <div className="topbar-user-avatar">{initiales}</div>
            <div className="topbar-user-info">
              <div className="topbar-user-name">Admin {nomAdmin}</div>
              <div className="topbar-user-role">Super Administrateur</div>
            </div>
          </div>
        </div>
      </div>

      <div className="backoffice-content dashboard-content">
        <ErrorBanner message={erreur} onRetry={charger} />

        {/* KPI - amendement "Tableau de bord et gestion des sites" :
            5 categories de gravite cliquables (Critique/Majeur/Moyen/
            Normal/Inconnu), en remplacement de la notion generique
            "Sites degrades". Chaque carte filtre le panneau de liste
            ci-dessous au clic. */}
        <div className="kpi-grid-v2">
          <div className="kpi-card-v2">
            <div className="kpi-card-icon kpi-icon-blue"><Building2 size={22} /></div>
            <div>
              <div className="kpi-card-label">SITES CONFIGURÉS</div>
              <div className="kpi-card-value">{total}</div>
              <div className="kpi-card-sub">{pctActifs}% actifs · avec équipement</div>
            </div>
          </div>

          {CATEGORIES_GRAVITE.map((cat) => {
            const nombreSites = sitesParCategorie[cat.cle].length;
            const pct = total > 0 ? ((nombreSites / total) * 100).toFixed(1) : "0";
            const active = categorieActive === cat.cle;
            return (
              <button
                key={cat.cle}
                type="button"
                className={`kpi-card-v2 kpi-card-cliquable ${active ? "kpi-card-active" : ""}`}
                onClick={() => setCategorieActive(cat.cle)}
                aria-pressed={active}
              >
                <div className={`kpi-card-icon ${cat.classeIcone}`}><cat.Icone size={22} /></div>
                <div>
                  <div className="kpi-card-label">{cat.libelle.toUpperCase()}</div>
                  <div className={`kpi-card-value ${cat.classeValeur}`}>{nombreSites}</div>
                  <div className="kpi-card-sub">{pct}% du parc</div>
                </div>
              </button>
            );
          })}

          <div className="kpi-card-v2">
            <div className="kpi-card-icon kpi-icon-navy"><Plug size={22} /></div>
            <div>
              <div className="kpi-card-label">ÉQUIPEMENTS SUPERVISÉS</div>
              <div className="kpi-card-value">{equipementsTotal.toLocaleString("fr-FR")}</div>
              <div className="kpi-card-sub">Actifs sur le réseau</div>
            </div>
          </div>
        </div>

        {/* Repartition des equipements par niveau de gravite (section II) */}
        {gravite && (
          <div className="panel gravite-panel">
            <div className="panel-header">
              <h2><Gauge size={16} className="panel-title-icon" /> Équipements par niveau de gravité</h2>
            </div>
            <div className="gravite-grid">
              <div className="gravite-card gravite-normal">
                <div className="gravite-icon"><Check size={18} /></div>
                <div className="gravite-value">{gravite.normal}</div>
                <div className="gravite-label">Normal</div>
              </div>
              <div className="gravite-card gravite-intermediaire">
                <div className="gravite-icon"><ShieldAlert size={18} /></div>
                <div className="gravite-value">{gravite.intermediaire}</div>
                <div className="gravite-label">Moyen</div>
              </div>
              <div className="gravite-card gravite-majeur">
                <div className="gravite-icon"><TriangleAlert size={18} /></div>
                <div className="gravite-value">{gravite.majeur}</div>
                <div className="gravite-label">Majeur</div>
              </div>
              <div className="gravite-card gravite-critique">
                <div className="gravite-icon"><AlertOctagon size={18} /></div>
                <div className="gravite-value">{gravite.critique}</div>
                <div className="gravite-label">Critique</div>
              </div>
              {gravite.inconnu > 0 && (
                <div className="gravite-card gravite-inconnu">
                  <div className="gravite-icon"><HelpCircle size={18} /></div>
                  <div className="gravite-value">{gravite.inconnu}</div>
                  <div className="gravite-label">Inconnu</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Santé globale - masque par defaut, depliable au clic sur la fleche */}
        <div className="health-panel">
          <button
            type="button"
            className="health-panel-header health-panel-header-toggle"
            onClick={() => setSanteDepliee(!santeDepliee)}
            aria-expanded={santeDepliee}
            style={{ marginBottom: santeDepliee ? undefined : 0 }}
          >
            <span className="health-icon"><Activity size={18} /></span>
            <h2>Santé globale du réseau RESINA</h2>
            <ChevronDown size={18} className={`health-panel-chevron ${santeDepliee ? "health-panel-chevron-ouvert" : ""}`} />
          </button>
          {santeDepliee && (
          <div className="health-panel-body">
            <div className="health-ring">
              <svg viewBox="0 0 200 200" width="180" height="180">
                <circle cx="100" cy="100" r={rayon} fill="none" stroke="#EEF1F7" strokeWidth="18"/>
                {ok > 0 && (
                  <circle cx="100" cy="100" r={rayon} fill="none" stroke="var(--bo-ok)" strokeWidth="18"
                    strokeDasharray={`${arcOk} ${perimetre}`} transform="rotate(-90 100 100)" strokeLinecap="round"/>
                )}
                {warn > 0 && (
                  <circle cx="100" cy="100" r={rayon} fill="none" stroke="var(--bo-warn)" strokeWidth="18"
                    strokeDasharray={`${arcWarn} ${perimetre}`} strokeDashoffset={-arcOk}
                    transform="rotate(-90 100 100)" strokeLinecap="round"/>
                )}
                {ko > 0 && (
                  <circle cx="100" cy="100" r={rayon} fill="none" stroke="var(--bo-ko)" strokeWidth="18"
                    strokeDasharray={`${arcKo} ${perimetre}`} strokeDashoffset={-(arcOk + arcWarn)}
                    transform="rotate(-90 100 100)" strokeLinecap="round"/>
                )}
              </svg>
              <div className="health-ring-center">
                <div className="health-ring-value">{pctOk}%</div>
                <div className="health-ring-label">Opérationnels</div>
              </div>
            </div>

            <div className="health-legend-grid">
              <div className="health-legend-card">
                <div className="legend-card-title"><span className="dot ok"></span>Opérationnels</div>
                <div className="legend-card-value">{pctOk}%</div>
                <div className="legend-card-sub">{ok} sites</div>
              </div>
              <div className="health-legend-card">
                <div className="legend-card-title"><span className="dot warn"></span>Dégradés</div>
                <div className="legend-card-value">{pctWarn}%</div>
                <div className="legend-card-sub">{warn} sites</div>
              </div>
              <div className="health-legend-card">
                <div className="legend-card-title"><span className="dot ko"></span>Hors service</div>
                <div className="legend-card-value">{pctKo}%</div>
                <div className="legend-card-sub">{ko} sites</div>
              </div>
            </div>

            <div className={`health-summary summary-${etatGlobal}`}>
              <div className="health-summary-icon"><summary.Icon size={24} /></div>
              <div>
                <div className="health-summary-title">{summary.title}</div>
                <div className="health-summary-text">{summary.text}</div>
                <div className="health-summary-bar">
                  <div className="health-summary-bar-fill" style={{ width: `${pctOk}%` }}></div>
                </div>
              </div>
            </div>
          </div>
          )}
        </div>

        {/* Liste des sites de la categorie de gravite selectionnee -
            remplace l'ancien panneau "Sites necessitant une attention"
            (amendement "Tableau de bord et gestion des sites"). */}
        <div className="panel attention-panel">
          <div className="panel-header">
            <h2>
              <Bell size={16} className="panel-title-icon" /> Sites — {categorieInfoActive?.libelle}
              <span className="attention-count">{sitesCategorieActive.length}</span>
            </h2>
            <div className="panel-header-actions">
              <button className="btn-outline" onClick={charger} disabled={chargement}>
                <RefreshCw size={13} className={chargement ? "spin-icon" : ""} /> {chargement ? "Actualisation..." : "Actualiser"}
              </button>
              <button className="btn-outline" onClick={exporterCSV}><Download size={13} /> Exporter</button>
              <input type="text" placeholder="Rechercher un site…" className="attention-search"
                value={rechercheAnomalie} onChange={(e) => setRechercheAnomalie(e.target.value)} />
            </div>
          </div>

          {sitesCategorieActive.length === 0 && !chargement && (
            <p>Aucun site dans la catégorie « {categorieInfoActive?.libelle} » actuellement.</p>
          )}

          {sitesCategorieFiltree.length > 0 && (
            <table className="admin-table attention-table">
              <thead>
                <tr>
                  <th>SITE</th>
                  <th>LOCALISATION</th>
                  <th>STATUT ANPTIC</th>
                  <th>RÉSEAU LOCAL (LAN)</th>
                  <th>DERNIÈRE ALERTE</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {sitesCategorieFiltree.slice(0, 10).map((site) => (
                  <tr key={site.siteId}>
                    <td><div className="site-name-cell"><Building2 size={13} /> {site.nom}</div></td>
                    <td>{site.ville}</td>
                    <td><PastilleStatut statut={site.statutAnptic} /></td>
                    <td><PastilleStatut statut={site.statutLan} /></td>
                    <td className="alerte-cell">{heureMaj}</td>
                    {/* BUG CORRIGE : menait toujours vers la liste generale des
                        sites, sans jamais preciser LEQUEL - quel que soit le
                        site clique dans ce tableau. Mene maintenant vers la
                        fiche de CE site precis (meme page que "Modifier"
                        depuis Gestion des sites, qui affiche deja tous les
                        details + equipements rattaches). */}
                    <td><Link to={`/backoffice/sites/${site.siteId}/edit`} className="btn-voir"><Eye size={13} /> Voir</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {sitesCategorieFiltree.length > 0 && (
            <p className="attention-footer">
              Affichage de {Math.min(10, sitesCategorieFiltree.length)} site(s) sur {sitesCategorieActive.length}
            </p>
          )}
        </div>
      </div>
    </>
  );
}

export default DashboardPage;
