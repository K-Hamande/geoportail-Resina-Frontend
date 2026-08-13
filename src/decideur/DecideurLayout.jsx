import { useEffect, useState } from "react";
import { apiGet } from "../shared/apiClient";
import Header from "./Header";
import Footer from "./Footer";
import BottomNav from "./BottomNav";

// Regroupe la structure commune aux 3 pages Decideur (en-tete, pied de
// page, navigation), pour ne l'ecrire qu'une seule fois.
// "headerExtra" permet d'inserer un contenu specifique DANS le bandeau
// bleu (ex: le selecteur de site sur "Mon site").
//
// La navigation est rendue DEUX FOIS :
//  - .nav-desktop-slot : integree au bandeau bleu, visible a partir de
//    1024px (voir index.css)
//  - .nav-mobile-slot  : barre basse classique, visible en dessous
// Seule une des deux est affichee a la fois (CSS), jamais les deux en
// meme temps. Le compteur d'alertes est recupere UNE SEULE FOIS ici et
// partage entre les deux affichages.
function DecideurLayout({ headerExtra, children }) {
  const [alertCount, setAlertCount] = useState(0);

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

  return (
    <div className="page">
      <Header nav={navDesktop}>{headerExtra}</Header>
      <div className="page-content">{children}</div>
      <Footer />
      <div className="nav-mobile-slot">
        <BottomNav alertCount={alertCount} />
      </div>
    </div>
  );
}

export default DecideurLayout;