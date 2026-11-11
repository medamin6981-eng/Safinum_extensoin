const HAUSA_DICTIONARY = {
// Navigation & En-tête
"Banque en ligne":"Banki ta Yanar Gizo",
"Votre compte": "Asusunka",
"Bonjour, Amina": "Barka dai, Amina",
"Solde": "Ma'aunin asusu",
"Frais": "Kudin sabis",
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


// Types de Transactions
"Paiement marchand": "Biyan kuɗi ga ɗan kasuwa",
"Salaire reçu": "Albashin da aka karɓa",
"Transfert reçu": "Kuɗin da aka karɓa",
"Facture électricité": "Kuɗin wutar lantarki",


// Sécurité & Alertes
"Sécurité": "Tsaro",
"Connexion sécurisée": "Hanyar haɗi mai tsaro",
"Vérifiez toujours le nom et le numéro du bénéficiaire avant de confirmer un transfert.":
"Koyaushe ka tabbatar da suna da lambar mai karɓa kafin ka tabbatar da tura kuɗi."
};


// Fonction utilitaire pour éviter d'altérer les montants numériques (ex: 250 000 FCFA)
function isFinancialValue(text) {
return /^\s*(?:FCFA\s*)?[-+]?\d[\d\s.,]*(?:\s*FCFA)?\s*$/i.test(text);
}