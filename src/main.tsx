import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import WebApp from '@twa-dev/sdk';
import App from './App.tsx';
import './index.css';

WebApp.ready(); // Initialize Telegram WebApp

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
