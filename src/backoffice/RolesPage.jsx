import Topbar from "./Topbar";

// Page d'information statique : GéoPortail RESINA n'a pas (encore) de
// systeme de permissions configurable en base - les 3 roles ci-dessous
// sont ceux definis en dur dans le code (AdminUser.Role). Cette page
// documente simplement ce qu'ils signifient, a titre de reference pour
// les administrateurs. Elle ne permet aucune modification.
const ROLES = [
  {
    code: "SUPER_ADMIN",
    label: "Super administrateur",
    description:
      "Accès complet au Backoffice. C'est le seul rôle autorisé à gérer les comptes administrateurs eux-mêmes : " +
      "créer, modifier, désactiver, réinitialiser un mot de passe ou supprimer un compte Backoffice (menu " +
      "Utilisateurs). Accès à tous les sites par défaut.",
  },
  {
    code: "ADMIN_DEST",
    label: "Administrateur DEST",
    description:
      "Compte administrateur rattaché à la DEST (Direction de l'Exploitation). Accède aux mêmes fonctionnalités " +
      "de gestion opérationnelle que ADMIN_DIG (sites, équipements, cartographie, supervision, comptes décideurs) " +
      "mais ne peut pas gérer les comptes administrateurs Backoffice. Accès global ou restreint à certains sites, " +
      "selon l'attribution faite à la création du compte.",
  },
  {
    code: "ADMIN_DIG",
    label: "Administrateur DIG",
    description:
      "Compte administrateur rattaché à la DIG (Direction de l'Infogérance). Mêmes fonctionnalités et mêmes " +
      "règles d'accès aux sites que ADMIN_DEST - la distinction entre les deux rôles sert aujourd'hui à identifier " +
      "la direction d'appartenance de l'administrateur, pas à limiter des fonctionnalités différentes.",
  },
];

function RolesPage() {
  return (
    <>
      <Topbar title="Rôles" subtitle="Rôles disponibles pour les comptes Backoffice" />
      <div className="backoffice-content">
        <div className="panel">
          <div className="panel-header">
            <h2>Rôles Backoffice</h2>
          </div>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Rôle</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {ROLES.map((r) => (
                <tr key={r.code}>
                  <td className="site-name-cell" style={{ whiteSpace: "nowrap", verticalAlign: "top" }}>
                    <span className="status-pill pill-ok">{r.label}</span>
                  </td>
                  <td>{r.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ color: "var(--bo-ink-muted)", marginTop: "14px" }}>
            La gestion fine des permissions par rôle (au-delà de cette distinction) n'existe pas encore dans
            l'application - cette page sera complétée si un système de permissions configurables est mis en place.
          </p>
        </div>
      </div>
    </>
  );
}

export default RolesPage;