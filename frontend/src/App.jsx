import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// --- IMPORTS ---
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Perfil from './pages/Perfil'; 
import Favoritos from './pages/Favoritos';
import MinhasReservas from './pages/minhasReservas';

function RotaProtegida({ children }) {
  const user = sessionStorage.getItem("user");
  return user ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        
        {/* --- ROTA DE LOGIN --- */}
        <Route path="/login" element={<Login />} />

        {/* --- ROTAS PROTEGIDAS --- */}
        {/* Agora usamos o componente <RotaProtegida> para embrulhar as páginas */}
        
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

        {/* Rota Curinga */}
        <Route path="*" element={<Navigate to="/login" />} />

      </Routes>
    </BrowserRouter>
  );
}