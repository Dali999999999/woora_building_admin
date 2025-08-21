// lib/main.dart
import 'package:flutter/material.dart';
import 'connexion.dart'; // Importez votre nouvel écran

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Admin Panel',
      theme: ThemeData(
        primarySwatch: Colors.blueGrey,
        inputDecorationTheme: const InputDecorationTheme(
          border: OutlineInputBorder(),
        ),
      ),
      home: const AuthScreen(), // Votre écran d'authentification est la page de démarrage
    );
  }
}