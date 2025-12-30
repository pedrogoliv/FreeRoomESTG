// src/components/Sidebar.jsx
import { Link, useLocation } from 'react-router-dom';
import '../pages/Dashboard.css';

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="sidebar">
      <h2>FreeRoom ESTG</h2>
      <ul>
        
        {/* Link 1: Dashboard */}
        <Link to="/dashboard" style={{ textDecoration: 'none', color: 'inherit' }}>
          <li className={location.pathname === '/dashboard' ? 'active' : ''}>
            🏠 Visão Geral
          </li>
        </Link>

        {/* --- ADICIONA ESTE BLOCO AQUI --- */}
        <Link to="/perfil" style={{ textDecoration: 'none', color: 'inherit' }}>
          <li className={location.pathname === '/perfil' ? 'active' : ''}>
            👤 O Meu Perfil
          </li>
        </Link>
        {/* -------------------------------- */}
        
        <li>📅 As Minhas Reservas</li>
        <li>🔍 Procurar Sala</li>
        <li>❤️ Favoritos</li>
      </ul>
      
      <button className="btn-logout" onClick={() => window.location.href = "/"}>
        Sair
      </button>
    </aside>
  );
}