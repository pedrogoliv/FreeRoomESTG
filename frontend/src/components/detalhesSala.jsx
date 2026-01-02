// src/components/detalhesSala.jsx
import React from "react";
import { FaHeart, FaRegHeart } from "react-icons/fa"; // Importar corações
import "./detalhesSala.css";

// Recebemos as novas props: isFavorito e onToggleFavorito
export default function DetalhesSala({ sala, onClose, isFavorito, onToggleFavorito }) {
  if (!sala) return null;

  const isLivre = sala.status === "Livre";

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Sala {sala.sala}</h2>
          <button className="btn-close" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="modal-body">
          {/* Informações da sala */}
          <div className="info-row">
            <span className="info-label">Estado:</span>
            {isLivre ? (
              <span className="status-badge livre">Disponível</span>
            ) : (
              <span className="status-badge ocupada">Ocupada</span>
            )}
          </div>

          <p>
            <strong>Localização:</strong> Piso {sala.piso}
          </p>
          <p>
            <strong>Capacidade:</strong> {sala.lugares} Pessoas
          </p>

          <div className="tags-container">
            <span className="tag">📽️ Projetor</span>
            <span className="tag">❄️ Ar Condicionado</span>
            <span className="tag">🪑 Quadros</span>
          </div>


          {/* ÁREA DE AÇÕES (Botões) */}
          <div className="modal-actions">
            {/* Botão Principal (Reservar/Notificar) */}


            {/* ✅ NOVO BOTÃO: Adicionar aos Favoritos */}
            <button 
                className={`btn-fav ${isFavorito ? 'active' : ''}`} 
                onClick={onToggleFavorito}
            >
              {isFavorito ? (
                <>
                  <FaHeart className="icon-heart filled" /> Favorito
                </>
              ) : (
                <>
                  <FaRegHeart className="icon-heart outline" /> Adicionar aos Favoritos
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}