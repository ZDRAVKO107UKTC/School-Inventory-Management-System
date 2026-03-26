import React, { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import OAuthCallbackPage from '@/pages/OAuthCallbackPage';
import AuthPage from '@/pages/AuthPage';
import DashboardPage from '@/pages/DashboardPage';
import { ResetPasswordPage } from '@/pages/ResetPasswordPage';
import { useAuthStore } from '@/stores/authStore';


const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  return <>{children}</>;
};

const App: React.FC = () => {
  const hydrateSession = useAuthStore((state) => state.hydrateSession);

  useEffect(() => {
    hydrateSession();
  }, [hydrateSession]);

  return (
    <Routes>
      <Route path="/auth" element={<AuthPage defaultMode="login" />} />
      <Route path="/auth/callback/google" element={<OAuthCallbackPage provider="google" />} />
      <Route path="/auth/callback/telegram" element={<OAuthCallbackPage provider="telegram" />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      {/* Redirect old admin-specific routes to the unified dashboard */}
      <Route path="/admin/login" element={<Navigate to="/auth" replace />} />
      <Route path="/admin/dashboard" element={<Navigate to="/dashboard" replace />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/auth" replace />} />
    </Routes>
  );
};

export default App;
