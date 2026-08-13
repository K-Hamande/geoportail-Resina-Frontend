import { useState } from "react";

function classFor(status) {
  if (status === "KO") return "ko";
  if (status === "WARN") return "warn";
  if (status === "UNKNOWN") return "unknown";
  return "ok";
}

const TYPE_LABELS = { BORNE_WIFI: "Borne Wi-Fi", COMMUTATEUR: "Commutateur" };

// Ne garde que les chiffres d'un numero de telephone. Si le numero est au
// format local burkinabe (8 chiffres, commence par 0), on le convertit au
// format international requis par WhatsApp (indicatif 226, sans le 0).
// Hypothese raisonnable pour ce projet ; a ajuster si des contacts DSI
// utilisent un indicatif different.
function normaliserNumero(numero) {
  if (!numero) return null;
  const chiffres = numero.replace(/\D/g, "");
  if (chiffres.length === 8) return "226" + chiffres;
  if (chiffres.length === 9 && chiffres.startsWith("0")) return "226" + chiffres.slice(1);
  return chiffres;
}

// Fonction nommee plutot qu'une fleche inline dans onClick - evite tout
// souci avec le nouveau moteur de transformation JSX de Vite sur ce
// pattern precis.
function ignorerClicParent(event) {
  event.stopPropagation();
}

function BoutonWhatsapp(props) {
  const lien = "https://wa.me/" + props.numero;
  return (
    <a className="lan-contact-btn lan-contact-btn-whatsapp" href={lien} target="_blank" rel="noopener noreferrer" onClick={ignorerClicParent}>
      <span>💬</span> WhatsApp
    </a>
  );
}

function BoutonAppel(props) {
  const lien = "tel:" + props.numero;
  return (
    <a className="lan-contact-btn lan-contact-btn-appel" href={lien} onClick={ignorerClicParent}>
      <span>📞</span> Appeler
    </a>
  );
}

function ContactDsiPanel(props) {
  const contact = props.contact;

  if (!contact) {
    return (
      <p className="lan-contact-absent">
        Aucun contact DSI renseigné pour ce site. Ajoutez-le depuis le backoffice.
      </p>
    );
  }

  const numeroWhatsapp = normaliserNumero(contact.telephone);
  const numeroAppel = contact.telephone ? contact.telephone.replace(/\s/g, "") : null;

  return (
    <div className="lan-contact-card">
      <div className="lan-contact-nom">{contact.nom || "Contact DSI"}</div>
      {contact.email && <div className="lan-contact-detail">{contact.email}</div>}
      {contact.telephone && <div className="lan-contact-detail">{contact.telephone}</div>}

      <div className="lan-contact-buttons">
        {numeroWhatsapp && <BoutonWhatsapp numero={numeroWhatsapp} />}
        {numeroAppel && <BoutonAppel numero={numeroAppel} />}
      </div>
    </div>
  );
}

function LanStatusCard({ data }) {
  // Ensemble des noms d'etage actuellement deplies - un Set permet
  // d'avoir plusieurs etages ouverts en meme temps sans se marcher dessus.
  const [etagesOuverts, setEtagesOuverts] = useState(new Set());

  if (!data) {
    return <div className="status-card">Chargement...</div>;
  }

  function basculerEtage(nom) {
    setEtagesOuverts((prev) => {
      const suivant = new Set(prev);
      if (suivant.has(nom)) suivant.delete(nom);
      else suivant.add(nom);
      return suivant;
    });
  }

  const badgeClass = data.globalStatus === "KO" ? "badge-ko" : data.globalStatus === "WARN" ? "badge-warn" : "badge-ok";
  const badgeText = data.globalStatus === "KO" ? "✕ Incident" : data.globalStatus === "WARN" ? "⚠ Alerte" : "✓ Normal";

  return (
    <div className="status-card">
      <div className="card-top">
        <div className="card-icon">🏢</div>
        <div className="card-titles">
          <div className="card-title">Réseau du bâtiment</div>
          <div className="card-subtitle">LAN interne — Wi-Fi &amp; commutateurs</div>
        </div>
        <span className={`status-badge ${badgeClass}`}>{badgeText}</span>
      </div>

      <div className="counters-row">
        <div className="counter-box">
          <div className="counter-value">{data.equipementsActifs}</div>
          <div className="counter-label">actifs sur {data.equipementsTotal}</div>
        </div>
        <div className="counter-box">
          <div className={`counter-value ${data.equipementsEnPanne > 0 ? "danger" : ""}`}>{data.equipementsEnPanne}</div>
          <div className="counter-label">en panne</div>
        </div>
        <div className="counter-box">
          <div className="counter-value">{data.etats.length}</div>
          <div className="counter-label">niveaux surveillés</div>
        </div>
      </div>

      <div className="lan-split">
        <div className="lan-floors-col">
          <div className="floors-title">État par niveau</div>

          {data.etats.map((etage) => {
            const ouvert = etagesOuverts.has(etage.etage);

            return (
              <div
                key={etage.etage}
                className={`floor-row ${classFor(etage.status)} ${ouvert ? "expanded" : ""}`}
                onClick={() => basculerEtage(etage.etage)}
              >
                <div className="floor-row-header">
                  <span className={`floor-dot ${classFor(etage.status)}`}></span>
                  <div>
                    <div className="floor-name">{etage.etage}</div>
                    <div className="floor-detail">{etage.detail}</div>
                  </div>
                  <span className="floor-chevron">▼</span>
                </div>

                {ouvert && (
                  <div className="floor-equipment-list" onClick={ignorerClicParent}>
                    {etage.equipements.map((eq) => (
                      <div key={eq.id} className="floor-equipment-item">
                        <span className={`floor-equipment-dot ${classFor(eq.status)}`}></span>
                        <span className="floor-equipment-name">{eq.libelleAffiche}</span>
                        <span className="floor-equipment-type">{TYPE_LABELS[eq.type] ?? eq.type}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className={`lan-action-col ${data.actionMessage ? "lan-action-col-alerte" : ""}`}>
          <div className="lan-action-title">Action requise</div>
          {data.actionMessage && <p className="lan-action-message">{data.actionMessage}</p>}
          <ContactDsiPanel contact={data.contactDsi} />
        </div>
      </div>
    </div>
  );
}

export default LanStatusCard;