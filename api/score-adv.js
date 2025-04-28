import fetch from 'node-fetch';
import pdfParse from 'pdf-parse';
import { Configuration, OpenAIApi } from 'openai';

const openai = new OpenAIApi(new Configuration({
  apiKey: process.env.OPENAI_API_KEY
}));

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { recordId, adv1Url, adv2Url } = req.body;
  if (!recordId || !adv1Url || !adv2Url) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  // Helper to fetch PDF text
  async function fetchPdfText(url) {
    const arrayBuffer = await fetch(url).then(r => r.arrayBuffer());
    return (await pdfParse(Buffer.from(arrayBuffer))).text;
  }

  const advText   = await fetchPdfText(adv1Url);
  const part2Text = await fetchPdfText(adv2Url);

  // Call GPT
  const prompt = `
