import { useEffect, useState } from "react";
import { ClipboardList, Clock, Check, Ban, TriangleAlert, Siren, X, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "../shared/AuthContext";
import { adminGet, adminGetFichier, declencherTelechargement } from "../shared/backofficeApiClient";
import { formaterDureeMinutes } from "../shared/timeFormat";
import SearchableSelect from "../shared/SearchableSelect";
import ErrorBanner from "../shared/ErrorBanner";
import Topbar from "./Topbar";

const PERIODES = [
  { valeur: 7, label: "7 derniers jours" },
  { valeur: 30, label: "30 derniers jours" },
  { valeur: 90, label: "90 derniers jours" },
  { valeur: 3650, label: "Tout l'historique" },
];

const TAILLE_PAGE = 20;

// "DD/MM/YYYY HHhMM" - meme convention que le Journal d'activité.
function formaterDateHeure(dateIso) {
  if (!dateIso) return null;
  const date = new Date(dateIso);
  const jour = String(date.getDate()).padStart(2, "0");
  const mois = String(date.getMonth() + 1).padStart(2, "0");
  const annee = date.getFullYear();
  const heures = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${jour}/${mois}/${annee} ${heures}h${minutes}`;
}

// Fabrique la liste des numeros de page a afficher, avec des "..." pour
// les grands sauts, style : 1 ... 4 5 [6] 7 8 ... 82 - partagee par les
// 2 onglets (alertes reseau / incidents iTop).
function numerosPagesAffiches(pageAffichee, totalPages) {
  const pages = [];
  const rayon = 2;
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= pageAffichee - rayon && i <= pageAffichee + rayon)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "...") {
      pages.push("...");
    }
  }
  return pages;
}

function infosStatutItop(statut) {
  if (statut === "ongoing") return { classe: "pill-ko", libelle: "En cours" };
  if (statut === "resolved") return { classe: "pill-warn", libelle: "Résolu" };
  return { classe: "pill-ok", libelle: "Clôturé" };
}

function IncidentsHistoriquePage() {
  const { getAuthHeader } = useAuth();
  const [onglet, setOnglet] = useState("reseau"); // "reseau" | "itop"

  const [ministeres, setMinisteres] = useState([]);
  useEffect(() => {
    adminGet("/backoffice/api/v1/ministry-tokens/ministeres", getAuthHeader()).then(setMinisteres).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <Topbar
        title="Historique des incidents"
        subtitle="Pannes ANPTIC/LAN (NetXMS) et tickets iTop, avec dates réelles de début et de fin"
      />
      <div className="backoffice-content">
        <div className="alertes-onglets" style={{ maxWidth: "420px", marginBottom: "20px" }}>
          <button
            type="button"
            className={`alertes-onglet-btn ${onglet === "reseau" ? "alertes-onglet-actif" : ""}`}
            onClick={() => setOnglet("reseau")}
          >
            Alertes réseau
          </button>
          <button
            type="button"
            className={`alertes-onglet-btn ${onglet === "itop" ? "alertes-onglet-actif" : ""}`}
            onClick={() => setOnglet("itop")}
          >
            Incidents iTop
          </button>
        </div>

        {onglet === "reseau" && <OngletAlertesReseau getAuthHeader={getAuthHeader} ministeres={ministeres} />}
        {onglet === "itop" && <OngletIncidentsItop getAuthHeader={getAuthHeader} ministeres={ministeres} />}
      </div>
    </>
  );
}

// ---- Onglet "Alertes réseau" (NetXMS) - contenu original de cette page,
// inchangé, juste extrait dans son propre composant pour cohabiter avec
// le nouvel onglet "Incidents iTop" ci-dessous. ----
function OngletAlertesReseau({ getAuthHeader, ministeres }) {
  const [incidents, setIncidents] = useState([]);
  const [stats, setStats] = useState({ total: 0, resolus: 0, enCours: 0, ko: 0, warn: 0 });
  const [page, setPage] = useState(0); // 0-indexé côté API
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  const [erreur, setErreur] = useState(null);
  const [chargement, setChargement] = useState(true);

  const [periode, setPeriode] = useState(30);
  const [date, setDate] = useState("");
  const [type, setType] = useState("");
  const [etat, setEtat] = useState("");
  const [ministere, setMinistere] = useState("");
  const [recherche, setRecherche] = useState("");
  const [rechercheSaisie, setRechercheSaisie] = useState("");

  function construireParamsFiltres() {
    const params = new URLSearchParams();
    if (date) {
      params.set("date", date);
    } else {
      params.set("jours", periode);
    }
    if (type) params.set("type", type);
    if (etat) params.set("etat", etat);
    if (ministere) params.set("ministere", ministere);
    if (recherche) params.set("recherche", recherche);
    return params;
  }

  function charger() {
    setChargement(true);
    const params = construireParamsFiltres();
    params.set("page", page);
    params.set("taille", TAILLE_PAGE);

    adminGet(`/backoffice/api/v1/incidents/historique?${params.toString()}`, getAuthHeader())
      .then((data) => {
        setIncidents(data.incidents);
        setStats(data.stats);
        setTotalPages(data.totalPages);
        setTotalElements(data.totalElements);
        setErreur(null);
      })
      .catch((err) => setErreur(err.message))
      .finally(() => setChargement(false));
  }

  const [exportEnCours, setExportEnCours] = useState(false);

  function exporter() {
    setExportEnCours(true);
    const params = construireParamsFiltres();
    adminGetFichier(`/backoffice/api/v1/incidents/historique/export?${params.toString()}`, getAuthHeader())
      .then(({ blob, nomFichier }) => declencherTelechargement(blob, nomFichier))
      .catch((err) => setErreur(err.message))
      .finally(() => setExportEnCours(false));
  }

  useEffect(() => { charger(); }, [periode, date, type, etat, ministere, recherche, page]);

  function onChangePeriode(valeur) { setPage(0); setPeriode(valeur); }
  function onChangeDate(valeur) { setPage(0); setDate(valeur); }
  function onChangeType(valeur) { setPage(0); setType(valeur); }
  function onChangeEtat(valeur) { setPage(0); setEtat(valeur); }
  function onChangeMinistere(valeur) { setPage(0); setMinistere(valeur); }

  function soumettreRecherche(e) {
    e.preventDefault();
    setPage(0);
    setRecherche(rechercheSaisie.trim());
  }

  function effacerFiltres() {
    setPeriode(30); setDate(""); setType(""); setEtat(""); setMinistere("");
    setRecherche(""); setRechercheSaisie("");
    setPage(0);
  }

  const aDesFiltres = date || type || etat || ministere || recherche || periode !== 30;
  const pageAffichee = page + 1; // 1-indexé pour l'utilisateur

  const pctEnCours = stats.total > 0 ? Math.round((stats.enCours / stats.total) * 100) : 0;
  const pctResolus = stats.total > 0 ? Math.round((stats.resolus / stats.total) * 100) : 0;
  const pctKo = stats.total > 0 ? Math.round((stats.ko / stats.total) * 100) : 0;
  const pctWarn = stats.total > 0 ? Math.round((stats.warn / stats.total) * 100) : 0;

  return (
    <>
      <ErrorBanner message={erreur} onRetry={charger} />

      <div className="eq-stats-section">
        <h2 className="eq-stats-title">Répartition des alertes réseau</h2>
        <div className="eq-stats-grid">
          <div className="eq-stat-card" style={{ borderTop: "3px solid #0A3D7A" }}>
            <div className="eq-stat-icon"><ClipboardList size={20} /></div>
            <div style={{ flex: 1 }}>
              <div className="eq-stat-label">TOTAL SUR LA PÉRIODE</div>
              <div className="eq-stat-value">{stats.total.toLocaleString("fr-FR")}</div>
              <div className="eq-stat-bar">
                <div className="eq-stat-bar-fill" style={{ width: "100%", background: "#0A3D7A" }}></div>
              </div>
              <div className="eq-stat-pct">100%</div>
            </div>
          </div>
          <div className="eq-stat-card" style={{ borderTop: "3px solid #D93535" }}>
            <div className="eq-stat-icon"><Clock size={20} /></div>
            <div style={{ flex: 1 }}>
              <div className="eq-stat-label">EN COURS</div>
              <div className="eq-stat-value">{stats.enCours.toLocaleString("fr-FR")}</div>
              <div className="eq-stat-bar">
                <div className="eq-stat-bar-fill" style={{ width: `${pctEnCours}%`, background: "#D93535" }}></div>
              </div>
              <div className="eq-stat-pct">{pctEnCours}%</div>
            </div>
          </div>
          <div className="eq-stat-card" style={{ borderTop: "3px solid #0D9B5A" }}>
            <div className="eq-stat-icon"><Check size={20} /></div>
            <div style={{ flex: 1 }}>
              <div className="eq-stat-label">RÉSOLUES</div>
              <div className="eq-stat-value">{stats.resolus.toLocaleString("fr-FR")}</div>
              <div className="eq-stat-bar">
                <div className="eq-stat-bar-fill" style={{ width: `${pctResolus}%`, background: "#0D9B5A" }}></div>
              </div>
              <div className="eq-stat-pct">{pctResolus}%</div>
            </div>
          </div>
          <div className="eq-stat-card" style={{ borderTop: "3px solid var(--bo-ko)" }}>
            <div className="eq-stat-icon"><Ban size={20} /></div>
            <div style={{ flex: 1 }}>
              <div className="eq-stat-label">KO</div>
              <div className="eq-stat-value">{stats.ko.toLocaleString("fr-FR")}</div>
              <div className="eq-stat-bar">
                <div className="eq-stat-bar-fill" style={{ width: `${pctKo}%`, background: "var(--bo-ko)" }}></div>
              </div>
              <div className="eq-stat-pct">{pctKo}%</div>
            </div>
          </div>
          <div className="eq-stat-card" style={{ borderTop: "3px solid var(--bo-warn)" }}>
            <div className="eq-stat-icon"><TriangleAlert size={20} /></div>
            <div style={{ flex: 1 }}>
              <div className="eq-stat-label">WARN</div>
              <div className="eq-stat-value">{stats.warn.toLocaleString("fr-FR")}</div>
              <div className="eq-stat-bar">
                <div className="eq-stat-bar-fill" style={{ width: `${pctWarn}%`, background: "var(--bo-warn)" }}></div>
              </div>
              <div className="eq-stat-pct">{pctWarn}%</div>
            </div>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header" style={{ flexWrap: "wrap", gap: "8px" }}>
          <h2><Siren size={16} className="panel-title-icon" /> Alertes réseau <span className="attention-count" style={{ background: "var(--bo-primary)" }}>{totalElements}</span></h2>
          <div className="panel-header-actions" style={{ flexWrap: "wrap", gap: "8px" }}>

            <div className="cascade-group">
              <label className="cascade-label">Période</label>
              <SearchableSelect selectClassName="attention-search" value={periode} disabled={!!date}
                onChange={(e) => onChangePeriode(Number(e.target.value))}>
                {PERIODES.map((p) => <option key={p.valeur} value={p.valeur}>{p.label}</option>)}
              </SearchableSelect>
            </div>

            <div className="cascade-group">
              <label className="cascade-label">Date précise</label>
              <input type="date" className="attention-search" value={date}
                onChange={(e) => onChangeDate(e.target.value)} />
            </div>

            <div className="cascade-group">
              <label className="cascade-label">Type</label>
              <SearchableSelect selectClassName="attention-search" value={type} onChange={(e) => onChangeType(e.target.value)}>
                <option value="">Tous les types</option>
                <option value="ANPTIC">ANPTIC</option>
                <option value="LAN">LAN</option>
              </SearchableSelect>
            </div>

            <div className="cascade-group">
              <label className="cascade-label">État</label>
              <SearchableSelect selectClassName="attention-search" value={etat} onChange={(e) => onChangeEtat(e.target.value)}>
                <option value="">Tous</option>
                <option value="EN_COURS">En cours</option>
                <option value="RESOLU">Résolu</option>
              </SearchableSelect>
            </div>

            <div className="cascade-group">
              <label className="cascade-label">Ministère</label>
              <SearchableSelect selectClassName="attention-search" value={ministere} onChange={(e) => onChangeMinistere(e.target.value)}>
                <option value="">Tous les ministères</option>
                {ministeres.map((m) => <option key={m} value={m}>{m}</option>)}
              </SearchableSelect>
            </div>

            <div className="cascade-group">
              <label className="cascade-label">Site ou ville</label>
              <form onSubmit={soumettreRecherche} style={{ display: "flex", gap: "6px" }}>
                <input className="attention-search" style={{ minWidth: "160px" }}
                  value={rechercheSaisie} onChange={(e) => setRechercheSaisie(e.target.value)}
                  placeholder="Rechercher..." />
                <button type="submit" className="btn-primary">OK</button>
              </form>
            </div>

            {aDesFiltres && (
              <button className="btn-outline" onClick={effacerFiltres} style={{ alignSelf: "flex-end" }}>
                <X size={13} /> Effacer
              </button>
            )}

            <button className="btn-primary" onClick={exporter} disabled={exportEnCours}
              style={{ alignSelf: "flex-end" }}>
              {exportEnCours ? "Export..." : <><Download size={13} /> Exporter (CSV)</>}
            </button>
          </div>
        </div>

        {date && (
          <p style={{ color: "var(--bo-ink-muted)", marginTop: "-4px", marginBottom: "10px" }}>
            Filtre par date actif ({new Date(date).toLocaleDateString("fr-FR")}) : la période ci-dessus est ignorée.
          </p>
        )}

        {chargement && <p>Chargement...</p>}

        {!chargement && incidents.length > 0 && (
          <>
            <table className="admin-table attention-table">
              <thead>
                <tr>
                  <th>SITE</th>
                  <th>VILLE</th>
                  <th>MINISTÈRE</th>
                  <th>TYPE</th>
                  <th>STATUT</th>
                  <th>DÉBUT</th>
                  <th>FIN</th>
                  <th>DURÉE</th>
                </tr>
              </thead>
              <tbody>
                {incidents.map((incident) => (
                  <tr key={incident.id}>
                    <td className="site-name-cell">{incident.siteNom}</td>
                    <td>{incident.ville || <span style={{ color: "var(--bo-ink-muted)" }}>—</span>}</td>
                    <td>{incident.ministere || <span style={{ color: "var(--bo-ink-muted)" }}>—</span>}</td>
                    <td>{incident.type}</td>
                    <td>
                      <span className={`status-pill ${incident.statut === "KO" ? "pill-ko" : "pill-warn"}`}>
                        {incident.statut}
                      </span>
                    </td>
                    <td className="alerte-cell">{formaterDateHeure(incident.debutLe)}</td>
                    <td className="alerte-cell">
                      {incident.enCours
                        ? <span className="status-pill pill-ko">En cours</span>
                        : formaterDateHeure(incident.finLe)}
                    </td>
                    <td className="alerte-cell">{formaterDureeMinutes(incident.dureeMinutes)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="pagination-bar">
              <div className="pagination-info">
                Page <strong>{pageAffichee}</strong> sur <strong>{totalPages}</strong> — <strong>{totalElements}</strong> incident(s)
              </div>
              <div className="pagination-controls">
                <button className="pagination-btn" onClick={() => setPage((p) => p - 1)} disabled={pageAffichee === 1}>
                  <ChevronLeft size={13} /> Précédent
                </button>
                {numerosPagesAffiches(pageAffichee, totalPages).map((n, idx) =>
                  n === "..." ? (
                    <span key={`e${idx}`} className="pagination-ellipsis">…</span>
                  ) : (
                    <button key={n} className={`pagination-btn ${n === pageAffichee ? "pagination-btn-active" : ""}`}
                      onClick={() => setPage(n - 1)}>{n}</button>
                  )
                )}
                <button className="pagination-btn" onClick={() => setPage((p) => p + 1)} disabled={pageAffichee === totalPages}>
                  Suivant <ChevronRight size={13} />
                </button>
              </div>
            </div>
          </>
        )}

        {!chargement && incidents.length === 0 && <p>Aucune alerte ne correspond à ces filtres.</p>}
      </div>
    </>
  );
}

// ---- Onglet "Incidents iTop" - tickets du helpdesk, synchronises
// localement toutes les 10 min (cf. ItopSyncScheduler cote backend). Pas
// de notion de type (ANPTIC/LAN) ni de site precis ici, cf.
// ItopTicketHistoriqueDto. ----
function OngletIncidentsItop({ getAuthHeader, ministeres }) {
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState({ total: 0, ongoing: 0, resolved: 0, closed: 0 });
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  const [erreur, setErreur] = useState(null);
  const [chargement, setChargement] = useState(true);

  const [periode, setPeriode] = useState(30);
  const [date, setDate] = useState("");
  const [statut, setStatut] = useState("");
  const [ministere, setMinistere] = useState("");
  const [recherche, setRecherche] = useState("");
  const [rechercheSaisie, setRechercheSaisie] = useState("");

  function construireParamsFiltres() {
    const params = new URLSearchParams();
    if (date) {
      params.set("date", date);
    } else {
      params.set("jours", periode);
    }
    if (statut) params.set("statut", statut);
    if (ministere) params.set("ministere", ministere);
    if (recherche) params.set("recherche", recherche);
    return params;
  }

  function charger() {
    setChargement(true);
    const params = construireParamsFiltres();
    params.set("page", page);
    params.set("taille", TAILLE_PAGE);

    adminGet(`/backoffice/api/v1/incidents/itop-historique?${params.toString()}`, getAuthHeader())
      .then((data) => {
        setTickets(data.tickets);
        setStats(data.stats);
        setTotalPages(data.totalPages);
        setTotalElements(data.totalElements);
        setErreur(null);
      })
      .catch((err) => setErreur(err.message))
      .finally(() => setChargement(false));
  }

  const [exportEnCours, setExportEnCours] = useState(false);

  function exporter() {
    setExportEnCours(true);
    const params = construireParamsFiltres();
    adminGetFichier(`/backoffice/api/v1/incidents/itop-historique/export?${params.toString()}`, getAuthHeader())
      .then(({ blob, nomFichier }) => declencherTelechargement(blob, nomFichier))
      .catch((err) => setErreur(err.message))
      .finally(() => setExportEnCours(false));
  }

  useEffect(() => { charger(); }, [periode, date, statut, ministere, recherche, page]);

  function onChangePeriode(valeur) { setPage(0); setPeriode(valeur); }
  function onChangeDate(valeur) { setPage(0); setDate(valeur); }
  function onChangeStatut(valeur) { setPage(0); setStatut(valeur); }
  function onChangeMinistere(valeur) { setPage(0); setMinistere(valeur); }

  function soumettreRecherche(e) {
    e.preventDefault();
    setPage(0);
    setRecherche(rechercheSaisie.trim());
  }

  function effacerFiltres() {
    setPeriode(30); setDate(""); setStatut(""); setMinistere("");
    setRecherche(""); setRechercheSaisie("");
    setPage(0);
  }

  const aDesFiltres = date || statut || ministere || recherche || periode !== 30;
  const pageAffichee = page + 1;

  const pctOngoing = stats.total > 0 ? Math.round((stats.ongoing / stats.total) * 100) : 0;
  const pctResolved = stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0;
  const pctClosed = stats.total > 0 ? Math.round((stats.closed / stats.total) * 100) : 0;

  return (
    <>
      <ErrorBanner message={erreur} onRetry={charger} />

      <div className="eq-stats-section">
        <h2 className="eq-stats-title">Répartition des tickets iTop</h2>
        <div className="eq-stats-grid">
          <div className="eq-stat-card" style={{ borderTop: "3px solid #0A3D7A" }}>
            <div className="eq-stat-icon"><ClipboardList size={20} /></div>
            <div style={{ flex: 1 }}>
              <div className="eq-stat-label">TOTAL SUR LA PÉRIODE</div>
              <div className="eq-stat-value">{stats.total.toLocaleString("fr-FR")}</div>
              <div className="eq-stat-bar">
                <div className="eq-stat-bar-fill" style={{ width: "100%", background: "#0A3D7A" }}></div>
              </div>
              <div className="eq-stat-pct">100%</div>
            </div>
          </div>
          <div className="eq-stat-card" style={{ borderTop: "3px solid var(--bo-ko)" }}>
            <div className="eq-stat-icon"><Clock size={20} /></div>
            <div style={{ flex: 1 }}>
              <div className="eq-stat-label">EN COURS</div>
              <div className="eq-stat-value">{stats.ongoing.toLocaleString("fr-FR")}</div>
              <div className="eq-stat-bar">
                <div className="eq-stat-bar-fill" style={{ width: `${pctOngoing}%`, background: "var(--bo-ko)" }}></div>
              </div>
              <div className="eq-stat-pct">{pctOngoing}%</div>
            </div>
          </div>
          <div className="eq-stat-card" style={{ borderTop: "3px solid var(--bo-warn)" }}>
            <div className="eq-stat-icon"><TriangleAlert size={20} /></div>
            <div style={{ flex: 1 }}>
              <div className="eq-stat-label">RÉSOLUS</div>
              <div className="eq-stat-value">{stats.resolved.toLocaleString("fr-FR")}</div>
              <div className="eq-stat-bar">
                <div className="eq-stat-bar-fill" style={{ width: `${pctResolved}%`, background: "var(--bo-warn)" }}></div>
              </div>
              <div className="eq-stat-pct">{pctResolved}%</div>
            </div>
          </div>
          <div className="eq-stat-card" style={{ borderTop: "3px solid #0D9B5A" }}>
            <div className="eq-stat-icon"><Check size={20} /></div>
            <div style={{ flex: 1 }}>
              <div className="eq-stat-label">CLÔTURÉS</div>
              <div className="eq-stat-value">{stats.closed.toLocaleString("fr-FR")}</div>
              <div className="eq-stat-bar">
                <div className="eq-stat-bar-fill" style={{ width: `${pctClosed}%`, background: "#0D9B5A" }}></div>
              </div>
              <div className="eq-stat-pct">{pctClosed}%</div>
            </div>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header" style={{ flexWrap: "wrap", gap: "8px" }}>
          <h2><Siren size={16} className="panel-title-icon" /> Incidents iTop <span className="attention-count" style={{ background: "var(--bo-primary)" }}>{totalElements}</span></h2>
          <div className="panel-header-actions" style={{ flexWrap: "wrap", gap: "8px" }}>

            <div className="cascade-group">
              <label className="cascade-label">Période</label>
              <SearchableSelect selectClassName="attention-search" value={periode} disabled={!!date}
                onChange={(e) => onChangePeriode(Number(e.target.value))}>
                {PERIODES.map((p) => <option key={p.valeur} value={p.valeur}>{p.label}</option>)}
              </SearchableSelect>
            </div>

            <div className="cascade-group">
              <label className="cascade-label">Date précise</label>
              <input type="date" className="attention-search" value={date}
                onChange={(e) => onChangeDate(e.target.value)} />
            </div>

            <div className="cascade-group">
              <label className="cascade-label">Statut</label>
              <SearchableSelect selectClassName="attention-search" value={statut} onChange={(e) => onChangeStatut(e.target.value)}>
                <option value="">Tous</option>
                <option value="ongoing">En cours</option>
                <option value="resolved">Résolu</option>
                <option value="closed">Clôturé</option>
              </SearchableSelect>
            </div>

            <div className="cascade-group">
              <label className="cascade-label">Ministère</label>
              <SearchableSelect selectClassName="attention-search" value={ministere} onChange={(e) => onChangeMinistere(e.target.value)}>
                <option value="">Tous les ministères</option>
                {ministeres.map((m) => <option key={m} value={m}>{m}</option>)}
              </SearchableSelect>
            </div>

            <div className="cascade-group">
              <label className="cascade-label">Référence ou titre</label>
              <form onSubmit={soumettreRecherche} style={{ display: "flex", gap: "6px" }}>
                <input className="attention-search" style={{ minWidth: "160px" }}
                  value={rechercheSaisie} onChange={(e) => setRechercheSaisie(e.target.value)}
                  placeholder="Rechercher..." />
                <button type="submit" className="btn-primary">OK</button>
              </form>
            </div>

            {aDesFiltres && (
              <button className="btn-outline" onClick={effacerFiltres} style={{ alignSelf: "flex-end" }}>
                <X size={13} /> Effacer
              </button>
            )}

            <button className="btn-primary" onClick={exporter} disabled={exportEnCours}
              style={{ alignSelf: "flex-end" }}>
              {exportEnCours ? "Export..." : <><Download size={13} /> Exporter (CSV)</>}
            </button>
          </div>
        </div>

        {date && (
          <p style={{ color: "var(--bo-ink-muted)", marginTop: "-4px", marginBottom: "10px" }}>
            Filtre par date actif ({new Date(date).toLocaleDateString("fr-FR")}) : la période ci-dessus est ignorée.
          </p>
        )}

        {chargement && <p>Chargement...</p>}

        {!chargement && tickets.length > 0 && (
          <>
            <table className="admin-table attention-table">
              <thead>
                <tr>
                  <th>RÉFÉRENCE</th>
                  <th>TITRE</th>
                  <th>MINISTÈRE</th>
                  <th>STATUT</th>
                  <th>DÉBUT</th>
                  <th>CLÔTURE</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => {
                  const { classe, libelle } = infosStatutItop(ticket.statut);
                  return (
                    <tr key={ticket.id}>
                      <td className="site-name-cell">{ticket.ref}</td>
                      <td>{ticket.titre}</td>
                      <td>{ticket.ministere || <span style={{ color: "var(--bo-ink-muted)" }}>—</span>}</td>
                      <td><span className={`status-pill ${classe}`}>{libelle}</span></td>
                      <td className="alerte-cell">{formaterDateHeure(ticket.survenuLe)}</td>
                      <td className="alerte-cell">
                        {ticket.cloture
                          ? formaterDateHeure(ticket.clotureLe)
                          : <span className="status-pill pill-ko">En cours</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="pagination-bar">
              <div className="pagination-info">
                Page <strong>{pageAffichee}</strong> sur <strong>{totalPages}</strong> — <strong>{totalElements}</strong> ticket(s)
              </div>
              <div className="pagination-controls">
                <button className="pagination-btn" onClick={() => setPage((p) => p - 1)} disabled={pageAffichee === 1}>
                  <ChevronLeft size={13} /> Précédent
                </button>
                {numerosPagesAffiches(pageAffichee, totalPages).map((n, idx) =>
                  n === "..." ? (
                    <span key={`e${idx}`} className="pagination-ellipsis">…</span>
                  ) : (
                    <button key={n} className={`pagination-btn ${n === pageAffichee ? "pagination-btn-active" : ""}`}
                      onClick={() => setPage(n - 1)}>{n}</button>
                  )
                )}
                <button className="pagination-btn" onClick={() => setPage((p) => p + 1)} disabled={pageAffichee === totalPages}>
                  Suivant <ChevronRight size={13} />
                </button>
              </div>
            </div>
          </>
        )}

        {!chargement && tickets.length === 0 && <p>Aucun ticket iTop ne correspond à ces filtres.</p>}
      </div>
    </>
  );
}

export default IncidentsHistoriquePage;
