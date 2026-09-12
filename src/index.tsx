import React from 'react';
import ReactDOM from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import LandingPage from './components/LandingPage';
import SignupPage from './components/SignupPage';
import SigninPage from './components/SigninPage';

const container = document.getElementById('root');
if (!container) throw new Error('Root container missing in index.html');
const root = ReactDOM.createRoot(container);

const pathname = window.location.pathname;
const hash = window.location.hash;

const isSignupRoute = pathname === '/signup' || hash === '#/signup';
const isSigninRoute = pathname === '/signin' || hash === '#/signin';

root.render(
  <React.StrictMode>
    <HelmetProvider>{isSignupRoute ? <SignupPage /> : isSigninRoute ? <SigninPage /> : <LandingPage />}</HelmetProvider>
  </React.StrictMode>
);
