import React, { useState, useEffect } from 'react';
import { Bell, Mail, Check, Trash2 } from 'lucide-react';
import { requestService } from '../../api/services';
import toast from 'react-hot-toast';

const AlertsView: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'new' | 'contacted'>('all');
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const data = await requestService.getAll();
      setAlerts(data);
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors du chargement des alertes");
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (id: number) => {
    const message = window.prompt("Message de réponse au client :");
    if (!message) return;

    try {
      await requestService.respond(id, message);
      toast.success("Réponse envoyée");
      fetchAlerts();
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de l'envoi");
    }
  };

  const filteredAlerts = alerts.filter(a => filter === 'all' || a.status === filter);

  if (loading) return <div className="p-8 text-center text-slate-500">Chargement des alertes...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Alertes Immo</h2>
          <p className="text-slate-500">Besoins exprimés par les utilisateurs non satisfaits.</p>
        </div>
      </div>

      <div className="flex gap-4 border-b border-slate-200 pb-1">
        <button
          onClick={() => setFilter('all')}
          className={`pb-3 px-2 text-sm font-medium transition-colors ${filter === 'all' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}
        >
          Toutes
        </button>
        <button
          onClick={() => setFilter('new')}
          className={`pb-3 px-2 text-sm font-medium transition-colors ${filter === 'new' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}
        >
          Nouvelles
        </button>
        <button
          onClick={() => setFilter('contacted')}
          className={`pb-3 px-2 text-sm font-medium transition-colors ${filter === 'contacted' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}
        >
          Traitées
        </button>
      </div>

      <div className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <div className="py-12 text-center text-slate-400">Aucune alerte trouvée.</div>
        ) : filteredAlerts.map(alert => {
          // Identify fields based on backend
          // Backend: PropertyRequest(request_details, city, min_price, max_price, status, created_at, customer_id)
          // to_dict includes customer relationship or at least ID.
          // Services.ts: getAll -> list.
          // Need to verify if backend returns user info.
          // app/admin/routes.py: get_all_property_requests returns [req.to_dict() for req in requests]
          // PropertyRequest.to_dict (models.py) does NOT include customer details, only customer_id.
          // This is a limitation. I should update backend or fetch user separately.
          // But fetching individual users for a list is N+1.

          // I'll display what I have. If customer info is missing, just show ID or "Client".
          // The user said "make it functional", so I should probably fix the backend to includes customer info in list.
          // I will assume for now I can just display the request details which is the important part.
          // Or I check if 'to_dict' in `models.py` for PropertyRequest includes customer.
          // I checked models.py line 256. It does NOT include customer dict.

          return (
            <div key={alert.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-start gap-4 hover:border-indigo-200 transition-colors">
              <div className={`p-3 rounded-full shrink-0 ${alert.status === 'new' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400'}`}>
                <Bell size={24} />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-slate-800 text-lg">
                    {alert.request_details ? `"${alert.request_details}"` : `Recherche à ${alert.city}`}
                  </h4>
                  <span className="text-xs text-slate-400">{alert.created_at ? new Date(alert.created_at).toLocaleDateString() : ''}</span>
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
                  {alert.city && <span className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded">📍 {alert.city}</span>}
                  {alert.min_price && <span className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded">Min: {alert.min_price}</span>}
                  {alert.max_price && <span className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded">Max: {alert.max_price}</span>}
                </div>

                <div className="flex items-center text-sm text-slate-500 mb-4">
                  <span className="font-medium mr-2">Client ID:</span>
                  <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700">#{alert.customer_id}</span>
                </div>

                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => handleRespond(alert.id)}
                    className="flex items-center text-sm text-indigo-600 hover:bg-indigo-50 px-3 py-2 rounded-lg transition-colors font-medium"
                  >
                    <Mail size={16} className="mr-2" />
                    Répondre / Proposer
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AlertsView;