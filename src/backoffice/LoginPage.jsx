import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../shared/AuthContext";
import { adminGet } from "../shared/backofficeApiClient";

function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [erreur, setErreur] = useState(null);
  const [chargement, setChargement] = useState(false);

  const { login } = useAuth();
  // useNavigate permet de changer d'URL depuis du code JavaScript
  // (pas seulement via un clic sur <Link>), typiquement apres une
  // action reussie comme une connexion.
  const navigate = useNavigate();

  async function handleSubmit(e) {
    // Empeche le comportement par defaut du navigateur (recharger la
    // page a la soumission d'un formulaire HTML) - on gere tout en JS.
    e.preventDefault();
    setErreur(null);
    setChargement(true);

    // On ne sait pas encore si login/motdepasse sont corrects : on
    // construit l'en-tete nous-memes et on TESTE avec un vrai appel API,
    // plutot que de faire confiance a l'avance.
    const authHeader = "Basic " + btoa(`${username}:${password}`);

    try {
      await adminGet("/backoffice/api/v1/sites", authHeader);
      // Si on arrive ici, l'appel a reussi (pas d'exception) -> les
      // identifiants sont valides, on les memorise vraiment.
      login(username, password);
      navigate("/backoffice");
    } catch (err) {
      setErreur("Identifiants incorrects.");
    } finally {
      setChargement(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-icon">R</div>
        <h1 className="login-title">Backoffice DEST/DIG</h1>
        <p className="login-subtitle">Géoportail RESINA — Accès réservé aux agents techniques</p>

        <form onSubmit={handleSubmit}>
          <label className="login-label">Identifiant</label>
          <input
            className="login-input"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
          />

          <label className="login-label">Mot de passe</label>
          <input
            className="login-input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {erreur && <p className="login-error">{erreur}</p>}

          <button className="btn-primary login-submit" type="submit" disabled={chargement}>
            {chargement ? "Connexion..." : "Se connecter"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;