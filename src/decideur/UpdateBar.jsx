function UpdateBar({ lastUpdated, onRefresh }) {
  const formatted = lastUpdated.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="toolbar">
      <span>
        Mis à jour : <strong>{formatted}</strong>
      </span>
      <button className="btn-refresh" onClick={onRefresh}>
        ↻ Actualiser
      </button>
    </div>
  );
}

export default UpdateBar;