function Header({ nav, children }) {
  return (
    <header className="app-header">
      <div className="flag-bar"></div>
      <div className="header-main-row">
        <div className="header-top">
          <div className="header-icon">R</div>
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
      </div>
    </header>
  );
}

export default Header;