import React from 'react';
import ReactDOM from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';

const container = document.getElementById('root');
if (!container) throw new Error('Root container missing in index.html');
const root = ReactDOM.createRoot(container);

// Hide loading screen when React is ready
const hideLoader = () => {
  const loader = document.getElementById('tradespot-loader');
  if (loader) {
    loader.classList.add('hidden');
    setTimeout(() => {
      loader.remove();
    }, 300);
  }
};

const AppLoader = () => {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      hideLoader();
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return null;
};

root.render(
  <React.StrictMode>
    <AppLoader />
    <HelmetProvider />
  </React.StrictMode>
);
