import { useEffect, useState } from "react";
import { useAuth } from "../shared/AuthContext";
import { adminGet, adminPost } from "../shared/backofficeApiClient";
import UserFormModal from "./UserFormModal";
import ResetPasswordModal from "./ResetPasswordModal";
import Topbar from "./Topbar";

function UsersPage() {
  const { getAuthHeader } = useAuth();
  const [users, setUsers] = useState([]);
  const [erreur, setErreur] = useState(null);
  const [modaleCreation, setModaleCreation] = useState(false);
  const [userResetId, setUserResetId] = useState(null);

  function charger() {
    adminGet("/backoffice/api/v1/users", getAuthHeader())
      .then(setUsers)
      .catch((err) => setErreur(err.message));
  }

  useEffect(() => {
    charger();
  }, []);

  async function toggleActive(user) {
    const action = user.actif ? "deactivate" : "activate";
    try {
      await adminPost(`/backoffice/api/v1/users/${user.id}/${action}`, getAuthHeader());
      charger();
    } catch (err) {
      setErreur(err.message);
    }
  }

  return (
    <>
      <Topbar title="Utilisateurs" subtitle="Comptes administrateurs DEST/DIG" onRefresh={charger} />

      <div className="backoffice-content">
        {erreur && <p style={{ color: "var(--color-ko)" }}>Erreur : {erreur}</p>}

        <div className="panel">
          <div className="panel-header">
            <h2>Comptes Backoffice</h2>
            <div className="panel-header-actions">
              <button className="btn-primary" onClick={() => setModaleCreation(true)}>
                + Nouvel utilisateur
              </button>
            </div>
          </div>

          <table className="admin-table">
            <thead>
              <tr>
                <th>Login</th>
                <th>Nom complet</th>
                <th>Rôle</th>
                <th>Sites</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="site-name-cell">{user.login}</td>
                  <td>{user.nomComplet}</td>
                  <td>
                  <td>{user.role}</td>
                  <td>{user.sitesAutorises?.length > 0 ? user.sitesAutorises.join(", ") : "Tous les sites"}</td>
                    <span className={`status-badge ${user.actif ? "badge-ok" : "badge-unknown"}`}>
                      {user.actif ? "Actif" : "Désactivé"}
                    </span>
                  </td>
                  <td className="table-actions">
                    <button className="btn btn-danger" style={{ color: "white" }}  onClick={() => setUserResetId(user.id)}>
                      Réinitialiser
                    </button>
                    <button className="btn btn-info" style={{ color: "white" }}  onClick={() => toggleActive(user)}>
                      {user.actif ? "Désactiver" : "Activer"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {modaleCreation && (
          <UserFormModal onClose={() => setModaleCreation(false)} onSaved={() => { setModaleCreation(false); charger(); }} />
        )}

        {userResetId != null && (
          <ResetPasswordModal userId={userResetId} onClose={() => setUserResetId(null)} onSaved={() => setUserResetId(null)} />
        )}
      </div>
    </>
  );
}

export default UsersPage;