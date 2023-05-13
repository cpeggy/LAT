'use strict';
const line = require('@line/bot-sdk'),
      express = require('express'),
      configGet = require('config');
const {TextAnalyticsClient, AzureKeyCredential}=
    require("@azure/ai-text-analytics")
//line
const configline ={
  channelAccessToken:configGet.get('CHANNEL_ACCESS_TOKEN'),
  channelSecret:configGet.get('CHANNEL_SECRET')
};

//about azure language units
const endpoint = configGet.get('ENDPOINT');
const apiKey = configGet.get("TEXT_ANALYTICS_API_KEY")

const client = new line.Client(configline);
const app = express();

const port = process.env.PORT || process.env.port || 3001;

app.listen(port, ()=>{
  console.log(`listening on ${port}`);
  //MS_TextSentimentAnalysis()
  //.catch((err)=>{
  //  console.error("Error:",err);
  //});  
});

async function MS_TextSentimentAnalysis(){
    console.log("[MS_TextSentimentAnalysis] in");
    const analyticsClient = new TextAnalyticsClient(endpoint, new AzureKeyCredential(apiKey));
    let documents = [];
    documents.push("我覺得櫃檯人員很親切");
    const results = await analyticsClient.analyzeSentiment(documents);
    console.log("[results] ", JSON.stringify(results));
}

app.post('/callback', line.middleware(configline),(req, res)=>{
  Promise
    .all(req.body.events.map(handleEvent))
    .then((result)=>res.json(result))
    .catch((err)=>{
      console.error(err);
      res.status(500).end();
    });
});

function handleEvent(event){
  if(event.type !== 'message' || event.message.type !== 'text'){
    return Promise.resolve(null);
  }
  const echo = {
    type:'text',
    text:event.message.text
  };

   return client.replyMessage(event.replyToken, echo);

}