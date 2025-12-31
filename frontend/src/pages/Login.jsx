import { useState } from "react";
import "./Login.css";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    setMsg("");

    if (!username || !password) {
      setMsg("⚠️ Preenche username e password.");
      return;
    }

    // Login fake
    if (onLogin) onLogin({ username });
    else setMsg("Login OK (placeholder).");
  }

  return (
    <div className="loginPage">
      {/* Círculo decorativo */}
      <div className="orangeCircle" aria-hidden="true" />

      <div className="loginContent">
        {/* Marca com as duas cores */}
        <h1 className="brand">
          FreeRoom <span>ESTG</span>
        </h1>

        <div className="loginCard">
          <h2 className="loginTitle">Bem-vindo</h2>

          <form onSubmit={handleSubmit} className="loginForm">
            <div>
              <label className="label">Número de Aluno / Email</label>
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
        </div>
      </div>
    </div>
  );
}