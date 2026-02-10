# scan-coin

Simple Expo app for coin identification + collection tracking.

## Current status
- ✅ Planning docs
- ✅ Expo app initialized properly
- ✅ Core architecture (Expo Router + Zustand + React Query)
- ✅ Scan flow (pick image -> analyze -> save)
- ✅ Collection flow (list + coin details)

## Run locally
```bash
npm install --include=dev --legacy-peer-deps
npm run start
```

## Notes
- Current identification logic is mocked (`src/services/coinIdentifier.ts`) for MVP UI/flow validation.
- Next step: connect real identification backend/model endpoint.
