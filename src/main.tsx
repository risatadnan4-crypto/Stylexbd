import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';
import './index.css';

// Resilience against unhandled cross-origin scripts or chrome/platform extension crashes
if (typeof window !== "undefined") {
  window.addEventListener("error", (event) => {
    // If it's a cross-origin Script error, log it harmlessly
    if (event.message === "Script error." || !event.filename) {
      console.warn("Recovered from unmanaged third-party script/extension exception:", event);
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);

  window.addEventListener("unhandledrejection", (event) => {
    console.warn("Recovered from unhandled rejection:", event.reason);
    event.preventDefault();
    event.stopPropagation();
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

