import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, RefreshCw, Check, X } from 'lucide-react';
import { configService } from '../../api/services';
import toast from 'react-hot-toast';

interface PropertyStatus {
    id: number;
    name: string;
    color: string;
    description?: string;
}

const PropertyStatuses: React.FC = () => {
    const [statuses, setStatuses] = useState<PropertyStatus[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentStatus, setCurrentStatus] = useState<Partial<PropertyStatus>>({});
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        fetchStatuses();
    }, []);

    const fetchStatuses = async () => {
        try {
            setLoading(true);
            const data = await configService.getPropertyStatuses();
            // data est supposé être une liste d'objets { id, name, color, description, value, label }
            // L'API renvoie {valeur, label} pour compatibilité select, mais aussi l'objet complet via to_dict si on l'appelle ainsi.
            // Vérifions le format retourné par l'API backend admin/routes.py get_property_statuses
            // Elle retourne [s.to_dict() for s in statuses] -> {id, name, color, description}
            setStatuses(data);
        } catch (error) {
            console.error("Erreur chargement statuts:", error);
            toast.error("Impossible de charger les statuts.");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (isEditing && currentStatus.id) {
                await configService.updatePropertyStatus(currentStatus.id, currentStatus);
                toast.success("Statut mis à jour avec succès.");
            } else {
                await configService.createPropertyStatus(currentStatus);
                toast.success("Statut créé avec succès.");
            }
            setIsModalOpen(false);
            fetchStatuses();
        } catch (error: any) {
            console.error("Erreur sauvegarde statut:", error);
            toast.error(error.response?.data?.message || "Une erreur est survenue.");
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce statut ?")) return;
        try {
            await configService.deletePropertyStatus(id);
            toast.success("Statut supprimé.");
            fetchStatuses();
        } catch (error: any) {
            console.error("Erreur suppression:", error);
            toast.error(error.response?.data?.message || "Impossible de supprimer ce statut.");
        }
    };

    const openModal = (status?: PropertyStatus) => {
        if (status) {
            setCurrentStatus({ ...status });
            setIsEditing(true);
        } else {
            setCurrentStatus({ name: '', color: '#000000', description: '' });
            setIsEditing(false);
        }
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Gestion des Statuts</h1>
                    <p className="text-slate-500">Définissez les statuts de biens disponibles (ex: À Vendre, Loué)</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
                >
                    <Plus size={20} />
                    Nouveau Statut
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-slate-500">Chargement...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-semibold">
                                    <th className="px-6 py-4">Nom (Label)</th>
                                    <th className="px-6 py-4">Couleur</th>
                                    <th className="px-6 py-4">Description</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {statuses.map((status) => (
                                    <tr key={status.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <span
                                                    className="px-2 py-1 rounded text-xs font-bold text-white shadow-sm"
                                                    style={{ backgroundColor: status.color }}
                                                >
                                                    {status.name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 font-mono text-sm">
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-6 h-6 rounded border border-slate-200 shadow-sm"
                                                    style={{ backgroundColor: status.color }}
                                                ></div>
                                                {status.color}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 text-sm max-w-xs truncate">
                                            {status.description || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => openModal(status)}
                                                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                                                    title="Modifier"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(status.id)}
                                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                    title="Supprimer"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {statuses.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                                            Aucun statut défini.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-semibold text-lg text-slate-800">
                                {isEditing ? 'Modifier le statut' : 'Nouveau statut'}
                            </h3>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Nom du statut <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                                    placeholder="Ex: À Vendre"
                                    value={currentStatus.name || ''}
                                    onChange={e => setCurrentStatus({ ...currentStatus, name: e.target.value })}
                                />
                                <p className="text-xs text-slate-500 mt-1">Ce nom sera affiché partout dans l'application.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Couleur (Code Hex)
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="color"
                                        className="h-10 w-10 p-0 border-0 rounded cursor-pointer"
                                        value={currentStatus.color || '#000000'}
                                        onChange={e => setCurrentStatus({ ...currentStatus, color: e.target.value })}
                                    />
                                    <input
                                        type="text"
                                        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono"
                                        placeholder="#000000"
                                        value={currentStatus.color || ''}
                                        onChange={e => setCurrentStatus({ ...currentStatus, color: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Description
                                </label>
                                <textarea
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                                    rows={3}
                                    placeholder="Description interne optionnelle..."
                                    value={currentStatus.description || ''}
                                    onChange={e => setCurrentStatus({ ...currentStatus, description: e.target.value })}
                                />
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center gap-2"
                                >
                                    <Check size={18} />
                                    Enregistrer
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PropertyStatuses;
