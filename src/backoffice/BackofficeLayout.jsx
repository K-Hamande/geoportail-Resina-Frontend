import { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../shared/AuthContext";

// Composant "menu depliable" pour les rubriques a sous-elements
// (Sites & Equipements, Supervision). Deplie automatiquement si l'URL
// courante correspond a l'un de ses enfants.
function SidebarGroup({ icon, label, children, urls }) {
  const location = useLocation();
  const contientPageActive = urls.some((u) => location.pathname === u || location.pathname.startsWith(u + "/"));
  const [ouvert, setOuvert] = useState(contientPageActive);

  return (
    <div className={`sidebar-group ${ouvert ? "open" : ""}`}>
      <button type="button" className="sidebar-link sidebar-group-toggle" onClick={() => setOuvert((v) => !v)}>
        <span className="sidebar-link-icon">{icon}</span>
        {label}
        <span className="sidebar-group-caret">▸</span>
      </button>
      {ouvert && <div className="sidebar-group-children">{children}</div>}
    </div>
  );
}

function BackofficeLayout() {
  const { auth, logout } = useAuth();
  const [menuOuvert, setMenuOuvert] = useState(false);
  const [reduit, setReduit] = useState(false);

  const linkClass = ({ isActive }) => (isActive ? "sidebar-link active" : "sidebar-link");

  return (
    <div className={`backoffice-shell ${reduit ? "sidebar-reduced" : ""}`}>
      <div className="mobile-topbar">
        <button className="mobile-menu-btn" onClick={() => setMenuOuvert(true)} aria-label="Ouvrir le menu">☰</button>
        <span className="mobile-topbar-title">GéoPortail RESINA</span>
      </div>

      {menuOuvert && <div className="sidebar-overlay" onClick={() => setMenuOuvert(false)}></div>}

      <aside className={`sidebar ${menuOuvert ? "open" : ""}`}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">
            {/* Logo abstrait ANPTIC en SVG (points relies, evoque un reseau) */}
            <svg viewBox="0 0 40 40" width="26" height="26" xmlns="http://www.w3.org/2000/svg">
              <circle cx="20" cy="8" r="3" fill="#C79A2E"/>
              <circle cx="8" cy="28" r="3" fill="#C79A2E"/>
              <circle cx="32" cy="28" r="3" fill="#C79A2E"/>
              <circle cx="20" cy="22" r="4" fill="none" stroke="#C79A2E" strokeWidth="2"/>
              <line x1="20" y1="11" x2="20" y2="18" stroke="#C79A2E" strokeWidth="1.5"/>
              <line x1="17" y1="24" x2="10" y2="27" stroke="#C79A2E" strokeWidth="1.5"/>
              <line x1="23" y1="24" x2="30" y2="27" stroke="#C79A2E" strokeWidth="1.5"/>
            </svg>
          </div>
          <div className="sidebar-brand-texts">
            <div className="sidebar-brand-title">ANPTIC</div>
            <div className="sidebar-brand-subtitle">GéoPortail RESINA</div>
            <div className="sidebar-brand-pill">BACK-OFFICE</div>
          </div>
        </div>

        <div className="sidebar-section-title">Navigation</div>

        <nav className="sidebar-nav" onClick={(e) => { if (e.target.closest("a")) setMenuOuvert(false); }}>
          <NavLink to="/backoffice" end className={linkClass}>
            <span className="sidebar-link-icon">🏢</span>Tableau de bord
          </NavLink>

          <SidebarGroup
            icon="📦"
            label="Sites & Équipements"
            urls={["/backoffice/sites", "/backoffice/equipments", "/backoffice/cartography"]}
          >
            <NavLink to="/backoffice/sites" className={linkClass}>
              <span className="sidebar-link-icon">·</span>Gestion des sites
            </NavLink>
            <NavLink to="/backoffice/equipments" className={linkClass}>
              <span className="sidebar-link-icon">·</span>Équipements LAN
            </NavLink>
            <NavLink to="/backoffice/cartography" className={linkClass}>
              <span className="sidebar-link-icon">·</span>Cartographie
            </NavLink>
          </SidebarGroup>

          <SidebarGroup
            icon="🎛️"
            label="Supervision"
            urls={["/backoffice/supervision", "/backoffice/ministry-tokens"]}
          >
            <NavLink to="/backoffice/supervision" className={linkClass}>
              <span className="sidebar-link-icon">·</span>Paramètres supervision
            </NavLink>
            {/* <NavLink to="/backoffice/ministry-tokens" className={linkClass}>
              <span className="sidebar-link-icon">·</span>Liens Ministères
            </NavLink> */}
                      <NavLink to="/backoffice/decideur-users" className={linkClass}><span className="sidebar-link-icon">👥</span>Comptes Décideurs</NavLink>
          </SidebarGroup>

          <NavLink to="/backoffice/notifications" className={linkClass}>
            <span className="sidebar-link-icon">🔔</span>Notifications Push
          </NavLink>
          <NavLink to="/backoffice/users" className={linkClass}>
            <span className="sidebar-link-icon">👥</span>Utilisateurs
          </NavLink>
          <NavLink to="/backoffice/audit-log" className={linkClass}>
            <span className="sidebar-link-icon">📜</span>Journal d'activité
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-copyright">© 2026 ANPTIC / DEST-DIG</div>
          <div className="sidebar-copyright-sub">Tous droits réservés</div>
          <button className="sidebar-logout-full" onClick={logout}>Se déconnecter</button>
        </div>
      </aside>

      <main className="backoffice-main">
        <Outlet context={{ auth, setReduit, reduit }} />
      </main>
    </div>
  );
}

export default BackofficeLayout;