import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./shared/AuthContext";
import MonSitePage from "./decideur/MonSitePage";
import CartePage from "./decideur/CartePage";
import AlertesPage from "./decideur/AlertesPage";
import LoginPage from "./backoffice/LoginPage";
import DashboardPage from "./backoffice/DashboardPage";
import ProtectedRoute from "./backoffice/ProtectedRoute";

function App() {
  return (
    // AuthProvider enveloppe TOUTE l'application : n'importe quel
    // composant, decideur ou backoffice, pourra utiliser useAuth().
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MonSitePage />} />
          <Route path="/carte" element={<CartePage />} />
          <Route path="/alertes" element={<AlertesPage />} />

          <Route path="/backoffice/login" element={<LoginPage />} />
          <Route
            path="/backoffice"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;