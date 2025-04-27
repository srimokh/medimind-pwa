import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';  // <-- ADD THIS

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
git remote add origin https://github.com/srimokh/medimind-pwa.git
// Register service worker for PWA functionality
serviceWorkerRegistration.register();  // <-- ADD THIS

reportWebVitals();
