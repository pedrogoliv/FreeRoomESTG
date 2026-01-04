import { createContext, useContext, useEffect, useMemo, useState } from "react";

const FiltrosContext = createContext(null);

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

export function FiltrosProvider({ children }) {
  // 1) Ler do localStorage (se existir), senão usar defaults
  const [diaSelecionado, setDiaSelecionado] = useState(() => {
    return localStorage.getItem("diaSelecionado") || hojeISO();
  });

  const [horaSelecionada, setHoraSelecionada] = useState(() => {
    return localStorage.getItem("horaSelecionada") || nextHalfHour();
  });

  // 2) Guardar sempre que muda (para não dar reset ao refrescar/navegar)
  useEffect(() => {
    localStorage.setItem("diaSelecionado", diaSelecionado);
  }, [diaSelecionado]);

  useEffect(() => {
    localStorage.setItem("horaSelecionada", horaSelecionada);
  }, [horaSelecionada]);

  const value = useMemo(
    () => ({ diaSelecionado, setDiaSelecionado, horaSelecionada, setHoraSelecionada }),
    [diaSelecionado, horaSelecionada]
  );

  return <FiltrosContext.Provider value={value}>{children}</FiltrosContext.Provider>;
}

export function useFiltros() {
  const ctx = useContext(FiltrosContext);
  if (!ctx) throw new Error("useFiltros tem de ser usado dentro de <FiltrosProvider>");
  return ctx;
}
