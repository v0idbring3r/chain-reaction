# Product & Architecture Review — Chain Reaction

**Date:** 2026-07-07
**Scope:** Code quality, product/marketability assessment, enhancement recommendations, release timeline, and distribution strategy.

---

## 1. Executive Summary

The codebase is in excellent technical shape — a cleanly separated pure-TypeScript engine, 100% unit coverage on all logic modules, immutable state, and disciplined architecture documentation. The critical gaps are **product**, not code: the game is local pass-and-play only, which caps its market appeal severely. The single highest-ROI change before launch is pulling **Phase 5 (AI opponents) forward, ahead of Phase 4 (online multiplayer)**. A solo player opening the app today has nothing to do.

Recommended launch path: launch on **both the App Store and Google Play, using EAS Build + Submit as the pipeline** (see §4 — EAS is a build/submission service, not a store; the app ships on Apple/Google either way, and the free tier covers this project's launch cadence). Realistic public launch: **early-to-mid September 2026 (~8–9 weeks out)**.

---

## 2. Code Quality Review

### Strengths

The engine (`src/engine/GameEngine.ts`) has no React imports, no side effects, and a clean immutable `playMove` interface — exactly what the spec calls for, and exactly what makes Phase 5 (AI) and Phase 4 (online sync) cheap to build later. The store correctly owns win detection and animation sequencing, keeping the engine reusable. The colocated-effects principle (each component owns its haptic/sound/animation triggers) is a good pattern that prevents drift. Test coverage on all logic modules is at the stated 100% target.

### Issues found

**2.1 — Engine: chain resolution never early-exits on win (functional bug, fix before launch).**
`docs/GAME_ENGINE.md` specifies breaking the explosion loop once all players have moved and one owner remains. The implementation (`resolveChainReactions`) drops this and runs every chain to completion, relying only on the 400-iteration runaway guard. On a board flooded by a winning move, cells can stay at critical mass indefinitely — the loop then produces up to 400 `ExplosionStep`s, and at ~600ms per step the GameScreen sequencer will animate the already-decided endgame for up to **four minutes**. This is a real player-facing defect in exactly the moment that should feel best (winning). Fix: pass the win-check into `resolveChainReactions` and break early, per the original spec. Also add a "tap to skip" fast-forward on the explosion sequencer as a belt-and-braces UX measure.

**2.2 — Engine: dead code violating the project's own standards.**
`playMove` builds `updatedHasPlayed` and never uses it, and its `playerCount` and `hasPlayed` parameters are otherwise unused. CLAUDE.md says "no bloat, remove unused code." Either delete the parameters or — better — use them to implement the early-exit in 2.1, which is what they were for.

**2.3 — Type-assertion escape hatches.**
Repeated casts like `as { count: number; owner: number | null }` in `GameEngine.ts` and `gameStore.ts` bypass the type system to mutate cloned boards. This contradicts the "strict TypeScript, no escape hatches" standard. Define an internal `MutableCell`/`MutableBoard` type (or make `cloneBoard` return a mutable variant) so mutation of clones is typed, not asserted.

**2.4 — Quality gates exist on paper but aren't enforced.**
There is no ESLint/Prettier config, no `coverageThreshold` in the Jest config, and no CI. The 95% coverage floor in CLAUDE.md is a convention, not a gate. Add `coverageThreshold: { global: { branches: 95, functions: 95, lines: 95, statements: 95 } }`, an ESLint flat config with `@typescript-eslint/strict`, and a GitHub Actions workflow running typecheck + lint + tests on every push. Half a day of work; protects everything else.

**2.5 — Zero UI test coverage.**
Engine/store/utils are at 100%, but no component or screen has a test, and the explosion sequencer in `GameScreen` — the most timing-sensitive code in the app — is untested. Add React Native Testing Library tests for the sequencer, `Grid` tap handling during `animatingExplosion`, and settings persistence. Before launch, add one Maestro e2e flow (setup → play → win → play again).

**2.6 — `app.json` is not release-ready.**
Missing `ios.bundleIdentifier` and `android.package` (blocks any store build), `userInterfaceStyle` is `"light"` for a game whose background is `#070716` (splash and system chrome will flash white — set `"dark"`), icons are Expo defaults, there's no splash screen config, and no `eas.json` exists. `supportsTablet: true` is claimed but the design spec sizes the board for a 352×560 phone shell — either verify tablet layout or set it false for v1.

**2.7 — Minor: spec drift between docs.**
GAME_ENGINE.md (early-exit in loop) and ARCHITECTURE.md ("chains always run to completion") contradict each other. After fixing 2.1, reconcile both docs. Keeping ARCHITECTURE.md truthful is a stated project requirement.

---

## 3. Product & Marketability Assessment

### The market

Chain Reaction is a proven mechanic with a real audience — the leading Android implementation ([BuddyMatt's Chain Reaction](https://play.google.com/store/apps/details?id=com.BuddyMattEnt.ChainReaction)) has 1M+ players — but it's a **crowded clone space**: multiple actively maintained versions exist on both stores, and the incumbents already ship AI opponents (3 difficulty levels), online play, up to 8–10 local players, and custom skins. Your differentiation is craft: the neon-arcade aesthetic, the 7-animation fidelity, haptics, and sound. That's a legitimate wedge — the incumbents look dated — but craft alone doesn't overcome a feature deficit on the two features that drive retention: solo play and online play.

Two marketability notes beyond features. First, **naming**: "Chain Reaction" is saturated in both stores and effectively unwinnable as a search term for a new entrant; launch under a distinct, brandable name (keep "chain reaction" as an ASO keyword, not the title). This also sidesteps trademark ambiguity. Second, **screenshots sell this game** — the neon board mid-explosion is the asset; invest in a short gameplay-capture preview video, which both stores weight heavily.

### Enhancement recommendations, prioritized

**P0 — required for a credible launch:**

1. **AI opponent (pull Phase 5 forward, before Phase 4).** This is the single most important product decision in the plan. Pass-and-play requires a second human in the room; every competitor offers solo play. The pure engine makes this cheap: random-valid-move (Easy) and a corner/edge heuristic (Medium) are 1–2 days including tests. Ship Hard (minimax depth 3–4) post-launch if needed. Without this, day-1 retention will be poor no matter how good the animations are.
2. **Onboarding/tutorial.** Critical mass and capture rules are not self-evident; PHASES.md already lists this as nice-to-have — promote it to required. A 3-step interactive overlay on first game is enough.
3. **Fix 2.1 + tap-to-skip chain animation.**
4. **The existing Phase 3b list:** real sound effects, the three custom fonts (they're the identity of the design system — the neon aesthetic reads as unfinished without Orbitron), icon, splash, store metadata, privacy policy page.
5. **Crash reporting + minimal analytics** (Sentry + a privacy-light analytics tool). Launching blind means you can't diagnose the reviews you'll get. Keep the privacy label honest: no accounts, no tracking.

**P1 — fast follow (first month post-launch):**

1. **Colorblind accessibility.** Players are distinguished by color alone. The design system already defines three orb shapes (orb/hex/nucleus) — assigning shapes per player as an accessibility option is nearly free and a genuine differentiator in this genre.
2. **Expose palette and orb-shape pickers in Settings** (palettes are built and tested but not user-facing).
3. **Undo last move** (local play only) and simple lifetime stats (games played/won per player count). Cheap retention features.
4. **Native module abstraction** (already planned in Phase 3b portability).

**P2 — deferred, in this order:**

1. **Online multiplayer (Phase 4).** Defer past launch. It's the largest cost item (backend, matchmaking, abandonment handling, store privacy-label changes) and its value is low until you have an installed base to match against. AI-first is the right sequencing.
2. Larger local player counts (competitors support 8–10; you cap at 4 — the engine handles more, palettes are the constraint).
3. Tablet/landscape layouts.

### Monetization

Recommendation: **free with a single one-time "Supporter" IAP** (removes ads if you add them, unlocks extra palettes/orb shapes). For a niche strategy title without live-ops, heavyweight IAP economies and battle passes are wrong-sized; industry data for casual titles favors hybrid light-ads-plus-IAP, and rewarded video (e.g., unlock a palette by watching) is the only ad format worth adding if you add any — interstitials would poison the premium feel that is your differentiator. Ship v1 with **no monetization at all** if the goal is reviews and installs first; adding a Supporter IAP later is trivial, removing a bad ad reputation is not.

---

## 4. Release Pipeline: EAS vs. Direct Native Builds

First, a framing correction that matters: **EAS is not an alternative to the App Store or Google Play — it is a pipeline for shipping to them.** In both options below, the app launches on exactly the same two stores, with identical binaries, the same store accounts (Apple $99/yr, Play $25 one-time), the same reviews, and the same 15% small-business commission tier. The choice is only about *how builds get produced, signed, and uploaded*.

### Option A — EAS Build + Submit (Expo's hosted pipeline)

`eas build` compiles signed iOS/Android binaries in Expo's cloud; `eas submit` uploads them to App Store Connect and the Play Console from the CLI.

*For:*

- **Credential management is handled for you.** EAS generates and stores the iOS distribution certificate, provisioning profiles, and Android keystore. For a first-time solo launch this is the single biggest de-risker — signing misconfiguration is the classic way first submissions burn a week. Losing an Android keystore under manual management is unrecoverable for app identity; EAS makes that mistake hard to make.
- **One command, both platforms.** No Xcode project archaeology, no Gradle configuration, no Transporter uploads. The managed-workflow project you have today builds with zero `ios/`/`android/` directories checked in — exactly what the workflow was designed for.
- **EAS Update comes with it.** Post-launch, JS-only fixes (a store tweak, an animation timing bug) ship over-the-air in minutes instead of waiting days for store review. For a launch period where you'll be reacting to first reviews, this is disproportionately valuable.
- **Cost is fine at your scale.** The free tier covers ~15 iOS + 15 Android builds/month (45-min timeout, shared queue). Your realistic cadence — a few builds per week during beta — fits. If you outgrow it, the Starter plan is ~$19/mo, cancellable.

*Against:*

- Free-tier queue waits can be tens of minutes at peak; a paid plan or local builds avoid this.
- Third-party dependency in the release path (outages/pricing changes are outside your control).
- Your Expo account becomes security-critical (it holds signing credentials).

### Option B — Direct native builds (`expo prebuild` + Xcode/Gradle)

Generate native projects locally, archive/sign in Xcode, build an AAB with Gradle, upload manually (or via fastlane). There's also a middle path: `eas build --local` runs the same EAS pipeline on your own Mac, free and unmetered.

*For:* zero build costs, no queue, full control over signing and native config; no third-party in the critical path.

*Against:* you own certificate/profile/keystore management and rotation; two separate manual pipelines to learn and maintain; more error surface on your very first release; no OTA updates unless you self-host `expo-updates`; and it front-loads exactly the native tooling work that choosing Expo managed workflow was meant to avoid. This is effectively pulling part of Phase 6 (eject) forward for no product benefit.

### Recommendation

**Use EAS Build + Submit for v1, on the free tier.** The deciding factors are credential automation and OTA updates during the launch window — both address real first-launch risks — while the costs (queue waits, third-party dependency) are trivial at this scale. There is no lock-in: EAS produces standard binaries, credentials are exportable, and you can move to local or CI builds (or execute Phase 6) at any time without touching app code. Revisit only if build volume regularly exceeds the free tier and $19/mo bothers you — at which point `eas build --local` is the escape hatch, not a rearchitecture.

Alternative stores (Epic, AltStore, EU sideloading) and web portals are intentionally out of scope per the decision to launch only on the two primary stores. If a marketing channel is ever wanted later, the finished HTML prototype on a portal like CrazyGames/itch.io is the cheap experiment — but it's not part of this plan.

**One structural warning that affects your timeline:** if your Google Play developer account is a new *personal* account, Google requires a **closed test with ≥12 opted-in testers active for 14 consecutive days** before you can even apply for production access, and the subsequent production review takes ~3–7 days. This is the long pole in the Android schedule — start it as early as a build exists, in parallel with everything else. (Organization accounts are exempt; if you can register as an organization, do so.)

---

## 5. Release Timeline

Assumes a solo developer starting the week of July 7, 2026. Apple review currently averages well under a day for updates but **2–5 days for new apps**, with periodic multi-week delay episodes — buffer accordingly.

| Weeks | Workstream | Detail |
|---|---|---|
| 1 | Release hygiene | Fix 2.1–2.3; add lint/CI/coverage gates (2.4); `app.json` + `eas.json` + bundle IDs (2.6); Apple Developer ($99/yr) and Play ($25) accounts if not done |
| 1–3 | P0 product | AI opponent (Easy/Medium) with engine-level tests; tutorial overlay; tap-to-skip; sounds; fonts; icon + splash |
| 3 | First builds | EAS builds to TestFlight (internal) and **Play closed testing — start the 12-tester/14-day clock immediately** |
| 3–5 | Beta | TestFlight external group (first build needs Apple beta review); recruit the 12+ Play testers (friends/family suffice, but they must stay opted in and active for the full 14 days); UI tests + one Maestro e2e |
| 5–6 | Store readiness | Screenshots, preview video, description/keywords under the new app name, privacy policy URL, age rating, Sentry/analytics wired |
| 6–7 | Submission | Apply for Play production access (3–7 day review); submit iOS (2–5 day new-app review); fix any rejections |
| 7–9 | **Public launch** | Coordinated release both stores; portal/web experiment can follow in week 9+ |

Post-launch backlog, in order: P1 items (accessibility shapes, palette settings, undo, stats) → monetization decision based on install data → Phase 4 online multiplayer → Phase 6 (eject) only if a concrete native need appears — otherwise don't; Expo managed is serving this project well.

Total: **~8–9 weeks to public launch**, with the Play Store 14-day testing window and AI-opponent build as the two critical-path items.

---

## 6. Sources

- [Google Play closed testing — 12 testers / 14 days requirement](https://support.google.com/googleplay/android-developer/answer/14151465?hl=en)
- [Live App Store / TestFlight review times (Runway)](https://www.runway.team/appreviewtimes)
- [App Store review windows and delays, 2026](https://aerious.uk/blog/app-store-review-time-in-2026-expected-approval-windows-and-delays)
- [Expo — Submit to app stores](https://docs.expo.dev/deploy/submit-to-app-stores/)
- [Expo — EAS plans and pricing](https://expo.dev/pricing)
- [Expo — Subscriptions and plans](https://docs.expo.dev/billing/plans/)
- [TestFlight overview (Apple)](https://developer.apple.com/help/app-store-connect/test-a-beta-version/testflight-overview/)
- [Chain Reaction (BuddyMatt) — Google Play](https://play.google.com/store/apps/details?id=com.BuddyMattEnt.ChainReaction)
- [Chain Reaction — Strategy Game (App Store)](https://apps.apple.com/us/app/chain-reaction-strategy-game/id6737422881)
- [Mobile game monetization strategies 2026 (Adapty)](https://adapty.io/blog/mobile-game-monetization/)
- [The hidden web game market (Game Developer)](https://www.gamedeveloper.com/business/the-huge-hidden-web-game-market-no-one-talks-about-and-how-to-get-in-)
- [Licensing games to web portals](https://www.abratabia.com/web-game-monetization/licensing-to-portals.php)
- [Publishing costs breakdown 2026](https://www.groovyweb.co/blog/how-much-does-it-cost-app-store)
