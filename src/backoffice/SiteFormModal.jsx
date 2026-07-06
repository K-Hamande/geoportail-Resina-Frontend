import { useState } from "react";
import { useAuth } from "../shared/AuthContext";
import { adminPost } from "../shared/backofficeApiClient";

// "site" est soit null (mode CREATION), soit un objet existant (mode
// MODIFICATION, pre-remplissage). "onClose" ferme la modale, "onSaved"
// est appele apres succes pour rafraichir la liste dans le parent.
function SiteFormModal({ site, onClose, onSaved }) {
  const { getAuthHeader } = useAuth();
  const isEdition = site != null;

  // Un seul objet d'etat regroupe TOUS les champs du formulaire, plutot
  // que 11 useState separes - plus simple a gerer pour un formulaire
  // avec autant de champs.
  const [form, setForm] = useState({
    siteId: site?.siteId ?? "",
    nom: site?.nom ?? "",
    ville: site?.ville ?? "",
    regionAdministrative: site?.regionAdministrative ?? "",
    batiment: site?.batiment ?? "",
    latitude: site?.latitude ?? "",
    longitude: site?.longitude ?? "",
    contactDsiNom: site?.contactDsiNom ?? "",
    contactDsiTelephone: site?.contactDsiTelephone ?? "",
    netxmsNodeId: site?.netxmsNodeId ?? "",
    niveaux: site?.niveaux ?? "",
  });
  const [erreur, setErreur] = useState(null);
  const [enregistrement, setEnregistrement] = useState(false);

  // Une SEULE fonction generique pour tous les champs texte : met a
  // jour uniquement la cle correspondant au "name" de l'input modifie.
  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErreur(null);
    setEnregistrement(true);

    try {
      const payload = {
        ...form,
        // Le backend attend des nombres pour ces 4 champs, pas du texte -
        // les inputs HTML renvoient toujours des chaines, meme pour un
        // champ "type=number". On convertit explicitement, en laissant
        // "null" si le champ est vide plutot que d'envoyer une chaine vide.
        latitude: form.latitude === "" ? null : parseFloat(form.latitude),
        longitude: form.longitude === "" ? null : parseFloat(form.longitude),
        netxmsNodeId: form.netxmsNodeId === "" ? null : parseInt(form.netxmsNodeId, 10),
        niveaux: form.niveaux === "" ? null : parseInt(form.niveaux, 10),
      };

      await adminPost("/backoffice/api/v1/sites", getAuthHeader(), payload);
      onSaved();
    } catch (err) {
      setErreur(err.message);
    } finally {
      setEnregistrement(false);
    }
  }

  return (
    // L'overlay sombre en arriere-plan ; cliquer dessus ferme la modale
    // (mais pas un clic a l'INTERIEUR de la boite, cf. stopPropagation).
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <h2>{isEdition ? "Modifier un site" : "Nouveau site"}</h2>

        {isEdition && (
          <p className="modal-hint">
            Les informations saisies ici complètent les données collectées automatiquement par NetXMS.
          </p>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-field">
              <label>Identifiant du site *</label>
              <input name="siteId" value={form.siteId} onChange={handleChange} disabled={isEdition} required />
            </div>
            <div className="form-field">
              <label>Nom du site *</label>
              <input name="nom" value={form.nom} onChange={handleChange} required />
            </div>
            <div className="form-field">
              <label>Ville *</label>
              <input name="ville" value={form.ville} onChange={handleChange} required />
            </div>
            <div className="form-field">
              <label>Région administrative</label>
              <input name="regionAdministrative" value={form.regionAdministrative} onChange={handleChange} />
            </div>
            <div className="form-field">
              <label>Bâtiment</label>
              <input name="batiment" value={form.batiment} onChange={handleChange} />
            </div>
            <div className="form-field">
              <label>ID nœud NetXMS *</label>
              <input name="netxmsNodeId" type="number" value={form.netxmsNodeId} onChange={handleChange} required />
            </div>
            <div className="form-field">
              <label>Nombre d'étages *</label>
              <input name="niveaux" type="number" value={form.niveaux} onChange={handleChange} required />
            </div>
            <div className="form-field">
              <label>Latitude</label>
              <input name="latitude" type="number" step="0.0001" value={form.latitude} onChange={handleChange} />
            </div>
            <div className="form-field">
              <label>Longitude</label>
              <input name="longitude" type="number" step="0.0001" value={form.longitude} onChange={handleChange} />
            </div>
            <div className="form-field">
              <label>Contact DSI — Nom</label>
              <input name="contactDsiNom" value={form.contactDsiNom} onChange={handleChange} />
            </div>
            <div className="form-field">
              <label>Contact DSI — Téléphone</label>
              <input name="contactDsiTelephone" value={form.contactDsiTelephone} onChange={handleChange} />
            </div>
          </div>

          {erreur && <p style={{ color: "var(--color-ko)" }}>Erreur : {erreur}</p>}

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className="btn-primary" disabled={enregistrement}>
              {enregistrement ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SiteFormModal;