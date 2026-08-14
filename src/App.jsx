import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./shared/AuthContext";
import { SiteSelectionProvider } from "./shared/SiteSelectionContext";
import MonSitePage from "./decideur/MonSitePage";
import CartePage from "./decideur/CartePage";
import AlertesPage from "./decideur/AlertesPage";
import LoginPage from "./backoffice/LoginPage";
import ProtectedRoute from "./backoffice/ProtectedRoute";
import BackofficeLayout from "./backoffice/BackofficeLayout";
import DashboardPage from "./backoffice/DashboardPage";
import SitesPage from "./backoffice/SitesPage";
import EquipmentsPage from "./backoffice/EquipmentsPage";
import CartographyPage from "./backoffice/CartographyPage";
import NotificationsAdminPage from "./backoffice/NotificationsAdminPage";
import UsersPage from "./backoffice/UsersPage";
import AuditLogPage from "./backoffice/AuditLogPage";
import MinistryTokensPage from "./backoffice/MinistryTokensPage";
import SiteFormPage from "./backoffice/SiteFormPage";

// Regroupe les 3 pages decideur pour qu'elles partagent toutes le meme
// contexte de selection de site (header commun avec selecteur toujours
// disponible) - le Provider a besoin d'etre A L'INTERIEUR du
// BrowserRouter car il utilise useNavigate/useSearchParams.
function DecideurRoutes() {
  return (
    <SiteSelectionProvider>
      <Routes>
        <Route path="/" element={<MonSitePage />} />
        <Route path="/carte" element={<CartePage />} />
        <Route path="/alertes" element={<AlertesPage />} />
      </Routes>
    </SiteSelectionProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/*" element={<DecideurRoutesGuard />} />
          <Route path="/backoffice/login" element={<LoginPage />} />

          <Route
            path="/backoffice"
            element={
              <ProtectedRoute>
                <BackofficeLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="sites" element={<SitesPage />} />
            <Route path="equipments" element={<EquipmentsPage />} />
            <Route path="cartography" element={<CartographyPage />} />
            <Route path="notifications" element={<NotificationsAdminPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="audit-log" element={<AuditLogPage />} />
            <Route path="ministry-tokens" element={<MinistryTokensPage />} />
             <Route path="sites/new" element={<SiteFormPage />} />
            <Route path="sites/:siteId/edit" element={<SiteFormPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

// Petit garde-fou : "/backoffice/*" ne doit jamais tomber dans les
// routes decideur (qui ne connaissent que "/", "/carte", "/alertes").
// React Router evalue les <Route> dans l'ordre : comme "/backoffice/login"
// et "/backoffice" sont declares AVANT "/*" dans <Routes> ci-dessus,
// ils sont deja pris en priorite - ce composant ne gere donc que le
// reste ("/", "/carte", "/alertes", et tout chemin decideur inconnu).
function DecideurRoutesGuard() {
  return <DecideurRoutes />;
}

export default App;