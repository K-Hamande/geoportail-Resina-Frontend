// "chargement" est optionnel (pages qui ne le passent pas gardent le
// comportement d'avant : bouton jamais desactive, libelle fixe) - ajoute
// pour que le bouton "Actualiser" donne un retour visible pendant le
// rechargement (sinon, quand les donnees ne changent pas visiblement, on
// a l'impression que le bouton "ne marche pas").
function Topbar({ title, subtitle, onRefresh, chargement }) {
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
          <button className="btn btn-info" style={{ color: "white" }} onClick={onRefresh} disabled={chargement}>
            {chargement ? "Actualisation..." : "Actualiser"}
          </button>
        )}
      </div>
    </div>
  );
}

export default Topbar;