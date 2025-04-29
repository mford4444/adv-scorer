import fetch from 'node-fetch';
import pdfParse from 'pdf-parse';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { recordId, adv1Url, adv2Url } = req.body;
  if (!recordId || !adv1Url || !adv2Url) {
    res.status(400).json({ error: 'Missing fields' });
    return;
  }

  // Fetch PDF text
  async function fetchPdfText(url) {
    const arrayBuffer = await fetch(url).then(r => r.arrayBuffer());
    return (await pdfParse(Buffer.from(arrayBuffer))).text;
  }

  let advText, part2Text;
  try {
    advText = await fetchPdfText(adv1Url);
    part2Text = await fetchPdfText(adv2Url);
  } catch (err) {
    console.error('PDF fetch/parse error:', err);
    res.status(500).json({ error: 'Error fetching or parsing PDF' });
    return;
  }

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
- Count every regulatory/legal disclosure for “Disclosures Count.”
- Count each client complaint for “Client Complaints Count.”
- Count each outside business activity for “Outside Business Activities Count.”
- Score the qualitative fields 1–10 per your rubric (1 = weakest, 10 = strongest).
- Do NOT wrap the JSON in any extra text—respond with the JSON object only.
`;

  const chat = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: "You are an expert scoring engine." },
      {
        role: "user",
        content:
          prompt +
          '\n\nADV Part 1:\n' + advText +
          '\n\nADV Part 2:\n' + part2Text
      }
    ],
    temperature: 0
  });

  const aiRaw = chat.choices[0].message.content;
  console.log("GPT raw response:", aiRaw);

  let scores;
  try {
    scores = JSON.parse(aiRaw);
  } catch (e) {
    console.error("JSON parse error:", e);
    res.status(500).json({ error: "Invalid JSON from GPT", raw: aiRaw });
    return;
  }

  res.status(200).json({ recordId, raw: aiRaw, scores });
}
