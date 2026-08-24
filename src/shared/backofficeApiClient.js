// Fonction generique : ajoute l'en-tete Authorization a chaque appel,
// et centralise la gestion des erreurs HTTP - reutilisee par GET/POST/
// PUT/DELETE ci-dessous plutot que de dupliquer cette logique 4 fois.
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