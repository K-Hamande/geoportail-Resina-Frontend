import { useAuth } from "../shared/AuthContext";

function DashboardPage() {
  const { auth, logout } = useAuth();

  return (
    <div style={{ padding: "24px", fontFamily: "var(--font-main)" }}>
      <h1>Backoffice DEST/DIG</h1>
      <p>Connecté en tant que : <strong>{auth?.username}</strong></p>
      <button className="btn-primary" onClick={logout}>
        Se déconnecter
      </button>
      <p style={{ marginTop: "24px", color: "var(--color-text-muted)" }}>
        Tableau de bord complet — à construire à l'Étape 9.
      </p>
    </div>
  );
}

export default DashboardPage;