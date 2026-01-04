import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Registar from "./pages/Registar"; 
import Dashboard from "./pages/Dashboard";
import Perfil from "./pages/Perfil";
import Favoritos from "./pages/Favoritos";
import MinhasReservas from "./pages/minhasReservas";
import Mapa from "./pages/Mapa";


function RotaProtegida({ children }) {
  const user = sessionStorage.getItem("user");
  return user ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* --- ROTAS PÚBLICAS --- */}
        <Route path="/login" element={<Login />} />
        <Route path="/registar" element={<Registar />} /> 

        <Route
          path="/"
          element={
            <RotaProtegida>
              <Dashboard />
            </RotaProtegida>
          }
        />

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

        <Route 
          path="/mapa" 
          element={
            <RotaProtegida>
              <Mapa />
            </RotaProtegida>
          } 
        />

        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}
