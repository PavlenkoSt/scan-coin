import { Confidence } from '../types/coin';

export type CoinIdentificationResult = {
  country: string;
  denomination: string;
  year: string;
  estimatedValueMin: number;
  estimatedValueMax: number;
  currency: string;
  confidence: Confidence;
};

const mockCatalog: CoinIdentificationResult[] = [
  {
    country: 'United States',
    denomination: 'Quarter Dollar',
    year: '1999',
    estimatedValueMin: 0.25,
    estimatedValueMax: 2.5,
    currency: 'USD',
    confidence: 'medium',
  },
  {
    country: 'Canada',
    denomination: '1 Dollar (Loonie)',
    year: '2005',
    estimatedValueMin: 1,
    estimatedValueMax: 4,
    currency: 'CAD',
    confidence: 'medium',
  },
  {
    country: 'Eurozone',
    denomination: '2 Euro',
    year: '2012',
    estimatedValueMin: 2,
    estimatedValueMax: 8,
    currency: 'EUR',
    confidence: 'low',
  },
];

function normalizeApiResult(data: any): CoinIdentificationResult {
  return {
    country: data?.country ?? 'Unknown',
    denomination: data?.denomination ?? 'Unknown Coin',
    year: String(data?.year ?? 'N/A'),
    estimatedValueMin: Number(data?.estimatedValueMin ?? 0),
    estimatedValueMax: Number(data?.estimatedValueMax ?? 0),
    currency: data?.currency ?? 'USD',
    confidence: (data?.confidence as Confidence) ?? 'low',
  };
}

async function identifyCoinRemote(imageUri: string): Promise<CoinIdentificationResult> {
  const apiBase = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (!apiBase) {
    throw new Error('EXPO_PUBLIC_API_BASE_URL is not set');
  }

  const response = await fetch(`${apiBase}/identify-coin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ imageUri }),
  });

  if (!response.ok) {
    throw new Error(`Remote identify failed (${response.status})`);
  }

  const data = await response.json();
  return normalizeApiResult(data);
}

async function identifyCoinMock(imageUri: string): Promise<CoinIdentificationResult> {
  await new Promise((resolve) => setTimeout(resolve, 900));

  const hash = imageUri.length;
  return mockCatalog[hash % mockCatalog.length];
}

export async function identifyCoin(imageUri: string): Promise<CoinIdentificationResult> {
  const provider = (process.env.EXPO_PUBLIC_COIN_PROVIDER ?? 'mock').toLowerCase();

  if (provider === 'remote') {
    return identifyCoinRemote(imageUri);
  }

  return identifyCoinMock(imageUri);
}
