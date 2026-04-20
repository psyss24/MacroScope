# Mobile UI Overhaul Plan (Desktop-Preserving)

## 1. Goal
Build a dedicated mobile UI architecture for MacroScope while preserving the current desktop experience exactly as-is.

## 2. Core Constraints
- Desktop UI and interaction model must remain unchanged.
- Existing routes remain unchanged (`/`, `/markets`, `/macro`, `/commodities`, `/bonds`, `/stocks`).
- Data source logic remains shared between desktop and mobile render paths.
- Mobile UX should prioritize chart usability, touch targets, and compact spacing.

## 3. Target Breakpoint Contract
- Mobile: `<= 767px`
- Tablet: `768px - 1023px`
- Desktop: `>= 1024px`

Only mobile path will use the new modular UI during Phase 1-2. Tablet can remain desktop-first until Phase 3 polish.

## 4. Proposed Architecture

### 4.1 Render Strategy
At each page entry component:
- `if (isMobile)`: render mobile page component
- `else`: render existing desktop page component

This avoids risky desktop regressions from deep CSS overrides.

### 4.2 Shared Layers
Shared logic (desktop + mobile):
- API fetching and service calls in `src/services/`
- data normalization helpers (new adapters)
- formatting helpers for values, dates, and percent deltas

View-only split:
- Desktop: existing components/pages
- Mobile: new components under `src/components/mobile/` and `src/pages/mobile/`

### 4.3 New Mobile Foundation (Phase 1)
- `src/hooks/useIsMobile.js`
- `src/components/mobile/MobilePageShell.js`
- `src/components/mobile/MobilePageShell.module.css`
- `src/components/mobile/MobileSection.js`
- `src/components/mobile/MobileStickyTabs.js`
- `src/components/mobile/MobileCard.js`

## 5. Page-by-Page Mobile Module Map

### 5.1 Dashboard
Current desktop source:
- `src/components/Dashboard.js`

New mobile modules:
- `src/pages/mobile/DashboardMobilePage.js`
- `src/components/mobile/dashboard/MobileHero.js`
- `src/components/mobile/dashboard/MobileOverviewStrip.js`

Mobile behavior:
- compact hero
- swipe/stack KPI cards
- reduced vertical whitespace

### 5.2 Markets
Current desktop source:
- `src/pages/MarketsPage.js`

New mobile modules:
- `src/pages/mobile/MarketsMobilePage.js`
- `src/components/mobile/markets/MobileMarketSelector.js`
- `src/components/mobile/markets/MobileMarketChartPanel.js`
- `src/components/mobile/markets/MobileIndicesList.js`

Mobile behavior:
- one chart panel visible at a time
- chip-based selector
- touch-first chart controls

### 5.3 Macro
Current desktop source:
- `src/pages/MacroPage.js`

New mobile modules:
- `src/pages/mobile/MacroMobilePage.js`
- `src/components/mobile/macro/MobileRegionTabs.js`
- `src/components/mobile/macro/MobileMacroChartCarousel.js`
- `src/components/mobile/macro/MobileMacroMetricCards.js`

Mobile behavior:
- swipe-friendly metric chart carousel
- smaller summary cards with denser spacing
- region selector optimized for thumb use

### 5.4 Commodities
Current desktop source:
- `src/pages/CommoditiesPage.js`

New mobile modules:
- `src/pages/mobile/CommoditiesMobilePage.js`
- `src/components/mobile/commodities/MobileCommoditySwitcher.js`
- `src/components/mobile/commodities/MobileCommodityChart.js`

### 5.5 Bonds & Risk
Current desktop source:
- `src/pages/BondsRiskPage.js`

New mobile modules:
- `src/pages/mobile/BondsRiskMobilePage.js`
- `src/components/mobile/bonds/MobileTenorTabs.js`
- `src/components/mobile/bonds/MobileYieldChart.js`
- `src/components/mobile/bonds/MobileRiskSummary.js`

### 5.6 Stocks
Current desktop source:
- `src/pages/StocksPage.js`
- `src/components/stocks/StockDetailPage.js`

New mobile modules:
- `src/pages/mobile/StocksMobilePage.js`
- `src/components/mobile/stocks/MobileStockSearch.js`
- `src/components/mobile/stocks/MobileStockListCard.js`

## 6. Chart UX Rules for Mobile
- Minimum practical chart panel height: `240px`.
- Maximum one primary comparison chart per panel.
- Horizontal gesture reserved for chart/metric switching only.
- Chart legends become compact chips or summary rows.
- Avoid desktop-style hover interactions as primary affordance.

## 7. Spacing & Typography Rules for Mobile
- Section spacing: `12-16px`
- Card padding: `12px`
- Inter-card gap: `8-12px`
- Header title scales down to `1.1rem-1.35rem` in cards
- Keep line lengths short and avoid multi-line nav wrapping

## 8. Rollout Plan

### Phase 1: Foundation (safe, no route-level behavior change)
- add viewport hook and mobile base primitives
- add design tokens for mobile spacing and touch targets
- no desktop code path changes

### Phase 2: Macro + Markets mobile pages
- implement mobile page variants for highest-impact chart pages first
- route-level mobile branching behind a temporary feature flag

### Phase 3: Remaining pages + nav
- commodities, bonds/risk, stocks
- mobile navigation pattern and global shell polish

### Phase 4: Hardening
- QA matrix (iPhone SE, iPhone Pro Max, Pixel, small Android)
- interaction polish and perf optimization
- remove feature flag

## 9. QA Acceptance Checklist
- Desktop screenshots before/after are visually identical.
- No horizontal overflow on mobile pages.
- Mobile charts are legible and usable without pinch-zoom dependency.
- Touch targets are at least 40x40 CSS px.
- CLS/jank reduced on mobile route transitions.

## 10. Immediate Next Implementation Step
Start Phase 1 by introducing mobile foundation components and a viewport hook, then wire only one page (`Macro`) to an experimental mobile branch behind a flag for iterative validation.
