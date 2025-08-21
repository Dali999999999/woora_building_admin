// lib/dashboard_screen.dart

import 'package:flutter/material.dart';
import 'apiservice.dart';
import 'connexion.dart'; // Nom de fichier pour la connexion/inscription

// Imports pour chaque page (vue) du tableau de bord
import 'utilisateur.dart';
import 'bien.dart';
import 'visite.dart';
import 'type.dart';
import 'setting.dart';
import 'alerte.dart';

// L'écran principal qui gère la navigation et la disposition
class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  int _selectedIndex = 0;
  late final List<Widget> _pages;
  late final List<String> _pageTitles;

  late final Future<Map<String, dynamic>> _userProfileFuture;

  @override
  void initState() {
    super.initState();
    _userProfileFuture = ApiService.getUserProfile();

    _pageTitles = [
      'Tableau de bord',
      'Gestion des Utilisateurs',
      'Gestion des Biens',
      'Demandes de Visite',
      'Gestion des Alertes',
      'Types et Attributs',
      'Paramètres',
    ];

    // La liste des pages est maintenant composée des vrais widgets importés
    _pages = [
      DashboardHomeView(userProfileFuture: _userProfileFuture),
      const UserManagementView(),
      const PropertyManagementView(),
      const VisitRequestView(),
      const AlertsManagementView(),
      const PropertyConfigView(),
      const SettingsView(),
    ];
  }
  
  void _onSelectItem(int index) {
    setState(() {
      _selectedIndex = index;
    });
  }
  
  void _logout() {
    ApiService.clearToken();
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (context) => const AuthScreen()),
      (Route<dynamic> route) => false,
    );
  }

  @override
  Widget build(BuildContext context) {
    final isLargeScreen = MediaQuery.of(context).size.width > 800;

    return Scaffold(
      appBar: AppBar(
        title: Text(_pageTitles[_selectedIndex]),
        automaticallyImplyLeading: !isLargeScreen,
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            tooltip: 'Déconnexion',
            onPressed: _logout,
          ),
        ],
      ),
      drawer: !isLargeScreen 
        ? AppNavigationDrawer(
            selectedIndex: _selectedIndex,
            onSelectItem: _onSelectItem,
            userProfileFuture: _userProfileFuture,
          ) 
        : null,
      body: Row(
        children: [
          if (isLargeScreen)
            AppNavigationRail(
              selectedIndex: _selectedIndex,
              onSelectItem: _onSelectItem,
              userProfileFuture: _userProfileFuture,
            ),
          Expanded(
            child: IndexedStack(
              index: _selectedIndex,
              children: _pages,
            ),
          ),
        ],
      ),
    );
  }
}

// =========================================================================
// WIDGETS DE NAVIGATION (INCHANGÉS)
// =========================================================================

class AppNavigationRail extends StatelessWidget {
  // ... Code inchangé
  final int selectedIndex;
  final ValueChanged<int> onSelectItem;
  final Future<Map<String, dynamic>> userProfileFuture;
  const AppNavigationRail({ required this.selectedIndex, required this.onSelectItem, required this.userProfileFuture, super.key });
  @override
  Widget build(BuildContext context) {
    return NavigationRail(
      extended: true,
      minExtendedWidth: 220,
      selectedIndex: selectedIndex,
      onDestinationSelected: onSelectItem,
      leading: Padding(
        padding: const EdgeInsets.symmetric(vertical: 20.0),
        child: FutureBuilder<Map<String, dynamic>>(
          future: userProfileFuture,
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) return const Center(child: CircularProgressIndicator());
            if (snapshot.hasData) {
              final user = snapshot.data!;
              return Column(
                children: [
                  const CircleAvatar(radius: 30, child: Icon(Icons.admin_panel_settings, size: 30)),
                  const SizedBox(height: 8),
                  Text('${user['first_name'] ?? ''} ${user['last_name'] ?? ''}', style: Theme.of(context).textTheme.titleMedium),
                  Text(user['email'] ?? 'admin', style: Theme.of(context).textTheme.bodySmall),
                ],
              );
            }
            return const Column(children: [CircleAvatar(radius: 30), SizedBox(height: 8), Text('Admin')]);
          },
        ),
      ),
      destinations: const [
        NavigationRailDestination(icon: Icon(Icons.dashboard_outlined), selectedIcon: Icon(Icons.dashboard), label: Text('Tableau de bord')),
        NavigationRailDestination(icon: Icon(Icons.people_outline), selectedIcon: Icon(Icons.people), label: Text('Utilisateurs')),
        NavigationRailDestination(icon: Icon(Icons.home_work_outlined), selectedIcon: Icon(Icons.home_work), label: Text('Biens Immobiliers')),
        NavigationRailDestination(icon: Icon(Icons.event_available_outlined), selectedIcon: Icon(Icons.event_available), label: Text('Demandes de Visite')),
        NavigationRailDestination(icon: Icon(Icons.notification_important_outlined), selectedIcon: Icon(Icons.notification_important), label: Text('Alertes')),
        NavigationRailDestination(icon: Icon(Icons.category_outlined), selectedIcon: Icon(Icons.category), label: Text('Types & Attributs')),
        NavigationRailDestination(icon: Icon(Icons.settings_outlined), selectedIcon: Icon(Icons.settings), label: Text('Paramètres')),
      ],
    );
  }
}

class AppNavigationDrawer extends StatelessWidget {
  // ... Code inchangé
  final int selectedIndex;
  final ValueChanged<int> onSelectItem;
  final Future<Map<String, dynamic>> userProfileFuture;
  const AppNavigationDrawer({ required this.selectedIndex, required this.onSelectItem, required this.userProfileFuture, super.key });
  void _handleItemClick(BuildContext context, int index) { onSelectItem(index); Navigator.pop(context); }
  @override
  Widget build(BuildContext context) {
    return Drawer(
      child: ListView(
        padding: EdgeInsets.zero,
        children: [
          UserAccountsDrawerHeader(
            accountName: FutureBuilder<Map<String, dynamic>>( future: userProfileFuture, builder: (context, snapshot) => Text(snapshot.hasData ? '${snapshot.data!['first_name']} ${snapshot.data!['last_name']}' : 'Chargement...')),
            accountEmail: FutureBuilder<Map<String, dynamic>>( future: userProfileFuture, builder: (context, snapshot) => Text(snapshot.hasData ? snapshot.data!['email'] : '')),
            currentAccountPicture: const CircleAvatar(child: Icon(Icons.admin_panel_settings_sharp, size: 42.0)),
          ),
          ListTile(title: const Text('Tableau de bord'), leading: const Icon(Icons.dashboard), selected: selectedIndex == 0, onTap: () => _handleItemClick(context, 0)),
          ListTile(title: const Text('Utilisateurs'), leading: const Icon(Icons.people), selected: selectedIndex == 1, onTap: () => _handleItemClick(context, 1)),
          ListTile(title: const Text('Biens Immobiliers'), leading: const Icon(Icons.home_work), selected: selectedIndex == 2, onTap: () => _handleItemClick(context, 2)),
          ListTile(title: const Text('Demandes de Visite'), leading: const Icon(Icons.event_available), selected: selectedIndex == 3, onTap: () => _handleItemClick(context, 3)),
          ListTile(title: const Text('Alertes'), leading: const Icon(Icons.notification_important), selected: selectedIndex == 4, onTap: () => _handleItemClick(context, 4)),
          ListTile(title: const Text('Types & Attributs'), leading: const Icon(Icons.category), selected: selectedIndex == 5, onTap: () => _handleItemClick(context, 5)),
          const Divider(),
          ListTile(title: const Text('Paramètres'), leading: const Icon(Icons.settings), selected: selectedIndex == 6, onTap: () => _handleItemClick(context, 6)),
        ],
      ),
    );
  }
}


// =========================================================================
// VUE D'ACCUEIL DU DASHBOARD (COMPLÈTEMENT MISE À JOUR)
// =========================================================================

class DashboardHomeView extends StatefulWidget {
  final Future<Map<String, dynamic>> userProfileFuture;
  const DashboardHomeView({required this.userProfileFuture, super.key});

  @override
  State<DashboardHomeView> createState() => _DashboardHomeViewState();
}

class _DashboardHomeViewState extends State<DashboardHomeView> {
  late Future<List<List<dynamic>>> _dashboardStatsFuture;

  @override
  void initState() {
    super.initState();
    // On charge les statistiques dès l'initialisation
    _dashboardStatsFuture = _loadStats();
  }
  
  // Méthode pour lancer les appels API en parallèle
  Future<List<List<dynamic>>> _loadStats() {
    return Future.wait([
      ApiService.getUsers(),
      ApiService.getProperties(),
      ApiService.getVisitRequests(status: 'pending'), // On veut spécifiquement les visites en attente
    ]);
  }
  
  // Méthode pour rafraîchir les données
  Future<void> _refreshStats() async {
    setState(() {
      _dashboardStatsFuture = _loadStats();
    });
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: _refreshStats,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            FutureBuilder<Map<String, dynamic>>(
              future: widget.userProfileFuture,
              builder: (context, snapshot) {
                if (snapshot.hasData) {
                  return Text('Bienvenue, ${snapshot.data!['first_name']} !', style: Theme.of(context).textTheme.headlineMedium);
                }
                return Text('Bienvenue !', style: Theme.of(context).textTheme.headlineMedium);
              },
            ),
            const SizedBox(height: 8),
            Text('Voici un aperçu de l\'activité de votre plateforme.', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 24),

            // On utilise un FutureBuilder pour afficher les statistiques une fois chargées
            FutureBuilder<List<List<dynamic>>>(
              future: _dashboardStatsFuture,
              builder: (context, snapshot) {
                // Pendant le chargement, on affiche des cartes avec un indicateur
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return Wrap(
                    spacing: 20,
                    runSpacing: 20,
                    children: const [
                      StatCard(title: 'Utilisateurs Actifs', value: '...', icon: Icons.people, color: Colors.blue),
                      StatCard(title: 'Biens en Ligne', value: '...', icon: Icons.home_work, color: Colors.orange),
                      StatCard(title: 'Visites en Attente', value: '...', icon: Icons.event, color: Colors.red),
                      StatCard(title: 'Transactions (à venir)', value: '--', icon: Icons.paid, color: Colors.green),
                    ],
                  );
                }
                
                // En cas d'erreur
                if (snapshot.hasError) {
                  return Center(
                    child: Column(
                      children: [
                        const Icon(Icons.error_outline, color: Colors.red, size: 50),
                        Text('Erreur de chargement des statistiques: ${snapshot.error}'),
                        const SizedBox(height: 10),
                        ElevatedButton(onPressed: _refreshStats, child: const Text('Réessayer'))
                      ],
                    ),
                  );
                }

                // Quand les données sont disponibles
                if (snapshot.hasData) {
                  final stats = snapshot.data!;
                  final userCount = stats[0].length;
                  final propertyCount = stats[1].length;
                  final pendingVisitsCount = stats[2].length;

                  return Wrap(
                    spacing: 20,
                    runSpacing: 20,
                    children: [
                      StatCard(title: 'Utilisateurs Actifs', value: userCount.toString(), icon: Icons.people, color: Colors.blue),
                      StatCard(title: 'Biens en Ligne', value: propertyCount.toString(), icon: Icons.home_work, color: Colors.orange),
                      StatCard(title: 'Visites en Attente', value: pendingVisitsCount.toString(), icon: Icons.event, color: Colors.red),
                      // NOTE: Le nombre de transactions n'est pas fourni par l'API actuelle, donc on laisse un placeholder.
                      const StatCard(title: 'Transactions (à venir)', value: '--', icon: Icons.paid, color: Colors.green),
                    ],
                  );
                }
                
                return const Center(child: Text('Aucune donnée à afficher.'));
              },
            ),
          ],
        ),
      ),
    );
  }
}

class StatCard extends StatelessWidget {
  final String title, value;
  final IconData icon;
  final Color color;
  const StatCard({required this.title, required this.value, required this.icon, required this.color, super.key});
  
  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 4,
      child: Container(
        width: 220,
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, size: 40, color: color),
            const SizedBox(height: 16),
            Text(value, style: Theme.of(context).textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.bold)),
            const SizedBox(height: 4),
            Text(title, style: Theme.of(context).textTheme.bodyLarge),
          ],
        ),
      ),
    );
  }
}