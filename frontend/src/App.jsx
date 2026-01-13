import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import LoadingScreen from "./components/LoadingScreen"; 

import Login from "./pages/Login";
import Registar from "./pages/Registar"; 
import Dashboard from "./pages/Dashboard";
import Perfil from "./pages/Perfil";
import Favoritos from "./pages/Favoritos";
import MinhasReservas from "./pages/minhasReservas";
import Mapa from "./pages/Mapa";
import HistoricoReservas from "./pages/HistoricoReservas.jsx";
import Landing from "./pages/Landing.jsx";

import { FiltrosProvider } from "./context/FiltrosContext"; 

function RotaProtegida({ children }) {
  const user = sessionStorage.getItem("user");
  return user ? children : <Navigate to="/login" />;
}

export default function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <BrowserRouter>
      <FiltrosProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registar" element={<Registar />} /> 

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