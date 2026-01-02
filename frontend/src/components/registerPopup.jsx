import React, { useState } from "react";
import { FaCheckCircle } from "react-icons/fa";
import "./registerPopup.css";

export default function RegisterPopup({ onClose }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  async function handleRegister(e) {
    e.preventDefault();
    setMsg("");

    if (!username || !password || !confirmPassword) {
      setMsg("⚠️ Preenche todos os campos.");
      return;
    }

    if (password !== confirmPassword) {
      setMsg("❌ As passwords não coincidem.");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (data.success) {
        // ✅ Sucesso! Mostra a mensagem e NÃO fecha sozinho
        setIsSuccess(true);
        setMsg(""); 
      } else {
        setMsg("❌ " + data.message);
      }
    } catch (error) {
      setMsg("❌ Erro ao ligar ao servidor.");
    }
  }

  return (
    <div className="modal-overlay">
      <div className="popup-content">
        
        {/* Se NÃO for sucesso, mostra o botão de fechar (X) normal */}
        {!isSuccess && (
          <button className="close-btn" onClick={onClose}>&times;</button>
        )}
        
        {!isSuccess ? (
          /* --- FORMULÁRIO DE REGISTO --- */
          <>
            <h2>Criar Nova Conta</h2>
            <p className="subtitle">Junta-te ao FreeRoom</p>

            <form onSubmit={handleRegister}>
              <div className="input-group">
                <label>Username</label>
                <input 
                  type="text" 
                  value={username} 
                  onChange={e => setUsername(e.target.value)} 
                />
              </div>
              
              <div className="input-group">
                <label>Password</label>
                <input 
                  type="password" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                />
              </div>

              <div className="input-group">
                <label>Confirmar Password</label>
                <input 
                  type="password" 
                  value={confirmPassword} 
                  onChange={e => setConfirmPassword(e.target.value)} 
                />
              </div>

              <button type="submit" className="btn-register">Registar</button>
            </form>
            {msg && <div className="msg-box error">{msg}</div>}
          </>
        ) : (
          /* --- MENSAGEM DE SUCESSO --- */
          <div className="success-view">
            <div className="success-icon">
                ✅ {/* Podes trocar por <FaCheckCircle /> se tiveres react-icons */}
            </div>
            <h2>Conta Criada!</h2>
            <p>O teu registo foi efetuado com sucesso.</p>
            
            <button className="btn-back-login" onClick={onClose}>
              Voltar para o Login
            </button>
          </div>
        )}

      </div>
    </div>
  );
}