/**
 * Application Entry Point
 * React + Providers Setup
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import AuthPage from '@/pages/AuthPage';
import '@/styles/globals.css';

// Placeholder: will be configured with full app router
// Currently just renders the auth page for design verification

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      {/* Placeholder: Add ThemeProvider, AuthProvider, Router */}
      <AuthPage defaultMode="login" />
    </QueryClientProvider>
  </React.StrictMode>
);
