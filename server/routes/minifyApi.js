const express = require('express');
var request = require('request');
var fs = require("fs-extra");
var path = require('path');
const router = express.Router();
var async = require('asyncawait/async');
var await = require('asyncawait/await');
var config ={};
var Jimp = require("jimp");
var unirest = require('unirest');
const download = require('image-downloader');
var FormData = require('form-data');
var base64Img = require('base64-img');

let resmush= require('../smush-core/resmush.js');


if (process.env.liveenv)
{
    console.log('livesettings');
    var config = require('../../settingsLive');}


else{
    console.log('Local Envoirment');
    var config = require('../../settings');}


var crypto = require('crypto');





router.get('/compressImage', (req, res) => {




    let Output= async(()=>{

    if(req.query.shop&&req.query.file) {

        let cImage= await(resmush(req.query.file));

        res.send(JSON.parse(cImage));

    }














    });


    Output().then((r)=>{
        res.send(r);
        console.log('done');
    });





    //  res.send('ok');
});

module.exports = router;