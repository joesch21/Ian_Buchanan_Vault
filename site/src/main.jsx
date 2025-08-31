import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './styles/global.css'

// --- Know widget mount (auto-added by CWO) ---
import "@/widgets/knowWidget.css";
import { KnowWidget } from "@/widgets/KnowWidget";

(function mountKnow(){
  if (typeof window === "undefined") return;
  window.addEventListener("DOMContentLoaded", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    new KnowWidget(host, { welcome: "Hi! Ask about bibliography, formatting, or wiki blocks." });
  });
})();

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
)
