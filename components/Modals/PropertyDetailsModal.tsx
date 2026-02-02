import React, { useState, useEffect } from 'react';
import { X, MapPin, User, Phone, Mail, Calendar, CheckCircle, AlertTriangle, Edit, Save } from 'lucide-react';
import { Property, propertyService } from '../../api/services';
import toast from 'react-hot-toast';

interface PropertyDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    property: Property | null;
    onValidate: (id: number) => void;
    onDelete: (id: number) => void;
    onUpdate?: (updatedProperty: Property) => void;
}

const PropertyDetailsModal: React.FC<PropertyDetailsModalProps> = ({
    isOpen,
    onClose,
    property,
    onValidate,
    onDelete,
    onUpdate
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<any>({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (property) {
            setFormData({
                title: property.attributes?.title || property.attributes?.titre || '',
                description: property.attributes?.description || '',
                price: property.attributes?.price || 0,
                status: property.status || 'for_sale',
                address: property.attributes?.address || '',
                city: property.attributes?.city || '',
                attributes: { ...property.attributes }
            });
            setIsEditing(false);
        }
    }, [property]);

    if (!isOpen || !property) return null;

    // Helper to safely access owner details
    const owner = (property as any).owner_details;
    const images = property.image_urls || [];
    const mainImage = images.length > 0 ? images[0] : 'https://via.placeholder.com/600x400?text=No+Image';

    const formatPrice = (price: any) => {
        if (!price) return 'N/A';
        return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(Number(price));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Prepare update data
            const updateData = {
                attributes: {
                    ...formData.attributes, // Keep existing dynamic attributes
                    title: formData.title,
                    description: formData.description,
                    price: Number(formData.price),
                    address: formData.address,
                    city: formData.city,
                    status: formData.status
                },
                status: formData.status // Also at root
            };

            const response = await propertyService.updateProperty(property.id, updateData);

            toast.success("Bien mis à jour avec succès");
            setIsEditing(false);

            if (onUpdate && response.property) {
                onUpdate(response.property);
            }
        } catch (error) {
            console.error(error);
            toast.error("Erreur lors de la mise à jour");
        } finally {
            setSaving(false);
        }
    };

    const handleInputChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
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
                            {isEditing ? 'Modification du Bien' : 'Détails du Bien'}
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
                    <div className="flex items-center gap-2">
                        {!isEditing ? (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg font-semibold transition-colors flex items-center gap-2"
                            >
                                <Edit size={16} /> Modifier
                            </button>
                        ) : (
                            <>
                                <button
                                    onClick={() => setIsEditing(false)}
                                    className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg font-medium transition-colors"
                                    disabled={saving}
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg font-semibold transition-colors flex items-center gap-2 shadow-sm"
                                >
                                    {saving ? 'Enregistrement...' : <><Save size={16} /> Enregistrer</>}
                                </button>
                            </>
                        )}
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors ml-2">
                            <X size={24} className="text-slate-400" />
                        </button>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                        {/* Left Column: Images & Key Stats */}
                        <div className="lg:col-span-2 space-y-6">

                            {/* Main Image Banner */}
                            {!isEditing ? (
                                <div className="rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm relative group h-64 sm:h-80">
                                    <img src={mainImage} alt="Main" className="w-full h-full object-cover" />
                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                                        <div className="text-white">
                                            <h1 className="text-2xl sm:text-3xl font-bold mb-1">{property.attributes?.title || property.attributes?.titre || 'Titre inconnu'}</h1>
                                            <p className="flex items-center text-slate-200 font-medium">
                                                <MapPin size={18} className="mr-1" />
                                                {property.attributes?.address}, {property.attributes?.city}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-4 py-2 rounded-lg shadow-lg font-bold text-slate-900 text-lg">
                                        {formatPrice(property.attributes?.price)}
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4 bg-slate-50 p-5 rounded-xl border border-slate-200">
                                    <h3 className="font-bold text-slate-800">Informations Principales</h3>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Titre</label>
                                        <input
                                            type="text"
                                            value={formData.title}
                                            onChange={(e) => handleInputChange('title', e.target.value)}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Prix (FCFA)</label>
                                            <input
                                                type="number"
                                                value={formData.price}
                                                onChange={(e) => handleInputChange('price', e.target.value)}
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Statut</label>
                                            <select
                                                value={formData.status}
                                                onChange={(e) => handleInputChange('status', e.target.value)}
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                                            >
                                                <option value="for_sale">À Vendre</option>
                                                <option value="for_rent">À Louer</option>
                                                <option value="vefa">VEFA</option>
                                                <option value="bailler">Bailler</option>
                                                <option value="location_vente">Location-vente</option>
                                                <option value="sold">Vendu</option>
                                                <option value="rented">Loué</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Ville</label>
                                            <input
                                                type="text"
                                                value={formData.city}
                                                onChange={(e) => handleInputChange('city', e.target.value)}
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Adresse</label>
                                            <input
                                                type="text"
                                                value={formData.address}
                                                onChange={(e) => handleInputChange('address', e.target.value)}
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Gallery Grid */}
                            {!isEditing && images.length > 1 && (
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
                                    {isEditing ? (
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => handleInputChange('description', e.target.value)}
                                            rows={6}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                    ) : (
                                        <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
                                            {property.attributes?.description || "Aucune description fournie."}
                                        </p>
                                    )}
                                </div>

                                {!isEditing && (
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Caractéristiques</h3>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                            {Object.entries(property.attributes || {}).map(([key, value]) => {
                                                if (['title', 'titre', 'description', 'price', 'address', 'city', 'latitude', 'longitude', 'status', 'property_type_id'].includes(key)) return null;
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
                                )}
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
