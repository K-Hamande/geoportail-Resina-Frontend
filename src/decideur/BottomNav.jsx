import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { apiGet } from "../shared/apiClient";

function BottomNav() {
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    apiGet("/api/v1/sites/map")
      .then((sites) => setAlertCount(sites.filter((s) => s.statutGlobal !== "OK").length))
      .catch(() => {});
  }, []);

  const linkClass = ({ isActive }) => (isActive ? "active" : "");

  return (
    <nav className="bottom-nav">
      <NavLink to="/" end className={linkClass}>
        <span className="nav-icon">🏢</span>
        Mon site
      </NavLink>
      <NavLink to="/carte" className={linkClass}>
        <span className="nav-icon">🗺️</span>
        Carte
      </NavLink>
      <NavLink to="/alertes" className={linkClass}>
        <span className="nav-icon">🔔</span>
        Alertes
        {alertCount > 0 && <span className="nav-badge">{alertCount}</span>}
      </NavLink>
    </nav>
  );
}

export default BottomNav;