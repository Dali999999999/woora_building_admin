// lib/views/property_management_view.dart

import 'package:flutter/material.dart';
import 'apiservice.dart';

class PropertyManagementView extends StatefulWidget {
  const PropertyManagementView({super.key});

  @override
  State<PropertyManagementView> createState() => _PropertyManagementViewState();
}

class _PropertyManagementViewState extends State<PropertyManagementView> {
  late Future<List<dynamic>> _propertiesFuture;
  List<dynamic> _allProperties = [];
  List<dynamic> _filteredProperties = [];
  
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _propertiesFuture = _fetchAndSetProperties();
  }

  Future<List<dynamic>> _fetchAndSetProperties() async {
    try {
      final properties = await ApiService.getProperties();
      if (mounted) {
        setState(() {
          _allProperties = properties;
          _filteredProperties = properties;
        });
      }
      return properties;
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Erreur: ${e.toString()}'), backgroundColor: Colors.red),
        );
      }
      rethrow;
    }
  }

  void _filterProperties(String query) {
    final lowerCaseQuery = query.toLowerCase();
    setState(() {
      _filteredProperties = _allProperties.where((prop) {
        final title = (prop['title'] ?? '').toLowerCase();
        final address = (prop['address'] ?? '').toLowerCase();
        return title.contains(lowerCaseQuery) || address.contains(lowerCaseQuery);
      }).toList();
    });
  }
  
  void _showMarkAsTransactedDialog(BuildContext context, dynamic property) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => MarkAsTransactedDialog(
        property: property,
        onSuccess: () {
          Navigator.of(ctx).pop();
          // Rafraîchit la liste des propriétés pour afficher le nouveau statut
          setState(() {
            _propertiesFuture = _fetchAndSetProperties();
          });
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 300,
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                labelText: 'Rechercher par titre ou adresse',
                prefixIcon: const Icon(Icons.search),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
              ),
              onChanged: _filterProperties,
            ),
          ),
          const SizedBox(height: 20),
          Expanded(
            child: FutureBuilder<List<dynamic>>(
              future: _propertiesFuture,
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const Center(child: CircularProgressIndicator());
                }
                if (snapshot.hasError) {
                  return Center(child: Text("Erreur de chargement: ${snapshot.error}"));
                }
                if (_filteredProperties.isEmpty) {
                  return const Center(child: Text("Aucun bien immobilier trouvé."));
                }

                return ListView.builder(
                  itemCount: _filteredProperties.length,
                  itemBuilder: (context, index) {
                    final property = _filteredProperties[index];
                    return Card(
                      margin: const EdgeInsets.symmetric(vertical: 8.0),
                      child: ListTile(
                        leading: CircleAvatar(
                          child: Icon(property['type'] == 'sale' ? Icons.house : Icons.apartment),
                        ),
                        title: Text(property['title'] ?? 'Titre non disponible'),
                        subtitle: Text('${property['price']} € - ${property['address'] ?? 'Adresse non disponible'}'),
                        trailing: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            _StatusChip(status: property['status']),
                            const SizedBox(width: 10),
                            // Le bouton n'est cliquable que si le bien n'est pas déjà vendu/loué
                            if (property['status'] != 'sold' && property['status'] != 'rented')
                              ElevatedButton(
                                onPressed: () => _showMarkAsTransactedDialog(context, property),
                                child: const Text('Finaliser'),
                              ),
                          ],
                        ),
                      ),
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

// Widget pour afficher le statut avec une couleur appropriée
class _StatusChip extends StatelessWidget {
  final String? status;
  const _StatusChip({this.status});

  @override
  Widget build(BuildContext context) {
    Color chipColor;
    String label;
    switch (status) {
      case 'sold':
        chipColor = Colors.green;
        label = 'Vendu';
        break;
      case 'rented':
        chipColor = Colors.blue;
        label = 'Loué';
        break;
      case 'pending':
        chipColor = Colors.orange;
        label = 'En attente';
        break;
      case 'approved':
        chipColor = Colors.teal;
        label = 'Approuvé';
        break;
      default:
        chipColor = Colors.grey;
        label = 'Inconnu';
    }
    return Chip(label: Text(label), backgroundColor: chipColor.withOpacity(0.2));
  }
}


// DIALOGUE POUR MARQUER COMME VENDU/LOUÉ
class MarkAsTransactedDialog extends StatefulWidget {
  final dynamic property;
  final VoidCallback onSuccess;

  const MarkAsTransactedDialog({required this.property, required this.onSuccess, super.key});

  @override
  State<MarkAsTransactedDialog> createState() => _MarkAsTransactedDialogState();
}

class _MarkAsTransactedDialogState extends State<MarkAsTransactedDialog> {
  late Future<List<dynamic>> _buyersFuture;
  String? _selectedStatus;
  int? _selectedBuyerId;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _buyersFuture = ApiService.getEligibleBuyers(widget.property['id']);
  }

  Future<void> _submitTransaction() async {
    if (_selectedStatus == null || _selectedBuyerId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Veuillez sélectionner un statut et un acheteur.'), backgroundColor: Colors.red),
      );
      return;
    }

    setState(() => _isLoading = true);

    try {
      await ApiService.markPropertyAsTransacted(
        propertyId: widget.property['id'],
        status: _selectedStatus!,
        winningVisitRequestId: _selectedBuyerId!,
      );
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Transaction enregistrée avec succès !'), backgroundColor: Colors.green),
      );
      widget.onSuccess();
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
    return AlertDialog(
      title: Text('Finaliser la transaction pour "${widget.property['title']}"'),
      content: FutureBuilder<List<dynamic>>(
        future: _buyersFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const SizedBox(height: 100, child: Center(child: CircularProgressIndicator()));
          }
          if (snapshot.hasError) {
            return Text('Erreur: ${snapshot.error}');
          }
          if (!snapshot.hasData || snapshot.data!.isEmpty) {
            return const Text('Aucun acheteur/locataire éligible trouvé pour ce bien. Une visite doit avoir été acceptée.');
          }

          final buyers = snapshot.data!;
          return Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              DropdownButtonFormField<String>(
                value: _selectedStatus,
                decoration: const InputDecoration(labelText: 'Nouveau Statut'),
                items: const [
                  DropdownMenuItem(value: 'sold', child: Text('Vendu')),
                  DropdownMenuItem(value: 'rented', child: Text('Loué')),
                ],
                onChanged: (value) => setState(() => _selectedStatus = value),
              ),
              const SizedBox(height: 20),
              DropdownButtonFormField<int>(
                value: _selectedBuyerId,
                decoration: const InputDecoration(labelText: 'Acheteur/Locataire Gagnant'),
                items: buyers.map<DropdownMenuItem<int>>((buyer) {
                  return DropdownMenuItem<int>(
                    value: buyer['visit_request_id'],
                    child: Text(buyer['customer_name']),
                  );
                }).toList(),
                onChanged: (value) => setState(() => _selectedBuyerId = value),
              ),
            ],
          );
        },
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('Annuler'),
        ),
        if (_isLoading)
          const Padding(padding: EdgeInsets.all(8.0), child: CircularProgressIndicator())
        else
          ElevatedButton(
            onPressed: _submitTransaction,
            child: const Text('Confirmer'),
          ),
      ],
    );
  }
}