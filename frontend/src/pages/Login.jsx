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
      setMsg("Preenche username e password.");
      return;
    }

    // login fake (frontend) -> depois ligar ao backend.
    if (onLogin) onLogin({ username });
    else setMsg("Login OK (placeholder).");
  }

  return (
    <div className="loginPage">
      <div className="orangeCircle" aria-hidden="true" />

      <div className="loginContent">
        <h1 className="brand">FreeRoom <span>ESTG</span></h1>

        <div className="loginCard">
          <h2 className="loginTitle">LOGIN</h2>

          <form onSubmit={handleSubmit} className="loginForm">
            <label className="field">
              <span className="label">Username</span>
              <input
                className="input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
              />
            </label>

            <label className="field">
              <span className="label">Password</span>
              <input
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </label>

            <button className="btn" type="submit">login</button>

            {msg && <p className="msg">{msg}</p>}
          </form>
        </div>
      </div>
    </div>
  );
}
