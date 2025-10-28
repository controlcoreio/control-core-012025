
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { setupGlobal401Handler } from './utils/global401Handler';

console.log('[Main] Starting application...');

// Setup global 401 handler for NIST/FedRAMP/SOC2 compliance
setupGlobal401Handler();
console.log('[Main] Global 401 handler initialized');

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

console.log('[Main] Root element found, creating React root...');
const root = ReactDOM.createRoot(rootElement);

console.log('[Main] Rendering App component...');
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

console.log('[Main] App rendered successfully');
