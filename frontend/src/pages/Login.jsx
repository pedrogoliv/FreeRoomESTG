// src/pages/Login.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setMsg("");

    if (!username || !password) {
      setMsg("⚠️ Preenche username e password.");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (data.success) {
        sessionStorage.setItem("user", JSON.stringify(data.user));
        navigate("/dashboard");
      } else {
        setMsg(data.message || "Erro ao entrar.");
      }
    } catch (err) {
      console.error(err);
      setMsg("❌ O servidor está desligado?");
    }
  }

  return (
    <div className="loginPage">
      <div className="orangeCircle" aria-hidden="true" />

      <div className="loginContent">
        <h1 className="brand">
          FreeRoom <span>ESTG</span>
        </h1>

        <div className="loginCard">
          <h2 className="loginTitle">Bem-vindo</h2>

          <form onSubmit={handleSubmit} className="loginForm">
            <div>
              <label className="label">Username</label>
              <input
                className="input"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div>
              <label className="label">Password</label>
              <input
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button className="btn" type="submit">
              Entrar
            </button>

            {msg && <div className="msg">{msg}</div>}
          </form>

          {/* ✅ Agora navega para a página /registar */}
          <div
            style={{
              marginTop: "20px",
              textAlign: "center",
              fontSize: "0.9rem",
              color: "#64748b",
            }}
          >
            Ainda não tens conta?{" "}
            <button
              onClick={() => navigate("/registar")}
              style={{
                background: "none",
                border: "none",
                color: "#E38B2C",
                fontWeight: "bold",
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              Criar agora
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
