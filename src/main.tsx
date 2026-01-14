import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then((registration) => {
        console.log('SW registered:', registration);
        
        // Check for updates periodically (every hour)
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000);
        
        // Handle updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // Check if user has dismissed this update
                const dismissedUpdate = localStorage.getItem('sw-update-dismissed');
                const currentVersion = localStorage.getItem('app_version');
                
                if (dismissedUpdate === currentVersion) {
                  // User already dismissed this version update
                  return;
                }
                
                // New service worker available, prompt user to reload
                const shouldReload = confirm('New version available! Reload to update?');
                if (shouldReload) {
                  localStorage.removeItem('sw-update-dismissed');
                  window.location.reload();
                } else {
                  // Remember dismissal for this version
                  localStorage.setItem('sw-update-dismissed', currentVersion || '1.0.1');
                }
              }
            });
          }
        });
      })
      .catch((error) => {
        console.error('SW registration failed:', error);
      });
  });
}

// Check for stale cache and prompt user
const APP_VERSION = '1.0.1';
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
  
  // Clear the dismissed update flag when version changes
  localStorage.removeItem('sw-update-dismissed');
}

localStorage.setItem('app_version', APP_VERSION);

createRoot(document.getElementById("root")!).render(<App />);
