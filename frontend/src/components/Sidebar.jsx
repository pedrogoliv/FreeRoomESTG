import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { FaHome, FaHeart, FaCalendarAlt, FaUser, FaSignOutAlt, FaMap } from "react-icons/fa";
import Logo from "./logo";
import ConfirmModal from "./ConfirmModal";
import "./Sidebar.css";

export default function Sidebar() {
  const navigate = useNavigate();
  const [openLogout, setOpenLogout] = useState(false);

  function handleLogoutConfirm() {
    // limpar sessão
    localStorage.removeItem("user");
    sessionStorage.removeItem("user");

    setOpenLogout(false);
    navigate("/loading", { replace: true });
  }

  return (
    <>
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

            <NavLink to="/minhas-reservas" className={({ isActive }) => "navItem" + (isActive ? " active" : "")}>
              <span className="icon"><FaCalendarAlt /></span>
              <span>Reservas</span>
            </NavLink>

            <NavLink to="/favoritos" className={({ isActive }) => "navItem" + (isActive ? " active" : "")}>
              <span className="icon"><FaHeart /></span>
              <span>Favoritos</span>
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

          {/* em vez de sair logo, abre o popup */}
          <button className="logoutBtn" onClick={() => setOpenLogout(true)}>
            <span className="logoutIcon"><FaSignOutAlt /></span>
            <span>Sair</span>
          </button>
        </div>
      </aside>

      <ConfirmModal
        open={openLogout}
        title="Sair da aplicação?"
        message="Tens a certeza que queres sair? Vais ter de fazer login novamente."
        cancelText="Não, voltar"
        confirmText="Sim, sair"
        onCancel={() => setOpenLogout(false)}
        onConfirm={handleLogoutConfirm}
      />
    </>
  );
}
