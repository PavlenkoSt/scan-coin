# Gemini Vision Backend (Cheap + Easy via Vercel)

This repo includes a serverless endpoint:
- `POST /api/identify-coin`
- file: `api/identify-coin.ts`

It accepts:
```json
{
  "obverse": { "imageBase64": "...", "mimeType": "image/jpeg" },
  "reverse": { "imageBase64": "...", "mimeType": "image/jpeg" }
}
```
`reverse` is optional.

Returns JSON:
```json
{
  "country": "...",
  "denomination": "...",
  "year": "...",
  "estimatedValueMin": 0,
  "estimatedValueMax": 0,
  "currency": "USD",
  "confidence": "low|medium|high"
}
```

## Deploy to Vercel
1. Go to https://vercel.com/new
2. Import `PavlenkoSt/scan-coin`
3. Add environment variables:
   - `GEMINI_API_KEY` = your Gemini API key
   - `GEMINI_MODEL` = `gemini-1.5-flash` (default)
4. Deploy

## Point app to backend
In app `.env`:
```bash
EXPO_PUBLIC_COIN_PROVIDER=remote
EXPO_PUBLIC_API_BASE_URL=https://scan-coin.vercel.app
```

Restart Expo:
```bash
npm run start
```

## Cost tips
- `gemini-1.5-flash` is usually cheap and often has free quota limits for testing
- Keep image compression enabled (already implemented)

## Security
- Keep `GEMINI_API_KEY` only in Vercel env vars
- Never put provider keys in Expo `EXPO_PUBLIC_*` vars
