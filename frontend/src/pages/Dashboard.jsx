import { useEffect, useMemo, useState, useCallback } from "react";
import Sidebar from "../components/Sidebar";
import DetalhesSala from "../components/detalhesSala";
import "./Dashboard.css"; // ⚠️ Vê a nota em baixo sobre este ficheiro

export default function Dashboard() {
  const [salas, setSalas] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- LER O UTILIZADOR LOGADO ---
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser =
      localStorage.getItem("user") || sessionStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  // --- MODAL + FAVORITOS ---
  const [salaSelecionada, setSalaSelecionada] = useState(null);
  const [favoritosIds, setFavoritosIds] = useState([]);

  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

  // ---  CARREGAR FAVORITOS DA BD ---
  useEffect(() => {
    if (user && user.username) {
      fetch(`${API_BASE}/api/favoritos/${user.username}`)
        .then((res) => res.json())
        .then((data) => setFavoritosIds(Array.isArray(data) ? data : []))
        .catch(() => {});
    }
  }, [user, API_BASE]);

  // --- LÓGICA DE DATAS E HORAS ---
const { diaSelecionado, setDiaSelecionado, horaSelecionada, setHoraSelecionada } = useFiltros();

  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  function nextHalfHour() {
    const now = new Date();
    const m = now.getMinutes();
    const h = now.getHours();
    if (m === 0) return `${pad2(h)}:00`;
    if (m <= 30) return `${pad2(h)}:30`;
    return `${pad2((h + 1) % 24)}:00`;
  }

  function hojeISO() {
    return new Date().toISOString().split("T")[0];
  }

  const hoje = hojeISO();
  const minHoraHoje = nextHalfHour();

  // Fim-de-semana
  const isWeekend = (isoDate) => {
    const d = new Date(`${isoDate}T00:00:00`);
    const day = d.getDay(); // 0=Domingo, 6=Sábado
    return day === 0 || day === 6;
  };

  // Feriados vêm do backend
  const [FERIADOS, setFERIADOS] = useState(new Set());
  const [feriadosLoading, setFeriadosLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setFeriadosLoading(true);

    fetch(`${API_BASE}/api/feriados`)
      .then((r) => r.json())
      .then((data) => {
        if (!alive) return;
        if (data?.success && Array.isArray(data.feriados)) {
          setFERIADOS(new Set(data.feriados));
        } else {
          setFERIADOS(new Set());
        }
      })
      .catch(() => {
        if (alive) setFERIADOS(new Set());
      })
      .finally(() => {
        if (alive) setFeriadosLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [API_BASE]);

  const isFeriado = (isoDate) => FERIADOS.has(isoDate);

  const fimDeSemana = isWeekend(diaSelecionado);
  const feriado = !feriadosLoading && isFeriado(diaSelecionado);

  // Pesquisa e Tabs
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("todas");

  // --- LÓGICA DE HORÁRIOS ---
  const listaHorarios = useMemo(() => {
    const slots = [];
    for (let h = 8; h <= 22; h++) {
      const horaString = h < 10 ? `0${h}` : `${h}`;
      slots.push(`${horaString}:00`);
      if (h < 22) slots.push(`${horaString}:30`);
    }
    return slots;
  }, []);

  const listaHorariosFiltrada = useMemo(() => {
    if (diaSelecionado !== hoje) return listaHorarios;
    return listaHorarios.filter((h) => h >= minHoraHoje);
  }, [diaSelecionado, hoje, listaHorarios, minHoraHoje]);

  useEffect(() => {
    if (diaSelecionado === hoje && horaSelecionada < minHoraHoje) {
      const primeiraValida = listaHorariosFiltrada[0] || minHoraHoje;
      setHoraSelecionada(primeiraValida);
    }
  }, [diaSelecionado, hoje, horaSelecionada, minHoraHoje, listaHorariosFiltrada]);

  const foraDeHoras = horaSelecionada < "08:00" || horaSelecionada > "22:30";

  // se escolher fim-de-semana/feriado, fecha o modal
  useEffect(() => {
    if (fimDeSemana || feriado) setSalaSelecionada(null);
  }, [fimDeSemana, feriado]);

  // --- FUNÇÃO PARA BUSCAR SALAS  ---
  const refetchSalas = useCallback(() => {
    if (feriadosLoading || foraDeHoras || fimDeSemana || feriado) {
      setLoading(false);
      setSalas([]);
      return;
    }

    setLoading(true);
    fetch(
      `${API_BASE}/api/salas-livres?dia=${encodeURIComponent(
        diaSelecionado
      )}&hora=${encodeURIComponent(horaSelecionada)}`
    )
      .then((res) => res.json())
      .then((dados) => {
        setSalas(Array.isArray(dados) ? dados : []);
        setLoading(false);
      })
      .catch(() => {
        setSalas([]);
        setLoading(false);
      });
  }, [
    API_BASE,
    diaSelecionado,
    horaSelecionada,
    feriadosLoading,
    foraDeHoras,
    fimDeSemana,
    feriado,
  ]);

  useEffect(() => {
    refetchSalas();
  }, [refetchSalas]);

  // --- FILTRAGEM ---
  const salasFiltradas = useMemo(() => {
    const q = query.trim().toLowerCase();
    return salas.filter((s) => {
      const salaTxt = String(s.sala ?? "").toLowerCase();
      const matchQuery = !q || salaTxt.includes(q);
      const pisoNum = Number(s.piso);
      const matchTab = tab === "todas" ? true : pisoNum === Number(tab);
      return matchQuery && matchTab;
    });
  }, [salas, query, tab]);

  const totalSalas = salasFiltradas.length;
  const totalLivres = salasFiltradas.filter((s) => s.status === "Livre").length;
  const totalOcupadas = totalSalas - totalLivres;

  // --- TOGGLE FAVORITO ---
  const toggleFavorito = async (idDaSala) => {
    if (!user || !user.username) {
      alert("Erro de autenticação: Faz login novamente.");
      return;
    }

    setFavoritosIds((prevIds) => {
      if (prevIds.includes(idDaSala)) return prevIds.filter((id) => id !== idDaSala);
      return [...prevIds, idDaSala];
    });

    try {
      await fetch(`${API_BASE}/api/favoritos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: user.username,
          salaId: idDaSala,
        }),
      });
    } catch (error) {
      console.error("Erro ao guardar favorito", error);
    }
  };

  return (
    <div className="dashboard-container">
      <Sidebar />

      <main className="main-content">
        <header className="dashboard-header">
          <div>
            <h1 className="dashboard-title">Salas em Tempo Real</h1>
          </div>

          <div className="filters">
            <div className="filtro-box">
              <label>Dia</label>
              <input
                type="date"
                value={diaSelecionado}
                min={hoje}
                onChange={(e) => setDiaSelecionado(e.target.value)}
              />
            </div>

            <div className="filtro-box">
              <label>Hora</label>
              <select
                value={horaSelecionada}
                onChange={(e) => setHoraSelecionada(e.target.value)}
              >
                {listaHorariosFiltrada.map((horario) => (
                  <option key={horario} value={horario}>
                    {horario}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </header>

        <div className="controlsRow">
          <div className="search">
            <input
              className="searchInput"
              placeholder="Procura o número de uma sala"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <span className="searchIcon">🔎</span>
          </div>

          <div className="tabs">
            {["todas", "1", "2", "3"].map((piso) => (
              <button
                key={piso}
                className={tab === piso ? "tab active" : "tab"}
                onClick={() => setTab(piso)}
              >
                {piso === "todas" ? "Todas as salas" : `Piso ${piso}`}
              </button>
            ))}
          </div>
        </div>

        {loading || feriadosLoading ? (
          <p>⏳ A carregar dados...</p>
        ) : foraDeHoras || fimDeSemana || feriado ? (
          <div className="fechado">
            <h2>🚫 Reservas indisponíveis</h2>
            {fimDeSemana ? (
              <p>Não é possível reservar salas ao fim-de-semana.</p>
            ) : feriado ? (
              <p>Não é possível reservar salas em feriados.</p>
            ) : (
              <p>Seleciona um horário entre 08:00 e 22:30.</p>
            )}
          </div>
        ) : (
          <>
            <div className="stats-container">
              <div className="stat-card">
                <span className="stat-numero">{totalSalas}</span>
                <span className="stat-label">Total de salas</span>
              </div>

              <div className="stat-card">
                <span className="stat-numero green">
                  {totalLivres} <span className="dot greenDot" />
                </span>
                <span className="stat-label">Disponíveis agora</span>
              </div>

              <div className="stat-card">
                <span className="stat-numero red">
                  {totalOcupadas} <span className="dot redDot" />
                </span>
                <span className="stat-label">Ocupadas agora</span>
              </div>
            </div>

            <div className="grid-salas">
              {salasFiltradas.map((item) => {
                const capacidade = Number(item.lugares ?? 15) || 15;

                const livresAgora = Math.max(
                  0,
                  Math.min(capacidade, Number(item.lugaresDisponiveis ?? 0))
                );

                const ocupadas = Math.max(
                  0,
                  Math.min(capacidade, capacidade - livresAgora)
                );

                let ocupClass = "ocup-green";
                if (ocupadas >= 7 && ocupadas <= 10) ocupClass = "ocup-yellow";
                if (ocupadas >= 11) ocupClass = "ocup-red";

                const pct =
                  capacidade > 0 ? Math.round((ocupadas / capacidade) * 100) : 0;

                const livre = item.status === "Livre";
                const key = `${item.sala}-${item.piso}`;

                return (
                  <div key={key} className="card-sala">
                    <div className={`card-top ${livre ? "livre" : "ocupada"}`}>
                      <span className="statusDot" />
                      <span>{livre ? "Disponível" : "Ocupada"}</span>
                    </div>

                    <div className="card-body">
                      <div className="sala-nome">Sala {item.sala}</div>

                      <div className="sala-meta">
                        🏢 Piso {item.piso} • 👥 {ocupadas}/{capacidade} ocupadas
                      </div>

                      <div className="ocup-bar" aria-hidden="true">
                        <div
                          className={`ocup-fill ${ocupClass}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>

                      <div className="ocup-hint">
                        {livresAgora}/{capacidade} livres
                      </div>

                      <button
                        className="btn-details"
                        onClick={() => setSalaSelecionada(item)}
                      >
                        Ver detalhes
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {salaSelecionada && (
          <DetalhesSala
            sala={salaSelecionada}
            user={user}
            onClose={() => setSalaSelecionada(null)}
            isFavorito={favoritosIds.includes(salaSelecionada.sala)}
            onToggleFavorito={() => toggleFavorito(salaSelecionada.sala)}
            diaSelecionado={diaSelecionado}
            horaSelecionada={horaSelecionada}
            bloqueado={foraDeHoras || fimDeSemana || feriado}
            onReservaSucesso={() => {
              refetchSalas();
              setSalaSelecionada(null);
            }}
          />
        )}
      </main>
    </div>
  );
}