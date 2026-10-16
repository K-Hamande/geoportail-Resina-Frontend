import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiGet } from "./apiClient";

const SiteSelectionContext = createContext(null);

// Cle de persistance du site selectionne. Volontairement en sessionStorage
// et non dans l'URL : l'id de site (identifiant interne) ne doit pas
// apparaitre en clair dans l'adresse (partage de lien, historique, logs
// de proxy/navigateur).
const CLE_SITE_SELECTIONNE = "resina-site-selectionne";

// Rythme de rafraichissement de /api/v1/sites/map, partage par tous les
// consommateurs (DecideurLayout pour le badge d'alertes, CartePage pour
// les marqueurs). Un seul appel/minute pour toute la session plutot
// qu'un appel distinct par page a chaque navigation - voir §4.4 du CDC
// ("10 requetes/minute/IP max") : DecideurLayout et CartePage faisaient
// chacun leur propre fetch de ce meme endpoint a chaque montage, ce qui
// epuisait tres vite ce quota partage par IP.
const INTERVALLE_ACTUALISATION_CARTE_MS = 60000;

// Partage la liste des sites, les donnees "carte" et le site actuellement
// selectionne entre les 3 pages decideur (Mon site / Carte / Alertes),
// pour que le selecteur du header reste disponible et coherent partout,
// pas seulement sur "Mon site" - et pour que ces donnees ne soient
// recuperees qu'une seule fois par session (ce Provider n'est monte
// qu'une fois, en layout partage), pas a chaque changement de page.
export function SiteSelectionProvider({ children }) {
  const [sites, setSites] = useState([]);
  const [mapSites, setMapSites] = useState([]);
  const [siteId, setSiteIdState] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    apiGet("/api/v1/sites")
      .then((data) => {
        setSites(data);
        const siteMemorise = sessionStorage.getItem(CLE_SITE_SELECTIONNE);
        const siteMemoriseValide = data.some((site) => site.siteId === siteMemorise);
        if (siteMemoriseValide) setSiteIdState(siteMemorise);
        else if (data.length > 0) setSiteIdState(data[0].siteId);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    function chargerMapSites() {
      apiGet("/api/v1/sites/map").then(setMapSites).catch(() => {});
    }
    chargerMapSites();
    const intervalle = setInterval(chargerMapSites, INTERVALLE_ACTUALISATION_CARTE_MS);
    return () => clearInterval(intervalle);
  }, []);

  // Choisir un site depuis le selecteur du header (ou depuis une alerte)
  // ramene vers "Mon site" pour ce site - comportement previsible. L'id
  // est memorise en sessionStorage, jamais ajoute a l'URL.
  function choisirSite(nouveauSiteId) {
    setSiteIdState(nouveauSiteId);
    sessionStorage.setItem(CLE_SITE_SELECTIONNE, nouveauSiteId);
    navigate("/");
  }

  // Variante utilisee par la Carte : selectionner un site depuis un
  // marqueur/la liste laterale doit filtrer/centrer la carte elle-meme,
  // pas rediriger vers une autre page.
  function definirSiteSansNaviguer(nouveauSiteId) {
    setSiteIdState(nouveauSiteId);
    sessionStorage.setItem(CLE_SITE_SELECTIONNE, nouveauSiteId);
  }

  return (
    <SiteSelectionContext.Provider
      value={{ sites, mapSites, siteId, choisirSite, definirSiteSansNaviguer, setSiteIdState }}
    >
      {children}
    </SiteSelectionContext.Provider>
  );
}

export function useSiteSelection() {
  return useContext(SiteSelectionContext);
}