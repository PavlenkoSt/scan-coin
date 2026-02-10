# Scan Coin — Release Plan (MVP)

## 1) Build profiles (EAS)
- `development`: internal testing
- `preview`: QA / stakeholder testing
- `production`: release candidate

## 2) Pre-release checklist
- [x] MVP flow complete (scan -> analyze -> save -> collection -> detail)
- [x] TypeScript check passing
- [x] Expo Doctor passing
- [x] Error/empty/loading states handled
- [ ] Replace mock provider with remote provider (optional for v1 test)
- [ ] Add app icons/splash final assets

## 3) Runtime configuration
Use `.env` based on `.env.example`:
- `EXPO_PUBLIC_COIN_PROVIDER=mock` for demo/testing
- `EXPO_PUBLIC_COIN_PROVIDER=remote` + `EXPO_PUBLIC_API_BASE_URL` for live backend

## 4) Test notes for user
- Start app
- Open Scan tab and pick a coin image
- Analyze result appears
- Save to collection
- Verify search in Collection tab
- Open details and verify persisted data after app restart

## 5) Known non-blocking gaps
- Real ML identification backend not included in repository
- No auth/cloud sync (local-only MVP)
