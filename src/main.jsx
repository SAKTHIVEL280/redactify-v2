import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Register Sovereign Service Worker for Cold-Start Offline Execution
if (typeof window !== 'undefined' && 'serviceWorker' in navigator && import.meta.env?.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('[Redactify] Sovereign ServiceWorker registered:', reg.scope);
      })
      .catch((err) => {
        console.warn('[Redactify] ServiceWorker registration failed:', err);
      });
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
