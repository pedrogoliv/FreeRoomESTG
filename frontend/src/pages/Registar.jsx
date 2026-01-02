// src/pages/Registar.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Registar.css";

export default function Registar() {
  const navigate = useNavigate();

  const API_BASE =
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) ||
    process.env.REACT_APP_API_BASE_URL ||
    "http://localhost:5000";

  const [curso, setCurso] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [cursos, setCursos] = useState([]);
  const [loadingCursos, setLoadingCursos] = useState(true);

  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // Normaliza para comparar (case-insensitive + sem espaços extra)
  const norm = (s) => (s || "").trim().toLowerCase();

  // Cursos normalizados para validação rápida
  const cursosNorm = useMemo(() => cursos.map((c) => norm(c)), [cursos]);

  useEffect(() => {
    let cancelled = false;

    async function fetchCursos() {
      setLoadingCursos(true);
      try {
        const res = await fetch(`${API_BASE}/api/cursos`);
        const data = await res.json().catch(() => ({}));

        const lista = Array.isArray(data) ? data : data.cursos;

        if (!cancelled) {
          setCursos(Array.isArray(lista) ? lista : []);
        }
      } catch (e) {
        if (!cancelled) setCursos([]);
      } finally {
        if (!cancelled) setLoadingCursos(false);
      }
    }

    fetchCursos();
    return () => {
      cancelled = true;
    };
  }, [API_BASE]);

  async function handleRegistar(e) {
    e.preventDefault();
    setMsg("");

    if (!curso || !username || !email || !password || !confirmPassword) {
      setMsg("⚠️ Preenche todos os campos.");
      return;
    }

    if (loadingCursos) {
      setMsg("⚠️ A carregar cursos... tenta de novo em 1s.");
      return;
    }

    if (!cursos.length) {
      setMsg("❌ Não foi possível carregar a lista de cursos.");
      return;
    }

    // Obrigar a escolher um curso da lista 
    const idx = cursosNorm.indexOf(norm(curso));
    if (idx === -1) {
      setMsg("⚠️ Seleciona um curso válido da lista.");
      return;
    }

    const cursoCanonico = cursos[idx]; // o texto exato como vem do backend

    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    if (!emailOk) {
      setMsg("⚠️ Email inválido.");
      return;
    }

    if (password.length < 6) {
      setMsg("⚠️ A password deve ter pelo menos 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setMsg("❌ As passwords não coincidem.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/auth/registar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          curso: cursoCanonico,
          username: username.trim(),
          email: email.trim(),
          password,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok && data.success) {
        navigate("/login");
      } else {
        setMsg(data.message || "Erro ao criar conta.");
      }
    } catch (err) {
      console.error(err);
      setMsg("❌ O servidor está desligado?");
    } finally {
      setLoading(false);
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
          <h2 className="loginTitle">Criar Conta</h2>

          <form onSubmit={handleRegistar} className="loginForm">
            <div>
              <label className="label">Curso</label>
              <input
                className="input"
                type="text"
                value={curso}
                onChange={(e) => setCurso(e.target.value)}
                placeholder={loadingCursos ? "A carregar cursos..." : "Escreve para pesquisar..."}
                list="lista-cursos"
                disabled={loadingCursos}
              />

              <datalist id="lista-cursos">
                {cursos.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>

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
              <label className="label">Email</label>
              <input
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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

            <div>
              <label className="label">Confirmar Password</label>
              <input
                className="input"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <button className="btn" type="submit" disabled={loading || loadingCursos}>
              {loading ? "A criar..." : "Criar Conta"}
            </button>

            {msg && <div className="msg">{msg}</div>}
          </form>

          <div
            style={{
              marginTop: "20px",
              textAlign: "center",
              fontSize: "0.9rem",
              color: "#64748b",
            }}
          >
            Já tens conta?{" "}
            <button
              onClick={() => navigate("/login")}
              style={{
                background: "none",
                border: "none",
                color: "#E38B2C",
                fontWeight: "bold",
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              Entrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
