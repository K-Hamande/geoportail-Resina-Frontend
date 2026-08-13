import { useEffect, useState } from "react";
import { useAuth } from "../shared/AuthContext";
import { adminGet, adminPost, adminPut } from "../shared/backofficeApiClient";
import Topbar from "./Topbar";

// Les equipements sont desormais decouverts automatiquement depuis NetXMS
// (bouton "Synchroniser") - cette page ne permet plus que d'assigner un
// etage a un equipement deja synchronise, jamais d'en creer/supprimer.
function EquipmentsPage() {
  const { getAuthHeader } = useAuth();
  const [sites, setSites] = useState([]);
  const [siteId, setSiteId] = useState(null);
  const [equipments, setEquipments] = useState([]);
  const [erreur, setErreur] = useState(null);
  const [synchronisation, setSynchronisation] = useState(false);
  const [messageSync, setMessageSync] = useState(null);

  // Brouillon des etages en cours d'edition (id equipement -> texte tape),
  // separe des valeurs enregistrees pour ne pas ecraser l'affichage
  // pendant la frappe.
  const [brouillonsEtage, setBrouillonsEtage] = useState({});

  useEffect(() => {
    adminGet("/backoffice/api/v1/sites", getAuthHeader())
      .then((data) => {
        setSites(data);
        if (data.length > 0) setSiteId(data[0].siteId);
      })
      .catch((err) => setErreur(err.message));
  }, []);

  function chargerEquipments() {
    if (!siteId) return;
    adminGet(`/backoffice/api/v1/sites/${siteId}/equipments`, getAuthHeader())
      .then((data) => {
        setEquipments(data);
        setBrouillonsEtage(Object.fromEntries(data.map((eq) => [eq.id, eq.etageLabel ?? ""])));
      })
      .catch((err) => setErreur(err.message));
  }

  useEffect(() => {
    chargerEquipments();
  }, [siteId]);

  async function synchroniser() {
    setSynchronisation(true);
    setMessageSync(null);
    setErreur(null);
    try {
      const resultat = await adminPost("/backoffice/api/v1/equipments/sync-netxms", getAuthHeader());
      setMessageSync(
        `Synchronisation terminée : ${resultat.crees} créé(s), ${resultat.misAJour} mis à jour, ` +
          `${resultat.ignores} ignoré(s) (site pas encore importé).`
      );
      chargerEquipments();
    } catch (err) {
      setErreur(err.message);
    } finally {
      setSynchronisation(false);
    }
  }

  async function enregistrerEtage(equipmentId) {
    try {
      await adminPut(`/backoffice/api/v1/equipments/${equipmentId}/etage`, getAuthHeader(), {
        etageLabel: brouillonsEtage[equipmentId] || null,
      });
      chargerEquipments();
    } catch (err) {
      setErreur(err.message);
    }
  }

  const typeLabels = { BORNE_WIFI: "Borne Wi-Fi", COMMUTATEUR: "Commutateur" };

  return (
    <>
      <Topbar
        title="Équipements LAN"
        subtitle="Équipements découverts automatiquement depuis NetXMS — assignez-leur un étage"
        onRefresh={chargerEquipments}
      />

      <div className="backoffice-content">
        {erreur && <p style={{ color: "var(--color-ko)" }}>Erreur : {erreur}</p>}
        {messageSync && <p style={{ color: "var(--color-ok)" }}>{messageSync}</p>}

        <div className="panel">
          <div className="panel-header">
            <div className="form-field" style={{ maxWidth: "320px", marginBottom: 0 }}>
              <label>Site</label>
              <select value={siteId || ""} onChange={(e) => setSiteId(e.target.value)}>
                {sites.map((site) => (
                  <option key={site.siteId} value={site.siteId}>
                    {site.nom} — {site.ville}
                  </option>
                ))}
              </select>
            </div>
            <div className="panel-header-actions">
              <button className="btn-primary" disabled={synchronisation} onClick={synchroniser}>
                {synchronisation ? "Synchronisation…" : "⟳ Synchroniser avec NetXMS"}
              </button>
            </div>
          </div>

          <table className="admin-table">
            <thead>
              <tr>
                <th>Étage</th>
                <th>Type</th>
                <th>Libellé affiché</th>
                <th>ID objet NetXMS</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {equipments.map((eq) => (
                <tr key={eq.id}>
                  <td>
                    <input
                      type="text"
                      value={brouillonsEtage[eq.id] ?? ""}
                      placeholder="Non assigné"
                      onChange={(e) =>
                        setBrouillonsEtage((prev) => ({ ...prev, [eq.id]: e.target.value }))
                      }
                      style={{ width: "140px" }}
                    />
                  </td>
                  <td>{typeLabels[eq.type] ?? eq.type}</td>
                  <td>{eq.libelleAffiche}</td>
                  <td>{eq.netxmsObjectId}</td>
                  <td className="table-actions">
                    <button
                      className="btn btn-primary"
                      disabled={brouillonsEtage[eq.id] === (eq.etageLabel ?? "")}
                      onClick={() => enregistrerEtage(eq.id)}
                    >
                      Enregistrer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {equipments.length === 0 && (
            <p>
              Aucun équipement pour ce site. Cliquez sur « Synchroniser avec NetXMS » pour les
              découvrir automatiquement.
            </p>
          )}
        </div>
      </div>
    </>
  );
}

export default EquipmentsPage;