import { getDecideurToken, clearDecideurAuth } from "./decideurAuth";

export async function apiGet(path) {
  const token = getDecideurToken();
  const estBackoffice = window.location.pathname.startsWith("/backoffice");

  if (!token && !estBackoffice) {
    if (!window.location.pathname.startsWith("/login")) {
      window.location.href = "/login";
    }
    throw new Error("Non connecté");
  }

  const headers = token
    ? { Authorization: `Bearer ${token}` }
    : {};

  const response = await fetch(path, { headers });

  if (response.status === 401 && !estBackoffice) {
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