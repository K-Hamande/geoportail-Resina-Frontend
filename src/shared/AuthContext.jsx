import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

const STORAGE_KEY = "resina-backoffice-auth";

// "Se souvenir de moi" détermine OÙ on stocke la session :
//  - localStorage  : persiste même après fermeture du navigateur
//  - sessionStorage : effacé à la fermeture de l'onglet (comportement d'origine)
export function AuthProvider({ children }) {
  // Au démarrage, on cherche d'abord dans localStorage (souvenir long),
  // puis dans sessionStorage (souvenir court) - le premier trouvé gagne.
  const [auth, setAuth] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  });

  function login(username, password, seSouvenir = false) {
    const credentials = { username, password };
    setAuth(credentials);

    // On nettoie les deux emplacements avant d'écrire, pour éviter qu'une
    // ancienne session traîne dans l'un pendant qu'on écrit dans l'autre.
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);

    const cible = seSouvenir ? localStorage : sessionStorage;
    cible.setItem(STORAGE_KEY, JSON.stringify(credentials));
  }

  function logout() {
    setAuth(null);
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
  }

  function getAuthHeader() {
    if (!auth) return null;
    return "Basic " + btoa(`${auth.username}:${auth.password}`);
  }

  const value = { auth, login, logout, getAuthHeader };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}