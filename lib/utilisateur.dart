// lib/views/user_management_view.dart

import 'package:flutter/material.dart';
import 'apiservice.dart';
import 'utilisateur.dart';

class UserManagementView extends StatefulWidget {
  const UserManagementView({super.key});

  @override
  State<UserManagementView> createState() => _UserManagementViewState();
}

class _UserManagementViewState extends State<UserManagementView> {
  late Future<List<dynamic>> _usersFuture;
  List<dynamic> _allUsers = [];
  List<dynamic> _filteredUsers = [];
  
  final TextEditingController _searchController = TextEditingController();
  int? _sortColumnIndex;
  bool _isAscending = true;

  @override
  void initState() {
    super.initState();
    _usersFuture = _fetchAndSetUsers();
  }

  Future<List<dynamic>> _fetchAndSetUsers() async {
    try {
      final users = await ApiService.getUsers();
      setState(() {
        _allUsers = users;
        _filteredUsers = users;
      });
      return users;
    } catch (e) {
      // Affiche une SnackBar en cas d'erreur
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Erreur: ${e.toString()}'), backgroundColor: Colors.red),
        );
      }
      // Relance l'erreur pour que le FutureBuilder puisse la gérer
      rethrow;
    }
  }

  void _filterUsers(String query) {
    final lowerCaseQuery = query.toLowerCase();
    setState(() {
      _filteredUsers = _allUsers.where((user) {
        final fullName = ('${user['first_name'] ?? ''} ${user['last_name'] ?? ''}').toLowerCase();
        final email = (user['email'] ?? '').toLowerCase();
        return fullName.contains(lowerCaseQuery) || email.contains(lowerCaseQuery);
      }).toList();
    });
  }

  void _onSort(int columnIndex, bool ascending) {
    setState(() {
      _sortColumnIndex = columnIndex;
      _isAscending = ascending;

      _filteredUsers.sort((a, b) {
        final aValue = a[_getColumnKey(columnIndex)];
        final bValue = b[_getColumnKey(columnIndex)];
        
        if (aValue == null || bValue == null) return 0;
        
        // Comparaison, gestion de l'ordre
        return ascending ? Comparable.compare(aValue, bValue) : Comparable.compare(bValue, aValue);
      });
    });
  }

  String _getColumnKey(int index) {
    switch(index) {
      case 0: return 'id';
      case 1: return 'first_name';
      case 2: return 'email';
      case 3: return 'role';
      default: return 'id';
    }
  }

  void _showUserDetailsDialog(BuildContext context, dynamic user) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('${user['first_name'] ?? ''} ${user['last_name'] ?? ''}'),
        content: SingleChildScrollView(
          child: ListBody(
            children: <Widget>[
              _buildDetailRow('ID', user['id'].toString()),
              _buildDetailRow('Email', user['email'] ?? 'N/A'),
              _buildDetailRow('Téléphone', user['phone_number'] ?? 'N/A'),
              _buildDetailRow('Rôle', user['role'] ?? 'N/A'),
              _buildDetailRow('Email vérifié', user['is_verified'] ? 'Oui' : 'Non'),
              _buildDetailRow('Créé le', user['created_at'] != null ? DateTime.parse(user['created_at']).toLocal().toString().substring(0, 16) : 'N/A'),
            ],
          ),
        ),
        actions: <Widget>[
          TextButton(
            child: const Text('Fermer'),
            onPressed: () {
              Navigator.of(ctx).pop();
            },
          ),
        ],
      ),
    );
  }

  Widget _buildDetailRow(String title, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4.0),
      child: RichText(
        text: TextSpan(
          style: DefaultTextStyle.of(context).style,
          children: <TextSpan>[
            TextSpan(text: '$title: ', style: const TextStyle(fontWeight: FontWeight.bold)),
            TextSpan(text: value),
          ],
        ),
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
          // Barre de recherche
          SizedBox(
            width: 300,
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                labelText: 'Rechercher par nom ou email',
                prefixIcon: const Icon(Icons.search),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
                suffixIcon: _searchController.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear),
                        onPressed: () {
                          _searchController.clear();
                          _filterUsers('');
                        },
                      )
                    : null,
              ),
              onChanged: _filterUsers,
            ),
          ),
          const SizedBox(height: 20),
          // Tableau des utilisateurs
          Expanded(
            child: FutureBuilder<List<dynamic>>(
              future: _usersFuture,
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const Center(child: CircularProgressIndicator());
                }
                if (snapshot.hasError) {
                  return Center(child: Text("Erreur de chargement: ${snapshot.error}"));
                }
                if (_filteredUsers.isEmpty) {
                  return const Center(child: Text("Aucun utilisateur trouvé."));
                }

                return SingleChildScrollView(
                  scrollDirection: Axis.vertical,
                  child: SizedBox(
                    width: double.infinity,
                    child: DataTable(
                      sortColumnIndex: _sortColumnIndex,
                      sortAscending: _isAscending,
                      columns: [
                        DataColumn(label: const Text('ID'), onSort: _onSort),
                        DataColumn(label: const Text('Nom Complet'), onSort: _onSort),
                        DataColumn(label: const Text('Email'), onSort: _onSort),
                        DataColumn(label: const Text('Rôle'), onSort: _onSort),
                        const DataColumn(label: Text('Actions')),
                      ],
                      rows: _filteredUsers.map((user) {
                        return DataRow(cells: [
                          DataCell(Text(user['id'].toString())),
                          DataCell(Text('${user['first_name'] ?? ''} ${user['last_name'] ?? ''}')),
                          DataCell(Text(user['email'] ?? 'N/A')),
                          DataCell(Chip(label: Text(user['role'] ?? 'N/A'))),
                          DataCell(
                            IconButton(
                              icon: const Icon(Icons.visibility),
                              tooltip: 'Voir détails',
                              onPressed: () => _showUserDetailsDialog(context, user),
                            ),
                          ),
                        ]);
                      }).toList(),
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}