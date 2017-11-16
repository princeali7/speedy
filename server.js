const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const http = require('http');
const app = express();
var querystring= require('querystring');
var config ={};
var cookieParser = require('cookie-parser');
if (process.env.liveenv)
{
  console.log('livesettings');
  var config = require('./settingsLive');}


else{
  console.log('Local Envoirment');
  var config = require('./settings');}

var crypto = require('crypto');

var knex = require('knex')({
  client: 'mysql',
  connection: {
    host : config.database.socketPath,
    user : config.database.user,
    password : config.database.password,
    database : config.database.database
  }
});
const Shopify = require('shopify-api-node');



// API file for interacting with MongoDB
const api = require('./server/routes/api');
const minifyApi = require('./server/routes/minifyApi');

// Parsers
app.use(bodyParser.json());

app.use(bodyParser.urlencoded({ extended: false}));
app.use(cookieParser());
// Angular DIST output folder
app.use(express.static(path.join(__dirname, 'distri')));

// API location
app.use('/api', api);
app.use('/minify', minifyApi);




// Send all other requests to the Angular app
app.get('/dashboard',verifyRequest, (req, res) => {

 // res.send('wow');
   res.sendFile(path.join(__dirname, 'distri/app.html'));
});
app.get('/superadmin',verifyAdmin, (req, res) => {

  // res.send('wow');
  res.sendFile(path.join(__dirname, 'distri/app-super-admin.html'));
});

app.get('/login', (req, res) => {

  // res.send('wow');
  res.sendFile(path.join(__dirname, 'distri/Login.html'));
});

app.post('/login', (req, res) => {


  console.log(req);

  if(req.body.password=='pennymore@2017')
  {
    res.cookie('admin_user', '12211', { maxAge: 9000 });
    res.redirect('/superadmin');

  }
  else{
    res.write('<script>alert("Wrong Password"); </script>');
    //res.sendFile(path.join(__dirname, 'distri/Login.html'));
  }
  //res.sendFile(path.join(__dirname, 'distri/Login.html'));
});



app.get('*', (req, res) => {

  res.send('route not found');
  // res.sendFile(path.join(__dirname, 'distri/app.html'));
});


function verifyRequest(req, res, next) {
  if(req.query.shop)
  {

    knex('tbl_usersettings').where({
      store_name :  req.query.shop
    }).first('*')
      .then(function (row) {

        console.log(row);
        if(row)
        {

            currentShop=req.query.shop;
            userSettings=row;
            shopify = new Shopify({
              shopName: req.query.shop.replace('.myshopify.com',''),
              apiKey: config.oauth.api_key,
              password: row.access_token
            });
            next();

        }

        else{
          res.redirect('/api/shopify_auth?shop='+req.query.shop);
        }


      });

  }
  else
    return res.json(400);

}

function verifyAdmin(req,res,next){

  console.log(req.cookies);
  if(req.cookies.admin_user=='12211')
  {
    next();
  }
  else {
    res.redirect('/login');
  }


}

//Set Port
const port = process.env.PORT || '3000';
app.set('port', port);

const server = http.createServer(app);

server.listen(port, () => console.log(`Running on localhost:${port}`));
