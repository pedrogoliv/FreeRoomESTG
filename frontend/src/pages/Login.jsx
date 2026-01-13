import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Logo from "../components/logo";
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
    setMsg("Username e password inválidos.");
    return;
  }

  const API_URL = import.meta.env.VITE_API_BASE_URL;

  try {
    const response = await fetch(`${API_URL}/auth/login`, {
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
    setMsg("❌ Erro de ligação ao servidor.");
  }
}

  return (
    <div className="loginPage">
      <div className="loginContent">
        
        {/* ✅ 2. LOGÓTIPO LIMPO E CENTRADO */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '30px' }}>
          <Logo />
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