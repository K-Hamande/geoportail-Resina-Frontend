import { useState } from "react";
import { useAuth } from "../shared/AuthContext";
import { adminPost } from "../shared/backofficeApiClient";

function UserFormModal({ onClose, onSaved }) {
  const { getAuthHeader } = useAuth();
  const [form, setForm] = useState({ login: "", nomComplet: "", motDePasse: "" });
  const [erreur, setErreur] = useState(null);
  const [enregistrement, setEnregistrement] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErreur(null);
    setEnregistrement(true);
    try {
      await adminPost("/backoffice/api/v1/users", getAuthHeader(), form);
      onSaved();
    } catch (err) {
      setErreur(err.message);
    } finally {
      setEnregistrement(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <h2>Nouvel utilisateur Backoffice</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-field" style={{ gridColumn: "span 2" }}>
              <label>Identifiant de connexion *</label>
              <input name="login" value={form.login} onChange={handleChange} required />
            </div>
            <div className="form-field" style={{ gridColumn: "span 2" }}>
              <label>Nom complet *</label>
              <input name="nomComplet" value={form.nomComplet} onChange={handleChange} required />
            </div>
            <div className="form-field" style={{ gridColumn: "span 2" }}>
              <label>Mot de passe initial *</label>
              <input name="motDePasse" type="password" value={form.motDePasse} onChange={handleChange} required />
            </div>
          </div>

          {erreur && <p style={{ color: "var(--color-ko)" }}>Erreur : {erreur}</p>}

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Annuler</button>
            <button type="submit" className="btn-primary" disabled={enregistrement}>
              {enregistrement ? "Création..." : "Créer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default UserFormModal;