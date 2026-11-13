// Lexique français -> haoussa de l'extension Safinum.
//
// - vocabulaire / modeles             : entrées rédigées par l'équipe.
// - vocabulaireAValider / modelesAValider : entrées proposées en complément,
//   À FAIRE RELIRE PAR UN LOCUTEUR NATIF avant la démonstration, puis à
//   déplacer dans les sections validées.
//
// Les modèles contiennent des emplacements entre accolades :
//   {montant...} : doit contenir un chiffre, recopié tel quel (jamais traduit)
//   {nom...}     : nom propre, recopié tel quel
globalThis.SAFINUM_HAUSA = {
  vocabulaire: {
    // Navigation & en-tête
    "Banque en ligne": "Banki ta Yanar Gizo",
    "Votre compte": "Asusunka",
    "Solde": "Ma'aunin asusu",
    "Frais": "Kuɗin sabis",
    "Bénéficiaire": "Mai karɓa",
    "Récapitulatif": "Takaitaccen Bayani",
    "Confirmation": "Tabbatarwa",

    // Tableau de bord
    "SOLDE DISPONIBLE": "KUƊIN DA KE CIKIN ASUSU",
    "Numéro de compte": "Lambar asusu",
    "Compte courant": "Asusun yau da kullum",
    "Effectuer un transfert": "Aika kuɗi",
    "Consulter les frais": "Duba kuɗin sabis",
    "TRANSACTIONS RÉCENTES": "Ma'amaloli na kwanan nan",
    "Continuer": "Ci gaba",
    "Retour": "Komawa",
    "Total à débiter": "Jimlar da za a cire",
    "Montant à envoyer": "Adadin da za a aika",
    "Type d'opération": "Nau'in ma'amala",
    "Choisissez le type de transfert et le montant à envoyer.": "Zaɓi nau'in ma'amala da adadin da za a aika.",
    "Transfert instantané et gratuit vers tous les comptes Safinum.": "Aika kuɗi cikin sauri da kyauta zuwa duk asusun Safinum.",
    "Compte Safinum": "Asusun Safinum",
    "Consultez votre solde et lancez un transfert en toute sécurité.": "Duba ma'aunin asusunka sannan ka fara tura kuɗi cikin aminci.",
    "FRAIS DE TRANSFERT": "KUƊIN TURA KUƊI",
    "Choisissez le type de transfert et le montant. Les frais sont calculés automatiquement.": "Zaɓi nau'in tura kuɗi da adadin kuɗi. Ana lissafa kuɗin sabis kai tsaye.",
    "Les frais sont calculés automatiquement.": "Ana lissafa kuɗin sabis kai tsaye.",
    "Transfert instantané et gratuit": "Aika kuɗi cikin sauri kuma kyauta",
    "Mobile Money": "Kuɗin waya",
    "Autre banque": "Wata banki",
    "Gratuit": "Kyauta",
    "Montant": "Adadi",
    "Total débité": "Jimlar kuɗin da aka cire",
    "Solde après opération": "Ma'aunin asusu bayan ma'amala",

    // Formulaire du bénéficiaire et récapitulatif
    "Renseignez les informations du destinataire. Vérifiez toujours le numéro avant de valider.": "Cika bayanan mai karɓa. Koyaushe ka tabbatar da lambar kafin ka amince.",
    "Ce bénéficiaire n'a jamais été utilisé sur ce compte. Vérifiez le numéro avant de continuer.": "Ba a taɓa amfani da wannan mai karɓa a wannan asusu ba. Tabbatar da lambar kafin ka ci gaba.",
    "Nom du bénéficiaire": "Sunan mai karɓa",
    "Numéro de téléphone": "Lambar waya",
    "Motif du transfert": "Dalilin tura kuɗi",
    "Note (optionnel)": "Ƙarin bayani (na zaɓi)",
    "J'ai vérifié le nom et le numéro du bénéficiaire.": "Na tabbatar da sunan mai karɓa da lambarsa.",
    "Vérifiez les informations avant de confirmer le transfert.": "Tabbatar da bayanan kafin ka amince da tura kuɗin.",
    "Je confirme que les informations ci-dessus sont correctes.": "Na tabbatar cewa bayanan da ke sama daidai ne.",
    "Modifier": "Gyara",
    "Confirmer le transfert": "Tabbatar da tura kuɗi",
    "Référence": "Lambar shaida",
    "Opération": "Ma'amala",
    "Téléphone": "Waya",

    // Confirmation et messages de démonstration
    "Transfert effectué": "An aika kuɗi",
    "Votre transfert a été envoyé avec succès.": "An aika kuɗin da ka tura cikin nasara.",
    "Statut": "Matsayi",
    "Succès": "Nasara",
    "Nouveau transfert": "Sabon tura kuɗi",
    "Environnement de test — données fictives, aucune transaction réelle.": "Yanayin gwaji ne; bayanan kwaikwayo ne, ba a yin ma'amala ta gaske.",
    "Protocole de test": "Ka'idojin gwaji",
    "Retour au hackathon": "Komawa hackathon",
    "Safinum Pay — environnement de démonstration. Ne saisissez aucune donnée personnelle réelle.": "Safinum Pay — yanayin nuni ne. Kada ka shigar da bayanan mutum na gaske.",
    "nov.": "Nuwamba",
    "oct.": "Oktoba",

    // Types de transactions
    "Paiement marchand": "Biyan kuɗi ga ɗan kasuwa",
    "Salaire reçu": "Albashin da aka karɓa",
    "Transfert reçu": "Kuɗin da aka karɓa",
    "Facture électricité": "Kuɗin wutar lantarki",

    // Sécurité & alertes
    "Sécurité": "Tsaro",
    "Alerte": "Gargadi",
    "Alerte de sécurité": "Gargadi na tsaro",
    "Connexion sécurisée": "Hanyar haɗi mai tsaro",
    "Vérifiez toujours le nom et le numéro du bénéficiaire avant de confirmer un transfert.": "Koyaushe ka tabbatar da suna da lambar mai karɓa kafin ka tabbatar da tura kuɗi.",
    "Vérifiez le numéro du bénéficiaire avant de continuer.": "Tabbatar da lambar mai karɓa kafin ka ci gaba.",
    "Vous devez confirmer les informations avant de valider le transfert.": "Dole ne ka tabbatar da bayanai kafin ka amince da tura kuɗi.",
    "Une erreur est survenue": "An sami kuskure",
    "Une erreur s'est produite": "An sami kuskure",
    "Erreur": "Kuskure"
  },

  modeles: {
    "Bonjour, {nom}": "Barka dai, {nom}"
  },

  // ---------------------------------------------------------------------
  // PROPOSITIONS À FAIRE VALIDER PAR UN LOCUTEUR NATIF
  // Vocabulaire générique du parcours de test (solde, frais, transfert,
  // récapitulatif, erreurs, avertissements de sécurité).
  // ---------------------------------------------------------------------
  vocabulaireAValider: {
    // Actions
    "Envoyer": "Aika",
    "Valider": "Amince",
    "Annuler": "Soke",
    "Fermer": "Rufe",
    "Suivant": "Na gaba",
    "Précédent": "Na baya",
    "Accueil": "Shafin farko",
    "Historique": "Tarihin ma'amaloli",
    "Réessayer": "Sake gwadawa",

    // Données du transfert
    "Transfert": "Tura kuɗi",
    "Destinataire": "Mai karɓa",
    "Expéditeur": "Mai aikawa",
    "Date": "Kwanan wata",
    "Montant total": "Jimlar kuɗi",
    "Frais de transfert": "Kuɗin tura kuɗi",
    "Frais de service": "Kuɗin sabis",
    "En attente": "Ana jira",

    // Résultats d'opération
    "Opération réussie": "Ma'amala ta yi nasara",
    "Opération échouée": "Ma'amala ba ta yi nasara ba",
    "Transaction échouée": "Ma'amala ba ta yi nasara ba",
    "Transaction refusée": "An ƙi amincewa da ma'amala",
    "Opération annulée": "An soke ma'amala",

    // Erreurs de saisie
    "Champ obligatoire": "Dole a cike wannan wuri",
    "Numéro invalide": "Lambar ba daidai ba ce",
    "Montant invalide": "Adadin ba daidai ba ne",
    "Veuillez réessayer.": "Don Allah a sake gwadawa.",
    "Le numéro du bénéficiaire est invalide.": "Lambar mai karɓa ba daidai ba ce.",
    "Session expirée. Veuillez vous reconnecter.": "Zaman ya ƙare. Don Allah ka sake shiga.",

    // Solde
    "Solde insuffisant": "Kuɗin asusu bai isa ba",
    "Fonds insuffisants": "Kuɗi bai isa ba",
    "Solde insuffisant pour effectuer cette opération.": "Kuɗin asusunka bai isa a yi wannan ma'amala ba.",

    // Sécurité
    "Attention": "Hattara",
    "Avertissement": "Gargadi",
    "Code PIN": "Lambar sirri (PIN)",
    "Mot de passe": "Kalmar sirri",
    "Code de confirmation": "Lambar tabbatarwa",
    "Ne communiquez jamais votre code PIN.": "Kada ka taɓa bayyana lambar sirrinka (PIN) ga kowa.",
    "Ne partagez jamais votre code.": "Kada ka taɓa raba lambar sirrinka da kowa.",
    "Safinum ne vous demandera jamais votre code PIN.": "Safinum ba za ta taɓa tambayarka lambar sirrinka (PIN) ba.",
    "Cette opération est irréversible.": "Ba za a iya mayar da wannan ma'amala ba.",
    "Vérifiez le montant avant de confirmer.": "Tabbatar da adadin kafin ka amince."
  },

  modelesAValider: {
    "Des frais de {montant} seront appliqués.": "Za a cire kuɗin sabis na {montant}.",
    "Vous allez envoyer {montant} à {nom}.": "Za ka aika {montant} zuwa ga {nom}.",
    "Vous allez transférer {montant} à {nom}.": "Za ka tura {montant} zuwa ga {nom}.",
    "Votre solde est de {montant}.": "Kuɗin da ke cikin asusunka: {montant}.",
    "Votre solde après l'opération sera de {montant}.": "Kuɗin asusunka bayan ma'amala zai zama {montant}.",
    "Le montant minimum est de {montant}.": "Mafi ƙarancin adadi: {montant}.",
    "Le montant maximum est de {montant}.": "Mafi yawan adadi: {montant}.",
    "Le montant maximum par transfert est de {montant}.": "Mafi yawan adadi a kowane tura kuɗi: {montant}.",
    "Transfert de {montant} effectué avec succès.": "An tura {montant} cikin nasara.",
    "Vous avez reçu {montant} de {nom}.": "Ka karɓi {montant} daga {nom}."
  },

  // Texte de l'infobulle affichée au survol d'un texte traduit.
  interface: {
    original: "Original (FR) :"
  }
};
