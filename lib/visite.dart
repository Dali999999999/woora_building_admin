// lib/views/visite.dart

import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'apiservice.dart';

class VisitRequestView extends StatefulWidget {
  const VisitRequestView({super.key});

  @override
  State<VisitRequestView> createState() => _VisitRequestViewState();
}

class _VisitRequestViewState extends State<VisitRequestView> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  late Future<List<dynamic>> _visitsFuture;
  
  // Statut initial à afficher
  String _currentStatus = 'pending'; 

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    _visitsFuture = ApiService.getVisitRequests(status: _currentStatus);

    _tabController.addListener(_handleTabSelection);
  }

  void _handleTabSelection() {
    if (_tabController.indexIsChanging) return;

    setState(() {
      switch (_tabController.index) {
        case 0: _currentStatus = 'pending'; break;
        case 1: _currentStatus = 'confirmed'; break;
        case 2: _currentStatus = 'rejected'; break;
        case 3: _currentStatus = ''; break; // Pour "Toutes"
      }
      _visitsFuture = ApiService.getVisitRequests(status: _currentStatus);
    });
  }

  @override
  void dispose() {
    _tabController.removeListener(_handleTabSelection);
    _tabController.dispose();
    super.dispose();
  }

  void _showSnackBar(String message, {bool isError = false}) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: isError ? Colors.red : Colors.green,
      ),
    );
  }

  Future<void> _performAction(Future<void> Function() action) async {
    try {
      await action();
      _showSnackBar('Action réussie !');
      // Rafraîchit la liste
      setState(() {
        _visitsFuture = ApiService.getVisitRequests(status: _currentStatus);
      });
    } catch (e) {
      _showSnackBar(e.toString(), isError: true);
    }
  }

  void _showRejectDialog(int requestId) {
    final reasonController = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Motif du Rejet'),
        content: TextField(
          controller: reasonController,
          decoration: const InputDecoration(hintText: 'Expliquez pourquoi la visite est rejetée...'),
          autofocus: true,
        ),
        actions: [
          TextButton(child: const Text('Annuler'), onPressed: () => Navigator.of(ctx).pop()),
          ElevatedButton(
            child: const Text('Confirmer le Rejet'),
            onPressed: () {
              if (reasonController.text.isNotEmpty) {
                Navigator.of(ctx).pop();
                _performAction(() => ApiService.rejectVisitRequest(requestId: requestId, reason: reasonController.text));
              }
            },
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        TabBar(
          controller: _tabController,
          tabs: const [
            Tab(icon: Icon(Icons.hourglass_top), text: 'En attente'),
            Tab(icon: Icon(Icons.check_circle_outline), text: 'Confirmées'),
            Tab(icon: Icon(Icons.cancel_outlined), text: 'Rejetées'),
            Tab(icon: Icon(Icons.list_alt), text: 'Toutes'),
          ],
        ),
        Expanded(
          child: FutureBuilder<List<dynamic>>(
            future: _visitsFuture,
            builder: (context, snapshot) {
              if (snapshot.connectionState == ConnectionState.waiting) {
                return const Center(child: CircularProgressIndicator());
              }
              if (snapshot.hasError) {
                return Center(child: Text("Erreur : ${snapshot.error}"));
              }
              if (!snapshot.hasData || snapshot.data!.isEmpty) {
                return const Center(child: Text("Aucune demande de visite dans cette catégorie."));
              }
              final visits = snapshot.data!;
              return ListView.builder(
                padding: const EdgeInsets.all(16.0),
                itemCount: visits.length,
                itemBuilder: (context, index) {
                  final visit = visits[index];
                  final requestedDate = DateTime.parse(visit['requested_datetime']).toLocal();
                  final formattedDate = DateFormat('dd/MM/yyyy \'à\' HH:mm').format(requestedDate);

                  return Card(
                    child: Padding(
                      padding: const EdgeInsets.all(12.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(visit['property_title'] ?? 'Bien non spécifié', style: Theme.of(context).textTheme.titleLarge),
                          const SizedBox(height: 8),
                          Text('Demandé par : ${visit['customer_name']} (${visit['customer_email']})'),
                          Text('Date souhaitée : $formattedDate'),
                          if(visit['message'] != null && visit['message'].isNotEmpty)
                             Padding(
                               padding: const EdgeInsets.only(top: 8.0),
                               child: Text('Message du client : "${visit['message']}"', style: const TextStyle(fontStyle: FontStyle.italic)),
                             ),
                          const Divider(height: 20),
                          if (visit['status'] == 'pending')
                            Row(
                              mainAxisAlignment: MainAxisAlignment.end,
                              children: [
                                OutlinedButton.icon(
                                  icon: const Icon(Icons.cancel),
                                  label: const Text('Rejeter'),
                                  style: OutlinedButton.styleFrom(foregroundColor: Colors.red),
                                  onPressed: () => _showRejectDialog(visit['id']),
                                ),
                                const SizedBox(width: 10),
                                ElevatedButton.icon(
                                  icon: const Icon(Icons.check),
                                  label: const Text('Confirmer'),
                                  onPressed: () => _performAction(() => ApiService.confirmVisitRequest(visit['id'])),
                                ),
                              ],
                            )
                          else
                            Align(
                              alignment: Alignment.centerRight,
                              child: Chip(label: Text(visit['status'] == 'confirmed' ? 'Confirmée' : 'Rejetée')),
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
    );
  }
}