import React, { useState, useEffect } from 'react';
import { Search, MapPin, Edit, Trash2 } from 'lucide-react';
import { propertyService, configService } from '../../api/services';
import { Property, PropertyType } from '../../types';
import toast from 'react-hot-toast';

const PropertiesView: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [propertyTypes, setPropertyTypes] = useState<PropertyType[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
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
    fetchData();
  }, []);

  const filteredProperties = properties.filter(p => {
    const location = `${p.attributes?.address || ''} ${p.attributes?.city || ''}`.toLowerCase();
    const matchesSearch = (p.attributes?.title || p.status).toLowerCase().includes(searchTerm.toLowerCase()) ||
      location.includes(searchTerm.toLowerCase());

    // p.type might be populated object or just ID based on backend response. 
    // Usually backend for 'getProperties' might send property_type_id or property_type object.
    // My updated 'types.ts' has type?: { id: number ... }.
    // If backend returns property_type_id at root, I should check that. 
    // Looking at models.py, to_dict returns 'property_type': {...}.
    const typeId = p.type?.id;
    const matchesType = typeFilter === 'all' || (typeId && typeId.toString() === typeFilter);

    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'for_sale': return <span className="px-2 py-1 rounded bg-emerald-100 text-emerald-700 text-xs font-medium">À Vendre</span>;
      case 'for_rent': return <span className="px-2 py-1 rounded bg-blue-100 text-blue-700 text-xs font-medium">À Louer</span>;
      case 'sold': return <span className="px-2 py-1 rounded bg-slate-100 text-slate-600 text-xs font-medium">Vendu</span>;
      case 'rented': return <span className="px-2 py-1 rounded bg-indigo-100 text-indigo-700 text-xs font-medium">Loué</span>;
      default: return <span className="px-2 py-1 rounded bg-gray-100 text-gray-600 text-xs font-medium">{status}</span>;
    }
  };

  const formatPrice = (price: any) => {
    if (!price) return 'N/A';
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(Number(price));
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Chargement des biens...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Biens Immobiliers</h2>
          <p className="text-slate-500">Gérez le catalogue des biens disponibles.</p>
        </div>
        {/* Helper button - functionality could be added later */}
        <button
          onClick={() => toast('Fonctionnalité à venir', { icon: '🚧' })}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          + Ajouter un bien
        </button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="col-span-2 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Rechercher (Titre, Ville)..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div>
          <select
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">Tous les types</option>
            {propertyTypes.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
        <div>
          <select
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Tous statuts</option>
            <option value="for_sale">À Vendre</option>
            <option value="for_rent">À Louer</option>
            <option value="sold">Vendu</option>
            <option value="rented">Loué</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredProperties.map(property => {
          // Identify title/location from backend mapping
          // Properties might have fields like 'title' directly on the object too, depending on services.ts
          // services.ts says Property interface has attributes: Record<string,any>.
          // Actually models.py `to_dict` puts 'title' at root, AND attributes in 'attributes'.
          // My types.ts check:
          // export interface Property { id, owner_id, status, created_at, image_urls, attributes, type, owner ... }
          // models.py to_dict returns 'title' at ROOT level.
          // Types.ts missed 'title', 'price', 'address', 'city' at root level!
          // BUT models.py maps them!
          // Check models.py output:
          // 'title': self.title, 'price': ..., 'attributes': ...
          // So I can access property.title if I update types.ts or use 'any'.
          // To be safe I'll cast to any or check both.

          const p = property as any;
          const title = p.title || p.attributes?.title || 'Bien sans titre';
          const price = p.price || p.attributes?.price;
          const location = p.city || p.attributes?.city || p.address || 'Localisation inconnue';
          const imageUrl = (p.image_urls && p.image_urls.length > 0) ? p.image_urls[0] : 'https://via.placeholder.com/400x300?text=No+Image';

          return (
            <div key={property.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow group">
              <div className="relative h-48 overflow-hidden bg-slate-100">
                <img src={imageUrl} alt={title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute top-3 right-3">
                  {getStatusBadge(property.status)}
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                  <p className="text-white font-bold text-lg">{formatPrice(price)}</p>
                </div>
              </div>
              <div className="p-5">
                <h3 className="font-bold text-slate-800 mb-1 truncate">{title}</h3>
                <div className="flex items-center text-slate-500 text-sm mb-4">
                  <MapPin size={14} className="mr-1 shrink-0" />
                  <span className="truncate">{location}</span>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <span className="text-xs text-slate-400">
                    Ajouté le {property.created_at ? new Date(property.created_at).toLocaleDateString() : 'N/A'}
                  </span>
                  <div className="flex space-x-2">
                    <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors">
                      <Edit size={16} />
                    </button>
                    <button className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {filteredProperties.length === 0 && (
          <div className="col-span-full py-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 text-slate-400 mb-4">
              <Search size={32} />
            </div>
            <h3 className="text-lg font-medium text-slate-800">Aucun bien trouvé</h3>
            <p className="text-slate-500">Essayez de modifier vos filtres de recherche.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertiesView;