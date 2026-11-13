# Safinum Haoussa

Extension Chrome qui rend les services financiers numériques compréhensibles **en haoussa**, sans modifier leur code source. Projet réalisé pour le **SAFINUM Innovate Challenge**.

## Contexte et objectifs

Au Cameroun, la plupart des applications bancaires, plateformes de paiement et services de microfinance ne sont disponibles qu'en français ou en anglais. Pour une partie de la population, cette barrière linguistique empêche de comprendre un solde, des frais, un récapitulatif de transfert ou un avertissement de sécurité.

Objectifs du projet :

- traduire en haoussa l'interface d'un service financier existant, **sans intervenir sur son code** ;
- accompagner l'utilisateur dans un parcours complet : consultation du solde, vérification des frais, préparation d'un transfert, confirmation ;
- garantir que **les montants, frais, bénéficiaires et avertissements de sécurité ne sont jamais altérés** ;
- traiter des **messages inédits**, apparus pendant l'utilisation.

## Fonctionnalités

| Fonctionnalité | Description |
|---|---|
| Traduction de l'interface | Textes, boutons, titres et attributs `placeholder`, `title` et `aria-label`. |
| Lexique validé | Phrases et termes financiers traduits à l'avance (`dictionary.js`). |
| Modèles de phrases | Phrases à emplacements, par exemple `Des frais de {montant} seront appliqués.`. Le montant est recopié à l'identique. |
| Contenu inédit | Les textes ajoutés après le chargement de la page sont détectés et traduits. |
| Traduction automatique encadrée | Une phrase absente du lexique est envoyée à MyMemory **après masquage** des montants, numéros, e-mails et noms. Le résultat est vérifié avant affichage. |
| Signalement visuel | Traduction automatique ou partielle : soulignement orange. Message de sécurité non validé : cadre rouge. |
| Texte original au survol | Une infobulle affiche le texte français d'origine. |
| Activation par site | L'extension est inactive par défaut et ne s'active que sur les sites choisis. |
| Retour à l'original | La désactivation restaure exactement la page d'origine. |

## Technologies

- **JavaScript (ES2022)**, sans framework ni dépendance npm
- **API Chrome Extensions, Manifest V3** :
  - `content_scripts` ;
  - service worker ;
  - `chrome.storage` ;
  - `chrome.scripting`.
- **API DOM** : `MutationObserver`, `TreeWalker`, Shadow DOM pour l'infobulle
- **API MyMemory** (`api.mymemory.translated.net`), paire `fr|ha`, pour la traduction automatique

## Architecture

```
Safinum_extensoin/
├── manifest.json     Déclaration de l'extension (Manifest V3)
├── dictionary.js     Lexique français → haoussa (données uniquement)
├── translator.js     Moteur de traduction, sans accès au DOM
├── content.js        Application des traductions dans la page
├── background.js     Service worker : appels à MyMemory, cache, file d'attente
├── popup.html        Interface du bouton de l'extension
└── popup.js          Activation par site, option de traduction automatique
```

### Rôle de chaque composant

```
popup.js ──(chrome.storage)──► content.js ──► translator.js ──► dictionary.js
                                    │
                                    └──(message, texte masqué)──► background.js ──► MyMemory
```

- **`translator.js`** décide de la traduction d'un texte. Il ne touche pas au DOM, ce qui permet de le tester isolément.
- **`content.js`** parcourt la page, applique les traductions, conserve les textes d'origine et observe les modifications.
- **`background.js`** est le seul composant qui accède au réseau.

### Traitement d'un texte

1. Un montant ou un numéro seul est **laissé intact**.
2. Une phrase présente dans le lexique est **traduite**.
3. Une phrase qui correspond à un modèle est **traduite**, et ses montants et noms sont recopiés à l'identique.
4. Un texte entièrement couvert par les termes du lexique est **traduit** mot à mot.
5. Un texte inconnu est masqué, envoyé à la traduction automatique, puis **vérifié** :
   - chaque valeur masquée doit être présente exactement une fois ;
   - aucun chiffre ne doit avoir été ajouté.
6. Si la traduction automatique n'est pas disponible :
   - un message de sécurité **reste en français**, encadré en rouge ;
   - un autre texte reçoit une traduction partielle, signalée.

## Prérequis

- Google Chrome (ou un navigateur Chromium) version 102 ou supérieure
- Une connexion Internet, uniquement pour la traduction automatique des messages inédits

Aucune installation de dépendances ni étape de compilation n'est nécessaire.

## Installation

1. Ouvrir `chrome://extensions`.
2. Activer le **Mode développeur** (en haut à droite).
3. Cliquer sur **Charger l'extension non empaquetée**.
4. Sélectionner le dossier du projet, celui qui contient `manifest.json`.
5. *(Pour une démonstration sur un fichier HTML local)* Ouvrir les **Détails** de l'extension et activer **Autoriser l'accès aux URL de fichier**.

Après toute modification du code, cliquer sur le bouton **↻** de l'extension dans `chrome://extensions`.

## Utilisation

1. Ouvrir le service financier dans Chrome.
2. Cliquer sur l'icône de l'extension, puis sur **Traduire ce site**. Le choix est mémorisé pour ce site.
3. Survoler un texte traduit pour afficher le texte original.
4. La case **Traduction automatique des messages inconnus** active ou désactive l'envoi à MyMemory.
5. **Arrêter la traduction sur ce site** restaure la page d'origine.

## Sécurité et confidentialité

- **Inactive par défaut** : sur un site non activé, aucune donnée n'est lue, modifiée ni transmise.
- **Masquage** : montants, numéros, e-mails, URL, sigles et noms propres sont remplacés par des jetons `{A}`, `{B}`… avant tout envoi. Ces valeurs ne quittent pas le navigateur.
- **Contrôle d'intégrité** : une traduction automatique qui perd, duplique ou ajoute une valeur est rejetée.
- **Zones non modifiées** :
  - la valeur des champs de saisie et les zones éditables ;
  - les balises `<script>`, `<style>` et `<code>` ;
  - les éléments marqués `translate="no"`.
- **Cache local** : 1 000 traductions au maximum. Une phrase déjà traduite n'est pas renvoyée au service.

| Composant tiers | Usage | Données transmises |
|---|---|---|
| API MyMemory | Traduction automatique des messages inédits | Phrases masquées, uniquement sur les sites activés |

## Langue prise en charge et validation linguistique

- **Langue** : haoussa (`ha`).
- **Organisation du lexique** (`dictionary.js`) :
  - `vocabulaire` et `modeles` : entrées rédigées par l'équipe ;
  - `vocabulaireAValider` et `modelesAValider` : entrées en attente de relecture.
- **Méthode** : chaque entrée en attente est relue par un locuteur natif, puis déplacée dans la section validée. Les traductions automatiques ne sont jamais présentées comme validées.
- **Relecteurs** : *à compléter (nom, profil, date de relecture).*

## Limites connues

- **Phrase découpée par des balises HTML** (`Vérifiez le <b>numéro</b>…`) : chaque fragment est traduit séparément.
- **Qualité de MyMemory** : la traduction automatique vers le haoussa est inégale. Elle est donc signalée visuellement.
- **Nom propre en début de phrase** : il ne peut pas être distingué d'un mot ordinaire, et peut être transmis au service de traduction.
- **Cadres (`iframe`)** : seule la page principale est traduite.
- **Hors connexion** : seuls le lexique et le cache local sont utilisés.
