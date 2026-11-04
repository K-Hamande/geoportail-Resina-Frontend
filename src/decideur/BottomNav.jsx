import { NavLink } from "react-router-dom";
import { Building2, Map, Bell } from "lucide-react";

// Le compteur d'alertes est desormais fourni par le parent (DecideurLayout)
// plutot que recupere ici via API - ce composant est rendu DEUX FOIS
// (version mobile + version desktop integree au bandeau bleu), un seul
// appel API partage evite de le declencher deux fois pour rien.
function BottomNav({ alertCount = 0 }) {
  const linkClass = ({ isActive }) => (isActive ? "active" : "");

  return (
    <nav className="bottom-nav">
      <NavLink to="/" end className={linkClass}>
        <span className="nav-icon"><Building2 size={20} /></span>
        Mon site
      </NavLink>
      <NavLink to="/carte" className={linkClass}>
        <span className="nav-icon"><Map size={20} /></span>
        Carte
      </NavLink>
      <NavLink to="/alertes" className={linkClass}>
        <span className="nav-icon"><Bell size={20} /></span>
        Alertes
        {/* Retour utilisateur : ce badge compte les SITES en anomalie, pas
            les alertes individuelles (un site peut cumuler une alerte
            ANPTIC et une alerte reseau local - voir AlertesPage, qui
            affiche ces 2 entrees separement). D'ou un chiffre different de
            celui affiche sur la page Alertes elle-meme - explique via ce
            titre plutot que de masquer la difference. */}
        {alertCount > 0 && (
          <span className="nav-badge" title={`${alertCount} site(s) en anomalie — une alerte réseau peut en compter davantage (ANPTIC + réseau local)`}>
            {alertCount}
          </span>
        )}
      </NavLink>
    </nav>
  );
}

export default BottomNav;
