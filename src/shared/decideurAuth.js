const STORAGE_KEY = "resina-decideur-auth";

// Nom de l'evenement declenche a chaque connexion/deconnexion, pour que
// App.jsx (DecideurRoutes) puisse reagir immediatement et re-evaluer
// quelle partie de l'arbre de routes afficher. Sans cet evenement, la
// deconnexion (navigate("/login") en SPA, sans rechargement complet) ne
// provoquait aucun nouveau rendu de DecideurRoutes : l'arbre de routes
// "decideur authentifie" restait affiche en arriere-plan, pret a
// reafficher une session fantome au moindre retour en arriere ou lien
// direct vers "/", "/carte" ou "/alertes".
export const DECIDEUR_AUTH_CHANGE_EVENT = "resina-decideur-auth-change";

// Stocke le token JWT et le profil apres connexion reussie.
// localStorage : persiste apres fermeture du navigateur (pratique
// pour les decideurs qui ouvrent l'appli tous les matins).
export function saveDecideurAuth(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  window.dispatchEvent(new Event(DECIDEUR_AUTH_CHANGE_EVENT));
}

export function getDecideurAuth() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function clearDecideurAuth() {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event(DECIDEUR_AUTH_CHANGE_EVENT));
}

export function getDecideurToken() {
  return getDecideurAuth()?.token || null;
}

export function getDecideurRole() {
  return getDecideurAuth()?.role || null;
}

export function getDecideurMinistere() {
  return getDecideurAuth()?.ministere || null;
}

export function estConnecteDecideur() {
  const auth = getDecideurAuth();
  if (!auth?.token) return false;
  // Verifie que le token n'est pas expire (decodage basique sans bibliotheque)
  try {
    const payload = JSON.parse(atob(auth.token.split(".")[1]));
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}