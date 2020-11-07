## Installation

Copier settings.json.dist vers settings.json et remplir les informations comme indiqué ici :

```
{
    "binance_client" : "", //clé API Binance
    "binance_secret" : "", //clé secrète Binance
    "google_spreadsheet_id" : "" // Id du document trouvé entre /d/ et /edit dans une url du type https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit 
}
```

Aller sur https://developers.google.com/sheets/api/quickstart/nodejs, cliquer sur Enable the Google Sheets API

Récupérer le fichier credentials.json et le mettre à la racine de ce projet

Lancer le projet : 

```
node .
```