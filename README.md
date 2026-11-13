# Safinum Haoussa

Extension Chrome qui traduit en haoussa l'interface des services financiers en ligne (banque, mobile money, microfinance), sans toucher à leur code.

Projet réalisé pour le SAFINUM Innovate Challenge.

## Pourquoi

La plupart des applis financières au Cameroun sont en français ou en anglais. Pour quelqu'un qui maîtrise mal ces langues, un solde, des frais ou un message de sécurité peuvent vite être mal compris. On a voulu une solution qui marche sur n'importe quel service existant, directement dans le navigateur.

## Ce que fait l'extension

- Traduit les textes, boutons et champs de la page en haoussa
- Ne modifie jamais les montants, numéros de téléphone ni noms de bénéficiaires
- Traduit aussi les messages qui apparaissent après le chargement (erreurs, alertes…)
- Affiche le texte français d'origine quand on survole une traduction
- Signale les traductions automatiques : soulignement orange, ou cadre rouge pour un message de sécurité
- Ne fait rien tant qu'on ne l'a pas activée sur un site

## Installation

1. Télécharger ou cloner le projet
2. Aller sur `chrome://extensions` et activer le **Mode développeur**
3. Cliquer sur **Charger l'extension non empaquetée** et choisir le dossier du projet

Pour tester sur un fichier HTML local, il faut aussi activer **Autoriser l'accès aux URL de fichier** dans les détails de l'extension.

Pas de npm, pas de build : c'est du JavaScript pur.

## Utilisation

Ouvrir le site, cliquer sur l'icône de l'extension, puis sur **Traduire ce site**. Le choix est gardé en mémoire pour ce site.

Pour revenir au français, cliquer sur **Arrêter la traduction sur ce site**.

## Comment ça marche

```
popup.js ──► content.js ──► translator.js ──► dictionary.js
                                  │
                                  └──► background.js ──► API MyMemory
```

- `dictionary.js` : le lexique français → haoussa, avec des phrases modèles comme `Des frais de {montant} seront appliqués.`
- `translator.js` : choisit la traduction de chaque texte
- `content.js` : parcourt la page, applique les traductions et surveille les changements
- `background.js` : le seul fichier qui appelle internet (MyMemory)
- `popup.html` / `popup.js` : le petit menu de l'extension

Pour chaque texte, on cherche d'abord dans le dictionnaire. Si la phrase est inconnue, on l'envoie à l'API MyMemory, après avoir remplacé les montants, numéros et noms par des jetons (`{A}`, `{B}`…). Ces valeurs ne quittent donc jamais le navigateur. Si la traduction renvoyée perd ou modifie un jeton, on la rejette.

## À savoir

- La traduction automatique (MyMemory) est moyenne pour le haoussa. C'est pour ça qu'elle est signalée à l'écran, et qu'on peut la désactiver dans le menu.
- Une phrase coupée par des balises HTML (`Vérifiez le <b>numéro</b>…`) est traduite morceau par morceau.
- Les `iframe` ne sont pas traduites.
- Les entrées `vocabulaireAValider` et `modelesAValider` du dictionnaire doivent encore être relues par un locuteur natif.
