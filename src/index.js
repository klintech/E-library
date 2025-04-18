import React from 'react';
import { createRoot } from 'react-dom/client'; // Use createRoot for React 19
import './index.css';
import App from './App';
import { AuthProvider } from './context/AuthContext';

const container = document.getElementById('root');
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);