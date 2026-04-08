import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";



const APP_VERSION = '1.0.2';
localStorage.setItem('app_version', APP_VERSION);

createRoot(document.getElementById("root")!).render(<App />);
