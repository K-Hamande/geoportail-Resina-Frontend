import { createContext, useContext, useState } from "react";

// createContext cree un "canal" de partage de donnees. Par defaut,
// sa valeur est "null" tant qu'aucun Provider ne l'a definie.
const AuthContext = createContext(null);

const STORAGE_KEY = "resina-backoffice-auth";

// Composant "Provider" : englobe une partie de l'application (ici, TOUTE
// l'app) et fournit la donnee "auth" + les fonctions pour la modifier
// a tous les composants descendants, quelle que soit leur profondeur.
export function AuthProvider({ children }) {
  // Au demarrage, on relit sessionStorage : si l'utilisateur avait deja
  // rechargé la page apres s'etre connecte, on evite de le deconnecter.
  const [auth, setAuth] = useState(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  });

  function login(username, password) {
    const credentials = { username, password };
    setAuth(credentials);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(credentials));
  }

  function logout() {
    setAuth(null);
    sessionStorage.removeItem(STORAGE_KEY);
  }

  // btoa() encode une chaine de texte en base64 - exactement le format
  // attendu par l'en-tete HTTP "Authorization: Basic ...".
  function getAuthHeader() {
    if (!auth) return null;
    return "Basic " + btoa(`${auth.username}:${auth.password}`);
  }

  const value = { auth, login, logout, getAuthHeader };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook personnalise : simplifie l'utilisation du contexte dans les
// composants ("useAuth()" au lieu de "useContext(AuthContext)" partout).
export function useAuth() {
  return useContext(AuthContext);
}