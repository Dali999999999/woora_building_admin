// lib/views/setting.dart

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'apiservice.dart';

class SettingsView extends StatefulWidget {
  const SettingsView({super.key});

  @override
  State<SettingsView> createState() => _SettingsViewState();
}

class _SettingsViewState extends State<SettingsView> {
  final _formKey = GlobalKey<FormState>();
  late Future<List<dynamic>> _settingsFuture;

  // Contrôleurs pour les champs de formulaire
  final _freePassesController = TextEditingController();
  final _passPriceController = TextEditingController();
  final _commissionController = TextEditingController();

  bool _isLoading = false;
  bool _isInitialized = false;

  @override
  void initState() {
    super.initState();
    // On utilise Future.wait pour lancer les deux appels API en parallèle
    _settingsFuture = Future.wait([
      ApiService.getVisitSettings(),
      ApiService.getAgentCommissionSetting(),
    ]);
  }

  @override
  void dispose() {
    _freePassesController.dispose();
    _passPriceController.dispose();
    _commissionController.dispose();
    super.dispose();
  }

  Future<void> _saveSettings() async {
    if (!_formKey.currentState!.validate()) {
      return; // Validation échouée
    }
    setState(() => _isLoading = true);

    try {
      // On lance les deux mises à jour en parallèle
      await Future.wait([
        ApiService.updateVisitSettings(
          freePasses: int.parse(_freePassesController.text),
          price: double.parse(_passPriceController.text),
        ),
        ApiService.updateAgentCommissionSetting(
          percentage: double.parse(_commissionController.text),
        ),
      ]);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Paramètres sauvegardés avec succès !'), backgroundColor: Colors.green),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Erreur: ${e.toString()}'), backgroundColor: Colors.red),
      );
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<dynamic>>(
      future: _settingsFuture,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        }
        if (snapshot.hasError) {
          return Center(child: Text("Erreur de chargement des paramètres: ${snapshot.error}"));
        }
        if (snapshot.hasData && !_isInitialized) {
          // Les données sont arrivées, on initialise les contrôleurs UNE SEULE FOIS
          final visitSettings = snapshot.data![0] as Map<String, dynamic>;
          final commissionSettings = snapshot.data![1] as Map<String, dynamic>;

          _freePassesController.text = (visitSettings['initial_free_visit_passes'] ?? 0).toString();
          _passPriceController.text = (visitSettings['visit_pass_price'] ?? 0.0).toString();
          _commissionController.text = (commissionSettings['agent_commission_percentage'] ?? 0.0).toString();
          _isInitialized = true;
        }

        return SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Center(
            child: SizedBox(
              width: 600,
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Paramètres Généraux', style: Theme.of(context).textTheme.headlineSmall),
                    const Divider(height: 30),
                    
                    // --- Carte des Paramètres de Visite ---
                    Card(
                      elevation: 2.0,
                      child: Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Pass de Visite', style: Theme.of(context).textTheme.titleLarge),
                            const SizedBox(height: 16),
                            TextFormField(
                              controller: _freePassesController,
                              decoration: const InputDecoration(
                                labelText: 'Nombre de pass gratuits à l\'inscription',
                                border: OutlineInputBorder(),
                              ),
                              keyboardType: TextInputType.number,
                              inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                              validator: (value) => value == null || value.isEmpty ? 'Champ requis' : null,
                            ),
                            const SizedBox(height: 16),
                            TextFormField(
                              controller: _passPriceController,
                              decoration: const InputDecoration(
                                labelText: 'Prix d\'un pass de visite (€)',
                                border: OutlineInputBorder(),
                              ),
                              keyboardType: const TextInputType.numberWithOptions(decimal: true),
                              validator: (value) => value == null || value.isEmpty ? 'Champ requis' : null,
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),

                    // --- Carte des Paramètres de Commission ---
                    Card(
                      elevation: 2.0,
                      child: Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Commissions', style: Theme.of(context).textTheme.titleLarge),
                            const SizedBox(height: 16),
                            TextFormField(
                              controller: _commissionController,
                              decoration: const InputDecoration(
                                labelText: 'Pourcentage de commission agent (%)',
                                border: OutlineInputBorder(),
                              ),
                              keyboardType: const TextInputType.numberWithOptions(decimal: true),
                              validator: (value) {
                                if (value == null || value.isEmpty) return 'Champ requis';
                                final p = double.tryParse(value);
                                if (p == null || p < 0 || p > 100) return 'Doit être entre 0 et 100';
                                return null;
                              },
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 32),
                    
                    // --- Bouton de sauvegarde ---
                    Align(
                      alignment: Alignment.centerRight,
                      child: _isLoading
                          ? const CircularProgressIndicator()
                          : ElevatedButton.icon(
                              onPressed: _saveSettings,
                              icon: const Icon(Icons.save),
                              label: const Text('Sauvegarder les modifications'),
                              style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16)),
                            ),
                    )
                  ],
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}