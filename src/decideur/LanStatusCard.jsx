import { useState } from "react";

function classFor(status) {
  if (status === "KO") return "ko";
  if (status === "WARN") return "warn";
  if (status === "UNKNOWN") return "unknown";
  return "ok";
}

const TYPE_LABELS = { BORNE_WIFI: "Borne Wi-Fi", COMMUTATEUR: "Commutateur" };

function LanStatusCard({ data }) {
  // Ensemble des noms d'etage actuellement deplies - un Set permet
  // d'avoir plusieurs etages ouverts en meme temps sans se marcher dessus.
  const [etagesOuverts, setEtagesOuverts] = useState(new Set());

  if (!data) {
    return <div className="status-card">Chargement...</div>;
  }

  function basculerEtage(nom) {
    setEtagesOuverts((prev) => {
      const suivant = new Set(prev);
      if (suivant.has(nom)) suivant.delete(nom);
      else suivant.add(nom);
      return suivant;
    });
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

      {data.etats.map((etage) => {
        const ouvert = etagesOuverts.has(etage.etage);

        return (
          <div
            key={etage.etage}
            className={`floor-row ${classFor(etage.status)} ${ouvert ? "expanded" : ""}`}
            onClick={() => basculerEtage(etage.etage)}
          >
            <div className="floor-row-header">
              <span className={`floor-dot ${classFor(etage.status)}`}></span>
              <div>
                <div className="floor-name">{etage.etage}</div>
                <div className="floor-detail">{etage.detail}</div>
              </div>
              <span className="floor-chevron">▼</span>
            </div>

            {ouvert && (
              <div className="floor-equipment-list" onClick={(e) => e.stopPropagation()}>
                {etage.equipements.map((eq) => (
                  <div key={eq.id} className="floor-equipment-item">
                    <span className={`floor-equipment-dot ${classFor(eq.status)}`}></span>
                    <span className="floor-equipment-name">{eq.libelleAffiche}</span>
                    <span className="floor-equipment-type">{TYPE_LABELS[eq.type] ?? eq.type}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

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