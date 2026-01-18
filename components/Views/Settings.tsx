import React, { useState, useEffect } from 'react';
import { Save, RefreshCw } from 'lucide-react';
import { settingsService } from '../../api/services';
import toast from 'react-hot-toast';

const SettingsView: React.FC = () => {
  const [settings, setSettings] = useState({
    freeVisitPasses: 0,
    passPrice: 0,
    commissionPercentage: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const [visitSettings, commSettings] = await Promise.all([
        settingsService.getVisitSettings(),
        settingsService.getAgentCommission()
      ]);

      setSettings({
        freeVisitPasses: visitSettings.initial_free_visit_passes,
        passPrice: visitSettings.visit_pass_price,
        commissionPercentage: commSettings.agent_commission_percentage,
      });
    } catch (error) {
      console.error(error);
      toast.error("Erreur chargement paramètres");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await Promise.all([
        settingsService.updateVisitSettings(settings.freeVisitPasses, settings.passPrice),
        settingsService.updateAgentCommission(settings.commissionPercentage)
      ]);
      toast.success("Paramètres enregistrés");
    } catch (error) {
      console.error(error);
      toast.error("Erreur sauvegarde");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Chargement des réglages...</div>;

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Paramètres Généraux</h2>
        <p className="text-slate-500">Configuration financière et opérationnelle de la plateforme.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50">
          <h3 className="font-semibold text-slate-800">Politique de Visites & Monétisation</h3>
        </div>

        <div className="p-8 space-y-8">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <label className="block text-sm font-medium text-slate-700">
                Passes de visite gratuits (à l'inscription)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={settings.freeVisitPasses}
                  onChange={(e) => setSettings({ ...settings, freeVisitPasses: parseInt(e.target.value) })}
                  className="block w-full rounded-lg border-slate-300 border p-3 pl-4 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm shadow-sm"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-slate-400 text-sm">Passes</span>
                </div>
              </div>
              <p className="text-xs text-slate-500">Nombre de contacts propriétaires qu'un nouvel utilisateur peut débloquer gratuitement.</p>
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-medium text-slate-700">
                Prix unitaire d'un Pass de visite
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={settings.passPrice}
                  onChange={(e) => setSettings({ ...settings, passPrice: parseInt(e.target.value) })}
                  className="block w-full rounded-lg border-slate-300 border p-3 pl-4 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm shadow-sm"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-slate-400 text-sm font-bold">FCFA</span>
                </div>
              </div>
              <p className="text-xs text-slate-500">Montant facturé à l'utilisateur pour acheter un pass supplémentaire.</p>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="block text-sm font-medium text-slate-700">
                  Commission sur Transaction
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={settings.commissionPercentage}
                    onChange={(e) => setSettings({ ...settings, commissionPercentage: parseFloat(e.target.value) })}
                    className="block w-full rounded-lg border-slate-300 border p-3 pl-4 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm shadow-sm"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-slate-400 text-sm font-bold">%</span>
                  </div>
                </div>
                <p className="text-xs text-slate-500">Pourcentage prélevé par la plateforme sur chaque vente ou location finalisée.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm transition-colors disabled:opacity-70"
          >
            {isSaving ? (
              <>
                <RefreshCw className="animate-spin mr-2" size={18} /> Enregistrement...
              </>
            ) : (
              <>
                <Save className="mr-2" size={18} /> Enregistrer les modifications
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;