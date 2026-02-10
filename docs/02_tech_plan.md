# Scan Coin — Technical Plan (Milestone 1)

## Stack
- React Native + Expo + TypeScript
- Expo Router (navigation)
- Zustand (local app state)
- TanStack Query (async/network state)
- React Hook Form + Zod (forms/validation where needed)
- AsyncStorage (local persistence)
- Expo SecureStore (future sensitive keys)
- Jest + React Native Testing Library

## Proposed App Structure
- `app/`
  - `(tabs)/index.tsx` — Home
  - `(tabs)/collection.tsx` — Collection list
  - `scan.tsx` — Scan/upload flow
  - `coin/[id].tsx` — Coin detail
- `src/`
  - `components/`
  - `features/scan/`
  - `features/collection/`
  - `services/api/`
  - `store/`
  - `types/`
  - `utils/`

## Data Model (MVP)
```ts
type CoinRecord = {
  id: string;
  createdAt: string;
  imageUri: string;
  country?: string;
  denomination?: string;
  year?: string;
  mintMark?: string;
  conditionNote?: string;
  estimatedValueMin?: number;
  estimatedValueMax?: number;
  currency?: string;
  confidence: 'low' | 'medium' | 'high';
  rawResponse?: unknown;
};
```

## API Contract (abstract)
`POST /identify-coin`
- input: image
- output: detected fields + estimate range + confidence

## Milestones
1. **M1 Planning** ✅
2. **M2 Bootstrap & Core Architecture**
   - Expo app scaffold, lint, formatter, base navigation, theme
3. **M3 Scan Flow**
   - Camera/gallery + request/response UI + error handling
4. **M4 Collection Flow**
   - Persist, list, detail, search
5. **M5 Review & Hardening**
   - tests, bugfixes, polish, final QA report

## Review Checklist (for M5)
- Type safety
- Logic correctness on edge cases
- Empty/error/loading states
- No dead code/obvious anti-patterns
- Basic UX consistency and actionable error messages
