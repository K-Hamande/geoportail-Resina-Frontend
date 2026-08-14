const STORAGE_KEY = "resina-access-token";
const DEFAULT_DEV_TOKEN = "dev-token"; // secours utile uniquement en dev

let cachedToken = null;

// A appeler UNE SEULE FOIS, tres tot (voir main.jsx, avant le premier
// rendu). Lit le jeton depuis l'URL (lien securise propre a un
// ministere, §4.4 du CDC), le memorise dans localStorage pour les
// visites suivantes (le lien n'a besoin d'etre ouvert qu'une fois),
// puis nettoie l'URL - ne retire QUE le parametre "access", garde les
// autres (ex: "site") intacts.
export function initAccessToken() {
  const url = new URL(window.location.href);
  const depuisUrl = url.searchParams.get("access");

  if (depuisUrl) {
    localStorage.setItem(STORAGE_KEY, depuisUrl);
    url.searchParams.delete("access");
    window.history.replaceState({}, "", url.toString());
  }

  cachedToken = localStorage.getItem(STORAGE_KEY) || DEFAULT_DEV_TOKEN;
}

export function getAccessToken() {
  return cachedToken || DEFAULT_DEV_TOKEN;
}