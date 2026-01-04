// src/components/Sidebar.jsx
import { NavLink, useNavigate } from "react-router-dom";
import { FaHome, FaHeart, FaCalendarAlt, FaUser, FaSignOutAlt, FaMap } from "react-icons/fa";
import "./Sidebar.css";

export default function Sidebar() {
  const navigate = useNavigate();

  function handleLogout() {
    // 1. Limpar os dados guardados (Importante!)
    localStorage.removeItem("user");
    sessionStorage.removeItem("user");
    
    // 2. Redirecionar para o login
    navigate("/login");
  }

  return (
    <aside className="sidebar">
      <div className="sidebarTop">
        <div className="brand">
          <div className="brandTitle">
            FreeRoom <span>ESTG</span>
          </div>
        </div>

        <nav className="nav">
          {/* ✅ CORREÇÃO AQUI: Mudámos de "/" para "/dashboard" */}
          <NavLink 
            to="/dashboard" 
            className={({ isActive }) => "navItem" + (isActive ? " active" : "")}
          >
            <span className="icon"><FaHome /></span>
            <span>Página Inicial</span>
          </NavLink>

          <NavLink to="/favoritos" className={({ isActive }) => "navItem" + (isActive ? " active" : "")}>
            <span className="icon"><FaHeart /></span>
            <span>Favoritos</span>
          </NavLink>

          <NavLink to="/minhas-reservas" className={({ isActive }) => "navItem" + (isActive ? " active" : "")}>
            <span className="icon"><FaCalendarAlt /></span>
            <span>As Minhas Reservas</span>
          </NavLink>

          <NavLink to="/perfil" className={({ isActive }) => "navItem" + (isActive ? " active" : "")}>
            <span className="icon"><FaUser /></span>
            <span>Meu Perfil</span>
          </NavLink>

          <NavLink to="/mapa" className={({ isActive }) => "navItem" + (isActive ? " active" : "")}>
            <span className="icon"><FaMap /></span>
            <span>Planta da Escola</span>
          </NavLink>
        </nav>
      </div>

      <div className="sidebarBottom">
        <button className="logoutBtn" onClick={handleLogout}>
          <span className="logoutIcon"><FaSignOutAlt /></span>
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
}