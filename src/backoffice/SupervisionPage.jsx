import { useEffect, useState } from "react";
import { useAuth } from "../shared/AuthContext";
import { adminGet, adminPut, adminDelete } from "../shared/backofficeApiClient";
import Topbar from "./Topbar";
import SearchableSelect from "../shared/SearchableSelect";

// §3.2.6b du CDC : configuration des parametres de supervision par site
// (intervalle d'actualisation, seuils d'alerte, notifications push par
// evenement). Les sites non personnalises utilisent les valeurs par
// defaut renvoyees par le backend (badge "Défaut").
function SupervisionPage() {
  const { getAuthHeader } = useAuth();
  const [settings, setSettings] = useState([]);
  const [recherche, setRecherche] = useState("");
  const [siteId, setSiteId] = useState(null);
  const [brouillon, setBrouillon] = useState(null);
  const [erreur, setErreur] = useState(null);
  const [message, setMessage] = useState(null);

  function charger() {
    adminGet("/backoffice/api/v1/supervision", getAuthHeader())
      .then((data) => {
        setSettings(data);
        if (data.length > 0 && !siteId) {
          setSiteId(data[0].siteId);
          setBrouillon(data[0]);
        }
      })
      .catch((err) => setErreur(err.message));
  }

  useEffect(() => {
    charger();
  }, []);

  useEffect(() => {
    const s = settings.find((x) => x.siteId === siteId);
    if (s) setBrouillon({ ...s });
    setMessage(null);
  }, [siteId]);

  const sitesFiltres = settings.filter((s) => {
    const texte = recherche.trim().toLowerCase();
    if (!texte) return true;
    return s.siteNom.toLowerCase().includes(texte) || s.ville.toLowerCase().includes(texte);
  });

  useEffect(() => {
    if (sitesFiltres.length === 0) return;
    if (!sitesFiltres.some((s) => s.siteId === siteId)) {
      setSiteId(sitesFiltres[0].siteId);
    }
  }, [recherche, settings]);

  function modifier(champ, valeur) {
    setBrouillon((prev) => ({ ...prev, [champ]: valeur }));
  }

  async function enregistrer() {
    setErreur(null);
    setMessage(null);
    try {
      await adminPut(`/backoffice/api/v1/supervision/${siteId}`, getAuthHeader(), {
        intervalleActualisationS: Number(brouillon.intervalleActualisationS),
        debitMinimalMbps: Number(brouillon.debitMinimalMbps),
        latenceMaximaleMs: Number(brouillon.latenceMaximaleMs),
        notificationsActives: brouillon.notificationsActives,
        notifPanneAnptic: brouillon.notifPanneAnptic,
        notifPanneLan: brouillon.notifPanneLan,
        notifRetablissement: brouillon.notifRetablissement,
      });
      setMessage("Paramètres enregistrés.");
      charger();
    } catch (err) {
      setErreur(err.message);
    }
  }

  async function reinitialiser() {
    setErreur(null);
    setMessage(null);
    try {
      await adminDelete(`/backoffice/api/v1/supervision/${siteId}`, getAuthHeader());
      setMessage("Paramètres réinitialisés aux valeurs par défaut.");
      charger();
    } catch (err) {
      setErreur(err.message);
    }
  }

  if (!brouillon) {
    return (
      <>
        <Topbar title="Paramètres supervision" subtitle="Seuils d'alerte et intervalles par site" onRefresh={charger} />
        <div className="backoffice-content"><p>Chargement...</p></div>
      </>
    );
  }

  return (
    <>
      <Topbar title="Paramètres supervision" subtitle="Seuils d'alerte, intervalle d'actualisation et notifications par site" onRefresh={charger} />

      <div className="backoffice-content">
        {erreur && <p style={{ color: "var(--color-ko)" }}>Erreur : {erreur}</p>}
        {message && <p style={{ color: "var(--color-ok)" }}>{message}</p>}

        <div className="panel">
          <div className="panel-header">
            <div className="form-field" style={{ maxWidth: "280px", marginBottom: 0 }}>
              <label>Rechercher un site</label>
              <input type="text" placeholder="Nom ou ville…" value={recherche} onChange={(e) => setRecherche(e.target.value)} />
            </div>
            <div className="form-field" style={{ maxWidth: "320px", marginBottom: 0 }}>
              <label>Site ({sitesFiltres.length})</label>
              <SearchableSelect value={siteId || ""} onChange={(e) => setSiteId(e.target.value)}>
                {sitesFiltres.map((s) => (
                  <option key={s.siteId} value={s.siteId}>{s.siteNom} — {s.ville}</option>
                ))}
              </SearchableSelect>
            </div>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <span className={`status-badge ${brouillon.personnalise ? "badge-ok" : "badge-unknown"}`}>
              {brouillon.personnalise ? "Paramètres personnalisés" : "Valeurs par défaut"}
            </span>
          </div>

          <h2 style={{ fontSize: "15px", marginBottom: "12px" }}>Seuils et actualisation</h2>
          <div className="form-grid">
            <div className="form-field">
              <label>Intervalle d'actualisation (secondes)</label>
              <input type="number" min="10" value={brouillon.intervalleActualisationS} onChange={(e) => modifier("intervalleActualisationS", e.target.value)} />
            </div>
            <div className="form-field">
              <label>Débit minimal acceptable (Mbps)</label>
              <input type="number" step="0.1" min="0" value={brouillon.debitMinimalMbps} onChange={(e) => modifier("debitMinimalMbps", e.target.value)} />
              <span className="field-hint">En dessous, la liaison est signalée « dégradée »</span>
            </div>
            <div className="form-field">
              <label>Latence maximale acceptable (ms)</label>
              <input type="number" step="1" min="0" value={brouillon.latenceMaximaleMs} onChange={(e) => modifier("latenceMaximaleMs", e.target.value)} />
            </div>
          </div>

          <h2 style={{ fontSize: "15px", margin: "20px 0 12px" }}>Notifications push</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
              <input type="checkbox" checked={brouillon.notificationsActives} onChange={(e) => modifier("notificationsActives", e.target.checked)} />
              Notifications activées pour ce site
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", opacity: brouillon.notificationsActives ? 1 : 0.5 }}>
              <input type="checkbox" checked={brouillon.notifPanneAnptic} disabled={!brouillon.notificationsActives} onChange={(e) => modifier("notifPanneAnptic", e.target.checked)} />
              Alerter en cas de panne ANPTIC (liaison WAN)
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", opacity: brouillon.notificationsActives ? 1 : 0.5 }}>
              <input type="checkbox" checked={brouillon.notifPanneLan} disabled={!brouillon.notificationsActives} onChange={(e) => modifier("notifPanneLan", e.target.checked)} />
              Alerter en cas de panne LAN (réseau du bâtiment)
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", opacity: brouillon.notificationsActives ? 1 : 0.5 }}>
              <input type="checkbox" checked={brouillon.notifRetablissement} disabled={!brouillon.notificationsActives} onChange={(e) => modifier("notifRetablissement", e.target.checked)} />
              Alerter au rétablissement
            </label>
          </div>

          <div className="modal-actions" style={{ justifyContent: "flex-start", marginTop: "20px", gap: "10px" }}>
            <button className="btn-primary" onClick={enregistrer}>Enregistrer</button>
            {brouillon.personnalise && (
              <button className="btn-secondary" onClick={reinitialiser}>Réinitialiser aux valeurs par défaut</button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default SupervisionPage;