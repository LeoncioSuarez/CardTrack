import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App.jsx';
import { FlashProvider } from './context/FlashProvider.jsx';

const savedDark = localStorage.getItem('cardtrack-darkmode') === 'true';
if (savedDark) {
  document.documentElement.classList.add('theme-dark');
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <FlashProvider>
        <App />
      </FlashProvider>
    </BrowserRouter>
  </StrictMode>
);
