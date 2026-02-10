type CoinResult = {
  country: string;
  denomination: string;
  year: string;
  estimatedValueMin: number;
  estimatedValueMax: number;
  currency: string;
  confidence: 'low' | 'medium' | 'high';
};

type InputImage = {
  imageBase64: string;
  mimeType?: string;
};

const MAX_BASE64_BYTES = 6_000_000;

const SYSTEM_PROMPT = `You are a conservative coin identification assistant.
You may receive obverse and reverse images of the same coin.
Use both sides when available to infer likely coin identity and rough value range.
Rules:
1) If uncertain, use "Unknown" fields and confidence "low".
2) Never output guaranteed prices. Provide broad realistic ranges.
3) Year should be a string. Use "N/A" if unreadable.
4) Currency must be a 3-letter code when possible (USD, EUR, CAD, etc.).
5) Return JSON only with keys: country, denomination, year, estimatedValueMin, estimatedValueMax, currency, confidence.`;

function clampNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return Number(n.toFixed(2));
}

function normalizeResult(raw: any): CoinResult {
  const confidence: CoinResult['confidence'] = ['low', 'medium', 'high'].includes(raw?.confidence)
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

function checkSize(image: InputImage) {
  const approxBytes = Math.ceil((image.imageBase64.length * 3) / 4);
  if (approxBytes > MAX_BASE64_BYTES) {
    throw new Error('image_too_large');
  }
}

async function callGemini(obverse: InputImage, reverse?: InputImage): Promise<CoinResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set');

  const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

  checkSize(obverse);
  if (reverse) checkSize(reverse);

  const parts: any[] = [
    { text: SYSTEM_PROMPT },
    { text: reverse ? 'Image 1 = obverse, Image 2 = reverse. Analyze both.' : 'Analyze this coin image.' },
    {
      inline_data: {
        mime_type: obverse.mimeType || 'image/jpeg',
        data: obverse.imageBase64,
      },
    },
  ];

  if (reverse) {
    parts.push({
      inline_data: {
        mime_type: reverse.mimeType || 'image/jpeg',
        data: reverse.imageBase64,
      },
    });
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts }],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json',
        },
      }),
    }
  );

  const text = await response.text();

  if (!response.ok) {
    throw new Error(`Gemini error ${response.status}: ${text}`);
  }

  let payload: any;
  try {
    payload = JSON.parse(text);
  } catch {
    throw new Error('Failed to parse Gemini response JSON envelope');
  }

  const modelText = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!modelText || typeof modelText !== 'string') {
    throw new Error('No JSON content returned by Gemini');
  }

  let parsed: any;
  try {
    parsed = JSON.parse(modelText);
  } catch {
    throw new Error('Failed to parse JSON from Gemini model output');
  }

  return normalizeResult(parsed);
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { obverse, reverse } = req.body || {};

    if (!obverse?.imageBase64 || typeof obverse.imageBase64 !== 'string') {
      return res.status(400).json({ error: 'obverse.imageBase64 is required' });
    }

    const result = await callGemini(obverse, reverse?.imageBase64 ? reverse : undefined);
    return res.status(200).json(result);
  } catch (error: any) {
    const msg = String(error?.message || 'Unknown error');

    if (msg.includes('image_too_large')) {
      return res.status(413).json({ error: 'image_too_large', message: 'Please upload a smaller image.' });
    }

    if (msg.includes('429') || msg.toLowerCase().includes('quota')) {
      return res.status(429).json({ error: 'insufficient_quota', message: 'Gemini quota exceeded. Check API limits/billing.' });
    }

    return res.status(500).json({
      error: 'identify_failed',
      message: msg,
    });
  }
}
