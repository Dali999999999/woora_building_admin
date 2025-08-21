
import 'package:flutter/material.dart';
import 'apiservice.dart';
import 'package:intl/intl.dart';

class AlertsManagementView extends StatefulWidget {
  const AlertsManagementView({super.key});

  @override
  State<AlertsManagementView> createState() => _AlertsManagementViewState();
}

class _AlertsManagementViewState extends State<AlertsManagementView> {
  late Future<List<dynamic>> _alertsFuture;
  String _selectedStatusFilter = 'Tous';

  @override
  void initState() {
    super.initState();
    _alertsFuture = ApiService.getAllPropertyRequests();
  }

  void _filterAlerts(String status) {
    setState(() {
      _selectedStatusFilter = status;
    });
  }

  Future<void> _refreshAlerts() async {
    setState(() {
      _alertsFuture = ApiService.getAllPropertyRequests();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: RefreshIndicator(
        onRefresh: _refreshAlerts,
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Gestion des Alertes de Recherche', style: Theme.of(context).textTheme.headlineMedium),
              const SizedBox(height: 20),
              _buildFilterChips(),
              const SizedBox(height: 20),
              FutureBuilder<List<dynamic>>(
                future: _alertsFuture,
                builder: (context, snapshot) {
                  if (snapshot.connectionState == ConnectionState.waiting) {
                    return const Center(child: CircularProgressIndicator());
                  }
                  if (snapshot.hasError) {
                    return Center(child: Text('Erreur: ${snapshot.error}'));
                  }
                  if (!snapshot.hasData || snapshot.data!.isEmpty) {
                    return const Center(child: Text('Aucune alerte trouvée.'));
                  }

                  final alerts = _getFilteredAlerts(snapshot.data!);

                  return _buildAlertsDataTable(alerts, context);
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildFilterChips() {
    return Wrap(
      spacing: 8.0,
      children: ['Tous', 'new', 'contacted', 'closed'].map((status) {
        return ChoiceChip(
          label: Text(status),
          selected: _selectedStatusFilter == status,
          onSelected: (selected) {
            if (selected) {
              _filterAlerts(status);
            }
          },
        );
      }).toList(),
    );
  }

  List<dynamic> _getFilteredAlerts(List<dynamic> alerts) {
    if (_selectedStatusFilter == 'Tous') {
      return alerts;
    }
    return alerts.where((alert) => alert['status'] == _selectedStatusFilter).toList();
  }

  Widget _buildAlertsDataTable(List<dynamic> alerts, BuildContext context) {
    return SizedBox(
      width: double.infinity,
      child: DataTable(
        columns: const [
          DataColumn(label: Text('Date')),
          DataColumn(label: Text('Client')),
          DataColumn(label: Text('Type de Bien')),
          DataColumn(label: Text('Ville')),
          DataColumn(label: Text('Budget')),
          DataColumn(label: Text('Statut')),
          DataColumn(label: Text('Actions')),
        ],
        rows: alerts.map((alert) {
          return DataRow(cells: [
            DataCell(Text(DateFormat('dd/MM/yyyy').format(DateTime.parse(alert['created_at'])))),
            DataCell(Text(alert['user_full_name'] ?? 'N/A')),
            DataCell(Text(alert['property_type_name'] ?? 'N/A')),
            DataCell(Text(alert['city'] ?? 'N/A')),
            DataCell(Text('${alert['min_budget']}€ - ${alert['max_budget']}€')),
            DataCell(Chip(
              label: Text(alert['status'] ?? 'N/A'),
              backgroundColor: _getStatusColor(alert['status']),
            )),
            DataCell(
              ElevatedButton(
                child: const Text('Voir & Répondre'),
                onPressed: () {
                  _navigateToAlertDetail(context, alert);
                },
              ),
            ),
          ]);
        }).toList(),
      ),
    );
  }

  Color _getStatusColor(String? status) {
    switch (status) {
      case 'new':
        return Colors.blue.shade100;
      case 'contacted':
        return Colors.green.shade100;
      case 'closed':
        return Colors.grey.shade300;
      default:
        return Colors.transparent;
    }
  }

  void _navigateToAlertDetail(BuildContext context, Map<String, dynamic> alert) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => AlertDetailPage(alert: alert),
      ),
    );
  }
}

class AlertDetailPage extends StatefulWidget {
  final Map<String, dynamic> alert;

  const AlertDetailPage({super.key, required this.alert});

  @override
  _AlertDetailPageState createState() => _AlertDetailPageState();
}

class _AlertDetailPageState extends State<AlertDetailPage> {
  final _formKey = GlobalKey<FormState>();
  final _messageController = TextEditingController();
  bool _isSending = false;

  Future<void> _sendResponse() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    setState(() {
      _isSending = true;
    });

    try {
      await ApiService.respondToPropertyRequest(
        widget.alert['id'],
        _messageController.text,
      );
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Réponse envoyée avec succès!')),
      );
      Navigator.of(context).pop();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Erreur: $e')),
      );
    } finally {
      setState(() {
        _isSending = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Détail de l\'alerte #${widget.alert['id']}'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildDetailSection('Client', widget.alert['user_full_name']),
            _buildDetailSection('Email', widget.alert['user_email']),
            _buildDetailSection('Téléphone', widget.alert['user_phone_number']),
            _buildDetailSection('Date de la demande', DateFormat('dd/MM/yyyy HH:mm').format(DateTime.parse(widget.alert['created_at']))),
            _buildDetailSection('Type de bien', widget.alert['property_type_name']),
            _buildDetailSection('Ville', widget.alert['city']),
            _buildDetailSection('Budget', '${widget.alert['min_budget']}€ - ${widget.alert['max_budget']}€'),
            _buildDetailSection('Détails', widget.alert['request_details']),
            const SizedBox(height: 30),
            const Divider(),
            const SizedBox(height: 20),
            Text('Répondre au client', style: Theme.of(context).textTheme.headlineSmall),
            const SizedBox(height: 20),
            Form(
              key: _formKey,
              child: Column(
                children: [
                  TextFormField(
                    controller: _messageController,
                    decoration: const InputDecoration(
                      labelText: 'Message de réponse',
                      border: OutlineInputBorder(),
                    ),
                    maxLines: 5,
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'Le message ne peut pas être vide.';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 20),
                  if (_isSending)
                    const CircularProgressIndicator()
                  else
                    ElevatedButton(
                      onPressed: _sendResponse,
                      child: const Text('Envoyer la Réponse'),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDetailSection(String title, String? value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8.0),
      child: RichText(
        text: TextSpan(
          style: DefaultTextStyle.of(context).style,
          children: <TextSpan>[
            TextSpan(text: '$title: ', style: const TextStyle(fontWeight: FontWeight.bold)),
            TextSpan(text: value ?? 'Non spécifié'),
          ],
        ),
      ),
    );
  }
}
