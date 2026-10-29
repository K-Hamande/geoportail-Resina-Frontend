import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useAuth } from "../shared/AuthContext";
import { adminGet, adminDelete } from "../shared/backofficeApiClient";
import Topbar from "./Topbar";
import SearchableSelect from "../shared/SearchableSelect";
import ErrorBanner from "../shared/ErrorBanner";

const PERIODES = [
  { valeur: "", label: "Toutes les périodes" },
  { valeur: 7, label: "7 derniers jours" },
  { valeur: 30, label: "30 derniers jours" },
  { valeur: 90, label: "90 derniers jours" },
];

function NotificationsAdminPage() {
  const { getAuthHeader } = useAuth();
  const [sites, setSites] = useState([]);
  const [ministeres, setMinisteres] = useState([]);
  const [villes, setVilles] = useState([]);

  const [siteFiltre, setSiteFiltre] = useState("");
  const [ministereFiltre, setMinistereFiltre] = useState("");
  const [villeFiltre, setVilleFiltre] = useState("");
  const [periode, setPeriode] = useState("");
  const [date, setDate] = useState("");

  const [tokens, setTokens] = useState([]);
  const [erreur, setErreur] = useState(null);
  const [chargement, setChargement] = useState(false);

  useEffect(() => {
    adminGet("/backoffice/api/v1/sites", getAuthHeader()).then(setSites).catch((err) => setErreur(err.message));
    adminGet("/backoffice/api/v1/ministry-tokens/ministeres", getAuthHeader()).then(setMinisteres).catch(() => {});
    adminGet("/backoffice/api/v1/sites/equipments/cascade?niveau=villes", getAuthHeader()).then(setVilles).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // BUG CORRIGE : rafraichissement deja effectif (reel appel API + mise a
  // jour de "tokens"), mais sans etat "chargement" transmis au Topbar, le
  // bouton ne donnait aucun retour visuel - cf. meme correctif que
  // MonProfilPage.jsx/DecideurUsersPage.jsx.
  function charger() {
    setChargement(true);
    const params = new URLSearchParams();
    if (siteFiltre) params.set("siteId", siteFiltre);
    if (ministereFiltre) params.set("ministere", ministereFiltre);
    if (villeFiltre) params.set("ville", villeFiltre);
    if (date) params.set("date", date);
    else if (periode) params.set("jours", periode);

    adminGet(`/backoffice/api/v1/notifications?${params.toString()}`, getAuthHeader())
      .then(setTokens)
      .catch((err) => setErreur(err.message))
      .finally(() => setChargement(false));
  }

  useEffect(() => {
    charger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteFiltre, ministereFiltre, villeFiltre, periode, date]);

  function onChangeDate(valeur) {
    setDate(valeur);
    if (valeur) setPeriode("");
  }

  function onChangePeriode(valeur) {
    setPeriode(valeur);
    if (valeur) setDate("");
  }

  function effacerFiltres() {
    setSiteFiltre(""); setMinistereFiltre(""); setVilleFiltre(""); setPeriode(""); setDate("");
  }

  const aDesFiltres = siteFiltre || ministereFiltre || villeFiltre || periode || date;

  async function supprimer(id) {
    try {
      await adminDelete(`/backoffice/api/v1/notifications/${id}`, getAuthHeader());
      charger();
    } catch (err) {
      setErreur(err.message);
    }
  }

  return (
    <>
      <Topbar title="Notifications push" subtitle="Enregistrement et suppression des destinataires par site" onRefresh={charger} chargement={chargement} />

      <div className="backoffice-content">
        <ErrorBanner message={erreur} onRetry={charger} />

        <div className="panel">
          <div className="panel-header" style={{ flexWrap: "wrap", gap: "8px" }}>
            <h2>Destinataires enregistrés</h2>
            <div className="panel-header-actions" style={{ flexWrap: "wrap", gap: "8px" }}>
              <div className="cascade-group">
                <label className="cascade-label">Ministère</label>
                <SearchableSelect selectClassName="attention-search" value={ministereFiltre} onChange={(e) => setMinistereFiltre(e.target.value)}>
                  <option value="">Tous les ministères</option>
                  {ministeres.map((m) => <option key={m} value={m}>{m}</option>)}
                </SearchableSelect>
              </div>

              <div className="cascade-group">
                <label className="cascade-label">Site</label>
                <SearchableSelect selectClassName="attention-search" value={siteFiltre} onChange={(e) => setSiteFiltre(e.target.value)}>
                  <option value="">Tous les sites</option>
                  {sites.map((site) => (
                    <option key={site.siteId} value={site.siteId}>{site.nom}</option>
                  ))}
                </SearchableSelect>
              </div>

              <div className="cascade-group">
                <label className="cascade-label">Ville</label>
                <SearchableSelect selectClassName="attention-search" value={villeFiltre} onChange={(e) => setVilleFiltre(e.target.value)}>
                  <option value="">Toutes les villes</option>
                  {villes.map((v) => <option key={v} value={v}>{v}</option>)}
                </SearchableSelect>
              </div>

              <div className="cascade-group">
                <label className="cascade-label">Période</label>
                <SearchableSelect selectClassName="attention-search" value={periode} disabled={!!date}
                  onChange={(e) => onChangePeriode(e.target.value)}>
                  {PERIODES.map((p) => <option key={p.valeur} value={p.valeur}>{p.label}</option>)}
                </SearchableSelect>
              </div>

              <div className="cascade-group">
                <label className="cascade-label">Date précise</label>
                <input type="date" className="attention-search" value={date}
                  onChange={(e) => onChangeDate(e.target.value)} />
              </div>

              {aDesFiltres && (
                <button className="btn-outline" onClick={effacerFiltres} style={{ alignSelf: "flex-end" }}>
                  <X size={13} /> Effacer
                </button>
              )}
            </div>
          </div>

          {date && (
            <p style={{ color: "var(--bo-ink-muted)", marginTop: "-4px", marginBottom: "10px" }}>
              Filtre par date actif ({new Date(date).toLocaleDateString("fr-FR")}) : la période ci-dessus est ignorée.
            </p>
          )}

          <table className="admin-table">
            <thead>
              <tr>
                <th>Profil</th>
                <th>Site</th>
                <th>Ville</th>
                <th>Ministère</th>
                <th>Navigateur / appareil</th>
                <th>Enregistré le</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tokens.map((t) => (
                <tr key={t.id}>
                  <td className="site-name-cell">{t.profil}</td>
                  <td>{t.siteNom}</td>
                  <td>{t.ville || <span style={{ color: "var(--bo-ink-muted)" }}>—</span>}</td>
                  <td>{t.ministere || <span style={{ color: "var(--bo-ink-muted)" }}>—</span>}</td>
                  <td>{t.endpointMasque}</td>
                  <td>{new Date(t.enregistreLe).toLocaleDateString("fr-FR")}</td>
                  <td>
                    <span className={`status-badge ${t.actif ? "badge-ok" : "badge-unknown"}`}>
                      {t.actif ? "Actif" : "Expiré"}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-danger" style={{ color: "white" }} onClick={() => supprimer(t.id)}>
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {tokens.length === 0 && <p>Aucun destinataire enregistré pour ce filtre.</p>}
        </div>
      </div>
    </>
  );
}

export default NotificationsAdminPage;
