import { useNavigate } from "react-router-dom";
import { getDecideurAuth, clearDecideurAuth } from "../shared/decideurAuth";

function LambdaLayout({ children }) {
  const auth = getDecideurAuth();
  const navigate = useNavigate();

  function logout() {
    clearDecideurAuth();
    navigate("/login");
  }

  return (
    <div className="lambda-shell">
      <header className="lambda-header">
        <div className="flag-bar"></div>
        <div className="lambda-header-inner">
          <div className="lambda-brand">
            <img src="/logo_anptic_ok.png" alt="ANPTIC" className="lambda-logo" />
            <div>
              <div className="lambda-title">GéoPortail RESINA</div>
              <div className="lambda-subtitle">État du réseau national</div>
            </div>
          </div>
          <nav className="lambda-nav">
            <button className="lambda-nav-btn" onClick={() => navigate("/lambda")}> 📋 Liste</button>
            <button className="lambda-nav-btn" onClick={() => navigate("/lambda/carte")}>🗺️ Carte</button>
          </nav>
          <div className="lambda-user">
            <span className="lambda-user-name">{auth?.nomComplet}</span>
            <button className="lambda-logout" onClick={logout} title="Se déconnecter">⏻</button>
          </div>
        </div>
      </header>
      <main className="lambda-content">{children}</main>
    </div>
  );
}

export default LambdaLayout;