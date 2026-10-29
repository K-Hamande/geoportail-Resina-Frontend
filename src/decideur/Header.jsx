import { Link } from "react-router-dom";
import { LogOut, Globe } from "lucide-react";

function Header({ nav, children, onLogout, nomComplet, role, ministere }) {
  return (
    <header className="app-header">
      <div className="flag-bar"></div>
      <div className="header-main-row">
        <div className="header-top">
          <div className="header-icon">
            <img src="/logo_anptic_ok.png" alt="ANPTIC" className="header-icon-logo" />
          </div>
          <div className="header-titles">
            <div className="header-title">GéoPortail RESINA</div>
            <div className="header-subtitle">Tableau de bord — Usage Ministériel</div>
          </div>
          <div className="live-badge">
            <span className="live-dot"></span>
            EN DIRECT
          </div>
        </div>
        {nav}
        {children}
        {nomComplet && (
          <>
            <Link to="/public" className="header-public-link" title="Voir la vue publique">
              <Globe size={15} />
            </Link>
            <div className="header-user">
              <span className="header-user-name">{nomComplet}</span>
              <span className="header-user-role">{role === "LAMBDA" ? "Observateur" : (ministere || "Décideur")}</span>
              <button className="header-logout-btn" onClick={onLogout} title="Se déconnecter"><LogOut size={15} /></button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}

export default Header;
