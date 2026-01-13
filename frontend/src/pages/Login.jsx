import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import Logo from "../components/logo";
import "./Login.css";

const MEM_KEY = "login_usernames"; // lista de usernames guardada

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [msg, setMsg] = useState("");

  const [savedUsers, setSavedUsers] = useState([]);

  const navigate = useNavigate();

<<<<<<< HEAD
  // ✅ carregar usernames guardados
  useEffect(() => {
    try {
      const raw = localStorage.getItem(MEM_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      setSavedUsers(Array.isArray(arr) ? arr : []);
    } catch {
      setSavedUsers([]);
    }
  }, []);

  // id do datalist (estável)
  const datalistId = useMemo(() => "usernames-datalist", []);

  function saveUsernameToMemory(u) {
    const clean = String(u || "").trim();
    if (!clean) return;

    setSavedUsers((prev) => {
      const next = [clean, ...prev.filter((x) => x !== clean)].slice(0, 8); // guarda máx 8
      localStorage.setItem(MEM_KEY, JSON.stringify(next));
      return next;
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMsg("");

    if (!username || !password) {
      setMsg("Username e password inválidos.");
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
        // ✅ guardar username para sugestões futuras
        saveUsernameToMemory(username);

        sessionStorage.setItem("user", JSON.stringify(data.user));
        sessionStorage.setItem("justLoggedIn", "1");
        navigate("/dashboard");
      } else {
        setMsg(data.message || "Erro ao entrar.");
      }
    } catch (err) {
      console.error(err);
       setMsg("❌ Erro de ligação ao servidor.");
    }
=======
async function handleSubmit(e) {
  e.preventDefault();
  setMsg("");

  if (!username || !password) {
    setMsg("Username e password inválidos.");
    return;
>>>>>>> 401b67fa91ec68ef50b1aba0e1d7d89cb4335601
  }

  const API_URL = import.meta.env.VITE_API_BASE_URL;

  try {
    const response = await fetch(${API_URL}/auth/login, {
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
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "30px" }}>
          <Logo />
        </div>

        <div className="loginCard">
          <h2 className="loginTitle">Bem-vindo</h2>

          <form onSubmit={handleSubmit} className="loginForm">
            <div>
              <label className="label">Username</label>

              {/* ✅ sugestões de usernames */}
              <input
                className="input"
                type="text"
                value={username}
                list={datalistId}
                autoComplete="username"
                onChange={(e) => setUsername(e.target.value)}
              />
              <datalist id={datalistId}>
                {savedUsers.map((u) => (
                  <option key={u} value={u} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="label">Password</label>

              {/* ✅ password com olhinho */}
              <div style={{ position: "relative" }}>
                <input
                  className="input"
                  type={showPass ? "text" : "password"}
                  value={password}
                  autoComplete="current-password"
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingRight: "44px" }}
                />

                <button
                  type="button"
                  onClick={() => setShowPass((s) => !s)}
                  aria-label={showPass ? "Ocultar password" : "Mostrar password"}
                  style={{
                    position: "absolute",
                    right: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    padding: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "24px",
                    width: "24px",
                  }}
                >
                  {showPass ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
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
              style={{
                color: "#E38B2C",
                fontWeight: "bold",
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              Criar conta
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
