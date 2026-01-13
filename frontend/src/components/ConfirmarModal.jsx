import { FaExclamationTriangle, FaTimes } from "react-icons/fa";
import "./ConfirmarModal.css";

export default function ConfirmarModal({
  open,
  title = "Terminar sessão?",
  message = "Tem a certeza que pretende sair?",
  cancelText = "Voltar",
  confirmText = "Sim, sair",
  danger = false, 
  onCancel,
  onConfirm,
}) {
  if (!open) return null;

  return (
    <div className="cm-overlay" onClick={onCancel}>
      <div className="cm-content" onClick={(e) => e.stopPropagation()}>
        <div className="cm-header">
          <div className="cm-headerLeft">
            <div className="cm-icon">
              <FaExclamationTriangle size={22} />
            </div>
            <h2 className="cm-title">{title}</h2>
          </div>

          <button className="cm-close" onClick={onCancel} aria-label="Fechar">
            <FaTimes />
          </button>
        </div>

        <div className="cm-body">
          <p className="cm-message">{message}</p>
        </div>

        <div className="cm-footer">
          <button className="cm-btn cm-btnCancel" onClick={onCancel}>
            {cancelText}
          </button>

          <button
            className={`cm-btn ${danger ? "cm-btnDanger" : "cm-btnConfirm"}`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
