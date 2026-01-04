import { useEffect, useMemo, useState } from "react";
import Select from "react-select";
import Sidebar from "../components/Sidebar";
import "./Perfil.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export default function Perfil() {
  const [user, setUser] = useState(null);
  const [msg, setMsg] = useState("");

  // edição do perfil
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState({ numero: "", curso: "" });
  const [saving, setSaving] = useState(false);

  // cursos
  const [cursos, setCursos] = useState([]);
  const [cursosLoading, setCursosLoading] = useState(false);
  const [cursosErr, setCursosErr] = useState("");

  // modal de estatísticas
  const [statsOpen, setStatsOpen] = useState(false);
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsErr, setStatsErr] = useState("");

  useEffect(() => {
    const stored = sessionStorage.getItem("user");
    if (!stored) return;

    const sessionUser = JSON.parse(stored);
    setUser(sessionUser);

    fetch(`${API_BASE}/api/users/${sessionUser.username}`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.success && data.user) {
          setUser(data.user);
          sessionStorage.setItem(
            "user",
            JSON.stringify({ ...sessionUser, ...data.user })
          );
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setCursosLoading(true);
    setCursosErr("");

    fetch(`${API_BASE}/api/cursos`)
      .then((r) => r.json())
      .then((data) => {
        const arr = Array.isArray(data) ? data : data?.cursos;
        const normalized = (Array.isArray(arr) ? arr : [])
          .map((x) => (typeof x === "string" ? x : x?.nome))
          .filter(Boolean);

        setCursos(normalized);
      })
      .catch(() => setCursosErr("Não foi possível carregar cursos."))
      .finally(() => setCursosLoading(false));
  }, []);

  useEffect(() => {
    if (!user) return;
    setDraft({
      numero: user.numero ?? "",
      curso: user.curso ?? "",
    });
  }, [user]);

  const cursoOptions = useMemo(
    () => (cursos || []).map((c) => ({ value: c, label: c })),
    [cursos]
  );

  const selectedCursoOption = useMemo(() => {
    const value = String(draft.curso ?? "").trim();
    if (!value) return null;
    return { value, label: value };
  }, [draft.curso]);

  const canSave = useMemo(() => {
    if (!user) return false;
    const numeroOk =
      draft.numero === "" || /^[0-9]{4,12}$/.test(String(draft.numero));
    const cursoOk =
      String(draft.curso ?? "").trim().length > 0 &&
      (cursos.length === 0 ? true : cursos.includes(draft.curso));

    return numeroOk && cursoOk && !saving && !cursosLoading;
  }, [draft, user, saving, cursos, cursosLoading]);

  function startEdit() {
    setMsg("");
    setIsEditing(true);
  }

  function cancelEdit() {
    setMsg("");
    setIsEditing(false);
    setDraft({
      numero: user?.numero ?? "",
      curso: user?.curso ?? "",
    });
  }

  async function saveProfile() {
    if (!user?.username) return;
    setMsg("");

    const numeroStr = String(draft.numero ?? "").trim();
    const cursoStr = String(draft.curso ?? "").trim();

    if (!cursoStr) {
      setMsg("⚠️ Seleciona um curso.");
      return;
    }
    if (cursos.length > 0 && !cursos.includes(cursoStr)) {
      setMsg("⚠️ Seleciona um curso válido.");
      return;
    }
    if (numeroStr !== "" && !/^[0-9]{4,12}$/.test(numeroStr)) {
      setMsg("⚠️ Nº inválido (só dígitos).");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/users/${user.username}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          numero: numeroStr === "" ? null : Number(numeroStr),
          curso: cursoStr,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.success) {
        setMsg(data?.message || "❌ Não foi possível guardar.");
        return;
      }

      const updated = {
        ...user,
        numero:
          data.user?.numero ??
          (numeroStr === "" ? null : Number(numeroStr)),
        curso: data.user?.curso ?? cursoStr,
      };

      setUser(updated);
      sessionStorage.setItem("user", JSON.stringify(updated));
      setIsEditing(false);
      setMsg("✅ Perfil atualizado!");
    } catch (e) {
      setMsg("❌ Erro ao ligar ao servidor.");
    } finally {
      setSaving(false);
    }
  }

  async function openStats() {
    if (!user?.username) return;
    setStatsOpen(true);
    setStats(null);
    setStatsErr("");
    setStatsLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/users/${user.username}/stats`);
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.success) {
        setStatsErr(data?.message || "❌ Não foi possível carregar estatísticas.");
        return;
      }
      setStats(data.stats);
    } catch (e) {
      setStatsErr("❌ Erro ao ligar ao servidor.");
    } finally {
      setStatsLoading(false);
    }
  }

  // --- RETURN 1: LOADING ---
  if (!user) {
    return (
      <div className="dashboard-container">
        <Sidebar />
        <main className="main-content">
          <header className="dashboard-header">
            <div>
              <h1 className="dashboard-title">Meu Perfil</h1>
              <p style={{ color: "#64748b" }}>A carregar utilizador...</p>
            </div>
          </header>
        </main>
      </div>
    );
  }

  // --- RETURN 2: CONTEÚDO PRINCIPAL ---
  return (
    <div className="dashboard-container">
      <Sidebar />

      <main className="main-content">
        <header className="dashboard-header">
          <div>
            <h1 className="dashboard-title">Meu Perfil</h1>
            <p style={{ color: "#64748b" }}>
            </p>
          </div>
        </header>

        {/* Mantivemos as classes internas iguais */}
        <div className="cards-grid">
          {/* PERFIL */}
          <div className="card">
            {!isEditing ? (
              <button className="btn-edit" onClick={startEdit} type="button">
                ✏️ Editar
              </button>
            ) : (
              <div className="edit-actions">
                <button
                  className="btn-secondary"
                  onClick={cancelEdit}
                  type="button"
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button
                  className="btn-primary"
                  onClick={saveProfile}
                  type="button"
                  disabled={!canSave}
                >
                  {saving ? "A guardar..." : "Guardar"}
                </button>
              </div>
            )}

            <div className="icon-circle">👤</div>
            <div className="separator"></div>

            <h3>{user.username}</h3>

            {!isEditing ? (
              <>
                <p>Nº {user.numero ?? "—"}</p>
                <br />
                <p>{user.curso ?? "—"}</p>
              </>
            ) : (
              <div className="form-stack">
                <label className="field-label">Número</label>
                <input
                  className="field-control"
                  type="text"
                  inputMode="numeric"
                  value={draft.numero}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      numero: e.target.value.replace(/\D/g, ""),
                    }))
                  }
                  placeholder="Ex: 12345"
                  disabled={saving}
                />

                <label className="field-label" style={{ marginTop: 10 }}>
                  Curso
                </label>

                <div className="select-container">
                  <Select
                    classNamePrefix="select"
                    options={cursoOptions}
                    value={selectedCursoOption}
                    onChange={(opt) =>
                      setDraft((d) => ({ ...d, curso: opt ? opt.value : "" }))
                    }
                    placeholder={
                      cursosLoading
                        ? "A carregar cursos..."
                        : cursos.length === 0
                        ? "Sem cursos disponíveis"
                        : "Seleciona o curso..."
                    }
                    isSearchable={false}
                    isClearable={false}
                    isDisabled={saving || cursosLoading || cursos.length === 0}
                  />
                </div>

                {cursosErr && (
                  <p style={{ marginTop: 8, color: "#ef4444", fontWeight: 700 }}>
                    {cursosErr}
                  </p>
                )}
              </div>
            )}

            {msg && (
              <p
                style={{
                  marginTop: 10,
                  color: msg.startsWith("✅") ? "#16a34a" : "#ef4444",
                  fontWeight: 700,
                }}
              >
                {msg}
              </p>
            )}
          </div>

          <div className="card">
            <div className="icon-circle">🕒</div>
            <div className="separator"></div>

            <h3>Últimas Reservas</h3>
            <p>Consulta o teu histórico</p>

            <button className="btn-action" disabled title="Ainda por implementar">
              Em breve
            </button>
          </div>

          <div className="card">
            <div className="icon-circle">📊</div>
            <div className="separator"></div>

            <h3>Estatísticas</h3>
            <p>As tuas estatísticas</p>

            <button className="btn-action" onClick={openStats} type="button">
              Ver
            </button>
          </div>
        </div>

        {statsOpen && (
          <div className="modal-overlay" onClick={() => setStatsOpen(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>📊 Estatísticas</h2>
                <button
                  className="btn-close"
                  onClick={() => setStatsOpen(false)}
                  type="button"
                >
                  &times;
                </button>
              </div>

              <div className="modal-body">
                {statsLoading ? (
                  <p style={{ color: "#64748b" }}>A carregar...</p>
                ) : statsErr ? (
                  <div className="warning-box">
                    <strong>⚠️</strong> {statsErr}
                  </div>
                ) : (
                  <>
                    <div className="stats-grid">
                      <div className="stat-card">
                        <div className="stat-label">Reservas totais</div>
                        <div className="stat-value">
                          {stats?.totalReservas ?? "—"}
                        </div>
                      </div>

                      <div className="stat-card">
                        <div className="stat-label">Horas reservadas</div>
                        <div className="stat-value">{stats?.totalHoras ?? "—"}</div>
                      </div>

                      <div className="stat-card">
                        <div className="stat-label">Sala mais usada</div>
                        <div className="stat-value">{stats?.salaTop ?? "—"}</div>
                      </div>

                      <div className="stat-card">
                        <div className="stat-label">Dia favorito</div>
                        <div className="stat-value">{stats?.diaTop ?? "—"}</div>
                      </div>
                    </div>

                    <button
                      className="btn-action"
                      onClick={() => setStatsOpen(false)}
                      style={{ marginTop: 14 }}
                      type="button"
                    >
                      Fechar
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}