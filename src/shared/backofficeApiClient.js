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

// Pour les endpoints qui renvoient un fichier (ex: export CSV) plutot que
// du JSON - on ne peut pas reutiliser request() qui appelle response.json().
// Retourne le Blob tel quel ; c'est l'appelant qui declenche le
// telechargement (voir declencherTelechargement ci-dessous).
export async function adminGetFichier(path, authHeader) {
  const response = await fetch(path, { headers: { Authorization: authHeader } });

  if (!response.ok) {
    throw new Error(`Erreur API (${response.status}) sur ${path}`);
  }

  const nomFichier = extraireNomFichier(response.headers.get("Content-Disposition"));
  const blob = await response.blob();
  return { blob, nomFichier };
}

function extraireNomFichier(contentDisposition) {
  if (!contentDisposition) return "export.csv";
  const correspondance = /filename="?([^"]+)"?/.exec(contentDisposition);
  return correspondance ? correspondance[1] : "export.csv";
}

// Declenche le telechargement d'un Blob deja recupere (ex: via
// adminGetFichier) - cree un lien <a> temporaire, le "clique"
// programmatiquement, puis nettoie l'URL objet cree entre-temps.
export function declencherTelechargement(blob, nomFichier) {
  const url = window.URL.createObjectURL(blob);
  const lien = document.createElement("a");
  lien.href = url;
  lien.download = nomFichier;
  document.body.appendChild(lien);
  lien.click();
  lien.remove();
  window.URL.revokeObjectURL(url);
}