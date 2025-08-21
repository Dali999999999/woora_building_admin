// lib/auth_screen.dart

import 'package:flutter/material.dart';
import 'apiservice.dart';      // Notre service API mis à jour
import 'dashboard.dart'; // Importation du nouvel écran de tableau de bord

// Enum pour gérer l'état de l'interface
enum AuthMode { login, signup, verify }

class AuthScreen extends StatefulWidget {
  const AuthScreen({super.key});

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  final _formKey = GlobalKey<FormState>();
  AuthMode _authMode = AuthMode.login;
  bool _isLoading = false;

  // Contrôleurs pour les champs du formulaire
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _verificationCodeController = TextEditingController();
  
  // Affiche une barre de notification (SnackBar)
  void _showSnackBar(String message, {bool isError = false}) {
    // Vérifie si le widget est toujours monté avant d'afficher la SnackBar
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: isError ? Theme.of(context).colorScheme.error : Colors.green,
      ),
    );
  }

  // Bascule entre le mode connexion et inscription
  void _switchAuthMode() {
    setState(() {
      _authMode = (_authMode == AuthMode.login) ? AuthMode.signup : AuthMode.login;
    });
  }

  /// Gère la soumission du formulaire pour toutes les actions (connexion, inscription, vérification)
  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) {
      return; // Validation du formulaire a échoué
    }
    _formKey.currentState!.save();
    setState(() => _isLoading = true);

    try {
      if (_authMode == AuthMode.login) {
        // --- LOGIQUE DE CONNEXION MISE À JOUR ---
        final result = await ApiService.login(
          _emailController.text.trim(),
          _passwordController.text,
        );
        _showSnackBar('Connexion réussie ! Rôle : ${result['user_role']}');

        // Navigation vers le tableau de bord après une connexion réussie
        if (mounted) {
          Navigator.of(context).pushReplacement(
            MaterialPageRoute(builder: (_) => const DashboardScreen()),
          );
        }
      
      } else if (_authMode == AuthMode.signup) {
        // Logique d'inscription
        final message = await ApiService.register(
          email: _emailController.text.trim(),
          password: _passwordController.text,
          firstName: _firstNameController.text.trim(),
          lastName: _lastNameController.text.trim(),
          phoneNumber: _phoneController.text.trim(),
        );
        _showSnackBar(message);
        // On passe à l'écran de vérification après avoir initié l'inscription
        setState(() => _authMode = AuthMode.verify);
      
      } else if (_authMode == AuthMode.verify) {
        // Logique de vérification de l'email
        final message = await ApiService.verifyEmail(
          _emailController.text.trim(), // L'email est conservé depuis l'étape d'inscription
          _verificationCodeController.text.trim(),
        );
        _showSnackBar(message);
        // Après vérification, on retourne à l'écran de connexion
        setState(() {
          _authMode = AuthMode.login;
          _passwordController.clear();
          _verificationCodeController.clear();
        });
      }
    } catch (e) {
      _showSnackBar(e.toString(), isError: true);
    }

    // S'assure que le chargement s'arrête même en cas d'erreur
    if (mounted) {
      setState(() => _isLoading = false);
    }
  }

  // Libère les contrôleurs pour éviter les fuites de mémoire
  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _firstNameController.dispose();
    _lastNameController.dispose();
    _phoneController.dispose();
    _verificationCodeController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    // Détermine la taille de l'écran pour un design adaptatif (responsive)
    final deviceSize = MediaQuery.of(context).size;

    return Scaffold(
      body: Center(
        child: Container(
          width: deviceSize.width > 500 ? 450 : deviceSize.width * 0.9,
          child: Card(
            elevation: 8.0,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10.0)),
            child: Padding(
              padding: const EdgeInsets.all(24.0),
              child: Form(
                key: _formKey,
                child: SingleChildScrollView(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        _authMode == AuthMode.login ? 'Connexion Admin' : 
                        _authMode == AuthMode.signup ? 'Inscription Admin' : 'Vérification de l\'Email',
                        style: Theme.of(context).textTheme.headlineSmall,
                      ),
                      const SizedBox(height: 20),

                      // Affiche les champs en fonction du mode (connexion/inscription ou vérification)
                      if (_authMode != AuthMode.verify) ...[
                        TextFormField(
                          controller: _emailController,
                          decoration: const InputDecoration(labelText: 'Email', prefixIcon: Icon(Icons.email)),
                          keyboardType: TextInputType.emailAddress,
                          validator: (value) => (value == null || !value.contains('@'))
                              ? 'Veuillez entrer un email valide'
                              : null,
                        ),
                        const SizedBox(height: 12),
                        if (_authMode == AuthMode.signup) ...[
                          TextFormField(
                            controller: _firstNameController,
                            decoration: const InputDecoration(labelText: 'Prénom', prefixIcon: Icon(Icons.person)),
                            validator: (value) => (value == null || value.isEmpty)
                                ? 'Le prénom est requis'
                                : null,
                          ),
                          const SizedBox(height: 12),
                          TextFormField(
                            controller: _lastNameController,
                            decoration: const InputDecoration(labelText: 'Nom', prefixIcon: Icon(Icons.person_outline)),
                            validator: (value) => (value == null || value.isEmpty)
                                ? 'Le nom est requis'
                                : null,
                          ),
                           const SizedBox(height: 12),
                          TextFormField(
                            controller: _phoneController,
                            decoration: const InputDecoration(labelText: 'Téléphone', prefixIcon: Icon(Icons.phone)),
                             keyboardType: TextInputType.phone,
                            validator: (value) => (value == null || value.isEmpty)
                                ? 'Le numéro de téléphone est requis'
                                : null,
                          ),
                           const SizedBox(height: 12),
                        ],
                        TextFormField(
                          controller: _passwordController,
                          decoration: const InputDecoration(labelText: 'Mot de passe', prefixIcon: Icon(Icons.lock)),
                          obscureText: true,
                          validator: (value) => (value == null || value.length < 6)
                              ? 'Le mot de passe doit faire au moins 6 caractères'
                              : null,
                        ),
                      ] else ...[
                        // Vue pour la vérification du code
                        Text(
                          'Un code a été envoyé à l\'adresse ${_emailController.text}. Veuillez le saisir ci-dessous pour activer votre compte.',
                           textAlign: TextAlign.center,
                           style: const TextStyle(height: 1.5),
                        ),
                        const SizedBox(height: 20),
                         TextFormField(
                          controller: _verificationCodeController,
                          decoration: const InputDecoration(labelText: 'Code de vérification', prefixIcon: Icon(Icons.pin)),
                           keyboardType: TextInputType.number,
                          validator: (value) => (value == null || value.length < 4)
                              ? 'Veuillez entrer un code valide'
                              : null,
                        ),
                      ],

                      const SizedBox(height: 24),
                      if (_isLoading)
                        const CircularProgressIndicator()
                      else
                        ElevatedButton(
                          onPressed: _submit,
                          style: ElevatedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(horizontal: 50, vertical: 15),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(30),
                            ),
                          ),
                          child: Text(
                            _authMode == AuthMode.login ? 'CONNEXION' :
                            _authMode == AuthMode.signup ? 'CRÉER LE COMPTE' : 'VÉRIFIER'
                          ),
                        ),

                      if (_authMode != AuthMode.verify)
                        TextButton(
                          onPressed: _switchAuthMode,
                          child: Text(
                            _authMode == AuthMode.login
                                ? 'Pas encore de compte ? S\'inscrire'
                                : 'Déjà un compte ? Se connecter',
                          ),
                        ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}