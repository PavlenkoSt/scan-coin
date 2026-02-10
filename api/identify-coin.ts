type OpenAICoinResult = {
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

const MAX_BASE64_BYTES = 4_000_000;

const SYSTEM_PROMPT = `You are a conservative coin identification assistant.
You may receive obverse and reverse images of the same coin.
Use both sides when available to infer likely coin identity and rough value range.
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

async function callOpenAI(obverseDataUrl: string, reverseDataUrl?: string): Promise<OpenAICoinResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY is not set');

  const model = process.env.OPENAI_VISION_MODEL || 'gpt-4o-mini';

  const content: any[] = [
    {
      type: 'text',
      text: reverseDataUrl
        ? 'Identify this coin from both sides (obverse and reverse) and estimate a rough value range. Return JSON only.'
        : 'Identify this coin and estimate a rough value range. Return JSON only.',
    },
    { type: 'image_url', image_url: { url: obverseDataUrl } },
  ];

  if (reverseDataUrl) {
    content.push({ type: 'image_url', image_url: { url: reverseDataUrl } });
  }

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
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content },
      ],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenAI error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  const msg = data?.choices?.[0]?.message?.content;
  if (!msg || typeof msg !== 'string') throw new Error('No JSON content returned by OpenAI');

  let parsed: any;
  try {
    parsed = JSON.parse(msg);
  } catch {
    throw new Error('Failed to parse JSON from OpenAI output');
  }

  return normalizeResult(parsed);
}

function toDataUrl(image: InputImage): string {
  const approxBytes = Math.ceil((image.imageBase64.length * 3) / 4);
  if (approxBytes > MAX_BASE64_BYTES) {
    throw new Error('image_too_large');
  }

  const safeMimeType = typeof image.mimeType === 'string' ? image.mimeType : 'image/jpeg';
  return `data:${safeMimeType};base64,${image.imageBase64}`;
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { obverse, reverse } = req.body || {};

    if (!obverse?.imageBase64 || typeof obverse.imageBase64 !== 'string') {
      return res.status(400).json({ error: 'obverse.imageBase64 is required' });
    }

    const obverseDataUrl = toDataUrl(obverse);
    const reverseDataUrl = reverse?.imageBase64 ? toDataUrl(reverse) : undefined;

    const result = await callOpenAI(obverseDataUrl, reverseDataUrl);
    return res.status(200).json(result);
  } catch (error: any) {
    if (String(error?.message || '').includes('image_too_large')) {
      return res.status(413).json({ error: 'image_too_large', message: 'Please upload a smaller image.' });
    }

    return res.status(500).json({
      error: 'identify_failed',
      message: error?.message || 'Unknown error',
    });
  }
}
