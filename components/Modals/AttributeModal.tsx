import React, { useState, useEffect } from 'react';
import { X, Plus, Trash, AlertTriangle, Check, List, Type, ToggleRight } from 'lucide-react';

interface AttributeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (attributeData: any) => Promise<void>;
    initialData?: any | null; // If null, mode is CREATE
}

const AttributeModal: React.FC<AttributeModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
    const [name, setName] = useState('');
    const [dataType, setDataType] = useState<string>('string');
    const [isFilterable, setIsFilterable] = useState(true);
    const [options, setOptions] = useState<string[]>([]);
    const [newOption, setNewOption] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load initial data when editing
    useEffect(() => {
        if (initialData) {
            setName(initialData.name);
            setDataType(initialData.data_type);
            setIsFilterable(initialData.is_filterable);
            if (initialData.options && initialData.data_type === 'enum') {
                const optionValues = initialData.options.map((opt: any) => opt.option_value);
                setOptions(optionValues);
            } else {
                setOptions([]);
            }
        } else {
            // Reset for create mode
            setName('');
            setDataType('string');
            setIsFilterable(true);
            setOptions([]);
        }
        setError(null);
    }, [initialData, isOpen]);

    const handleAddOption = () => {
        if (newOption.trim()) {
            if (options.includes(newOption.trim())) {
                setError("Cette option existe déjà.");
                return;
            }
            setOptions([...options, newOption.trim()]);
            setNewOption('');
            setError(null);
        }
    };

    const handleRemoveOption = (index: number) => {
        const newOptions = [...options];
        newOptions.splice(index, 1);
        setOptions(newOptions);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            setError("Le nom est requis.");
            return;
        }
        if (dataType === 'enum' && options.length === 0) {
            setError("Au moins une option est requise pour le type 'Liste'.");
            return;
        }

        setLoading(true);
        setError(null);

        const payload = {
            name: name.trim(),
            data_type: dataType,
            is_filterable: isFilterable,
            options: dataType === 'enum' ? options : []
        };

        try {
            await onSave(payload);
            onClose();
        } catch (err: any) {
            console.error(err);
            // Handle generic or specific API errors
            if (err.response && err.response.data && err.response.data.message) {
                setError(err.response.data.message);
            } else {
                setError("Une erreur est survenue lors de la sauvegarde.");
            }
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        {initialData ? <><Type size={18} className="text-indigo-600" /> Modifier l'attribut</> : <><Plus size={18} className="text-emerald-600" /> Nouvel Attribut</>}
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full hover:bg-slate-100">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">

                    {error && (
                        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg flex items-start gap-2">
                            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nom de l'attribut</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="ex: Surface, Piscine, État..."
                            className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Type */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Type de donnée</label>
                            <select
                                value={dataType}
                                onChange={(e) => setDataType(e.target.value)}
                                disabled={!!initialData && initialData.data_type !== dataType} // Optional: Prevent drastic type changes if backend restricts
                                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
                            >
                                <option value="string">Texte (String)</option>
                                <option value="integer">Entier (Nombre)</option>
                                <option value="decimal">Décimal (Prix/Surface)</option>
                                <option value="boolean">Oui / Non (Switch)</option>
                                <option value="enum">Liste de choix (Menu)</option>
                            </select>
                        </div>

                        {/* Filterable */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Filtrable ?</label>
                            <button
                                type="button"
                                onClick={() => setIsFilterable(!isFilterable)}
                                className={`w-full flex items-center justify-between px-4 py-2 rounded-lg border transition-all ${isFilterable ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-slate-50 border-slate-200 text-slate-500'}`}
                            >
                                <span className="text-sm font-medium">{isFilterable ? "Oui" : "Non"}</span>
                                <ToggleRight size={20} className={isFilterable ? "text-indigo-600" : "text-slate-400"} />
                            </button>
                        </div>
                    </div>

                    {/* Enum Options Builder */}
                    {dataType === 'enum' && (
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                                <List size={14} /> Options de la liste
                            </label>

                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newOption}
                                    onChange={(e) => setNewOption(e.target.value)}
                                    placeholder="Nouvelle option..."
                                    className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddOption())}
                                />
                                <button
                                    type="button"
                                    onClick={handleAddOption}
                                    disabled={!newOption.trim()}
                                    className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white p-1.5 rounded-lg transition-colors"
                                >
                                    <Plus size={20} />
                                </button>
                            </div>

                            <div className="max-h-32 overflow-y-auto space-y-1.5 pr-1">
                                {options.map((opt, idx) => (
                                    <div key={idx} className="flex justify-between items-center bg-white px-3 py-2 rounded-md border border-slate-200 text-sm shadow-sm">
                                        <span className="text-slate-700 font-medium">{opt}</span>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveOption(idx)}
                                            className="text-slate-400 hover:text-red-500 transition-colors"
                                        >
                                            <Trash size={14} />
                                        </button>
                                    </div>
                                ))}
                                {options.length === 0 && (
                                    <p className="text-xs text-slate-400 text-center py-2 italic">Aucune option ajoutée</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Warning for existing data */}
                    {initialData && (
                        <div className="text-xs text-slate-500 bg-amber-50 p-3 rounded-lg border border-amber-100 flex gap-2">
                            <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />
                            <p>Attention : Renommer un attribut utilisé par des biens peut rendre leurs données invisibles.</p>
                        </div>
                    )}

                    {/* Footer Actions */}
                    <div className="pt-2 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-md shadow-indigo-200 transition-all flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (
                                <>{initialData ? 'Enregistrer' : 'Créer'}</>
                            )}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default AttributeModal;
