import React, { useState } from 'react';
import { X, AlertTriangle, Paperclip, Loader2, CheckCircle2 } from 'lucide-react';
import { propertyService } from '../../api/services';
import toast from 'react-hot-toast';

interface SuspensionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (reason: string, attachmentUrl?: string) => void;
    title?: string;
    description?: string;
}

const SuspensionModal: React.FC<SuspensionModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title = "Suspendre le compte de l'utilisateur ?",
    description = "L'utilisateur sera immédiatement suspendu et ne pourra plus se connecter à l'application."
}) => {
    const [reason, setReason] = useState('');
    const [uploading, setUploading] = useState(false);
    const [attachmentUrl, setAttachmentUrl] = useState<string | undefined>(undefined);
    const [fileName, setFileName] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setFileName(file.name);
        try {
            const result = await propertyService.uploadImage(file);
            if (result && result.url) {
                setAttachmentUrl(result.url);
                toast.success("Pièce jointe téléversée avec succès.");
            } else {
                throw new Error("Erreur de téléversement");
            }
        } catch (error) {
            console.error(error);
            toast.error("Impossible de téléverser le fichier.");
            setFileName(null);
            setAttachmentUrl(undefined);
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!reason.trim()) {
            toast.error("Veuillez indiquer un motif de suspension.");
            return;
        }
        onConfirm(reason, attachmentUrl);
        setReason('');
        setAttachmentUrl(undefined);
        setFileName(null);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200 overflow-hidden border border-slate-100">
                <div className="bg-rose-50 px-6 py-4 border-b border-rose-100 flex items-center gap-3">
                    <div className="bg-rose-100 p-2 rounded-full text-rose-600">
                        <AlertTriangle size={20} />
                    </div>
                    <h3 className="font-bold text-rose-900">{title}</h3>
                    <button onClick={onClose} className="ml-auto text-rose-800/50 hover:text-rose-950">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <p className="text-slate-600 text-sm">{description}</p>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Motif de suspension</label>
                        <textarea
                            className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 min-h-[100px] resize-none transition-shadow"
                            placeholder="Ex: Non-respect des conditions d'utilisation, comportement inapproprié..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            required
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Pièce Jointe (Preuve de violation)</label>
                        <div className="flex items-center gap-3">
                            <label className="flex items-center gap-2 px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-600 text-sm font-medium cursor-pointer transition-colors">
                                <Paperclip size={16} />
                                <span>Choisir un fichier</span>
                                <input
                                    type="file"
                                    className="hidden"
                                    onChange={handleFileChange}
                                    disabled={uploading}
                                />
                            </label>
                            {uploading && (
                                <div className="flex items-center gap-1.5 text-slate-500 text-sm">
                                    <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
                                    <span>Envoi...</span>
                                </div>
                            )}
                            {!uploading && attachmentUrl && (
                                <div className="flex items-center gap-1.5 text-emerald-600 text-sm font-medium">
                                    <CheckCircle2 size={16} />
                                    <span className="truncate max-w-[150px]">{fileName}</span>
                                </div>
                            )}
                        </div>
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
                            disabled={uploading}
                            className="flex-1 py-2.5 bg-rose-600 text-white font-bold rounded-lg hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-rose-200 transition-colors"
                        >
                            Confirmer la Suspension
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SuspensionModal;
