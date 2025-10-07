import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App.jsx';

// Aplicar tema oscuro guardado antes del render
const savedDark = localStorage.getItem('cardtrack-darkmode') === 'true';
if (savedDark) {
  document.documentElement.classList.add('theme-dark');
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
