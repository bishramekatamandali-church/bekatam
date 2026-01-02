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
/*if ('serviceWorker' in navigator) {
  // Flag to avoid an infinite refresh loop
  let refreshing = false;
  
  // Listen for the controller change event. This fires when the service worker controlling this page changes.
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      console.log('New version of the app is available. Refreshing...');
      window.location.reload();
      refreshing = true;
    }
  });   

  window.addEventListener('load', () => {
    // FIX: Corrected service worker path. '/public/sw.js' is incorrect if 'public' is the root directory.
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
        
        // This logic helps accelerate the update process by checking for a new SW on page load.
        // The sw.js file's skipWaiting() and clients.claim() will handle the activation.
        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          if (installingWorker) {
            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  // At this point, the old content is still being served.
                  // A new service worker is waiting to be activated.
                  // Our skipWaiting() in sw.js will trigger the 'controllerchange' event.
                  console.log('New service worker installed. The page will reload automatically.');
                } else {
                  // At this point, everything has been precached.
                  // It will be served from the cache on the next load.
                  console.log('Content is cached for offline use.');
                }
              }
            };
          }
        };
      })
      .catch(error => {
        console.log('ServiceWorker registration failed: ', error);
      });
  });
}*/