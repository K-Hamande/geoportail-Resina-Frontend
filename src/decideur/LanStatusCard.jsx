import { getStatusLabel } from "../shared/statusStyles";

function classFor(status) {
  if (status === "KO") return "ko";
  if (status === "WARN") return "warn";
  return "ok";
}

function LanStatusCard({ data }) {
  if (!data) {
    return <div className="status-card">Chargement...</div>;
  }

  const badgeClass = data.globalStatus === "KO" ? "badge-ko" : data.globalStatus === "WARN" ? "badge-warn" : "badge-ok";
  const badgeText = data.globalStatus === "KO" ? "✕ Incident" : data.globalStatus === "WARN" ? "⚠ Alerte" : "✓ Normal";

  return (
    <div className="status-card">
      <div className="card-top">
        <div className="card-icon">🏢</div>
        <div className="card-titles">
          <div className="card-title">Réseau du bâtiment</div>
          <div className="card-subtitle">LAN interne — Wi-Fi &amp; commutateurs</div>
        </div>
        <span className={`status-badge ${badgeClass}`}>{badgeText}</span>
      </div>

      <div className="counters-row">
        <div className="counter-box">
          <div className="counter-value">{data.equipementsActifs}</div>
          <div className="counter-label">actifs sur {data.equipementsTotal}</div>
        </div>
        <div className="counter-box">
          <div className={`counter-value ${data.equipementsEnPanne > 0 ? "danger" : ""}`}>{data.equipementsEnPanne}</div>
          <div className="counter-label">en panne</div>
        </div>
        <div className="counter-box">
          <div className="counter-value">{data.etats.length}</div>
          <div className="counter-label">niveaux surveillés</div>
        </div>
      </div>

      <div className="floors-title">État par niveau</div>

      {data.etats.map((etage) => (
        <div key={etage.etage} className={`floor-row ${classFor(etage.status)}`}>
          <span className={`floor-dot ${classFor(etage.status)}`}></span>
          <div>
            <div className="floor-name">{etage.etage}</div>
            <div className="floor-detail">{etage.detail}</div>
          </div>
        </div>
      ))}

      {data.actionMessage && (
        <div className="action-box">
          <span className="floor-dot ko" style={{ marginTop: "4px" }}></span>
          <div>
            <div className="action-title">Action requise — Votre DSI</div>
            <div className="action-text">{data.actionMessage}</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LanStatusCard;