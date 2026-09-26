# CVGLOO — site vitrine & formulaire de devis

Site statique (HTML/CSS/JS, aucun build requis) pour **CVGLOO**, nom commercial exploité par PLARD Andy, Christian (entrepreneur individuel, RCS Créteil n° 838 496 826). CVGLOO propose : CV optimisés, sites web, modules & présentations, modules de révision, jeux mobiles personnalisés, business games, formations, automatisation & outils sur mesure.

## Structure du dépôt

```
index.html              Page d'accueil : hero, services, formulaire de devis en 3 étapes
mentions-legales.html    Mentions légales
cgv.html                 Conditions générales de vente
confidentialite.html     Politique de confidentialité (RGPD)
assets/style.css         Styles partagés par toutes les pages
assets/main.js           Logique du formulaire (étapes, récapitulatif, envoi, tracking)
robots.txt, sitemap.xml  Référencement de base
.github/workflows/deploy-pages.yml   Déploiement automatique sur GitHub Pages
marketing/                Supports de campagne prêts à l'emploi (voir plus bas)
```

## Comment fonctionne le formulaire

1. Le visiteur choisit son profil (pro/particulier), les prestations souhaitées et décrit son projet.
2. Il coche une case de consentement (obligatoire) avant de voir le récapitulatif.
3. Il choisit comment transmettre sa demande : email (ouvre le client mail), WhatsApp (ouvre une conversation pré-remplie), Instagram/Snapchat (copie le texte dans le presse-papier).
4. Chaque étape est journalisée dans un Google Sheet via un webhook Google Apps Script (`SHEET_ENDPOINT` dans `assets/main.js`) — pratique pour repérer les demandes commencées mais non finalisées.

Pour changer l'URL du Google Apps Script : modifier la constante `SHEET_ENDPOINT` en haut de `assets/main.js`.

## Déploiement (GitHub Pages)

Le site est déployé automatiquement à chaque push sur `main` grâce au workflow `.github/workflows/deploy-pages.yml`.

**Action manuelle requise une seule fois** (je n'ai pas les droits d'admin sur les paramètres du dépôt pour la faire à ta place) :
1. Sur GitHub → `Settings` → `Pages`.
2. Dans **Build and deployment → Source**, choisir **GitHub Actions**.
3. Merger cette branche sur `main` (ou pousser directement sur `main`) : le workflow se déclenche et publie le site sur `https://rocketfuel1999.github.io/cvgloo-formulaire/`.

Pour brancher un nom de domaine personnel : `Settings → Pages → Custom domain`, puis créer un enregistrement DNS `CNAME` chez ton registrar pointant vers `rocketfuel1999.github.io`.

## Tests effectués

- Chargement de chaque page (accueil, mentions légales, CGV, confidentialité) dans Chromium headless — aucune erreur console.
- Parcours complet du formulaire (étape 1 → 4), y compris la validation du consentement RGPD et de la formule site web.
- Vérification des liens internes (footer, navigation, pages légales) et des liens externes (mail, WhatsApp, Instagram, Snapchat).
- Vérification responsive (mobile 375px / desktop 1280px).

## Mise à jour des mentions légales

Les informations légales (identité, RCS, adresse) proviennent de l'extrait Kbis fourni (n° de gestion 2026A06718, à jour au 24/09/2026). Si l'activité change de forme juridique, d'adresse ou de nom commercial, mettre à jour `mentions-legales.html`, `confidentialite.html`, `cgv.html` et le footer de `index.html`.
