import React, { useState, useEffect } from 'react';
import { Search, MapPin, Edit, Trash2, Eye, Filter, CheckCircle, AlertCircle, Ban } from 'lucide-react';
import { propertyService, configService } from '../../api/services';
import { Property, PropertyType } from '../../types';
import toast from 'react-hot-toast';
import PropertyDetailsModal from '../Modals/PropertyDetailsModal';
import ReasonModal from '../Modals/ReasonModal';

const PropertiesView: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [propertyTypes, setPropertyTypes] = useState<PropertyType[]>([]);
  const [propertyStatuses, setPropertyStatuses] = useState<{ value: string, label: string }[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Tabs
  const [activeTab, setActiveTab] = useState<'all' | 'pending'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [ownerFilter, setOwnerFilter] = useState('all');
  const [agentFilter, setAgentFilter] = useState('all');

  // Modal State
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [initialEditMode, setInitialEditMode] = useState(false);

  // Invalidation State
  const [propertyToInvalidate, setPropertyToInvalidate] = useState<Property | null>(null);
  const [isReasonModalOpen, setIsReasonModalOpen] = useState(false);

  // Delete State
  const [propertyToDelete, setPropertyToDelete] = useState<Property | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [props, types, statuses] = await Promise.all([
        propertyService.getProperties(),
        configService.getPropertyTypesWithAttributes(),
        configService.getPropertyStatuses()
      ]);
      setProperties(props);
      setPropertyTypes(types);
      setPropertyStatuses(statuses);
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors du chargement des biens");
    } finally {
      setLoading(false);
    }
  };

  // Derived state
  const pendingCount = properties.filter(p => !p.is_validated).length;

  const filteredProperties = properties.filter(p => {
    // Tab Filter
    if (activeTab === 'pending' && p.is_validated) return false;

    // Helper to get status ID and String safe for filtering and searching
    const statusId = p.status_id || (p.status && typeof p.status === 'object' ? (p.status as any).id : null);
    const statusName = p.status && typeof p.status === 'object' && (p.status as any).name
      ? (p.status as any).name
      : (typeof p.status === 'string' ? p.status : '');

    // Search
    const location = `${p.attributes?.address || ''} ${p.attributes?.city || ''}`.toLowerCase();
    const title = (p.attributes?.title || p.attributes?.titre || '').toLowerCase();
    const statusSearch = statusName.toLowerCase();

    // Fallback title to status if title missing is weird but keeping legacy logic intent
    const titleMatch = (title || statusSearch).includes(searchTerm.toLowerCase());
    const matchesSearch = titleMatch || location.includes(searchTerm.toLowerCase()) || statusSearch.includes(searchTerm.toLowerCase());

    // Type Filter
    const typeId = p.type?.id;
    const pTypeId = (p as any).property_type_id || p.type?.id;
    const matchesType = typeFilter === 'all' || (pTypeId && pTypeId.toString() === typeFilter);

    // Status Filter
    // Status filter values are names (e.g., "À Vendre") or legacy codes ("for_sale")
    const matchesStatus = statusFilter === 'all' || String(statusId) === String(statusFilter);

    // Owner Filter
    const ownerDetails = (p as any).owner_details;
    const matchesOwner = ownerFilter === 'all' || (ownerDetails?.id && ownerDetails.id.toString() === ownerFilter);

    // Agent Filter
    const agentDetails = (p as any).created_by_agent;
    const matchesAgent = agentFilter === 'all' || (agentDetails?.agent_id && agentDetails.agent_id.toString() === agentFilter);

    return matchesSearch && matchesType && matchesStatus && matchesOwner && matchesAgent;
  });

  const handleValidate = async (id: number) => {
    const promise = propertyService.validateProperty(id);

    toast.promise(promise, {
      loading: 'Validation en cours...',
      success: 'Bien validé et publié ! 🚀',
      error: 'Erreur lors de la validation',
    });

    try {
      await promise;
      // Refresh local state
      setProperties(props => props.map(p =>
        p.id === id ? { ...p, is_validated: true } : p
      ));

      if (selectedProperty?.id === id) {
        setSelectedProperty(prev => prev ? { ...prev, is_validated: true } : null);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const triggerInvalidation = (property: Property) => {
    setPropertyToInvalidate(property);
    setIsReasonModalOpen(true);
  };

  const confirmInvalidation = async (reason: string) => {
    if (!propertyToInvalidate) return;

    const promise = propertyService.invalidateProperty(propertyToInvalidate.id, reason);

    toast.promise(promise, {
      loading: 'Suspension en cours...',
      success: 'Bien retiré de la publication.',
      error: 'Erreur lors de la suspension'
    });

    try {
      await promise;
      setProperties(props => props.map(p =>
        p.id === propertyToInvalidate.id ? { ...p, is_validated: false } : p
      ));

      if (selectedProperty?.id === propertyToInvalidate.id) {
        setSelectedProperty(prev => prev ? { ...prev, is_validated: false } : null);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const triggerDelete = (property: Property) => {
    setPropertyToDelete(property);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async (reason: string) => {
    if (!propertyToDelete) return;

    const promise = propertyService.deleteProperty(propertyToDelete.id, reason);

    toast.promise(promise, {
      loading: 'Suppression en cours...',
      success: 'Bien supprimé definitivement. (Soft Delete)',
      error: 'Erreur lors de la suppression'
    });

    try {
      await promise;
      setProperties(props => props.filter(p => p.id !== propertyToDelete.id)); // Remove from list
      setIsDeleteModalOpen(false);
      setIsDetailModalOpen(false); // Close details if open
    } catch (error) {
      console.error(error);
    }
  };


  const openDetails = (property: Property, editMode = false) => {
    setSelectedProperty(property);
    setInitialEditMode(editMode);
    setIsDetailModalOpen(true);
  };

  const handlePropertyUpdate = (updatedProperty: Property) => {
    setProperties(props => props.map(p =>
      p.id === updatedProperty.id ? updatedProperty : p
    ));
    if (selectedProperty?.id === updatedProperty.id) {
      setSelectedProperty(updatedProperty);
    }
  };


  const getStatusBadge = (property: any) => {
    if (!property.is_validated) {
      return <span className="px-2 py-1 rounded bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold flex items-center gap-1"><AlertCircle size={10} /> En attente</span>;
    }

    // Check if status is the new object format { id, name, color }
    // The backend now returns the status object in the 'status' field
    const statusObj = property.status && typeof property.status === 'object' ? property.status : property.property_status;

    if (statusObj && statusObj.name) {
      return (
        <span
          className="px-2 py-1 rounded text-xs font-bold text-white shadow-sm"
          style={{
            backgroundColor: statusObj.color,
          }}
        >
          {statusObj.name}
        </span>
      );
    }

    // FALLBACK for legacy string status
    const statusString = typeof property.status === 'string' ? property.status : 'Inconnu';

    switch (statusString) {
      case 'for_sale': return <span className="px-2 py-1 rounded bg-emerald-600 text-white text-xs font-bold shadow-sm">À Vendre</span>;
      case 'for_rent': return <span className="px-2 py-1 rounded bg-blue-600 text-white text-xs font-bold shadow-sm">À Louer</span>;
      case 'sold': return <span className="px-2 py-1 rounded bg-slate-600 text-white text-xs font-bold shadow-sm">Vendu</span>;
      case 'rented': return <span className="px-2 py-1 rounded bg-indigo-600 text-white text-xs font-bold shadow-sm">Loué</span>;
      default: return <span className="px-2 py-1 rounded bg-gray-600 text-white text-xs font-bold shadow-sm">{statusString}</span>;
    }
  };

  const formatPrice = (price: any) => {
    if (!price) return 'N/A';
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(Number(price));
  };

  if (loading) return <div className="p-12 text-center text-slate-500 font-medium animate-pulse">Chargement des données...</div>;

  return (
    <div className="space-y-8">

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Gestion des Biens</h2>
          <p className="text-slate-500">Supervisez le catalogue et validez les nouvelles annonces.</p>
        </div>
        <button
          onClick={() => toast('Utilisez l\'application mobile pour ajouter des biens', { icon: '📱' })}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-indigo-200 shadow-md transition-all flex items-center gap-2"
        >
          + Nouveau Bien
        </button>
      </div>

      {/* Modern Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 border-b border-slate-200 pb-1">
        <button
          onClick={() => setActiveTab('pending')}
          className={`pb-3 px-2 text-sm font-bold flex items-center gap-2 transition-all relative ${activeTab === 'pending' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          En Attente de Validation
          {pendingCount > 0 && (
            <span className="bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded-full font-extrabold shadow-sm animate-pulse-slow">
              {pendingCount}
            </span>
          )}
          {activeTab === 'pending' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full" />}
        </button>

        <button
          onClick={() => setActiveTab('all')}
          className={`pb-3 px-2 text-sm font-bold flex items-center gap-2 transition-all relative ${activeTab === 'all' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Tous les Biens
          <span className="bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded-full font-bold">
            {properties.length}
          </span>
          {activeTab === 'all' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full" />}
        </button>
      </div>


      {/* Search & Filters Toolbar */}
      <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Rechercher un bien, une ville..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-transparent focus:bg-white focus:border-indigo-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-100 text-sm transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <div className="relative min-w-[160px]">
            <select
              className="w-full appearance-none bg-slate-50 border-transparent px-4 py-2.5 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">Tous types</option>
              {propertyTypes.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <Filter size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
          <div className="relative min-w-[140px]">
            <select
              className="w-full appearance-none bg-slate-50 border-transparent px-4 py-2.5 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Tous statuts</option>
              {propertyStatuses.map((status: any) => (
                <option key={status.id} value={status.id}>{status.name || status.label}</option>
              ))}
            </select>
            <Filter size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
          <div className="relative min-w-[160px]">
            <select
              className="w-full appearance-none bg-slate-50 border-transparent px-4 py-2.5 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              value={ownerFilter}
              onChange={(e) => setOwnerFilter(e.target.value)}
            >
              <option value="all">Tous propriétaires</option>
              {Array.from(
                new Map(
                  properties
                    .map(p => (p as any).owner_details)
                    .filter(Boolean)
                    .map(owner => [owner.id, owner])  // [id, owner object]
                ).values()
              ).map((owner: any) => (
                <option key={owner.id} value={owner.id}>
                  {owner.first_name} {owner.last_name} ({owner.email})
                </option>
              ))}
            </select>
            <Filter size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
          <div className="relative min-w-[160px]">
            <select
              className="w-full appearance-none bg-slate-50 border-transparent px-4 py-2.5 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              value={agentFilter}
              onChange={(e) => setAgentFilter(e.target.value)}
            >
              <option value="all">Tous agents</option>
              {Array.from(
                new Map(
                  properties
                    .map(p => (p as any).created_by_agent)
                    .filter(Boolean)
                    .map(agent => [agent.agent_id, agent])  // [agent_id, agent object]
                ).values()
              ).map((agent: any) => (
                <option key={agent.agent_id} value={agent.agent_id}>
                  {agent.agent_name} ({agent.agent_email})
                </option>
              ))}
            </select>
            <Filter size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Properties Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredProperties.map(property => {
          const p = property as any;
          const title = p.title || p.attributes?.title || 'Bien sans titre';
          const price = p.price || p.attributes?.price;
          const location = p.city || p.attributes?.city || p.address || 'Localisation inconnue';
          const imageUrl = (p.image_urls && p.image_urls.length > 0) ? p.image_urls[0] : 'https://via.placeholder.com/400x300?text=No+Image';

          return (
            <div key={property.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group flex flex-col h-full">
              {/* Image & Overlay */}
              <div className="relative h-52 overflow-hidden bg-slate-100">
                <img src={imageUrl} alt={title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute top-3 left-3 flex gap-2">
                  {getStatusBadge(p)}
                </div>

                {/* Overlay Action */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                  <button
                    onClick={() => openDetails(property)}
                    className="bg-white text-slate-900 px-5 py-2 rounded-full font-bold text-sm transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 shadow-xl flex items-center gap-2"
                  >
                    <Eye size={16} /> Voir Détails
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-slate-800 text-lg leading-tight line-clamp-1" title={title}>{title}</h3>
                </div>

                <p className="text-xl font-extrabold text-indigo-600 mb-4">{formatPrice(price)}</p>

                <div className="flex items-center text-slate-500 text-xs font-medium uppercase tracking-wide mb-auto">
                  <MapPin size={14} className="mr-1 text-slate-400" />
                  <span className="truncate">{location}</span>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                  {/* Owner Avatar (Small) */}
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-200 overflow-hidden">
                      {(p.owner_details?.profile_image_url) ?
                        <img src={p.owner_details.profile_image_url} className="w-full h-full object-cover" /> :
                        <span className="flex items-center justify-center h-full text-[10px] text-slate-500 font-bold">{p.owner_details?.first_name?.[0] || 'U'}</span>
                      }
                    </div>
                    <span className="text-xs text-slate-500 font-medium truncate max-w-[100px]">
                      {p.owner_details?.first_name} {p.owner_details?.last_name?.[0]}.
                    </span>
                  </div>

                  <div className="flex gap-1">
                    {!p.is_validated ? (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleValidate(property.id); }}
                        className="p-2 text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors"
                        title="Valider maintenant"
                      >
                        <CheckCircle size={18} />
                      </button>
                    ) : (
                      <button
                        onClick={(e) => { e.stopPropagation(); triggerInvalidation(property); }}
                        className="p-2 text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Invalider / Suspendre"
                      >
                        <Ban size={18} />
                      </button>
                    )}

                    <button
                      onClick={(e) => { e.stopPropagation(); openDetails(property, true); }}
                      className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Modifier le bien"
                    >
                      <Edit size={18} />
                    </button>

                    <button
                      onClick={(e) => { e.stopPropagation(); triggerDelete(property); }}
                      className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Supprimer (Soft Delete)"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {filteredProperties.length === 0 && (
          <div className="col-span-full py-16 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <Search size={32} className="text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Aucun résultat</h3>
            <p className="text-slate-500 max-w-md mx-auto mt-1">
              {activeTab === 'pending'
                ? "Aucun bien en attente de validation. Tout est à jour !"
                : "Aucun bien ne correspond à vos critères de recherche."}
            </p>
          </div>
        )}
      </div>

      {/* Property Details Modal */}
      {isDetailModalOpen && selectedProperty && (
        <PropertyDetailsModal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          property={selectedProperty}
          initialEditMode={initialEditMode}
          onValidate={handleValidate}
          onDelete={confirmDelete}
          onUpdate={handlePropertyUpdate}
          propertyStatuses={propertyStatuses}
        />
      )}

      <ReasonModal
        isOpen={isReasonModalOpen}
        onClose={() => setIsReasonModalOpen(false)}
        onConfirm={confirmInvalidation}
        title="Invalider / Retirer le bien"
        description="Ce bien repassera en 'non validé' et ne sera plus visible. Vous pouvez indiquer une raison pour le propriétaire."
      />

      {/* Delete Reason Modal */}
      <ReasonModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Supprimer la propriété ?"
        description="ATTENTION : Cette action supprimera le bien de la liste active (Soft Delete). Les demandes de visites en attente seront rejetées."
        label="Raison de la suppression (Optionnel)"
        confirmLabel="Supprimer définitivement"
        isDanger={true}
      />

    </div>
  );
};

export default PropertiesView;