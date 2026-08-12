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