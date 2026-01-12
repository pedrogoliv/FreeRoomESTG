import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import Logo from "../components/logo";
import "./Registar.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export default function Registar() {
  const navigate = useNavigate();

  const [cursos, setCursos] = useState([]);
  const [cursoOption, setCursoOption] = useState(null);
  const [cursosLoading, setCursosLoading] = useState(true);

  const [numero, setNumero] = useState(""); 
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let alive = true;

    async function loadCursos() {
      setCursosLoading(true);
      setMsg("");

      try {
        const res = await fetch(`${API_BASE}/api/cursos`);
        const data = await res.json().catch(() => ({}));

        if (!alive) return;

        if (res.ok && data.success && Array.isArray(data.cursos)) {
          setCursos(data.cursos);
        } else {
          setCursos([]);
          setMsg("⚠️ Não foi possível carregar a lista de cursos.");
        }
      } catch (e) {
        if (!alive) return;
        setCursos([]);
        setMsg("⚠️ Não foi possível ligar ao servidor para carregar os cursos.");
      } finally {
        if (alive) setCursosLoading(false);
      }
    }

    loadCursos();
    return () => {
      alive = false;
    };
  }, []);

  const cursoOptions = useMemo(
    () => cursos.map((c) => ({ value: c, label: c })),
    [cursos]
  );

  async function handleRegistar(e) {
    e.preventDefault();
    setMsg("");

    if (!cursoOption || !numero || !username || !password) {
      setMsg("É necessário preencher todos os campos.");
      return;
    }

    const numeroTrim = numero.trim();
    if (!/^\d+$/.test(numeroTrim)) {
      setMsg("⚠️ O Nº aluno deve conter apenas dígitos.");
      return;
    }

    if (password.length < 3) {
      setMsg("A password deve ter pelo menos 3 caracteres.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/auth/registar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          curso: cursoOption.value,
          numero: numeroTrim,
          username: username.trim(),
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
      <div className="loginContent">
        
        {/* ✅ 2. LOGÓTIPO LIMPO E CENTRADO */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '30px' }}>
           <Logo />
        </div>

        <div className="loginCard">
          <h2 className="loginTitle">Criar Conta</h2>

          <form onSubmit={handleRegistar} className="loginForm">
            <div>
              <label className="label">Curso</label>
              <Select
                className="select-container"
                classNamePrefix="select"
                placeholder={cursosLoading ? "A carregar cursos..." : "Seleciona o curso..."}
                isLoading={cursosLoading}
                isDisabled={cursosLoading}
                options={cursoOptions}
                value={cursoOption}
                onChange={setCursoOption}
                isSearchable
                noOptionsMessage={() => "Sem resultados"}
              />
            </div>

            <div>
              <label className="label">Nº Aluno</label>
              <input
                className="input"
                type="text"
                inputMode="numeric"
                value={numero}
                onChange={(e) => setNumero(e.target.value.replace(/\D/g, ""))}
              />
            </div>

            <div>
              <label className="label">Username</label>
              <input
                className="input"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
              />
            </div>

            <div>
              <label className="label">Password</label>
              <input
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>

            {msg && <div className="error-msg">{msg}</div>}

            <button className="btn" type="submit" disabled={loading || cursosLoading}>
              {loading ? "A criar..." : "Criar Conta"}
            </button>
          </form>

          <div
            style={{
              marginTop: "10px",
              textAlign: "center",
              fontSize: "0.9rem",
              color: "#64748b",
            }}
          >
            Já tens conta?{" "}
            <button
              type="button"
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
              Ir para Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}