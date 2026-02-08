import React from 'react';
import { LayoutDashboard, Users, Building2, CalendarDays, Bell, Settings, Layers, LogOut } from 'lucide-react';

interface SidebarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView, isMobileOpen, setIsMobileOpen }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
    { id: 'users', label: 'Utilisateurs', icon: Users },
    { id: 'properties', label: 'Biens Immobiliers', icon: Building2 },
    { id: 'visits', label: 'Demandes de Visite', icon: CalendarDays },
    { id: 'statuses', label: 'Gestion des Statuts', icon: Layers }, // Renamed/New icon suggested? Layers is used for Config. Let's use something else or re-use Layers if Config is Types & Attributes.
    { id: 'alerts', label: 'Alertes Client', icon: Bell },
    { id: 'config', label: 'Types & Attributs', icon: Layers },
    { id: 'settings', label: 'Paramètres', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Overlay with Blur */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden transition-opacity duration-300"
          onClick={() => setIsMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-white shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:flex-shrink-0 lg:shadow-none
        `}
      >
        {/* Logo Area */}
        <div className="flex items-center justify-center h-16 shrink-0 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md">
          <h1 className="text-xl font-bold tracking-wider text-white">
            PROFESSIONNEL
          </h1>
        </div>

        {/* Scrollable Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto overflow-x-hidden custom-scrollbar">
          <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Menu Principal</p>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentView(item.id);
                  setIsMobileOpen(false);
                }}
                className={`
                  flex items-center w-full px-4 py-3 rounded-lg transition-all duration-200 group
                  ${isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/20'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
                `}
              >
                <Icon size={20} className={`mr-3 transition-colors ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-white'}`} />
                <span className="font-medium text-sm">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Fixed Footer Removed as per request */}
      </aside>
    </>
  );
};

export default Sidebar;