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

  // **Your scoring prompt**
  const prompt = `You are an expert scoring engine for RIA Form ADV submissions. You will receive:

• “adv1Text”: the full text of Form ADV Part 1  
• “adv2Text”: the full text of Form ADV Part 2A/2B (the brochure)

Analyze both documents and output ONLY a single JSON object with these exact keys:

{
  "Disclosures Count": <integer>,
  "Client Complaints Count": <integer>,
  "Outside Business Activities Count": <integer>,
  "Fiduciary Duty Score": <1–10 integer>,
  "Planning Depth Score": <1–10 integer>,
  "Investment Framework Transparency Score": <1–10 integer>,
  "ADV vs Marketing Alignment Score": <1–10 integer>
}

Instructions:
- **Count** every regulatory/legal disclosure for “Disclosures Count.”
- **Count** each client complaint for “Client Complaints Count.”
- **Count** each outside business activity for “Outside Business Activities Count.”
- **Score** the qualitative fields 1–10 per your rubric (1 = weakest, 10 = strongest).
- **Do NOT** wrap the JSON in any extra text—respond with the JSON object only.
`;

  // **Call GPT**
  const chat = await openai.createChatCompletion({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'You are an expert scoring engine.' },
      { role: 'user',   content: prompt + '\n\nADV Part 1:\n' + advText + '\n\nADV Part 2:\n' + part2Text }
    ],
    temperature: 0
  });

  const aiResponse = chat.data.choices[0].message.content;

  // Return the raw JSON so your Airtable script can parse & patch the fields
  return res.status(200).json({ recordId, scores: JSON.parse(aiResponse) });
}
