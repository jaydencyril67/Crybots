import React from 'react';
import ReactDOM from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import LandingPage from './components/LandingPage';
import SignupPage from './components/SignupPage';

const container = document.getElementById('root');
if (!container) throw new Error('Root container missing in index.html');
const root = ReactDOM.createRoot(container);

const isSignupRoute = window.location.pathname === '/signup' || window.location.hash === '#/signup';

root.render(
  <React.StrictMode>
    <HelmetProvider>{isSignupRoute ? <SignupPage /> : <LandingPage />}</HelmetProvider>
  </React.StrictMode>
);
