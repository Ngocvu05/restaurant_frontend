import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import AppRouter from './routes/Router';
import { LoadingProvider } from './context/LoadingContext';
import GlobalSpinner from './components/GlobalSpinner';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CartProvider } from './context/CartContext';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

import './assets/css/bootstrap.min.css';
import './assets/css/flex-slider.css';
import './assets/css/font-awesome.css';
import './assets/css/templatemo-klassy-cafe.css';
import './assets/css/lightbox.css';

const queryClient = new QueryClient();

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <LoadingProvider>
          <CartProvider>
            {/* Áp dụng sticky footer cho toàn bộ app */}
            <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
              <div style={{ flex: '1 1 auto' }}>
                <AppRouter />
              </div>
            </div>
          </CartProvider>         
          <GlobalSpinner />
        </LoadingProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;