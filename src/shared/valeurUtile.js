// NetXMS renvoie souvent un simple "-" (ou une chaine vide) pour un champ
// non renseigne (vendor, product_name, net_location...) plutot que null -
// sans ce filtre, le decideur voyait litteralement "Modèle -" affiche
// comme une vraie valeur. Centralise ici car utilise a la fois par
// AnpticStatusCard.jsx (equipement principal) et LanStatusCard.jsx
// (equipements du reseau batimentaire).
export function estValeurUtile(valeur) {
  if (valeur == null) return false;
  const nettoyee = String(valeur).trim();
  if (nettoyee === "") return false;
  // "-", "--", "n/a", "N/A" : placeholders frequents cote NetXMS pour "non renseigne".
  return !/^-+$|^n\/a$/i.test(nettoyee);
}
