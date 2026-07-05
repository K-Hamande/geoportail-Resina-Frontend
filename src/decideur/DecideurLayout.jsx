import Header from "./Header";
import Footer from "./Footer";
import BottomNav from "./BottomNav";

// Regroupe la structure commune aux 3 pages Decideur (en-tete, pied de
// page, navigation basse), pour ne l'ecrire qu'une seule fois.
// "headerExtra" permet d'inserer un contenu specifique DANS le bandeau
// bleu (ex: le selecteur de site sur "Mon site"), sans dupliquer <Header>.
function DecideurLayout({ headerExtra, children }) {
  return (
    <div className="page">
      <Header>{headerExtra}</Header>
      <div className="page-content">{children}</div>
      <Footer />
      <BottomNav />
    </div>
  );
}

export default DecideurLayout;