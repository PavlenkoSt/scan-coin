# OpenAI Vision Backend (Cheap + Easy via Vercel)

This repo now includes a serverless endpoint:
- `POST /api/identify-coin`
- file: `api/identify-coin.ts`

It accepts:
```json
{
  "imageBase64": "...",
  "mimeType": "image/jpeg"
}
```

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

---

## 1) Deploy to Vercel

### Option A — Vercel dashboard (easiest)
1. Go to https://vercel.com/new
2. Import GitHub repo: `PavlenkoSt/scan-coin`
3. Framework preset: **Other** (or auto-detect)
4. Add Environment Variables:
   - `OPENAI_API_KEY` = your OpenAI API key
   - `OPENAI_VISION_MODEL` = `gpt-4o-mini` (cheaper default)
5. Deploy

You’ll get URL like:
`https://scan-coin.vercel.app`

---

## 2) Point mobile app to backend

In app `.env` (not committed):
```bash
EXPO_PUBLIC_COIN_PROVIDER=remote
EXPO_PUBLIC_API_BASE_URL=https://scan-coin.vercel.app
```

Then restart Expo:
```bash
npm run start
```

---

## 3) Cost tips
- Use `gpt-4o-mini` (already default in backend)
- Resize/compress images client-side (we already use quality 0.8)
- Add simple rate limiting later if traffic grows

---

## 4) Security notes
- Keep `OPENAI_API_KEY` only in Vercel env vars (server-side)
- Never put OpenAI API key in Expo `EXPO_PUBLIC_*` vars

---

## 5) Quick backend test
After deploy:
```bash
curl -X POST https://YOUR-VERCEL-URL/api/identify-coin \
  -H 'content-type: application/json' \
  -d '{"imageBase64":"<base64>","mimeType":"image/jpeg"}'
```
