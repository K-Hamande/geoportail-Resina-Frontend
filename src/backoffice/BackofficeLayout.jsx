import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../shared/AuthContext";

function BackofficeLayout() {
  const { auth, logout } = useAuth();
  const [menuOuvert, setMenuOuvert] = useState(false);
  const linkClass = ({ isActive }) => (isActive ? "sidebar-link active" : "sidebar-link");

  return (
    <div className="backoffice-shell">
      {/* Barre visible UNIQUEMENT sur petit ecran (cf. CSS) : bouton
          hamburger + titre, remplace la sidebar tant qu'elle est fermee. */}
      <div className="mobile-topbar">
        <button className="mobile-menu-btn" onClick={() => setMenuOuvert(true)} aria-label="Ouvrir le menu">
          ☰
        </button>
        <span className="mobile-topbar-title">GéoPortail RESINA</span>
      </div>

      {/* Fond sombre affiche derriere le menu quand il est ouvert sur
          mobile - un clic dessus referme le menu (meme principe que
          les modales : onClick sur l'overlay, pas sur le contenu). */}
      {menuOuvert && <div className="sidebar-overlay" onClick={() => setMenuOuvert(false)}></div>}

      <aside className={`sidebar ${menuOuvert ? "open" : ""}`}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">R</div>
          <div>
            <div className="sidebar-brand-title">GéoPortail RESINA</div>
            <div className="sidebar-brand-subtitle">Administration</div>
          </div>
        </div>

        <div className="sidebar-badge">Backoffice DEST/DIG</div>

        {/* onClick sur <nav> : des qu'un lien est clique (mobile),
            on referme automatiquement le menu - evite d'avoir a le
            fermer manuellement apres chaque navigation. */}
        <nav className="sidebar-nav" onClick={() => setMenuOuvert(false)}>
          <div className="sidebar-section-title">Supervision</div>
          <NavLink to="/backoffice" end className={linkClass}>Tableau de bord</NavLink>
          <NavLink to="/backoffice/sites" className={linkClass}>Gestion des sites</NavLink>
          <NavLink to="/backoffice/equipments" className={linkClass}>Équipements LAN</NavLink>

          <div className="sidebar-section-title">Configuration</div>
          <NavLink to="/backoffice/cartography" className={linkClass}>Cartographie</NavLink>
          <NavLink to="/backoffice/notifications" className={linkClass}>Notifications push</NavLink>

          <div className="sidebar-section-title">Administration</div>
          <NavLink to="/backoffice/users" className={linkClass}>Utilisateurs</NavLink>
          <NavLink to="/backoffice/audit-log" className={linkClass}>Journal d'activité</NavLink>
        </nav>

        <div className="sidebar-user">
          <div className="sidebar-user-avatar">{auth?.username?.charAt(0)?.toUpperCase()}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{auth?.username}</div>
            <div className="sidebar-user-role">Agent DEST/DIG</div>
          </div>
          <button className="sidebar-logout" onClick={logout} title="Se déconnecter">
            ⏻
          </button>
        </div>
      </aside>

      <main className="backoffice-main">
        <Outlet />
      </main>
    </div>
  );
}

export default BackofficeLayout;