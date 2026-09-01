// Formate une date ISO en "Il y a Xh" / "Hier HH:mm" / date complete,
// dans le meme esprit que la maquette de reference (Annexe A.3).
export function formaterTempsRelatif(dateIso) {
  const date = new Date(dateIso);
  const maintenant = new Date();
  const diffMs = maintenant - date;
  const diffHeures = diffMs / (1000 * 60 * 60);

  if (diffHeures < 1) {
    const minutes = Math.max(1, Math.round(diffMs / (1000 * 60)));
    return `Il y a ${minutes} min`;
  }
  if (diffHeures < 24) {
    return `Il y a ${Math.round(diffHeures)}h`;
  }

  const estHier = date.toDateString() === new Date(maintenant.setDate(maintenant.getDate() - 1)).toDateString();
  const heure = date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  return estHier ? `Hier ${heure}` : date.toLocaleDateString("fr-FR") + " " + heure;
}

// Formate une duree en minutes en texte lisible ("37 min", "3 h 20 min",
// "2 j 4 h") - utilise notamment par la page "Historique des incidents"
// pour afficher la duree d'une panne.
export function formaterDureeMinutes(minutes) {
  if (minutes < 1) return "< 1 min";
  if (minutes < 60) return `${minutes} min`;

  const heures = Math.floor(minutes / 60);
  const minutesRestantes = minutes % 60;

  if (heures < 24) {
    return minutesRestantes > 0 ? `${heures} h ${minutesRestantes} min` : `${heures} h`;
  }

  const jours = Math.floor(heures / 24);
  const heuresRestantes = heures % 24;
  return heuresRestantes > 0 ? `${jours} j ${heuresRestantes} h` : `${jours} j`;
}