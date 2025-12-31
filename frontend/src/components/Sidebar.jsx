import { NavLink, useNavigate } from "react-router-dom";
import { FaHome, FaHeart, FaCalendarAlt, FaUser, FaSignOutAlt } from "react-icons/fa";
import "./Sidebar.css";

export default function Sidebar() {
  const navigate = useNavigate();

  function handleLogout() {
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
          <NavLink to="/" end className={({ isActive }) => "navItem" + (isActive ? " active" : "")}>
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
