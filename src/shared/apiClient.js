const TOKEN_HEADER_NAME = "X-Resina-Site-Token";

import { getAccessToken } from "./accessToken";

// "async function" = une fonction qui peut contenir des operations
// asynchrones (ici, un appel reseau) sans bloquer le reste du programme
// pendant qu'elle attend la reponse.
export async function apiGet(path) {
  const response = await fetch(path, {
    headers: {
      [TOKEN_HEADER_NAME]: getAccessToken(),
    },
  });

  if (!response.ok) {
    throw new Error(`Erreur API (${response.status}) sur ${path}`);
  }

  return response.json();
}