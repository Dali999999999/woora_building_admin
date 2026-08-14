import React, { useState, useEffect, useCallback } from 'react';
import { Trash2, Search, RotateCcw, Building2, User2, Loader2, ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import { userService, propertyService } from '../../api/services';
import type { User, Property } from '../../api/services';
import toast from 'react-hot-toast';

const TrashView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'properties'>('users');
  const [loading, setLoading] = useState(true);

  // Users state
  const [deletedUsers, setDeletedUsers] = useState<User[]>([]);
  const [usersPage, setUsersPage] = useState(1);
  const [usersTotalPages, setUsersTotalPages] = useState(1);
  const [usersTotal, setUsersTotal] = useState(0);

  // Properties state
  const [deletedProperties, setDeletedProperties] = useState<Property[]>([]);
  const [propsPage, setPropsPage] = useState(1);
  const [propsTotalPages, setPropsTotalPages] = useState(1);
  const [propsTotal, setPropsTotal] = useState(0);

  // Common Search
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const limit = 20;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setUsersPage(1);
      setPropsPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchDeletedUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await userService.getUsers(usersPage, limit, debouncedSearch, 'all', 'archived');
      if (Array.isArray(data)) {
        setDeletedUsers(data);
        setUsersTotalPages(1);
        setUsersTotal(data.length);
      } else if (data && Array.isArray(data.users)) {
        setDeletedUsers(data.users);
        setUsersTotalPages(data.pages || 1);
        setUsersTotal(data.total || 0);
      }
    } catch (error) {
      console.error(error);
      toast.error("Impossible de charger les utilisateurs supprimés.");
    } finally {
      setLoading(false);
    }
  }, [usersPage, limit, debouncedSearch]);

  const fetchDeletedProperties = useCallback(async () => {
    setLoading(true);
    try {
      const data = await propertyService.getDeletedProperties(propsPage, limit, debouncedSearch);
      if (Array.isArray(data)) {
        setDeletedProperties(data);
        setPropsTotalPages(1);
        setPropsTotal(data.length);
      } else if (data && Array.isArray(data.properties)) {
        setDeletedProperties(data.properties);
        setPropsTotalPages(data.pages || 1);
        setPropsTotal(data.total || 0);
      }
    } catch (error) {
      console.error(error);
      toast.error("Impossible de charger les biens supprimés.");
    } finally {
      setLoading(false);
    }
  }, [propsPage, limit, debouncedSearch]);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchDeletedUsers();
    } else {
      fetchDeletedProperties();
    }
  }, [activeTab, fetchDeletedUsers, fetchDeletedProperties]);

  const handleRestoreUser = async (user: User) => {
    const email = user.display_email || (user.email.startsWith('deleted_') ? user.email.split('_', 2)[2] : user.email);
    const promise = userService.restoreUser(user.id);

    toast.promise(promise, {
      loading: 'Restauration de l\'utilisateur...',
      success: `Compte ${email} et ses annonces restaurés avec succès.`,
      error: 'Erreur lors de la restauration.'
    });

    try {
      await promise;
      fetchDeletedUsers();
    } catch (error) {
      console.error(error);
    }
  };

  const handleRestoreProperty = async (prop: Property) => {
    const title = (prop as any).title || prop.attributes?.title || 'Bien';
    const promise = propertyService.restoreProperty(prop.id);

    toast.promise(promise, {
      loading: 'Restauration du bien...',
      success: `Bien "${title}" restauré avec succès.`,
      error: 'Erreur lors de la restauration.'
    });

    try {
      await promise;
      fetchDeletedProperties();
    } catch (error) {
      console.error(error);
    }
  };

  const formatPrice = (price: any) => {
    if (!price) return 'N/A';
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(Number(price));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
            <Trash2 className="text-rose-600" size={28} /> Corbeille & Archives
          </h2>
          <p className="text-slate-500">Consultez et restaurez les comptes et biens supprimés.</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-200/70 p-1 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'users'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <User2 size={16} /> Utilisateurs Supprimés ({usersTotal})
          </button>
          <button
            onClick={() => setActiveTab('properties')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'properties'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 size={16} /> Biens Supprimés ({propsTotal})
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder={activeTab === 'users' ? "Rechercher un utilisateur supprimé (nom, email)..." : "Rechercher un bien supprimé (titre, ville)..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 transition-shadow text-slate-800"
          />
        </div>
      </div>

      {/* Content Container */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-slate-500 flex flex-col items-center">
            <Loader2 className="w-8 h-8 animate-spin text-rose-500 mb-4" />
            <p>Chargement des éléments de la corbeille...</p>
          </div>
        ) : activeTab === 'users' ? (
          /* DELETED USERS TABLE */
          deletedUsers.length === 0 ? (
            <div className="p-16 text-center text-slate-500">
              <Trash2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-lg font-medium">La corbeille des utilisateurs est vide</p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-medium text-slate-500">Utilisateur</th>
                  <th className="px-6 py-4 font-medium text-slate-500">Rôle</th>
                  <th className="px-6 py-4 font-medium text-slate-500">Date de suppression</th>
                  <th className="px-6 py-4 font-medium text-slate-500">Motif</th>
                  <th className="px-6 py-4 font-medium text-slate-500 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {deletedUsers.map(user => {
                  const cleanEmail = user.display_email || (user.email.startsWith('deleted_') ? user.email.split('_', 2)[2] : user.email);
                  return (
                    <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                            {(user.first_name?.[0] || cleanEmail[0]).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-800">{user.first_name} {user.last_name}</div>
                            <div className="text-sm text-slate-500">{cleanEmail}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold uppercase bg-slate-100 text-slate-700">
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600 text-sm font-mono">
                        {user.deleted_at ? new Date(user.deleted_at).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-6 py-4 text-slate-600 text-sm italic max-w-xs truncate">
                        {user.deletion_reason || 'Motif non précisé'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleRestoreUser(user)}
                          className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 ml-auto border border-emerald-200"
                        >
                          <RotateCcw size={14} /> Restaurer
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )
        ) : (
          /* DELETED PROPERTIES GRID / TABLE */
          deletedProperties.length === 0 ? (
            <div className="p-16 text-center text-slate-500">
              <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-lg font-medium">La corbeille des biens immobiliers est vide</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
              {deletedProperties.map(property => {
                const p = property as any;
                const title = p.title || p.attributes?.title || 'Bien sans titre';
                const imageUrl = (p.image_urls?.[0]) || 'https://via.placeholder.com/400x300';
                return (
                  <div key={property.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm flex flex-col">
                    <div className="relative h-44 bg-slate-100">
                      <img src={imageUrl} alt={title} className="w-full h-full object-cover grayscale opacity-75" />
                      <div className="absolute top-2 right-2 bg-rose-600 text-white text-[10px] uppercase font-bold px-2 py-1 rounded">
                        Supprimé
                      </div>
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <h4 className="font-bold text-slate-800 line-clamp-1">{title}</h4>
                        <p className="text-indigo-600 font-bold text-sm mt-1">{formatPrice(p.price || p.attributes?.price)}</p>
                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                          <MapPin size={12} /> {p.city || p.attributes?.city || 'Non renseigné'}
                        </p>
                      </div>

                      {p.deletion_reason && (
                        <div className="bg-slate-50 p-2.5 rounded text-xs text-slate-600 italic border border-slate-100">
                          <strong>Motif :</strong> {p.deletion_reason}
                        </div>
                      )}

                      <button
                        onClick={() => handleRestoreProperty(property)}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-2 shadow-sm"
                      >
                        <RotateCcw size={14} /> Restaurer ce bien
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* Pagination Controls */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
          <span className="text-xs text-slate-500">
            Total : {activeTab === 'users' ? usersTotal : propsTotal} élément(s) dans la corbeille
          </span>
          <div className="flex gap-2">
            {activeTab === 'users' ? (
              <>
                <button onClick={() => setUsersPage(p => Math.max(1, p - 1))} disabled={usersPage === 1} className="p-2 border rounded-lg bg-white disabled:opacity-30"><ChevronLeft size={16} /></button>
                <span className="text-xs font-bold self-center">Page {usersPage} / {usersTotalPages}</span>
                <button onClick={() => setUsersPage(p => Math.min(usersTotalPages, p + 1))} disabled={usersPage === usersTotalPages} className="p-2 border rounded-lg bg-white disabled:opacity-30"><ChevronRight size={16} /></button>
              </>
            ) : (
              <>
                <button onClick={() => setPropsPage(p => Math.max(1, p - 1))} disabled={propsPage === 1} className="p-2 border rounded-lg bg-white disabled:opacity-30"><ChevronLeft size={16} /></button>
                <span className="text-xs font-bold self-center">Page {propsPage} / {propsTotalPages}</span>
                <button onClick={() => setPropsPage(p => Math.min(propsTotalPages, p + 1))} disabled={propsPage === propsTotalPages} className="p-2 border rounded-lg bg-white disabled:opacity-30"><ChevronRight size={16} /></button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrashView;
