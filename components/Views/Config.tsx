import React, { useState, useEffect } from 'react';
import { Layers, Plus, ToggleLeft, ToggleRight, Database, Edit2, Trash, Settings2 } from 'lucide-react';
import { configService } from '../../api/services';
import { PropertyType, PropertyAttribute } from '../../types';
import toast from 'react-hot-toast';

const ConfigView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'types' | 'attributes'>('types');
  const [types, setTypes] = useState<any[]>([]);
  const [attributes, setAttributes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingType, setEditingType] = useState<any | null>(null);

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

  const handleCreateType = async () => {
    const name = window.prompt("Nom du nouveau type de bien :");
    if (!name) return;
    try {
      await configService.createPropertyType(name);
      toast.success("Type créé");
      fetchConfig();
    } catch (error) {
      console.error(error);
      toast.error("Erreur de création");
    }
  };

  const handleCreateAttribute = async () => {
    const name = window.prompt("Nom du nouvel attribut :");
    if (!name) return;
    const type = window.prompt("Type de donnée (string, integer, boolean, decimal) :", "string");
    if (!type) return;

    try {
      await configService.createAttribute({ name, data_type: type, is_filterable: true });
      toast.success("Attribut créé");
      fetchConfig();
    } catch (error) {
      console.error(error);
      toast.error("Erreur de création");
    }
  };

  const toggleAttributeForType = (typeId: number, attrId: number) => {
    if (!editingType) return;
    // editingType.attributes is list of objects {id, name...}
    const currentAttrIds = editingType.attributes.map((a: any) => a.id);
    const hasAttr = currentAttrIds.includes(attrId);

    let newAttrIds;
    if (hasAttr) {
      newAttrIds = currentAttrIds.filter((id: number) => id !== attrId);
    } else {
      newAttrIds = [...currentAttrIds, attrId];
    }

    // Optimistic update locally for UI
    const updatedType = {
      ...editingType,
      attributes: newAttrIds.map((id: number) => attributes.find(a => a.id === id))
    };
    setEditingType(updatedType);
  };

  const saveTypeScopes = async () => {
    if (!editingType) return;
    try {
      const attrIds = editingType.attributes.map((a: any) => a.id);
      await configService.updateTypeScopes(editingType.id, attrIds);
      toast.success("Configuration sauvegardée");
      setEditingType(null);
      fetchConfig();
    } catch (error) {
      console.error(error);
      toast.error("Erreur de sauvegarde");
    }
  };

  const handleDeleteAttribute = async (id: number) => {
    if (!window.confirm("Supprimer cet attribut ? Cela l'enlèvera de tous les biens.")) return;
    try {
      await configService.deleteAttribute(id);
      toast.success("Attribut supprimé");
      fetchConfig();
    } catch (e) {
      console.error(e);
      toast.error("Erreur suppression");
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
          onClick={() => { setActiveTab('types'); setEditingType(null); }}
          className={`px-6 py-2.5 rounded-lg text-sm font-medium flex items-center transition-all ${activeTab === 'types'
              ? 'bg-slate-800 text-white shadow'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
        >
          <Layers size={18} className="mr-2" />
          Types de Biens
        </button>
        <button
          onClick={() => { setActiveTab('attributes'); setEditingType(null); }}
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
                  onClick={handleCreateType}
                  className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium flex items-center"
                >
                  <Plus size={16} className="mr-1" /> Nouveau Type
                </button>
              </div>
              {types.map(type => (
                <div key={type.id} className={`bg-white rounded-xl shadow-sm border transition-all ${editingType?.id === type.id ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-slate-200'}`}>
                  <div className="p-5 flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-bold text-slate-800">{type.name}</h3>
                        {/* Toggle active logic can be added later if backend supports simple toggle endpoint */}
                      </div>
                      <p className="text-slate-500 text-sm mt-1">{type.description}</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {type.attributes && type.attributes.map((attr: any) => (
                          <span key={attr.id} className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-medium border border-slate-200">
                            {attr.name}
                          </span>
                        ))}
                        {(!type.attributes || type.attributes.length === 0) && <span className="text-xs text-slate-400 italic">Aucun attribut spécifique</span>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingType(type)}
                        className={`p-2 rounded-lg transition-colors ${editingType?.id === type.id ? 'bg-indigo-100 text-indigo-700' : 'text-slate-400 hover:bg-slate-50 hover:text-indigo-600'}`}
                      >
                        <Edit2 size={18} />
                      </button>
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
                  onClick={handleCreateAttribute}
                  className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium flex items-center"
                >
                  <Plus size={16} className="mr-1" /> Nouvel Attribut
                </button>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-sm">
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
                      <tr key={attr.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 font-medium text-slate-800">{attr.name}</td>
                        <td className="px-6 py-4">
                          <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded text-xs uppercase font-bold tracking-wider">
                            {attr.data_type}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {attr.is_filterable
                            ? <span className="text-emerald-600 flex items-center gap-1 text-xs font-bold"><Database size={12} /> Oui</span>
                            : <span className="text-slate-400 text-xs">Non</span>}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleDeleteAttribute(attr.id)}
                            className="text-slate-400 hover:text-rose-600 transition-colors"
                          >
                            <Trash size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Sidebar for Editing Context */}
        <div className="space-y-4">
          {editingType && activeTab === 'types' ? (
            <div className="bg-white p-5 rounded-xl shadow-sm border border-indigo-200 sticky top-4 animate-in slide-in-from-right duration-300">
              <div className="flex items-center gap-2 mb-4 text-indigo-700">
                <Settings2 size={20} />
                <h3 className="font-bold">Configurer: {editingType.name}</h3>
              </div>

              <div className="space-y-4">
                {/* 
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Nom du type</label>
                  <input type="text" value={editingType.name} readOnly className="w-full bg-slate-100 border border-slate-200 rounded px-3 py-2 text-sm text-slate-500" />
                </div>
                */}
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Associer des attributs</label>
                  <p className="text-xs text-slate-400 mb-2">Cochez les attributs applicables à ce type de bien.</p>
                  <div className="border border-slate-200 rounded-lg p-3 max-h-60 overflow-y-auto space-y-2 bg-slate-50">
                    {attributes.map(attr => (
                      <label key={attr.id} className="flex items-center gap-3 p-2 hover:bg-white rounded cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={editingType.attributes.some((a: any) => a.id === attr.id)}
                          onChange={() => toggleAttributeForType(editingType.id, attr.id)}
                          className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                        />
                        <span className="text-sm text-slate-700">{attr.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={saveTypeScopes}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-sm font-medium"
                  >
                    Enregistrer
                  </button>
                  <button
                    onClick={() => setEditingType(null)}
                    className="flex-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 py-2 rounded-lg text-sm font-medium"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-indigo-50 p-5 rounded-xl border border-indigo-100 text-indigo-800">
              <h3 className="font-bold mb-2">Aide Rapide</h3>
              <p className="text-sm opacity-80 mb-2">
                Les attributs sont des caractéristiques réutilisables (ex: Piscine, Garage).
              </p>
              <p className="text-sm opacity-80">
                Créez d'abord vos attributs, puis associez-les aux types de biens (Villa, Appartement) pour standardiser les annonces.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default ConfigView;