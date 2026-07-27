# FIIM — UI/UX Wireframe & Design System Specification
## Version 1.0 | 08 July 2026
### Inspired by: Sports Recovery Medical Technology Design Language

---

## 1. Design Philosophy

**"Clarity under pressure."**

The FIIM interface is designed for professionals who make high-stakes decisions in high-pressure environments—dim treatment rooms, bright pitches, noisy locker rooms, and time-critical pre-session windows. Every pixel serves the goal of reducing cognitive load and accelerating decision-making.

**Core Principles:**

1. **At-a-glance intelligence:** No dashboard should require more than 3 seconds to answer "Who is at risk today?"
2. **Progressive disclosure:** Surface summaries first; raw data and configuration are one click away.
3. **Context-aware contrast:** Support both dark mode (pitch-side, low-light medical rooms) and light mode (offices, daytime admin work).
4. **Touch-first for mobile:** Athlete surveys and coach tablet views are optimized for thumbs, not cursors.
5. **Medical gravitas + Athletic energy:** The visual language balances clinical trustworthiness (precision, structure) with sports performance dynamism (momentum, energy).

---

## 2. Color System

### 2.1 Primary Palette

| Token | Hex | RGBA | Usage |
|-------|-----|------|-------|
| **Primary 500** | `#0F4C81` | `rgb(15, 76, 129)` | Brand color, primary buttons, navigation active state, medical trust signals |
| **Primary 600** | `#0A3A66` | `rgb(10, 58, 102)` | Hover states, active pressed buttons |
| **Primary 400** | `#3B7AB8` | `rgb(59, 122, 184)` | Links, secondary accents, chart primary series |
| **Primary 300** | `#6BA3D9` | `rgb(107, 163, 217)` | Backgrounds, disabled states, chart fills |
| **Primary 100** | `#E8F1FA` | `rgb(232, 241, 250)` | Table row hover, card hover glow, input focus backgrounds |

### 2.2 Semantic / Risk Palette (Traffic Light System)

| Token | Hex | Usage |
|-------|-----|-------|
| **Risk Green 500** | `#22C55E` | Ready, optimal, low risk, cleared |
| **Risk Green 100** | `#DCFCE7` | Green zone backgrounds, success toasts |
| **Risk Yellow 500** | `#EAB308` | Caution, moderate risk, ready with limits |
| **Risk Yellow 100** | `#FEF9C3` | Yellow zone backgrounds, warning toasts |
| **Risk Amber 500** | `#F97316` | Compromised, elevated attention needed |
| **Risk Amber 100** | `#FFEDD5` | Amber zone backgrounds |
| **Risk Red 500** | `#EF4444` | High risk, medical hold, restricted |
| **Risk Red 100** | `#FEE2E2` | Red zone backgrounds, critical alerts |
| **Risk Crimson 600** | `#DC2626` | Critical risk, emergency intervention required |
| **Risk Crimson 900** | `#7F1D1D` | Crimson zone backgrounds, highest severity |

### 2.3 Neutral Palette (Light Mode)

| Token | Hex | Usage |
|-------|-----|-------|
| **Neutral 900** | `#111827` | Primary text, headings |
| **Neutral 700** | `#374151` | Secondary text, labels |
| **Neutral 500** | `#6B7280` | Placeholder text, disabled, meta info |
| **Neutral 300** | `#D1D5DB` | Borders, dividers, inactive states |
| **Neutral 200** | `#E5E7EB` | Table borders, card borders, separator lines |
| **Neutral 100** | `#F3F4F6` | Page background, section backgrounds |
| **Neutral 50** | `#F9FAFB` | Card backgrounds, input backgrounds, hover rows |
| **White** | `#FFFFFF` | Surface, modal backgrounds, elevated cards |

### 2.4 Neutral Palette (Dark Mode)

| Token | Hex | Usage |
|-------|-----|-------|
| **Dark 950** | `#030712` | Deep background ( OLED black ) |
| **Dark 900** | `#111827` | Page background |
| **Dark 800** | `#1F2937` | Card background, elevated surface |
| **Dark 700** | `#374151` | Input backgrounds, secondary surface |
| **Dark 600** | `#4B5563` | Borders, dividers |
| **Dark 400** | `#9CA3AF` | Secondary text |
| **Dark 200** | `#E5E7EB` | Primary text on dark |
| **Dark 100** | `#F3F4F6` | Headings on dark |

### 2.5 Accent Colors

| Token | Hex | Usage |
|-------|-----|-------|
| **Accent Teal** | `#14B8A6` | Recovery, wellness, sleep metrics |
| **Accent Purple** | `#8B5CF6` | Screening, movement, physio module branding |
| **Accent Coral** | `#F43F5E` | Strain, monotony, overreaching indicators |

---

## 3. Typography System

### 3.1 Font Family

| Context | Font | Weights | Fallback |
|---------|------|---------|----------|
| **Headings & UI** | Inter | 400, 500, 600, 700 | system-ui, -apple-system, sans-serif |
| **Data & Numbers** | Inter + Tabular Figures | 500, 600, 700 | monospace (for raw data tables) |
| **Athlete Mobile** | Inter | 400, 500, 600 | system-ui |

*Note: All numeric data (scores, load values, percentages) use `font-variant-numeric: tabular-nums` to prevent jitter during live updates.*

### 3.2 Type Scale

| Token | Size | Weight | Line Height | Letter Spacing | Usage |
|-------|------|--------|-------------|----------------|-------|
| **Display** | 36px / 2.25rem | 700 | 1.1 | -0.02em | Hero numbers, readiness score hero |
| **H1** | 28px / 1.75rem | 700 | 1.2 | -0.01em | Page titles, dashboard header |
| **H2** | 22px / 1.375rem | 600 | 1.3 | -0.01em | Section headers, card titles |
| **H3** | 18px / 1.125rem | 600 | 1.4 | 0 | Widget titles, table headers |
| **H4** | 16px / 1rem | 600 | 1.5 | 0 | Subsection titles, alert titles |
| **Body Large** | 16px / 1rem | 400 | 1.6 | 0 | Primary body text, descriptions |
| **Body** | 14px / 0.875rem | 400 | 1.5 | 0 | Standard text, table cells, labels |
| **Body Small** | 13px / 0.8125rem | 400 | 1.5 | 0 | Meta text, timestamps, footnotes |
| **Caption** | 12px / 0.75rem | 500 | 1.4 | 0.01em | Badges, tags, axis labels |
| **Overline** | 11px / 0.6875rem | 600 | 1.2 | 0.05em | Category labels, section overlines (uppercase) |

### 3.3 Data Typography

| Context | Size | Weight | Color | Notes |
|---------|------|--------|-------|-------|
| **Score Hero** | 48px | 700 | Risk zone color | Centered, with subtle glow shadow |
| **Score Tile** | 32px | 600 | Risk zone color | Inline with trend arrow |
| **Metric Large** | 24px | 600 | Neutral 900 | Key KPIs, load totals |
| **Metric Small** | 14px | 500 | Neutral 700 | Secondary metrics |
| **Trend Arrow** | 16px | 600 | Green/Red | ▲ ▼ ▬ with percentage |

---

## 4. Spacing System

### 4.1 Base Unit: 4px

| Token | Value | Usage |
|-------|-------|-------|
| **space-1** | 4px | Tight padding, icon gaps |
| **space-2** | 8px | Inline spacing, small gaps |
| **space-3** | 12px | Button padding Y, compact card padding |
| **space-4** | 16px | Standard card padding, form field gaps |
| **space-5** | 20px | Section internal padding |
| **space-6** | 24px | Card external gaps, modal padding |
| **space-8** | 32px | Section gaps, dashboard widget gaps |
| **space-10** | 40px | Major section separators |
| **space-12** | 48px | Page section margins |

### 4.2 Layout Grid

| Breakpoint | Columns | Gutter | Margin | Max Width |
|------------|---------|--------|--------|-----------|
| **Mobile** (< 640px) | 4 | 16px | 16px | 100% |
| **Tablet** (640–1024px) | 8 | 24px | 24px | 100% |
| **Desktop** (1024–1440px) | 12 | 24px | 32px | 1280px |
| **Wide** (> 1440px) | 12 | 32px | 48px | 1440px |

---

## 5. Component Library

### 5.1 Buttons

| Variant | Background | Text | Border | Hover | Pressed | Icon |
|---------|------------|------|--------|-------|---------|------|
| **Primary** | Primary 500 | White | None | Primary 600 | Primary 600 + scale(0.98) | 16px left or right |
| **Secondary** | White | Primary 500 | Primary 300 | Primary 100 | Neutral 100 | 16px |
| **Danger** | Red 500 | White | None | Red 600 | Red 600 + scale(0.98) | 16px |
| **Ghost** | Transparent | Neutral 700 | Neutral 300 | Neutral 100 | Neutral 200 | 16px |
| **Icon Button** | Transparent | Neutral 700 | None | Neutral 100 | scale(0.95) | 20px centered |

**Sizing:**
- **Small:** Height 32px, Padding 8px 12px, Font 13px
- **Medium:** Height 40px, Padding 10px 16px, Font 14px
- **Large:** Height 48px, Padding 12px 24px, Font 16px

**Border Radius:** 8px (consistent across all buttons)

### 5.2 Cards

| Elevation | Background | Border | Shadow | Usage |
|-----------|------------|--------|--------|-------|
| **Level 0** | White / Dark 800 | Neutral 200 / Dark 700 | None | Flat list items, inner panels |
| **Level 1** | White / Dark 800 | None | 0 1px 3px rgba(0,0,0,0.08) | Standard widget cards |
| **Level 2** | White / Dark 800 | None | 0 4px 12px rgba(0,0,0,0.12) | Hover state, modals, dropdowns |
| **Level 3** | White / Dark 800 | None | 0 8px 24px rgba(0,0,0,0.16) | Drawers, floating panels |

**Card Padding:** 16px–24px depending on content density
**Border Radius:** 12px (large), 8px (compact)

### 5.3 Traffic Light / Risk Badges

| Zone | Background | Text | Border | Icon | Example |
|------|------------|------|--------|------|---------|
| **Green** | Green 100 | Green 700 | Green 300 | Solid circle | "Ready — Full Training" |
| **Yellow** | Yellow 100 | Yellow 800 | Yellow 300 | Triangle outline | "Caution — Modify Intensity" |
| **Amber** | Amber 100 | Amber 800 | Amber 300 | Diamond | "Compromised — Individual Program" |
| **Red** | Red 100 | Red 700 | Red 300 | Octagon | "Restricted — Medical Hold" |
| **Crimson** | Crimson 900 | White | Crimson 600 | Exclamation | "Critical — Immediate Review" |

**Sizing:**
- **Badge:** Height 24px, Padding 4px 12px, Font 12px, Radius 12px (pill)
- **Chip:** Height 28px, Padding 6px 14px, Font 13px
- **Flag:** Height 32px, Padding 8px 16px, Font 14px, with left accent bar (4px)

### 5.4 Data Visualization (Charts)

| Chart Type | Primary Color | Grid | Axis | Tooltip |
|------------|---------------|------|------|---------|
| **Line Chart** | Primary 400 | Neutral 100 dotted | Neutral 500 | Level 2 card, appears on hover |
| **Bar Chart** | Risk zone colors per bar | None | Neutral 500 | Stacked values |
| **Area Chart** | Primary 300 (fill opacity 0.2) | Neutral 100 | Neutral 500 | Trend annotation |
| **Heatmap Matrix** | Green → Yellow → Red gradient | Cell borders Neutral 200 | Athlete names, input types | Cell hover shows exact value |
| **Donut / Pie** | Primary 400, Teal, Purple, Coral | Center hole shows total | None | Segment hover |

**Chart Container:**
- Background: Level 0 card
- Padding: 16px
- Header: H3 (18px) + optional subtitle Body Small
- Height: 240px (small), 320px (medium), 400px (large)

### 5.5 Tables

| Element | Style |
|---------|-------|
| **Header Row** | Background: Neutral 50, Font: H4 (14px semi-bold), Border-bottom: 2px Neutral 200 |
| **Data Row** | Background: White, Font: Body (14px), Border-bottom: 1px Neutral 200 |
| **Hover Row** | Background: Primary 100, Transition: 150ms ease |
| **Selected Row** | Background: Primary 100, Left border: 3px Primary 500 |
| **Sortable Header** | Hover: Primary 400 text, Chevron icon 12px |
| **Sticky Header** | `position: sticky; top: 0; z-index: 10` |
| **Empty State** | Centered illustration + Body Large + Ghost button |

**Row Height:** 52px (comfortable touch), 44px (compact)
**Cell Padding:** 12px 16px

### 5.6 Forms & Inputs

| State | Border | Background | Shadow | Icon |
|-------|--------|------------|--------|------|
| **Default** | Neutral 300 | White | None | Neutral 500 |
| **Hover** | Neutral 400 | White | None | Neutral 500 |
| **Focus** | Primary 500 | Primary 100 | 0 0 0 3px Primary 300 | Primary 500 |
| **Error** | Red 500 | Red 100 | 0 0 0 3px Red 300 | Red 500 |
| **Disabled** | Neutral 200 | Neutral 50 | None | Neutral 300 |

**Input Height:** 40px (standard), 48px (large)
**Border Radius:** 8px
**Label:** H4 (14px semi-bold), margin-bottom: 6px
**Helper Text:** Body Small (13px), color: Neutral 500, margin-top: 6px

### 5.7 Alert Banners & Toasts

| Type | Background | Border-left | Icon | Text |
|------|------------|-------------|------|------|
| **Info** | Primary 100 | Primary 500 4px | Info circle | Primary 700 |
| **Success** | Green 100 | Green 500 4px | Check circle | Green 700 |
| **Warning** | Yellow 100 | Yellow 500 4px | Alert triangle | Yellow 800 |
| **Critical** | Red 100 | Red 500 4px | X octagon | Red 700 |

**Toast:** Position fixed bottom-right (desktop), top-center (mobile), z-index: 1000, auto-dismiss 5s (except critical)
**Banner:** Full-width within content area, sticky top below header

---

## 6. Dashboard Layout Specifications

### 6.1 Global Shell / Navigation

**Header Bar (Desktop)**
- Height: 64px
- Background: White (Light) / Dark 900 (Dark)
- Border-bottom: 1px Neutral 200 / Dark 700
- Left: Logo (32px height) + Organization name (H3)
- Center: Role-aware primary navigation (pills style, active = Primary 500 bg + white text)
- Right: Notification bell (with red dot badge for unacknowledged alerts) + User avatar (32px circle) + Organization switcher (dropdown)

**Side Navigation (Desktop — Sport Scientist & Admin)**
- Width: 240px (expanded), 72px (collapsed)
- Background: Neutral 50 / Dark 900
- Border-right: 1px Neutral 200 / Dark 700
- Items: Icon (20px) + Label (Body, 14px), Padding 12px 16px, Active = Primary 500 left border 3px + Primary 100 bg
- Collapse toggle at bottom

**Mobile Navigation**
- Bottom tab bar (athlete view): 5 tabs, 64px height, icon 24px + label 11px
- Top hamburger + actions (coach/scientist view): Header 56px with back button, title, and action icons

### 6.2 Coach Dashboard Layout

**Viewport:** Desktop (1024px+), Optimized for Tablet (1024px landscape)

**Layout: Three-Column Grid (12-col system)**
```
┌─────────────────────────────────────────────────────────────┐
│ HEADER (64px)                                               │
├──────────────┬───────────────────────────────┬──────────────┤
│              │                               │              │
│  LEFT COL    │        CENTER COL             │  RIGHT COL   │
│  (3 cols)    │        (7 cols)               │  (2 cols)    │
│  280px       │        Fluid                  │  240px       │
│              │                               │              │
│  Alert       │  Team Readiness Grid          │  Session     │
│  Inbox       │  (Hero: Full Width)           │  Overview    │
│  (Scroll)    │                               │  Card        │
│              │  ┌────┬────┬────┬────┐       │              │
│  • Critical  │  │Ath │Read│Risk│Well│       │  Today:      │
│  • High      │  │lete│iness│Zone│ness│       │  Technical   │
│  • Medium    │  └────┴────┴────┴────┘       │  09:00       │
│              │                               │  90min       │
│              │  Traffic Light Matrix         │  RPE: 5      │
│              │  (Athlete rows × Status cols) │              │
│              │                               │  Highest     │
│              │  ▼ Scrollable ▼               │  Risk        │
│              │                               │  Athlete     │
│              │                               │  Card        │
│              │                               │              │
├──────────────┴───────────────────────────────┴──────────────┤
│  BOTTOM ROW (Full Width)                                    │
│  ┌──────────────────┐ ┌──────────────────┐ ┌─────────────┐ │
│  │ ACWR Population  │ │ Weekly Load      │ │ Availability│ │
│  │ Histogram        │ │ Stacked Bar      │ │ Timeline    │ │
│  │ (4 cols)         │ │ (4 cols)         │ │ (4 cols)    │ │
│  └──────────────────┘ └──────────────────┘ └─────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

**Component Specifications:**

**Alert Inbox (Left Column)**
- Card: Level 1, Padding 16px
- Header: H3 "Alerts" + Badge (unacknowledged count)
- List: Scrollable, max-height 60vh
- Item: Padding 12px, Left border 3px (severity color), Icon 16px, Title H4, Meta Body Small (athlete name + time ago)
- Swipe/Click: Expand to show recommended action + Acknowledge button

**Team Readiness Grid (Center Column — Hero)**
- Card: Level 1, Padding 0 (table edge-to-edge)
- Header: H2 "Team Readiness" + Date pill + Filter chips (Position, Squad, Availability)
- Table: Sticky header, Row height 52px
- Columns:
  1. Athlete (Avatar 32px circle + Name + Position)
  2. Readiness Score (48px hero number, zone color, with trend arrow)
  3. Risk Zone (Pill badge)
  4. ACWR (Number + zone dot)
  5. Wellness (Sparkline mini-chart, 60px wide, last 7 days)
  6. Recovery (Number + sleep icon)
  7. Availability (Dropdown: Available / Limited / Unavailable)
  8. Actions (⋯ menu: Profile, Message, Log Modification)
- Row Sorting: Default by Readiness ascending (lowest first = highest risk at top)
- Color Coding: Full row background tint at 5% opacity based on risk zone

**Session Overview (Right Column)**
- Card: Level 1, Padding 16px
- Header: H3 "Today's Session"
- Content: Session name (H2), Time, Duration, Planned RPE
- Athlete count: Total / Ready / At Risk
- Action: "View Session Plan" button (Secondary)
- Divider: 1px Neutral 200
- "Highest Risk Athlete" mini-card: Avatar + Name + Risk score + Quick action "Modify"

**Bottom Charts Row**
- ACWR Population: Histogram, bins 0.5–0.8, 0.8–1.0, 1.0–1.3, 1.3–1.5, 1.5+, colored by zone
- Weekly Load: 7-day stacked bar, segments by session type (color-coded)
- Availability Timeline: Gantt-style, 14-day forward view, green/red bars per athlete

---

### 6.3 Sport Scientist Dashboard Layout

**Layout: Two-Column with Left Panel**
```
┌─────────────────────────────────────────────────────────────┐
│ HEADER (64px) + Sub-nav (Calculation / Data / Reports)      │
├──────────────┬────────────────────────────────────────────┤
│  LEFT PANEL  │  MAIN CONTENT AREA                         │
│  (3 cols)    │  (9 cols)                                  │
│  280px       │                                            │
│              │  ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  Compliance  │  │Compliance│ │ Missing  │ │ Pipeline │   │
│  Overview    │  │ Rate     │ │ Data     │ │ Status   │   │
│  Cards       │  │ 94%      │ │ 3        │ │ Healthy  │   │
│              │  └──────────┘ └──────────┘ └──────────┘   │
│  Data Quality│                                            │
│  Heatmap     │  ┌────────────────────────────────────┐   │
│  (Mini)      │  │ Compliance Heatmap                 │   │
│              │  │ (Athlete × Input Type)            │   │
│  Algorithm   │  └────────────────────────────────────┘   │
│  Config      │                                            │
│  Panel       │  ┌────────────────────┐ ┌──────────────┐   │
│              │  │ Load vs Wellness   │ │ ACWR Trend   │   │
│              │  │ Scatter Plot       │ │ (Team)       │   │
│              │  └────────────────────┘ └──────────────┘   │
│              │                                            │
│              │  ┌────────────────────────────────────┐   │
│              │  │ Raw Data Explorer (Table)          │   │
│              │  │ Date | Athlete | Metric | Value   │   │
│              │  └────────────────────────────────────┘   │
├──────────────┴────────────────────────────────────────────┤
│  FOOTER: Algorithm Version v2.1.0 | Last Updated: 08:15    │
└─────────────────────────────────────────────────────────────┘
```

**Key Components:**
- **Compliance Cards:** Three mini-cards (Level 1, height 100px) with circular progress indicators (stroke width 4px, radius 28px)
- **Compliance Heatmap:** Matrix table, Athletes (rows) × Input Types (columns: Wellness, RPE, GPS, Wearable, Screening), Cell color: Green (complete), Yellow (late), Red (missing)
- **Load vs Wellness Scatter:** X-axis Wellness Index, Y-axis Weekly Load, Quadrant labels in corners, Athlete dots colored by risk zone, Click dot → drill to athlete
- **Raw Data Explorer:** Full-width table with filtering, column selector, and "Export CSV" primary button
- **Algorithm Config Panel (Left):** Collapsible accordion sections for each index (ACWR, Risk, Readiness), Sliders for weight adjustment (0–100%), Threshold input fields, Version history dropdown, "Clone Config" and "Deploy" buttons

---

### 6.4 Athlete Dashboard (Mobile-First)

**Viewport:** Mobile (375–414px), PWA optimized

**Layout: Single Column, Scrollable**
```
┌─────────────────────────────┐
│ Status Bar (Native feel)    │
├─────────────────────────────┤
│ Header: "Good Morning,      │
│ Marcus" + Date              │
├─────────────────────────────┤
│                             │
│  ┌─────────────────────┐   │
│  │  READINESS SCORE    │   │
│  │                     │   │
│  │        72           │   │
│  │    ━━━━━━━━         │   │
│  │   Caution (Yellow)  │   │
│  │                     │   │
│  │ "Prioritize technique│   │
│  │  over intensity"     │   │
│  └─────────────────────┘   │
│                             │
├─────────────────────────────┤
│ WELLNESS SUMMARY            │
│ ┌─────┐ ┌─────┐ ┌─────┐   │
│ │Fatig│ │Sleep│ │Soren│   │
│ │ 6/10│ │ 7/10│ │ 4/10│   │
│ └─────┘ └─────┘ └─────┘   │
├─────────────────────────────┤
│ RECOVERY STATUS             │
│ Sleep: 7.5h | Quality: 70% │
│ ━━━━━━━━━━━━━━━━▶ 78%      │
├─────────────────────────────┤
│ TODAY'S LOAD                │
│ sRPE: 450 | Team %ile: 62%  │
├─────────────────────────────┤
│ 7-DAY READINESS TREND       │
│ [Area Chart, 7 days]        │
├─────────────────────────────┤
│ PENDING SURVEYS             │
│ ┌─────────────────────────┐ │
│ │ 📝 Evening RPE Survey   │ │
│ │ Tap to complete →       │ │
│ └─────────────────────────┘ │
├─────────────────────────────┤
│ BOTTOM NAV (5 tabs)         │
│ Home | Wellness | Load |    │
│ Message | Profile             │
└─────────────────────────────┘
```

**Component Specifications:**

**Readiness Hero Card**
- Full width, 200px height, Border-radius 16px, Gradient background from zone color (top) to White (bottom) at 20% opacity
- Score: 48px bold, centered, with subtle text-shadow glow
- Zone label: 14px semi-bold, uppercase, with matching color
- Guidance text: 14px italic, centered, 80% width
- Pulsing animation on zone change (subtle scale pulse, 2s, once)

**Wellness Cards (Horizontal Scroll)**
- Card size: 100px × 80px, Border-radius 12px, Level 1
- Icon 24px (top), Score 18px bold (center), Label 12px (bottom)
- Color: Score color matches dimension (Fatigue = Amber, Sleep = Teal, Soreness = Red)

**Recovery Status**
- Progress bar: Height 8px, Border-radius 4px, Background Neutral 200, Fill Teal 500
- Metrics inline: Icon + value pairs

**Bottom Navigation**
- Height: 64px + safe-area-inset-bottom
- Active tab: Primary 500 icon + text, with top indicator line (2px)
- Inactive: Neutral 500
- Floating Action Button (FAB): Center "+" for quick survey entry (48px circle, Primary 500, shadow Level 3)

---

### 6.5 Executive Dashboard Layout

**Layout: Presentation-Optimized, Minimal Interaction**
```
┌─────────────────────────────────────────────────────────────┐
│ HEADER: FIIM Executive Summary | Date Range Selector        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐         │
│  │Total│ │Injur│ │Days │ │Adopt│ │Data │ │Risk │         │
│  │ 142 │ │  8  │ │ 124 │ │ 87% │ │ 91% │ │ 12% │         │
│  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘         │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────┐  ┌──────────────────────┐        │
│  │ Injury Burden Trend  │  │ Risk Distribution    │        │
│  │ (12-month line)      │  │ (Weekly stacked bar) │        │
│  └──────────────────────┘  └──────────────────────┘        │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────┐  ┌──────────────────────┐        │
│  │ Season Availability  │  │ Department Engagement│        │
│  │ (Area chart)         │  │ (Horizontal bars)    │        │
│  └──────────────────────┘  └──────────────────────┘        │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  TEAM SUMMARY RANKINGS                                      │
│  ┌────────────────────────────────────────────────────┐     │
│  │ Team | Athletes | Injuries | Days Lost | Avg Risk | ...│
│  └────────────────────────────────────────────────────┘     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Design Notes:**
- Cards: Level 1, minimal borders, generous whitespace (24px padding)
- Summary Cards: Height 120px, large number (36px), label (14px), trend arrow + percentage below
- Charts: Minimal axis lines, no grid clutter, data labels on hover only
- Tables: Compact (44px row height), sortable headers, export button top-right
- Date Range: Pill selector (This Month, This Season, Custom), positioned top-right

---

## 7. Key User Flows (Wireframe Narratives)

### 7.1 Flow: Morning Coach Decision (60-Second Workflow)

**Objective:** Coach arrives at facility at 07:30, needs to know who is at risk before 08:00 session.

**Screen States:**

1. **Login** (if not already authenticated)
   - Auto-login via biometric (Face ID / Fingerprint) if enabled
   - Redirect to Coach Dashboard

2. **Dashboard Load**
   - Skeleton screen loads (shimmer effect on cards)
   - Data populates within 2 seconds
   - Alert inbox auto-expands if unacknowledged critical alerts exist

3. **Coach Scan**
   - Eyes drawn to Team Readiness Grid (center)
   - Red/amber rows at top (sorted)
   - Risk badges scannable without reading numbers
   - Three-finger tap gesture to sort by different column (tablet)

4. **Intervention Decision**
   - Tap athlete row → Slide-out panel (right)
   - Panel shows: Readiness breakdown (radar chart), latest wellness, ACWR trend (7 days), injury status
   - Action buttons: "Log Modification" (primary), "Message Staff" (secondary), "View Profile" (ghost)

5. **Session Planning**
   - Tap "Today's Session" card → Session detail modal
   - Modify drill assignments: Drag athlete names between drill groups (A team / B team / Recovery)
   - Auto-saves; athletes receive push notification if their group changes

6. **Acknowledge Alerts**
   - Swipe left on alert → Reveal "Acknowledge" + "Add Note"
   - All critical alerts must be acknowledged before dashboard dismisses warning banner

**Time Target:** 45 seconds from app open to decision logged.

---

### 7.2 Flow: Athlete Morning Wellness Survey

**Objective:** Athlete wakes up, completes wellness check in < 60 seconds before leaving for training.

**Screen States:**

1. **Push Notification**
   - "Good morning! How are you feeling today?"
   - Tap opens app directly to survey (deep link)

2. **Survey Screen**
   - Single question per screen (swipe/card pattern)
   - Question 1: "How fatigued do you feel?" (1–10 slider, visual analog scale with emoji faces)
   - Question 2: "How many hours did you sleep?" (Number stepper, 0–12)
   - Question 3: "Sleep quality?" (1–5 star rating)
   - Question 4: "Muscle soreness?" (Body map tap: select body parts + severity)
   - Question 5: "Mood?" (Emoji selector: 😫 😕 😐 🙂 😄)
   - Question 6: "Stress level?" (1–10 slider)

3. **Review & Submit**
   - Summary screen: All responses in card grid
   - "Edit" available per question
   - Large Primary button: "Submit" (80% width, 48px height)
   - Estimated completion time: 42 seconds shown at top

4. **Immediate Feedback**
   - Post-submit: Personal readiness score hero card
   - "Your readiness today: 72 — Caution"
   - "Tip: Prioritize technique over intensity. Aim for 8+ hours tonight."
   - Streak counter: "🔥 12-day streak!"

5. **Background**
   - Data syncs to server
   - Calculation engine updates within 15 seconds
   - Coach dashboard auto-refreshes

---

### 7.3 Flow: Physiotherapist Injury Documentation

**Objective:** Physio examines athlete, documents injury, updates RTP stage, notifies coach.

**Screen States:**

1. **Injury Case List**
   - Filter: "Active Cases" (default)
   - Search bar at top
   - Card list: Athlete avatar + Name + Injury site + Days since report + Stage badge

2. **Case Detail**
   - Tab navigation: Overview | Diagnoses | Treatment Notes | RTP | Clearance
   - Overview: Mechanism, site, tissue, severity, dates, recurrence flag
   - Timeline visualization: Vertical line with dots for each event (reported → diagnosed → treatment → RTP stages)

3. **Add Treatment Note**
   - Form: Treatment type (radio chips), Interventions (multi-select chips), Pain score (1–10 slider), Subjective notes (textarea), Objective measures (JSON key-value builder)
   - "Update Medical Hold" checkbox: If checked, auto-notifies coach
   - Attach file: Camera roll or photo capture (for wound/injury documentation)

4. **Update RTP Stage**
   - Stage selector: Vertical stepper (5 stages), Current stage highlighted
   - Objective criteria checklist per stage
   - "Criteria Met" toggle per item
   - If criteria all met and clearance required: "Request Doctor Clearance" button

5. **Confirmation**
   - Toast: "Treatment note logged. Coach notified of medical hold update."
   - Case card updates in real-time for all viewers

---

### 7.4 Flow: Sport Scientist Algorithm Configuration

**Objective:** Lead sport scientist adjusts Injury Risk Index weights for upcoming preseason block.

**Screen States:**

1. **Calculation Config List**
   - Table: Config name | Type | Version | Status (Active / Draft) | Last modified
   - "Create New Version" primary button

2. **Config Editor**
   - Header: Config name + Type badge + Version input
   - Left panel: Index tree (Injury Risk Index → ACWR → Wellness → Recovery → Movement → Sleep → History)
   - Right panel: Parameter editor
     - Weight sliders (0–100%, draggable, shows percentage)
     - Threshold inputs (numeric with validation)
     - Method toggles (Rolling Average / EWMA)
     - Window size inputs (days)
   - Preview panel (bottom): Live preview with historical data
     - "Run simulation on last season" button
     - Results: Sensitivity, Specificity, Flagged athlete count

3. **Validation**
   - Automated checks: Weights sum to 1.0, thresholds logical (min < max)
   - Warning if deviation from published research norms > 20%

4. **Deployment**
   - "Save as Draft" (secondary) or "Deploy to Production" (primary, with confirmation modal)
   - Deployment modal: Summary of changes, impact warning, checkbox "I understand this affects all athletes"
   - Post-deploy: Audit log entry, email notification to all sport scientists in org

---

## 8. Responsive Behavior Matrix

| Component | Mobile (< 640px) | Tablet (640–1024px) | Desktop (> 1024px) |
|-----------|------------------|---------------------|--------------------|
| **Navigation** | Bottom tab bar (athlete) / Top hamburger (staff) | Left side rail (72px icons + text) | Left sidebar (240px expanded) |
| **Dashboard Grid** | Single column, stacked cards | 2-column grid | 3-column grid (coach), 2-column (scientist) |
| **Readiness Grid** | Card list (athlete cards, vertical scroll) | Compact table (5 columns) | Full table (8 columns) |
| **Charts** | Stacked vertically, 240px height | 2-column chart grid | 3-column chart grid |
| **Alert Inbox** | Full-screen modal | Slide-out drawer (320px) | Left column embedded |
| **Modals** | Full-screen overlay, bottom sheet | Center modal (600px wide) | Center modal (800px wide) |
| **Tables** | Card transformation (no table) | Horizontal scroll table | Full table with all columns |
| **Forms** | Single column, 48px inputs | 2-column layout | 2–3 column layout |

---

## 9. Animation & Interaction Specifications

### 9.1 Motion Principles

| Principle | Implementation |
|-----------|---------------|
| **Purposeful** | Animations guide attention, never decorative |
| **Fast** | Micro-interactions < 300ms, page transitions < 500ms |
| **Smooth** | Easing: `cubic-bezier(0.4, 0, 0.2, 1)` (Material standard) |
| **Respectful** | `prefers-reduced-motion` disables all non-essential animations |

### 9.2 Specific Animations

| Interaction | Duration | Easing | Transform |
|-------------|----------|--------|-----------|
| **Card hover** | 200ms | ease-out | translateY(-2px) + shadow Level 2 |
| **Button press** | 100ms | ease-in-out | scale(0.97) |
| **Page transition** | 300ms | ease-in-out | opacity 0→1 + translateX(20px→0) |
| **Modal open** | 250ms | ease-out | opacity 0→1 + scale(0.95→1) |
| **Modal close** | 200ms | ease-in | opacity 1→0 + scale(1→0.95) |
| **Alert banner slide** | 300ms | ease-out | translateY(-100%→0) |
| **Score update** | 500ms | ease-out | countUp.js style number animation |
| **Chart data load** | 600ms | ease-out | Draw from left to right |
| **Skeleton shimmer** | 1.5s | linear infinite | translateX(-100%→100%) gradient mask |
| **Pull-to-refresh** | 400ms | ease-out | rotate(0→360) spinner |
| **Toast enter** | 300ms | ease-out | translateY(100%→0) + opacity |
| **Toast exit** | 200ms | ease-in | translateY(0→100%) + opacity |

### 9.3 Gestures (Touch)

| Gesture | Context | Action |
|---------|---------|--------|
| **Swipe left** | Alert list item | Reveal acknowledge + dismiss actions |
| **Swipe right** | Athlete row (coach) | Quick-actions: Message, Call, Profile |
| **Pull down** | Dashboard | Refresh data (pull-to-refresh) |
| **Pinch** | Chart | Zoom into date range |
| **Double tap** | Readiness score | Toggle detailed component breakdown |
| **Long press** | Athlete avatar | Peek profile preview (contextual popover) |

---

## 10. Accessibility Specifications

### 10.1 WCAG 2.1 AA Compliance

| Requirement | Implementation |
|-------------|---------------|
| **Color contrast** | All text ≥ 4.5:1 (Body), ≥ 3:1 (Large text/headings) |
| **Color independence** | Risk status conveyed by text label + icon + color (not color alone) |
| **Keyboard navigation** | Tab order logical, focus visible (2px Primary 500 outline, 2px offset) |
| **Screen readers** | ARIA labels on all interactive elements; chart data as accessible tables |
| **Touch targets** | Minimum 44 × 44dp (mobile), 32 × 32px (desktop compact) |
| **Font scaling** | UI functional at 200% zoom; no horizontal scroll on mobile |
| **Reduced motion** | `prefers-reduced-motion: reduce` disables all non-essential animations |

### 10.2 ARIA Patterns

| Component | ARIA Role | Properties |
|-----------|-----------|------------|
| **Alert list** | `role="feed"` | `aria-busy` during load |
| **Readiness grid** | `role="grid"` | `aria-sort` on headers, `aria-selected` on rows |
| **Risk badge** | `role="status"` | `aria-label="High risk: Load reduction recommended"` |
| **Score hero** | `role="meter"` | `aria-valuenow`, `aria-valuemin`, `aria-valuemax` |
| **Chart container** | `role="img"` | `aria-label` describing trend summary |
| **Modal** | `role="dialog"` | `aria-modal="true"`, focus trap, return focus on close |
| **Toast** | `role="alert"` | `aria-live="polite"`, `aria-atomic="true"` |

---

## 11. Iconography

### 11.1 Icon System

**Library:** Lucide React (or Heroicons) — stroke-based, consistent 1.5px stroke width
**Size Scale:** 12px (inline), 16px (buttons/table), 20px (navigation), 24px (mobile tabs), 32px (empty states)

### 11.2 Core Icon Mapping

| Concept | Icon | Notes |
|---------|------|-------|
| Dashboard | LayoutDashboard | Primary nav |
| Athletes | Users | Management |
| Wellness | Heart | Surveys |
| Training | Dumbbell | Sessions |
| Load | Activity | Metrics |
| Injury | Bandage | Medical module |
| Alert | Bell / BellRing | Notifications |
| Report | FileText | Reporting |
| Settings | Settings | Admin |
| Risk/Warning | AlertTriangle | Zone indicator |
| Ready/Check | CheckCircle2 | Green zone |
| Restricted | Ban | Red zone |
| Recovery | BatteryCharging | Sleep/HRV |
| Screening | ClipboardCheck | Physical tests |
| Trend Up | TrendingUp | Positive metric |
| Trend Down | TrendingDown | Negative metric |
| Calendar | Calendar | Date pickers |
| Filter | Filter | Data filtering |
| Export | Download | CSV/PDF export |
| Message | MessageSquare | In-app chat |
| Sync | RefreshCw | Data refresh |
| Offline | WifiOff | Connectivity status |
| Dark Mode | Moon / Sun | Theme toggle |

---

## 12. Dark Mode Specifications

### 12.1 Toggle Mechanism
- User preference stored in localStorage
- System preference detection (`prefers-color-scheme`)
- Manual toggle in user profile/settings
- Instant switch (no page reload), CSS custom properties update

### 12.2 Key Inversions

| Light Mode | Dark Mode |
|------------|-----------|
| White surface | Dark 800 surface |
| Neutral 900 text | Dark 100 text |
| Neutral 100 bg | Dark 900 bg |
| Primary 100 hover | Dark 700 hover |
| Neutral 200 borders | Dark 600 borders |
| Green 100 risk bg | Green 900 (20% opacity) |
| Yellow 100 risk bg | Yellow 900 (20% opacity) |
| Red 100 risk bg | Red 900 (20% opacity) |
| Chart grid lines | Dark 600 at 30% opacity |
| Shadows | Reduced to 50% opacity |

### 12.3 Chart Adaptations
- All chart backgrounds: Dark 800
- Axis text: Dark 200
- Grid lines: Dark 600 at 20% opacity
- Series colors: Maintained (Green/Yellow/Red still readable)
- Fill opacity: Reduced from 0.2 to 0.15 for softer appearance

---

## 13. Empty States & Error Screens

### 13.1 Empty States

| Context | Illustration | Headline | Subtext | Action |
|---------|--------------|----------|---------|--------|
| **No data yet** | Line art: athlete with clipboard | "No data for this period" | "Athletes haven't submitted wellness surveys or load data." | "Send Reminder" |
| **No alerts** | Line art: checkmark shield | "All clear!" | "No active risk alerts for your team." | "View historical alerts" |
| **No injuries** | Line art: healthy athlete | "No active injuries" | "Your team is fully healthy." | "View injury history" |
| **No reports** | Line art: document stack | "No reports generated" | "Create your first monitoring report." | "Generate Report" |
| **Search empty** | Line art: magnifying glass | "No results found" | "Try adjusting your search or filters." | "Clear filters" |

**Style:** 120px illustration, Neutral 500 lines on transparent bg, centered, with H3 headline + Body subtext + Ghost button

### 13.2 Error Screens

| Error | Illustration | Message | Action |
|-------|--------------|---------|--------|
| **404** | Broken link line art | "Page not found" | "Go to Dashboard" |
| **500** | Warning triangle line art | "Something went wrong" | "Refresh page" + "Contact support" |
| **Offline** | WifiOff line art | "You're offline" | "Retry connection" |
| **No permission** | Lock line art | "Access denied" | "Request access" + "Go back" |
| **Data load fail** | RefreshCw line art | "Failed to load data" | "Retry" |

---

## 14. Design Tokens (CSS Custom Properties)

```css
:root {
  /* Colors */
  --color-primary-500: #0F4C81;
  --color-primary-600: #0A3A66;
  --color-primary-400: #3B7AB8;
  --color-primary-300: #6BA3D9;
  --color-primary-100: #E8F1FA;
  
  --color-risk-green-500: #22C55E;
  --color-risk-green-100: #DCFCE7;
  --color-risk-yellow-500: #EAB308;
  --color-risk-yellow-100: #FEF9C3;
  --color-risk-amber-500: #F97316;
  --color-risk-amber-100: #FFEDD5;
  --color-risk-red-500: #EF4444;
  --color-risk-red-100: #FEE2E2;
  --color-risk-crimson-600: #DC2626;
  --color-risk-crimson-900: #7F1D1D;
  
  --color-neutral-900: #111827;
  --color-neutral-700: #374151;
  --color-neutral-500: #6B7280;
  --color-neutral-300: #D1D5DB;
  --color-neutral-200: #E5E7EB;
  --color-neutral-100: #F3F4F6;
  --color-neutral-50: #F9FAFB;
  --color-white: #FFFFFF;
  
  --color-accent-teal: #14B8A6;
  --color-accent-purple: #8B5CF6;
  --color-accent-coral: #F43F5E;
  
  /* Typography */
  --font-family-base: 'Inter', system-ui, -apple-system, sans-serif;
  --font-size-display: 2.25rem;   /* 36px */
  --font-size-h1: 1.75rem;      /* 28px */
  --font-size-h2: 1.375rem;     /* 22px */
  --font-size-h3: 1.125rem;     /* 18px */
  --font-size-h4: 1rem;         /* 16px */
  --font-size-body: 0.875rem;   /* 14px */
  --font-size-small: 0.8125rem; /* 13px */
  --font-size-caption: 0.75rem; /* 12px */
  
  /* Spacing */
  --space-1: 0.25rem;   /* 4px */
  --space-2: 0.5rem;    /* 8px */
  --space-3: 0.75rem;  /* 12px */
  --space-4: 1rem;      /* 16px */
  --space-5: 1.25rem;  /* 20px */
  --space-6: 1.5rem;   /* 24px */
  --space-8: 2rem;      /* 32px */
  --space-10: 2.5rem;  /* 40px */
  --space-12: 3rem;    /* 48px */
  
  /* Shadows */
  --shadow-level-0: none;
  --shadow-level-1: 0 1px 3px rgba(0, 0, 0, 0.08);
  --shadow-level-2: 0 4px 12px rgba(0, 0, 0, 0.12);
  --shadow-level-3: 0 8px 24px rgba(0, 0, 0, 0.16);
  
  /* Border Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-full: 9999px;
  
  /* Transitions */
  --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-base: 200ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-slow: 300ms cubic-bezier(0.4, 0, 0.2, 1);
  
  /* Z-Index Scale */
  --z-base: 0;
  --z-dropdown: 100;
  --z-sticky: 200;
  --z-drawer: 300;
  --z-modal: 400;
  --z-popover: 500;
  --z-tooltip: 600;
  --z-toast: 700;
  --z-header: 800;
}

/* Dark Mode Override */
[data-theme="dark"] {
  --color-bg-page: #111827;
  --color-bg-card: #1F2937;
  --color-bg-input: #374151;
  --color-border: #4B5563;
  --color-text-primary: #F3F4F6;
  --color-text-secondary: #9CA3AF;
  --color-text-muted: #6B7280;
  --shadow-level-1: 0 1px 3px rgba(0, 0, 0, 0.3);
  --shadow-level-2: 0 4px 12px rgba(0, 0, 0, 0.4);
  --shadow-level-3: 0 8px 24px rgba(0, 0, 0, 0.5);
}
```

---

*End of UI/UX Wireframe & Design System Specification*

**Document Version:** 1.0  
**Status:** Complete  
**Date:** 08 July 2026
