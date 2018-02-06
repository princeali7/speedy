const express = require('express');
const router = express.Router();

var querystring= require('querystring');
var path = require('path');
var bodyParser = require('body-parser');
var request = require('request');
var axios= require('axios');
var template = require('../templates/speedify');
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


router.get('/minifyThemeFile',verifyShop,  async (req, res) => {

    res.setHeader('Content-Type', 'application/json');

    res.send( 'running minfiying') ;
try {
    console.log(req.query.key);
     let rep= await shopify.asset.get(req.query.themeid,{ asset:{key: req.query.key} })
    // res.setHeader('Content-Type', 'application/json');
     console.log('fetched resource');

    if(rep) {
        let minified = await axios.post('https://minify.minifier.org', querystring.stringify({
            source: rep.value, type: req.query.type
        }), {
            headers: {
                'content-type': 'application/x-www-form-urlencoded; charset=UTF-8'
            }
        });
        console.log('minified  data');
        //console.log(minified);
      //  console.log(minified.data);
            if(minified.data && minified.data.minified){
                    let superM= minified.data.minified;
                    superM= superM.replace(/\{\{\{/g,'{ {{').replace(/\{\{\%/g,'{ {%').replace(/\}\}\}/g,'}} }').replace(/\%\}\}/g,'%} }');
                   // console.log(superM);
                let s= {
                    key:req.query.key.replace('/','\/'),
                    value:superM
                };
               // console.log(s);
               await shopify.asset.update(req.query.themeid,s);
               console.log('data uploaded');
            }
    }}
    catch(ex){
        console.log(ex);
      //  res.send(ex.response.data);
    }

  //  res.send(rep.value);


});

let getAsset = (key,themeId)=>{

   return shopify.asset.get(themeId,{ asset:{key: key} });
}
let createBackup = async (sourceFile,themeid)=>{

    let s= {

        source_key:sourceFile.replace('/','\/'),
        key:sourceFile.replace('.liquid','_speedify.liquid')
    };
    // console.log(s);

    console.log('backup start  '+ sourceFile);
    await shopify.asset.update(themeid,s);

        console.log('backup done ');
}

let putAsset = async (sourceFile,themeid,newValue)=>{
console.log(sourceFile);
    let s= {
        key:sourceFile,
        value:newValue.trim()
    };
    //console.log(s);

    console.log('updating start  '+ sourceFile);
   try {
       await shopify.asset.create(themeid, s);
       console.log('update done ');
   }
   catch (ex){
       console.log('wow wrong move TIGER '+sourceFile+' --  '+ ex);

   }


}

    const speedyTemplate= `
                <!-- Speedify code Start - OPTIMIZED_CONTENT_FOR_HEADER - 2018 V2.0 -->
                  {% include 'criticalcss'%}
                  <!--jQuery_OPTIMIZED-->
                 <noscript id="deferred-styles">
                 
                 </noscript>
                
                    {% capture cfh %}
                    {{ content_for_header }}
                    {% endcapture%}
                
                
                    {% if cfh contains 'DesignMode' %}
                    {{ cfh }}
                    {%else %}
                    {% include 'cfh-optimized' with cfh %}
                    {% endif%}
                <!-- Speedify code END - 2018 V2.0 -->
                    
                `;


router.get('/setupbooster',verifyShop,  async (req, res) => {

    res.setHeader('Content-Type', 'application/json');
    let mainLayout = req.query.main;//;'layout/theme.liquid';
    let themeId= req.query.themeid;
    try {

        //console.log(req.query.key);
        let rep= await getAsset(mainLayout,themeId);//shopify.asset.get(themeId,{ asset:{key: mainLayout} });
       // console.log(outputLayout);
        let layoutHTML= rep.value;
        createBackup(mainLayout,themeId);

        let outputLayout='';


            if (layoutHTML.includes('OPTIMIZED_CONTENT_FOR_HEADER')) {
                console.log('Already Inserted Header Part');
            } else {
                layoutHTML = layoutHTML.replace(/\{\{.*content_for_header.*\}\}/, speedyTemplate);
            }
            outputLayout = layoutHTML
                .replace(/\{\{((.+?['|"].+?['|"]).+?\|((.+asset_url).+\|.+script_tag|.+script_tag)).+?\}\}/g,
                    '<script src="{{$1}}" defer></script>')
                .replace(/\|.?script_tag/g, '');

            res.send('done');


        if(req.query.cfh) {
            console.log('insert cfh-optimized');
            putAsset('snippets/cfh-optimized.liquid', themeId, template.cfhOptimized);
        }


        if (req.query.inlinecss){
            console.log('insert critical css');

            let cricticalcss= req.query.inlinecss.split(',');
            let includingCss= "";
            for(css of cricticalcss){

                let rStyle = await getAsset(`assets/${css}`,themeId);
               // console.log(rStyle.value);
                await putAsset(`snippets/${css}.liquid`,themeId,rStyle.value);

                includingCss+=` {% include '${css}' %} `;
            }

            putAsset('snippets/criticalcss.liquid', themeId,` <style>${includingCss} </style>`);
        }

        if(req.query.jquery) {
            console.log(' insert jquery');

           let u=  req.query.jquery;

             let jQ= await axios.get(u);
             //console.log(jQ.data);
            let inline= req.query.inline;
            let inlinescript="";
            if(inline)
            {
                inline= inline.split(',');

                for(script of inline){
                    console.log('getting inline script '+script);
                    let rScript = await getAsset(`assets/${script}`,themeId);
                    inlinescript+=rScript.value;
                }
            }




            putAsset('snippets/jquery.liquid', themeId, `<script>${jQ.data};${inlinescript}</script>`);



            outputLayout= outputLayout.replace('<!--jQuery_OPTIMIZED-->',`{% include 'jquery' %}`);

        }




        putAsset(mainLayout,themeId,outputLayout);

}
    catch(ex){
        console.log(ex);
        //  res.send(ex.response.data);
    }

    //  res.send(rep.value);


});

router.get('/checktheme',verifyShop,async (req,res)=>{

    let respnse= await getAsset(req.query.key,req.query.themeId);
    res.send(respnse);
    console.log(respnse);
});

router.get('/saveScript',verifyShop, async (req, res) => {

    res.setHeader('Content-Type', 'application/json');
    let mainFile = req.query.main;//;'layout/theme.liquid';
    let themeId= req.query.themeid;
    try {

        if (req.query.inlinejs){
            console.log('insert critical js');

            let cricticaljss= req.query.inlinejs.split(',');
            let includingjs= "";
            for(jss of cricticaljss){
                //let rStyle= "{% raw %}";
                 let bStyle = await getAsset(`assets/${jss}`,themeId);

                 let rStyle ="{% raw %}"+bStyle.value+" {% endraw %}";
                  //console.log(bStyle.value);
                await putAsset(`snippets/${jss}.liquid`,themeId,rStyle);

                includingjs+=` {% include '${jss}' %} `;
            }
            res.send( ` <script>${includingjs} </script>`);
        }


        }



    catch(ex){
        console.log(ex);
        //  res.send(ex.response.data);
    }

    //  res.send(rep.value);


});
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
              //      console.log(userSettings);
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



module.exports = router;
