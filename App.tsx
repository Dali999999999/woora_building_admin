import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Layout/Sidebar';
import Dashboard from './components/Views/Dashboard';
import UsersView from './components/Views/Users';
import PropertiesView from './components/Views/Properties';
import VisitsView from './components/Views/Visits';
import AlertsView from './components/Views/Alerts';
import ConfigView from './components/Views/Config';
import PropertyStatusesView from './components/Views/PropertyStatuses';
import SettingsView from './components/Views/Settings';
import { Menu, Bell } from 'lucide-react';
import Login from './pages/Login';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';

const ProtectedLayout: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard': return <Dashboard />;
      case 'users': return <UsersView />;
      case 'properties': return <PropertiesView />;
      case 'visits': return <VisitsView />;
      case 'alerts': return <AlertsView />;
      case 'statuses': return <PropertyStatusesView />; // Added route
      case 'config': return <ConfigView />;
      case 'settings': return <SettingsView />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 font-sans overflow-hidden">
      <Sidebar
        currentView={currentView}
        setCurrentView={setCurrentView}
        isMobileOpen={isMobileMenuOpen}
        setIsMobileOpen={setIsMobileMenuOpen}
      />

      <div className="flex-1 flex flex-col min-w-0 h-full transition-all duration-300 relative">
        <header className="bg-white border-b border-slate-200 h-16 shrink-0 flex items-center justify-between px-4 lg:px-8 z-10 shadow-sm">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-md"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu size={24} />
            </button>
            <div className="hidden sm:block font-medium text-slate-400 text-sm">
              Administration &gt; <span className="text-slate-800 capitalize font-semibold">{currentView}</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button className="relative p-2 text-slate-400 hover:text-indigo-600 transition-colors">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border border-white"></span>
            </button>

            <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
              <div className="text-right hidden md:block">
                <p className="text-sm font-semibold text-slate-700">{user?.first_name || 'Admin'} {user?.last_name || 'User'}</p>
                <p className="text-xs text-slate-400">{user?.role || 'Super Admin'}</p>
              </div>
              <div className="h-9 w-9 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold text-sm border border-indigo-200 shadow-sm">
                {user?.first_name?.charAt(0) || 'A'}
              </div>
              <button onClick={logout} className="ml-2 text-xs text-red-600 hover:underline">Déconnexion</button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8 scroll-smooth">
          <div className="max-w-7xl mx-auto pb-10">
            {renderView()}
          </div>
        </main>
      </div>
    </div>
  );
};

const AppRoutes: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <div className="h-screen flex items-center justify-center">Chargement...</div>;

  return (
    <Routes>
      <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" replace />} />
      <Route path="/*" element={<ProtectedLayout />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;