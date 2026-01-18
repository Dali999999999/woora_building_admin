import React, { useState, useEffect } from 'react';
import { Layers, Plus, Database, Edit2, Trash, Settings2, Check, Pencil } from 'lucide-react';
import { configService } from '../../api/services';
import toast from 'react-hot-toast';
import AttributeModal from '../Modals/AttributeModal';
import TypeModal from '../Modals/TypeModal';

const ConfigView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'types' | 'attributes'>('types');
  const [types, setTypes] = useState<any[]>([]);
  const [attributes, setAttributes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // State for Type Configuration (Associating Attributes)
  const [configuringType, setConfiguringType] = useState<any | null>(null);

  // State for Type Modal (Create/Edit Metadata)
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
  const [editingTypeMetadata, setEditingTypeMetadata] = useState<any | null>(null);

  // State for Attribute Modal
  const [isAttributeModalOpen, setIsAttributeModalOpen] = useState(false);
  const [editingAttribute, setEditingAttribute] = useState<any | null>(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const [typesData, attrsData] = await Promise.all([
        configService.getPropertyTypesWithAttributes(),
        configService.getAllAttributes()
      ]);
      setTypes(typesData);
      setAttributes(attrsData);
    } catch (error) {
      console.error(error);
      toast.error("Erreur de chargement de la configuration");
    } finally {
      setLoading(false);
    }
  };

  // --- TYPE MANAGEMENT ---
  const openCreateTypeModal = () => {
    setEditingTypeMetadata(null);
    setIsTypeModalOpen(true);
  };

  const openEditTypeModal = (type: any, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening the config sidebar
    setEditingTypeMetadata(type);
    setIsTypeModalOpen(true);
  };

  const handleSaveType = async (typeData: any) => {
    try {
      if (editingTypeMetadata) {
        // UPDATE
        await configService.updatePropertyType(editingTypeMetadata.id, typeData);
        toast.success("Type mis à jour");
        // If we are currently configuring this type, update the sidebar title too
        if (configuringType && configuringType.id === editingTypeMetadata.id) {
          setConfiguringType((prev: any) => ({ ...prev, ...typeData }));
        }
      } else {
        // CREATE
        await configService.createPropertyType(typeData.name, typeData.description);
        toast.success("Type créé");
      }
      fetchConfig();
    } catch (error: any) {
      console.error("Config save error:", error);
      throw error;
    }
  };

  const handleDeleteType = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Supprimer ce type de bien ? \n\nLes biens existants de ce type devront être reclassés manually ou via une future migration.")) return;
    try {
      await configService.deletePropertyType(id);
      toast.success("Type supprimé");
      if (configuringType?.id === id) setConfiguringType(null);
      fetchConfig();
    } catch (e: any) {
      console.error(e);
      toast.error("Erreur suppression");
    }
  }


  const toggleAttributeForType = (typeId: number, attrId: number) => {
    if (!configuringType) return;
    const currentAttrIds = configuringType.attributes.map((a: any) => a.id);
    const hasAttr = currentAttrIds.includes(attrId);

    let newAttrIds;
    if (hasAttr) {
      newAttrIds = currentAttrIds.filter((id: number) => id !== attrId);
    } else {
      newAttrIds = [...currentAttrIds, attrId];
    }

    // Optimistic update locally for UI
    const updatedType = {
      ...configuringType,
      attributes: newAttrIds.map((id: number) => attributes.find(a => a.id === id))
    };
    setConfiguringType(updatedType);
  };

  const saveTypeScopes = async () => {
    if (!configuringType) return;
    try {
      const attrIds = configuringType.attributes.map((a: any) => a.id);
      await configService.updateTypeScopes(configuringType.id, attrIds);
      toast.success("Configuration sauvegardée");
      setConfiguringType(null);
      fetchConfig();
    } catch (error) {
      console.error(error);
      toast.error("Erreur de sauvegarde");
    }
  };

  // --- ATTRIBUTE MANAGEMENT ---
  const openCreateAttributeModal = () => {
    setEditingAttribute(null);
    setIsAttributeModalOpen(true);
  };

  const openEditAttributeModal = (attr: any) => {
    setEditingAttribute(attr);
    setIsAttributeModalOpen(true);
  };

  const handleSaveAttribute = async (attributeData: any) => {
    try {
      if (editingAttribute) {
        // UPDATE
        await configService.updateAttribute(editingAttribute.id, attributeData);
        toast.success("Attribut mis à jour");
      } else {
        // CREATE
        await configService.createAttribute(attributeData);
        toast.success("Attribut créé");
      }
      fetchConfig(); // Refresh list
    } catch (error: any) {
      console.error("Config save error:", error);
      throw error;
    }
  };

  const handleDeleteAttribute = async (id: number) => {
    if (!window.confirm("Supprimer cet attribut ? \n\nATTENTION : S'il est utilisé par des biens, la suppression sera bloquée par le serveur.")) return;
    try {
      await configService.deleteAttribute(id);
      toast.success("Attribut supprimé");
      fetchConfig();
    } catch (e: any) {
      console.error(e);
      if (e.response && e.response.status === 409) {
        toast.error(e.response.data.message || "Impossible de supprimer : utilisé par des biens.", { duration: 5000 });
      } else {
        toast.error("Erreur suppression");
      }
    }
  }

  if (loading) return <div className="p-8 text-center text-slate-500">Chargement de la configuration...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Configuration Immobilière</h2>
          <p className="text-slate-500">Gérez la structure des données de vos biens.</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white p-1 rounded-xl border border-slate-200 inline-flex shadow-sm">
        <button
          onClick={() => { setActiveTab('types'); setConfiguringType(null); }}
          className={`px-6 py-2.5 rounded-lg text-sm font-medium flex items-center transition-all ${activeTab === 'types'
            ? 'bg-slate-800 text-white shadow'
            : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
        >
          <Layers size={18} className="mr-2" />
          Types de Biens
        </button>
        <button
          // Click on attributes tab clears type editing
          onClick={() => { setActiveTab('attributes'); setConfiguringType(null); }}
          className={`px-6 py-2.5 rounded-lg text-sm font-medium flex items-center transition-all ${activeTab === 'attributes'
            ? 'bg-slate-800 text-white shadow'
            : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
        >
          <Database size={18} className="mr-2" />
          Attributs Global
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-4">

          {activeTab === 'types' && (
            <>
              <div className="flex justify-end">
                <button
                  onClick={openCreateTypeModal}
                  className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium flex items-center shadow-indigo-100 shadow-md"
                >
                  <Plus size={16} className="mr-1" /> Nouveau Type
                </button>
              </div>
              {types.map(type => (
                <div
                  key={type.id}
                  onClick={() => setConfiguringType(type)}
                  className={`bg-white rounded-xl shadow-sm border transition-all cursor-pointer ${configuringType?.id === type.id ? 'border-indigo-500 ring-1 ring-indigo-500 shadow-md transform scale-[1.01]' : 'border-slate-200 hover:border-indigo-300'}`}
                >
                  <div className="p-5 flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-bold text-slate-800">{type.name}</h3>
                      </div>
                      <p className="text-slate-500 text-sm mt-1">{type.description || 'Aucune description'}</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {type.attributes && type.attributes.map((attr: any) => (
                          <span key={attr.id} className="bg-slate-50 text-slate-600 px-2 py-1 rounded text-xs font-medium border border-slate-200">
                            {attr.name}
                          </span>
                        ))}
                        {(!type.attributes || type.attributes.length === 0) && <span className="text-xs text-slate-400 italic">Aucun attribut spécifique associé</span>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => openEditTypeModal(type, e)}
                        className="p-2 rounded-lg text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                        title="Modifier nom/description"
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        onClick={(e) => handleDeleteType(type.id, e)}
                        className="p-2 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                        title="Supprimer le type"
                      >
                        <Trash size={18} />
                      </button>
                      {configuringType?.id !== type.id && (
                        <button
                          className="p-2 rounded-lg text-indigo-600 bg-indigo-50 font-medium text-xs self-center ml-2"
                        >
                          Configurer
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}

          {activeTab === 'attributes' && (
            <>
              <div className="flex justify-end">
                <button
                  onClick={openCreateAttributeModal}
                  className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium flex items-center shadow-indigo-100 shadow-md"
                >
                  <Plus size={16} className="mr-1" /> Nouvel Attribut
                </button>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden overflow-x-auto">
                <table className="w-full text-left text-sm min-w-[600px]">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 font-medium text-slate-500">Nom Attribut</th>
                      <th className="px-6 py-4 font-medium text-slate-500">Type de Donnée</th>
                      <th className="px-6 py-4 font-medium text-slate-500">Filtre ?</th>
                      <th className="px-6 py-4 font-medium text-slate-500 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {attributes.map(attr => (
                      <tr key={attr.id} className="hover:bg-slate-50 group transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-800">{attr.name}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-xs uppercase font-bold tracking-wider ${attr.data_type === 'enum' ? 'bg-purple-50 text-purple-700' :
                            attr.data_type === 'boolean' ? 'bg-orange-50 text-orange-700' :
                              attr.data_type === 'integer' || attr.data_type === 'decimal' ? 'bg-blue-50 text-blue-700' :
                                'bg-slate-100 text-slate-700'
                            }`}>
                            {attr.data_type}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {attr.is_filterable
                            ? <span className="text-emerald-600 flex items-center gap-1 text-xs font-bold"><Check size={14} strokeWidth={3} /> Oui</span>
                            : <span className="text-slate-400 text-xs">Non</span>}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => openEditAttributeModal(attr)}
                              className="p-1.5 rounded hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-colors"
                              title="Modifier"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteAttribute(attr.id)}
                              className="p-1.5 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                              title="Supprimer"
                            >
                              <Trash size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {attributes.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-10 text-center text-slate-400">
                          Aucun attribut configuré. Commencez par en créer un.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Sidebar for Editing Context (Types) */}
        <div className="space-y-4">
          {configuringType && activeTab === 'types' ? (
            <div className="bg-white p-5 rounded-xl shadow-lg border border-indigo-200 sticky top-4 animate-in slide-in-from-right duration-300">
              <div className="flex items-center gap-2 mb-4 text-indigo-700 pb-3 border-b border-indigo-50">
                <Settings2 size={20} />
                <h3 className="font-bold">Configuration: {configuringType.name}</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-in">Attributs associés</label>
                  <p className="text-xs text-slate-400 mb-2">Quelles caractéristiques définissent ce type de bien ?</p>
                  <div className="border border-slate-200 rounded-lg p-1 max-h-[60vh] overflow-y-auto space-y-0.5 bg-slate-50">
                    {attributes.map(attr => (
                      <label key={attr.id} className="flex items-center gap-3 p-2 hover:bg-white rounded cursor-pointer transition-colors group">
                        <div className="relative flex items-center">
                          <input
                            type="checkbox"
                            checked={configuringType.attributes.some((a: any) => a.id === attr.id)}
                            onChange={() => toggleAttributeForType(configuringType.id, attr.id)}
                            className="peer appearance-none w-5 h-5 border-2 border-slate-300 rounded checked:bg-indigo-600 checked:border-indigo-600 transition-colors"
                          />
                          <Check size={12} className="absolute inset-0 m-auto text-white opacity-0 peer-checked:opacity-100 pointer-events-none" strokeWidth={3} />
                        </div>
                        <span className="text-sm text-slate-700 font-medium group-hover:text-indigo-900">{attr.name}</span>
                      </label>
                    ))}
                    {attributes.length === 0 && <p className="text-xs p-3 text-center text-slate-400">Créez d'abord des attributs dans l'onglet "Attributs Global"</p>}
                  </div>
                </div>
                <div className="flex gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={saveTypeScopes}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg text-sm font-bold shadow-indigo-200 shadow-sm transition-all"
                  >
                    Enregistrer
                  </button>
                  <button
                    onClick={() => setConfiguringType(null)}
                    className="flex-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 py-2.5 rounded-lg text-sm font-medium transition-colors"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100 text-indigo-900/80">
              <div className="flex items-center gap-2 mb-3 text-indigo-700">
                <Database size={20} />
                <h3 className="font-bold">Guide Rapide</h3>
              </div>
              <div className="space-y-3 text-sm leading-relaxed">
                <p>
                  <strong className="text-indigo-800">1. Créez vos Attributs :</strong><br />
                  Définissez les caractéristiques réutilisables (ex: Piscine, Garage, Climatisation) dans l'onglet "Attributs Global".
                </p>
                <div className="h-px bg-indigo-200/50 my-2"></div>
                <p>
                  <strong className="text-indigo-800">2. Configurez vos Types :</strong><br />
                  Créez des types de biens (ex: Villa, Appartement) et cliquez sur <Edit2 size={12} className="inline" /> pour choisir quels attributs s'appliquent à chacun.
                </p>
                <div className="p-3 bg-white/60 rounded-lg text-xs mt-2 border border-indigo-100">
                  💡 <em>Astuce : Un attribut "Piscine" peut être utilisé à la fois pour une Villa et un Hôtel.</em>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODALS */}
      <AttributeModal
        isOpen={isAttributeModalOpen}
        onClose={() => setIsAttributeModalOpen(false)}
        onSave={handleSaveAttribute}
        initialData={editingAttribute}
      />

      <TypeModal
        isOpen={isTypeModalOpen}
        onClose={() => setIsTypeModalOpen(false)}
        onSave={handleSaveType}
        initialData={editingTypeMetadata}
      />
    </div>
  );
};

export default ConfigView;