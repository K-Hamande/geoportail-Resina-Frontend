// TEMPORAIRE : en developpement, on utilise le token fixe configure
// cote backend (application-dev.yml, resina.access-token: "dev-token").
// En production, ce token viendrait d'un lien securise propre a chaque
// site/decideur (§4.4 du CDC), pas d'une valeur codee en dur ici.
export const DECIDEUR_ACCESS_TOKEN = "dev-token";