import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Filter out TensorFlow Lite info logs
const originalConsoleInfo = console.info;
console.info = (...args) => {
  if (args[0] && typeof args[0] === 'string' && args[0].includes('TensorFlow Lite')) {
    return;
  }
  originalConsoleInfo(...args);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
