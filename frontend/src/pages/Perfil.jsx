import { useEffect, useMemo, useState, useRef } from "react";
import Select from "react-select";
import Sidebar from "../components/Sidebar";
import "./Perfil.css";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// ✅ Estilos customizados para o React Select parecer um "badge" e corrigir o menu
const customSelectStyles = {
  control: (base, state) => ({
    ...base,
    borderRadius: "99px",
    padding: "2px 10px 2px 38px",
    border: state.isFocused ? "1px solid #E38B2C" : "1px solid #e2e8f0",
    boxShadow: state.isFocused ? "0 0 0 2px rgba(227, 139, 44, 0.1)" : "none",
    minHeight: "42px",
    fontSize: "0.95rem",
    fontWeight: "600",
    color: "#475569",
    cursor: "pointer",
    minWidth: "220px",
    "&:hover": { borderColor: "#cbd5e1" },
    background: "white"
  }),
  indicatorSeparator: () => ({ display: "none" }),
  dropdownIndicator: (base) => ({ ...base, color: "#94a3b8", padding: "8px" }),
  placeholder: (base) => ({ ...base, color: "#94a3b8", fontWeight: "400" }),
  valueContainer: (base) => ({ ...base, padding: "2px 0" }), // Remove padding extra

  // ✅ REVERTI OS ESTILOS DO MENU para o padrão (mais bonito/limpo)
  // Removi as personalizações de 'menu', 'option' e 'singleValue' que estavam a dar a cor azul.
  menu: (base) => ({ 
    ...base, 
    borderRadius: "12px", 
    overflow: "hidden", 
    zIndex: 100,
    marginTop: "8px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
    border: "1px solid #eef0f4"
  }),
  option: (base, state) => ({
    ...base,
    fontSize: "0.9rem",
    fontWeight: "500",
    padding: "10px 15px",
    cursor: "pointer",
    backgroundColor: state.isSelected 
      ? "#f1f5f9" // Cor de fundo quando selecionado (cinza claro)
      : state.isFocused 
        ? "#f8fafc" // Cor de fundo no hover (cinza muito claro)
        : "white",
    color: state.isSelected ? "#1e293b" : "#475569",
    ":active": {
      backgroundColor: "#e2e8f0"
    }
  })
};

export default function Perfil() {
  // ... (O resto do componente Perfil mantém-se EXATAMENTE igual ao anterior)
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [user, setUser] = useState(null);
  const [msg, setMsg] = useState("");
  
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [draft, setDraft] = useState({ numero: "", curso: "" });
  const [draftFile, setDraftFile] = useState(null); 
  const [previewUrl, setPreviewUrl] = useState(null);

  const [cursos, setCursos] = useState([]);
  const [cursosLoading, setCursosLoading] = useState(false);
  const [cursosErr, setCursosErr] = useState("");
  const [statsOpen, setStatsOpen] = useState(false);
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsErr, setStatsErr] = useState("");

  const formatarTempo = (horasDecimais) => {
    if (!horasDecimais) return "0 min";
    const h = Math.floor(horasDecimais);
    const m = Math.round((horasDecimais - h) * 60);
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    return `${m} min`;
  };

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
          sessionStorage.setItem("user", JSON.stringify({ ...sessionUser, ...data.user }));
        }
      }).catch(() => {});
  }, []);

  useEffect(() => {
    setCursosLoading(true);
    fetch(`${API_BASE}/api/cursos`)
      .then((r) => r.json())
      .then((data) => {
        const arr = Array.isArray(data) ? data : data?.cursos;
        const normalized = (Array.isArray(arr) ? arr : []).map((x) => (typeof x === "string" ? x : x?.nome)).filter(Boolean);
        setCursos(normalized);
      })
      .catch(() => setCursosErr("Erro ao carregar cursos."))
      .finally(() => setCursosLoading(false));
  }, []);

  useEffect(() => {
    if (!user) return;
    setDraft({ numero: user.numero ?? "", curso: user.curso ?? "" });
  }, [user]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setDraftFile(file);
    setPreviewUrl(url);
  };

  const triggerFileSelect = () => {
    if (isEditing) fileInputRef.current.click();
  };

  function startEdit() {
    setMsg("");
    setIsEditing(true);
  }

  function cancelEdit() {
    setMsg("");
    setIsEditing(false);
    setDraft({ numero: user?.numero ?? "", curso: user?.curso ?? "" });
    setDraftFile(null);
    setPreviewUrl(null);
  }

  async function saveProfile() {
    if (!user?.username) return;
    setMsg("");
    setSaving(true);

    try {
      let currentFotoUrl = user.foto;

      if (draftFile) {
        const formData = new FormData();
        formData.append("foto", draftFile);
        const resPhoto = await fetch(`${API_BASE}/api/users/${user.username}/foto`, {
          method: "PUT",
          body: formData,
        });
        const dataPhoto = await resPhoto.json();
        if (!resPhoto.ok || !dataPhoto.success) throw new Error(dataPhoto.message || "Erro foto.");
        currentFotoUrl = dataPhoto.foto;
      }

      const numeroStr = String(draft.numero ?? "").trim();
      const cursoStr = String(draft.curso ?? "").trim();
      if (numeroStr !== "" && !/^[0-9]+$/.test(numeroStr)) throw new Error("Nº inválido.");

      const resData = await fetch(`${API_BASE}/api/users/${user.username}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          numero: numeroStr === "" ? null : Number(numeroStr),
          curso: cursoStr,
        }),
      });
      const dataData = await resData.json();
      if (!resData.ok || !dataData.success) throw new Error(dataData.message || "Erro dados.");

      const updatedUser = {
        ...user,
        numero: dataData.user?.numero ?? (numeroStr === "" ? null : Number(numeroStr)),
        curso: dataData.user?.curso ?? cursoStr,
        foto: currentFotoUrl
      };

      setUser(updatedUser);
      sessionStorage.setItem("user", JSON.stringify(updatedUser));
      
      setIsEditing(false);
      setDraftFile(null);
      setPreviewUrl(null);

    } catch (e) {
      setMsg(`❌ ${e.message || "Erro."}`);
    } finally {
      setSaving(false);
    }
  }

  const openStats = async () => {
    if (!user?.username) return;
    setStatsOpen(true); setStats(null); setStatsErr(""); setStatsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/users/${user.username}/stats`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) { setStatsErr(data?.message || "Erro stats."); return; }
      setStats(data.stats);
    } catch (e) { setStatsErr("Erro servidor."); } finally { setStatsLoading(false); }
  };

  const cursoOptions = useMemo(() => (cursos || []).map((c) => ({ value: c, label: c })), [cursos]);
  const selectedCursoOption = useMemo(() => {
    const value = String(draft.curso ?? "").trim();
    return value ? { value, label: value } : null;
  }, [draft.curso]);
  
  const canSave = useMemo(() => {
    if (!user) return false;
    const numeroOk = draft.numero === "" || /^[0-9]+$/.test(String(draft.numero));
    return numeroOk || draftFile; 
  }, [draft, user, draftFile]);

  const bgImageStyle = previewUrl 
    ? `url(${previewUrl})` 
    : user?.foto 
      ? `url(${API_BASE}${user.foto})` 
      : "none";

  if (!user) return <div className="dashboard-container">Loading...</div>;

  return (
    <div className="dashboard-container">
      <Sidebar />
      <main className="main-content">
        
        <section className="profile-hero">
          <div className="hero-content">
            
            <div className="profile-pic-container">
                <div 
                  className={`icon-circle profile-pic ${isEditing ? "editable" : ""}`}
                  onClick={triggerFileSelect}
                  style={{ backgroundImage: bgImageStyle }}
                >
                  {!user.foto && !previewUrl && "👤"}
                  {isEditing && <div className="camera-overlay">📷</div>}
                  <input type="file" ref={fileInputRef} style={{ display: "none" }} accept="image/*" onChange={handleFileChange}/>
                </div>

                {!isEditing && (
                    <button className="btn-icon-pencil" onClick={startEdit} title="Editar Perfil">
                        ✏️
                    </button>
                )}

                {isEditing && (
                  <div className="mini-actions-container">
                    <button className="btn-mini btn-mini-cancel" onClick={cancelEdit} disabled={saving} title="Cancelar">✕</button>
                    <button className="btn-mini btn-mini-save" onClick={saveProfile} disabled={!canSave || saving} title="Guardar">
                      {saving ? ".." : "✓"}
                    </button>
                  </div>
                )}
            </div>

            <div className="hero-info">
              <h2>{user.username}</h2>
              <div className="profile-separator"></div>

              {!isEditing ? (
                <div className="static-info">
                  <p className="info-badge">Nº {user.numero || "—"}</p>
                  <p className="info-badge">🎓 {user.curso || "Sem curso"}</p>
                </div>
              ) : (
                <div className="edit-inline-row">
                   
                   <div className="input-pill-wrapper">
                      <span className="input-label-icon">Nº</span>
                      <input 
                        className="input-pill" 
                        type="text" 
                        inputMode="numeric" 
                        value={draft.numero} 
                        onChange={(e) => setDraft((d) => ({ ...d, numero: e.target.value.replace(/\D/g, "") }))} 
                        disabled={saving} 
                        placeholder="Nº..." 
                      />
                   </div>

                   <div className="select-pill-wrapper">
                        <span className="input-label-icon">🎓</span>
                        <Select 
                            styles={customSelectStyles} 
                            options={cursoOptions} 
                            value={selectedCursoOption} 
                            onChange={(opt) => setDraft((d) => ({ ...d, curso: opt ? opt.value : "" }))} 
                            placeholder="Selecionar curso..." 
                            isDisabled={saving || cursosLoading} 
                        />
                   </div>
                </div>
              )}

              {msg && <p className={`msg-box ${msg.includes("✅") ? "success" : "error"}`}>{msg}</p>}
            </div>
          </div>
        </section>

        <div className="cards-grid">
          <div className="card">
            <div className="icon-circle icon-small">🕒</div>
            <h3>Últimas Reservas</h3>
            <p>Consulta o teu histórico</p>
            <div className="spacer"></div>
            <button className="btn-action" onClick={() => navigate("/historico-reservas")}>Ver histórico</button>
          </div>
          <div className="card">
            <div className="icon-circle icon-small">📊</div>
            <h3>Estatísticas</h3>
            <p>Visualiza o teu tempo</p>
            <div className="spacer"></div>
            <button className="btn-action" onClick={openStats}>Ver estatísticas</button>
          </div>
        </div>
        
         {/* MODAL */}
         {statsOpen && (
          <div className="modal-overlay" onClick={() => setStatsOpen(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>📊 Estatísticas</h2>
                <button className="btn-close" onClick={() => setStatsOpen(false)}>&times;</button>
              </div>
              <div className="modal-body">
                {statsLoading ? ( <p style={{ textAlign: "center" }}>A calcular...</p> ) : statsErr ? ( <div className="warning-box"><strong>⚠️</strong> {statsErr}</div> ) : (
                  <>
                    <div className="stats-grid">
                      <div className="stat-card"><div className="stat-icon-bg">📅</div><div className="stat-value">{stats?.totalReservas ?? 0}</div><div className="stat-label">Reservas Totais</div></div>
                      <div className="stat-card"><div className="stat-icon-bg">⏳</div><div className="stat-value">{formatarTempo(stats?.totalHoras)}</div><div className="stat-label">Tempo em Sala</div></div>
                      <div className="stat-card"><div className="stat-icon-bg">📍</div><div className={`stat-value ${stats?.salaTop === "---" ? "" : "highlight"}`}>{stats?.salaTop ?? "---"}</div><div className="stat-label">Sala Mais Usada</div></div>
                    </div>
                    <button className="btn-action" onClick={() => setStatsOpen(false)} style={{ marginTop: 20, width: "100%" }}>Fechar</button>
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