type OpenAICoinResult = {
  country: string;
  denomination: string;
  year: string;
  estimatedValueMin: number;
  estimatedValueMax: number;
  currency: string;
  confidence: 'low' | 'medium' | 'high';
};

const SYSTEM_PROMPT = `You identify coins from images.
Return ONLY valid JSON with keys:
country, denomination, year, estimatedValueMin, estimatedValueMax, currency, confidence.
confidence must be one of: low, medium, high.
estimated values should be realistic rough ranges, not exact guarantees.`;

function normalizeResult(raw: any): OpenAICoinResult {
  const confidence = ['low', 'medium', 'high'].includes(raw?.confidence) ? raw.confidence : 'low';

  return {
    country: String(raw?.country ?? 'Unknown'),
    denomination: String(raw?.denomination ?? 'Unknown Coin'),
    year: String(raw?.year ?? 'N/A'),
    estimatedValueMin: Number(raw?.estimatedValueMin ?? 0),
    estimatedValueMax: Number(raw?.estimatedValueMax ?? 0),
    currency: String(raw?.currency ?? 'USD'),
    confidence,
  };
}

async function callOpenAI(imageDataUrl: string): Promise<OpenAICoinResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not set');
  }

  const model = process.env.OPENAI_VISION_MODEL || 'gpt-4o-mini';

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Identify this coin and estimate value range.' },
            { type: 'image_url', image_url: { url: imageDataUrl } },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenAI error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;

  if (!content || typeof content !== 'string') {
    throw new Error('No JSON content returned by OpenAI');
  }

  let parsed: any;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error('Failed to parse JSON from OpenAI output');
  }

  return normalizeResult(parsed);
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { imageBase64, mimeType } = req.body || {};

    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return res.status(400).json({ error: 'imageBase64 is required' });
    }

    const safeMimeType = typeof mimeType === 'string' ? mimeType : 'image/jpeg';
    const imageDataUrl = `data:${safeMimeType};base64,${imageBase64}`;

    const result = await callOpenAI(imageDataUrl);
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(500).json({
      error: 'identify_failed',
      message: error?.message || 'Unknown error',
    });
  }
}
