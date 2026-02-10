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

export async function identifyCoin(imageUri: string): Promise<CoinIdentificationResult> {
  await new Promise((resolve) => setTimeout(resolve, 900));

  const hash = imageUri.length;
  return mockCatalog[hash % mockCatalog.length];
}
