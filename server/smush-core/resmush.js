

var bodyParser = require('body-parser');
var request = require('request');



let resmush=(ImgUrl)=>{

    let img= ImgUrl.split('?')[0]


    let reSmushApi= "http://api.resmush.it/ws.php?img=";

    return new Promise(resolve =>{


        request.get({url:reSmushApi+img}, (err, httpResponse, body)=> {
            if (err) {
                resolve(ImgUrl);
            }
            else{

                let resp= JSON.parse(body);
                console.log('compression happened =>'+resp.percent+'%');
                resolve(resp);
            }

        });












    });







}


module.exports = resmush;