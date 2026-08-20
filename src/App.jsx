import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./shared/AuthContext";
import { SiteSelectionProvider } from "./shared/SiteSelectionContext";
import { estConnecteDecideur } from "./shared/decideurAuth";
import DecideurLoginPage from "./decideur/DecideurLoginPage";
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
import SiteFormPage from "./backoffice/SiteFormPage";
import MinistryTokensPage from "./backoffice/MinistryTokensPage";
import SupervisionPage from "./backoffice/SupervisionPage";
import DecideurUsersPage from "./backoffice/DecideurUsersPage";

// Protege les routes decideur : redirige vers /login si non connecte
function RequireDecideurAuth({ children }) {
  return estConnecteDecideur() ? children : <Navigate to="/login" replace />;
}

function DecideurRoutes() {
  return (
    <SiteSelectionProvider>
      <Routes>
        <Route path="/" element={<RequireDecideurAuth><MonSitePage /></RequireDecideurAuth>} />
        <Route path="/carte" element={<RequireDecideurAuth><CartePage /></RequireDecideurAuth>} />
        <Route path="/alertes" element={<RequireDecideurAuth><AlertesPage /></RequireDecideurAuth>} />
        <Route path="/login" element={<DecideurLoginPage />} />
      </Routes>
    </SiteSelectionProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/*" element={<DecideurRoutes />} />
          <Route path="/backoffice/login" element={<LoginPage />} />
          <Route
            path="/backoffice"
            element={<ProtectedRoute><BackofficeLayout /></ProtectedRoute>}
          >
            <Route index element={<DashboardPage />} />
            <Route path="sites" element={<SitesPage />} />
            <Route path="equipments" element={<EquipmentsPage />} />
            <Route path="cartography" element={<CartographyPage />} />
            <Route path="notifications" element={<NotificationsAdminPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="audit-log" element={<AuditLogPage />} />
            <Route path="sites/new" element={<SiteFormPage />} />
            <Route path="sites/:siteId/edit" element={<SiteFormPage />} />
            <Route path="ministry-tokens" element={<MinistryTokensPage />} />
            <Route path="supervision" element={<SupervisionPage />} />
            <Route path="decideur-users" element={<DecideurUsersPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;