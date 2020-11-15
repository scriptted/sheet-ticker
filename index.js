const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';

const targetCells = ['B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1', 'I1'];

const Binance = require('node-binance-api');

var binanceAPIKey;
var binanceAPISecret;
var googleSheetID;
var googleSheetRangeFrom;

var binance;

var promise = new Promise((resolve, reject) => {
  var data;
  fs.readFile('settings.json', (err, content) => {
    if (err) return console.log('Error loading settings file:', err);
    resolve(JSON.parse(content));
  });
})

promise.then((data) => {
  console.log(data);
  binanceAPIKey = data.binance_client;
  binanceAPISecret = data.binance_secret;
  googleSheetID = data.google_spreadsheet_id;
  googleSheetRangeFrom = data.google_spreadsheet_range_from;

  binance = new Binance().options({
    APIKEY: binanceAPIKey,
    APISECRET: binanceAPISecret
  });

  // Load client secrets from a local file.
  fs.readFile('credentials.json', (err, content) => {
    if (err) return console.log('Error loading client secret file:', err);
    // Authorize a client with credentials, then call the Google Sheets API.
    authorize(JSON.parse(content), listPairs);
  });
})


/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getNewToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error while trying to retrieve access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

/**
 * Prints the names and majors of students in a sample spreadsheet:
 * @see https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
 * @param {google.auth.OAuth2} auth The authenticated Google OAuth client.
 */
function listPairs(auth) {
  const sheets = google.sheets({version: 'v4', auth});
  sheets.spreadsheets.values.get({
    spreadsheetId: googleSheetID,
    range: googleSheetRangeFrom,
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    const rows = res.data.values;
    if (rows.length) {
      getPairsPrices(sheets, rows[0]);
    } else {
      console.log('No data found.');
    }
  });
}

function getPairsPrices(sheets, pairs) {
  var prices = [];
  
  const getTickerPrices = async (item, index) => {
    var promise = new Promise((resolve, reject) => {
      binance.prices(item + 'USDT', (error, ticker) => {
        if (error) reject(error);
        var key = Object.keys(ticker)[0];
        resolve(parseFloat(ticker[key]).toFixed(5).replace('.', ','))
      });
    })

    return promise;

  }
  
  const getData = async () => {
    return Promise.all(pairs.map((item, index) => getTickerPrices(item, index)))
  }
  
  getData().then(data => {
    writePrices(sheets, data);
  })
}

function writePrices(sheets, prices) {
  sheets.spreadsheets.values.update({
    spreadsheetId: googleSheetID,
    range: 'USDT!B1:I1',
    valueInputOption: 'USER_ENTERED',
    resource: {
      range: 'USDT!B1:I1',
      majorDimension: 'ROWS',
      values: [prices]
    }
  },
  (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    //console.log(res);
    console.log('Prix envoyés sur le document');
  });
}