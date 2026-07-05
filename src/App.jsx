import { BrowserRouter, Routes, Route } from "react-router-dom";
import MonSitePage from "./decideur/MonSitePage";
import CartePage from "./decideur/CartePage";
import AlertesPage from "./decideur/AlertesPage";
import DashboardPage from "./backoffice/DashboardPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MonSitePage />} />
        <Route path="/carte" element={<CartePage />} />
        <Route path="/alertes" element={<AlertesPage />} />
        <Route path="/backoffice" element={<DashboardPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;