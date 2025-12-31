// frontend/src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';

// --- IMPORTS (Têm de bater certo com os nomes dos ficheiros) ---
import Login from './pages/Login';          // ✅ Ficheiro com L grande
import Dashboard from './pages/Dashboard';
import Perfil from './pages/Perfil';        // ✅ Ficheiro Perfil.jsx
import Favoritos from './pages/Favoritos';
import MinhasReservas from './pages/minhasReservas';

export default function App() {
  const [user, setUser] = useState(null);

  return (
    <BrowserRouter>
      <Routes>
        
        {/* ROTA DE LOGIN */}
        {/* O path é "/login" (o que aparece no browser) */}
        <Route 
          path="/login" 
          element={!user ? <Login onLogin={(u) => setUser(u)} /> : <Navigate to="/" />} 
        />

        {/* --- ROTAS PROTEGIDAS --- */}
        
        {/* Raiz redireciona para Dashboard ou Login */}
        <Route 
          path="/" 
          element={user ? <Dashboard /> : <Navigate to="/login"/>}
        />

        <Route 
          path="/dashboard" 
          element={user ? <Dashboard /> : <Navigate to="/login" />} 
        />

        <Route 
          path="/favoritos" 
          element={user ? <Favoritos /> : <Navigate to="/login" />} 
        />

        <Route 
          path="/minhas-reservas" 
          element={user ? <MinhasReservas /> : <Navigate to="/login" />} 
        />

        <Route
          path="/perfil"
          element={user ? <Perfil /> : <Navigate to="/login" />}
        />

        {/* ROTA CURINGA (Se o endereço estiver errado, manda para o Login) */}
        <Route path="*" element={<Navigate to="/login" />} />

      </Routes>
    </BrowserRouter>
  );
}