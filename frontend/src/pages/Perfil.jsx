import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import "./Perfil.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export default function Perfil() {
  const [user, setUser] = useState(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    // 1) ler do sessionStorage (rápido)
    const stored = sessionStorage.getItem("user");
    if (!stored) return;

    const sessionUser = JSON.parse(stored);
    setUser(sessionUser);

    // 2) buscar do backend 
    fetch(`${API_BASE}/api/users/${sessionUser.username}`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.success && data.user) {
          setUser(data.user);
          sessionStorage.setItem("user", JSON.stringify({ ...sessionUser, ...data.user }));
        }
      })
      .catch(() => {
        // se falhar, fica com o que estava no sessionStorage
      });
  }, []);

  if (!user) {
    return (
      <div className="perfil-page">
        <Sidebar />
        <main className="perfil-container">
          <h1 className="titulo-pagina">O Meu Perfil</h1>
          <p style={{ color: "#64748b" }}>A carregar utilizador...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="perfil-page">
      <Sidebar />

      <main className="perfil-container">
        <h1 className="titulo-pagina">O Meu Perfil</h1>

        <div className="cards-grid">
          <div className="card">
            <button className="btn-edit">✏️ Editar</button>

            <div className="icon-circle">👤</div>
            <div className="separator"></div>

            <h3>{user.username}</h3>

            <p>Nº {user.numero || "—"}</p>

            <br />

            <p>{user.curso || "—"}</p>

            {msg && <p style={{ marginTop: 10, color: "#ef4444" }}>{msg}</p>}
          </div>

          <div className="card">
            <div className="icon-circle">🕒</div>
            <div className="separator"></div>

            <h3>Últimas Reservas</h3>
            <p>Consulta o teu histórico</p>

            <button className="btn-action">Ver</button>
          </div>

          <div className="card">
            <div className="icon-circle">📊</div>
            <div className="separator"></div>

            <h3>Estatísticas</h3>
            <p>As tuas estatísticas</p>

            <button className="btn-action">Ver</button>
          </div>
        </div>
      </main>
    </div>
  );
}
