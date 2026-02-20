import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle, XCircle, Clock, User as UserIcon } from 'lucide-react';
import { visitService } from '../../api/services';
import toast from 'react-hot-toast';

const VisitsView: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'rejected'>('all');
  const [visits, setVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVisits();
  }, [filter]);

  const fetchVisits = async () => {
    setLoading(true);
    try {
      const status = filter === 'all' ? undefined : filter;
      const data = await visitService.getVisitRequests(status);
      setVisits(data);
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors du chargement des visites");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (id: number) => {
    try {
      await visitService.confirmVisit(id);
      toast.success("Visite confirmée");
      fetchVisits(); // Refresh list
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la confirmation");
    }
  };

  const handleReject = async (id: number) => {
    const reason = window.prompt("Motif du rejet ?");
    if (!reason) return;

    try {
      await visitService.rejectVisit(id, reason);
      toast.success("Visite rejetée");
      fetchVisits();
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors du rejet");
    }
  };

  const handleCancel = async (id: number) => {
    if (!window.confirm("Voulez-vous vraiment annuler cette visite ? Le pass sera remboursé au client.")) return;
    try {
      await visitService.rejectVisit(id, "Annulation par l'administrateur");
      toast.success("Visite annulée avec succès");
      fetchVisits();
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de l'annulation");
    }
  };

  const handleComplete = async (id: number) => {
    if (!window.confirm("Confirmez-vous que cette visite a été effectuée ?")) return;
    try {
      await visitService.markAsCompleted(id);
      toast.success("Visite marquée comme effectuée");
      fetchVisits();
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la mise à jour");
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Chargement des visites...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Demandes de Visite</h2>
          <p className="text-slate-500">Suivi des rendez-vous entre clients et propriétaires.</p>
        </div>
      </div>

      {/* Kanban-like filters */}
      <div className="flex space-x-2 bg-white p-1 rounded-lg border border-slate-200 w-fit">
        {['all', 'pending', 'confirmed', 'accepted', 'completed', 'rejected'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status as any)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${filter === status
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
          >
            {status === 'all' ? 'Toutes' :
              status === 'pending' ? 'En Attente' :
                status === 'confirmed' ? 'Confirmées' :
                  status === 'accepted' ? 'Acceptées' :
                    status === 'completed' ? 'Effectuées' : 'Rejetées'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {visits.map((visit) => (
          <div key={visit.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-4">
            {/* Date Box */}
            <div className="flex flex-col items-center justify-center bg-slate-50 p-4 rounded-lg min-w-[80px] text-center border border-slate-100">
              <span className="text-slate-400 text-xs uppercase font-bold">
                {visit.requested_datetime ? new Date(visit.requested_datetime).toLocaleDateString('fr-FR', { month: 'short' }) : 'N/A'}
              </span>
              <span className="text-slate-800 text-2xl font-bold">
                {visit.requested_datetime ? new Date(visit.requested_datetime).getDate() : '?'}
              </span>
              <span className="text-slate-500 text-xs">
                {visit.requested_datetime ? new Date(visit.requested_datetime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''}
              </span>
            </div>

            {/* Content */}
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-slate-800">{visit.property_title || 'Titre inconnu'}</h4>
                  <p className="text-sm text-slate-500 flex items-center mt-1">
                    <UserIcon size={14} className="mr-1" />
                    Client: {visit.customer_name || 'Inconnu'}
                  </p>
                  {visit.referral && (
                    <p className="text-sm text-indigo-600 flex items-center mt-1 bg-indigo-50 w-fit px-2 py-0.5 rounded border border-indigo-100">
                      <UserIcon size={12} className="mr-1" />
                      Parrainé par: {visit.referral.agent_name} (Code: {visit.referral.code})
                    </p>
                  )}
                </div>
                {visit.status === 'pending' && <span className="flex items-center text-amber-500 bg-amber-50 px-2 py-1 rounded text-xs font-medium"><Clock size={12} className="mr-1" /> En attente</span>}
                {visit.status === 'confirmed' && <span className="flex items-center text-blue-600 bg-blue-50 px-2 py-1 rounded text-xs font-medium"><CheckCircle size={12} className="mr-1" /> Confirmé</span>}
                {visit.status === 'rejected' && <span className="flex items-center text-rose-500 bg-rose-50 px-2 py-1 rounded text-xs font-medium"><XCircle size={12} className="mr-1" /> Rejeté</span>}
                {visit.status === 'accepted' && <span className="flex items-center text-emerald-600 bg-emerald-50 px-2 py-1 rounded text-xs font-medium"><CheckCircle size={12} className="mr-1" /> Accepté</span>}
                {visit.status === 'completed' && <span className="flex items-center text-slate-600 bg-slate-100 px-2 py-1 rounded text-xs font-medium"><CheckCircle size={12} className="mr-1" /> Effectuée</span>}
              </div>

              {visit.message && (
                <div className="mt-3 bg-slate-50 p-3 rounded-lg text-sm text-slate-600 italic border border-slate-100">
                  "{visit.message}"
                </div>
              )}

              {visit.status === 'pending' && (
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => handleConfirm(visit.id)}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Accepter
                  </button>
                  <button
                    onClick={() => handleReject(visit.id)}
                    className="flex-1 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Refuser
                  </button>
                </div>
              )}

              {/* Actions pour les visites en cours (Confirmée ou Acceptée) */}
              {(visit.status === 'confirmed' || visit.status === 'accepted') && (
                <div className="mt-4 space-y-2">
                  {/* Seule une visite ACCEPTÉE peut être marquée comme effectuée */}
                  {visit.status === 'accepted' && (
                    <button
                      onClick={() => handleComplete(visit.id)}
                      className="w-full bg-slate-800 hover:bg-slate-900 text-white py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center"
                    >
                      <CheckCircle size={16} className="mr-2" />
                      Marquer comme effectuée
                    </button>
                  )}

                  {/* On peut ANNULER une visite confirmée ou acceptée */}
                  <button
                    onClick={() => handleCancel(visit.id)}
                    className="w-full bg-white hover:bg-red-50 text-red-600 border border-red-200 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center"
                  >
                    <XCircle size={16} className="mr-2" />
                    Annuler la visite
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {visits.length === 0 && (
          <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-400">
            <Calendar size={48} className="mb-4 opacity-20" />
            <p>Aucune demande de visite trouvée pour ce filtre.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VisitsView;