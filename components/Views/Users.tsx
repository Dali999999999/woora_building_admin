import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, Filter, Trash2, ChevronLeft, ChevronRight, Loader2, Ban, ShieldCheck, Globe, User2 } from 'lucide-react';
import { userService } from '../../api/services';
import type { User } from '../../api/services';
import toast from 'react-hot-toast';
import ReasonModal from '../Modals/ReasonModal';
import SuspensionModal from '../Modals/SuspensionModal';

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
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Compteurs par rôles (Tâche 18)
  const [counts, setCounts] = useState({
    all: 0,
    customer: 0,
    owner: 0,
    agent: 0,
  });

  // Delete State
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Suspension State (Tâche 16)
  const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false);

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

  const fetchCounts = useCallback(async () => {
    try {
      const [resAll, resCust, resOwner, resAgent] = await Promise.all([
        userService.getUsers(1, 1, '', 'all'),
        userService.getUsers(1, 1, '', 'customer'),
        userService.getUsers(1, 1, '', 'owner'),
        userService.getUsers(1, 1, '', 'agent'),
      ]);
      setCounts({
        all: resAll?.total || 0,
        customer: resCust?.total || 0,
        owner: resOwner?.total || 0,
        agent: resAgent?.total || 0,
      });
    } catch (error) {
      console.error("Impossible de charger les compteurs: ", error);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await userService.getUsers(page, limit, debouncedSearch, filterRole);
      if (Array.isArray(data)) {
        setUsers(data);
        setTotalPages(1);
        setTotalUsers(data.length);
      } else if (data && Array.isArray(data.users)) {
        setUsers(data.users);
        setTotalPages(data.pages || 1);
        setTotalUsers(data.total || 0);
      } else {
        setUsers([]);
        setTotalPages(1);
        setTotalUsers(0);
      }
      fetchCounts();
    } catch (error) {
      console.error(error);
      toast.error("Impossible de charger les utilisateurs");
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, filterRole, fetchCounts]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const confirmSuspension = async (reason: string, attachmentUrl?: string) => {
    if (!selectedUser) return;
    try {
      await userService.suspendUser(selectedUser.id, reason, attachmentUrl);
      toast.success(`Utilisateur ${selectedUser.email} suspendu avec succès.`);
      fetchUsers();
      setShowDetailModal(false);
    } catch (error) {
      console.error(error);
      toast.error("Impossible de suspendre l'utilisateur.");
    }
  };

  const handleUnsuspend = async (user: User) => {
    try {
      await userService.unsuspendUser(user.id);
      toast.success(`Suspension levée pour ${user.email}.`);
      fetchUsers();
      setShowDetailModal(false);
    } catch (error) {
      console.error(error);
      toast.error("Impossible de lever la suspension.");
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, user: User) => {
    e.stopPropagation(); // Prevent row click
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async (reason: string) => {
    if (!userToDelete) return;

    const promise = userService.deleteUser(userToDelete.id, reason);

    toast.promise(promise, {
      loading: 'Suppression en cours...',
      success: 'Utilisateur supprimé (Soft Delete) avec succès.',
      error: 'Erreur lors de la suppression.'
    });

    try {
      await promise;
      fetchUsers();
      fetchCounts();
      setIsDeleteModalOpen(false);
      setShowDetailModal(false); // Also close detail modal if open
    } catch (error) {
      console.error(error);
    }
  };


  // Memoize empty state or content to avoid flickering
  const content = useMemo(() => {
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
            <th className="px-6 py-4 font-medium text-slate-500">Téléphone</th>
            <th className="px-6 py-4 font-medium text-slate-500">Rôle</th>
            <th className="px-6 py-4 font-medium text-slate-500">Statut</th>
            <th className="px-6 py-4 font-medium text-slate-500">Date d'inscription</th>
            <th className="px-6 py-4 font-medium text-slate-500 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {users.map(user => (
            <tr key={user.id} className="group hover:bg-slate-50 cursor-pointer transition-colors" onClick={() => { setSelectedUser(user); setShowDetailModal(true); }}>
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
              <td className="px-6 py-4 text-slate-600 text-sm">
                {user.phone_number || <span className="text-slate-300 italic">Non renseigné</span>}
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
                {user.is_verified ? (
                  <span className="text-emerald-700 bg-emerald-50 px-2 py-1 rounded text-xs font-medium ring-1 ring-emerald-200">Vérifié</span>
                ) : (
                  <span className="text-amber-700 bg-amber-50 px-2 py-1 rounded text-xs font-medium ring-1 ring-amber-200">Non vérifié</span>
                )}
              </td>
              <td className="px-6 py-4 text-slate-600 text-sm font-mono">
                {new Date(user.created_at).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 text-right">
                <button
                  onClick={(e) => handleDeleteClick(e, user)}
                  className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-colors"
                  title="Supprimer l'utilisateur"
                >
                  <Trash2 size={16} />
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
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow text-slate-800"
          />
        </div>
      </div>

      {/* Barre d'onglets premium (Tabs) avec compteurs en temps réel (Tâche 18) */}
      <div className="flex border-b border-slate-200 gap-6 bg-slate-50/50 p-2 rounded-lg border">
        {(['all', 'customer', 'owner', 'agent'] as const).map((role) => {
          const isActive = filterRole === role;
          const label = role === 'all' ? 'Tous' : role === 'customer' ? 'Clients' : role === 'owner' ? 'Propriétaires' : 'Agents';
          const count = role === 'all' ? counts.all : role === 'customer' ? counts.customer : role === 'owner' ? counts.owner : counts.agent;
          
          return (
            <button
              key={role}
              onClick={() => setFilterRole(role)}
              className={`pb-2 pt-1 px-4 font-semibold text-sm transition-all rounded-lg ${
                isActive 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
              }`}
            >
              {label}
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${
                isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
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

      {/* Detail Modal */}
      {showDetailModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setShowDetailModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50">
              <h3 className="text-xl font-bold text-slate-800">Détails Utilisateur</h3>
              <button onClick={() => setShowDetailModal(false)} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
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

              {/* Informations du Profil (Tâche 24) */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
                  <div className="text-slate-400">
                    <Globe size={18} />
                  </div>
                  <div>
                    <span className="block text-xs text-slate-400 uppercase font-bold tracking-wider">Nationalité</span>
                    <span className="font-semibold text-slate-700">{selectedUser.nationality || <span className="italic text-slate-300">Non spécifiée</span>}</span>
                  </div>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
                  <div className="text-slate-400">
                    <User2 size={18} />
                  </div>
                  <div>
                    <span className="block text-xs text-slate-400 uppercase font-bold tracking-wider">Genre / Sexe</span>
                    <span className="font-semibold text-slate-700 capitalize">{selectedUser.gender || <span className="italic text-slate-300">Non spécifié</span>}</span>
                  </div>
                </div>
              </div>

              {/* État du Compte */}
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

              {/* Détails du Bannissement / Suspension (Tâche 16) */}
              {selectedUser.is_suspended && (
                <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-rose-800 font-bold">
                    <Ban size={16} />
                    <span>Compte Suspendu / Banni</span>
                  </div>
                  <p className="text-rose-700"><strong>Motif :</strong> {selectedUser.suspension_reason || "Non spécifié."}</p>
                  {selectedUser.banned_by_admin_id && (
                    <p className="text-rose-600 text-xs"><strong>Banni par l'Admin :</strong> #{selectedUser.banned_by_admin_id}</p>
                  )}
                  {selectedUser.suspension_attachment_url && (
                    <a 
                      href={selectedUser.suspension_attachment_url} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-800 underline font-semibold mt-1"
                    >
                      📎 Voir la pièce jointe (Preuve de violation)
                    </a>
                  )}
                </div>
              )}
            </div>
            <div className="p-5 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 flex-wrap">
              <button
                onClick={(e) => handleDeleteClick(e, selectedUser)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-semibold flex items-center shadow-sm hover:shadow transition-all"
              >
                <Trash2 size={16} className="mr-2" /> Supprimer
              </button>

              {/* Action Suspendre / Activer (Tâche 16) */}
              {selectedUser.is_suspended ? (
                <button
                  onClick={() => handleUnsuspend(selectedUser)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold flex items-center shadow-sm hover:shadow transition-all"
                >
                  <ShieldCheck size={16} className="mr-2" /> Réactiver
                </button>
              ) : (
                <button
                  onClick={() => setIsSuspendModalOpen(true)}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold flex items-center shadow-sm hover:shadow transition-all"
                >
                  <Ban size={16} className="mr-2" /> Suspendre
                </button>
              )}

              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-semibold transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ReasonModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Supprimer l'utilisateur ?"
        description="ATTENTION : Cette action est irréversible (Soft Delete). L'utilisateur ne pourra plus se connecter et ses biens seront masqués. Un email de notification sera envoyé."
        label="Motif de la suppression (Optionnel)"
        confirmLabel="Supprimer définitivement"
        isDanger={true}
      />

      {/* Suspension Modal (Tâche 16) */}
      <SuspensionModal
        isOpen={isSuspendModalOpen}
        onClose={() => setIsSuspendModalOpen(false)}
        onConfirm={confirmSuspension}
      />
    </div>
  );
};

export default UsersView;