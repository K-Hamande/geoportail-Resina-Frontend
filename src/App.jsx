import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./shared/AuthContext";
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

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MonSitePage />} />
          <Route path="/carte" element={<CartePage />} />
          <Route path="/alertes" element={<AlertesPage />} />

          <Route path="/backoffice/login" element={<LoginPage />} />

          {/* Route PARENT : protege l'acces (ProtectedRoute) et affiche
              le layout commun (BackofficeLayout). Les routes ENFANTS,
              declarees juste en dessous avec une indentation JSX,
              s'affichent a l'interieur du <Outlet /> du layout. */}
          <Route
            path="/backoffice"
            element={
              <ProtectedRoute>
                <BackofficeLayout />
              </ProtectedRoute>
            }
          >
            {/* "index" = la route affichee quand l'URL est EXACTEMENT
                "/backoffice", sans rien apres. */}
            <Route index element={<DashboardPage />} />
            <Route path="sites" element={<SitesPage />} />
            <Route path="equipments" element={<EquipmentsPage />} />
            <Route path="cartography" element={<CartographyPage />} />
            <Route path="notifications" element={<NotificationsAdminPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="audit-log" element={<AuditLogPage />} />
            <Route path="sites/new" element={<SiteFormPage />} />
            <Route path="sites/:siteId/edit" element={<SiteFormPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;