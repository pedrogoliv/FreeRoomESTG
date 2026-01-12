import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Registar from "./pages/Registar"; 
import Dashboard from "./pages/Dashboard";
import Perfil from "./pages/Perfil";
import Favoritos from "./pages/Favoritos";
import MinhasReservas from "./pages/minhasReservas";
import Mapa from "./pages/Mapa";

// ✅ NOVO: página de histórico
import HistoricoReservas from "./pages/HistoricoReservas.jsx";

// ✅ NOVO: Landing Page (página inicial antes do login)
import Landing from "./pages/Landing.jsx";

// ✅ 1. IMPORTAR O PROVIDER
import { FiltrosProvider } from "./context/FiltrosContext"; 

function RotaProtegida({ children }) {
  const user = sessionStorage.getItem("user");
  return user ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <BrowserRouter>
      {/* ✅ 2. ENVOLVER AS ROTAS COM O PROVIDER */}
      <FiltrosProvider>
        <Routes>
          {/* --- ROTAS PÚBLICAS --- */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registar" element={<Registar />} /> 

          {/* --- ROTAS PROTEGIDAS --- */}
          <Route
            path="/dashboard"
            element={
              <RotaProtegida>
                <Dashboard />
              </RotaProtegida>
            }
          />

          <Route
            path="/favoritos"
            element={
              <RotaProtegida>
                <Favoritos />
              </RotaProtegida>
            }
          />

          <Route
            path="/minhas-reservas"
            element={
              <RotaProtegida>
                <MinhasReservas />
              </RotaProtegida>
            }
          />

          <Route
            path="/perfil"
            element={
              <RotaProtegida>
                <Perfil />
              </RotaProtegida>
            }
          />

          {/* ✅ NOVO: rota do histórico */}
          <Route
            path="/historico-reservas"
            element={
              <RotaProtegida>
                <HistoricoReservas />
              </RotaProtegida>
            }
          />

          <Route 
            path="/mapa" 
            element={
              <RotaProtegida>
                <Mapa />
              </RotaProtegida>
            } 
          />

          {/* ✅ se estiver logado e cair numa rota inválida, vai para dashboard; senão, landing */}
          <Route
            path="*"
            element={
              sessionStorage.getItem("user")
                ? <Navigate to="/dashboard" replace />
                : <Navigate to="/" replace />
            }
          />
        </Routes>
      </FiltrosProvider>
    </BrowserRouter>
  );
}
