import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface ReasonModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (reason: string) => void;
    title?: string;
    description?: string;
}

const ReasonModal: React.FC<ReasonModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title = "Invalider le bien ?",
    description = "Le bien ne sera plus visible sur l'application mobile. Voulez-vous indiquer un motif pour le propriétaire ?"
}) => {
    const [reason, setReason] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onConfirm(reason);
        setReason(''); // Reset
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                <div className="bg-amber-50 px-6 py-4 border-b border-amber-100 flex items-center gap-3">
                    <div className="bg-amber-100 p-2 rounded-full text-amber-600">
                        <AlertTriangle size={20} />
                    </div>
                    <h3 className="font-bold text-amber-900">{title}</h3>
                    <button onClick={onClose} className="ml-auto text-amber-800/50 hover:text-amber-900">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <p className="text-slate-600 text-sm">{description}</p>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Motif (Optionnel)</label>
                        <textarea
                            className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 min-h-[100px] resize-none"
                            placeholder="Ex: Photos floues, description incomplète..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            autoFocus
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2.5 border border-slate-200 text-slate-600 font-bold rounded-lg hover:bg-slate-50 transition-colors"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            className="flex-1 py-2.5 bg-amber-600 text-white font-bold rounded-lg hover:bg-amber-700 shadow-md shadow-amber-200 transition-colors"
                        >
                            Confirmer l'Action
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ReasonModal;
