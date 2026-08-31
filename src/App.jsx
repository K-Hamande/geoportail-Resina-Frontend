import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider } from "./shared/AuthContext";
import { SiteSelectionProvider } from "./shared/SiteSelectionContext";
import { estConnecteDecideur, getDecideurAuth } from "./shared/decideurAuth";
import DecideurLoginPage from "./decideur/DecideurLoginPage";
import MonSitePage from "./decideur/MonSitePage";
import CartePage from "./decideur/CartePage";
import AlertesPage from "./decideur/AlertesPage";
import LambdaListePage from "./UtilisateurLambda/LambdaListePage";
import LambdaCartePage from "./UtilisateurLambda/LambdaCartePage";
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
import MonProfilPage from "./backoffice/MonProfilPage";
import RolesPage from "./backoffice/RolesPage";

// Redirige vers /login si non connecte
function RequireDecideurAuth({ children }) {
  return estConnecteDecideur() ? children : <Navigate to="/login" replace />;
}

// Routes decideur : selon le role, redirige vers la vue appropriee
function DecideurRoutes() {
  const auth = getDecideurAuth();
  const estLambda = auth?.role === "LAMBDA";

  return (
    <Routes>
      {/* Page de connexion commune */}
      <Route path="/login" element={<DecideurLoginPage />} />

      {/* Routes LAMBDA : vue simplifiee */}
      <Route path="/lambda" element={
        <RequireDecideurAuth><LambdaListePage /></RequireDecideurAuth>
      } />
      <Route path="/lambda/carte" element={
        <RequireDecideurAuth><LambdaCartePage /></RequireDecideurAuth>
      } />

      {/* Routes DECIDEUR : interface complete. Redirection immediate
          vers la vue Lambda pour ce role, SANS monter SiteSelectionProvider
          (inutile pour ce profil, qui n'a pas de selecteur de site). */}
      {estLambda ? (
        <>
          <Route path="/" element={<Navigate to="/lambda" replace />} />
          <Route path="/carte" element={<Navigate to="/lambda/carte" replace />} />
          <Route path="/alertes" element={<Navigate to="/lambda" replace />} />
        </>
      ) : (
        // SiteSelectionProvider en layout partage : une SEULE instance pour
        // les 3 pages (Mon site / Carte / Alertes), montee une fois et
        // conservee lors de la navigation entre elles (via <Outlet/>),
        // pour que le site selectionne dans le header reste coherent
        // partout - cf. commentaire de SiteSelectionContext.jsx.
        <Route element={
          <RequireDecideurAuth>
            <SiteSelectionProvider><Outlet /></SiteSelectionProvider>
          </RequireDecideurAuth>
        }>
          <Route index element={<MonSitePage />} />
          <Route path="carte" element={<CartePage />} />
          <Route path="alertes" element={<AlertesPage />} />
        </Route>
      )}
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Backoffice en premier - priorite sur le catch-all /* */}
          <Route path="/backoffice/login" element={<LoginPage />} />
          <Route
            path="/backoffice/*"
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
            <Route path="mon-profil" element={<MonProfilPage />} />
            <Route path="roles" element={<RolesPage />} />
          </Route>

          {/* Decideur/Lambda - catch-all en dernier */}
          <Route path="/*" element={<DecideurRoutes />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;