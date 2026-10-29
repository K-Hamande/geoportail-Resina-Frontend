import { RefreshCw } from "lucide-react";

// "chargement" est optionnel (pages qui ne le passent pas gardent le
// comportement d'avant : bouton jamais desactive, libelle fixe) - ajoute
// pour que le bouton "Actualiser" donne un retour visible pendant le
// rechargement (sinon, quand les donnees ne changent pas visiblement, on
// a l'impression que le bouton "ne marche pas").
//
// Meme design que le bouton "Actualiser" de la page "Gestion des sites"
// (.topbar-refresh + icone RefreshCw) - ce composant utilisait jusque-la
// un style different (.btn.btn-info generique), incoherent avec le reste
// du backoffice.
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
          <button className="topbar-refresh" onClick={onRefresh} disabled={chargement}>
            <RefreshCw size={13} className={chargement ? "spin-icon" : ""} />
            {chargement ? "Actualisation..." : "Actualiser"}
          </button>
        )}
      </div>
    </div>
  );
}

export default Topbar;
