import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import "./styles/gaming-theme.css";
import "./i18n/config";

// Preload critical features for better UX
import { preloadCriticalFeatures } from "./shared/utils/dynamic-imports";

async function initializeApp() {
  // Start preloading critical features immediately
  const preloadPromises = [preloadCriticalFeatures()];

  // Don't wait for preloading to complete - render immediately
  const rootElement = document.getElementById("root");
  if (rootElement) {
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    );
  }

  // Continue preloading in the background
  Promise.allSettled(preloadPromises).catch(() => {
    // Ignore preload errors - they will be handled when actually needed
  });
}

initializeApp();
