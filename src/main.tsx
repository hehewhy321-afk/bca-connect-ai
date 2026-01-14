import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Service Worker update detection
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => {
      registration.update();
    });
  });
}

// Check for stale cache and prompt user
const APP_VERSION = '1.0.0';
const STORED_VERSION = localStorage.getItem('app_version');

if (STORED_VERSION && STORED_VERSION !== APP_VERSION) {
  console.log('New version detected, clearing cache...');
  
  // Clear caches
  if ('caches' in window) {
    caches.keys().then((names) => {
      names.forEach((name) => {
        if (name.includes('supabase')) {
          caches.delete(name);
        }
      });
    });
  }
}

localStorage.setItem('app_version', APP_VERSION);

createRoot(document.getElementById("root")!).render(<App />);
