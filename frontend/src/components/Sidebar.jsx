import { NavLink, useNavigate } from "react-router-dom";
import { FaHome, FaHeart, FaCalendarAlt, FaUser, FaSignOutAlt, FaMap } from "react-icons/fa";
import "./Sidebar.css";

export default function Sidebar() {
  const navigate = useNavigate();

  function handleLogout() {
    localStorage.removeItem("user");
    sessionStorage.removeItem("user");
    navigate("/login");
  }

  return (
    <aside className="sidebar">
      <div className="sidebarTop">
        
        {/* --- INÍCIO DA ALTERAÇÃO DO LOGÓTIPO --- */}
        <div className="brand">
          <div className="logo-icon">
            {/* Ícone da Porta (SVG) */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z" stroke="#E38B2C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9 3V21" stroke="#E38B2C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M15 10V14" stroke="#E38B2C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
                  
        <div className="brandTitle">
          <span>FreeRoom</span>
          <span className="highlight">ESTG</span>
        </div>
        </div>
        {/* --- FIM DA ALTERAÇÃO DO LOGÓTIPO --- */}

        <nav className="nav">
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
            <span>Minhas Reservas</span>
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