// Fonction generique : ajoute l'en-tete Authorization a chaque appel,
// et centralise la gestion des erreurs HTTP - reutilisee par GET/POST/
// PUT/DELETE ci-dessous plutot que de dupliquer cette logique 4 fois.
async function request(path, method, authHeader, body) {
  const headers = { Authorization: authHeader };
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    throw new Error(`Erreur API (${response.status}) sur ${path}`);
  }

  // Certains endpoints (ex: deactivate) renvoient une reponse vide -
  // on evite de planter en essayant de parser du JSON inexistant.
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

export function adminGet(path, authHeader) {
  return request(path, "GET", authHeader);
}

export function adminPost(path, authHeader, body) {
  return request(path, "POST", authHeader, body ?? {});
}

export function adminPut(path, authHeader, body) {
  return request(path, "PUT", authHeader, body ?? {});
}

export function adminDelete(path, authHeader) {
  return request(path, "DELETE", authHeader);
}