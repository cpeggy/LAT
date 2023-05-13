'use strict';

const line = require('@line/bot-sdk'),
  express = require('express'),
  configGet = require('config'),
  compromise = require('compromise');

const { TextAnalyticsClient, AzureKeyCredential } =
  require("@azure/ai-text-analytics");

const configline = {
  channelAccessToken: configGet.get('CHANNEL_ACCESS_TOKEN'),
  channelSecret: configGet.get('CHANNEL_SECRET')
};

const endpoint = configGet.get('ENDPOINT');
const apiKey = configGet.get("TEXT_ANALYTICS_API_KEY");
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

  const doc = compromise(event.message.text);
  const mainNoun = doc.nouns().out('text');
  const sentiment = await MS_TextSentimentAnalysis(event.message.text);

  let response;
  if (sentiment === "positive") {
    response = `謝謝您的鼓勵，我們會做得更好(｡◕∀◕｡)`;
  } else if (sentiment === "negative") {
    response = `謝謝您的告知，我們會再加以改進(；´ﾟωﾟ｀人)`;
  } else if (sentiment === "neutral") {
    response = "謝謝您的反饋: ♡｡ﾟ.(*♡´◡` 人´◡` ♡*)ﾟ♡ °・";
  } else {
    response = "無法判斷這句話的情感。";
  }

  const echo = {
    type: "text",
    text: response,
  };

  return client.replyMessage(event.replyToken, echo);
}
