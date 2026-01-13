import { createContext, useContext, useState, useCallback } from "react";
import "./Toast.css"; 

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);

  const showToast = useCallback(({ text, type, onUndo }) => {
    setToast(null);

    setTimeout(() => {
      const id = setTimeout(() => {
        setToast(null);
      }, 4000); 

      setToast({ text, type, onUndo, timeoutId: id });
    }, 50);
  }, []);

  const hideToast = useCallback(() => {
    if (toast?.timeoutId) clearTimeout(toast.timeoutId);
    setToast(null);
  }, [toast]);

  const handleUndo = () => {
    if (toast?.onUndo) {
      toast.onUndo();
    }
    hideToast();
  };

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      
      {toast && (
        <div className="undo-toast">
          <span>
            {toast.type === "add" ? "" : ""} 
            {toast.text}
          </span>
          
          {toast.type === "remove" && toast.onUndo && (
            <button className="undo-btn" onClick={handleUndo}>
              DESFAZER
            </button>
          )}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}