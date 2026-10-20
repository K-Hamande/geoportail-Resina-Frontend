import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, Globe, Building2, TriangleAlert, CheckCircle2, XCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { apiGet, apiPost } from "../shared/apiClient";
import { getStatusColor, getStatusLabel, getStatusIcon } from "../shared/statusStyles";
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
const TAILLE_PAGE = 9;

function chargerIdsLus() {
  try {
    return new Set(JSON.parse(localStorage.getItem(CLE_LUS) ?? "[]"));
  } catch {
    return new Set();
  }
}

function badgeClassReseau(status) {
  if (status === "KO") return "badge-ko";
  if (status === "WARN") return "badge-warn";
  return "badge-ok";
}

// Statut brut d'un ticket iTop (operational_status) - distinct de
// NodeStatus (OK/WARN/KO) utilise pour les alertes reseau ci-dessus.
function infosStatutItop(statut) {
  if (statut === "ongoing") return { classe: "badge-ko", Icone: XCircle, libelle: "En cours" };
  if (statut === "resolved") return { classe: "badge-warn", Icone: TriangleAlert, libelle: "Résolu" };
  return { classe: "badge-ok", Icone: CheckCircle2, libelle: "Clôturé" };
}

// Charge une liste depuis l'API avec rafraichissement periodique (30s) et
// resilience face a un echec passager (ex: 429 "trop de requetes") : un
// rafraichissement en arriere-plan qui echoue ne remplace pas une liste
// deja chargee avec succes par un ecran d'erreur - seul un echec AVANT
// tout succes affiche l'erreur. Factorise ici car utilise a l'identique
// pour les 2 sections de cette page (alertes reseau + incidents iTop).
function useListeAvecRafraichissement(url) {
  const [donnees, setDonnees] = useState([]);
  const [erreur, setErreur] = useState(null);
  const aChargeAvecSucces = useRef(false);

  const charger = useCallback(() => {
    apiGet(url)
      .then((data) => {
        setDonnees(data);
        setErreur(null);
        aChargeAvecSucces.current = true;
      })
      .catch((err) => {
        if (!aChargeAvecSucces.current) setErreur(err.message);
      });
  }, [url]);

  useEffect(() => {
    charger();
    const intervalle = setInterval(charger, 30000);
    return () => clearInterval(intervalle);
  }, [charger]);

  return { donnees, erreur, charger };
}

function AlertesPage() {
  const { choisirSite, sites } = useSiteSelection();
  const { donnees: alertesReseau, erreur: erreurReseau, charger: chargerReseau } =
    useListeAvecRafraichissement("/api/v1/alertes-reseau");
  const { donnees: incidentsItop, erreur: erreurItop, charger: chargerItop } =
    useListeAvecRafraichissement("/api/v1/incidents");

  const [idsLus, setIdsLus] = useState(chargerIdsLus);
  const [alertesActivees, setAlertesActivees] = useState(false);
  const [banniereVisible, setBanniereVisible] = useState(
    sessionStorage.getItem(CLE_BANNIERE_MASQUEE) !== "true"
  );
  const [pushActif, setPushActif] = useState(false);
  const [pushEnCours, setPushEnCours] = useState(false);
  const [pushErreur, setPushErreur] = useState(null);
  const [nonLuesUniquement, setNonLuesUniquement] = useState(false);
  const [onglet, setOnglet] = useState("reseau"); // "reseau" | "itop"
  const [pageReseau, setPageReseau] = useState(1);
  const [pageItop, setPageItop] = useState(1);

  // Retour a la page 1 des que le filtre "non lues uniquement" change le
  // nombre de resultats - sinon on peut se retrouver sur une page vide.
  useEffect(() => {
    setPageReseau(1);
    setPageItop(1);
  }, [nonLuesUniquement]);

  useEffect(() => {
    apiGet("/api/v1/decideur/alertes")
      .then((pref) => setAlertesActivees(pref.activees))
      .catch(() => {});

    abonnementPushExistant().then(setPushActif);
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

  function marquerCommeLu(id) {
    const nouveaux = new Set(idsLus);
    nouveaux.add(id);
    setIdsLus(nouveaux);
    localStorage.setItem(CLE_LUS, JSON.stringify([...nouveaux]));
  }

  // Ne marque comme lu que l'onglet actuellement affiche - l'utilisateur
  // regarde une seule liste a la fois, "tout marquer lu" ne doit pas
  // affecter l'autre liste qu'il n'a pas sous les yeux.
  function toutMarquerLu() {
    const idsOngletActif = onglet === "reseau"
      ? alertesReseau.map((a) => a.id)
      : incidentsItop.map((i) => i.ref);
    const nouveaux = new Set([...idsLus, ...idsOngletActif]);
    setIdsLus(nouveaux);
    localStorage.setItem(CLE_LUS, JSON.stringify([...nouveaux]));
  }

  function activerAlertes() {
    apiPost("/api/v1/decideur/alertes/activer")
      .then((pref) => {
        setAlertesActivees(pref.activees);
        setBanniereVisible(false);
      })
      .catch(() => {});
  }

  function plusTard() {
    sessionStorage.setItem(CLE_BANNIERE_MASQUEE, "true");
    setBanniereVisible(false);
  }

  const totalItems = alertesReseau.length + incidentsItop.length;
  const nonLusReseau = alertesReseau.filter((a) => !idsLus.has(a.id)).length;
  const nonLusItop = incidentsItop.filter((i) => !idsLus.has(i.ref)).length;
  const nonLusOngletActif = onglet === "reseau" ? nonLusReseau : nonLusItop;

  const alertesReseauAffichees = nonLuesUniquement
    ? alertesReseau.filter((a) => !idsLus.has(a.id))
    : alertesReseau;
  const incidentsItopAffiches = nonLuesUniquement
    ? incidentsItop.filter((i) => !idsLus.has(i.ref))
    : incidentsItop;

  const totalPagesReseau = Math.max(1, Math.ceil(alertesReseauAffichees.length / TAILLE_PAGE));
  const pageReseauActuelle = Math.min(pageReseau, totalPagesReseau);
  const alertesReseauPage = alertesReseauAffichees.slice(
    (pageReseauActuelle - 1) * TAILLE_PAGE,
    pageReseauActuelle * TAILLE_PAGE
  );

  const totalPagesItop = Math.max(1, Math.ceil(incidentsItopAffiches.length / TAILLE_PAGE));
  const pageItopActuelle = Math.min(pageItop, totalPagesItop);
  const incidentsItopPage = incidentsItopAffiches.slice(
    (pageItopActuelle - 1) * TAILLE_PAGE,
    pageItopActuelle * TAILLE_PAGE
  );

  return (
    <DecideurLayout>
      <ErrorBanner message={erreurReseau || erreurItop} onRetry={() => { chargerReseau(); chargerItop(); }} />

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
          {onglet === "reseau" ? "Alertes réseau" : "Incidents"} ({nonLusOngletActif})
        </div>
        {((onglet === "reseau" && alertesReseau.length > 0) || (onglet === "itop" && incidentsItop.length > 0)) && (
          <button className="btn-link" onClick={toutMarquerLu}>Tout marquer lu</button>
        )}
      </div>

      {/* Bascule entre les 2 sources d'alertes - jamais affichees en
          meme temps, pour eviter de melanger deux notions differentes
          (statut reseau temps reel vs ticket helpdesk). */}
      <div className="alertes-onglets">
        <button
          type="button"
          className={`alertes-onglet-btn ${onglet === "reseau" ? "alertes-onglet-actif" : ""}`}
          onClick={() => setOnglet("reseau")}
        >
          Alertes réseau {alertesReseau.length > 0 && <span className="alertes-onglet-badge">{alertesReseau.length}</span>}
        </button>
        <button
          type="button"
          className={`alertes-onglet-btn ${onglet === "itop" ? "alertes-onglet-actif" : ""}`}
          onClick={() => setOnglet("itop")}
        >
          Incidents {incidentsItop.length > 0 && <span className="alertes-onglet-badge">{incidentsItop.length}</span>}
        </button>
      </div>

      {totalItems > 0 && (
        <label style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "16px", fontSize: "13px" }}>
          <input
            type="checkbox"
            checked={nonLuesUniquement}
            onChange={(e) => setNonLuesUniquement(e.target.checked)}
          />
          N'afficher que les alertes non lues
        </label>
      )}

      {onglet === "reseau" && (
        <>
          {alertesReseau.length === 0 && <p>Aucune alerte réseau pour le moment.</p>}
          {alertesReseau.length > 0 && alertesReseauAffichees.length === 0 && (
            <p>Aucune alerte réseau non lue.</p>
          )}

          <div className="alerts-grid">
            {alertesReseauPage.map((alerte) => {
          const couleur = getStatusColor(alerte.nouveauStatut);
          const lu = idsLus.has(alerte.id);
          const TypeIcone = alerte.type === "ANPTIC" ? Globe : Building2;
          const StatutIcone = getStatusIcon(alerte.nouveauStatut);

          return (
            <div
              key={alerte.id}
              className={`status-card alert-card ${lu ? "alert-card-lu" : ""}`}
              style={{ "--card-color": couleur }}
              onClick={() => marquerCommeLu(alerte.id)}
            >
              <div className="card-top">
                <div className="card-icon" style={{ position: "relative" }}>
                  <TypeIcone size={19} />
                  {!lu && <span className="unread-dot"></span>}
                </div>
                <div className="card-titles">
                  <div className="card-title">{alerte.siteNom}</div>
                  <div className="card-subtitle">{alerte.ville}</div>
                </div>
                <span className={`status-badge ${badgeClassReseau(alerte.nouveauStatut)}`}>
                  <StatutIcone size={12} strokeWidth={3} /> {getStatusLabel(alerte.nouveauStatut)}
                </span>
              </div>

              <p className="alert-message">{alerte.message}</p>

              <div className="alert-meta">
                <span className="alert-time">{formaterTempsRelatif(alerte.survenuLe)}</span>
                <button
                  type="button"
                  className="alert-link"
                  onClick={(e) => {
                    e.stopPropagation();
                    choisirSite(alerte.siteId);
                  }}
                >
                  Voir le détail <ChevronRight size={13} />
                </button>
              </div>
            </div>
              );
            })}
          </div>

          {totalPagesReseau > 1 && (
            <div className="alertes-pagination">
              <button
                type="button"
                className="alertes-pagination-btn"
                onClick={() => setPageReseau(pageReseauActuelle - 1)}
                disabled={pageReseauActuelle === 1}
                aria-label="Page précédente"
              >
                <ChevronLeft size={14} /> Précédent
              </button>
              <span>Page {pageReseauActuelle} / {totalPagesReseau}</span>
              <button
                type="button"
                className="alertes-pagination-btn"
                onClick={() => setPageReseau(pageReseauActuelle + 1)}
                disabled={pageReseauActuelle === totalPagesReseau}
                aria-label="Page suivante"
              >
                Suivant <ChevronRight size={14} />
              </button>
            </div>
          )}
        </>
      )}

      {onglet === "itop" && (
        <>
          {incidentsItop.length === 0 && <p>Aucun incident pour le moment.</p>}
          {incidentsItop.length > 0 && incidentsItopAffiches.length === 0 && (
            <p>Aucun incident non lu.</p>
          )}

          <div className="alerts-grid">
            {incidentsItopPage.map((incident) => {
          const { classe, Icone, libelle } = infosStatutItop(incident.statut);
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

          {totalPagesItop > 1 && (
            <div className="alertes-pagination">
              <button
                type="button"
                className="alertes-pagination-btn"
                onClick={() => setPageItop(pageItopActuelle - 1)}
                disabled={pageItopActuelle === 1}
                aria-label="Page précédente"
              >
                <ChevronLeft size={14} /> Précédent
              </button>
              <span>Page {pageItopActuelle} / {totalPagesItop}</span>
              <button
                type="button"
                className="alertes-pagination-btn"
                onClick={() => setPageItop(pageItopActuelle + 1)}
                disabled={pageItopActuelle === totalPagesItop}
                aria-label="Page suivante"
              >
                Suivant <ChevronRight size={14} />
              </button>
            </div>
          )}
        </>
      )}
    </DecideurLayout>
  );
}

export default AlertesPage;
