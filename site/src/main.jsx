import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './styles/global.css'
import "@/widgets/knowWidget.css";
import { KnowWidget } from "@/widgets/KnowWidget";

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);

// --- Know widget mount (auto-added by CWO) ---
(function mountKnow(){
  if (typeof window === "undefined") return;
  if (window.__KNOW_WIDGET_MOUNTED__) return;
  window.__KNOW_WIDGET_MOUNTED__ = true;
  window.addEventListener("DOMContentLoaded", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    new KnowWidget(host, { welcome: "Hi! Ask about bibliography, formatting, or wiki blocks." });
  });
})();
