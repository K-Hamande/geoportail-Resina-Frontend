import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiGet } from "../shared/apiClient";
import { useSiteSelection } from "../shared/SiteSelectionContext";
import { getDecideurAuth, clearDecideurAuth } from "../shared/decideurAuth";
import Header from "./Header";
import Footer from "./Footer";
import BottomNav from "./BottomNav";
import SiteSelector from "./SiteSelector";

function DecideurLayout({ children }) {
  const [alertCount, setAlertCount] = useState(0);
  const { sites, siteId, choisirSite } = useSiteSelection();
  const auth = getDecideurAuth();
  const navigate = useNavigate();

  useEffect(() => {
    apiGet("/api/v1/sites/map")
      .then((sites) => setAlertCount(sites.filter((s) => s.statutGlobal !== "OK").length))
      .catch(() => {});
  }, []);

  function logout() {
    clearDecideurAuth();
    navigate("/login");
  }

  const navDesktop = (
    <div className="nav-desktop-slot">
      <BottomNav alertCount={alertCount} />
    </div>
  );

  const selecteur = <SiteSelector sites={sites} siteId={siteId} onChange={choisirSite} />;

  return (
    <div className="page">
      <Header nav={navDesktop} onLogout={logout} nomComplet={auth?.role}>
        {selecteur}
      </Header>
      <div className="page-content">{children}</div>
      <Footer />
      <div className="nav-mobile-slot">
        <BottomNav alertCount={alertCount} />
      </div>
    </div>
  );
}

export default DecideurLayout;