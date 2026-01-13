import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaCheck } from "react-icons/fa";
import io from "socket.io-client";
import { useToast } from "../context/ToastContext";

import Sidebar from "../components/Sidebar";
import DetalhesSala from "../components/detalhesSala";
import GerirReserva from "../components/gerirReserva";

import "./Dashboard.css";
import { useFiltros } from "../context/FiltrosContext";
import "../components/detalhesSala.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const socket = io(API_BASE_URL, {
  autoConnect: false,
});

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();

  const [salas, setSalas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  const [minhasReservas, setMinhasReservas] = useState([]);
  const [reservaToast, setReservaToast] = useState(null);

  const [salaSelecionada, setSalaSelecionada] = useState(null);
  const [favoritosIds, setFavoritosIds] = useState([]);
  const { showToast } = useToast();
  const API_BASE = API_BASE_URL;

  useEffect(() => {
    const storedUser = localStorage.getItem("user") || sessionStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  useEffect(() => {
    if (user && user.username) {
      fetch(`${API_BASE}/api/favoritos/${user.username}`)
        .then((res) => res.json())
        .then((data) => setFavoritosIds(Array.isArray(data) ? data : []))
        .catch(() => {});

      fetch(`${API_BASE}/api/reservas/${user.username}`)
        .then((res) => res.json())
        .then((data) => setMinhasReservas(data.reservas || []))
        .catch(() => setMinhasReservas([]));
    }
  }, [user, API_BASE]);

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

  function amanhaISO() {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  }

  const hoje = hojeISO();
  const amanha = amanhaISO();
  const minHoraHoje = nextHalfHour();
  
  const horasAtuais = new Date().getHours();
  const isLateNight = minHoraHoje > "22:30" || (horasAtuais === 23 && minHoraHoje === "00:00");

  useEffect(() => {
    const justLoggedIn = sessionStorage.getItem("justLoggedIn") === "1";
    if (!justLoggedIn) return;

    if (isLateNight || minHoraHoje < "08:00") {
        if (isLateNight) {
             setDiaSelecionado(amanha);
             setHoraSelecionada("08:00");
        } else {
             setDiaSelecionado(hoje);
             setHoraSelecionada("08:00");
        }
    } else {
        setDiaSelecionado(hoje);
        setHoraSelecionada(minHoraHoje);
    }

    sessionStorage.removeItem("justLoggedIn");
  }, [setDiaSelecionado, setHoraSelecionada, hoje, amanha, minHoraHoje, isLateNight]);

  useEffect(() => {
    if (diaSelecionado < hoje) {
      setDiaSelecionado(hoje);
    }
  }, [diaSelecionado, hoje, setDiaSelecionado]);

  const isWeekend = (isoDate) => {
    if (!isoDate) return false;
    const d = new Date(`${isoDate}T00:00:00`);
    const day = d.getDay();
    return day === 0 || day === 6;
  };

  const [FERIADOS, setFERIADOS] = useState(new Set());
  const [feriadosLoading, setFeriadosLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setFeriadosLoading(true);
    fetch(`${API_BASE}/api/feriados`)
      .then((r) => r.json())
      .then((data) => {
        if (!alive) return;
        if (data?.success && Array.isArray(data.feriados)) setFERIADOS(new Set(data.feriados));
        else setFERIADOS(new Set());
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

  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("todas");

  const listaHorarios = useMemo(() => {
    const slots = [];
    for (let h = 8; h <= 22; h++) {
      const horaString = h < 10 ? `0${h}` : `${h}`;
      slots.push(`${horaString}:00`);
      slots.push(`${horaString}:30`);
    }
    return slots;
  }, []);

  const listaHorariosFiltrada = useMemo(() => {
    if (diaSelecionado !== hoje) return listaHorarios;
    return listaHorarios.filter((h) => h >= minHoraHoje);
  }, [diaSelecionado, hoje, listaHorarios, minHoraHoje]);

  useEffect(() => {
    if (diaSelecionado === hoje && horaSelecionada < minHoraHoje) {
      const primeiraValida = listaHorariosFiltrada[0];
      if (primeiraValida) {
          setHoraSelecionada(primeiraValida);
      }
    }
  }, [diaSelecionado, hoje, horaSelecionada, minHoraHoje, listaHorariosFiltrada, setHoraSelecionada]);

  const foraDeHoras = horaSelecionada < "08:00" || horaSelecionada > "22:30";
  
  const diaAcabou = diaSelecionado === hoje && isLateNight;

  const refetchSalas = useCallback(() => {
    if (feriadosLoading || foraDeHoras || fimDeSemana || feriado || diaAcabou) {
      setLoading(false);
      setSalas([]);
      return;
    }

    fetch(
      `${API_BASE}/api/salas-livres?dia=${encodeURIComponent(diaSelecionado)}&hora=${encodeURIComponent(
        horaSelecionada
      )}`
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
  }, [API_BASE, diaSelecionado, horaSelecionada, feriadosLoading, foraDeHoras, fimDeSemana, feriado, diaAcabou]);

  useEffect(() => {
    refetchSalas();
  }, [refetchSalas]);

  useEffect(() => {
    socket.connect();

    const onConnect = () => {
      console.log("🟢 Conectado ao servidor de Tempo Real (ID: " + socket.id + ")");
    };

    const onAtualizacao = (dados) => {
      console.log("🔔 Alguém reservou/libertou uma sala!", dados);
      refetchSalas();
    };

    socket.on("connect", onConnect);
    socket.on("atualizacao_mapa", onAtualizacao);

    return () => {
      socket.off("connect", onConnect);
      socket.off("atualizacao_mapa", onAtualizacao);
      socket.disconnect();
    };
  }, [refetchSalas]);

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

  const toggleFavorito = async (idDaSala, silent = false) => {
    if (!user || !user.username) {
      alert("Erro de autenticação: Faz login novamente.");
      return;
    }

    const isRemoving = favoritosIds.includes(idDaSala);

    setFavoritosIds((prevIds) => {
      if (prevIds.includes(idDaSala)) return prevIds.filter((id) => id !== idDaSala);
      return [...prevIds, idDaSala];
    });

    if (!silent) {
      if (isRemoving) {
        showToast({
          text: "Removido dos favoritos.",
          type: "remove",
          onUndo: () => toggleFavorito(idDaSala, true) 
        });
      } else {
        showToast({
          text: "Sala adicionada aos favoritos!",
          type: "add"
        });
      }
    }

    try {
      await fetch(`${API_BASE}/api/favoritos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: user.username, salaId: idDaSala }),
      });
    } catch (error) {
      console.error("Erro ao guardar favorito", error);
    }
  };

  const showReservaToast = (payload) => {
    if (reservaToast?.timeoutId) clearTimeout(reservaToast.timeoutId);

    const fallbackSalaNome = salaSelecionada?.sala ? `Sala ${salaSelecionada.sala}` : "Sala";
    const salaNome = payload?.salaNome || fallbackSalaNome;

    const diaISO = payload?.diaISO || diaSelecionado;
    const horaInicio = payload?.horaInicio || horaSelecionada;
    const horaFim = payload?.horaFim || payload?.hora_fim || "";
    const pessoasCount = payload?.pessoas || 1;

    const timer = setTimeout(() => setReservaToast(null), 6000);

    setReservaToast({
      show: true,
      text: `Reserva confirmada para ${salaNome} (Dia ${diaISO} das ${horaInicio}${
        horaFim ? ` até ${horaFim}` : ""
      }).`,
      data: {
        sala: salaNome,
        dia: diaISO,
        horario: `${horaInicio} - ${horaFim}`,
        pessoas: pessoasCount,
      },
      timeoutId: timer,
    });
  };

  useEffect(() => {
    if (location.state?.reabrirSala && salas.length > 0) {
      const nomeSala = location.state.reabrirSala;
      const estadoQueVoltou = location.state?.reabrirComEstado;

      const salaParaAbrir = salas.find((s) => String(s.sala) === String(nomeSala));

      if (salaParaAbrir) {
        const minhaReserva = minhasReservas.find(
          (r) =>
            r.sala === salaParaAbrir.sala &&
            r.dia === diaSelecionado &&
            r.status === "ativa" &&
            r.hora_inicio <= horaSelecionada &&
            r.hora_fim > horaSelecionada
        );

        setSalaSelecionada({
          ...salaParaAbrir,
          reservaExistente: minhaReserva,
          estadoPreservado: estadoQueVoltou,
        });

        window.history.replaceState({}, document.title);
      }
    }
  }, [location.state, salas, minhasReservas, diaSelecionado, horaSelecionada]);

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
                value={diaAcabou ? "" : horaSelecionada} 
                onChange={(e) => setHoraSelecionada(e.target.value)}
                disabled={diaAcabou}
              >
                 {listaHorariosFiltrada.length === 0 && diaAcabou ? (
                    <option>--:--</option>
                ) : (
                    listaHorariosFiltrada.map((horario) => (
                    <option key={horario} value={horario}>
                        {horario}
                    </option>
                    ))
                )}
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
        ) : diaAcabou ? (
           <div className="dia-terminou-card">
            <span className="dia-terminou-icon" role="img" aria-label="sleeping face">
                😴
            </span>
            
            <h2>O dia terminou!</h2>
            
            <p>
                O horário de reservas para hoje já encerrou.
                <br />Mas podes começar já a planear o dia de amanhã.
            </p>
            
            <button 
                className="btn-amanha-cta" 
                onClick={() => {
                    setDiaSelecionado(amanha);
                    setHoraSelecionada("08:00");
                }}
            >
                Ver disponibilidade para Amanhã →
            </button>
           </div>
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
                const capacidade = Number(item.lugares); 
                
                const livresAgora = Math.max(
                  0,
                  Math.min(capacidade, Number(item.lugaresDisponiveis ?? 0))
                );
                const ocupadas = Math.max(0, Math.min(capacidade, capacidade - livresAgora));
                let ocupClass = "ocup-green";
                if (ocupadas >= 7 && ocupadas <= 10) ocupClass = "ocup-yellow";
                if (ocupadas >= 11) ocupClass = "ocup-red";
                const pct = capacidade > 0 ? Math.round((ocupadas / capacidade) * 100) : 0;
                const livre = item.status === "Livre";

                const minhaReserva = minhasReservas.find(
                  (r) =>
                    r.sala === item.sala &&
                    r.dia === diaSelecionado &&
                    r.status === "ativa" &&
                    r.hora_inicio <= horaSelecionada &&
                    r.hora_fim > horaSelecionada
                );

                return (
                  <div
                    key={`${item.sala}-${item.piso}`}
                    className={`card-sala ${minhaReserva ? "minha-reserva-border" : ""}`}
                  >
                    <div className={`card-top ${minhaReserva ? "minha" : livre ? "livre" : "ocupada"}`}>
                      <span className="statusDot" />
                      <span>{minhaReserva ? "Minha Reserva" : livre ? "Disponível" : "Ocupada"}</span>
                    </div>
                    <div className="card-body">
                      <div className="card-header-row">
                        <div className="sala-nome">Sala {item.sala}</div>
                        <span className="sala-piso-badge">🏢 Piso {item.piso}</span>
                      </div>
                      <div className="ocup-bar" aria-hidden="true">
                        <div className={`ocup-fill ${ocupClass}`} style={{ width: `${pct}%` }} />
                      </div>
                      <div className="ocup-hint">
                        {livresAgora}/{capacidade} livres
                      </div>
                      <button
                        className={minhaReserva ? "btn-details btn-manage" : "btn-details"}
                        onClick={() => setSalaSelecionada({ ...item, reservaExistente: minhaReserva })}
                      >
                        {minhaReserva ? "✏️ Gerir Reserva" : "Ver detalhes"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {reservaToast && reservaToast.show && (
          <div className="reserva-toast-container">
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div className="rt-icon">
                <FaCheck />
              </div>
              <span className="rt-text">{reservaToast.text}</span>
            </div>

            <button
              className="rt-action-btn"
              onClick={() => {
                setReservaToast(null);
                navigate("/minhas-reservas");
              }}
            >
              MINHAS RESERVAS
            </button>
          </div>
        )}

        {salaSelecionada &&
          (salaSelecionada.reservaExistente ? (
            <GerirReserva
              salaInfo={salaSelecionada}
              reserva={salaSelecionada.reservaExistente}
              user={user}
              onClose={() => setSalaSelecionada(null)}
              onSuccess={() => {
                refetchSalas();
                setSalaSelecionada(null);
                if (user?.username) {
                  fetch(`${API_BASE}/api/reservas/${user.username}`)
                    .then((res) => res.json())
                    .then((data) => setMinhasReservas(data.reservas || []));
                }
              }}
            />
          ) : (
            <DetalhesSala
              sala={salaSelecionada}
              user={user}
              onClose={() => setSalaSelecionada(null)}
              isFavorito={favoritosIds.includes(salaSelecionada.sala)}
              onToggleFavorito={() => toggleFavorito(salaSelecionada.sala)}
              diaSelecionado={diaSelecionado}
              horaSelecionada={horaSelecionada}
              onReservaSucesso={(payload) => {
                showReservaToast(payload);
                refetchSalas();
                setSalaSelecionada(null);
                if (user?.username) {
                  fetch(`${API_BASE}/api/reservas/${user.username}`)
                    .then((res) => res.json())
                    .then((data) => setMinhasReservas(data.reservas || []));
                }
              }}
            />
          ))}
      </main>
    </div>
  );
}