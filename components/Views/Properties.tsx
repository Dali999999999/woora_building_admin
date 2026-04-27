import React, { useState, useEffect, useCallback } from 'react';
import { Search, MapPin, Edit, Trash2, Eye, Filter, CheckCircle, AlertCircle, Ban, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { propertyService, configService } from '../../api/services';
import { Property, PropertyType } from '../../types';
import toast from 'react-hot-toast';
import PropertyDetailsModal from '../Modals/PropertyDetailsModal';
import ReasonModal from '../Modals/ReasonModal';

const PropertiesView: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [propertyTypes, setPropertyTypes] = useState<PropertyType[]>([]);
  const [propertyStatuses, setPropertyStatuses] = useState<{ id: number, name: string, label?: string, color?: string }[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination & Search State
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProperties, setTotalProperties] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Filters & Tabs
  const [activeTab, setActiveTab] = useState<'all' | 'pending'>('pending');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

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

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    try {
      const isValidated = activeTab === 'pending' ? false : undefined;
      const data = await propertyService.getProperties(
        page, 
        limit, 
        debouncedSearch, 
        statusFilter === 'all' ? undefined : statusFilter,
        isValidated
      );

      if (data && Array.isArray(data.properties)) {
        setProperties(data.properties);
        setTotalPages(data.pages || 1);
        setTotalProperties(data.total || 0);
      } else if (Array.isArray(data)) {
        setProperties(data);
        setTotalPages(1);
        setTotalProperties(data.length);
      }
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors du chargement des biens");
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, statusFilter, activeTab]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  // Load types and statuses once
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const [types, statuses] = await Promise.all([
          configService.getPropertyTypesWithAttributes(),
          configService.getPropertyStatuses()
        ]);
        setPropertyTypes(types);
        setPropertyStatuses(statuses);
      } catch (error) {
        console.error(error);
      }
    };
    loadConfig();
  }, []);

  // Use the fetched properties directly since they are now filtered on the backend
  const displayedProperties = properties;

  const handleValidate = async (id: number) => {
    const promise = propertyService.validateProperty(id);
    toast.promise(promise, {
      loading: 'Validation en cours...',
      success: 'Bien validé et publié ! 🚀',
      error: 'Erreur lors de la validation',
    });
    try {
      await promise;
      setProperties(props => props.map(p => p.id === id ? { ...p, is_validated: true } : p));
    } catch (error) { console.error(error); }
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
      setProperties(props => props.map(p => p.id === propertyToInvalidate.id ? { ...p, is_validated: false } : p));
      setIsReasonModalOpen(false);
    } catch (error) { console.error(error); }
  };

  const confirmDelete = async (reason: string) => {
    if (!propertyToDelete) return;
    const promise = propertyService.deleteProperty(propertyToDelete.id, reason);
    toast.promise(promise, {
      loading: 'Suppression en cours...',
      success: 'Bien supprimé.',
      error: 'Erreur lors de la suppression'
    });
    try {
      await promise;
      setProperties(props => props.filter(p => p.id !== propertyToDelete.id));
      setIsDeleteModalOpen(false);
      setIsDetailModalOpen(false);
    } catch (error) { console.error(error); }
  };

  const openDetails = (property: Property, editMode = false) => {
    setSelectedProperty(property);
    setInitialEditMode(editMode);
    setIsDetailModalOpen(true);
  };

  const handlePropertyUpdate = (updatedProperty: Property) => {
    setProperties(props => props.map(p => p.id === updatedProperty.id ? updatedProperty : p));
  };

  const getStatusBadge = (property: any) => {
    if (!property.is_validated) {
      return <span className="px-2 py-1 rounded bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold flex items-center gap-1"><AlertCircle size={10} /> En attente</span>;
    }
    const statusObj = property.status && typeof property.status === 'object' ? property.status : property.property_status;
    if (statusObj && statusObj.name) {
      return (
        <span className="px-2 py-1 rounded text-xs font-bold text-white shadow-sm" style={{ backgroundColor: statusObj.color || '#6366f1' }}>
          {statusObj.name}
        </span>
      );
    }
    return <span className="px-2 py-1 rounded bg-slate-600 text-white text-xs font-bold shadow-sm">Validé</span>;
  };

  const formatPrice = (price: any) => {
    if (!price) return 'N/A';
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(Number(price));
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Gestion des Biens</h2>
          <p className="text-slate-500">Supervisez le catalogue et validez les nouvelles annonces.</p>
        </div>
        <button onClick={() => toast('Utilisez l\'application mobile', { icon: '📱' })} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md flex items-center gap-2">
          + Nouveau Bien
        </button>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 border-b border-slate-200 pb-1">
        <button onClick={() => { setActiveTab('pending'); setPage(1); }} className={`pb-3 px-2 text-sm font-bold relative ${activeTab === 'pending' ? 'text-indigo-600' : 'text-slate-500'}`}>
          En Attente
          {activeTab === 'pending' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full" />}
        </button>
        <button onClick={() => { setActiveTab('all'); setPage(1); }} className={`pb-3 px-2 text-sm font-bold relative ${activeTab === 'all' ? 'text-indigo-600' : 'text-slate-500'}`}>
          Tous les Biens
          {activeTab === 'all' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full" />}
        </button>
      </div>

      <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input type="text" placeholder="Rechercher..." className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 text-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <div className="relative min-w-[140px]">
          <select className="w-full appearance-none bg-slate-50 border-transparent px-4 py-2.5 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="all">Tous statuts</option>
            {propertyStatuses.map((status: any) => <option key={status.id} value={status.id}>{status.name}</option>)}
          </select>
          <Filter size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center text-slate-500">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-4" />
          <p>Chargement...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {displayedProperties.map(property => {
              const p = property as any;
              const title = p.title || p.attributes?.title || 'Sans titre';
              const imageUrl = (p.image_urls?.[0]) || 'https://via.placeholder.com/400x300';
              return (
                <div key={property.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg transition-all group flex flex-col h-full">
                  <div className="relative h-52 bg-slate-100">
                    <img src={imageUrl} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute top-3 left-3">{getStatusBadge(p)}</div>
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px]">
                      <button onClick={() => openDetails(property)} className="bg-white text-slate-900 px-4 py-2 rounded-full font-bold text-xs flex items-center gap-2 shadow-lg">
                        <Eye size={14} /> Voir Détails
                      </button>
                    </div>
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                    <h3 className="font-bold text-slate-800 line-clamp-1 mb-1">{title}</h3>
                    <p className="text-lg font-black text-indigo-600 mb-3">{formatPrice(p.price || p.attributes?.price)}</p>
                    <div className="flex items-center text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-auto">
                      <MapPin size={12} className="mr-1" />
                      <span className="truncate">{p.city || p.attributes?.city || 'Localisation inconnue'}</span>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-indigo-50 flex items-center justify-center text-[10px] font-bold text-indigo-500">{p.owner_details?.first_name?.[0] || 'U'}</div>
                        <span className="text-[10px] text-slate-500 font-bold">{p.owner_details?.first_name}</span>
                      </div>
                      <div className="flex gap-1">
                        {!p.is_validated ? (
                          <button onClick={() => handleValidate(property.id)} className="p-1.5 text-amber-500 hover:bg-amber-50 rounded-lg"><CheckCircle size={16} /></button>
                        ) : (
                          <button onClick={() => { setPropertyToInvalidate(property); setIsReasonModalOpen(true); }} className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg"><Ban size={16} /></button>
                        )}
                        <button onClick={() => openDetails(property, true)} className="p-1.5 text-slate-300 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg"><Edit size={16} /></button>
                        <button onClick={() => { setPropertyToDelete(property); setIsDeleteModalOpen(true); }} className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg"><Trash2 size={16} /></button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-between bg-white px-6 py-3 rounded-2xl border border-slate-200">
              <span className="text-xs text-slate-500 font-medium">Page {page} sur {totalPages} ({totalProperties} biens)</span>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-xl border border-slate-100 disabled:opacity-20"><ChevronLeft size={18} /></button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 rounded-xl border border-slate-100 disabled:opacity-20"><ChevronRight size={18} /></button>
              </div>
            </div>
          )}
        </>
      )}

      {isDetailModalOpen && selectedProperty && (
        <PropertyDetailsModal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          property={selectedProperty}
          initialEditMode={initialEditMode}
          onValidate={handleValidate}
          onDelete={confirmDelete}
          onUpdate={handlePropertyUpdate}
          propertyStatuses={propertyStatuses as any}
        />
      )}

      <ReasonModal isOpen={isReasonModalOpen} onClose={() => setIsReasonModalOpen(false)} onConfirm={confirmInvalidation} title="Suspendre le bien" description="Ce bien ne sera plus visible." />
      <ReasonModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={confirmDelete} title="Supprimer ?" description="Cette action est irréversible (Soft Delete)." isDanger={true} />
    </div>
  );
};

export default PropertiesView;