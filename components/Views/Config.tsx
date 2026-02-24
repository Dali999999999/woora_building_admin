import React, { useState, useEffect } from 'react';
import {
  Layers, Plus, Database, Edit2, Trash2, Settings2, Check,
  Pencil, Tag, SlidersHorizontal, ChevronRight, X, Save,
  ToggleLeft, Hash, Type, List
} from 'lucide-react';
import { configService } from '../../api/services';
import toast from 'react-hot-toast';
import AttributeModal from '../Modals/AttributeModal';
import TypeModal from '../Modals/TypeModal';

// --- Sub-components ---

const DataTypeBadge: React.FC<{ dataType: string }> = ({ dataType }) => {
  const config: Record<string, { label: string; classes: string; Icon: any }> = {
    enum: { label: 'Choix', classes: 'bg-violet-50 text-violet-700 border-violet-200', Icon: List },
    boolean: { label: 'Booléen', classes: 'bg-amber-50 text-amber-700 border-amber-200', Icon: ToggleLeft },
    integer: { label: 'Entier', classes: 'bg-sky-50 text-sky-700 border-sky-200', Icon: Hash },
    decimal: { label: 'Décimal', classes: 'bg-sky-50 text-sky-700 border-sky-200', Icon: Hash },
    string: { label: 'Texte', classes: 'bg-emerald-50 text-emerald-700 border-emerald-200', Icon: Type },
  };
  const c = config[dataType] || { label: dataType, classes: 'bg-slate-100 text-slate-600 border-slate-200', Icon: Tag };
  const { label, classes, Icon } = c;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${classes}`}>
      <Icon size={11} />
      {label}
    </span>
  );
};

const EmptyState: React.FC<{ icon: any; title: string; description: string }> = ({ icon: Icon, title, description }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
      <Icon size={28} className="text-slate-400" />
    </div>
    <h3 className="text-base font-semibold text-slate-700 mb-1">{title}</h3>
    <p className="text-sm text-slate-400 max-w-xs">{description}</p>
  </div>
);

// --- Main Component ---

const ConfigView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'types' | 'attributes'>('types');
  const [types, setTypes] = useState<any[]>([]);
  const [attributes, setAttributes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [configuringType, setConfiguringType] = useState<any | null>(null);
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
  const [editingTypeMetadata, setEditingTypeMetadata] = useState<any | null>(null);
  const [isAttributeModalOpen, setIsAttributeModalOpen] = useState(false);
  const [editingAttribute, setEditingAttribute] = useState<any | null>(null);

  useEffect(() => { fetchConfig(); }, []);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const [typesData, attrsData] = await Promise.all([
        configService.getPropertyTypesWithAttributes(),
        configService.getAllAttributes()
      ]);
      setTypes(typesData);
      setAttributes(attrsData);
    } catch {
      toast.error("Erreur de chargement de la configuration");
    } finally {
      setLoading(false);
    }
  };

  const openCreateTypeModal = () => { setEditingTypeMetadata(null); setIsTypeModalOpen(true); };
  const openEditTypeModal = (type: any, e: React.MouseEvent) => { e.stopPropagation(); setEditingTypeMetadata(type); setIsTypeModalOpen(true); };

  const handleSaveType = async (typeData: any) => {
    try {
      if (editingTypeMetadata) {
        await configService.updatePropertyType(editingTypeMetadata.id, typeData);
        toast.success("Type mis à jour");
        if (configuringType?.id === editingTypeMetadata.id) setConfiguringType((prev: any) => ({ ...prev, ...typeData }));
      } else {
        await configService.createPropertyType(typeData.name, typeData.description);
        toast.success("Type créé");
      }
      fetchConfig();
    } catch (error: any) { throw error; }
  };

  const handleDeleteType = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Supprimer ce type de bien ?")) return;
    try {
      await configService.deletePropertyType(id);
      toast.success("Type supprimé");
      if (configuringType?.id === id) setConfiguringType(null);
      fetchConfig();
    } catch { toast.error("Erreur suppression"); }
  };

  const toggleAttributeForType = (attrId: number) => {
    if (!configuringType) return;
    const currentAttrIds = configuringType.attributes.map((a: any) => a.id);
    const newAttrIds = currentAttrIds.includes(attrId)
      ? currentAttrIds.filter((id: number) => id !== attrId)
      : [...currentAttrIds, attrId];
    setConfiguringType({ ...configuringType, attributes: newAttrIds.map((id: number) => attributes.find(a => a.id === id)).filter(Boolean) });
  };

  const saveTypeScopes = async () => {
    if (!configuringType) return;
    try {
      await configService.updateTypeScopes(configuringType.id, configuringType.attributes.map((a: any) => a.id));
      toast.success("Configuration sauvegardée !");
      setConfiguringType(null);
      fetchConfig();
    } catch { toast.error("Erreur de sauvegarde"); }
  };

  const openCreateAttributeModal = () => { setEditingAttribute(null); setIsAttributeModalOpen(true); };
  const openEditAttributeModal = (attr: any) => { setEditingAttribute(attr); setIsAttributeModalOpen(true); };

  const handleSaveAttribute = async (data: any) => {
    try {
      if (editingAttribute) {
        await configService.updateAttribute(editingAttribute.id, data);
        toast.success("Attribut mis à jour");
      } else {
        await configService.createAttribute(data);
        toast.success("Attribut créé");
      }
      fetchConfig();
    } catch (error: any) { throw error; }
  };

  const handleDeleteAttribute = async (id: number) => {
    if (!window.confirm("Supprimer cet attribut ?")) return;
    try {
      await configService.deleteAttribute(id);
      toast.success("Attribut supprimé");
      fetchConfig();
    } catch (e: any) {
      if (e.response?.status === 409) {
        toast.error(e.response.data.message || "Impossible : utilisé par des biens.", { duration: 5000 });
      } else {
        toast.error("Erreur suppression");
      }
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center">
        <div className="inline-flex items-center gap-3 text-slate-400">
          <div className="w-5 h-5 border-2 border-slate-300 border-t-indigo-500 rounded-full animate-spin" />
          <span className="font-medium">Chargement de la configuration...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* === PAGE HEADER === */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Configuration Immobilière</h2>
          <p className="text-slate-500 text-sm mt-0.5">Gérez la structure des données de vos biens immobiliers.</p>
        </div>
        {activeTab === 'types' ? (
          <button onClick={openCreateTypeModal} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm shadow-indigo-200 transition-all">
            <Plus size={16} /> Nouveau Type
          </button>
        ) : (
          <button onClick={openCreateAttributeModal} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm shadow-indigo-200 transition-all">
            <Plus size={16} /> Nouvel Attribut
          </button>
        )}
      </div>

      {/* === TAB BAR === */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit border border-slate-200 shadow-inner">
        {['types', 'attributes'].map((tab) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab as any); setConfiguringType(null); }}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === tab
              ? 'bg-white text-indigo-700 shadow-sm border border-slate-200'
              : 'text-slate-500 hover:text-slate-700'}`}
          >
            {tab === 'types' ? <><Layers size={15} /> Types de Biens <span className="ml-1 bg-indigo-100 text-indigo-600 text-[10px] px-1.5 py-0.5 rounded-full font-bold">{types.length}</span></>
              : <><Database size={15} /> Attributs Globaux <span className="ml-1 bg-indigo-100 text-indigo-600 text-[10px] px-1.5 py-0.5 rounded-full font-bold">{attributes.length}</span></>
            }
          </button>
        ))}
      </div>

      {/* === CONTENT AREA === */}
      <div className="flex gap-6">

        {/* --- MAIN COLUMN --- */}
        <div className="flex-1 min-w-0">

          {/* TYPES TAB */}
          {activeTab === 'types' && (
            <>
              {types.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
                  <EmptyState icon={Layers} title="Aucun type configuré" description="Créez votre premier type de bien pour structurer le catalogue." />
                </div>
              ) : (
                <div className="space-y-3">
                  {types.map(type => {
                    const isActive = configuringType?.id === type.id;
                    return (
                      <div
                        key={type.id}
                        onClick={() => setConfiguringType(type)}
                        className={`group bg-white rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden
                          ${isActive
                            ? 'border-indigo-400 ring-2 ring-indigo-100 shadow-md'
                            : 'border-slate-200 hover:border-indigo-300 hover:shadow-sm'}`}
                      >
                        <div className="p-5 flex items-start gap-4">
                          {/* Icon */}
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${isActive ? 'bg-indigo-600' : 'bg-slate-100 group-hover:bg-indigo-50'}`}>
                            <Layers size={18} className={isActive ? 'text-white' : 'text-slate-500 group-hover:text-indigo-600'} />
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <h3 className="text-base font-bold text-slate-800">{type.name}</h3>
                              <span className="text-xs text-slate-400 font-medium bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full">
                                {type.attributes?.length || 0} attributs
                              </span>
                            </div>
                            <p className="text-sm text-slate-500 mb-3">{type.description || 'Aucune description'}</p>

                            {/* Attribute chips */}
                            <div className="flex flex-wrap gap-1.5">
                              {type.attributes && type.attributes.slice(0, 8).map((attr: any) => (
                                <span key={attr.id} className="text-xs bg-slate-50 text-slate-600 border border-slate-200 px-2.5 py-0.5 rounded-full font-medium">
                                  {attr.name}
                                </span>
                              ))}
                              {type.attributes?.length > 8 && (
                                <span className="text-xs bg-indigo-50 text-indigo-600 border border-indigo-200 px-2.5 py-0.5 rounded-full font-medium">
                                  +{type.attributes.length - 8} autres
                                </span>
                              )}
                              {(!type.attributes || type.attributes.length === 0) && (
                                <span className="text-xs text-slate-400 italic">Aucun attribut associé</span>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              onClick={(e) => openEditTypeModal(type, e)}
                              className="p-2 rounded-lg text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                              title="Modifier"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              onClick={(e) => handleDeleteType(type.id, e)}
                              className="p-2 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 size={16} />
                            </button>
                            <div className={`flex items-center gap-1 ml-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${isActive ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-700'}`}>
                              <SlidersHorizontal size={12} />
                              {isActive ? 'En cours' : 'Config.'}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* ATTRIBUTES TAB */}
          {activeTab === 'attributes' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {attributes.length === 0 ? (
                <EmptyState icon={Database} title="Aucun attribut configuré" description="Créez des attributs réutilisables (ex: Piscine, Garage, Superficie)." />
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Attribut</th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Filtrable</th>
                      <th className="px-6 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {attributes.map(attr => (
                      <tr key={attr.id} className="hover:bg-slate-50/70 group transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Tag size={13} className="text-slate-500" />
                            </div>
                            <span className="font-semibold text-slate-800">{attr.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <DataTypeBadge dataType={attr.data_type} />
                        </td>
                        <td className="px-6 py-4">
                          {attr.is_filterable
                            ? <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full"><Check size={11} strokeWidth={3} /> Oui</span>
                            : <span className="text-xs text-slate-400 font-medium">—</span>
                          }
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() => openEditAttributeModal(attr)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                              title="Modifier"
                            >
                              <Edit2 size={15} />
                            </button>
                            <button
                              onClick={() => handleDeleteAttribute(attr.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>

        {/* --- SIDEBAR PANEL --- */}
        <div className="w-[320px] flex-shrink-0">
          {configuringType && activeTab === 'types' ? (
            /* CONFIG PANEL */
            <div className="bg-white rounded-2xl border border-indigo-200 shadow-md sticky top-6 overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <Settings2 size={16} className="text-white" />
                  </div>
                  <div>
                    <p className="text-indigo-200 text-[10px] font-semibold uppercase tracking-wider">Configuration</p>
                    <h3 className="text-white font-bold text-sm leading-tight">{configuringType.name}</h3>
                  </div>
                </div>
                <button onClick={() => setConfiguringType(null)} className="p-1.5 rounded-lg hover:bg-white/20 text-indigo-200 transition-colors">
                  <X size={16} />
                </button>
              </div>

              {/* Body */}
              <div className="p-4">
                <p className="text-xs text-slate-500 mb-3">Cochez les attributs qui s'appliquent à ce type de bien.</p>

                <div className="space-y-1 max-h-[50vh] overflow-y-auto pr-1">
                  {attributes.length === 0 ? (
                    <p className="text-xs text-center text-slate-400 italic py-4">Créez d'abord des attributs globaux.</p>
                  ) : (
                    attributes.map(attr => {
                      const isChecked = configuringType.attributes.some((a: any) => a.id === attr.id);
                      return (
                        <label
                          key={attr.id}
                          onClick={() => toggleAttributeForType(attr.id)}
                          className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all select-none
                            ${isChecked ? 'bg-indigo-50 border border-indigo-200' : 'hover:bg-slate-50 border border-transparent'}`}
                        >
                          {/* Custom checkbox */}
                          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all
                            ${isChecked ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 bg-white'}`}>
                            {isChecked && <Check size={12} className="text-white" strokeWidth={3} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className={`text-sm font-medium ${isChecked ? 'text-indigo-900' : 'text-slate-700'}`}>{attr.name}</span>
                          </div>
                          <DataTypeBadge dataType={attr.data_type} />
                        </label>
                      );
                    })
                  )}
                </div>

                {/* Footer */}
                <div className="mt-4 pt-4 border-t border-slate-100 flex gap-2">
                  <button
                    onClick={saveTypeScopes}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
                  >
                    <Save size={14} /> Enregistrer
                  </button>
                  <button
                    onClick={() => setConfiguringType(null)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* GUIDE PANEL */
            <div className="bg-gradient-to-br from-slate-50 to-indigo-50/30 rounded-2xl border border-indigo-100 p-5 sticky top-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <Database size={15} className="text-indigo-600" />
                </div>
                <h3 className="font-bold text-slate-800 text-sm">Guide rapide</h3>
              </div>

              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">1</div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Créez vos attributs</p>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">Définissez les caractéristiques réutilisables (ex: Piscine, Garage, Superficie) dans l'onglet <strong>Attributs Globaux</strong>.</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">2</div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Configurez vos types</p>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">Créez des types (ex: Villa, Appartement) et cliquez sur une carte pour associer les attributs correspondants.</p>
                  </div>
                </div>

                <div className="p-3 bg-white rounded-xl border border-indigo-100 text-xs text-indigo-800 leading-relaxed">
                  💡 <span className="font-medium">Astuce :</span> Un attribut comme <em>"Piscine"</em> peut être partagé entre Villa et Hôtel.
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-indigo-100">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span>Types configurés</span>
                  <span className="font-bold text-slate-700">{types.length}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Attributs disponibles</span>
                  <span className="font-bold text-slate-700">{attributes.length}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODALS */}
      <AttributeModal isOpen={isAttributeModalOpen} onClose={() => setIsAttributeModalOpen(false)} onSave={handleSaveAttribute} initialData={editingAttribute} />
      <TypeModal isOpen={isTypeModalOpen} onClose={() => setIsTypeModalOpen(false)} onSave={handleSaveType} initialData={editingTypeMetadata} />
    </div>
  );
};

export default ConfigView;