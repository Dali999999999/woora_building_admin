// lib/views/type.dart

import 'package:flutter/material.dart';
import 'apiservice.dart';

class PropertyConfigView extends StatefulWidget {
  const PropertyConfigView({super.key});

  @override
  State<PropertyConfigView> createState() => _PropertyConfigViewState();
}

class _PropertyConfigViewState extends State<PropertyConfigView> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  late Future<List<dynamic>> _propertyTypesFuture;
  List<bool> _isExpanded = [];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _loadPropertyTypes();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  void _loadPropertyTypes() {
    setState(() {
      _propertyTypesFuture = ApiService.getPropertyTypesWithAttributes().then((data) {
        if (mounted) {
          setState(() {
            _isExpanded = List<bool>.filled(data.length, false);
          });
        }
        return data;
      });
    });
  }

  void _showSnackBar(String message, {bool isError = false}) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), backgroundColor: isError ? Colors.red : Colors.green),
    );
  }

  // --- Fonctions pour afficher les boîtes de dialogue ---

  void _showAddEditTypeDialog({dynamic propertyType}) {
    showDialog(
      context: context,
      builder: (_) => _AddEditTypeDialog(propertyType: propertyType),
    ).then((success) {
      if (success == true) {
        _showSnackBar('Type de bien sauvegardé !');
        _loadPropertyTypes();
      }
    });
  }

  void _showAddAttributeDialog() {
    showDialog(
      context: context,
      builder: (_) => const _AddEditAttributeDialog(), // Utilise le même dialogue pour l'ajout
    ).then((success) {
      if (success == true) {
        _showSnackBar('Attribut créé avec succès !');
        // Pas besoin de recharger ici, car la liste complète des attributs
        // est récupérée dynamiquement dans le dialogue de gestion.
      }
    });
  }

  void _showManageScopesDialog(dynamic propertyType) {
    showDialog(
      context: context,
      builder: (_) => _ManageScopesDialog(propertyType: propertyType),
    ).then((success) {
      if (success == true) {
        _showSnackBar('Associations mises à jour !');
        _loadPropertyTypes();
      }
    });
  }

  void _confirmDeleteType(int id, String name) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Confirmer la suppression'),
        content: Text('Voulez-vous vraiment supprimer le type "$name" ? Cette action est irréversible et peut affecter les biens existants.'),
        actions: [
          TextButton(child: const Text('Annuler'), onPressed: () => Navigator.of(ctx).pop()),
          TextButton(
            child: const Text('Supprimer', style: TextStyle(color: Colors.red)),
            onPressed: () async {
              Navigator.of(ctx).pop(); // Ferme le dialogue avant l'appel API
              try {
                await ApiService.deletePropertyType(id);
                _showSnackBar('Type supprimé avec succès.');
                _loadPropertyTypes();
              } catch (e) {
                _showSnackBar(e.toString(), isError: true);
              }
            },
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Configuration des Biens'),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Types de Biens'),
            Tab(text: 'Gestion des Attributs'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          // Contenu de l'onglet "Types de Biens"
          FutureBuilder<List<dynamic>>(
            future: _propertyTypesFuture,
            builder: (context, snapshot) {
              if (snapshot.connectionState == ConnectionState.waiting) {
                return const Center(child: CircularProgressIndicator());
              }
              if (snapshot.hasError) {
                return Center(child: Text('Erreur: ${snapshot.error}'));
              }
              if (!snapshot.hasData || snapshot.data!.isEmpty) {
                return const Center(child: Text('Aucun type de bien trouvé. Ajoutez-en un !'));
              }

              final types = snapshot.data!;
              return SingleChildScrollView(
                padding: const EdgeInsets.all(16.0),
                child: ExpansionPanelList(
                  expansionCallback: (int index, bool isExpanded) {
                    setState(() {
                      _isExpanded[index] = !isExpanded;
                    });
                  },
                  children: types.asMap().entries.map<ExpansionPanel>((entry) {
                    int idx = entry.key;
                    dynamic type = entry.value;
                    List<dynamic> attributes = type['attributes'] ?? [];

                    return ExpansionPanel(
                      isExpanded: _isExpanded[idx],
                      headerBuilder: (BuildContext context, bool isExpanded) {
                        return ListTile(
                          title: Text(type['name'], style: Theme.of(context).textTheme.titleLarge),
                          subtitle: Text(type['description'] ?? 'Pas de description'),
                          trailing: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              IconButton(icon: const Icon(Icons.edit, color: Colors.blue), tooltip: 'Modifier le type', onPressed: () => _showAddEditTypeDialog(propertyType: type)),
                              IconButton(icon: const Icon(Icons.rule, color: Colors.orange), tooltip: 'Gérer les attributs associés', onPressed: () => _showManageScopesDialog(type)),
                              IconButton(icon: const Icon(Icons.delete, color: Colors.red), tooltip: 'Supprimer le type', onPressed: () => _confirmDeleteType(type['id'], type['name'])),
                            ],
                          ),
                        );
                      },
                      body: Padding(
                        padding: const EdgeInsets.fromLTRB(16.0, 0, 16.0, 16.0),
                        child: attributes.isEmpty
                            ? const Align(alignment: Alignment.centerLeft, child: Text('Aucun attribut associé.'))
                            : Wrap(
                                spacing: 8.0,
                                runSpacing: 4.0,
                                children: attributes.map<Widget>((attr) {
                                  return Chip(
                                    label: Text(attr['name']),
                                    avatar: Icon(attr['is_filterable'] == true ? Icons.filter_alt : Icons.filter_alt_off, size: 18),
                                  );
                                }).toList(),
                              ),
                      ),
                    );
                  }).toList(),
                ),
              );
            },
          ),
          // Contenu de l'onglet "Gestion des Attributs"
          const AttributeManagementView(),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {
          if (_tabController.index == 0) { // Onglet Types de Biens
            showModalBottomSheet(context: context, builder: (ctx) => Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                ListTile(leading: const Icon(Icons.add_box), title: const Text('Ajouter un Type de Bien'), onTap: (){ 
                  Navigator.pop(ctx);
                  _showAddEditTypeDialog();
                }),
                ListTile(leading: const Icon(Icons.add_to_photos), title: const Text('Créer un nouvel Attribut'), onTap: (){
                  Navigator.pop(ctx);
                  _showAddAttributeDialog();
                }),
              ],
            ));
          } else { // Onglet Gestion des Attributs
            _showAddAttributeDialog();
          }
        },
        label: const Text('Ajouter'),
        icon: const Icon(Icons.add),
      ),
    );
  }

}

// --- DIALOGUE POUR AJOUTER/MODIFIER UN TYPE DE BIEN ---
class _AddEditTypeDialog extends StatefulWidget {
  final dynamic propertyType;
  const _AddEditTypeDialog({this.propertyType});

  @override
  State<_AddEditTypeDialog> createState() => _AddEditTypeDialogState();
}

class _AddEditTypeDialogState extends State<_AddEditTypeDialog> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _descriptionController = TextEditingController();
  bool _isActive = true;
  bool get _isEditing => widget.propertyType != null;

  @override
  void initState() {
    super.initState();
    if (_isEditing) {
      _nameController.text = widget.propertyType['name'];
      _descriptionController.text = widget.propertyType['description'] ?? '';
      _isActive = widget.propertyType['is_active'];
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    try {
      if (_isEditing) {
        await ApiService.updatePropertyType(widget.propertyType['id'], {
          'name': _nameController.text,
          'description': _descriptionController.text,
          'is_active': _isActive,
        });
      } else {
        await ApiService.createPropertyType(_nameController.text, _descriptionController.text);
      }
      if (mounted) Navigator.of(context).pop(true);
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString()), backgroundColor: Colors.red));
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text(_isEditing ? 'Modifier le Type' : 'Ajouter un Type'),
      content: Form(
        key: _formKey,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextFormField(controller: _nameController, decoration: const InputDecoration(labelText: 'Nom du type'), validator: (v) => v!.isEmpty ? 'Requis' : null),
            TextFormField(controller: _descriptionController, decoration: const InputDecoration(labelText: 'Description')),
            if (_isEditing) SwitchListTile(title: const Text('Actif'), value: _isActive, onChanged: (val) => setState(() => _isActive = val)),
          ],
        ),
      ),
      actions: [
        TextButton(child: const Text('Annuler'), onPressed: () => Navigator.of(context).pop()),
        ElevatedButton(child: const Text('Sauvegarder'), onPressed: _submit),
      ],
    );
  }
}

// --- DIALOGUE POUR CRÉER UN NOUVEL ATTRIBUT ---
class _AddAttributeDialog extends StatefulWidget {
  const _AddAttributeDialog();

  @override
  State<_AddAttributeDialog> createState() => __AddAttributeDialogState();
}

class __AddAttributeDialogState extends State<_AddAttributeDialog> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _optionsController = TextEditingController();
  String _dataType = 'string';
  bool _isFilterable = false;

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    final data = {
      'name': _nameController.text,
      'data_type': _dataType,
      'is_filterable': _isFilterable,
      if (_dataType == 'enum') 'options': _optionsController.text.split(',').map((e) => e.trim()).where((e) => e.isNotEmpty).toList(),
    };
    try {
      await ApiService.createPropertyAttribute(data);
      if (mounted) Navigator.of(context).pop(true);
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString()), backgroundColor: Colors.red));
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Créer un nouvel Attribut'),
      content: Form(
        key: _formKey,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextFormField(controller: _nameController, decoration: const InputDecoration(labelText: 'Nom de l\'attribut'), validator: (v) => v!.isEmpty ? 'Requis' : null),
              DropdownButtonFormField<String>(
                value: _dataType,
                items: ['string', 'integer', 'boolean', 'enum'].map((e) => DropdownMenuItem(value: e, child: Text(e))).toList(),
                onChanged: (val) => setState(() => _dataType = val!),
                decoration: const InputDecoration(labelText: 'Type de donnée'),
              ),
              if (_dataType == 'enum')
                TextFormField(controller: _optionsController, decoration: const InputDecoration(labelText: 'Options (séparées par une virgule)'), validator: (v) => v!.isEmpty ? 'Requis pour enum' : null),
              SwitchListTile(title: const Text('Utilisable comme filtre'), value: _isFilterable, onChanged: (val) => setState(() => _isFilterable = val)),
            ],
          ),
        ),
      ),
      actions: [
        TextButton(child: const Text('Annuler'), onPressed: () => Navigator.of(context).pop()),
        ElevatedButton(child: const Text('Sauvegarder'), onPressed: _submit),
      ],
    );
  }
}

// --- DIALOGUE POUR GÉRER LES ASSOCIATIONS (SCOPES) ---
class _ManageScopesDialog extends StatefulWidget {
  final dynamic propertyType;
  const _ManageScopesDialog({required this.propertyType});

  @override
  State<_ManageScopesDialog> createState() => _ManageScopesDialogState();
}

class _ManageScopesDialogState extends State<_ManageScopesDialog> {
  late Future<List<dynamic>> _allAttributesFuture;
  final Set<int> _selectedAttributeIds = {};
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _allAttributesFuture = ApiService.getAllAttributes();
    // Pré-remplit l'ensemble avec les IDs déjà associés
    List<dynamic> currentAttributes = widget.propertyType['attributes'] ?? [];
    for (var attr in currentAttributes) {
      _selectedAttributeIds.add(attr['id']);
    }
  }

  Future<void> _submit() async {
    setState(() => _isLoading = true);
    try {
      await ApiService.updatePropertyTypeScopes(widget.propertyType['id'], _selectedAttributeIds.toList());
      if(mounted) Navigator.of(context).pop(true);
    } catch(e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString()), backgroundColor: Colors.red));
    } finally {
      if(mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text('Attributs pour "${widget.propertyType['name']}"'),
      content: SizedBox(
        width: 400,
        child: FutureBuilder<List<dynamic>>(
          future: _allAttributesFuture,
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const Center(child: CircularProgressIndicator());
            }
            if (snapshot.hasError) return Text('Erreur: ${snapshot.error}');
            if (!snapshot.hasData || snapshot.data!.isEmpty) return const Text('Aucun attribut n\'a été créé.');
            
            final allAttributes = snapshot.data!;
            return ListView.builder(
              itemCount: allAttributes.length,
              itemBuilder: (context, index) {
                final attr = allAttributes[index];
                return CheckboxListTile(
                  title: Text(attr['name']),
                  value: _selectedAttributeIds.contains(attr['id']),
                  onChanged: (bool? value) {
                    setState(() {
                      if (value == true) {
                        _selectedAttributeIds.add(attr['id']);
                      } else {
                        _selectedAttributeIds.remove(attr['id']);
                      }
                    });
                  },
                );
              },
            );
          },
        ),
      ),
      actions: [
        TextButton(child: const Text('Annuler'), onPressed: () => Navigator.of(context).pop()),
        if (_isLoading) const CircularProgressIndicator() else ElevatedButton(child: const Text('Sauvegarder'), onPressed: _submit),
      ],
    );
  }
}

// --- WIDGET POUR LA GESTION DES ATTRIBUTS ---
class AttributeManagementView extends StatefulWidget {
  const AttributeManagementView({super.key});

  @override
  State<AttributeManagementView> createState() => _AttributeManagementViewState();
}

class _AttributeManagementViewState extends State<AttributeManagementView> {
  late Future<List<dynamic>> _attributesFuture;

  @override
  void initState() {
    super.initState();
    _loadAttributes();
  }

  void _loadAttributes() {
    setState(() {
      _attributesFuture = ApiService.getAllAttributes();
    });
  }

  void _showSnackBar(String message, {bool isError = false}) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), backgroundColor: isError ? Colors.red : Colors.green),
    );
  }

  void _showAddEditAttributeDialog({dynamic attribute}) {
    showDialog(
      context: context,
      builder: (_) => _AddEditAttributeDialog(attribute: attribute),
    ).then((success) {
      if (success == true) {
        _showSnackBar('Attribut sauvegardé !');
        _loadAttributes();
      }
    });
  }

  void _confirmDeleteAttribute(int id, String name) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Confirmer la suppression'),
        content: Text('Voulez-vous vraiment supprimer l\'attribut "$name" ?'),
        actions: [
          TextButton(child: const Text('Annuler'), onPressed: () => Navigator.of(ctx).pop()),
          TextButton(
            child: const Text('Supprimer', style: TextStyle(color: Colors.red)),
            onPressed: () async {
              Navigator.of(ctx).pop(); // Ferme le dialogue avant l\'appel API
              try {
                await ApiService.deletePropertyAttribute(id);
                _showSnackBar('Attribut supprimé avec succès.');
                _loadAttributes();
              } catch (e) {
                _showSnackBar(e.toString(), isError: true);
              }
            },
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: FutureBuilder<List<dynamic>>(
        future: _attributesFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return Center(child: Text('Erreur: ${snapshot.error}'));
          }
          if (!snapshot.hasData || snapshot.data!.isEmpty) {
            return const Center(child: Text('Aucun attribut trouvé. Créez-en un !'));
          }

          final attributes = snapshot.data!;
          return ListView.builder(
            itemCount: attributes.length,
            itemBuilder: (context, index) {
              final attr = attributes[index];
              return Card(
                margin: const EdgeInsets.symmetric(vertical: 8.0),
                child: ListTile(
                  title: Text(attr['name']),
                  subtitle: Text('Type: ${attr['data_type']} - Filtrable: ${attr['is_filterable'] ? 'Oui' : 'Non'}'),
                  trailing: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      IconButton(
                        icon: const Icon(Icons.edit, color: Colors.blue),
                        tooltip: 'Modifier l\'attribut',
                        onPressed: () => _showAddEditAttributeDialog(attribute: attr),
                      ),
                      IconButton(
                        icon: const Icon(Icons.delete, color: Colors.red),
                        tooltip: 'Supprimer l\'attribut',
                        onPressed: () => _confirmDeleteAttribute(attr['id'], attr['name']),
                      ),
                    ],
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }
}

// --- DIALOGUE POUR AJOUTER/MODIFIER UN ATTRIBUT ---
class _AddEditAttributeDialog extends StatefulWidget {
  final dynamic attribute;
  const _AddEditAttributeDialog({this.attribute});

  @override
  State<_AddEditAttributeDialog> createState() => __AddEditAttributeDialogState();
}

class __AddEditAttributeDialogState extends State<_AddEditAttributeDialog> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _optionsController = TextEditingController();
  late String _dataType;
  late bool _isFilterable;
  bool get _isEditing => widget.attribute != null;

  @override
  void initState() {
    super.initState();
    if (_isEditing) {
      _nameController.text = widget.attribute['name'];
      _dataType = widget.attribute['data_type'];
      _isFilterable = widget.attribute['is_filterable'];
      if (_dataType == 'enum' && widget.attribute['options'] != null) {
        _optionsController.text = (widget.attribute['options'] as List).join(', ');
      }
    } else {
      _dataType = 'string';
      _isFilterable = false;
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _optionsController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    final data = {
      'name': _nameController.text,
      'data_type': _dataType,
      'is_filterable': _isFilterable,
      if (_dataType == 'enum') 'options': _optionsController.text.split(',').map((e) => e.trim()).where((e) => e.isNotEmpty).toList(),
    };
    try {
      if (_isEditing) {
        await ApiService.updatePropertyAttribute(widget.attribute['id'], data);
      } else {
        await ApiService.createPropertyAttribute(data);
      }
      if (mounted) Navigator.of(context).pop(true);
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString()), backgroundColor: Colors.red));
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text(_isEditing ? 'Modifier l\'Attribut' : 'Ajouter un Attribut'),
      content: Form(
        key: _formKey,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextFormField(controller: _nameController, decoration: const InputDecoration(labelText: 'Nom de l\'attribut'), validator: (v) => v!.isEmpty ? 'Requis' : null),
              DropdownButtonFormField<String>(
                value: _dataType,
                items: ['string', 'integer', 'boolean', 'enum'].map((e) => DropdownMenuItem(value: e, child: Text(e))).toList(),
                onChanged: (val) => setState(() => _dataType = val!),
                decoration: const InputDecoration(labelText: 'Type de donnée'),
              ),
              if (_dataType == 'enum')
                TextFormField(controller: _optionsController, decoration: const InputDecoration(labelText: 'Options (séparées par une virgule)'), validator: (v) => v!.isEmpty ? 'Requis pour enum' : null),
              SwitchListTile(title: const Text('Utilisable comme filtre'), value: _isFilterable, onChanged: (val) => setState(() => _isFilterable = val)),
            ],
          ),
        ),
      ),
      actions: [
        TextButton(child: const Text('Annuler'), onPressed: () => Navigator.of(context).pop()),
        ElevatedButton(child: const Text('Sauvegarder'), onPressed: _submit),
      ],
    );
  }
}