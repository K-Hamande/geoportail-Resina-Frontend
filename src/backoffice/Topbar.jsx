function Topbar({ title, subtitle, onRefresh }) {
  return (
    <div className="backoffice-topbar">
      <div>
        <div className="backoffice-topbar-title">{title}</div>
        {subtitle && <div className="backoffice-topbar-subtitle">{subtitle}</div>}
      </div>
      <div className="backoffice-topbar-right">
        <span className="netxms-badge">
          <span className="netxms-dot"></span>
          Connecté à NetXMS
        </span>
        {onRefresh && (
          <button className="btn btn-info" style={{ color: "white" }}  onClick={onRefresh}>
            Actualiser
          </button>
        )}
      </div>
    </div>
  );
}

export default Topbar;