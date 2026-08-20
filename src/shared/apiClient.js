import { getDecideurToken, clearDecideurAuth } from "./decideurAuth";

// Client HTTP pour les appels API decideur.
// Utilise uniquement le JWT (login/mot de passe) — l'ancien systeme
// de tokens URL est supprime.
export async function apiGet(path) {
  const token = getDecideurToken();

  if (!token) {
    // Pas de token : redirige seulement si on n'est pas deja sur /login
    if (!window.location.pathname.startsWith("/login")) {
      window.location.href = "/login";
    }
    throw new Error("Non connecté");
  }

  const response = await fetch(path, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (response.status === 401) {
    clearDecideurAuth();
    if (!window.location.pathname.startsWith("/login")) {
      window.location.href = "/login";
    }
    throw new Error("Session expirée");
  }

  if (!response.ok) {
    throw new Error(`Erreur API (${response.status}) sur ${path}`);
  }

  return response.json();
}