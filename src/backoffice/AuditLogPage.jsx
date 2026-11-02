import { useEffect, useState } from "react";
import {
  Trash2, Ban, PauseCircle, PlayCircle, Sparkles, RotateCcw, KeyRound, Pencil, FileText,
  ScrollText, X, Download, CalendarDays, Clock, TrendingUp, Users, ChevronLeft, ChevronRight,
} from "lucide-react";
import { useAuth } from "../shared/AuthContext";
import { adminGet } from "../shared/backofficeApiClient";
import Topbar from "./Topbar";
import SearchableSelect from "../shared/SearchableSelect";
import ErrorBanner from "../shared/ErrorBanner";
import Preloader from "../shared/Preloader";

const TAILLE_PAGE = 30;

// Transforme "Xavier KIWALO" en "KIWALO X." (nom de famille en majuscules
// + initiale du prenom), pour reprendre exactement le format d'affichage
// de la maquette de reference.
function formaterNomAffiche(nomComplet) {
  if (!nomComplet) return "Utilisateur inconnu";
  const mots = nomComplet.trim().split(/\s+/);
  if (mots.length < 2) return nomComplet.toUpperCase();

  const prenom = mots[0];
  const nomDeFamille = mots.slice(1).join(" ");
  return `${nomDeFamille.toUpperCase()} ${prenom.charAt(0).toUpperCase()}.`;
}

// Formate en "DD/MM/YYYY" + "HHhMM" (avec la lettre "h" comme separateur,
// convention administrative francophone reprise dans la maquette),
// plutot que le format ISO par defaut de toLocaleTimeString ("HH:MM").
function formaterDateHeure(dateIso) {
  const date = new Date(dateIso);
  const jour = String(date.getDate()).padStart(2, "0");
  const mois = String(date.getMonth() + 1).padStart(2, "0");
  const annee = date.getFullYear();
  const heures = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return { dateAffichee: `${jour}/${mois}/${annee}`, heureAffichee: `${heures}h${minutes}` };
}

// "Aujourd'hui" / "Hier" / "vendredi 29 août 2026" - regroupe les entrees
// du journal par jour civil pour une lecture en frise chronologique
// plutot qu'une liste plate.
function libelleJour(dateIso) {
  const d = new Date(dateIso);
  const debutJour = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const aujourdHui = new Date();
  const debutAujourdHui = new Date(aujourdHui.getFullYear(), aujourdHui.getMonth(), aujourdHui.getDate());
  const debutHier = new Date(debutAujourdHui);
  debutHier.setDate(debutHier.getDate() - 1);

  if (debutJour.getTime() === debutAujourdHui.getTime()) return "Aujourd'hui";
  if (debutJour.getTime() === debutHier.getTime()) return "Hier";
  const libelle = d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  return libelle.charAt(0).toUpperCase() + libelle.slice(1);
}

// Classification d'UNE entree par type d'action (a partir du libelle
// francais deja stocke en base - il n'existe pas de champ "categorie"
// cote backend), pour l'icone/etiquette affichees a cote de chaque ligne
// de la frise. Miroir exact de AuditLogSearchService.categoriser (cote
// backend, qui calcule les compteurs par categorie sur TOUT l'historique
// filtre - cette fonction-ci ne sert qu'a l'affichage de la page
// actuellement chargee). L'ordre compte : "desactivation"/"reactivation"
// contiennent tous les deux la sous-chaine "activation", donc testes
// avant le cas generique "activation".
const CATEGORIES_ACTION = [
  { key: "suppression", test: /suppression/i, label: "Suppression", Icon: Trash2, color: "#D93535" },
  { key: "revocation", test: /révocation/i, label: "Révocation", Icon: Ban, color: "#D93535" },
  { key: "desactivation", test: /désactivation/i, label: "Désactivation", Icon: PauseCircle, color: "#C97C0A" },
  { key: "reactivation", test: /réactivation/i, label: "Réactivation", Icon: PlayCircle, color: "#0D9B5A" },
  { key: "activation", test: /activation/i, label: "Activation", Icon: PlayCircle, color: "#0D9B5A" },
  { key: "creation", test: /création/i, label: "Création", Icon: Sparkles, color: "#0D9B5A" },
  { key: "reinitialisation", test: /réinitialisation/i, label: "Réinitialisation", Icon: RotateCcw, color: "#C97C0A" },
  { key: "motdepasse", test: /mot de passe/i, label: "Mot de passe", Icon: KeyRound, color: "#4A9EFF" },
  { key: "modification", test: /modification|coordonnées/i, label: "Modification", Icon: Pencil, color: "#0A3D7A" },
];
const CATEGORIE_AUTRE = { key: "autre", label: "Autre", Icon: FileText, color: "#6B7280" };

function categoriser(action) {
  return CATEGORIES_ACTION.find((c) => c.test.test(action)) || CATEGORIE_AUTRE;
}

function AuditLogPage() {
  const { getAuthHeader } = useAuth();
  const [entries, setEntries] = useState([]);
  const [stats, setStats] = useState({ totalFiltre: 0, aujourdHui: 0, septJours: 0, utilisateursActifs: 0, parCategorie: {} });
  const [page, setPage] = useState(0); // 0-indexé côté API
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [auteursDistincts, setAuteursDistincts] = useState([]);
  const [nomsParLogin, setNomsParLogin] = useState({});
  const [erreur, setErreur] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [filtreTexte, setFiltreTexte] = useState("");
  const [filtreTexteSaisi, setFiltreTexteSaisi] = useState("");
  const [filtreAuteur, setFiltreAuteur] = useState("");

  // Retour utilisateur du 30/10/2026 : recherche/pagination desormais sur
  // TOUT l'historique cote serveur (AdminAuditController/AuditLogSearchService),
  // plus seulement les 500 evenements les plus recents.
  function charger() {
    setChargement(true);
    const params = new URLSearchParams();
    if (filtreAuteur) params.set("auteur", filtreAuteur);
    if (filtreTexte) params.set("recherche", filtreTexte);
    params.set("page", page);
    params.set("taille", TAILLE_PAGE);

    // La liste des auteurs (pour le filtre) et les noms complets viennent
    // de /users, a part - independant de la pagination du journal.
    Promise.all([
      adminGet(`/backoffice/api/v1/audit-log?${params.toString()}`, getAuthHeader()),
      adminGet("/backoffice/api/v1/users", getAuthHeader()),
    ])
      .then(([data, users]) => {
        setEntries(data.entries);
        setStats(data.stats);
        setTotalPages(data.totalPages);
        setTotalElements(data.totalElements);

        const lookup = {};
        users.forEach((u) => { lookup[u.login] = u.nomComplet; });
        setNomsParLogin(lookup);
        setAuteursDistincts(
          users.map((u) => u.login)
            .sort((a, b) => formaterNomAffiche(lookup[a]).localeCompare(formaterNomAffiche(lookup[b]), "fr"))
        );
      })
      .catch((err) => setErreur(err.message))
      .finally(() => setChargement(false));
  }

  useEffect(() => { charger(); }, [filtreAuteur, filtreTexte, page]);

  function soumettreRecherche(e) {
    e.preventDefault();
    setPage(0);
    setFiltreTexte(filtreTexteSaisi.trim());
  }

  function onChangeAuteur(valeur) {
    setPage(0);
    setFiltreAuteur(valeur);
  }

  const aDesFiltres = filtreTexte || filtreAuteur;

  function effacerFiltres() {
    setFiltreTexte("");
    setFiltreTexteSaisi("");
    setFiltreAuteur("");
    setPage(0);
  }

  // L'export CSV ne porte que sur la page actuellement chargee (comme
  // l'affichage) - pour tout l'historique filtre, voir le bouton
  // "Exporter" des autres pages d'historique (Incidents) pour le meme
  // pattern cote backend, a etendre ici plus tard si besoin.
  function echapperCsv(valeur) {
    const texte = String(valeur ?? "");
    if (texte.includes(",") || texte.includes('"') || texte.includes("\n")) {
      return '"' + texte.replace(/"/g, '""') + '"';
    }
    return texte;
  }

  function exporter() {
    const entetes = ["Date", "Catégorie", "Auteur", "Action", "Détails"];
    const lignes = entries.map((e) => {
      const cat = categoriser(e.action);
      return [
        new Date(e.horodatage).toLocaleString("fr-FR"),
        cat.label,
        nomsParLogin[e.auteur] ?? e.auteur,
        e.action,
        e.details ?? "",
      ]
        .map(echapperCsv)
        .join(",");
    });
    const contenu = "﻿" + entetes.join(",") + "\n" + lignes.join("\n");
    const blob = new Blob([contenu], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "journal-activite.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  // Repartition par categorie : calculee cote serveur sur TOUT l'ensemble
  // filtre (texte/auteur), pas seulement la page affichee - voir
  // AuditLogStatsDto.parCategorie. Purement informative desormais (plus
  // de clic pour filtrer : le filtrage par categorie necessiterait un
  // parametre dedie cote serveur, non implemente pour l'instant).
  const repartition = [...CATEGORIES_ACTION, CATEGORIE_AUTRE]
    .map((cat) => ({ ...cat, count: stats.parCategorie[cat.key] ?? 0 }))
    .filter((cat) => cat.count > 0)
    .sort((a, b) => b.count - a.count);
  const totalRepartition = stats.totalFiltre || 1;

  // Regroupement en frise chronologique : "Aujourd'hui", "Hier", puis par
  // date - les entrees de la page arrivent deja triees du plus recent au
  // plus ancien depuis l'API, on preserve donc cet ordre.
  const groupesParJour = [];
  entries.forEach((e) => {
    const libelle = libelleJour(e.horodatage);
    const dernierGroupe = groupesParJour[groupesParJour.length - 1];
    if (dernierGroupe && dernierGroupe.libelle === libelle) {
      dernierGroupe.entries.push(e);
    } else {
      groupesParJour.push({ libelle, entries: [e] });
    }
  });

  const pageAffichee = page + 1; // 1-indexé pour l'utilisateur

  return (
    <>
      <Topbar
        title="Journal d'activité"
        subtitle="Traçabilité de toutes les modifications effectuées dans le Backoffice — historique complet"
        onRefresh={charger}
        chargement={chargement}
      />

      <div className="backoffice-content">
        <ErrorBanner message={erreur} onRetry={charger} />

        {/* KPI */}
        <div className="kpi-grid-v2" style={{ marginBottom: "20px" }}>
          <div className="kpi-card-v2">
            <div className="kpi-card-icon kpi-icon-navy"><ScrollText size={22} /></div>
            <div>
              <div className="kpi-card-label">ÉVÉNEMENTS (FILTRE ACTIF)</div>
              <div className="kpi-card-value">{stats.totalFiltre}</div>
              <div className="kpi-card-sub">historique complet</div>
            </div>
          </div>
          <div className="kpi-card-v2">
            <div className="kpi-card-icon kpi-icon-blue"><Clock size={22} /></div>
            <div>
              <div className="kpi-card-label">AUJOURD'HUI</div>
              <div className="kpi-card-value">{stats.aujourdHui}</div>
              <div className="kpi-card-sub">événement(s) enregistré(s)</div>
            </div>
          </div>
          <div className="kpi-card-v2">
            <div className="kpi-card-icon kpi-icon-green"><TrendingUp size={22} /></div>
            <div>
              <div className="kpi-card-label">7 DERNIERS JOURS</div>
              <div className="kpi-card-value">{stats.septJours}</div>
              <div className="kpi-card-sub">activité récente</div>
            </div>
          </div>
          <div className="kpi-card-v2">
            <div className="kpi-card-icon kpi-icon-orange"><Users size={22} /></div>
            <div>
              <div className="kpi-card-label">UTILISATEURS ACTIFS</div>
              <div className="kpi-card-value">{stats.utilisateursActifs}</div>
              <div className="kpi-card-sub">ont agi dans le Backoffice</div>
            </div>
          </div>
        </div>

        {/* Repartition par type d'action */}
        {repartition.length > 0 && (
          <div className="eq-stats-section">
            <h2 className="eq-stats-title">Répartition par type d'action</h2>
            <div className="eq-stats-grid">
              {repartition.map((cat) => {
                const pourcentage = Math.round((cat.count / totalRepartition) * 100);
                return (
                  <div key={cat.key} className="eq-stat-card" style={{ borderTop: `3px solid ${cat.color}` }}>
                    <div className="eq-stat-icon"><cat.Icon size={20} /></div>
                    <div style={{ flex: 1 }}>
                      <div className="eq-stat-label">{cat.label.toUpperCase()}</div>
                      <div className="eq-stat-value">{cat.count}</div>
                      <div className="eq-stat-bar">
                        <div className="eq-stat-bar-fill" style={{ width: `${pourcentage}%`, background: cat.color }}></div>
                      </div>
                      <div className="eq-stat-pct">{pourcentage}%</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="panel">
          <div className="panel-header" style={{ flexWrap: "wrap", gap: "8px" }}>
            <h2><CalendarDays size={16} className="panel-title-icon" /> Frise des événements <span className="attention-count" style={{ background: "var(--bo-primary)" }}>{totalElements}</span></h2>
            <div className="panel-header-actions" style={{ flexWrap: "wrap", gap: "8px" }}>
              <form onSubmit={soumettreRecherche} style={{ display: "flex", gap: "6px" }}>
                <input
                  className="attention-search"
                  placeholder="Rechercher (action, détails)…"
                  value={filtreTexteSaisi}
                  onChange={(e) => setFiltreTexteSaisi(e.target.value)}
                />
                <button type="submit" className="btn-primary">OK</button>
              </form>

              <div className="cascade-group">
                <label className="cascade-label">Auteur</label>
                <SearchableSelect selectClassName="attention-search" value={filtreAuteur} onChange={(e) => onChangeAuteur(e.target.value)}>
                  <option value="">Tous les auteurs</option>
                  {auteursDistincts.map((login) => (
                    <option key={login} value={login}>{formaterNomAffiche(nomsParLogin[login])}</option>
                  ))}
                </SearchableSelect>
              </div>

              {aDesFiltres && (
                <button className="btn-outline" onClick={effacerFiltres}><X size={13} /> Effacer les filtres</button>
              )}

              <button className="btn-outline" onClick={exporter}><Download size={13} /> Exporter (page actuelle)</button>
            </div>
          </div>

          {chargement && <Preloader />}

          {!chargement && groupesParJour.map((groupe) => (
            <div key={groupe.libelle}>
              <div className="audit-day-heading">{groupe.libelle}</div>
              <div className="audit-list">
                {groupe.entries.map((entry) => {
                  const { heureAffichee } = formaterDateHeure(entry.horodatage);
                  const nomAffiche = formaterNomAffiche(nomsParLogin[entry.auteur]);
                  const cat = categoriser(entry.action);

                  return (
                    <div key={entry.id} className="audit-entry">
                      <div className="audit-icon-bubble" style={{ background: cat.color + "1A", color: cat.color }}>
                        <cat.Icon size={15} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="audit-line">
                          <span className="audit-time">{heureAffichee}</span>{" "}
                          <strong>{nomAffiche}</strong>
                          <span className="audit-category-tag" style={{ background: cat.color + "1A", color: cat.color }}>
                            {cat.label}
                          </span>
                        </div>
                        <div className="audit-action">
                          {entry.action}{entry.details ? ` — ${entry.details}` : ""}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {!chargement && entries.length === 0 && (
            <p>{aDesFiltres ? "Aucun événement ne correspond à ces filtres." : "Aucune activité enregistrée."}</p>
          )}

          {!chargement && totalPages > 1 && (
            <div className="pagination-bar">
              <div className="pagination-info">
                Page <strong>{pageAffichee}</strong> sur <strong>{totalPages}</strong> — <strong>{totalElements}</strong> événement(s)
              </div>
              <div className="pagination-controls">
                <button className="pagination-btn" onClick={() => setPage((p) => p - 1)} disabled={pageAffichee === 1}>
                  <ChevronLeft size={13} /> Précédent
                </button>
                <button className="pagination-btn" onClick={() => setPage((p) => p + 1)} disabled={pageAffichee === totalPages}>
                  Suivant <ChevronRight size={13} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default AuditLogPage;
