import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useAuth } from "../shared/AuthContext";
import { adminGet, adminPost } from "../shared/backofficeApiClient";

const TYPE_LABELS = { BORNE_WIFI: "Borne Wi-Fi", COMMUTATEUR: "Commutateur" };

function SiteFormPage() {
  const { getAuthHeader } = useAuth();
  const navigate = useNavigate();
  // useParams lit les segments dynamiques de l'URL declares dans App.jsx
  // (ex: "/backoffice/sites/:siteId/edit" -> { siteId: "primature" }).
  // En creation, l'URL ne contient pas ce segment -> siteId est "undefined".
  const { siteId: siteIdParam } = useParams();
  const isEdition = Boolean(siteIdParam);

  const [form, setForm] = useState({
    siteId: "", nom: "", ville: "", regionAdministrative: "", batiment: "",
    latitude: "", longitude: "", contactDsiNom: "", contactDsiTelephone: "",
    netxmsNodeId: "", niveaux: "",
  });

  // Equipements DEJA enregistres pour ce site (mode edition uniquement),
  // regroupes par etage+type pour l'affichage recapitulatif du tableau.
  const [equipementsExistants, setEquipementsExistants] = useState([]);

  // Nouvelles lignes de niveaux a creer, ajoutees via "+ Ajouter un niveau"
  // avant meme d'enregistrer le site.
  const [nouveauxNiveaux, setNouveauxNiveaux] = useState([]);

  const [erreur, setErreur] = useState(null);
  const [enregistrement, setEnregistrement] = useState(false);
  const [chargement, setChargement] = useState(isEdition);

  useEffect(() => {
    if (!isEdition) return;

    Promise.all([
      adminGet("/backoffice/api/v1/sites", getAuthHeader()),
      adminGet(`/backoffice/api/v1/sites/${siteIdParam}/equipments`, getAuthHeader()),
    ])
      .then(([sites, equipements]) => {
        const site = sites.find((s) => s.siteId === siteIdParam);
        if (site) {
          setForm({
            siteId: site.siteId, nom: site.nom, ville: site.ville,
            regionAdministrative: site.regionAdministrative ?? "", batiment: site.batiment ?? "",
            latitude: site.latitude ?? "", longitude: site.longitude ?? "",
            contactDsiNom: site.contactDsiNom ?? "", contactDsiTelephone: site.contactDsiTelephone ?? "",
            netxmsNodeId: site.netxmsNodeId ?? "", niveaux: site.niveaux ?? "",
          });
        }
        setEquipementsExistants(equipements);
      })
      .catch((err) => setErreur(err.message))
      .finally(() => setChargement(false));
  }, [isEdition, siteIdParam]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function ajouterNiveau() {
    setNouveauxNiveaux((prev) => [
      ...prev,
      { id: Date.now(), etageLabel: "", libelleAffiche: "", type: "BORNE_WIFI", nombre: 1 },
    ]);
  }

  function modifierNiveau(id, champ, valeur) {
    setNouveauxNiveaux((prev) =>
      prev.map((n) => (n.id === id ? { ...n, [champ]: valeur } : n))
    );
  }

  function retirerNiveau(id) {
    setNouveauxNiveaux((prev) => prev.filter((n) => n.id !== id));
  }

  // Regroupe les equipements existants par (etage, type) pour afficher
  // un recapitulatif compact plutot qu'une ligne par appareil individuel
  // (le detail appareil par appareil reste gere sur la page "Equipements LAN").
  const recapitulatifExistant = Object.values(
    equipementsExistants.reduce((acc, eq) => {
      const cle = `${eq.etageLabel}-${eq.type}`;
      if (!acc[cle]) {
        acc[cle] = { etageLabel: eq.etageLabel, type: eq.type, libelleAffiche: eq.libelleAffiche, nombre: 0 };
      }
      acc[cle].nombre += 1;
      return acc;
    }, {})
  );

  async function handleSubmit(e) {
    e.preventDefault();
    setErreur(null);
    setEnregistrement(true);

    try {
      const payload = {
        ...form,
        latitude: form.latitude === "" ? null : parseFloat(form.latitude),
        longitude: form.longitude === "" ? null : parseFloat(form.longitude),
        netxmsNodeId: form.netxmsNodeId === "" ? null : parseInt(form.netxmsNodeId, 10),
        niveaux: form.niveaux === "" ? null : parseInt(form.niveaux, 10),
      };

      await adminPost("/backoffice/api/v1/sites", getAuthHeader(), payload);

      // Pour chaque niveau ajoute, on cree "nombre" equipements individuels
      // (un appel API par appareil). Promise.all lance toutes les creations
      // d'un meme niveau en parallele.
      for (const niveau of nouveauxNiveaux) {
        const creations = Array.from({ length: Number(niveau.nombre) || 1 }, (_, index) => {
          const libelle = Number(niveau.nombre) > 1
            ? `${niveau.libelleAffiche} ${index + 1}`
            : niveau.libelleAffiche;

          return adminPost(`/backoffice/api/v1/sites/${form.siteId}/equipments`, getAuthHeader(), {
            etageLabel: niveau.etageLabel,
            type: niveau.type,
            libelleAffiche: libelle,
            netxmsObjectId: null,
          });
        });
        await Promise.all(creations);
      }

      navigate("/backoffice/sites");
    } catch (err) {
      setErreur(err.message);
    } finally {
      setEnregistrement(false);
    }
  }

  if (chargement) {
    return <p style={{ padding: "32px" }}>Chargement...</p>;
  }

  return (
    <div className="backoffice-content">
      <Link to="/backoffice/sites" className="back-link">← Retour à la liste</Link>

      <h1 style={{ marginTop: "12px" }}>{isEdition ? "Modifier un site" : "Créer un site"}</h1>
      <p className="page-subtitle">
        {isEdition ? `${form.nom} — ${form.ville}` : "Nouveau bâtiment institutionnel connecté au RESINA"}
      </p>

      <div className="info-banner">
        ℹ️ Les informations saisies ici complètent les données collectées automatiquement par NetXMS. Elles ne modifient pas NetXMS.
      </div>

      {erreur && <p style={{ color: "var(--color-ko)" }}>Erreur : {erreur}</p>}

      <form onSubmit={handleSubmit}>
        <div className="panel">
          <h2 style={{ fontSize: "15px", marginBottom: "16px" }}>Identification du site</h2>

          <div className="form-grid">
            <div className="form-field">
              <label>Nom usuel du site *</label>
              <input name="nom" value={form.nom} onChange={handleChange} required />
            </div>
            <div className="form-field">
              <label>Ville / Localisation *</label>
              <input name="ville" value={form.ville} onChange={handleChange} required />
            </div>

            <div className="form-field">
              <label>Région administrative</label>
              <select name="regionAdministrative" value={form.regionAdministrative} onChange={handleChange}>
                <option value="">—</option>
                <option value="Centre">Centre</option>
                <option value="Hauts-Bassins">Hauts-Bassins</option>
                <option value="Sahel">Sahel</option>
                <option value="Sud-Ouest">Sud-Ouest</option>
                <option value="Boucle du Mouhoun">Boucle du Mouhoun</option>
                <option value="Cascades">Cascades</option>
                <option value="Centre-Est">Centre-Est</option>
                <option value="Centre-Nord">Centre-Nord</option>
                <option value="Centre-Ouest">Centre-Ouest</option>
                <option value="Centre-Sud">Centre-Sud</option>
                <option value="Est">Est</option>
                <option value="Nord">Nord</option>
                <option value="Plateau-Central">Plateau-Central</option>
              </select>
            </div>
            <div className="form-field">
              <label>ID nœud NetXMS *</label>
              <input name="netxmsNodeId" type="number" value={form.netxmsNodeId} onChange={handleChange} required disabled={isEdition} />
              <span className="field-hint">Identifiant de l'objet dans NetXMS (Network Objects)</span>
            </div>

            <div className="form-field">
              <label>Identifiant technique (site_id) *</label>
              <input name="siteId" value={form.siteId} onChange={handleChange} required disabled={isEdition} />
            </div>
            <div className="form-field">
              <label>Nombre d'étages *</label>
              <input name="niveaux" type="number" value={form.niveaux} onChange={handleChange} required />
            </div>

            <div className="form-field">
              <label>Nom du contact DSI</label>
              <input name="contactDsiNom" value={form.contactDsiNom} onChange={handleChange} />
            </div>
            <div className="form-field">
              <label>Téléphone DSI</label>
              <input name="contactDsiTelephone" value={form.contactDsiTelephone} onChange={handleChange} />
            </div>
          </div>
        </div>

        <div className="panel">
          <h2 style={{ fontSize: "15px", marginBottom: "16px" }}>Équipements LAN par étage</h2>

          {(recapitulatifExistant.length > 0 || nouveauxNiveaux.length > 0) && (
            <table className="admin-table" style={{ marginBottom: "16px" }}>
              <thead>
                <tr>
                  <th>Étage</th>
                  <th>Libellé affiché</th>
                  <th>Type principal</th>
                  <th>Nb équipements</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {recapitulatifExistant.map((r) => (
                  <tr key={`existant-${r.etageLabel}-${r.type}`}>
                    <td>{r.etageLabel}</td>
                    <td>{r.libelleAffiche}</td>
                    <td>{TYPE_LABELS[r.type] ?? r.type}</td>
                    <td>{r.nombre}</td>
                    <td><span className="status-badge badge-ok">Déjà enregistré</span></td>
                  </tr>
                ))}

                {nouveauxNiveaux.map((n) => (
                  <tr key={n.id}>
                    <td>
                      <input
                        className="inline-input"
                        placeholder="ex: R+1"
                        value={n.etageLabel}
                        onChange={(e) => modifierNiveau(n.id, "etageLabel", e.target.value)}
                        required
                      />
                    </td>
                    <td>
                      <input
                        className="inline-input"
                        placeholder="ex: Premier étage"
                        value={n.libelleAffiche}
                        onChange={(e) => modifierNiveau(n.id, "libelleAffiche", e.target.value)}
                        required
                      />
                    </td>
                    <td>
                      <select
                        className="inline-input"
                        value={n.type}
                        onChange={(e) => modifierNiveau(n.id, "type", e.target.value)}
                      >
                        <option value="BORNE_WIFI">Borne Wi-Fi</option>
                        <option value="COMMUTATEUR">Commutateur</option>
                      </select>
                    </td>
                    <td>
                      <input
                        className="inline-input"
                        type="number"
                        min="1"
                        style={{ width: "70px" }}
                        value={n.nombre}
                        onChange={(e) => modifierNiveau(n.id, "nombre", e.target.value)}
                      />
                    </td>
                    <td>
                      <button type="button" className="btn-link" style={{ color: "var(--color-ko)" }} onClick={() => retirerNiveau(n.id)}>
                        Retirer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <button type="button" className="btn-outline" onClick={ajouterNiveau}>
            + Ajouter un niveau
          </button>

          {isEdition && (
            <p style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "12px" }}>
              Pour modifier ou supprimer un équipement individuel déjà enregistré, rendez-vous sur la page{" "}
              <Link to="/backoffice/equipments">Équipements LAN</Link>.
            </p>
          )}
        </div>

        <div className="form-footer-actions">
          <Link to="/backoffice/sites" className="btn-secondary" style={{ textDecoration: "none" }}>
            Annuler
          </Link>
          <button type="submit" className="btn-primary" disabled={enregistrement}>
            {enregistrement ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default SiteFormPage;