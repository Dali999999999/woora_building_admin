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
  const [loading, setLoading] = useState(true);

  // Filters & Tabs
  const [activeTab, setActiveTab] = useState<'all' | 'pending'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal State
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Invalidation State
  const [propertyToInvalidate, setPropertyToInvalidate] = useState<Property | null>(null);
  const [isReasonModalOpen, setIsReasonModalOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [props, types] = await Promise.all([
        propertyService.getProperties(),
        configService.getPropertyTypesWithAttributes()
      ]);
      setProperties(props);
      setPropertyTypes(types);
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
    // Note: 'all' tab shows everything, or maybe strictly 'validated'? 
    // Usually 'All' implies everything, but let's make 'all' = 'Validated' + 'Pending' 
    // or maybe separate 'Validated' and 'Pending'.
    // User asked for a "Pending Validation Section". 
    // Let's assume 'all' shows everything, 'pending' shows only pending.

    // Search
    const location = `${p.attributes?.address || ''} ${p.attributes?.city || ''}`.toLowerCase();
    const titleMatch = (p.attributes?.title || p.status).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSearch = titleMatch || location.includes(searchTerm.toLowerCase());

    // Type Filter
    const typeId = p.type?.id; // Assumes backend populates this or we handle it
    // Check if property_type_id exists on p (root) or p.attributes
    const pTypeId = (p as any).property_type_id || p.type?.id;
    const matchesType = typeFilter === 'all' || (pTypeId && pTypeId.toString() === typeFilter);

    // Status Filter (Sold/Rent)
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
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


  const openDetails = (property: Property) => {
    setSelectedProperty(property);
    setIsDetailModalOpen(true);
  };

  const getStatusBadge = (property: any) => {
    if (!property.is_validated) {
      return <span className="px-2 py-1 rounded bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold flex items-center gap-1"><AlertCircle size={10} /> En attente</span>;
    }

    switch (property.status) {
      case 'for_sale': return <span className="px-2 py-1 rounded bg-emerald-100 text-emerald-700 text-xs font-medium">À Vendre</span>;
      case 'for_rent': return <span className="px-2 py-1 rounded bg-blue-100 text-blue-700 text-xs font-medium">À Louer</span>;
      case 'sold': return <span className="px-2 py-1 rounded bg-slate-100 text-slate-600 text-xs font-medium">Vendu</span>;
      case 'rented': return <span className="px-2 py-1 rounded bg-indigo-100 text-indigo-700 text-xs font-medium">Loué</span>;
      default: return <span className="px-2 py-1 rounded bg-gray-100 text-gray-600 text-xs font-medium">{property.status}</span>;
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
              <option value="for_sale">À Vendre</option>
              <option value="for_rent">À Louer</option>
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
                    <button className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                      <Edit size={18} />
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

      <PropertyDetailsModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        property={selectedProperty}
        onValidate={handleValidate}
        onDelete={() => toast('Suppression à implémenter', { icon: '🗑️' })}
      />

      <ReasonModal
        isOpen={isReasonModalOpen}
        onClose={() => setIsReasonModalOpen(false)}
        onConfirm={confirmInvalidation}
        title="Invalider / Retirer le bien"
        description="Ce bien repassera en 'non validé' et ne sera plus visible. Vous pouvez indiquer une raison pour le propriétaire."
      />

    </div>
  );
};

export default PropertiesView;