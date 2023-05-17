'use strict';
const line = require('@line/bot-sdk'),
  express = require('express'),
  configGet = require('config');
const { TextAnalyticsClient, AzureKeyCredential } =
  require("@azure/ai-text-analytics")
//line
const configline = {
  channelAccessToken: configGet.get('CHANNEL_ACCESS_TOKEN'),
  channelSecret: configGet.get('CHANNEL_SECRET')
};

//about azure language units
const endpoint = configGet.get('ENDPOINT');
const apiKey = configGet.get("TEXT_ANALYTICS_API_KEY")

const client = new line.Client(configline);
const app = express();

const port = process.env.PORT || process.env.port || 3001;

app.listen(port, () => {
  console.log(`listening on ${port}`);
});



async function MS_TextSentimentAnalysis(text) {
  console.log("[MS_TextSentimentAnalysis] in");
  const analyticsClient = new TextAnalyticsClient(endpoint, new AzureKeyCredential(apiKey));
  let documents = [];
  documents.push(text);
  const results = await analyticsClient.analyzeSentiment(documents,"zh-Hant",{        includeOpinionMining: true    });
  return results;

}

app.post('/callback', line.middleware(configline), (req, res) => {
  Promise
    .all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});

function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null);
  }
  let text = event.message.text;
  let mainNoun = null;
  let sentiment = null;

  MS_TextSentimentAnalysis(text)
    .then((result) => {
      if (result.length > 0) {
        sentiment = result[0].sentiment;
        console.log("result:", result[0]); 
        if (result[0].sentences && result[0].sentences.length > 0) {
          let sentence = result[0].sentences[0];
          if (sentence && sentence.opinions[0].target.length > 0) {
            mainNoun = sentence.opinions[0].target.text;
            console.log(`listening on ${mainNoun}`)
          }
         console.log(`listening on ${result}`)

        }
      }
      

      let replyText = null;
      if (sentiment === "positive") {
        if (mainNoun) {
          replyText = `${mainNoun}的部分謝謝您的支持！`;
        } else {
          replyText = `謝謝您的支持！`;
        }
      } else if (sentiment === "negative") {
        if (mainNoun) {
          replyText = `${mainNoun}的部分我們會再改進！`;
        } else {
          replyText = `我們會再改進！`;
        }
      } else {
        if (mainNoun) {
          replyText = `關於${mainNoun}的部分，謝謝您的意見！`;
        } else {
          replyText = `謝謝您的意見！`;
        }
      }

      const echo = {
        type: 'text',
        text: replyText
      };
      return client.replyMessage(event.replyToken, echo);
    })
    .catch((err) => {
      console.error(err);
      const echo = {
        type: 'text',
        text: '很抱歉，發生錯誤了'
      };
      return client.replyMessage(event.replyToken, echo);
    });
  }