import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import { BrowserRouter } from "react-router-dom";

import { AuthProvider } from "./contexts/AuthContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { ContentProvider } from "./contexts/ContentContext";
import { FontSizeProvider } from "./contexts/FontSizeContext";

import './index.css';

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <ContentProvider>
            <FontSizeProvider>
              <App />
            </FontSizeProvider>
          </ContentProvider>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);

// Register Service Worker
if ('serviceWorker' in navigator) {
  let refreshing = false;
  
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      console.log('New version of the app is available. Refreshing...');
      window.location.reload();
      refreshing = true;
    }
  });   

  window.addEventListener('load', () => {
     navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
        
        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          if (!installingWorker) return;

          installingWorker.onstatechange = () => {
            if (installingWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
              } else {
                console.log('Content is cached for offline use.');
              }
            }
          };
        };
      })
      .catch(error => {
        console.log('ServiceWorker registration failed: ', error);
      });
  });
}
