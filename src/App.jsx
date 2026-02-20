import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LicenseProvider, useLicense } from './contexts/LicenseContext';
import { ToastProvider } from './contexts/ToastContext';
import { Layout } from './components/Layout';
import LicensePage from './pages/LicensePage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ClientsPage from './pages/ClientsPage';
import LoansPage from './pages/LoansPage';
import SettingsPage from './pages/SettingsPage';

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm">A carregar...</p>
      </div>
    </div>
  );
}

function AppRoutes() {
  const { licenseStatus, loading: licenseLoading } = useLicense();
  const { user, loading: authLoading } = useAuth();

  if (licenseLoading || authLoading) return <LoadingScreen />;

  // No valid license → show license activation
  if (!licenseStatus?.valid) {
    return (
      <Routes>
        <Route path="*" element={<LicensePage />} />
      </Routes>
    );
  }

  // License valid but not logged in → show login
  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // Authenticated
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/clients" element={<ClientsPage />} />
        <Route path="/loans" element={<LoansPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <HashRouter>
      <ToastProvider>
        <LicenseProvider>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </LicenseProvider>
      </ToastProvider>
    </HashRouter>
  );
}
