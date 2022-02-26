import fetch from 'node-fetch';
import fs from 'fs';
import liquidJSON from 'liquid-json'

let configOptions={
    apiKey: "PMAK-621a66e4d2955319defe8dad-168dab79edb4a6b91aa194ca748db6f118",
    requestSettings:{
        RequiredHeaders:{
            "x-mock-response-code":"",
            "x-mock-response-id":"",
            "x-mock-match-request-body":true,
            "x-mock-match-request-headers":""
             
        }

    },
    collection:'./collection.json'
}

 function getMockUrl(collectionPath,apiKey,callback){
    var collection_id;
    var collection_uid;
    var getrequestOptions = {
        method: 'GET',
        headers: {"x-api-key": apiKey},
        redirect: 'follow'
      };

      
     fetch("https://api.getpostman.com/collections", getrequestOptions)
        .then(response => response.json())
        .then(res=> {
              fs.readFile(collectionPath,function (err,value){
                    if(err){
                        return callback(new Error("unable to read collection"+err));
                    }
                    
                try {
                    value = liquidJSON.parse(value.toString());
                }
                catch (e) {
                    return callback(new Error(`the collection does not contain valid JSON data.`));
                }
                collection_id = value.info._postman_id;
                  for (const collection of res.collections) {        
                  if(collection["id"]==collection_id){
                      collection_uid=collection["uid"];
                  }
                  
                }
                var raw = JSON.stringify({
                    "mock": {
                      "collection": collection_uid,
                    }
                  });
                  
                  var postrequestOptions = {
                    method: 'POST',
                    headers: {"x-api-key": apiKey},
                    body: raw,
                    redirect: 'follow'
                  };
                  
                // creates a new mock server every time   
                fetch("https://api.getpostman.com/mocks",postrequestOptions)
                  .then(res=>res.json())
                  .then(res=>{
                      return  callback(null,res.mock["mockUrl"]);

                  })
                  .catch(err=>{return callback(new Error(err))})
                })
              
                
              
        })
        .catch(error => {return callback(new Error(error))});
       
}


function getMatchingResponse(request,requestSettings,mockUrl,callback){
           var end_point;
           var requestOptions={
               method:'GET',
               headers:requestSettings.RequiredHeaders
           }
           end_point =request.substring(request.lastIndexOf('/'),request.length);
            fetch(`${mockUrl+end_point}`,requestOptions)
            .then(res=>res.json())
            .then(res=>{
                return  callback(null,res);

            })
            .catch(err=>{return callback(new Error(err))})
          

            
}


function mock(req,configOptions,callback){
    getMockUrl(configOptions.collection,configOptions.apiKey,(err,mockUrl)=>{
        if(err){
            return callback(new Error(err))
        }
        else{

            getMatchingResponse(req,configOptions.requestSettings,mockUrl,(err,res)=>{
                if(err){
                    return callback(new Error(err))
                }
                else{
                          // returns a closest matching saved example in collection --> in json format
                           return callback(null,res)
                }
            })
        }
    })
          
}



mock("postman-echo.com/get",configOptions,(err,res)=>{
    if(err){
        console.log(err)
    }
    else{
        console.log(res);
    }
})