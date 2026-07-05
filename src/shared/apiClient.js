const TOKEN_HEADER_NAME = "X-Resina-Site-Token";

import { DECIDEUR_ACCESS_TOKEN } from "./config";

// "async function" = une fonction qui peut contenir des operations
// asynchrones (ici, un appel reseau) sans bloquer le reste du programme
// pendant qu'elle attend la reponse.
export async function apiGet(path) {
  // fetch() est la fonction native du navigateur pour faire des appels
  // HTTP. "await" met en pause CETTE fonction (pas tout le programme)
  // jusqu'a ce que la reponse arrive.
  const response = await fetch(path, {
    headers: {
      [TOKEN_HEADER_NAME]: DECIDEUR_ACCESS_TOKEN,
    },
  });

  if (!response.ok) {
    // response.ok est "false" si le code HTTP est 4xx ou 5xx
    // (contrairement a d'autres langages, fetch ne leve PAS d'exception
    // automatiquement sur une erreur HTTP - il faut la detecter soi-meme).
    throw new Error(`Erreur API (${response.status}) sur ${path}`);
  }

  // Convertit le corps de la reponse (du texte JSON) en objet JavaScript
  return response.json();
}