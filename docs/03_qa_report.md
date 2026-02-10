# Scan Coin — QA & Review Report (Milestone: Review/Hardening)

## Date
2026-02-10

## Checks executed
- TypeScript compile check: `npx tsc --noEmit` ✅
- Expo diagnostics: `npx expo-doctor` ✅ (17/17 checks passed)

## Logic/UX fixes completed
1. Added media library permission request before image picking.
2. Added clearer empty/loading states in Scan screen.
3. Prevented duplicate save of same analyzed result.
4. Added post-save navigation shortcut to coin details.
5. Added collection search (country/denomination/year).
6. Updated app identity (`tmp-app` -> `scan-coin`) in `app.json` and `package.json`.

## Known limitations (intentional for MVP)
- Identification is currently mocked (`src/services/coinIdentifier.ts`).
- Value estimate is illustrative and not marketplace-backed.
- No account sync/cloud backup yet.

## Ready-to-test scope
- Home -> Scan -> Analyze -> Save -> Collection -> Coin Details flow works.
- Local persistence works with AsyncStorage + Zustand.
- Basic UX for loading/empty/not-found paths present.
