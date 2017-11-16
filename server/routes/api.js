const express = require('express');
const router = express.Router();
var querystring= require('querystring');
var path = require('path');
var bodyParser = require('body-parser');
var request = require('request');

var async = require('asyncawait/async');
var await = require('asyncawait/await');

var config ={};
if (process.env.liveenv)
{
  console.log('livesettings');
  var config = require('../../settingsLive');}


else{
  console.log('Local Envoirment');
  var config = require('../../settings');}


var crypto = require('crypto');
var knex = require('knex')({
  client: 'mysql',
  connection: {
    host : config.database.socketPath,
    user : config.database.user,
    password : config.database.password,
    database : config.database.database,

  },
  pool: { min: 0, max: 5 }
});
const Shopify = require('shopify-api-node');
var shopify = '';
var currentShop='';
let userSettings={};
let resmush= require('../smush-core/resmush.js');
// // Connect
// const connection = (closure) => {
//
//
//   return MongoClient.connect('mongodb://localhost:27017/mean', (err, db) => {
//     if (err) return console.log(err);
//
//   closure(db);
// });
// };


// Error handling
const sendError = (err, res) => {
  response.status = 501;
  response.message = typeof err == 'object' ? err.message : err;
  res.status(501).json(response);
};

// Response handling
let response = {
  status: 200,
  data: [],
  message: null
};
Array.prototype.forEachLoop=function(a){
  var l=this.length;
  for(var i=0;i<l;i++)a(this[i],i)
}
// Get users
router.get('/getProducts',verifyShop, (req, res) => {

    shopify.product.list({ limit: 5 })
    .then(function(products){
      res.setHeader('Content-Type', 'application/json');
      res.send(products)
    })
  .catch(err => console.error(err));

});







router.get('/createProduct',verifyShop, (req, res) => {

    shopify.product.create({  "title": "Pennymore Donation",
      "body_html": "",
      "vendor": "Donations",
      "product_type": "Donations",
      "images": [
        {
          "src": "https://pennymore.herokuapp.com/assets/essentials/logo.png"
        }
      ],
      "variants": [
      {
      "option1": "education-teach-for-america",
      "option2": "1.00",
      "price": "1.00"

      },
      {
      "option1": "education-teach-for-america",
      "option2": "12.00",
      "price": "12.00"
      }
      ]
      ,
      "options": [
        {"name": "cause" },
        {"name":"DonationValue","values":[1,2,3,4]}
      ],
      "published": true })
    .then(function(product){
      console.log(product);
      res.setHeader('Content-Type', 'application/json');

      knex('tbl_usersettings').where({
        store_name:req.query.shop}).update({
        donation_product_id:product.id
      }).then(function(r){
        res.send('productupdated');
        console.log('updated donation product');
      });


    })
  .catch(function(err){

   //.log(err);


  });

});
router.get('/createVariant',verifyShop, (req, res) => {
  console.log('started variant');
  res.setHeader('Content-Type', 'application/json');
  res.setHeader("Access-Control-Allow-Origin", "*");
    if(req.query.charityid&&req.query.price)
    {


      knex('tbl_charities').where({
        id: req.query.charityid
      }).first('*')
        .then(function (row) {
          console.log('db recieved');
        let option1= row.charityslug;
        let option2= req.query.price;
        let price= req.query.price;


          shopify.productVariant.list(userSettings.donation_product_id,{limit:250})
            .then(function(variants){
              console.log('shopify recieved');
              let variantexist=false;
              let availablvariant= {};

              for (var i = 0, len = variants.length; i < len; i++) {
               let variant= variants[i];

               if(variant.option1==option1 && variant.option2==option2 )
               {
                 variantexist=true;
                 availablvariant=variant;
               }
              }

              if(variantexist)
              {
                console.log('sending back old variant');
                return res.send(availablvariant);
              }
              else{
                console.log('making new ');
                shopify.productVariant.create(userSettings.donation_product_id,{
                  "option1": option1,
                  "option2": option2,
                  "price": price,
                  "requires_shipping":false,
                })
                  .then(function(product){
                    res.send(product);
                  })
                  .catch((err) => {
                    console.log('making new error happend');
                    console.error(err)

                  });

              }


            })
            .catch((err) => {
              console.log('productValue Error happened');
            console.error(err)

          });

        });
    }


  //return res.send('wow');


});



router.get('/charge',verifyShopCharge, (req, res) => {





  shopify.recurringApplicationCharge.create({
  "name": "Platinum Plan","capped_amount":"1000","terms": "We will charge money from donations via shopify",
  "price": 4.99,"test":true,
  "return_url": config.app_url+"/api/createCharge?shop="+req.query.shop
  })
  .then(function(c){



   // res.send(`<script>location.href</script>`)

    res.redirect(c.confirmation_url);
  })
  .catch(err => console.error(err));

});
router.get('/createCharge',verifyShopCharge, (req, res) => {

shopify.recurringApplicationCharge.get(req.query.charge_id).then(function(r){


  if(r.status=='accepted')
  {


    shopify.recurringApplicationCharge.activate(req.query.charge_id,r)
      .then((resp)=>{

          console.log(resp);
        resp= resp.recurring_application_charge;
        knex('tbl_usersettings')
          .where({
            store_name:currentShop})
          .update({

            "plan_name" : resp.name,
            "plan_status": resp.status,
            "plan_canceled_on": '',
            "plan_activated_on ": new Date(resp.updated_at),
            "plan_price": resp.price,
            "plan_id": resp.id
          })
          .then(function(r){

            res.redirect('/dashboard?shop='+req.query.shop);
            console.log('updated payment');
          });

      });






  }
  else{
    res.redirect('https://apps.shopify.com/pennymore');

  }


})
  .catch((err)=> {  res.send(err)});










});
router.get('/access_token', verifyRequest, function(req, res) {
  if (req.query.shop) {
    var params = {
      client_id: config.oauth.api_key,
      client_secret: config.oauth.client_secret,
      code: req.query.code
    }
    var req_body = querystring.stringify(params);
    console.log(req_body)
    request({
        url: 'https://' + req.query.shop + '/admin/oauth/access_token',
        method: "POST",
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(req_body)
        },
        body: req_body
      },
      function(err,resp,body) {
        console.log(body);
        body = JSON.parse(body);

        InsertupdateAccessToken(req.query.shop,body.access_token);





        res.redirect('/dashboard?shop='+req.query.shop);
      })
  }
});
router.get('/shopify_auth', function(req, res) {
  if (req.query.shop) {

   console.log(req.query.shop);
   var redirectUri= "https://"+req.query.shop+"/admin/oauth/authorize?client_id="+config.oauth.api_key+"&scope="+config.oauth.scope+"&redirect_uri="+config.oauth.redirect_uri;


    res.redirect(redirectUri);





  }
  else{
  res.send('provide shopify url');

  }
});


router.get('/getDonationCauses', (req, res) => {


  knex('tbl_charities')
    .then(function (rows) {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.send(rows);

    });

});
router.get('/getInstalledStores', (req, res) => {


  knex('tbl_usersettings').select('store_name')
    .then(function (rows) {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.send(rows);

    });

});

router.post('/create-donation-charge',verifyShopifyHook, (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");

  let Output=async( ()=>{
    console.log('hook happened');
    let capturedorder=false;

    let cShop= req.headers['x-shopify-shop-domain'];
    let order=req.body;
    //console.log(order);
    order.line_items.forEachLoop(function(item,itemkey){

      if(item.title=='Pennymore Donation')
      {

        capturedorder=true;



        let donationProduct= {};

        donationProduct.title=item.title;
        donationProduct.price=item.price;
        donationProduct.variant_title=item.variant_title;
        donationProduct.variant_id=item.variant_id;
        donationProduct.order_id=order.id;
        if(item.variant_title) {
          let variant = item.variant_title.split(" / ");

          donationProduct.cause = variant[0];
          donationProduct.donationPrice = variant[1];
        }

        let nOrder= {
          cause:donationProduct.cause,
          price: donationProduct.donationPrice,
          orderName: order.order_number,
          subtotal:  order.total_price_usd,
          createDate:order.created_at,
        };

        let charge={
          "description": `Donation Charge #ORDER NUMBER ${nOrder.orderName} - ${nOrder.cause} - price = ${nOrder.price}`,
          "price": nOrder.price,
        };


       let UCharge =  await (shopify.usageCharge.create(userSettings.plan_id,charge)) ;
       console.log(UCharge);
       await( knex('tbl_orders').insert({
          shop:cShop,
          orderId:order.id,
          order: JSON.stringify(nOrder),
         CreateDate: new Date(),
        }));
       console.log('order Inserted');

      }

    });




  });



  Output().then((r)=>{
         res.send({'response':'order captured'});
    });
















});

router.get('/recurringCharge',verifyShop, (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");

 if(req.query.planId)
 {

   shopify.usageCharge.list(req.query.planId,{})
     .then(r=>{
       res.send(r);
     });
 }
 //res.send({'response':'wow'});
});

router.get('/optimizeImages',verifyShop, (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");

    let Output= async(()=>{

        if(req.query.ids)
        {
            console.log(req.query.ids);
            req.query.ids.forEach((id)=>{

                let productImages= await (shopify.productImage.list(id,[]));
               // console.log(productImages);

                if(productImages)
                {
                    if(productImages.length>0)
                    {
                        productImages.forEach((image)=>{

                            let originImgId= image.id;
                            delete image.id;


                             resmush(image.src).then((compressImage)=>{




                            if(compressImage.percent>=0) {
                               image.src = compressImage.dest;
                               console.log('delete old Image');
                               shopify.productImage.delete(id,originImgId).then(()=>{});
                                console.log('Uploading new Image');
                               shopify.productImage.create(id,image).then((r)=>{});


                            }
                             });
                        });


                    }
                }

    res.send( 'optimizing images ... you can close this tab...');


            });

        }

    })


    Output().then((r)=>{

     //   res.send(r);

    });





});


router.post('/uninstalled-app',verifyShopifyHook, (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");

  let Output=async( ()=>{
    console.log('hook happened');
    let capturedorder=false;

    let cShop= req.headers['x-shopify-shop-domain'];

   await( knex('tbl_usersettings')
      .where({
        store_name:cShop})
      .delete());
    console.log('app uninstalled');

  });



  Output().then((r)=>{
    res.send({'response':'app uninstalled'});
  });
















});






function InsertupdateAccessToken(shop,accessToken){


  knex('tbl_usersettings').where({
    store_name : shop
  }).first('*')
    .then(function (row) {
      if(row)
      {

        knex('tbl_usersettings').where({
          store_name:shop}).update({
          access_token:accessToken
        }).then(function(r){
          InitiateFirstInstallScripts(shop);
        console.log('updated token');
      });
      }
      else{

        knex('tbl_usersettings').insert({
          store_name:shop,
          access_token:accessToken
        }).then(function(r){

          console.log('inserted token');
          InitiateFirstInstallScripts(shop);
        });

      }

    });

}
function InitiateFirstInstallScripts(shop){



}

function verifyRequest(req, res, next) {
  var map = JSON.parse(JSON.stringify(req.query));
  delete map['signature'];
  delete map['hmac'];

  var message = querystring.stringify(map);
  var generated_hash = crypto.createHmac('sha256', config.oauth.client_secret).update(message).digest('hex');
  console.log(generated_hash);
  console.log(req.query.hmac);
  if (generated_hash === req.query.hmac) {
    next();
  } else {
    return res.json(400);
  }

}
function verifyShop(req,res,next){
  if(req.query.shop)
  {

    if(req.query.shop=='all')
    {
      res.send('not possible');
    }
    knex('tbl_usersettings').where({
      store_name :  req.query.shop
    }).first('*')
      .then(function (row) {
        if(row)
        {

          currentShop=req.query.shop;
          userSettings=row;
          shopify = new Shopify({
            shopName: req.query.shop.replace('.myshopify.com',''),
            apiKey: config.oauth.api_key,autoLimit:true,
            password: row.access_token
          });
          next();


        }

      });









  }
  else
    return res.json(400);
}
function verifyShopCharge(req,res,next){
  if(req.query.shop)
  {

    knex('tbl_usersettings').where({
      store_name :  req.query.shop
    }).first('*')
      .then(function (row) {
        if(row)
        {
         currentShop=req.query.shop;
          shopify = new Shopify({
            shopName: req.query.shop.replace('.myshopify.com',''),
            apiKey: config.oauth.api_key,
            password: row.access_token
          });
          next();
         }

        }

      );









  }
  else
    return res.json(400);
}
function verifyShopifyHook(req,res,next) {

  console.log(req.headers);

  if(req.headers['x-shopify-hmac-sha256']!=''){

    let shop = req.headers['x-shopify-shop-domain'];

    knex('tbl_usersettings').where({
      store_name : shop
    }).first('*')
      .then(function (row) {
          if(row)
          {
            currentShop=req.query.shop;
            userSettings=row;
            shopify = new Shopify({
              shopName: shop.replace('.myshopify.com',''),
              apiKey: config.oauth.api_key,
              password: row.access_token
            });
            next();
          }

        }

      );


  }




//   req.body = '';
// console.log('calling verification');
//   req.on('data', function (chunk) {
//     console.log('collecting body');
//     req.body += chunk.toString('utf8');
//   });
//   req.on('end', function () {
//     console.log('starting verifcation');
//     var digest = crypto.createHmac('SHA256', config.oauth.client_secret)
//       .update(new Buffer(req.body, 'utf8'))
//       .digest('base64');
//     if (digest === req.headers['X-Shopify-Hmac-Sha256']) {
//       console.log('verified');
//       next();
//     }
//     else {
//       console.log('hook not verified');
//       res.send(400);
//     }
//   });


}


module.exports = router;
