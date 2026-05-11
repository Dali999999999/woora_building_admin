import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle, XCircle, Clock, User as UserIcon, AlertCircle } from 'lucide-react';
import { visitService } from '../../api/services';
import toast from 'react-hot-toast';

const VisitsView: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'owner_accepted' | 'accepted' | 'completed' | 'rejected'>('all');
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
      setVisits(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors du chargement des visites");
      setVisits([]);
    } finally {
      setLoading(false);
    }
  };

  // L'admin ne peut confirmer que si le propriétaire a déjà accepté (owner_accepted)
  const handleConfirm = async (id: number) => {
    if (!window.confirm("Confirmer définitivement cette visite ? Le client sera notifié.")) return;
    try {
      await visitService.confirmVisit(id);
      toast.success("Visite confirmée ! Le client a été notifié.");
      fetchVisits();
    } catch (error: any) {
      console.error(error);
      const msg = error?.response?.data?.error || "Erreur lors de la confirmation";
      toast.error(msg);
    }
  };

  const handleReject = async (id: number) => {
    const reason = window.prompt("Motif du refus (sera communiqué au client) :");
    if (!reason) return;
    try {
      await visitService.rejectVisit(id, reason);
      toast.success("Visite rejetée. Le processus s'arrête.");
      fetchVisits();
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors du refus");
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
      toast.success("Visite marquée comme effectuée. Pass déduit.");
      fetchVisits();
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const filterTabs = [
    { key: 'all', label: 'Toutes' },
    { key: 'pending', label: 'En attente' },
    { key: 'owner_accepted', label: 'Confirmées' },
    { key: 'accepted', label: 'Acceptées' },
    { key: 'completed', label: 'Effectuées' },
    { key: 'rejected', label: 'Rejetées' },
  ];

  if (loading) return <div className="p-8 text-center text-slate-500">Chargement des visites...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Demandes de Visite</h2>
          <p className="text-slate-500">Suivi du flux de validation : Propriétaire → Admin → Client.</p>
        </div>
      </div>

      {/* Bandeau explicatif du flux */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700 flex items-start gap-3">
        <AlertCircle size={18} className="mt-0.5 shrink-0" />
        <div>
          <strong>Parcours de validation :</strong> 
          <ol className="list-decimal ml-4 mt-1 space-y-1">
            <li><strong>En attente :</strong> Demande lancée par le client.</li>
            <li><strong>Confirmée :</strong> Acceptée par le propriétaire ou l'agent.</li>
            <li><strong>Acceptée :</strong> Validée définitivement par l'administrateur.</li>
            <li><strong>Effectuée :</strong> Visite réalisée (<strong>le pass est déduit à cette étape</strong>).</li>
          </ol>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-2 bg-white p-1 rounded-lg border border-slate-200 w-fit">
        {filterTabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key as any)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              filter === key
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {visits.map((visit) => (
          <div key={visit.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-4">
            {/* Date Box */}
            <div className="flex flex-col items-center justify-center bg-slate-50 p-4 rounded-lg min-w-[80px] text-center border border-slate-100">
              <span className="text-slate-400 text-xs uppercase font-bold">
                {visit.requested_datetime
                  ? new Date(visit.requested_datetime).toLocaleDateString('fr-FR', { month: 'short' })
                  : 'N/A'}
              </span>
              <span className="text-slate-800 text-2xl font-bold">
                {visit.requested_datetime ? new Date(visit.requested_datetime).getDate() : '?'}
              </span>
              <span className="text-slate-500 text-xs">
                {visit.requested_datetime
                  ? new Date(visit.requested_datetime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
                  : ''}
              </span>
            </div>

            {/* Contenu */}
            <div className="flex-1">
              <div className="flex justify-between items-start flex-wrap gap-2">
                <div>
                  <h4 className="font-bold text-slate-800">{visit.property_title || 'Titre inconnu'}</h4>
                  <p className="text-sm text-slate-500 flex items-center mt-1">
                    <UserIcon size={14} className="mr-1" />
                    Client : <span className="font-medium text-slate-700 ml-1">{visit.customer_name || 'Inconnu'}</span> 
                    <span className="ml-2 text-indigo-600 font-medium">({visit.customer_phone})</span>
                  </p>

                  <div className="mt-2 pt-2 border-t border-slate-100">
                    <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Contact Propriétaire / Agent</p>
                    <p className="text-sm text-slate-600 flex items-center">
                      <span className="font-medium">{visit.agent_contact ? visit.agent_contact.name : visit.owner_name}</span>
                      <span className="ml-2 text-emerald-600 font-medium">({visit.agent_contact ? visit.agent_contact.phone : visit.owner_phone})</span>
                      {visit.agent_contact && <span className="ml-2 text-[10px] bg-slate-100 px-1 rounded text-slate-500">Agent</span>}
                    </p>
                  </div>

                  {visit.referral && (
                    <p className="text-sm text-indigo-600 flex items-center mt-1 bg-indigo-50 w-fit px-2 py-0.5 rounded border border-indigo-100">
                      <UserIcon size={12} className="mr-1" />
                      Parrainé par : {visit.referral.agent_name} (Code : {visit.referral.code})
                    </p>
                  )}
                </div>

                {/* Badges statut */}
                {visit.status === 'pending' && (
                  <span className="flex items-center text-amber-600 bg-amber-50 border border-amber-200 px-2 py-1 rounded text-xs font-medium">
                    <Clock size={12} className="mr-1" /> En attente
                  </span>
                )}
                {visit.status === 'owner_accepted' && (
                  <span className="flex items-center text-blue-700 bg-blue-50 border border-blue-200 px-2 py-1 rounded text-xs font-medium">
                    <CheckCircle size={12} className="mr-1" /> Confirmée (Proprio OK)
                  </span>
                )}
                {visit.status === 'accepted' && (
                  <span className="flex items-center text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded text-xs font-medium">
                    <CheckCircle size={12} className="mr-1" /> Acceptée ✓
                  </span>
                )}
                {visit.status === 'rejected' && (
                  <span className="flex items-center text-rose-500 bg-rose-50 border border-rose-200 px-2 py-1 rounded text-xs font-medium">
                    <XCircle size={12} className="mr-1" /> Rejetée
                  </span>
                )}
                {visit.status === 'completed' && (
                  <span className="flex items-center text-slate-600 bg-slate-100 border border-slate-200 px-2 py-1 rounded text-xs font-medium">
                    <CheckCircle size={12} className="mr-1" /> Effectuée
                  </span>
                )}
              </div>

              {visit.message && (
                <div className="mt-3 bg-slate-50 p-3 rounded-lg text-sm text-slate-600 italic border border-slate-100">
                  "{visit.message}"
                </div>
              )}

              {/* ── ACTIONS SELON STATUT ── */}

              {/* PENDING : proprio n'a pas encore traité → admin peut seulement forcer un refus */}
              {visit.status === 'pending' && (
                <div className="mt-4">
                  <p className="text-xs text-amber-600 mb-2 italic">
                    ⏳ En attente de la décision du propriétaire…
                  </p>
                  <button
                    onClick={() => handleReject(visit.id)}
                    className="w-full bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Refuser (admin)
                  </button>
                </div>
              )}

              {/* OWNER_ACCEPTED : proprio a accepté → l'admin peut Valider ou Refuser */}
              {visit.status === 'owner_accepted' && (
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => handleConfirm(visit.id)}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1"
                  >
                    <CheckCircle size={15} /> Valider définitivement
                  </button>
                  <button
                    onClick={() => handleReject(visit.id)}
                    className="flex-1 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Refuser
                  </button>
                </div>
              )}

              {/* ACCEPTED : confirmée → marquer effectuée ou annuler */}
              {visit.status === 'accepted' && (
                <div className="mt-4 space-y-2">
                  <button
                    onClick={() => handleComplete(visit.id)}
                    className="w-full bg-slate-800 hover:bg-slate-900 text-white py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center"
                  >
                    <CheckCircle size={16} className="mr-2" />
                    Marquer comme effectuée
                  </button>
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