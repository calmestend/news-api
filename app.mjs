import express from 'express';
import { noticias } from './lib/instagram.mjs';

const app = express()
const port = 3000

app.get('/noticias', noticias); 

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

