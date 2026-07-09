import { useEffect, useState } from "react";
import { useAuth } from "../shared/AuthContext";
import { adminGet } from "../shared/backofficeApiClient";
import Topbar from "./Topbar";

// Transforme "Xavier KIWALO" en "KIWALO X." (nom de famille en majuscules
// + initiale du prenom), pour reprendre exactement le format d'affichage
// de la maquette de reference.
function formaterNomAffiche(nomComplet) {
  if (!nomComplet) return "Utilisateur inconnu";
  const mots = nomComplet.trim().split(/\s+/);
  if (mots.length < 2) return nomComplet.toUpperCase();

  const prenom = mots[0];
  const nomDeFamille = mots.slice(1).join(" ");
  return `${nomDeFamille.toUpperCase()} ${prenom.charAt(0).toUpperCase()}.`;
}

// Formate en "DD/MM/YYYY" + "HHhMM" (avec la lettre "h" comme separateur,
// convention administrative francophone reprise dans la maquette),
// plutot que le format ISO par defaut de toLocaleTimeString ("HH:MM").
function formaterDateHeure(dateIso) {
  const date = new Date(dateIso);
  const jour = String(date.getDate()).padStart(2, "0");
  const mois = String(date.getMonth() + 1).padStart(2, "0");
  const annee = date.getFullYear();
  const heures = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return { dateAffichee: `${jour}/${mois}/${annee}`, heureAffichee: `${heures}h${minutes}` };
}

function AuditLogPage() {
  const { getAuthHeader } = useAuth();
  const [entries, setEntries] = useState([]);
  const [nomsParLogin, setNomsParLogin] = useState({});
  const [erreur, setErreur] = useState(null);

  function charger() {
    // Les deux appels sont independants (le journal et la liste des
    // utilisateurs) - on les lance en parallele avec Promise.all,
    // exactement comme deja fait pour le Tableau de bord (Etape 9).
    Promise.all([
      adminGet("/backoffice/api/v1/audit-log", getAuthHeader()),
      adminGet("/backoffice/api/v1/users", getAuthHeader()),
    ])
      .then(([auditEntries, users]) => {
        setEntries(auditEntries);

        const lookup = {};
        users.forEach((u) => { lookup[u.login] = u.nomComplet; });
        setNomsParLogin(lookup);
      })
      .catch((err) => setErreur(err.message));
  }

  useEffect(() => {
    charger();
  }, []);

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
        nomsParLogin[e.auteur] ?? e.auteur,
        e.action,
        e.details ?? "",
      ]
        .map(echapperCsv)
        .join(",")
    );
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
      <Topbar
        title="Journal d'activité"
        subtitle="Traçabilité de toutes les modifications effectuées dans le Backoffice — conservation 90 jours minimum"
        onRefresh={charger}
      />

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
            {entries.map((entry) => {
              const { dateAffichee, heureAffichee } = formaterDateHeure(entry.horodatage);
              const nomAffiche = formaterNomAffiche(nomsParLogin[entry.auteur]);

              return (
                <div key={entry.id} className="audit-entry">
                  <span className="audit-dot"></span>
                  <div>
                    <div className="audit-line">
                      <span className="audit-date">{dateAffichee}</span>{" "}
                      <span className="audit-time">{heureAffichee}</span>{" "}
                      <strong>{nomAffiche}</strong>
                    </div>
                    <div className="audit-action">
                      {entry.action}{entry.details ? ` — ${entry.details}` : ""}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {entries.length === 0 && <p>Aucune activité enregistrée.</p>}
        </div>
      </div>
    </>
  );
}

export default AuditLogPage;