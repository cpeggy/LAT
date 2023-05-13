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
  const documents = [{ id: '1', language: 'zh-hant', text: text }];
  const results = await analyticsClient.analyzeSentiment(documents);
  console.log("[results] ", JSON.stringify(results));
  return results[0].sentiment;
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
async function handleEvent(event) {
    if (event.type !== "message" || event.message.type !== "text") {
      return Promise.resolve(null);
    }
  
    const text = event.message.text;
    const analyticsClient = new TextAnalyticsClient(endpoint, new AzureKeyCredential(apiKey));
    const documents = [{ id: '1', language: 'zh-hant', text: text }];
    const results = await analyticsClient.analyzeSentiment(documents);
  
    const sentiment = results[0].sentiment;
    const confidenceScores = results[0].confidenceScores;
    const response = `這句話的情感是 ${sentiment}，信心指數為正面 ${confidenceScores.positive.toFixed(2)}, 中性 ${confidenceScores.neutral.toFixed(2)}, 負面 ${confidenceScores.negative.toFixed(2)}`;
  
    const echo = {
      type: "text",
      text: response,
    };
  
    return client.replyMessage(event.replyToken, echo);
  }
  