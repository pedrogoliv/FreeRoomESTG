import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { FiltrosProvider } from "./context/FiltrosContext.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <FiltrosProvider>
      <App />
    </FiltrosProvider>
  </StrictMode>
);
