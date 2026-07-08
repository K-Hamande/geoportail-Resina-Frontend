import { useEffect, useState } from "react";
import { useAuth } from "../shared/AuthContext";
import { adminGet, adminPost } from "../shared/backofficeApiClient";

function UserFormModal({ onClose, onSaved }) {
  const { getAuthHeader } = useAuth();
  const [sites, setSites] = useState([]);
  const [form, setForm] = useState({ login: "", nomComplet: "", motDePasse: "", role: "ADMIN_DEST" });
  const [sitesSelectionnes, setSitesSelectionnes] = useState([]);
  const [erreur, setErreur] = useState(null);
  const [enregistrement, setEnregistrement] = useState(false);

  useEffect(() => {
    adminGet("/backoffice/api/v1/sites", getAuthHeader()).then(setSites).catch(() => {});
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function toggleSite(siteId) {
    setSitesSelectionnes((prev) =>
      prev.includes(siteId) ? prev.filter((s) => s !== siteId) : [...prev, siteId]
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErreur(null);
    setEnregistrement(true);
    try {
      await adminPost("/backoffice/api/v1/users", getAuthHeader(), {
        ...form,
        // Un SUPER_ADMIN a toujours un acces global : on ignore la
        // selection de sites dans ce cas, meme si des cases avaient
        // ete cochees avant de changer le role.
        sitesAutorises: form.role === "SUPER_ADMIN" ? [] : sitesSelectionnes,
      });
      onSaved();
    } catch (err) {
      setErreur(err.message);
    } finally {
      setEnregistrement(false);
    }
  }

  const roleEstGlobalParDefaut = form.role === "SUPER_ADMIN";

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
            <div className="form-field" style={{ gridColumn: "span 2" }}>
              <label>Rôle *</label>
              <select name="role" value={form.role} onChange={handleChange}>
                <option value="SUPER_ADMIN">Super administrateur (accès global)</option>
                <option value="ADMIN_DEST">Administrateur DEST</option>
                <option value="ADMIN_DIG">Administrateur DIG</option>
              </select>
            </div>
          </div>

          {!roleEstGlobalParDefaut && (
            <div style={{ marginTop: "12px" }}>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-muted)" }}>
                Sites autorisés (aucune case cochée = accès à tous les sites)
              </label>
              <div className="site-checkbox-list">
                {sites.map((site) => (
                  <label key={site.siteId} className="site-checkbox-item">
                    <input
                      type="checkbox"
                      checked={sitesSelectionnes.includes(site.siteId)}
                      onChange={() => toggleSite(site.siteId)}
                    />
                    {site.nom}
                  </label>
                ))}
              </div>
            </div>
          )}

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