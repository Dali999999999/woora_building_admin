import React from 'react';
import { X, MapPin, User, Phone, Mail, Calendar, CheckCircle, AlertTriangle } from 'lucide-react';
import { Property } from '../../api/services';

interface PropertyDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    property: Property | null;
    onValidate: (id: number) => void;
    onDelete: (id: number) => void;
}

const PropertyDetailsModal: React.FC<PropertyDetailsModalProps> = ({
    isOpen,
    onClose,
    property,
    onValidate,
    onDelete
}) => {
    if (!isOpen || !property) return null;

    // Helper to safely access owner details (added by backend update)
    const owner = (property as any).owner_details;
    const attributes = property.attributes || {};
    const images = property.image_urls || [];
    const mainImage = images.length > 0 ? images[0] : 'https://via.placeholder.com/600x400?text=No+Image';

    const formatPrice = (price: any) => {
        if (!price) return 'N/A';
        return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(Number(price));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">

                {/* Header with Actions */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white z-10">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            Détails du Bien
                            {!property.is_validated ? (
                                <span className="bg-amber-100 text-amber-700 text-xs px-2 py-1 rounded-full font-bold flex items-center gap-1">
                                    <AlertTriangle size={12} /> En attente validation
                                </span>
                            ) : (
                                <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-1 rounded-full font-bold flex items-center gap-1">
                                    <CheckCircle size={12} /> Validé
                                </span>
                            )}
                        </h2>
                        <p className="text-sm text-slate-500">ID: #{property.id} • Créé le {new Date(property.created_at).toLocaleDateString()}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <X size={24} className="text-slate-400" />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                        {/* Left Column: Images & Key Stats */}
                        <div className="lg:col-span-2 space-y-6">

                            {/* Main Image Banner */}
                            <div className="rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm relative group h-64 sm:h-80">
                                <img src={mainImage} alt="Main" className="w-full h-full object-cover" />
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                                    <div className="text-white">
                                        <h1 className="text-2xl sm:text-3xl font-bold mb-1">{property.title || attributes.title}</h1>
                                        <p className="flex items-center text-slate-200 font-medium">
                                            <MapPin size={18} className="mr-1" />
                                            {property.address || attributes.address}, {property.city || attributes.city}
                                        </p>
                                    </div>
                                </div>
                                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-4 py-2 rounded-lg shadow-lg font-bold text-slate-900 text-lg">
                                    {formatPrice(property.price || attributes.price)}
                                </div>
                            </div>

                            {/* Gallery Grid */}
                            {images.length > 1 && (
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Galerie Photos ({images.length})</h3>
                                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                                        {images.map((url: string, idx: number) => (
                                            <div key={idx} className="aspect-square rounded-lg overflow-hidden border border-slate-200 cursor-pointer hover:opacity-80 transition-opacity">
                                                <img src={url} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Attributes & Description */}
                            <div className="grid grid-cols-1 gap-6">
                                <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Description</h3>
                                    <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
                                        {property.description || attributes.description || "Aucune description fournie."}
                                    </p>
                                </div>

                                <div>
                                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Caractéristiques</h3>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        {Object.entries(attributes).map(([key, value]) => {
                                            if (['title', 'description', 'price', 'address', 'city', 'latitude', 'longitude', 'status', 'property_type_id'].includes(key)) return null;
                                            if (!value) return null;
                                            return (
                                                <div key={key} className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm flex flex-col">
                                                    <span className="text-xs text-slate-400 capitalize mb-1">{key.replace(/_/g, ' ')}</span>
                                                    <span className="font-semibold text-slate-700 text-sm truncate">{String(value)}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Owner & Admin Actions */}
                        <div className="space-y-6">

                            {/* Owner Card */}
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="bg-indigo-50 px-6 py-4 border-b border-indigo-100 flex items-center gap-2">
                                    <User size={20} className="text-indigo-600" />
                                    <h3 className="font-bold text-indigo-900">Propriétaire</h3>
                                </div>
                                <div className="p-6 space-y-4">
                                    {owner ? (
                                        <>
                                            <div className="flex items-center gap-4">
                                                <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center text-slate-400 text-2xl font-bold overflow-hidden border-2 border-white shadow-md">
                                                    {owner.profile_image_url ? (
                                                        <img src={owner.profile_image_url} alt="Owner" className="w-full h-full object-cover" />
                                                    ) : (
                                                        owner.first_name?.[0] || '?'
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-lg text-slate-900">{owner.first_name} {owner.last_name}</p>
                                                    <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">{owner.role}</p>
                                                </div>
                                            </div>

                                            <div className="space-y-3 pt-2">
                                                <div className="flex items-center gap-3 text-sm text-slate-600">
                                                    <Mail size={16} className="text-slate-400" />
                                                    <span className="truncate">{owner.email}</span>
                                                </div>
                                                <div className="flex items-center gap-3 text-sm text-slate-600">
                                                    <Phone size={16} className="text-slate-400" />
                                                    <span>{owner.phone_number || 'Non renseigné'}</span>
                                                </div>
                                                <div className="flex items-center gap-3 text-sm text-slate-600">
                                                    <Calendar size={16} className="text-slate-400" />
                                                    <span>Inscrit le {new Date(owner.created_at).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-center py-4 text-slate-400 italic">
                                            Informations propriétaire indisponibles
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Admin Actions */}
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 font-bold text-slate-700">
                                    Actions Administrateur
                                </div>
                                <div className="p-6 space-y-3">
                                    {!property.is_validated && (
                                        <button
                                            onClick={() => onValidate(property.id)}
                                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-indigo-200 shadow-md transition-all flex items-center justify-center gap-2 group"
                                        >
                                            <CheckCircle size={18} className="group-hover:scale-110 transition-transform" />
                                            Valider ce bien
                                        </button>
                                    )}

                                    <button
                                        onClick={() => onDelete(property.id)}
                                        className="w-full py-3 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
                                    >
                                        Supprimer le bien
                                    </button>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PropertyDetailsModal;
