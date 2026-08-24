// Fonction generique : ajoute l'en-tete Authorization a chaque appel,
// et centralise la gestion des erreurs HTTP - reutilisee par GET/POST/
// PUT/DELETE ci-dessous plutot que de dupliquer cette logique 4 fois.
// Client HTTP pour le Backoffice (Basic Auth).
// Centralise la gestion des en-tetes Authorization et des erreurs HTTP.
// Distinct de apiClient.js (qui utilise JWT pour les decideurs).

export async function adminGet(path, authHeader) {
  const response = await fetch(path, {
    headers: {
      Authorization: authHeader,
    },
  });

  if (!response.ok) {
    throw new Error(`Erreur API (${response.status}) sur ${path}`);
  }

  return response.json();
}

export async function adminPost(path, authHeader, body) {
  const response = await fetch(path, {
    method: "POST",
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    throw new Error(`Erreur API (${response.status}) sur ${path}`);
  }

  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

export async function adminPut(path, authHeader, body) {
  const response = await fetch(path, {
    method: "PUT",
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    throw new Error(`Erreur API (${response.status}) sur ${path}`);
  }

  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

export async function adminDelete(path, authHeader) {
  const response = await fetch(path, {
    method: "DELETE",
    headers: {
      Authorization: authHeader,
    },
  });

  if (!response.ok) {
    throw new Error(`Erreur API (${response.status}) sur ${path}`);
  }

  return null;
}