import { useEffect, useState } from "react";
import { Bell, TriangleAlert, CheckCircle2, XCircle } from "lucide-react";
import { apiGet, apiPost } from "../shared/apiClient";
import { formaterTempsRelatif } from "../shared/timeFormat";
import { useSiteSelection } from "../shared/SiteSelectionContext";
import ErrorBanner from "../shared/ErrorBanner";
import DecideurLayout from "./DecideurLayout";
import {
  pushEstSupporte,
  permissionPushActuelle,
  abonnementPushExistant,
  activerPushPourSites,
} from "../shared/pushNotifications";

const CLE_LUS = "resina-alertes-lues";
const CLE_BANNIERE_MASQUEE = "resina-banniere-masquee";

function chargerIdsLus() {
  try {
    return new Set(JSON.parse(localStorage.getItem(CLE_LUS) ?? "[]"));
  } catch {
    return new Set();
  }
}

// Les alertes viennent desormais des tickets iTop (statut operational_status
// brut : "ongoing"/"resolved"/"closed"), pas des statuts ANPTIC/LAN
// calcules depuis NetXMS - plus de siteNom/ville/type fiables, seulement
// le ministere (cf. TicketIncidentDto cote backend).
function infosStatut(statut) {
  if (statut === "ongoing") return { classe: "badge-ko", Icone: XCircle, libelle: "En cours" };
  if (statut === "resolved") return { classe: "badge-warn", Icone: TriangleAlert, libelle: "Résolu" };
  return { classe: "badge-ok", Icone: CheckCircle2, libelle: "Clôturé" };
}

function AlertesPage() {
  const { sites } = useSiteSelection();
  const [incidents, setIncidents] = useState([]);
  const [erreur, setErreur] = useState(null);
  const [idsLus, setIdsLus] = useState(chargerIdsLus);
  const [alertesActivees, setAlertesActivees] = useState(false);
  const [banniereVisible, setBanniereVisible] = useState(
    sessionStorage.getItem(CLE_BANNIERE_MASQUEE) !== "true"
  );
  const [pushActif, setPushActif] = useState(false);
  const [pushEnCours, setPushEnCours] = useState(false);
  const [pushErreur, setPushErreur] = useState(null);
  const [nonLuesUniquement, setNonLuesUniquement] = useState(false);

  function charger() {
    apiGet("/api/v1/incidents").then(setIncidents).catch((err) => setErreur(err.message));
  }

  useEffect(() => {
    charger();
    const intervalle = setInterval(charger, 30000);

    // Etat reel de la preference (persistant, cote serveur) - si le
    // decideur a deja active les alertes sur un autre appareil/session,
    // le bandeau ne doit pas reapparaitre.
    apiGet("/api/v1/decideur/alertes")
      .then((pref) => setAlertesActivees(pref.activees))
      .catch(() => {});

    abonnementPushExistant().then(setPushActif);

    return () => clearInterval(intervalle);
  }, []);

  async function activerPush() {
    setPushErreur(null);
    setPushEnCours(true);
    try {
      await activerPushPourSites(sites.map((s) => s.siteId), "Décideur");
      setPushActif(true);
    } catch (err) {
      setPushErreur(err.message);
    } finally {
      setPushEnCours(false);
    }
  }

  function marquerCommeLu(ref) {
    const nouveaux = new Set(idsLus);
    nouveaux.add(ref);
    setIdsLus(nouveaux);
    localStorage.setItem(CLE_LUS, JSON.stringify([...nouveaux]));
  }

  function toutMarquerLu() {
    const tousLesRefs = new Set(incidents.map((i) => i.ref));
    setIdsLus(tousLesRefs);
    localStorage.setItem(CLE_LUS, JSON.stringify([...tousLesRefs]));
  }

  function activerAlertes() {
    apiPost("/api/v1/decideur/alertes/activer")
      .then((pref) => {
        setAlertesActivees(pref.activees);
        setBanniereVisible(false);
      })
      .catch((err) => setErreur(err.message));
  }

  function plusTard() {
    sessionStorage.setItem(CLE_BANNIERE_MASQUEE, "true");
    setBanniereVisible(false);
  }

  const nonLus = incidents.filter((i) => !idsLus.has(i.ref)).length;
  const incidentsAffiches = nonLuesUniquement
    ? incidents.filter((i) => !idsLus.has(i.ref))
    : incidents;

  return (
    <DecideurLayout>
      <ErrorBanner message={erreur} onRetry={charger} />

      {!alertesActivees && banniereVisible && (
        <div className="alert-banner">
          <p style={{ fontWeight: 700 }}>Activer les alertes par email</p>
          <p>Recevez un email dès qu'une panne survient sur un site de votre ministère, même lorsque l'application est fermée.</p>
          <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
            <button className="btn-primary" onClick={activerAlertes}>Activer</button>
            <button className="btn-secondary" onClick={plusTard}>Plus tard</button>
          </div>
        </div>
      )}

      {pushEstSupporte() && permissionPushActuelle() !== "denied" && (
        <div className="alert-banner">
          {pushActif ? (
            <p style={{ display: "flex", alignItems: "center", gap: "6px" }}><Bell size={15} /> Notifications activées sur cet appareil.</p>
          ) : (
            <>
              <p style={{ fontWeight: 700 }}>Activer les notifications sur cet appareil</p>
              <p>Recevez une notification instantanée dès qu'une panne (ou un rétablissement) survient, directement sur ce navigateur.</p>
              {pushErreur && <p style={{ color: "var(--color-ko)" }}>{pushErreur}</p>}
              <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                <button className="btn-primary" onClick={activerPush} disabled={pushEnCours}>
                  {pushEnCours ? "Activation..." : "Activer"}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      <div className="alertes-header-row">
        <div className="floors-title" style={{ marginBottom: 0 }}>
          Alertes récentes ({nonLus})
        </div>
        {incidents.length > 0 && (
          <button className="btn-link" onClick={toutMarquerLu}>Tout marquer lu</button>
        )}
      </div>

      {incidents.length > 0 && (
        <label style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "12px", fontSize: "13px" }}>
          <input
            type="checkbox"
            checked={nonLuesUniquement}
            onChange={(e) => setNonLuesUniquement(e.target.checked)}
          />
          N'afficher que les alertes non lues
        </label>
      )}

      {incidents.length === 0 && <p>Aucune alerte pour le moment.</p>}
      {incidents.length > 0 && incidentsAffiches.length === 0 && (
        <p>Aucune alerte non lue.</p>
      )}

      {/* .alerts-grid : liste empilee sur mobile, grille a 2/3 colonnes a
          partir de la tablette/desktop (voir index.css) - utile vu le
          volume potentiel d'incidents sur un reseau de cette taille. */}
      <div className="alerts-grid">
        {incidentsAffiches.map((incident) => {
          const { classe, Icone, libelle } = infosStatut(incident.statut);
          const lu = idsLus.has(incident.ref);

          return (
            <div
              key={incident.ref}
              className={`status-card alert-card ${lu ? "alert-card-lu" : ""}`}
              onClick={() => marquerCommeLu(incident.ref)}
            >
              <div className="card-top">
                <div className="card-icon" style={{ position: "relative" }}>
                  <Icone size={19} />
                  {!lu && <span className="unread-dot"></span>}
                </div>
                <div className="card-titles">
                  <div className="card-title">{incident.titre}</div>
                  <div className="card-subtitle">{incident.ministere}</div>
                </div>
                <span className={`status-badge ${classe}`}>
                  <Icone size={12} strokeWidth={3} /> {libelle}
                </span>
              </div>

              <div className="alert-meta">
                <span className="alert-time">{incident.ref} · {formaterTempsRelatif(incident.survenuLe)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </DecideurLayout>
  );
}

export default AlertesPage;