import { Navigate } from "react-router-dom";
import { useAuth } from "../shared/AuthContext";

// Ce composant "enveloppe" une page : si l'utilisateur n'est pas
// connecte, on affiche <Navigate> (une redirection) au lieu du contenu
// demande. Sinon, on affiche normalement "children".
function ProtectedRoute({ children }) {
  const { auth } = useAuth();

  if (!auth) {
    return <Navigate to="/backoffice/login" replace />;
  }

  return children;
}

export default ProtectedRoute;