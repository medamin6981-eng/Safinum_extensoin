const HAUSA_DICTIONARY = {
// Navigation & En-tête
"Banque en ligne":"Banki ta Yanar Gizo",
"Votre compte": "Asusunka",
"Bonjour, Amina": "Barka dai, Amina",
"Solde": "Ma'aunin asusu",
"Frais": "Kuɗin sabis",
"Bénéficiaire": "Mai karɓa",
"Récapitulatif": "Takaitaccen Bayani",
"Confirmation": "Tabbatatarwa",


// Dashboard & Action Boxes
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
"TYPE D'OPÉRATION": "NAU'IN MA'AMALA",
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


// Types de Transactions
"Paiement marchand": "Biyan kuɗi ga ɗan kasuwa",
"Salaire reçu": "Albashin da aka karɓa",
"Transfert reçu": "Kuɗin da aka karɓa",
"Facture électricité": "Kuɗin wutar lantarki",


// Sécurité & Alertes
"Sécurité": "Tsaro",
"Alerte": "Gargadi",
"Alerte de sécurité": "Gargadi na tsaro",
"Alerte de Sécurité": "Gargadi na Tsaro",
"Connexion sécurisée": "Hanyar haɗi mai tsaro",
"Vérifiez toujours le nom et le numéro du bénéficiaire avant de confirmer un transfert.":
"Koyaushe ka tabbatar da suna da lambar mai karɓa kafin ka tabbatar da tura kuɗi.",
"Vérifiez le numéro du bénéficiaire avant de continuer.": "Tabbatar da lambar mai karɓa kafin ka ci gaba.",
"Vous devez confirmer les informations avant de valider le transfert.": "Dole ne ka tabbatar da bayanai kafin ka amince da tura kuɗi.",
"Une erreur est survenue": "An sami kuskure",
"Une erreur s'est produite": "An sami kuskure",
"Erreur": "Kuskure",
"Alerte de Tsaro: vérifiez le numéro du bénéficiaire avant de continuer.": "Gargadi na Tsaro: tabbatar da lambar mai karɓa kafin ka ci gaba."
};


// Fonction utilitaire pour éviter d'altérer les montants numériques (ex: 250 000 FCFA)
function isFinancialValue(text) {
return /^\s*(?:FCFA\s*)?[-+]?\d[\d\s.,]*(?:\s*FCFA)?\s*$/i.test(text);
}