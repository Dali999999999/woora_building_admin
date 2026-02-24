import React, { useState, useEffect, useRef } from 'react';
import {
  Layers, Plus, Database, Edit2, Trash2, Settings2, Check,
  Pencil, Tag, SlidersHorizontal, X, Save,
  ToggleLeft, Hash, Type, List, GripVertical, ArrowUpDown
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

// --- Drag-and-Drop Attribute List for Sidebar ---

interface DraggableAttrListProps {
  allAttributes: any[];
  selectedAttributes: any[];     // ordered list of currently selected attrs
  onOrderChange: (newOrdered: any[]) => void;
  onToggle: (attrId: number) => void;
}

const DraggableAttrList: React.FC<DraggableAttrListProps> = ({ allAttributes, selectedAttributes, onOrderChange, onToggle }) => {
  const selectedIds = new Set(selectedAttributes.map((a: any) => a.id));
  const unselected = allAttributes.filter(a => !selectedIds.has(a.id));

  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  const handleDragStart = (index: number) => { dragItem.current = index; };
  const handleDragEnter = (index: number) => { dragOverItem.current = index; };

  const handleDrop = () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    const updated = [...selectedAttributes];
    const [moved] = updated.splice(dragItem.current, 1);
    updated.splice(dragOverItem.current, 0, moved);
    dragItem.current = null;
    dragOverItem.current = null;
    onOrderChange(updated);
  };

  return (
    <div className="space-y-3">
      {/* SELECTED (ordered) */}
      {selectedAttributes.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <ArrowUpDown size={12} className="text-indigo-500" />
            <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider">Actifs — Glisser pour réordonner</span>
          </div>
          <div className="space-y-1">
            {selectedAttributes.map((attr: any, index: number) => (
              <div
                key={attr.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragEnter={() => handleDragEnter(index)}
                onDragEnd={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                className="flex items-center gap-2.5 p-2.5 rounded-xl bg-indigo-50 border border-indigo-200 cursor-grab active:cursor-grabbing group select-none transition-all"
              >
                {/* Grip */}
                <GripVertical size={16} className="text-indigo-300 flex-shrink-0 group-hover:text-indigo-500 transition-colors" />

                {/* Order badge */}
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                  {index + 1}
                </span>

                {/* Name */}
                <span className="flex-1 text-sm font-semibold text-indigo-900 truncate">{attr.name}</span>

                {/* Type badge */}
                <DataTypeBadge dataType={attr.data_type} />

                {/* Toggle off */}
                <button
                  onClick={() => onToggle(attr.id)}
                  className="p-1 rounded-lg ml-1 text-indigo-400 hover:text-rose-500 hover:bg-rose-50 transition-colors flex-shrink-0"
                  title="Retirer"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* UNSELECTED */}
      {unselected.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2 mt-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Non actifs</span>
          </div>
          <div className="space-y-1">
            {unselected.map((attr: any) => (
              <div
                key={attr.id}
                onClick={() => onToggle(attr.id)}
                className="flex items-center gap-2.5 p-2.5 rounded-xl border border-transparent hover:bg-slate-50 hover:border-slate-200 cursor-pointer group select-none transition-all"
              >
                <div className="w-4 h-4 rounded-md border-2 border-slate-300 bg-white flex-shrink-0 group-hover:border-indigo-400 transition-colors" />
                <span className="flex-1 text-sm text-slate-600 truncate group-hover:text-slate-800">{attr.name}</span>
                <DataTypeBadge dataType={attr.data_type} />
              </div>
            ))}
          </div>
        </div>
      )}

      {allAttributes.length === 0 && (
        <p className="text-xs text-center text-slate-400 italic py-4">Créez d'abord des attributs globaux.</p>
      )}
    </div>
  );
};

// --- Main Component ---

const ConfigView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'types' | 'attributes'>('types');
  const [types, setTypes] = useState<any[]>([]);
  const [attributes, setAttributes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // configuringType holds the type and its LOCAL ordered attribute list (for editing)
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

  const selectTypeForConfig = (type: any) => {
    // Keep attributes in sort_order when entering config mode
    const sortedAttrs = [...(type.attributes || [])].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    setConfiguringType({ ...type, attributes: sortedAttrs });
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

  // Toggle attribute in configuringType (add at end or remove)
  const toggleAttributeForType = (attrId: number) => {
    if (!configuringType) return;
    const currentAttrs: any[] = configuringType.attributes;
    const idx = currentAttrs.findIndex((a: any) => a.id === attrId);
    if (idx >= 0) {
      setConfiguringType({ ...configuringType, attributes: currentAttrs.filter((a: any) => a.id !== attrId) });
    } else {
      const newAttr = attributes.find(a => a.id === attrId);
      if (newAttr) setConfiguringType({ ...configuringType, attributes: [...currentAttrs, newAttr] });
    }
  };

  const handleOrderChange = (newOrdered: any[]) => {
    setConfiguringType({ ...configuringType, attributes: newOrdered });
  };

  const saveTypeScopes = async () => {
    if (!configuringType) return;
    try {
      // Send in current order — the API uses array index as sort_order
      const attrIds = configuringType.attributes.map((a: any) => a.id);
      await configService.updateTypeScopes(configuringType.id, attrIds);
      toast.success("Configuration et ordre sauvegardés !");
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
          <p className="text-slate-500 text-sm mt-0.5">Gérez la structure et l'ordre des données de vos biens immobiliers.</p>
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
            {tab === 'types' ? (
              <><Layers size={15} /> Types de Biens <span className="ml-1 bg-indigo-100 text-indigo-600 text-[10px] px-1.5 py-0.5 rounded-full font-bold">{types.length}</span></>
            ) : (
              <><Database size={15} /> Attributs Globaux <span className="ml-1 bg-indigo-100 text-indigo-600 text-[10px] px-1.5 py-0.5 rounded-full font-bold">{attributes.length}</span></>
            )}
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
                    const sortedAttrs = [...(type.attributes || [])].sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
                    return (
                      <div
                        key={type.id}
                        onClick={() => selectTypeForConfig(type)}
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
                                {sortedAttrs.length} attributs
                              </span>
                            </div>
                            <p className="text-sm text-slate-500 mb-3">{type.description || 'Aucune description'}</p>

                            {/* Attribute chips (sorted by sort_order) */}
                            <div className="flex flex-wrap gap-1.5">
                              {sortedAttrs.slice(0, 8).map((attr: any, i: number) => (
                                <span key={attr.id} className="inline-flex items-center gap-1 text-xs bg-slate-50 text-slate-600 border border-slate-200 px-2.5 py-0.5 rounded-full font-medium">
                                  <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-600 text-[9px] font-bold flex items-center justify-center">{i + 1}</span>
                                  {attr.name}
                                </span>
                              ))}
                              {sortedAttrs.length > 8 && (
                                <span className="text-xs bg-indigo-50 text-indigo-600 border border-indigo-200 px-2.5 py-0.5 rounded-full font-medium">
                                  +{sortedAttrs.length - 8} autres
                                </span>
                              )}
                              {sortedAttrs.length === 0 && (
                                <span className="text-xs text-slate-400 italic">Aucun attribut associé</span>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button onClick={(e) => openEditTypeModal(type, e)} className="p-2 rounded-lg text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors" title="Modifier">
                              <Pencil size={16} />
                            </button>
                            <button onClick={(e) => handleDeleteType(type.id, e)} className="p-2 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors" title="Supprimer">
                              <Trash2 size={16} />
                            </button>
                            <div className={`flex items-center gap-1.5 ml-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${isActive ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-700'}`}>
                              <SlidersHorizontal size={12} />
                              {isActive ? 'En cours' : 'Configurer'}
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
                        <td className="px-6 py-4"><DataTypeBadge dataType={attr.data_type} /></td>
                        <td className="px-6 py-4">
                          {attr.is_filterable
                            ? <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full"><Check size={11} strokeWidth={3} /> Oui</span>
                            : <span className="text-xs text-slate-400 font-medium">—</span>
                          }
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-end gap-1">
                            <button onClick={() => openEditAttributeModal(attr)} className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors" title="Modifier"><Edit2 size={15} /></button>
                            <button onClick={() => handleDeleteAttribute(attr.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors" title="Supprimer"><Trash2 size={15} /></button>
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
        <div className="w-[340px] flex-shrink-0">
          {configuringType && activeTab === 'types' ? (
            /* CONFIG PANEL with Drag-and-Drop */
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
                <p className="text-xs text-slate-500 mb-3">
                  Activez les attributs et <strong className="text-slate-700">glissez-les</strong> pour définir leur ordre d'affichage dans l'app mobile.
                </p>

                <div className="max-h-[55vh] overflow-y-auto pr-0.5">
                  <DraggableAttrList
                    allAttributes={attributes}
                    selectedAttributes={configuringType.attributes}
                    onToggle={toggleAttributeForType}
                    onOrderChange={handleOrderChange}
                  />
                </div>

                {/* Footer */}
                <div className="mt-4 pt-4 border-t border-slate-100 flex gap-2">
                  <button
                    onClick={saveTypeScopes}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
                  >
                    <Save size={14} /> Enregistrer l'ordre
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
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">Définissez les caractéristiques réutilisables dans l'onglet <strong>Attributs Globaux</strong>.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">2</div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Configurez vos types</p>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">Cliquez sur un type pour ouvrir le panneau de configuration et choisir les attributs.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">3</div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Réordonnez par glisser-déposer</p>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">Dans le panneau, glissez les attributs actifs pour définir leur ordre d'affichage dans l'app mobile.</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 bg-white rounded-xl border border-indigo-100 text-xs text-indigo-800">
                  <GripVertical size={14} className="text-indigo-400 flex-shrink-0" />
                  <span><strong>Astuce :</strong> L'ordre sauvegardé ici définit directement l'ordre dans l'application mobile.</span>
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