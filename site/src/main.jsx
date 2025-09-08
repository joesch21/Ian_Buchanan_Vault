import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import App from './App.jsx'
import './styles/global.css'
import "@/widgets/knowWidget.css";
import { KnowWidget } from "@/widgets/KnowWidget";
import { ErrorBoundary } from "@/widgets/ErrorBoundary";
import "@/lib/globalHotkeys";

createRoot(document.getElementById('root')).render(
  <HelmetProvider>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </HelmetProvider>
);

// --- Know widget mount (auto-added by CWO) ---
(function mountKnow(){
  if (typeof window === "undefined") return;
  if (window.__KNOW_WIDGET_MOUNTED__) return;
  window.__KNOW_WIDGET_MOUNTED__ = true;
  window.addEventListener("DOMContentLoaded", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    createRoot(host).render(
      <ErrorBoundary>
        <KnowWidget />
      </ErrorBoundary>
    );
  });
})();
