// Copyright 2025 Yassine Dbaichi
// Licensed under MIT License

/// Application String Constants
///
/// Centralized location for all user-facing text strings.
/// This file prepares the app for future internationalization (i18n).
///
/// **Organization:**
/// - General messages (errors, success, validation)
/// - Authentication & Login
/// - Order Management
/// - Navigation & Maps
/// - UI Labels
///
/// **Future i18n Migration:**
/// To add multi-language support, replace this file with:
/// - Flutter's intl package
/// - arb files for each language
/// - Generated localization classes
///
/// **Usage:**
/// ```dart
/// Text(AppStrings.loginTitle)
/// SnackBar(content: Text(AppStrings.errorNetworkFailure))
/// ```
class AppStrings {
  // Private constructor to prevent instantiation
  AppStrings._();

  // ============================================
  // GENERAL MESSAGES
  // ============================================

  /// Generic error messages
  static const String errorGeneric = 'Une erreur est survenue';
  static const String errorNetworkFailure = 'Erreur de connexion au serveur';
  static const String errorNetworkTimeout = 'La requête a expiré';
  static const String errorInvalidData = 'Données invalides';
  static const String errorUnauthorized = 'Non autorisé';
  static const String errorNotFound = 'Ressource introuvable';
  static const String errorServerError = 'Erreur serveur';

  /// Success messages
  static const String successGeneric = 'Opération réussie';
  static const String successSaved = 'Enregistré avec succès';
  static const String successUpdated = 'Mis à jour avec succès';
  static const String successDeleted = 'Supprimé avec succès';

  /// Validation messages
  static const String validationRequired = 'Ce champ est requis';
  static const String validationEmailInvalid = 'Email invalide';
  static const String validationPasswordTooShort = 'Mot de passe trop court';
  static const String validationPasswordRequired = 'Veuillez saisir votre mot de passe';

  // ============================================
  // AUTHENTICATION & LOGIN
  // ============================================

  static const String appTitle = 'Book Marketplace';
  static const String appTitleSeller = 'Application Vendeurs';
  static const String loginTitle = 'Book Delivery';
  static const String loginSubtitle = 'Application Vendeurs';
  static const String loginEmailLabel = 'Email';
  static const String loginEmailHint = 'vendeur@example.com';
  static const String loginPasswordLabel = 'Mot de passe';
  static const String loginPasswordHint = 'Votre mot de passe';
  static const String loginButton = 'Se connecter';
  static const String loginLoading = 'Connexion en cours...';

  static const String loginErrorSellerOnly =
      'Cette application est réservée aux vendeurs uniquement. '
      'Les acheteurs doivent utiliser l\'application web.';
  static const String loginErrorInvalidCredentials = 'Email ou mot de passe incorrect';
  static const String loginErrorAccountNotFound = 'Aucun compte trouvé avec cet email';
  static const String loginSuccess = 'Connexion réussie';

  // ============================================
  // ORDER MANAGEMENT
  // ============================================

  /// Order status labels
  static const String orderStatusPending = 'En attente';
  static const String orderStatusConfirmed = 'Confirmée';
  static const String orderStatusDelivered = 'Livrée';
  static const String orderStatusRefused = 'Refusée';
  static const String orderStatusUnknown = 'Inconnu';

  /// Order status actions
  static const String orderActionConfirm = '✅ Confirmer';
  static const String orderActionDeliver = '📦 Marquer comme livrée';
  static const String orderActionRefuse = '❌ Refuser';

  /// Order page titles
  static const String ordersTitle = 'Mes Commandes';
  static const String ordersTabAll = 'Toutes';
  static const String ordersTabToDeliver = 'À livrer';
  static const String ordersTabDelivered = 'Livrées';
  static const String ordersTabPending = 'En attente';

  /// Order details labels
  static const String orderDetailsTitle = 'Détails de la commande';
  static const String orderLabelCustomer = 'Client';
  static const String orderLabelBook = 'Livre';
  static const String orderLabelQuantity = 'Quantité';
  static const String orderLabelPrice = 'Prix';
  static const String orderLabelTotal = 'Total';
  static const String orderLabelStatus = 'Statut';
  static const String orderLabelAddress = 'Adresse de livraison';
  static const String orderLabelBuyerNotes = 'Notes du client';
  static const String orderLabelSellerNotes = 'Notes du vendeur';
  static const String orderLabelCreatedAt = 'Créée le';

  /// Order actions
  static const String orderButtonChangeStatus = 'Changer le statut';
  static const String orderButtonViewOnMap = 'Voir sur la carte';
  static const String orderHintSellerNotes = 'Notes pour cette commande (optionnel)';

  /// Order status change
  static const String orderStatusChangeTitle = 'Changer le statut de la commande';
  static const String orderStatusChangeSuccess = 'Statut mis à jour avec succès';
  static const String orderStatusChangeError = 'Erreur lors de la mise à jour du statut';

  /// Order messages
  static const String orderNoOrders = 'Aucune commande';
  static const String orderNoOrdersDescription = 'Vous n\'avez aucune commande pour le moment';
  static const String orderLoadError = 'Impossible de charger les commandes';

  // ============================================
  // TOUR & ROUTE PLANNING
  // ============================================

  static const String tourSelectionTitle = 'Sélection de la tournée';
  static const String tourSelectionSelectAll = 'Tout sélectionner';
  static const String tourSelectionDeselectAll = 'Tout désélectionner';
  static const String tourSelectionStart = 'Démarrer la tournée';
  static const String tourSelectionMinimumWarning =
      '⚠️ Veuillez sélectionner au moins une commande';

  static const String tourTitle = 'Tournée';
  static const String tourSetStartPoint = '📍 Cliquez sur la carte ou utilisez GPS';
  static const String tourStartPointSet = '✅ Point de départ défini';
  static const String tourButtonCalculate = 'Calculer';
  static const String tourButtonCalculating = 'Calcul...';
  static const String tourButtonNavigate = 'Naviguer';
  static const String tourButtonGPS = 'Ma position GPS';

  static const String tourCalculateFirst = 'Veuillez d\'abord calculer la tournée';
  static const String tourRouteCalculated = 'Itinéraire calculé avec succès';
  static const String tourRouteError = 'Erreur lors du calcul de l\'itinéraire';

  /// Turn-by-turn directions
  static const String tourDirectionsTitle = 'Itinéraire détaillé';
  static const String tourDirectionsSteps = 'étapes';

  // ============================================
  // NAVIGATION APPS
  // ============================================

  static const String navChooseApp = 'Naviguer avec';
  static const String navGoogleMaps = 'Google Maps';
  static const String navGoogleMapsDesc = 'Route complète avec tous les arrêts optimisés';
  static const String navWaze = 'Waze';
  static const String navWazeDesc = 'Vers destination finale • Utilise GPS actuel';

  static const String navGoogleMapsNotInstalled = 'Google Maps n\'est pas installé';
  static const String navWazeNotInstalled = 'Waze n\'est pas installé';
  static const String navInstall = 'Installer';
  static const String navOpenError = 'Impossible d\'ouvrir la navigation';

  // ============================================
  // MAP & LOCATION
  // ============================================

  static const String mapNoLocation = 'Aucune localisation disponible';
  static const String mapLocationPermissionDenied =
      'Permission de localisation refusée';
  static const String mapLocationServiceDisabled =
      'Service de localisation désactivé';
  static const String mapLocationError = 'Erreur lors de la récupération de la position';
  static const String mapGettingLocation = 'Récupération de la position...';

  // ============================================
  // UI LABELS
  // ============================================

  static const String labelClose = 'Fermer';
  static const String labelCancel = 'Annuler';
  static const String labelConfirm = 'Confirmer';
  static const String labelSave = 'Enregistrer';
  static const String labelDelete = 'Supprimer';
  static const String labelEdit = 'Modifier';
  static const String labelSearch = 'Rechercher';
  static const String labelFilter = 'Filtrer';
  static const String labelRefresh = 'Actualiser';
  static const String labelLoading = 'Chargement...';
  static const String labelNoData = 'Aucune donnée';
  static const String labelError = 'Erreur';
  static const String labelSuccess = 'Succès';
  static const String labelWarning = 'Attention';
  static const String labelInfo = 'Information';

  // ============================================
  // DISTANCE & TIME FORMATTING
  // ============================================

  static const String formatKilometers = 'km';
  static const String formatMeters = 'm';
  static const String formatMinutes = 'min';
  static const String formatHours = 'h';
}
