type OpenAICoinResult = {
  country: string;
  denomination: string;
  year: string;
  estimatedValueMin: number;
  estimatedValueMax: number;
  currency: string;
  confidence: 'low' | 'medium' | 'high';
};

const MAX_BASE64_BYTES = 4_000_000; // ~4MB raw payload safety cap

const SYSTEM_PROMPT = `You are a conservative coin identification assistant.
Use the image to infer likely coin identity and a rough value range.
Rules:
1) If uncertain, use "Unknown" fields and confidence "low".
2) Never output guaranteed prices. Provide broad realistic ranges.
3) Year should be a string. Use "N/A" if unreadable.
4) Currency must be a 3-letter code when possible (USD, EUR, CAD, etc.).
5) Return JSON only.`;

function clampNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return Number(n.toFixed(2));
}

function normalizeResult(raw: any): OpenAICoinResult {
  const confidence: OpenAICoinResult['confidence'] = ['low', 'medium', 'high'].includes(raw?.confidence)
    ? raw.confidence
    : 'low';

  const min = clampNumber(raw?.estimatedValueMin, 0);
  const maxCandidate = clampNumber(raw?.estimatedValueMax, min);
  const max = maxCandidate >= min ? maxCandidate : min;

  const currencyRaw = String(raw?.currency ?? 'USD').trim().toUpperCase();
  const currency = /^[A-Z]{3}$/.test(currencyRaw) ? currencyRaw : 'USD';

  return {
    country: String(raw?.country ?? 'Unknown').slice(0, 80),
    denomination: String(raw?.denomination ?? 'Unknown Coin').slice(0, 80),
    year: String(raw?.year ?? 'N/A').slice(0, 20),
    estimatedValueMin: min,
    estimatedValueMax: max,
    currency,
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
      temperature: 0.1,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Identify this coin and estimate a rough value range. Return JSON only.',
            },
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

    // Rough decoded size check to protect function memory/time.
    const approxBytes = Math.ceil((imageBase64.length * 3) / 4);
    if (approxBytes > MAX_BASE64_BYTES) {
      return res.status(413).json({ error: 'image_too_large', message: 'Please upload a smaller image.' });
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
