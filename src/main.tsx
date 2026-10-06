import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './authentication/AuthContext.tsx';
import './utils/apiAuth';

console.info('[APP_START] Application bundle initializing at', new Date().toISOString());

// Actively unregister any stale service workers to prevent unexpected background reloads
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      console.info('[SERVICE_WORKER_UPDATE] Deregistering cached service worker:', registration.scope);
      registration.unregister();
    }
  }).catch(() => {});
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
);
