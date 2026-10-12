# Quilo 📘🤖

> **Transforme les photos de cours en fiches de révision claires, visuelles et compactes pour collégiens et lycéens.**

---

## 1. À propos de Quilo

Avant une évaluation, retrouver des définitions, formules et dates éparpillées sur 20 à 30 pages de cahier est une corvée. Beaucoup d'élèves passent des heures à recopier tout à la main pour rassembler leurs notes.

**Quilo** automatise cette compilation :
- L'élève prend en photo les pages de son cours (jusqu'à 13 photos).
- Il indique ce qu'il souhaite retenir (*toutes les définitions*, *les dates clés*, *les formules*...).
- Quilo produit **une fiche de révision unique et compacte** (format 1 page), prête à être imprimée ou exportée.

---

## 2. Comment utiliser l'application

1. **Prendre ou importer les photos** :
   - Rendez-vous sur *« Créer une fiche »*.
   - Déposez jusqu'à 13 photos de notes manuscrites ou de pages de manuel scolaire (formats JPG, PNG, HEIC).
   - Veillez à un bon éclairage et à photographier les pages bien à plat.
2. **Indiquer la consigne** :
   - Choisissez la matière du cours (Histoire-Géo, SVT, Mathématiques, Physique-Chimie, Français...).
   - Cliquez sur une suggestion rapide (*« Toutes les définitions du cours »*, *« Les dates clés »*, *« Les formules »*...) ou tapez votre consigne personnalisée.
3. **Génération instantanée** :
   - Quilo scanne et compile vos notes en moins de 25 secondes.
   - Vous pouvez annuler l'opération à tout moment pendant la génération.
4. **Réviser et Exporter** :
   - Votre fiche s'affiche instantanément au format feuille claire.
   - Exportez en **PDF** (mise en page A4 proportionnée prête à imprimer), **Image PNG** (haute définition pour smartphone) ou **Word (.docx)** éditable.
   - Votre fiche est automatiquement sauvegardée dans l'onglet **« Mes fiches »** de votre appareil.

---

## 3. Conformité RGPD, Vie privée & Cadre Légal

Quilo est pensé spécifiquement pour des collégiens et lycéens (public mineur). La protection des données est garantie par conception :

### Aucun compte ni mot de passe requis
- Aucune inscription n'est demandée (pas de nom, prénom, numéro de téléphone, ni adresse postale).
- L'élève accède directement à l'outil sans friction ni traçage publicitaire.

### Stockage 100 % local sur l'appareil (IndexedDB)
- Vos fiches de révision sont stockées exclusivement dans la mémoire sécurisée de votre navigateur (*IndexedDB*).
- Aucune fiche n'est stockée ni consultable sur un serveur distant.
- Vous gardez le contrôle total : la suppression d'une fiche efface immédiatement ses données de votre appareil.

### Traitement éphémère des photos
- Les photos de cours sont compressées directement sur votre appareil avant envoi pour réduire la bande passante.
- Elles sont transmises de façon chiffrée (HTTPS) au modèle de vision uniquement pendant les quelques secondes nécessaires à la compilation de la fiche.
- **Aucune photo n'est archivée ni conservée sur nos serveurs** après génération.

### Respect du droit d'auteur
- Quilo est conçu pour la synthèse des **notes personnelles manuscrites** de l'élève.
- L'outil n'est pas destiné à numériser ou redistribuer des manuels scolaires entiers protégés par le droit d'auteur.

---

## 4. Stack technique

- **Frontend** : React 19, TypeScript, Vite
- **Styles & Design** : Tailwind CSS, polices Google Fonts (*Baloo 2* et *Inter*), Lucide Icons
- **Persistance locale** : IndexedDB via la bibliothèque légère `idb`
- **IA & Vision** : Relais serveur sécurisé (`server.ts`) vers l'API Gemini 2.5/3.8 Flash de Google avec schéma JSON structuré
- **Moteur d'exportation réel** :
  - `jspdf` pour l'export PDF
  - `html-to-image` pour la capture PNG haute résolution
  - `docx` pour la génération de documents Microsoft Word éditables

---

## 5. Contact & Support

Pour toute question, retour d'expérience ou demande concernant la confidentialité et le RGPD :

✉️ **Contact :** [archemis.ai@gmail.com](mailto:archemis.ai@gmail.com)
