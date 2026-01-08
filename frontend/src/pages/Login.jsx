// src/pages/Login.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Login.css";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState(""); // A tua variável original de erro

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

      <div className="loginContent">
        
        <div className="brand">
          <div className="logo-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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

            {/* ✅ CORREÇÃO AQUI: A mensagem agora está num div centrado */}
            {msg && <div className="error-msg">{msg}</div>}

            <button className="btn" type="submit">
              Entrar
            </button>
          </form>

          <div className="card-footer">
            Ainda não tens conta?{" "}
            <span 
              onClick={() => navigate("/registar")} 
              style={{ color: "#E38B2C", fontWeight: "bold", cursor: "pointer", textDecoration: "underline" }}
            >
              Criar conta
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}