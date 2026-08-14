import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { apiGet } from "./apiClient";

const SiteSelectionContext = createContext(null);

// Partage la liste des sites et le site actuellement selectionne entre
// les 3 pages decideur (Mon site / Carte / Alertes), pour que le
// selecteur du header reste disponible et coherent partout, pas
// seulement sur "Mon site".
export function SiteSelectionProvider({ children }) {
  const [sites, setSites] = useState([]);
  const [siteId, setSiteIdState] = useState(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    apiGet("/api/v1/sites").then((data) => {
      setSites(data);
      const siteDepuisUrl = searchParams.get("site");
      if (siteDepuisUrl) setSiteIdState(siteDepuisUrl);
      else if (data.length > 0) setSiteIdState(data[0].siteId);
    });
  }, []);

  // Choisir un site depuis n'importe quelle page ramene vers "Mon site"
  // pour ce site - comportement previsible, plutot que de gerer un
  // filtrage different sur Carte/Alertes qui affichent tous les sites.
  function choisirSite(nouveauSiteId) {
    setSiteIdState(nouveauSiteId);
    navigate(`/?site=${nouveauSiteId}`);
  }

  return (
    <SiteSelectionContext.Provider value={{ sites, siteId, choisirSite, setSiteIdState }}>
      {children}
    </SiteSelectionContext.Provider>
  );
}

export function useSiteSelection() {
  return useContext(SiteSelectionContext);
}