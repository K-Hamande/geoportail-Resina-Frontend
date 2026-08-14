import { useEffect, useState } from "react";
import { apiGet } from "../shared/apiClient";
import { useSiteSelection } from "../shared/SiteSelectionContext";
import Header from "./Header";
import Footer from "./Footer";
import BottomNav from "./BottomNav";
import SiteSelector from "./SiteSelector";

// Regroupe la structure commune aux 3 pages Decideur. Le selecteur de
// site est desormais TOUJOURS affiche dans le header (avant : uniquement
// sur "Mon site"), alimente par le contexte partage SiteSelectionContext.
function DecideurLayout({ children }) {
  const [alertCount, setAlertCount] = useState(0);
  const { sites, siteId, choisirSite } = useSiteSelection();

  useEffect(() => {
    apiGet("/api/v1/sites/map")
      .then((sites) => setAlertCount(sites.filter((s) => s.statutGlobal !== "OK").length))
      .catch(() => {});
  }, []);

  const navDesktop = (
    <div className="nav-desktop-slot">
      <BottomNav alertCount={alertCount} />
    </div>
  );

  const selecteur = <SiteSelector sites={sites} siteId={siteId} onChange={choisirSite} />;

  return (
    <div className="page">
      <Header nav={navDesktop}>{selecteur}</Header>
      <div className="page-content">{children}</div>
      <Footer />
      <div className="nav-mobile-slot">
        <BottomNav alertCount={alertCount} />
      </div>
    </div>
  );
}

export default DecideurLayout;