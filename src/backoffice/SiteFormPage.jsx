import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Building2, Tag, Plug, Info, ChevronLeft } from "lucide-react";
import { useAuth } from "../shared/AuthContext";
import { adminGet, adminPost } from "../shared/backofficeApiClient";
import ErrorBanner from "../shared/ErrorBanner";
import Preloader from "../shared/Preloader";

const TYPE_LABELS = { BORNE_WIFI: "Borne Wi-Fi", COMMUTATEUR: "Commutateur" };

// Retour utilisateur du 30/10/2026 : plus de creation manuelle de site
// (route "sites/new" retiree, cf. App.jsx) - cette page ne gere plus QUE
// l'edition d'un site deja existant (import CSV ou synchro NetXMS).
function SiteFormPage() {
  const { getAuthHeader } = useAuth();
  const navigate = useNavigate();
  const { siteId: siteIdParam } = useParams();

  const [form, setForm] = useState({
    siteId: "", nom: "", ville: "", regionAdministrative: "", province: "", batiment: "",
    latitude: "", longitude: "", contactDsiNom: "", contactDsiTelephone: "", contactDsiEmail: "",
    netxmsNodeId: "", niveaux: "",
  });

  // Equipements DEJA enregistres pour ce site, regroupes par etage+type
  // pour l'affichage recapitulatif du tableau. Lecture seule ici : les
  // equipements sont decouverts automatiquement depuis NetXMS (page
  // "Equipements LAN"), plus question d'en creer/supprimer/modifier
  // depuis ce formulaire.
  const [equipementsExistants, setEquipementsExistants] = useState([]);

  const [erreur, setErreur] = useState(null);
  const [enregistrement, setEnregistrement] = useState(false);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    // Retour utilisateur du 30/10/2026 ("chargement lent") : un seul site
    // est recupere via /sites/{id}, plus toute la liste (potentiellement
    // 1600+ sites) juste pour en retrouver un par son id.
    Promise.all([
      adminGet(`/backoffice/api/v1/sites/${siteIdParam}`, getAuthHeader()),
      adminGet(`/backoffice/api/v1/sites/${siteIdParam}/equipments`, getAuthHeader()),
    ])
      .then(([site, equipements]) => {
        setForm({
          siteId: site.siteId, nom: site.nom, ville: site.ville,
          regionAdministrative: site.regionAdministrative ?? "", province: site.province ?? "",
          batiment: site.batiment ?? "",
          latitude: site.latitude ?? "", longitude: site.longitude ?? "",
          contactDsiNom: site.contactDsiNom ?? "", contactDsiTelephone: site.contactDsiTelephone ?? "",
          contactDsiEmail: site.contactDsiEmail ?? "",
          netxmsNodeId: site.netxmsNodeId ?? "", niveaux: site.niveaux ?? "",
        });
        setEquipementsExistants(equipements);
      })
      .catch((err) => setErreur(err.message))
      .finally(() => setChargement(false));
  }, [siteIdParam]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
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

      navigate("/backoffice/sites");
    } catch (err) {
      setErreur(err.message);
    } finally {
      setEnregistrement(false);
    }
  }

  if (chargement) {
    return <Preloader />;
  }

  return (
    <div className="backoffice-content">
      <Link to="/backoffice/sites" className="site-form-back"><ChevronLeft size={13} /> Retour à la liste</Link>

      <div className="site-form-hero">
        <span className="site-form-hero-icon"><Building2 size={24} /></span>
        <div>
          <div className="site-form-hero-title">Modifier un site</div>
          <div className="site-form-hero-sub">{form.nom} — {form.ville}</div>
        </div>
      </div>

      <div className="info-banner">
        <Info size={14} style={{ verticalAlign: "-2px" }} /> Les informations saisies ici complètent les données collectées automatiquement par NetXMS. Elles ne modifient pas NetXMS.
      </div>

      <ErrorBanner message={erreur} />

      <form onSubmit={handleSubmit}>
        <div className="panel">
          <h2 className="site-form-section-title"><span className="icon-badge"><Tag size={13} /></span>Identification du site</h2>

          {/* Retour utilisateur du 30/10/2026 : Nom usuel, Ville, Région,
              Province et Bâtiment viennent de la synchronisation NetXMS /
              de l'import CSV et ne doivent plus être modifiables à la main
              depuis ce formulaire (pour éviter toute dérive avec la source
              de vérité) - affichés en lecture seule plutôt que retirés,
              pour que l'administrateur garde une vue d'ensemble du site. */}
          <div className="form-grid">
            <div className="form-field">
              <label>Nom usuel du site</label>
              <input name="nom" value={form.nom} disabled />
            </div>
            <div className="form-field">
              <label>Ville / Localisation</label>
              <input name="ville" value={form.ville} disabled />
            </div>
            <div className="form-field">
              <label>Région administrative</label>
              <input name="regionAdministrative" value={form.regionAdministrative} disabled />
            </div>
            <div className="form-field">
              <label>Province</label>
              <input name="province" value={form.province} disabled />
            </div>
            <div className="form-field">
              <label>Bâtiment</label>
              <input name="batiment" value={form.batiment} disabled />
            </div>

            <div className="form-field">
              <label>ID nœud NetXMS</label>
              <input name="netxmsNodeId" type="number" value={form.netxmsNodeId} disabled />
              <span className="field-hint">Identifiant de l'objet dans NetXMS (Network Objects)</span>
            </div>
            <div className="form-field">
              <label>Identifiant technique (site_id)</label>
              <input name="siteId" value={form.siteId} disabled />
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
              <input name="contactDsiTelephone" value={form.contactDsiTelephone} onChange={handleChange} placeholder="ex: 70 12 34 56" />
            </div>
            <div className="form-field">
              <label>Email DSI</label>
              <input type="email" name="contactDsiEmail" value={form.contactDsiEmail} onChange={handleChange} />
            </div>
          </div>
        </div>

        <div className="panel">
          <h2 className="site-form-section-title"><span className="icon-badge"><Plug size={13} /></span>Équipements LAN par étage</h2>

          {recapitulatifExistant.length > 0 ? (
            <table className="admin-table" style={{ marginBottom: "16px" }}>
              <thead>
                <tr>
                  <th>Étage</th>
                  <th>Libellé affiché</th>
                  <th>Type principal</th>
                  <th>Nb équipements</th>
                </tr>
              </thead>
              <tbody>
                {recapitulatifExistant.map((r) => (
                  <tr key={`existant-${r.etageLabel}-${r.type}`}>
                    <td>{r.etageLabel ?? "Non assigné"}</td>
                    <td>{r.libelleAffiche}</td>
                    <td>{TYPE_LABELS[r.type] ?? r.type}</td>
                    <td>{r.nombre}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>Aucun équipement synchronisé pour ce site pour l'instant.</p>
          )}

          <p style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
            Les équipements sont découverts automatiquement depuis NetXMS et ne se créent plus
            manuellement. Pour synchroniser ou assigner un étage à un équipement, rendez-vous sur la
            page <Link to="/backoffice/equipments">Équipements LAN</Link>.
          </p>
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
