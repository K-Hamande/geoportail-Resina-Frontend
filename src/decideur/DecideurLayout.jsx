import { useNavigate } from "react-router-dom";
import { useSiteSelection } from "../shared/SiteSelectionContext";
import { getDecideurAuth, clearDecideurAuth } from "../shared/decideurAuth";
import Header from "./Header";
import Footer from "./Footer";
import BottomNav from "./BottomNav";
import SiteSelector from "./SiteSelector";

function DecideurLayout({ children, plainePage = false }) {
  // mapSites vient du SiteSelectionProvider (partage, une seule requete
  // par session) plutot que d'un fetch propre a ce composant : DecideurLayout
  // etait jusque-la instancie separement par chaque page (Mon site/Carte/
  // Alertes), donc remonte - et son fetch relance - a chaque navigation.
  const { sites, mapSites, siteId, choisirSite } = useSiteSelection();
  const alertCount = mapSites.filter((s) => s.statutGlobal !== "OK").length;
  const auth = getDecideurAuth();
  const navigate = useNavigate();

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
    <div className={plainePage ? "page page-pleine" : "page"}>
      <Header nav={navDesktop} onLogout={logout} nomComplet={auth?.nomComplet} role={auth?.role} ministere={auth?.ministere}>
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