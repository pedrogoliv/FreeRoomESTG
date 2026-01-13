import { NavLink, useNavigate } from "react-router-dom";
import { FaHome, FaHeart, FaCalendarAlt, FaUser, FaSignOutAlt, FaMap } from "react-icons/fa";
import Logo from "./logo";
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
        
        <div className="brand">
           <Logo />
        </div>

        <nav className="nav">
          <NavLink to="/dashboard" className={({ isActive }) => "navItem" + (isActive ? " active" : "")}>
            <span className="icon"><FaHome /></span>
            <span>Página Inicial</span>
          </NavLink>
           <NavLink to="/favoritos" className={({ isActive }) => "navItem" + (isActive ? " active" : "")}>
            <span className="icon"><FaHeart /></span>
            <span>Favoritos</span>
          </NavLink>

          <NavLink to="/minhas-reservas" className={({ isActive }) => "navItem" + (isActive ? " active" : "")}>
            <span className="icon"><FaCalendarAlt /></span>
            <span>Reservas</span>
          </NavLink>

          <NavLink to="/mapa" className={({ isActive }) => "navItem" + (isActive ? " active" : "")}>
            <span className="icon"><FaMap /></span>
            <span>Planta da Escola</span>
          </NavLink>
        </nav>
      </div>

      <div className="sidebarBottom">
         <NavLink to="/perfil" className={({ isActive }) => "navItem" + (isActive ? " active" : "")}>
            <span className="icon"><FaUser /></span>
            <span>Meu Perfil</span>
        </NavLink>

        <button className="logoutBtn" onClick={handleLogout}>
          <span className="logoutIcon"><FaSignOutAlt /></span>
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
}