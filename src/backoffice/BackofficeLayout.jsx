import { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  Menu, Building2, Package, SlidersHorizontal, Users, Bell, ScrollText, ChevronRight,
} from "lucide-react";
import { useAuth } from "../shared/AuthContext";

// Composant "menu depliable" pour les rubriques a sous-elements
// (Sites & Equipements, Supervision). Deplie automatiquement si l'URL
// courante correspond a l'un de ses enfants.
function SidebarGroup({ Icon, label, children, urls }) {
  const location = useLocation();
  const contientPageActive = urls.some((u) => location.pathname === u || location.pathname.startsWith(u + "/"));
  const [ouvert, setOuvert] = useState(contientPageActive);

  return (
    <div className={`sidebar-group ${ouvert ? "open" : ""}`}>
      <button type="button" className="sidebar-link sidebar-group-toggle" onClick={() => setOuvert((v) => !v)}>
        <span className="sidebar-link-icon"><Icon size={17} /></span>
        <span className="sidebar-link-label">{label}</span>
        <ChevronRight size={12} className="sidebar-group-caret" />
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
        <button className="mobile-menu-btn" onClick={() => setMenuOuvert(true)} aria-label="Ouvrir le menu"><Menu size={19} /></button>
        <span className="mobile-topbar-title">GéoPortail RESINA</span>
      </div>

      {menuOuvert && <div className="sidebar-overlay" onClick={() => setMenuOuvert(false)}></div>}

      <aside className={`sidebar ${menuOuvert ? "open" : ""}`}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">
            {/* Silhouette du Burkina Faso, tracee a partir du contour reel
                (union des 351 communes de donnebase.limitecommune, hors le
                doublon id 124 - cf. CouvertureNationaleService.java cote
                backend) plutot qu'un dessin approximatif. */}
            <svg viewBox="0 0 40 40" width="26" height="26" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M 11.02,29.85 L 9.94,30.06 L 9.27,30.50 L 8.93,30.31 L 8.34,30.69 L 8.16,31.38 L 8.02,31.27 L 7.86,31.41 L 7.65,31.10 L 7.29,31.15 L 7.28,30.73 L 7.07,30.98 L 6.86,30.84 L 6.53,31.04 L 5.98,30.59 L 6.11,30.36 L 5.34,30.12 L 5.36,29.55 L 5.20,29.20 L 4.88,29.18 L 5.04,29.14 L 4.94,28.88 L 4.75,28.91 L 4.84,28.70 L 4.67,28.78 L 4.72,28.34 L 3.95,28.28 L 3.63,28.45 L 3.21,28.17 L 3.00,27.81 L 3.24,27.27 L 3.19,26.38 L 3.47,26.00 L 3.09,25.47 L 3.10,25.02 L 3.79,24.76 L 4.35,23.51 L 4.27,22.88 L 3.94,22.71 L 4.08,22.09 L 3.47,21.81 L 4.13,21.77 L 4.87,21.15 L 6.33,21.07 L 6.48,20.80 L 6.78,20.83 L 6.89,20.48 L 7.16,20.47 L 7.00,20.21 L 7.47,19.85 L 7.45,19.65 L 7.79,19.74 L 7.61,19.27 L 7.91,18.78 L 7.42,18.25 L 7.43,17.95 L 8.34,18.04 L 8.58,17.57 L 8.55,16.95 L 8.03,16.17 L 8.50,16.00 L 8.38,15.77 L 8.88,15.53 L 9.10,15.07 L 9.56,14.91 L 9.64,14.61 L 9.94,14.88 L 9.66,15.15 L 10.36,15.19 L 11.43,16.06 L 11.90,16.10 L 11.91,15.60 L 12.78,15.54 L 12.65,13.72 L 13.35,13.84 L 13.61,14.14 L 13.79,13.95 L 13.99,14.10 L 14.32,13.97 L 14.19,13.25 L 14.54,12.21 L 16.04,11.20 L 17.64,11.86 L 18.09,11.66 L 18.16,10.45 L 19.46,10.33 L 21.00,9.35 L 22.06,9.12 L 23.55,7.83 L 24.76,7.83 L 24.88,8.16 L 25.61,7.86 L 27.71,8.56 L 27.42,8.85 L 27.68,9.26 L 27.36,10.19 L 28.57,12.69 L 29.36,13.46 L 29.33,13.78 L 29.98,13.82 L 30.08,14.07 L 30.93,14.30 L 31.00,14.68 L 32.18,15.25 L 31.87,15.14 L 31.71,15.40 L 30.92,15.17 L 30.92,16.33 L 34.69,18.47 L 35.16,17.91 L 35.69,17.93 L 36.23,18.56 L 36.44,19.25 L 35.53,19.54 L 37.00,21.50 L 36.59,22.44 L 35.25,23.57 L 34.89,23.61 L 34.73,23.42 L 33.64,23.68 L 33.33,23.31 L 32.66,23.42 L 32.35,23.80 L 32.47,24.05 L 32.11,23.96 L 32.08,24.29 L 31.60,24.16 L 31.67,24.64 L 31.19,24.73 L 31.45,25.23 L 30.86,24.99 L 30.72,25.25 L 30.87,25.44 L 30.63,25.42 L 30.68,25.80 L 30.48,25.73 L 30.58,25.36 L 29.50,25.36 L 28.81,25.65 L 28.83,25.32 L 25.46,24.64 L 25.50,24.82 L 25.11,25.07 L 25.07,24.82 L 24.87,24.84 L 24.77,25.21 L 24.24,25.38 L 24.03,25.81 L 23.86,25.42 L 23.08,25.32 L 22.84,25.51 L 22.78,25.23 L 21.87,25.42 L 19.86,25.27 L 19.30,25.46 L 14.50,25.33 L 14.56,25.69 L 14.05,26.56 L 14.19,26.71 L 14.03,27.01 L 14.36,27.71 L 14.76,27.84 L 14.42,28.29 L 14.83,28.59 L 14.68,29.36 L 14.96,30.40 L 14.70,30.96 L 14.87,31.20 L 14.77,31.51 L 15.12,31.83 L 14.81,32.17 L 14.52,31.99 L 13.76,30.77 L 13.51,30.82 L 13.39,30.47 L 12.99,30.35 L 12.97,29.94 L 12.62,30.32 L 12.45,30.04 L 11.02,29.85 Z"
                fill="#C79A2E"
              />
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
            <span className="sidebar-link-icon"><Building2 size={17} /></span><span className="sidebar-link-label">Tableau de bord</span>
          </NavLink>

          <SidebarGroup
            Icon={Package}
            label="Sites & Équipements"
            urls={["/backoffice/sites", "/backoffice/equipments", "/backoffice/cartography"]}
          >
            <NavLink to="/backoffice/sites" className={linkClass}>
              <span className="sidebar-link-icon">·</span><span className="sidebar-link-label">Gestion des sites</span>
            </NavLink>
            <NavLink to="/backoffice/equipments" className={linkClass}>
              <span className="sidebar-link-icon">·</span><span className="sidebar-link-label">Équipements LAN</span>
            </NavLink>
            <NavLink to="/backoffice/cartography" className={linkClass}>
              <span className="sidebar-link-icon">·</span><span className="sidebar-link-label">Cartographie</span>
            </NavLink>
          </SidebarGroup>

          <SidebarGroup
            Icon={SlidersHorizontal}
            label="Supervision"
            urls={["/backoffice/supervision", "/backoffice/ministry-tokens", "/backoffice/incidents-historique"]}
          >
            <NavLink to="/backoffice/supervision" className={linkClass}>
              <span className="sidebar-link-icon">·</span><span className="sidebar-link-label">Paramètres supervision</span>
            </NavLink>
            {/* <NavLink to="/backoffice/ministry-tokens" className={linkClass}>
              <span className="sidebar-link-icon">·</span><span className="sidebar-link-label">Liens Ministères</span>
            </NavLink> */}
                      <NavLink to="/backoffice/decideur-users" className={linkClass}><span className="sidebar-link-icon"><Users size={16} /></span><span className="sidebar-link-label">Comptes Décideurs</span></NavLink>
            <NavLink to="/backoffice/incidents-historique" className={linkClass}>
              <span className="sidebar-link-icon">·</span><span className="sidebar-link-label">Historique des incidents</span>
            </NavLink>
          </SidebarGroup>

          <NavLink to="/backoffice/notifications" className={linkClass}>
            <span className="sidebar-link-icon"><Bell size={17} /></span><span className="sidebar-link-label">Notifications Push</span>
          </NavLink>

          <SidebarGroup
            Icon={Users}
            label="Utilisateurs"
            urls={["/backoffice/mon-profil", "/backoffice/users", "/backoffice/roles"]}
          >
            <NavLink to="/backoffice/mon-profil" className={linkClass}>
              <span className="sidebar-link-icon">·</span><span className="sidebar-link-label">Mon profil</span>
            </NavLink>
            <NavLink to="/backoffice/users" className={linkClass}>
              <span className="sidebar-link-icon">·</span><span className="sidebar-link-label">Utilisateur</span>
            </NavLink>
            <NavLink to="/backoffice/roles" className={linkClass}>
              <span className="sidebar-link-icon">·</span><span className="sidebar-link-label">Rôles</span>
            </NavLink>
          </SidebarGroup>

          <NavLink to="/backoffice/audit-log" className={linkClass}>
            <span className="sidebar-link-icon"><ScrollText size={17} /></span><span className="sidebar-link-label">Journal d'activité</span>
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
