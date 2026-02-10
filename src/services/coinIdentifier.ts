import { Confidence } from "../types/coin";

export type CoinSideImage = {
  imageUri: string;
  imageBase64?: string;
  mimeType?: string;
};

export type CoinIdentificationInput = {
  obverse: CoinSideImage;
  reverse?: CoinSideImage;
};

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
    country: "United States",
    denomination: "Quarter Dollar",
    year: "1999",
    estimatedValueMin: 0.25,
    estimatedValueMax: 2.5,
    currency: "USD",
    confidence: "medium",
  },
  {
    country: "Canada",
    denomination: "1 Dollar (Loonie)",
    year: "2005",
    estimatedValueMin: 1,
    estimatedValueMax: 4,
    currency: "CAD",
    confidence: "medium",
  },
  {
    country: "Eurozone",
    denomination: "2 Euro",
    year: "2012",
    estimatedValueMin: 2,
    estimatedValueMax: 8,
    currency: "EUR",
    confidence: "low",
  },
];

function normalizeApiResult(data: any): CoinIdentificationResult {
  return {
    country: data?.country ?? "Unknown",
    denomination: data?.denomination ?? "Unknown Coin",
    year: String(data?.year ?? "N/A"),
    estimatedValueMin: Number(data?.estimatedValueMin ?? 0),
    estimatedValueMax: Number(data?.estimatedValueMax ?? 0),
    currency: data?.currency ?? "USD",
    confidence: (data?.confidence as Confidence) ?? "low",
  };
}

function mapRemoteError(status: number, payload: any): string {
  const message = String(payload?.message || payload?.error || "");

  if (status === 401)
    return "Backend authentication failed (401). Check Vercel deployment protection.";
  if (status === 413) return "Image too large (413). Try a smaller photo.";
  if (status === 429 || message.includes("insufficient_quota")) {
    return "AI provider quota exceeded. Please check Gemini API limits/billing.";
  }
  if (status === 500 && message.includes("insufficient_quota")) {
    return "AI provider quota exceeded. Please check Gemini API limits/billing.";
  }

  return `Remote identify failed (${status})`;
}

async function identifyCoinRemote(
  input: CoinIdentificationInput,
): Promise<CoinIdentificationResult> {
  const apiBase = process.env.EXPO_PUBLIC_API_BASE_URL;

  if (!apiBase) {
    throw new Error("EXPO_PUBLIC_API_BASE_URL is not set");
  }

  if (!input.obverse.imageBase64) {
    throw new Error("obverse.imageBase64 is required for remote provider");
  }

  const response = await fetch(`${apiBase}/api/identify-coin`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      obverse: {
        imageBase64: input.obverse.imageBase64,
        mimeType: input.obverse.mimeType ?? "image/jpeg",
      },
      reverse: input.reverse?.imageBase64
        ? {
            imageBase64: input.reverse.imageBase64,
            mimeType: input.reverse.mimeType ?? "image/jpeg",
          }
        : undefined,
    }),
  });

  if (!response.ok) {
    let payload: any = null;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    throw new Error(mapRemoteError(response.status, payload));
  }

  const data = await response.json();
  return normalizeApiResult(data);
}

async function identifyCoinMock(
  input: CoinIdentificationInput,
): Promise<CoinIdentificationResult> {
  await new Promise((resolve) => setTimeout(resolve, 900));

  const reverseBonus = input.reverse?.imageUri ? 17 : 0;
  const hash = input.obverse.imageUri.length + reverseBonus;
  return mockCatalog[hash % mockCatalog.length];
}

export async function identifyCoin(
  input: CoinIdentificationInput,
): Promise<CoinIdentificationResult> {
  const provider = (
    process.env.EXPO_PUBLIC_COIN_PROVIDER ?? "mock"
  ).toLowerCase();

  if (provider === "remote") {
    return identifyCoinRemote(input);
  }

  return identifyCoinMock(input);
}
