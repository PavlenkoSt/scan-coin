# Scan Coin — MVP Specification (Milestone 1: Planning)

## 1) Product Goal
Build a simple mobile app (iOS + Android) that lets users:
1. Scan a coin photo
2. Get likely identification (country, denomination, year when detectable)
3. See estimated value range with confidence indicator
4. Save coin to personal collection

Positioning: **"Instant coin identifier + collection tracker"**

---

## 2) Target Users
- Beginner coin collectors
- Casual users who found coins and want quick identification
- Hobbyists who want lightweight collection organization

---

## 3) Problem Statement
Users struggle to quickly identify coins and track collections. Existing solutions are often too complex, expensive, or unclear about valuation confidence.

---

## 4) MVP Scope

### In Scope (v1)
- Auth-free local mode (no signup required)
- Capture/upload coin photo
- AI-powered identification request (coin metadata)
- Estimated value range + confidence badge (Low/Med/High)
- Save result to local collection
- Collection list + detail view
- Basic search/filter in collection
- Error states + retry flow

### Out of Scope (post-MVP)
- Professional grading guarantees
- Marketplace / buy-sell
- Social features
- Multi-user sync
- Advanced portfolio analytics

---

## 5) Success Metrics (MVP)
- Identification completion rate > 80%
- Save-to-collection rate > 35%
- Crash-free sessions > 99%
- Median scan-to-result time < 6s (network dependent)

---

## 6) Core User Flow
1. User opens app
2. Taps **Scan Coin**
3. Takes photo or selects from gallery
4. App sends image to identification endpoint
5. App shows probable match + value estimate + confidence
6. User taps **Save to Collection**
7. User can browse/search saved coins

---

## 7) Risks & Mitigation
- **Risk:** Value accuracy can be misleading  
  **Mitigation:** Show ranges + confidence + disclaimer "estimate only"

- **Risk:** Image quality hurts detection  
  **Mitigation:** Add simple capture tips and validation hints

- **Risk:** Slow/failed network  
  **Mitigation:** Timeouts, retries, and clear fallback messages

---

## 8) Release Definition of Done
- Core flow works end-to-end on iOS + Android (Expo)
- No TypeScript errors
- Lint passes
- Basic test coverage for critical logic
- Remote repo updated and install/run steps documented
