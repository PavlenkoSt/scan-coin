export type Confidence = 'low' | 'medium' | 'high';

export type CoinRecord = {
  id: string;
  createdAt: string;
  imageUri: string;
  country?: string;
  denomination?: string;
  year?: string;
  estimatedValueMin?: number;
  estimatedValueMax?: number;
  currency?: string;
  confidence: Confidence;
};
