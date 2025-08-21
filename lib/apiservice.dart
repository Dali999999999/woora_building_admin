// lib/api_service.dart

import 'dart:convert';
import 'package:http/http.dart' as http;

class ApiService {
  // L'URL de base de votre API déployée
  static const String _baseUrl = 'https://woora-building-api.onrender.com';

  // Variable statique pour stocker le token JWT une fois l'utilisateur connecté.
  // Elle est privée pour que seule cette classe puisse la modifier.
  static String? _token;

  /// Définit le token global pour la session de l'application.
  /// Appelé après une connexion réussie.
  static void setToken(String token) {
    _token = token;
  }

  /// Efface le token global, par exemple lors d'une déconnexion.
  static void clearToken() {
    _token = null;
  }

  /// Une méthode privée et centralisée pour construire les headers des requêtes POST/PUT/DELETE.
  /// Elle ajoute automatiquement le token d'authentification si il est disponible.
  static Map<String, String> _getPostHeaders() {
    final headers = <String, String>{
      'Content-Type': 'application/json; charset=UTF-8',
    };

    if (_token != null) {
      headers['Authorization'] = 'Bearer $_token';
    }

    return headers;
  }

  /// Une méthode privée pour construire les headers des requêtes GET.
  /// N'inclut pas le Content-Type, seulement l'Authorization si nécessaire.
  static Map<String, String> _getGetHeaders() {
    final headers = <String, String>{};

    if (_token != null) {
      headers['Authorization'] = 'Bearer $_token';
    }

    return headers;
  }

  /// Tente de connecter un utilisateur.
  /// En cas de succès, stocke le token et retourne le rôle de l'utilisateur.
  /// Lance une exception avec un message d'erreur en cas d'échec.
  static Future<Map<String, dynamic>> login(String email, String password) async {
    final response = await http.post(
      Uri.parse('$_baseUrl/auth/login'),
      headers: _getPostHeaders(), // Utilise notre helper de headers pour POST
      body: jsonEncode(<String, String>{
        'email': email,
        'password': password,
      }),
    );

    final responseBody = jsonDecode(response.body);
    if (response.statusCode == 200) {
      if (responseBody['user_role'] == 'admin') {
        // Succès ! On stocke le token reçu.
        setToken(responseBody['access_token']);
        return {
          'user_role': responseBody['user_role'],
        };
      } else {
        throw Exception('Accès refusé. Seuls les administrateurs peuvent se connecter.');
      }
    } else {
      throw Exception(responseBody['message'] ?? 'Erreur de connexion');
    }
  }

  /// Initialise le processus d'inscription pour un nouvel administrateur.
  static Future<String> register({
    required String email,
    required String password,
    required String firstName,
    required String lastName,
    required String phoneNumber,
  }) async {
    final response = await http.post(
      Uri.parse('$_baseUrl/auth/register'),
      headers: _getPostHeaders(), // Utilisation du helper pour POST
      body: jsonEncode(<String, String>{
        'email': email,
        'password': password,
        'first_name': firstName,
        'last_name': lastName,
        'phone_number': phoneNumber,
        'role': 'admin', // Le rôle est fixé à 'admin'
      }),
    );

    final responseBody = jsonDecode(response.body);
    if (response.statusCode == 200) {
      return responseBody['message'];
    } else {
      throw Exception(responseBody['message'] ?? 'Erreur lors de l\'inscription.');
    }
  }

  /// Envoie le code de vérification pour finaliser l'inscription.
  static Future<String> verifyEmail(String email, String code) async {
    final response = await http.post(
      Uri.parse('$_baseUrl/auth/verify_email'),
      headers: _getPostHeaders(), // Utilisation du helper pour POST
      body: jsonEncode(<String, String>{
        'email': email,
        'code': code,
      }),
    );

    final responseBody = jsonDecode(response.body);
    if (response.statusCode == 200) {
      return responseBody['message'];
    } else {
      throw Exception(responseBody['message'] ?? 'Erreur de vérification.');
    }
  }
  
  /// Récupère le profil de l'utilisateur actuellement connecté.
  /// La méthode utilise maintenant le token stocké en interne.
  static Future<Map<String, dynamic>> getUserProfile() async {
    // Vérification de sécurité : l'utilisateur doit être connecté.
    if (_token == null) {
      throw Exception('Utilisateur non authentifié. Le token est manquant.');
    }
    
    final response = await http.get(
      Uri.parse('$_baseUrl/auth/profile'),
      headers: _getGetHeaders(), // Le helper pour GET sans Content-Type
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      final responseBody = jsonDecode(response.body);
      throw Exception(responseBody['message'] ?? 'Impossible de récupérer le profil.');
    }
  }

  static Future<List<dynamic>> getUsers() async {
    if (_token == null) {
      throw Exception('Authentification requise pour voir les utilisateurs.');
    }
    
    final response = await http.get(
      Uri.parse('$_baseUrl/admin/users'),
      headers: _getGetHeaders(),
    );

    if (response.statusCode == 200) {
      // Le corps de la réponse est une chaîne JSON représentant une liste.
      return jsonDecode(utf8.decode(response.bodyBytes));
    } else {
      final responseBody = jsonDecode(response.body);
      throw Exception(responseBody['message'] ?? 'Impossible de charger les utilisateurs.');
    }
  }

  /// Récupère la liste de toutes les propriétés.
  static Future<List<dynamic>> getProperties() async {
    if (_token == null) throw Exception('Authentification requise.');
    
    final response = await http.get(
      Uri.parse('$_baseUrl/admin/properties'),
      headers: _getGetHeaders(),
    );

    if (response.statusCode == 200) {
      return jsonDecode(utf8.decode(response.bodyBytes));
    } else {
      throw Exception('Impossible de charger les biens immobiliers.');
    }
  }

  /// Récupère les acheteurs/locataires éligibles pour un bien donné.
  static Future<List<dynamic>> getEligibleBuyers(int propertyId) async {
    if (_token == null) throw Exception('Authentification requise.');

    final response = await http.get(
      Uri.parse('$_baseUrl/admin/properties/$propertyId/eligible_buyers'),
      headers: _getGetHeaders(),
    );

    if (response.statusCode == 200) {
      return jsonDecode(utf8.decode(response.bodyBytes));
    } else {
      throw Exception('Impossible de charger les acheteurs éligibles.');
    }
  }

  /// Marque une propriété comme 'vendu' ou 'loué'.
  static Future<void> markPropertyAsTransacted({
    required int propertyId,
    required String status, // 'sold' ou 'rented'
    required int winningVisitRequestId,
  }) async {
    if (_token == null) throw Exception('Authentification requise.');

    final response = await http.put(
      Uri.parse('$_baseUrl/admin/properties/$propertyId/mark_as_transacted'),
      headers: _getPostHeaders(),
      body: jsonEncode({
        'status': status,
        'winning_visit_request_id': winningVisitRequestId,
      }),
    );

    if (response.statusCode != 200) {
      final responseBody = jsonDecode(response.body);
      throw Exception(responseBody['message'] ?? 'Erreur lors de la mise à jour du statut.');
    }
  }

  /// Récupère les demandes de visite, avec un filtre optionnel par statut.
  static Future<List<dynamic>> getVisitRequests({String? status}) async {
    if (_token == null) throw Exception('Authentification requise.');

    var uri = Uri.parse('$_baseUrl/admin/visit_requests');
    // Ajoute le paramètre de filtre à l'URL si il est fourni
    if (status != null && status.isNotEmpty) {
      uri = uri.replace(queryParameters: {'status': status});
    }

    final response = await http.get(uri, headers: _getGetHeaders());

    if (response.statusCode == 200) {
      return jsonDecode(utf8.decode(response.bodyBytes));
    } else {
      throw Exception('Impossible de charger les demandes de visite.');
    }
  }

  /// Confirme une demande de visite en attente.
  static Future<void> confirmVisitRequest(int requestId) async {
    if (_token == null) throw Exception('Authentification requise.');

    final response = await http.put(
      Uri.parse('$_baseUrl/admin/visit_requests/$requestId/confirm'),
      headers: _getPostHeaders(),
    );

    if (response.statusCode != 200) {
      final body = jsonDecode(response.body);
      throw Exception(body['message'] ?? 'Erreur lors de la confirmation.');
    }
  }

  /// Rejette une demande de visite en attente, avec un motif.
  static Future<void> rejectVisitRequest({required int requestId, required String reason}) async {
    if (_token == null) throw Exception('Authentification requise.');

    final response = await http.put(
      Uri.parse('$_baseUrl/admin/visit_requests/$requestId/reject'),
      headers: _getPostHeaders(),
      body: jsonEncode({'message': reason}),
    );

    if (response.statusCode != 200) {
      final body = jsonDecode(response.body);
      throw Exception(body['message'] ?? 'Erreur lors du rejet.');
    }
  }

  /// Récupère les types de biens AVEC leurs attributs et options associés.
  static Future<List<dynamic>> getPropertyTypesWithAttributes() async {
    if (_token == null) throw Exception('Authentification requise.');
    final response = await http.get(Uri.parse('$_baseUrl/admin/property_types_with_attributes'), headers: _getGetHeaders());
    if (response.statusCode == 200) return jsonDecode(utf8.decode(response.bodyBytes));
    throw Exception('Impossible de charger les types de biens.');
  }

  /// Récupère la liste de TOUS les attributs existants (pour les boîtes de dialogue de sélection).
  static Future<List<dynamic>> getAllAttributes() async {
    if (_token == null) throw Exception('Authentification requise.');
    final response = await http.get(Uri.parse('$_baseUrl/admin/property_attributes'), headers: _getGetHeaders());
    if (response.statusCode == 200) return jsonDecode(utf8.decode(response.bodyBytes));
    throw Exception('Impossible de charger les attributs.');
  }

  /// Crée un nouveau type de bien.
  static Future<void> createPropertyType(String name, String? description) async {
    if (_token == null) throw Exception('Authentification requise.');
    final response = await http.post(
      Uri.parse('$_baseUrl/admin/property_types'),
      headers: _getPostHeaders(),
      body: jsonEncode({'name': name, 'description': description}),
    );
    if (response.statusCode != 201) {
      final body = jsonDecode(response.body);
      throw Exception(body['message'] ?? 'Erreur lors de la création du type.');
    }
  }

  /// Met à jour un type de bien existant.
  static Future<void> updatePropertyType(int id, Map<String, dynamic> data) async {
    if (_token == null) throw Exception('Authentification requise.');
    final response = await http.put(
      Uri.parse('$_baseUrl/admin/property_types/$id'),
      headers: _getPostHeaders(),
      body: jsonEncode(data),
    );
    if (response.statusCode != 200) {
      final body = jsonDecode(response.body);
      throw Exception(body['message'] ?? 'Erreur lors de la mise à jour.');
    }
  }

  /// Supprime un type de bien.
  static Future<void> deletePropertyType(int id) async {
    if (_token == null) throw Exception('Authentification requise.');
    final response = await http.delete(Uri.parse('$_baseUrl/admin/property_types/$id'), headers: _getGetHeaders());
    if (response.statusCode != 204) {
      throw Exception('Erreur lors de la suppression du type.');
    }
  }

  /// Crée un nouvel attribut de bien.
  static Future<void> createPropertyAttribute(Map<String, dynamic> data) async {
    if (_token == null) throw Exception('Authentification requise.');
    final response = await http.post(
      Uri.parse('$_baseUrl/admin/property_attributes'),
      headers: _getPostHeaders(),
      body: jsonEncode(data),
    );
    if (response.statusCode != 201) {
      final body = jsonDecode(response.body);
      throw Exception(body['message'] ?? 'Erreur lors de la création de l\'attribut.');
    }
  }

  /// Met à jour les associations (scopes) entre un type et des attributs.
  static Future<void> updatePropertyTypeScopes(int typeId, List<int> attributeIds) async {
    if (_token == null) throw Exception('Authentification requise.');
    final response = await http.post(
      Uri.parse('$_baseUrl/admin/property_type_scopes/$typeId'),
      headers: _getPostHeaders(),
      body: jsonEncode({'attribute_ids': attributeIds}),
    );
    if (response.statusCode != 200) {
      final body = jsonDecode(response.body);
      throw Exception(body['message'] ?? 'Erreur lors de la mise à jour des associations.');
    }
  }

  /// Récupère les paramètres liés aux visites.
  static Future<Map<String, dynamic>> getVisitSettings() async {
    if (_token == null) throw Exception('Authentification requise.');
    final response = await http.get(Uri.parse('$_baseUrl/admin/settings/visits'), headers: _getGetHeaders());
    if (response.statusCode == 200) return jsonDecode(response.body);
    throw Exception('Impossible de charger les paramètres de visite.');
  }

  /// Met à jour les paramètres des visites.
  static Future<void> updateVisitSettings({required int freePasses, required double price}) async {
    if (_token == null) throw Exception('Authentification requise.');
    final response = await http.put(
      Uri.parse('$_baseUrl/admin/settings/visits'),
      headers: _getPostHeaders(),
      body: jsonEncode({
        'initial_free_visit_passes': freePasses,
        'visit_pass_price': price,
      }),
    );
    if (response.statusCode != 200) {
      final body = jsonDecode(response.body);
      throw Exception(body['message'] ?? 'Erreur lors de la mise à jour des paramètres de visite.');
    }
  }

  /// Récupère le paramètre de commission des agents.
  static Future<Map<String, dynamic>> getAgentCommissionSetting() async {
    if (_token == null) throw Exception('Authentification requise.');
    final response = await http.get(Uri.parse('$_baseUrl/admin/settings/agent_commission'), headers: _getGetHeaders());
    if (response.statusCode == 200) return jsonDecode(response.body);
    throw Exception('Impossible de charger le paramètre de commission.');
  }

  /// Met à jour le paramètre de commission des agents.
  static Future<void> updateAgentCommissionSetting({required double percentage}) async {
    if (_token == null) throw Exception('Authentification requise.');
    final response = await http.put(
      Uri.parse('$_baseUrl/admin/settings/agent_commission'),
      headers: _getPostHeaders(),
      body: jsonEncode({'agent_commission_percentage': percentage}),
    );
    if (response.statusCode != 200) {
      final body = jsonDecode(response.body);
      throw Exception(body['message'] ?? 'Erreur lors de la mise à jour de la commission.');
    }
  }

  /// Récupère toutes les demandes de recherche de biens (alertes).
  static Future<List<dynamic>> getAllPropertyRequests() async {
    if (_token == null) throw Exception('Authentification requise.');
    final response = await http.get(
      Uri.parse('$_baseUrl/admin/property_requests'),
      headers: _getGetHeaders(),
    );
    if (response.statusCode == 200) {
      return jsonDecode(utf8.decode(response.bodyBytes));
    } else {
      throw Exception('Impossible de charger les alertes de recherche.');
    }
  }

  /// Envoie une réponse à une demande de recherche de bien.
  static Future<void> respondToPropertyRequest(int requestId, String message) async {
    if (_token == null) throw Exception('Authentification requise.');
    final response = await http.post(
      Uri.parse('$_baseUrl/admin/property_requests/$requestId/respond'),
      headers: _getPostHeaders(),
      body: jsonEncode({'message': message}),
    );
    if (response.statusCode != 200) {
      final body = jsonDecode(response.body);
      throw Exception(body['message'] ?? 'Erreur lors de l\'envoi de la réponse.');
    }
  }
}