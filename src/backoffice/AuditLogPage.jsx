import { useEffect, useState } from "react";
import { useAuth } from "../shared/AuthContext";
import { adminGet } from "../shared/backofficeApiClient";
import Topbar from "./Topbar";

function AuditLogPage() {
  const { getAuthHeader } = useAuth();
  const [entries, setEntries] = useState([]);
  const [erreur, setErreur] = useState(null);

  function charger() {
    adminGet("/backoffice/api/v1/audit-log", getAuthHeader())
      .then(setEntries)
      .catch((err) => setErreur(err.message));
  }

  useEffect(() => {
    charger();
  }, []);

// Echappe une valeur pour le format CSV : si elle contient une virgule,
  // un guillemet ou un retour a la ligne, on l'entoure de guillemets et
  // on double les guillemets internes (regle standard du format CSV,
  // RFC 4180).
  function echapperCsv(valeur) {
    const texte = String(valeur ?? "");
    if (texte.includes(",") || texte.includes('"') || texte.includes("\n")) {
      return '"' + texte.replace(/"/g, '""') + '"';
    }
    return texte;
  }

  function exporter() {
    const entetes = ["Date", "Auteur", "Action", "Détails"];
    const lignes = entries.map((e) =>
      [
        new Date(e.horodatage).toLocaleString("fr-FR"),
        e.auteur,
        e.action,
        e.details ?? "",
      ]
        .map(echapperCsv)
        .join(",")
    );

    // "\uFEFF" (BOM UTF-8) en tete du fichier : sans lui, Excel affiche
    // parfois mal les accents (é, è, à...) a l'ouverture d'un CSV UTF-8.
    const contenu = "\uFEFF" + entetes.join(",") + "\n" + lignes.join("\n");

    const blob = new Blob([contenu], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "journal-activite.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <Topbar title="Journal d'activité" subtitle="Traçabilité de toutes les modifications effectuées dans le Backoffice — conservation 90 jours minimum" onRefresh={charger} />

      <div className="backoffice-content">
        {erreur && <p style={{ color: "var(--color-ko)" }}>Erreur : {erreur}</p>}

        <div className="panel">
          <div className="panel-header">
            <h2>Événements récents</h2>
            <div className="panel-header-actions">
              <button className="btn-outline" onClick={exporter}>Exporter</button>
            </div>
          </div>

          <div className="audit-list">
            {entries.map((entry) => (
              <div key={entry.id} className="audit-entry">
                <span className="audit-dot"></span>
                <div>
                  <div className="audit-line">
                    <span className="audit-date">{new Date(entry.horodatage).toLocaleDateString("fr-FR")}</span>{" "}
                    <span className="audit-time">{new Date(entry.horodatage).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>{" "}
                    <strong>{entry.auteur}</strong>
                  </div>
                  <div className="audit-action">
                    {entry.action}{entry.details ? ` — ${entry.details}` : ""}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {entries.length === 0 && <p>Aucune activité enregistrée.</p>}
        </div>
      </div>
    </>
  );
}

export default AuditLogPage;