import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LoadingScreen from "../components/LoadingScreen";

export default function LoadingRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => {
      navigate("/", { replace: true });
    }, 1500);

    return () => clearTimeout(t);
  }, [navigate]);

  return <LoadingScreen />;
}
