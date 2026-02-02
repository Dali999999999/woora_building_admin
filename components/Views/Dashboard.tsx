import React, { useEffect, useState } from 'react';
import {
  Users, Building2, CalendarCheck, Banknote, TrendingUp, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, Legend
} from 'recharts';
import { dashboardService, transactionService } from '../../api/services';
import toast from 'react-hot-toast';

// Formatting helper for currency (FCFA)
const formatMoney = (amount: number) => {
  return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
};

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({
    total_users: 0,
    active_properties: 0,
    pending_visits: 0,
    total_revenue: 0,
    revenue_chart: [],
    user_growth_chart: []
  });
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, txsRes] = await Promise.all([
          dashboardService.getStats(),
          transactionService.getRecents()
        ]);
        setStats(statsRes);
        setTransactions(txsRes);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast.error('Erreur lors du chargement des données.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Data comes from stats now, but we prepare empty defaults if loading
  const revenueData = stats.revenue_chart || [];
  const userGrowthData = stats.user_growth_chart || [];

  const StatCard = ({ title, value, icon: Icon, color, trend }: any) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
        </div>
        <div className={`p-3 rounded-lg ${color} bg-opacity-10`}>
          <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center text-sm">
          {trend > 0 ? (
            <span className="text-emerald-500 flex items-center font-medium">
              <ArrowUpRight size={16} className="mr-1" /> +{trend}%
            </span>
          ) : (
            <span className="text-rose-500 flex items-center font-medium">
              <ArrowDownRight size={16} className="mr-1" /> {trend}%
            </span>
          )}
          <span className="text-slate-400 ml-2">vs mois dernier</span>
        </div>
      )}
    </div>
  );

  if (loading) {
    return <div className="flex justify-center items-center h-full text-slate-500">Chargement du tableau de bord...</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Tableau de bord</h2>
        <p className="text-slate-500">Vue d'ensemble de l'activité de la plateforme.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Utilisateurs" value={stats.total_users} icon={Users} color="bg-blue-500" />
        <StatCard title="Biens Actifs" value={stats.active_properties} icon={Building2} color="bg-indigo-500" />
        <StatCard title="Visites en Attente" value={stats.pending_visits} icon={CalendarCheck} color="bg-amber-500" />
        <StatCard title="Revenus Totaux" value={formatMoney(stats.total_revenue)} icon={Banknote} color="bg-emerald-500" />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold text-slate-800 flex items-center">
              <TrendingUp size={20} className="mr-2 text-indigo-500" />
              Évolution des Revenus
            </h3>
          </div>
          <div className="h-72 w-full min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={100}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                <RechartsTooltip
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* User Growth Chart (Placeholder) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="font-semibold text-slate-800 mb-6 flex items-center">
            <Users size={20} className="mr-2 text-blue-500" />
            Croissance Utilisateurs (Simulé)
          </h3>
          <div className="h-72 w-full min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={100}>
              <BarChart data={userGrowthData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Legend iconType="circle" />
                <Bar dataKey="clients" name="Clients" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="owners" name="Propriétaires" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800">Transactions Récentes</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-slate-500 text-sm border-b border-slate-50 bg-slate-50">
                <th className="px-6 py-4 font-medium">ID</th>
                <th className="px-6 py-4 font-medium">Description</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Montant</th>
                <th className="px-6 py-4 font-medium">Type</th>
              </tr>
            </thead>
            <tbody className="text-sm text-slate-700">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">Aucune transaction récente</td>
                </tr>
              ) : (
                transactions.map((t) => (
                  <tr key={t.id} className="border-b border-slate-50 last:border-none hover:bg-slate-50">
                    <td className="px-6 py-4 font-mono text-xs text-slate-400">#{t.id}</td>
                    <td className="px-6 py-4 font-medium">{t.description || 'N/A'}</td>
                    <td className="px-6 py-4">{t.date ? new Date(t.date).toLocaleDateString() : 'N/A'}</td>
                    <td className="px-6 py-4 font-semibold text-emerald-600">{formatMoney(t.amount)}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800`}>
                        {t.type}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;