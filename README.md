# scan-coin

Simple Expo app for coin identification + collection tracking.

## Status
- ✅ Planning complete
- ✅ Implementation complete
- ✅ Review/fixes complete
- ✅ Test-ready MVP on `main`

## Features
- Open camera for live coin scanning (front + back)
- Pick front/back coin images from gallery
- Auto-compress and resize images before upload to avoid payload errors
- Analyze coin (mock provider by default, OpenAI via backend in remote mode)
- Save results to local collection
- Search collection by country/denomination/year
- Open saved coin details with estimate + confidence

## Tech
- Expo + React Native + TypeScript
- Expo Router
- Zustand + AsyncStorage
- TanStack Query

## Run locally
```bash
npm install --include=dev --legacy-peer-deps
cp .env.example .env
npm run start
```

## Provider configuration
Environment variables:
- `EXPO_PUBLIC_COIN_PROVIDER=mock|remote`
- `EXPO_PUBLIC_API_BASE_URL` (required only for `remote`)

Default is `mock` for immediate testing.

## QA checks
```bash
npx tsc --noEmit
npx expo-doctor
```

## Docs
- `docs/01_mvp_spec.md`
- `docs/02_tech_plan.md`
- `docs/03_qa_report.md`
- `docs/04_release_plan.md`
- `docs/05_openai_backend_deploy.md`
