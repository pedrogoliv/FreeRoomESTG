import { useState } from "react";
import Login from "./pages/Login";

export default function App() {
  const [user, setUser] = useState(null);

  if (!user) {
    return <Login onLogin={(u) => setUser(u)} />;
  }

  return (
    <div style={{ padding: 24, fontFamily: "system-ui" }}>
      <h2>Bem-vindo, {user.username} 👋</h2>
      <p>Aqui depois entra a página principal (salas/reservas).</p>
      <button onClick={() => setUser(null)}>Logout</button>
    </div>
  );
}
