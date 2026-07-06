import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../shared/AuthContext";

function BackofficeLayout() {
  const { auth, logout } = useAuth();
  const linkClass = ({ isActive }) => (isActive ? "sidebar-link active" : "sidebar-link");

  return (
    <div className="backoffice-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">R</div>
          <div>
            <div className="sidebar-brand-title">GéoPortail RESINA</div>
            <div className="sidebar-brand-subtitle">Administration</div>
          </div>
        </div>

        <div className="sidebar-badge">Backoffice DEST/DIG</div>

        <nav className="sidebar-nav">
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