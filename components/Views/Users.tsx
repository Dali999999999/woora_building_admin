import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, Filter, MoreVertical, Shield, ShieldOff, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { userService } from '../../api/services';
import type { User } from '../../api/services';
import toast from 'react-hot-toast';

const UsersView: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination & Filtering State
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'owner' | 'agent' | 'customer'>('all');

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1); // Reset to page 1 on new search
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset page when filter changes
  useEffect(() => {
    setPage(1);
  }, [filterRole]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await userService.getUsers(page, limit, debouncedSearch, filterRole);
      // Safeguard against missing data
      if (Array.isArray(data)) {
        // Legacy API response (just an array of users)
        setUsers(data);
        setTotalPages(1);
        setTotalUsers(data.length);
      } else if (data && Array.isArray(data.users)) {
        // New Paginated API response
        setUsers(data.users);
        setTotalPages(data.pages || 1);
        setTotalUsers(data.total || 0);
      } else {
        setUsers([]);
        setTotalPages(1);
        setTotalUsers(0);
      }
    } catch (error) {
      console.error(error);
      toast.error("Impossible de charger les utilisateurs");
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, filterRole]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSuspend = async (user: User) => {
    const reason = window.prompt(`Raison de la suspension pour ${user.first_name} :`);
    if (!reason) return;

    try {
      await userService.suspendUser(user.id, reason);
      toast.success("Utilisateur suspendu avec succès");
      fetchUsers();
      setShowModal(false);
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la suspension");
    }
  };

  const handleUnsuspend = async (user: User) => {
    if (!window.confirm(`Voulez-vous réactiver le compte de ${user.first_name} ?`)) return;

    try {
      await userService.unsuspendUser(user.id);
      toast.success("Utilisateur réactivé");
      fetchUsers();
      setShowModal(false);
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la réactivation");
    }
  }

  // Memoize empty state or content to avoid flickering
  const content = useMemo(() => {
    // Ensure users is an array
    const safeUsers = Array.isArray(users) ? users : [];

    if (loading && safeUsers.length === 0) {
      return (
        <div className="p-12 text-center text-slate-500 flex flex-col items-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-4" />
          <p>Chargement des utilisateurs...</p>
        </div>
      );
    }

    if (safeUsers.length === 0) {
      return (
        <div className="p-12 text-center text-slate-500">
          <p className="text-lg font-medium">Aucun utilisateur trouvé</p>
          <p className="text-sm">Essayez de modifier vos filtres</p>
        </div>
      );
    }

    return (
      <table className="w-full text-left">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="px-6 py-4 font-medium text-slate-500">Utilisateur</th>
            <th className="px-6 py-4 font-medium text-slate-500">Rôle</th>
            <th className="px-6 py-4 font-medium text-slate-500">Statut</th>
            <th className="px-6 py-4 font-medium text-slate-500">Date d'inscription</th>
            <th className="px-6 py-4 font-medium text-slate-500 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {users.map(user => (
            <tr key={user.id} className={`group hover:bg-slate-50 cursor-pointer transition-colors ${user.is_suspended ? 'bg-red-50 hover:bg-red-100' : ''}`} onClick={() => { setSelectedUser(user); setShowModal(true); }}>
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold overflow-hidden shadow-sm">
                    {user.profile_image_url ? (
                      <img src={user.profile_image_url} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      (user.first_name?.[0] || user.email[0]).toUpperCase()
                    )}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-800">{user.first_name} {user.last_name}</div>
                    <div className="text-sm text-slate-500">{user.email}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize tracking-wide
                                        ${user.role === 'admin' ? 'bg-slate-800 text-white' :
                    user.role === 'agent' ? 'bg-orange-100 text-orange-700' :
                      user.role === 'owner' ? 'bg-purple-100 text-purple-700' :
                        'bg-blue-100 text-blue-700'
                  }`}>
                  {user.role}
                </span>
              </td>
              <td className="px-6 py-4">
                {user.is_suspended ? (
                  <span className="inline-flex items-center gap-1 text-red-600 bg-red-100 px-2 py-1 rounded-md text-xs font-bold ring-1 ring-red-200">
                    <ShieldOff size={12} />
                    Suspendu
                  </span>
                ) : (
                  user.is_verified ? (
                    <span className="text-emerald-700 bg-emerald-50 px-2 py-1 rounded text-xs font-medium ring-1 ring-emerald-200">Vérifié</span>
                  ) : (
                    <span className="text-amber-700 bg-amber-50 px-2 py-1 rounded text-xs font-medium ring-1 ring-amber-200">Non vérifié</span>
                  )
                )}
              </td>
              <td className="px-6 py-4 text-slate-600 text-sm font-mono">
                {new Date(user.created_at).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 text-right">
                <button className="text-slate-400 hover:text-indigo-600 p-2 rounded-full hover:bg-slate-100 transition-colors">
                  <MoreVertical size={18} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }, [loading, users]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Utilisateurs</h2>
          <p className="text-slate-500">Gérez les comptes clients, propriétaires et agents.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Rechercher par nom, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
          />
        </div>
        <div className="flex items-center gap-2 border-l pl-4 border-slate-200">
          <Filter size={20} className="text-slate-400" />
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value as any)}
            className="border-none bg-transparent focus:ring-0 text-slate-600 font-medium cursor-pointer py-2 pl-2 pr-8"
          >
            <option value="all">Tous les rôles</option>
            <option value="customer">Clients</option>
            <option value="owner">Propriétaires</option>
            <option value="agent">Agents</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {content}

        {/* Pagination Controls */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="text-sm text-slate-500">
            Affichage de <span className="font-medium">{users.length > 0 ? (page - 1) * limit + 1 : 0}</span> à <span className="font-medium">{Math.min(page * limit, totalUsers)}</span> sur <span className="font-medium">{totalUsers}</span> utilisateurs
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              className="p-2 rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="flex items-center gap-1 px-2">
              <span className="text-sm font-medium text-slate-700">Page {page}</span>
              <span className="text-sm text-slate-400">/ {totalPages}</span>
            </div>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || loading}
              className="p-2 rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Modal Detail & Actions */}
      {showModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50">
              <h3 className="text-xl font-bold text-slate-800">Détails Utilisateur</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-5">
                <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center text-3xl font-bold text-slate-400 overflow-hidden shadow-inner">
                  {selectedUser.profile_image_url ? (
                    <img src={selectedUser.profile_image_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    (selectedUser.first_name?.[0] || selectedUser.email[0]).toUpperCase()
                  )}
                </div>
                <div>
                  <div className="text-xl font-bold text-slate-800">{selectedUser.first_name} {selectedUser.last_name}</div>
                  <div className="text-slate-500 font-medium">{selectedUser.email}</div>
                  <div className="text-sm text-slate-400 mt-1 flex items-center gap-2">
                    <span className="bg-slate-100 px-2 py-0.5 rounded text-xs uppercase tracking-wider font-semibold">{selectedUser.role}</span>
                    <span>•</span>
                    <span>{selectedUser.phone_number || "Pas de téléphone"}</span>
                  </div>
                </div>
              </div>

              {selectedUser.is_suspended && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800 flex items-start gap-3">
                  <ShieldOff className="shrink-0 mt-0.5" size={18} />
                  <div>
                    <strong className="block mb-1">Compte suspendu</strong>
                    <p className="opacity-90">{selectedUser.suspension_reason}</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="block text-xs text-slate-400 uppercase font-bold mb-1 tracking-wider">Statut du compte</span>
                  <span className={`font-semibold ${selectedUser.is_verified ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {selectedUser.is_verified ? "Vérifié" : "Non Vérifié"}
                  </span>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="block text-xs text-slate-400 uppercase font-bold mb-1 tracking-wider">Membre depuis</span>
                  <span className="font-semibold text-slate-700">{new Date(selectedUser.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            <div className="p-5 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
              {selectedUser.is_suspended ? (
                <button
                  onClick={() => handleUnsuspend(selectedUser)}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold flex items-center shadow-sm hover:shadow transition-all"
                >
                  <Shield size={16} className="mr-2" /> Réactiver le compte
                </button>
              ) : (
                <button
                  onClick={() => handleSuspend(selectedUser)}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold flex items-center shadow-sm hover:shadow transition-all"
                >
                  <ShieldOff size={16} className="mr-2" /> Suspendre le compte
                </button>
              )}
              <button
                onClick={() => setShowModal(false)}
                className="px-5 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-semibold transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersView;