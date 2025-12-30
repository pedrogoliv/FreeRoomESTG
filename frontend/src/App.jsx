// frontend/src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';

// Importar as tuas páginas
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Perfil from './pages/Perfil';
// import Reservas from './pages/Reservas'; // <--- Descomenta quando criares o ficheiro

export default function App() {
  const [user, setUser] = useState(null);

  return (
    <BrowserRouter>
      <Routes>
        
        {/* Rota 1: Login */}
        <Route 
          path="/" 
          element={!user ? <Login onLogin={(u) => setUser(u)} /> : <Navigate to="/dashboard" />} 
        />

        {/* Rota 2: Dashboard (Protegida - só entra se houver user) */}
        <Route 
          path="/dashboard" 
          element={user ? <Dashboard /> : <Navigate to="/" />} 
        />

        {/* Rota 3: Perfil (Protegida - só entra se houver user) */}
        <Route
          path="/perfil"
          element={user ? <Perfil /> : <Navigate to="/" />}
        />

        {/* Rota 3: Reservas (O tal exemplo de adicionar página nova) */}
        {/* <Route 
          path="/reservas" 
          element={user ? <Reservas /> : <Navigate to="/" />} 
        /> */}

      </Routes>
    </BrowserRouter>
  );
}