import { useEffect, useState } from "react";
import { useAuth } from "../shared/AuthContext";
import { adminGet, adminDelete } from "../shared/backofficeApiClient";
import EquipmentFormModal from "./EquipmentFormModal";
import Topbar from "./Topbar";

function EquipmentsPage() {
  const { getAuthHeader } = useAuth();
  const [sites, setSites] = useState([]);
  const [siteId, setSiteId] = useState(null);
  const [equipments, setEquipments] = useState([]);
  const [erreur, setErreur] = useState(null);
  const [modaleOuverte, setModaleOuverte] = useState(false);

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
      .then(setEquipments)
      .catch((err) => setErreur(err.message));
  }

  useEffect(() => {
    chargerEquipments();
  }, [siteId]);

  async function supprimer(equipmentId) {
    try {
      await adminDelete(`/backoffice/api/v1/equipments/${equipmentId}`, getAuthHeader());
      chargerEquipments();
    } catch (err) {
      setErreur(err.message);
    }
  }

  function apresEnregistrement() {
    setModaleOuverte(false);
    chargerEquipments();
  }

  const typeLabels = { BORNE_WIFI: "Borne Wi-Fi", COMMUTATEUR: "Commutateur" };

  return (
    <>
      <Topbar title="Équipements LAN" subtitle="Description manuelle des équipements réseau par étage et par site" onRefresh={chargerEquipments} />

      <div className="backoffice-content">
        {erreur && <p style={{ color: "var(--color-ko)" }}>Erreur : {erreur}</p>}

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
              <button className="btn-primary" disabled={!siteId} onClick={() => setModaleOuverte(true)}>
                + Nouvel équipement
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
                  <td>{eq.etageLabel}</td>
                  <td>{typeLabels[eq.type] ?? eq.type}</td>
                  <td>{eq.libelleAffiche}</td>
                  <td>{eq.netxmsObjectId}</td>
                  <td className="table-actions">
                    <button className="btn-link" style={{ color: "var(--color-ko)" }} onClick={() => supprimer(eq.id)}>
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {equipments.length === 0 && <p>Aucun équipement déclaré pour ce site.</p>}
        </div>
      </div>
    </>
  );
}

export default EquipmentsPage;