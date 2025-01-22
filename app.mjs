import express from 'express';
import { noticias } from './lib/instagram.mjs';

const app = express()
const port = 3000

const scrapeInstagram = async(req, res) => {
  const response = await fetch("https://scraper-api.smartproxy.com/v2/scrape", {
    method: "POST",
    body: JSON.stringify({
      "target": "instagram_graphql_profile",
      "query": "transportemx"
    }),
    headers: {
      "Content-Type": "application/json",
      "Authorization": ""
    },
  }).catch(error => console.log(error));

  res.json(await response.json())
}

app.get('/noticias', noticias); 
app.get('/noticias/v2', scrapeInstagram);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

