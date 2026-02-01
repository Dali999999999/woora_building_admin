import React, { useState, useEffect } from 'react';
import { Bell, Mail, Check, Phone, User, MapPin, Tag, Calendar, ChevronRight } from 'lucide-react';
import { requestService } from '../../api/services';
import toast from 'react-hot-toast';

interface Customer {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  profile_image_url?: string;
}

interface Alert {
  id: number;
  request_details: string; // JSON string
  city: string;
  min_price: number;
  max_price: number;
  status: 'new' | 'contacted' | 'closed';
  created_at: string;
  archived_at: string | null;
  archived_by: number | null;
  customer: Customer | null;
  property_type_name: string;
}

const AlertsView: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'new' | 'contacted'>('all');
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    fetchAlerts();
  }, [showArchived]);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const data = await requestService.getAll(showArchived);
      setAlerts(data);
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors du chargement des alertes");
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async (id: number) => {
    if (!window.confirm("Êtes-vous sûr de vouloir archiver cette alerte ?")) return;

    try {
      await requestService.archive(id);
      toast.success("Alerte archivée avec succès");
      fetchAlerts();
    } catch (error: any) {
      console.error(error);
      const errorMessage = error?.response?.data?.message || "Erreur lors de l\'archivage";
      toast.error(errorMessage);
    }
  };

  const handleUnarchive = async (id: number) => {
    try {
      await requestService.unarchive(id);
      toast.success("Alerte restaurée avec succès");
      fetchAlerts();
    } catch (error: any) {
      console.error(error);
      const errorMessage = error?.response?.data?.message || "Erreur lors de la restauration";
      toast.error(errorMessage);
    }
  };

  const handleRespond = async (id: number) => {
    const message = window.prompt("Message de réponse au client :");
    if (!message) return;

    try {
      await requestService.respond(id, message);
      toast.success("Statut mis à jour");
      fetchAlerts();
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const filteredAlerts = alerts.filter(a => filter === 'all' || a.status === filter);

  // Parse details helper
  const renderDetails = (detailsJson: string) => {
    try {
      const details = JSON.parse(detailsJson);
      return (
        <div className="flex flex-wrap gap-2 mt-2">
          {Object.entries(details).map(([key, value]) => {
            if (key === 'city' || key === 'min_price' || key === 'max_price') return null;
            if (!value || value === 'Indifférent') return null;

            // Format Label
            const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

            return (
              <span key={key} className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                <span className="opacity-60 mr-1">{label}:</span> {String(value)}
              </span>
            );
          })}
        </div>
      );
    } catch (e) {
      return <span className="text-sm text-slate-400 italic">Détails non disponibles</span>;
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Alertes Clients</h2>
          <p className="text-slate-500">Demandes spécifiques et recherches enregistrées.</p>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
            className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
          />
          <span className="text-sm font-medium text-slate-700">Afficher archivées</span>
        </label>
      </div>

      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {(['all', 'new', 'contacted'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${filter === f
              ? 'bg-white text-indigo-600 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
              }`}
          >
            {f === 'all' ? 'Toutes' : f === 'new' ? 'Nouvelles' : 'Traitées'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredAlerts.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-2xl border border-dashed border-slate-300">
            <Bell className="mx-auto h-12 w-12 text-slate-300 mb-4" />
            <p className="text-slate-500 font-medium">Aucune alerte pour le moment.</p>
          </div>
        ) : filteredAlerts.map(alert => (
          <div key={alert.id} className={`bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow duration-200 group ${alert.archived_at ? 'opacity-60' : ''}`}>
            <div className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Status Strip */}
                <div className={`w-1.5 self-stretch rounded-full ${alert.archived_at ? 'bg-slate-400' : alert.status === 'new' ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>

                {/* Customer Info */}
                <div className="w-full md:w-64 shrink-0 flex flex-row md:flex-col gap-4 items-center md:items-start border-b md:border-b-0 md:border-r border-slate-100 pb-4 md:pb-0 md:pr-4">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-lg shrink-0 overflow-hidden">
                    {alert.customer?.profile_image_url ? (
                      <img src={alert.customer.profile_image_url} className="w-full h-full object-cover" alt="" />
                    ) : (
                      (alert.customer?.first_name?.[0] || 'C').toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-slate-800 truncate">
                      {alert.customer ? `${alert.customer.first_name} ${alert.customer.last_name}` : `Client #${alert.customer_id || '?'}`}
                    </h4>
                    {alert.customer && (
                      <div className="space-y-1 mt-1">
                        <div className="flex items-center text-xs text-slate-500">
                          <Mail size={12} className="mr-1.5" />
                          <span className="truncate">{alert.customer.email}</span>
                        </div>
                        {alert.customer.phone_number && (
                          <div className="flex items-center text-xs text-slate-500">
                            <Phone size={12} className="mr-1.5" />
                            <span>{alert.customer.phone_number}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Alert Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-indigo-50 text-indigo-700 uppercase tracking-wide">
                          {alert.property_type_name || 'Recherche'}
                        </span>
                        <span className="text-xs text-slate-400 flex items-center">
                          <Calendar size={12} className="mr-1" />
                          {new Date(alert.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <h3 className="text-lg font-bold text-slate-800">
                          Recherche à {alert.city || 'Toutes zones'}
                        </h3>
                      </div>
                    </div>
                    {alert.archived_at && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                        Archivée
                      </span>
                    )}
                    {alert.status === 'new' && !alert.archived_at && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 animate-pulse">
                        Nouvelle
                      </span>
                    )}
                  </div>

                  {/* Budget & Specs */}
                  <div className="flex flex-wrap gap-4 mb-4 text-sm text-slate-600">
                    <div className="flex items-center bg-slate-50 px-3 py-1.5 rounded-lg">
                      <Tag size={16} className="text-slate-400 mr-2" />
                      <span>Budget: </span>
                      <span className="font-semibold text-slate-900 ml-1">
                        {alert.min_price ? Number(alert.min_price).toLocaleString() : '0'}
                        {' - '}
                        {alert.max_price ? Number(alert.max_price).toLocaleString() : '∞'} FCFA
                      </span>
                    </div>
                  </div>

                  {/* Dynamic Attributes */}
                  <div>
                    {renderDetails(alert.request_details)}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex md:flex-col justify-end gap-2 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-4">
                  {alert.archived_at ? (
                    // Alerte archivée - Bouton Restaurer
                    <button
                      onClick={() => handleUnarchive(alert.id)}
                      className="flex items-center justify-center px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors shadow-sm whitespace-nowrap"
                    >
                      <ChevronRight size={16} className="mr-2 rotate-180" />
                      Restaurer
                    </button>
                  ) : (
                    // Alerte active
                    <>
                      <button
                        onClick={() => handleRespond(alert.id)}
                        className="flex items-center justify-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm whitespace-nowrap"
                      >
                        <Mail size={16} className="mr-2" />
                        Contacter
                      </button>
                      {(alert.status === 'contacted' || alert.status === 'closed') && (
                        <button
                          onClick={() => handleArchive(alert.id)}
                          className="flex items-center justify-center px-4 py-2 bg-slate-600 text-white text-sm font-medium rounded-lg hover:bg-slate-700 transition-colors shadow-sm whitespace-nowrap"
                        >
                          Archiver
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AlertsView;