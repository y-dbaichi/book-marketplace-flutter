import '../models/point_de_vente.dart';

class SamplePointsService {
  static List<PointDeVente> getCasablancaPoints() {
    return [
      PointDeVente(
        nom: "Carrefour Aïn Diab",
        adresse: "Boulevard de la Corniche, Aïn Diab, Casablanca",
        contact: "Ahmed Bennani",
        telephone: "+212 522 123 456",
        capaciteStockage: 500,
        latitude: 33.5731,
        longitude: -7.6298,
      ),
      PointDeVente(
        nom: "Marjane Sidi Maârouf",
        adresse: "Sidi Maârouf, Casablanca",
        contact: "Fatima Alami",
        telephone: "+212 522 234 567",
        capaciteStockage: 800,
        latitude: 33.5138,
        longitude: -7.6572,
      ),
      PointDeVente(
        nom: "Morocco Mall",
        adresse: "Boulevard de la Corniche, Aïn Diab, Casablanca",
        contact: "Youssef Tazi",
        telephone: "+212 522 345 678",
        capaciteStockage: 1200,
        latitude: 33.5731,
        longitude: -7.6298,
      ),
      PointDeVente(
        nom: "Twin Center",
        adresse: "Boulevard Zerktouni, Casablanca",
        contact: "Laila Chraibi",
        telephone: "+212 522 456 789",
        capaciteStockage: 300,
        latitude: 33.5928,
        longitude: -7.6192,
      ),
      PointDeVente(
        nom: "Maarif Market",
        adresse: "Quartier Maarif, Casablanca",
        contact: "Omar Fassi",
        telephone: "+212 522 567 890",
        capaciteStockage: 400,
        latitude: 33.5731,
        longitude: -7.5898,
      ),
      PointDeVente(
        nom: "Derb Ghallef",
        adresse: "Derb Ghallef, Casablanca",
        contact: "Nadia Berrada",
        telephone: "+212 522 678 901",
        capaciteStockage: 600,
        latitude: 33.5651,
        longitude: -7.6081,
      ),
      PointDeVente(
        nom: "Hay Hassani Center",
        adresse: "Hay Hassani, Casablanca",
        contact: "Rachid Amrani",
        telephone: "+212 522 789 012",
        capaciteStockage: 350,
        latitude: 33.5431,
        longitude: -7.6331,
      ),
      PointDeVente(
        nom: "Bouskoura Mall",
        adresse: "Bouskoura, Casablanca",
        contact: "Samira Idrissi",
        telephone: "+212 522 890 123",
        capaciteStockage: 700,
        latitude: 33.4731,
        longitude: -7.6598,
      ),
    ];
  }

  static List<PointDeVente> getRabatPoints() {
    return [
      PointDeVente(
        nom: "Mega Mall Rabat",
        adresse: "Avenue Annakhil, Hay Riad, Rabat",
        contact: "Karim Benjelloun",
        telephone: "+212 537 123 456",
        capaciteStockage: 900,
        latitude: 33.9716,
        longitude: -6.8498,
      ),
      PointDeVente(
        nom: "Agdal Market",
        adresse: "Quartier Agdal, Rabat",
        contact: "Aicha Lamrani",
        telephone: "+212 537 234 567",
        capaciteStockage: 450,
        latitude: 33.9716,
        longitude: -6.8498,
      ),
      PointDeVente(
        nom: "Souissi Center",
        adresse: "Souissi, Rabat",
        contact: "Hassan Kettani",
        telephone: "+212 537 345 678",
        capaciteStockage: 550,
        latitude: 33.9816,
        longitude: -6.8398,
      ),
      PointDeVente(
        nom: "Temara Plaza",
        adresse: "Temara, Rabat-Salé-Kénitra",
        contact: "Zineb Alaoui",
        telephone: "+212 537 456 789",
        capaciteStockage: 400,
        latitude: 33.9216,
        longitude: -6.9098,
      ),
    ];
  }

  static List<PointDeVente> getMarrakechPoints() {
    return [
      PointDeVente(
        nom: "Carré Eden Marrakech",
        adresse: "Route de Casablanca, Marrakech",
        contact: "Abdellah Ouali",
        telephone: "+212 524 123 456",
        capaciteStockage: 650,
        latitude: 31.6295,
        longitude: -7.9811,
      ),
      PointDeVente(
        nom: "Menara Mall",
        adresse: "Avenue Mohammed VI, Marrakech",
        contact: "Khadija Benali",
        telephone: "+212 524 234 567",
        capaciteStockage: 800,
        latitude: 31.6295,
        longitude: -8.0081,
      ),
      PointDeVente(
        nom: "Gueliz Center",
        adresse: "Quartier Gueliz, Marrakech",
        contact: "Mohamed Tounsi",
        telephone: "+212 524 345 678",
        capaciteStockage: 500,
        latitude: 31.6395,
        longitude: -7.9911,
      ),
    ];
  }

  static Map<String, List<PointDeVente>> getAllSampleSets() {
    return {
      'Casablanca (8 points)': getCasablancaPoints(),
      'Rabat (4 points)': getRabatPoints(),
      'Marrakech (3 points)': getMarrakechPoints(),
    };
  }
}
