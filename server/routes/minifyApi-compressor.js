const express = require('express');
var request = require('request');
var fs = require("fs-extra");
var path = require('path');
const router = express.Router();
//var async = require('asyncawait/async');
//var await = require('asyncawait/await');
var config ={};
var Jimp = require("jimp");
var unirest = require('unirest');
const download = require('image-downloader');
var FormData = require('form-data');
var base64Img = require('base64-img');




if (process.env.liveenv)
{
    console.log('livesettings');
    var config = require('../../settingsLive');}


else{
    console.log('Local Envoirment');
    var config = require('../../settings');}


var crypto = require('crypto');




router.get('/set', (req, res) => {

    let Output= async(()=>{
        let image=  await(compressImage(req.query.url));
            console.log('pp');
            //console.log(image);
            res.send('<img src="'+image+'"/>');





    });


    Output().then(()=>{

        console.log('done');
    });





  //  res.send('ok');
});





router.get('/compressor', (req, res) => {




    let Output= async(()=>{

    if(req.query.shop&&req.query.file) {

        let cImage= await(SyncFetchImage(req.query.shop,req.query.file));
        res.send(cImage);

    }














    });


    Output().then((r)=>{
        res.send(r);
        console.log('done');
    });





    //  res.send('ok');
});


let SyncFetchImage=(shop,file)=>{

    return new Promise(resolve=>{


        try {
            console.log('Fetching Image');
            fs.ensureDirSync(`Images/${shop}`);
            const {filename, image} = await(saveImage(file, `Images/${shop}`));

            console.log('Fetched Image '+filename);

            console.log('Compressing started...');

            let compressedImage = await(compressorLossy(filename));
            console.log('Compressing ended.');

            if (compressedImage) {

                compressedImage = JSON.parse(compressedImage);
                compressedImageUrl = compressedImage['files'][0]['url'];

                fs.ensureDirSync('CompressedImages/'+shop);
                console.log(filename);
                let Compressedfilename= filename.replace('Images\\','');
                let Compressedfile = await(saveImage(compressedImageUrl, 'CompressedImages/' + Compressedfilename));
                console.log('Saved Compressed Image');
                resolve({"data":compressedImage, "filename":Compressedfile.filename });
            }
            else {
                resolve({'error': compressedImage});
            }


            //console.log(compressedImageUrl);


            //console.log(Compressedfile);


        }
        catch (e) {
            //throw e
            resolve({'errors': e});

        }

    })
    }



let saveImage= (imageUrl,destination,shop=null,product=null)=>{


                        let options = {
                            url: imageUrl,
                            dest: destination
                        };

                        return download.image(options);


                    }
let compressImage =(queryUrl)=>{
return new Promise( (resolve)=>{

        Jimp.read(queryUrl, function (err, image) {
            let imgExt= image.getExtension();
            if(imgExt=='jpeg')
            {
                image.quality(80).write("lena-half-bw.jpg")
                    .getBase64(image.getMIME(),function(d,r){

                        console.log('got data');
                      resolve(r);
                    });


            }

        });




    }
);


}
let compressorLossy= (filename)=>{


    return new Promise(resolve =>{


        var formData = {

            'files': fs.createReadStream(filename)
        };
        request.post({url:'https://compressor.io/server/Lossy.php', formData: formData,jar:true}, function(err, httpResponse, body) {
            if (err) {
                resolve(false);
            }
           resolve(body);
        });












    });


}

module.exports = router;