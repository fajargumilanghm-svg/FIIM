# FIIM — Figma-Ready Mockup Description
## Pixel-Perfect Frame Specifications for Developer Handoff
### Version 1.0 | 08 July 2026

---

## 1. Figma File Structure

```
FIIM Design System v1.0
├── 🎨 Design System
│   ├── 🌈 Color Styles
│   ├── 🔤 Text Styles
│   ├── ⚡ Effect Styles
│   └── 📐 Grid Styles
├── 🧩 Component Library
│   ├── Buttons
│   ├── Inputs
│   ├── Cards
│   ├── Badges
│   ├── Tables
│   ├── Charts
│   ├── Modals
│   ├── Navigation
│   └── Icons
├── 📱 Mobile (Athlete)
│   ├── Onboarding Flow
│   ├── Dashboard
│   ├── Wellness Survey
│   └── Profile
├── 💻 Desktop — Coach
│   ├── Login
│   ├── Dashboard
│   ├── Athlete Profile
│   ├── Session Planning
│   └── Reports
├── 💻 Desktop — Sport Scientist
│   ├── Dashboard
│   ├── Data Explorer
│   ├── Algorithm Config
│   └── Compliance
├── 💻 Desktop — Medical
│   ├── Injury Cases
│   ├── Case Detail
│   └── Clearance
└── 💻 Desktop — Admin
    ├── Organization Settings
    └── User Management
```

---

## 2. Design System Tokens (Figma Styles)

### 2.1 Color Styles (Figma: Paint Styles)

```
🌈 Primary
├── Primary/500  (#0F4C81)
├── Primary/600  (#0A3A66)
├── Primary/400  (#3B7AB8)
├── Primary/300  (#6BA3D9)
├── Primary/100  (#E8F1FA)

🌈 Risk
├── Risk/Green/500  (#22C55E)
├── Risk/Green/100  (#DCFCE7)
├── Risk/Yellow/500 (#EAB308)
├── Risk/Yellow/100 (#FEF9C3)
├── Risk/Amber/500  (#F97316)
├── Risk/Amber/100  (#FFEDD5)
├── Risk/Red/500    (#EF4444)
├── Risk/Red/100    (#FEE2E2)
├── Risk/Crimson/600 (#DC2626)
├── Risk/Crimson/900 (#7F1D1D)

🌈 Neutral
├── Neutral/900  (#111827)
├── Neutral/700  (#374151)
├── Neutral/500  (#6B7280)
├── Neutral/300  (#D1D5DB)
├── Neutral/200  (#E5E7EB)
├── Neutral/100  (#F3F4F6)
├── Neutral/50   (#F9FAFB)
├── White        (#FFFFFF)

🌈 Dark Mode
├── Dark/950  (#030712)
├── Dark/900  (#111827)
├── Dark/800  (#1F2937)
├── Dark/700  (#374151)
├── Dark/600  (#4B5563)
├── Dark/400  (#9CA3AF)
├── Dark/200  (#E5E7EB)
├── Dark/100  (#F3F4F6)

🌈 Accent
├── Accent/Teal    (#14B8A6)
├── Accent/Purple  (#8B5CF6)
├── Accent/Coral   (#F43F5E)
```

### 2.2 Text Styles (Figma: Text Styles)

```
🔤 Display/Display — 36px / Bold / -0.02em
🔤 Heading/H1 — 28px / Bold / -0.01em
🔤 Heading/H2 — 22px / SemiBold / -0.01em
🔤 Heading/H3 — 18px / SemiBold / 0
🔤 Heading/H4 — 16px / SemiBold / 0
🔤 Body/Body Large — 16px / Regular / 0
🔤 Body/Body — 14px / Regular / 0
🔤 Body/Body Small — 13px / Regular / 0
🔤 Caption/Caption — 12px / Medium / 0.01em
🔤 Overline/Overline — 11px / SemiBold / 0.05em (UPPERCASE)

🔤 Data/Score Hero — 48px / Bold / Center
🔤 Data/Score Tile — 32px / SemiBold
🔤 Data/Metric Large — 24px / SemiBold
🔤 Data/Metric Small — 14px / Medium
```

### 2.3 Effect Styles (Figma: Effect Styles)

```
⚡ Shadow/Level 0 — None
⚡ Shadow/Level 1 — Drop Shadow / 0,1px,3px / rgba(0,0,0,0.08)
⚡ Shadow/Level 2 — Drop Shadow / 0,4px,12px / rgba(0,0,0,0.12)
⚡ Shadow/Level 3 — Drop Shadow / 0,8px,24px / rgba(0,0,0,0.16)
⚡ Shadow/Glow Green — Drop Shadow / 0,0px,12px / rgba(34,197,94,0.3)
⚡ Shadow/Glow Yellow — Drop Shadow / 0,0px,12px / rgba(234,179,8,0.3)
⚡ Shadow/Glow Red — Drop Shadow / 0,0px,12px / rgba(239,68,68,0.3)
```

---

## 3. Frame-by-Frame Specifications

### FRAME 01: Desktop — Login Screen
**Frame Size:** 1440 × 900 (Desktop)
**Background:** Neutral 50

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  [Logo: FIIM]                              [Language]      │
│                                                             │
│                                                             │
│                                                             │
│                                                             │
│        ┌──────────────────────────────────────┐             │
│        │                                      │             │
│        │     Welcome Back                       │             │
│        │     Sign in to continue                │             │
│        │                                      │             │
│        │     ┌─────────────────────────┐      │             │
│        │     │ 📧 Email                │      │             │
│        │     └─────────────────────────┘      │             │
│        │                                      │             │
│        │     ┌─────────────────────────┐      │             │
│        │     │ 🔒 Password             │      │             │
│        │     └─────────────────────────┘      │             │
│        │                                      │             │
│        │     [ ] Remember me                  │             │
│        │     Forgot password?                 │             │
│        │                                      │             │
│        │     ┌─────────────────────────┐      │             │
│        │     │      Sign In            │      │             │
│        │     └─────────────────────────┘      │             │
│        │                                      │             │
│        │     ──────── or ────────            │             │
│        │                                      │             │
│        │     ┌─────────────────────────┐      │             │
│        │     │ Sign in with SSO        │      │             │
│        │     └─────────────────────────┘      │             │
│        │                                      │             │
│        │     New to FIIM? Contact your        │             │
│        │     organization administrator         │             │
│        │                                      │             │
│        └──────────────────────────────────────┘             │
│                                                             │
│                                                             │
│  © 2026 FIIM. All rights reserved.                          │
└─────────────────────────────────────────────────────────────┘
```

**Specs:**
- **Logo:** 32px height, top-left, 32px margin
- **Language Selector:** Top-right, dropdown, 14px
- **Card:** Centered (both axes), 480px width, Level 2 shadow, 12px radius, White bg, padding 48px
- **"Welcome Back":** H1 (28px Bold), Neutral 900, margin-bottom 8px
- **"Sign in to continue":** Body Large (16px), Neutral 500
- **Input fields:** 48px height, full width, 8px radius, Neutral 200 border, 14px placeholder
- **Remember me:** Checkbox 16px + Body (14px)
- **Forgot password:** Body (14px), Primary 500, right-aligned
- **Sign In button:** Primary, Large (48px), full width, margin-top 24px
- **Divider:** 1px Neutral 200, "or" text centered (14px Neutral 500), margin 24px vertical
- **SSO button:** Secondary, Large, full width
- **Footer text:** Caption (12px), Neutral 500, centered, bottom 24px

---

### FRAME 02: Coach Dashboard — Main View
**Frame Size:** 1440 × 900 (Desktop)
**Background:** Neutral 100

```
┌─────────────────────────────────────────────────────────────┐
│ FIIM  [Dashboard] [Athletes] [Sessions] [Reports]  🔔 👤 ▼  │ ← 64px height
├──────────────┬───────────────────────────────┬──────────────┤
│              │                               │              │
│  ALERTS      │  TEAM READINESS              │  TODAY'S     │
│              │                               │  SESSION     │
│  ┌────────┐  │  ┌────────────────────────┐ │  ┌────────┐  │
│  │ 🔴 3   │  │  │ Team: Men's First Team  │ │  │ Morning │  │
│  │ Critical│  │  │ 15 July 2026            │ │  │ Tech    │  │
│  ├────────┤  │  ├────────────────────────┤ │  │ 09:00   │  │
│  │ 🟡 5   │  │  │ [Filter ▼] [Pos ▼]     │ │  ├────────┤  │
│  │ High   │  │  ├────────────────────────┤ │  │ 24/24   │  │
│  ├────────┤  │  │ Athlete │ Read │ Risk │  │ │  │ Ready   │  │
│  │ 🟢 12  │  │  │─────────┼──────┼──────┤  │ │  │ 22 at   │  │
│  │ Normal │  │  │ Marcus  │ 72   │ 🟡   │  │ │  │ Risk    │  │
│  ├────────┤  │  │ Jens    │ 45   │ 🔴   │  │ │  │ 2 at    │  │
│  │ ⚠️ 2   │  │  │ Antoine │ 85   │ 🟢   │  │ │  │ Rest    │  │
│  │ Missing│  │  │ ...     │ ...  │ ...  │  │ │  │ 0       │  │
│  └────────┘  │  └────────────────────────┘ │  └────────┘  │
│              │                               │              │
│  [View All]  │                               │ [Details]    │
│              │                               │              │
│              │                               │              │
│              │                               │ ┌────────┐   │
│              │                               │ │ HIGHEST│   │
│              │                               │ │ RISK   │   │
│              │                               │ │ Jens   │   │
│              │                               │ │ 45/100 │   │
│              │                               │ │ 🔴 Rest│   │
│              │                               │ │ today  │   │
│              │                               │ └────────┘   │
│              │                               │              │
├──────────────┴───────────────────────────────┴──────────────┤
│                                                             │
│  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────┐   │
│  │ ACWR Population  │ │ Weekly Load      │ │ Availability │   │
│  │ [Histogram]      │ │ [Stacked Bar]    │ │ [Gantt]      │   │
│  └──────────────────┘ └──────────────────┘ └──────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Detailed Specs:**

**Header (64px):**
- Background: White
- Border-bottom: 1px Neutral 200
- Left: Logo (32px) + Brand name (H3, 18px Bold)
- Center nav: Dashboard (active) | Athletes | Sessions | Reports
  - Active: Primary 500 text + bottom border 2px Primary 500
  - Inactive: Neutral 700, 14px Medium
- Right: Notification bell (20px icon, 16px container, red dot 8px if unacknowledged) + Avatar (32px circle) + Dropdown chevron
- All items vertically centered

**Alert Column (Left, 280px):**
- Card: Level 1, White, 12px radius, margin 16px
- Header: H3 "Alerts" + Badge (16px pill, Primary 500 bg, white text, count)
- Alert items: Vertical stack, gap 0 (dividers between items)
  - Each item: 12px padding, left border 3px (severity color)
  - Icon 16px (severity color) + Title (H4) + Meta (Caption, Neutral 500, "2h ago")
  - Critical: Red left border + Red 100 background tint
- Scrollable area: max-height calc(100vh - 200px)
- "View All" link: Primary 400, 14px, centered at bottom

**Team Readiness Grid (Center, fluid):**
- Card: Level 1, White, 12px radius, padding 0 (table flush)
- Header area: Padding 16px
  - Left: H2 "Team Readiness" + Date pill (Caption, Neutral 500, Neutral 100 bg, 6px 12px padding, 12px radius)
  - Right: Filter chips (Position ▼, Squad ▼, Availability ▼)
    - Chip: Neutral 100 bg, Neutral 700 text, 8px 12px padding, 8px radius, 8px gap
- Table:
  - Header row: 44px height, Neutral 50 bg, border-bottom 2px Neutral 200
  - Header text: H4 (14px SemiBold), Neutral 900
  - Sortable headers: ChevronDown icon 12px, hover Primary 400
  - Data rows: 52px height, border-bottom 1px Neutral 200
  - Row hover: Background Primary 100, transition 150ms
  - Selected row: Left border 3px Primary 500
  - Columns:
    1. **Athlete:** Avatar 32px (circle) + First + Last name (Body, 14px) + Position (Caption, Neutral 500, below name)
    2. **Readiness:** Score 32px (Data/Score Tile, zone color) + trend arrow (▲▼▬, 12px) + zone label (Caption, uppercase, zone color)
    3. **Risk Zone:** Pill badge (24px height, zone color bg + text)
    4. **ACWR:** Number (Body, 14px SemiBold) + dot (8px circle, zone color)
    5. **Wellness:** Sparkline SVG (60px wide, 20px tall, stroke 2px zone color, no axis)
    6. **Recovery:** Number + small sleep icon (16px)
    7. **Availability:** Dropdown select (Ghost button style, current value shown)
    8. **Actions:** ⋯ (more) icon button 32px
  - Row color coding: Background tint at 5% opacity based on risk zone
    - Green: Green 500 at 5%
    - Yellow: Yellow 500 at 5%
    - Amber: Amber 500 at 5%
    - Red: Red 500 at 5%
    - Crimson: Crimson 600 at 10%

**Session Column (Right, 240px):**
- Card: Level 1, White, 12px radius, padding 16px
- "Today's Session": Overline (11px uppercase, Neutral 500), margin-bottom 4px
- Session name: H2 (22px Bold, Neutral 900)
- Time: Body Large + Duration pill (Neutral 100 bg)
- Stats: Horizontal stack, 3 items
  - Each: Number (H2, 22px) + Label (Caption, Neutral 500)
  - Divided by 1px Neutral 200 vertical line
- "Details" link: Primary 500, 14px
- Divider: 1px Neutral 200, margin 16px vertical
- "Highest Risk Athlete" mini-card:
  - Avatar 40px + Name (H4) + Score 24px (Red 500) + Zone badge (Red)
  - Action: "Modify" button (Ghost, Small)

**Bottom Chart Row:**
- Three cards, equal width (33.3%), gap 16px
- Card: Level 1, padding 16px
- Chart header: H3 + optional subtitle (Caption)
- Chart area: 240px height (desktop), responsive scaling

---

### FRAME 03: Athlete Dashboard — Mobile (375px)
**Frame Size:** 375 × 812 (iPhone 14 Pro viewport)
**Background:** Neutral 100

```
┌─────────────────────┐
│ 9:41                │
├─────────────────────┤
│ Good Morning,       │
│ Marcus              │
│ Monday, 15 July     │
├─────────────────────┤
│                     │
│ ┌─────────────────┐ │
│ │                 │ │
│ │   READINESS     │ │
│ │                 │ │
│ │      72         │ │
│ │   ━━━━━━━━      │ │
│ │   CAUTION       │ │
│ │                 │ │
│ │ "Prioritize     │ │
│ │  technique      │ │
│ │  over intensity"│ │
│ │                 │ │
│ └─────────────────┘ │
│                     │
├─────────────────────┤
│ WELLNESS TODAY      │
│ ┌───┐┌───┐┌───┐   │
│ │ 😫││ 😴││ 😣│   │
│ │ 6 ││ 7 ││ 4 │   │
│ │Fat││Sle││Sor│   │
│ └───┘└───┘└───┘   │
│                     │
├─────────────────────┤
│ RECOVERY            │
│ Sleep 7.5h ●●●●○    │
│ Quality 70%         │
│ ━━━━━━━━━━━━━━━▶78% │
│                     │
├─────────────────────┤
│ TODAY'S LOAD        │
│ sRPE 450 | 62nd %ile│
│                     │
├─────────────────────┤
│ 7-DAY TREND         │
│     ╱╲              │
│    ╱  ╲             │
│   ╱    ╲            │
│  ╱      ╲____       │
│                     │
├─────────────────────┤
│ PENDING             │
│ ┌─────────────────┐ │
│ │ 📝 Evening RPE  │ │
│ │ Tap to complete →│ │
│ └─────────────────┘ │
│                     │
├─────────────────────┤
│ 🏠  💪  📊  💬  👤  │ ← 64px
└─────────────────────┘
```

**Detailed Specs:**

**Status Bar:** System native (time, battery, signal)

**Header:**
- Padding: 16px horizontal, 20px vertical
- "Good Morning," + First name: H2 (22px SemiBold)
- Date: Body (14px, Neutral 500)

**Readiness Hero Card:**
- Full width minus 32px margins (16px each side)
- Height: 200px
- Border-radius: 16px
- Background: Gradient linear 180deg
  - Top: Yellow 500 at 10% opacity
  - Bottom: White
- Shadow: Shadow/Level 2
- Content centered vertically and horizontally
- "READINESS": Overline (11px, Neutral 500, uppercase, letter-spacing 0.05em)
- Score: 48px Bold, Yellow 800
- Progress bar: 120px wide, 4px height, 2px radius
  - Background: Neutral 200
  - Fill: Yellow 500, 72% width
- Zone label: 14px SemiBold, Yellow 800, uppercase
- Guidance text: 14px Regular, Neutral 700, 80% width, centered, 2 lines max

**Wellness Cards (Horizontal Scroll):**
- Section header: H3 (18px SemiBold), padding 16px horizontal, 8px top
- Scroll container: Full width, overflow-x scroll, scrollbar hidden
- Card: 100px × 80px, 12px radius, Level 1 shadow, margin-left 16px (first), 8px gap
- Content:
  - Icon/Emoji: 24px, centered top, margin-top 12px
  - Score: 18px Bold, centered
  - Label: 12px Medium, Neutral 500, centered bottom, margin-bottom 8px
- Colors per dimension:
  - Fatigue: Amber tint bg, Amber score
  - Sleep: Teal tint bg, Teal score
  - Soreness: Red tint bg, Red score
  - Mood: Purple tint bg, Purple score
  - Stress: Coral tint bg, Coral score

**Recovery Section:**
- Padding: 16px
- Header: H3 + right-aligned sparkline mini (40px wide)
- Metrics: Inline, Icon 16px + value (14px SemiBold) + label (12px)
- Progress bar: Full width, 8px height, 4px radius
  - Fill color: Teal 500
  - Track: Neutral 200

**Today's Load:**
- Padding: 16px
- H3 header
- Inline metrics: sRPE value (H2, 22px) + divider + percentile (Body, 14px, Neutral 500)

**7-Day Trend:**
- Padding: 16px
- H3 header
- Chart area: Full width minus 32px, height 120px
- SVG area chart: Stroke 2px Primary 400, fill Primary 300 at 20% opacity
- X-axis: 7 day labels (Caption, 11px, Neutral 500)
- Y-axis: Hidden (sparkline style)

**Pending Survey Card:**
- Full width minus 32px margins
- Height: 64px
- Background: Primary 100
- Border: 1px Primary 300
- Border-radius: 12px
- Left: Icon 24px (Primary 500)
- Center: Title (H4, 16px SemiBold) + Subtitle (Body Small, 13px, Primary 600)
- Right: ChevronRight icon 16px (Primary 500)
- Active state: Scale 0.98 on press, Background Primary 200

**Bottom Navigation (64px + safe area):**
- Background: White
- Border-top: 1px Neutral 200
- 5 tabs, equal width (20% each)
- Each tab: Icon 24px + Label 11px, centered vertically
- Active: Primary 500 icon + text + top indicator line (2px, Primary 500)
- Inactive: Neutral 500

**Floating Action Button (FAB):**
- Position: Fixed, bottom 80px (above nav), right 16px
- Size: 48px circle
- Background: Primary 500
- Icon: Plus 24px, White
- Shadow: Shadow/Level 3
- Press: Scale 0.95, Primary 600 bg

---

### FRAME 04: Wellness Survey Flow — Mobile
**Frame Size:** 375 × 812
**Background:** White

```
┌─────────────────────┐
│ ←  Morning Check-In │
├─────────────────────┤
│                     │
│  Question 1 of 6    │
│  ●○○○○○            │
│                     │
│  How fatigued       │
│  do you feel?       │
│                     │
│                     │
│      😫    😐    😄  │
│       1    5    10  │
│                     │
│  ━━━━━━━━━━━━━━━━━━ │ ← Slider
│  [==========]        │
│       6              │
│                     │
│                     │
│  ┌─────────────────┐│
│  │     Next        ││
│  └─────────────────┘│
│                     │
│  Estimated: 42s      │
└─────────────────────┘
```

**Detailed Specs:**

**Header:**
- Height: 56px
- Background: White
- Left: Back arrow icon 24px + Title "Morning Check-In" (H3, 18px)
- Bottom border: 1px Neutral 200

**Progress Indicator:**
- Padding: 24px top, 16px horizontal
- Text: "Question 1 of 6" (Caption, 12px, Neutral 500)
- Dots: 8px circles, 8px gap
  - Active/Completed: Primary 500 fill
  - Pending: Neutral 300 fill

**Question Area:**
- Padding: 32px horizontal, 48px top
- Question text: H1 (28px Bold), Neutral 900, centered
- Subtitle (if any): Body Large (16px), Neutral 500, centered, margin-top 8px

**Input Component — Slider (Fatigue):**
- Container: Full width minus 64px, centered
- Emoji scale: 😫 (1), 😕 (3), 😐 (5), 🙂 (7), 😄 (10)
  - Size: 32px each, 24px gap
  - Selected: Scale 1.2 + Primary 500 border ring 2px
  - Unselected: Neutral 300, opacity 0.6
- Slider track: Full width, 8px height, 4px radius
  - Track: Neutral 200
  - Fill: Gradient from Green 500 (left) to Red 500 (right)
  - Thumb: 24px circle, White, Shadow Level 2, Primary 500 border 2px
- Value display: 24px Bold, centered below slider, zone color
- Haptic feedback on thumb movement (vibrate on each integer)

**Input Component — Star Rating (Sleep Quality):**
- Stars: 5 items, 40px each, 8px gap
- Empty: Star icon, stroke Neutral 300, fill none
- Filled: Star icon, fill Yellow 500, stroke Yellow 600
- Half (if applicable): Clip-path mask
- Tap to set, tap again to change

**Input Component — Body Map (Soreness):**
- Body silhouette SVG: Centered, max-width 280px
- Tap zones: Predefined hotspots (neck, shoulders, back, hips, knees, ankles, etc.)
- Hotspot: 24px circle, Neutral 200 border, White fill
- Selected: Red 500 fill + pulse animation
- Severity popup: Bottom sheet, 1–10 slider per selected area
- Summary list: Scrollable chips below map

**Navigation Buttons:**
- "Next" button: Primary, Large, full width minus 32px, margin-top auto (bottom 24px)
- "Skip" (optional): Ghost button, centered above Next
- "Previous": Available via swipe right or back button

**Completion Screen:**
- Confetti animation (Lottie or CSS particles)
- Readiness hero card (as in Dashboard)
- "Great job! Your coaches have been notified."
- "Return to Dashboard" button

---

### FRAME 05: Athlete Profile — Desktop Slide-out
**Frame Size:** 1440 × 900 (with 480px slide-out overlay)
**Background:** Neutral 100 (main), White (slide-out)

```
┌────────────────────────────────────┬──────────────────────────┐
│                                    │  ATHLETE PROFILE        │
│  [Dashboard visible behind]       │  ────────────────────── │
│                                    │                         │
│                                    │  [Avatar 64px]          │
│                                    │  Marcus Eriksson        │
│                                    │  Midfielder | #8        │
│                                    │                         │
│                                    │  ┌───────────────────┐  │
│                                    │  │ READINESS    72   │  │
│                                    │  │ 🟡 Caution         │  │
│                                    │  └───────────────────┘  │
│                                    │                         │
│                                    │  TREND (7 Days)        │
│                                    │  [Line chart 200px]    │
│                                    │                         │
│                                    │  CURRENT INDICES        │
│                                    │  Wellness    62  ●●●  │
│                                    │  Fatigue     65  ●●●○  │
│                                    │  Recovery    78  ●●●●  │
│                                    │  Injury Risk 58  ●●●○  │
│                                    │  ACWR       1.25 ●●●○  │
│                                    │                         │
│                                    │  [Log Modification]    │
│                                    │  [Message Staff]       │
│                                    │  [View Full Profile]   │
│                                    │                         │
│                                    │  [✕ Close]             │
└────────────────────────────────────┴──────────────────────────┘
```

**Detailed Specs:**

**Slide-out Panel:**
- Width: 480px
- Height: 100vh
- Position: Fixed right
- Background: White
- Shadow: Shadow/Level 3 (left side only, or full)
- Animation: Slide in from right, 300ms ease-out
- Close: Swipe right on mobile, ✕ button top-right on desktop, click outside overlay

**Overlay:**
- Background: Neutral 900 at 40% opacity
- Click outside panel to close

**Content Padding:** 24px

**Header:**
- Avatar: 64px circle, border 3px Neutral 200
- Name: H2 (22px Bold)
- Details: Body (14px), Neutral 500, inline with bullet separator

**Readiness Card:**
- Full width, 120px height
- Background: Gradient zone color (10% opacity) to White
- Score: 32px Bold, zone color
- Zone badge: 24px pill

**Trend Chart:**
- Height: 200px
- Multi-line: Readiness (Primary), Wellness (Teal), Fatigue (Amber)
- Legend: Bottom, inline, Caption size

**Indices List:**
- Each row: 44px height
- Label: Body (14px), Neutral 700
- Score: H4 (16px SemiBold), left-aligned right column
- Mini bar: 60px wide, 4px height, zone color fill

**Action Buttons:**
- Stack: Full width, 48px height each
- Primary: "Log Modification"
- Secondary: "Message Staff"
- Ghost: "View Full Profile"
- Margin: 8px between buttons

---

### FRAME 06: Injury Case Detail — Medical
**Frame Size:** 1440 × 900
**Background:** Neutral 100

```
┌─────────────────────────────────────────────────────────────┐
│ FIIM  [Cases] [Athletes] [Reports]              🔔 👤 ▼    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ← Back to Cases                                             │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ CASE #2026-084                    Status: 🟡 Active    │ │
│ │                                                         │ │
│ │ Athlete: Jens Eriksson | Defender | #4                 │ │
│ │ Reported: 15 July 2026, 08:30 by Dr. Henrik            │ │
│ │                                                         │ │
│ │ Injury: Right Hamstring Strain (Grade II)               │ │
│ │ Mechanism: Non-contact | Overuse                       │ │
│ │ Severity: Moderate | Est. Return: 14-21 days            │ │
│ │                                                         │ │
│ │ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐       │ │
│ │ │Overview │ │Diagnoses│ │Treatment│ │ RTP     │       │ │
│ │ │ (active)│ │         │ │ Notes   │ │         │       │ │
│ │ └─────────┘ └─────────┘ └─────────┘ └─────────┘       │ │
│ │                                                         │ │
│ │ TIMELINE                                                │ │
│ │ ●───●───●────●────●───○                               │ │
│ │ Reported Diagnosed  Treat1 Treat2 RTP1 RTP2 Cleared    │ │
│ │ 15/7   15/7    16/7   17/7   18/7  20/7  25/7         │ │
│ │                                                         │ │
│ │ CURRENT RTP STAGE                                       │ │
│ │ Stage 2: Light Running                                 │ │
│ │ [✓] Pain-free walking > 30min                         │ │
│ │ [✓] Hamstring strength > 80% LSI                       │ │
│ │ [ ] Pain-free jogging > 10min                           │ │
│ │ [ ] Sprint mechanics normalized                         │ │
│ │                                                         │ │
│ │ [Update Stage] [Request Clearance] [Add Treatment Note] │ │
│ │                                                         │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Detailed Specs:**

**Case Header Card:**
- Level 1, full width, padding 24px
- Top row: Case number (Caption, Neutral 500) + Status badge (right)
- Athlete: Avatar 40px + Name (H2) + Details (Body, Neutral 500)
- Injury: H3 (18px SemiBold, Red 700)
- Meta: Inline pills — Mechanism, Type, Severity, Est. Return
- Tab Navigation: Horizontal, 4 tabs, 48px height each
  - Active: Primary 500 text + bottom border 2px Primary 500
  - Inactive: Neutral 500
  - Background: Neutral 50

**Timeline:**
- Vertical or horizontal (as shown)
- Dots: 12px circles
  - Completed: Primary 500 fill
  - Current: Primary 500 fill + ring 3px Primary 300
  - Pending: Neutral 300 fill
- Connecting line: 2px, Neutral 200 (completed sections Primary 300)
- Labels: Caption, 12px, below dots

**RTP Stage:**
- Stage title: H3 (18px SemiBold)
- Criteria list: Checkbox items
  - Checked: Green 500 checkmark + Green 700 text
  - Unchecked: Neutral 300 empty box + Neutral 700 text
- Progress: "2 of 4 criteria met" (Caption)

**Action Buttons:**
- Horizontal stack, gap 12px
- "Update Stage": Primary, Medium
- "Request Clearance": Secondary, Medium
- "Add Treatment Note": Ghost, Medium

---

### FRAME 07: Sport Scientist — Algorithm Configuration
**Frame Size:** 1440 × 900
**Background:** Neutral 100

```
┌─────────────────────────────────────────────────────────────┐
│ FIIM  [Dashboard] [Data] [Calculations] [Reports]   🔔 👤 ▼ │
├──────────────┬────────────────────────────────────────────┤
│              │                                              │
│  CALCULATION │  Injury Risk Index v2.1.0                  │
│  CONFIGS     │  [Active] [Clone] [A/B Test] [Deploy]      │
│              │                                              │
│  ┌────────┐  │  ┌────────────────────────────────────────┐  │
│  │Injury  │  │  │ PARAMETERS                             │  │
│  │Risk    │  │  │                                        │  │
│  │ v2.1.0 │  │  │ ACWR Weight        [====●====]  25%    │  │
│  │ [Active]│  │  │ Wellness Weight    [====●====]  25%    │  │
│  ├────────┤  │  │ Recovery Weight    [===●=====]  20%    │  │
│  │Readiness│  │  │ Movement Weight    [==●======]  15%    │  │
│  │ v1.8.0 │  │  │ Sleep Weight       [●=========]  10%    │  │
│  │        │  │  │ History Weight     [●=========]  5%     │  │
│  ├────────┤  │  │ ─────────────────────────────────────  │  │
│  │Fatigue │  │  │ THRESHOLDS                             │  │
│  │ v1.5.0 │  │  │ Green Zone:   < 30                     │  │
│  │        │  │  │ Yellow Zone:  30 – 50                  │  │
│  ├────────┤  │  │ Red Zone:     50 – 75                  │  │
│  │Recovery│  │  │ Crimson Zone: > 75                     │  │
│  │ v1.2.0 │  │  │                                        │  │
│  └────────┘  │  │ FORMULA                                │  │
│              │  │  │ IRI = Σ(Normalized_Var × Weight)     │  │
│              │  │  │ × Interaction_Multipier              │  │
│              │  │  │                                      │  │
│              │  │  │ [View Full Documentation]              │  │
│              │  │  └────────────────────────────────────────┘  │
│              │                                              │
│              │  ┌────────────────────────────────────────┐  │
│              │  │ LIVE PREVIEW                           │  │
│              │  │                                        │  │
│              │  │ Run on: [Last Season ▼]                │  │
│              │  │                                        │  │
│              │  │ Sensitivity:     72%                   │  │
│              │  │ Specificity:     68%                   │  │
│              │  │ AUC-ROC:         0.74                  │  │
│              │  │ Flagged Athletes: 47 (12.3%)           │  │
│              │  │ True Positives:  23                    │  │
│              │  │ False Positives: 24                    │  │
│              │  │                                        │  │
│              │  │ [Run Simulation] [Export Results]      │  │
│              │  └────────────────────────────────────────┘  │
│              │                                              │
└──────────────┴────────────────────────────────────────────┘
```

**Detailed Specs:**

**Left Panel (280px):**
- Background: Neutral 50
- Header: H3 "Calculation Configs", padding 16px
- Config list: Vertical stack
  - Each item: 64px height, padding 12px 16px
  - Name: H4 (14px SemiBold)
  - Version: Caption (12px, Neutral 500)
  - Status badge: 16px pill, right-aligned
  - Active item: Left border 3px Primary 500, Neutral 100 bg
  - Hover: Neutral 100 bg

**Main Header:**
- Config name: H1 (28px Bold)
- Status chip: 24px pill, Green 100 + Green 700 text
- Action buttons: Horizontal stack, gap 8px, right-aligned
  - "Clone": Secondary, Small
  - "A/B Test": Secondary, Small
  - "Deploy": Primary, Small (disabled if active)

**Parameters Panel:**
- Card: Level 1, padding 24px
- Section header: H3 + divider
- Slider component:
  - Track: Full width, 6px height, 3px radius, Neutral 200 bg
  - Fill: Primary 500, percentage width
  - Thumb: 20px circle, White, Shadow Level 2
  - Label: Left (parameter name, Body 14px) + Right (percentage, H4 16px SemiBold)
  - Value validation: Weights must sum to 100% (shown at bottom)

**Thresholds:**
- Input row: Label (Body) + Number input (48px, 8px radius) + Zone color dot
- Validation: No overlap, sequential

**Live Preview Panel:**
- Card: Level 1, padding 24px
- Metrics: 2-column grid, gap 16px
  - Each: Label (Caption) + Value (H2, 22px)
- "Run Simulation": Primary, Medium
- "Export Results": Secondary, Medium

---

### FRAME 08: Data Import — Upload & Mapping
**Frame Size:** 1440 × 900
**Background:** Neutral 100

```
┌─────────────────────────────────────────────────────────────┐
│ FIIM  [Dashboard] [Athletes] [Import] [Reports]    🔔 👤 ▼  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  DATA IMPORT                                                │
│  Upload and process athlete data from CSV or GPS files      │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                                                         │ │
│  │              ┌─────────────────────┐                    │ │
│  │              │                     │                    │ │
│  │              │    📤 UPLOAD        │                    │ │
│  │              │                     │                    │ │
│  │              │  Drag files here or   │                    │ │
│  │              │  click to browse      │                    │ │
│  │              │                     │                    │ │
│  │              │  Supported: CSV,    │                    │ │
│  │              │  Excel, FIT, GPX    │                    │ │
│  │              │                     │                    │ │
│  │              │  [Select Files]     │                    │ │
│  │              │                     │                    │ │
│  │              └─────────────────────┘                    │ │
│  │                                                         │ │
│  │  Recent Uploads                                         │ │
│  │  ┌─────────────────────────────────────────────────┐   │ │
│  │  │ File          │ Type │ Rows │ Status   │ Action │   │ │
│  │  │───────────────┼──────┼──────┼──────────┼────────│   │ │
│  │  │ session_15jul │ CSV  │ 24   │ ✅ Done  │ View   │   │ │
│  │  │ gps_morning   │ GPX  │ 1    │ 🔄 75%   │ Pause  │   │ │
│  │  │ wellness_week2│ CSV  │ 168  │ ⚠️ Partial│ Review │   │ │
│  │  └─────────────────────────────────────────────────┘   │ │
│  │                                                         │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Detailed Specs:**

**Upload Zone:**
- Dashed border: 2px Neutral 300, 12px radius
- Size: 400px × 240px, centered
- Background: Neutral 50 on hover (drag over)
- Icon: UploadCloud 48px, Neutral 400
- Title: H3, Neutral 700
- Subtitle: Body, Neutral 500
- Button: Secondary, Medium

**Mapping Modal (post-upload):**
- Modal: 800px wide, Level 3 shadow
- Header: "Map CSV Columns" (H2)
- Table:
  - CSV Column (read-only) | Detected Type | FIIM Field | Required | Sample Data
  - Dropdown for FIIM Field mapping
  - Green check if auto-matched
  - Yellow warning if manual mapping needed
- "Auto-Detect" button: Runs header fuzzy matching
- "Import" button: Primary, disabled until all required fields mapped

---

### FRAME 09: Report Generation & Preview
**Frame Size:** 1440 × 900
**Background:** Neutral 100

```
┌─────────────────────────────────────────────────────────────┐
│ FIIM  [Dashboard] [Templates] [Instances] [Schedules] 🔔 👤 ▼│
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  WEEKLY MONITORING REPORT                                   │
│  Generated: 15 July 2026, 08:15 by Dr. Arjun               │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ PREVIEW (PDF)                                           │ │
│  │                                                         │ │
│  │ ┌─────────────────────────────────────────────────────┐ │ │
│  │ │ [FIIM Logo]                      Weekly Report      │ │ │
│  │ │                                     8-15 July 2026 │ │ │
│  │ │                                                     │ │ │
│  │ │ Team: Men's First Team                              │ │ │
│  │ │                                                     │ │ │
│  │ │ SUMMARY                                             │ │ │
│  │ │ • 24 athletes monitored                             │ │ │
│  │ │ • 2 high-risk athletes flagged                      │ │ │
│  │ │ • 94% wellness compliance                             │ │ │
│  │ │ • 1 active injury case                              │ │ │
│  │ │                                                     │ │ │
│  │ │ [Charts continue...]                                │ │ │
│  │ └─────────────────────────────────────────────────────┘ │ │
│  │                                                         │ │
│  │                                                         │ │
│  │ ┌─────────────────┐ ┌─────────────────┐ ┌───────────┐ │ │
│  │ │ 📥 Download PDF │ │ 📥 Download CSV │ │ 📧 Email  │ │ │
│  │ └─────────────────┘ └─────────────────┘ └───────────┘ │ │
│  │                                                         │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Detailed Specs:**

**Preview Panel:**
- Card: Level 1, padding 24px
- PDF iframe or canvas render: A4 aspect ratio, 800px wide
- Page shadow: 0 4px 12px rgba(0,0,0,0.15) (paper effect)
- Navigation: Previous/Next page arrows (bottom center)

**Action Bar:**
- Horizontal stack, gap 12px, centered
- "Download PDF": Primary, Medium, Download icon
- "Download CSV": Secondary, Medium
- "Email": Secondary, Medium, Mail icon
- "Schedule This Report": Ghost, Medium

---

## 4. Component Variants (Figma Component Properties)

### Button Variants
```
Button/
├── Variant: Primary / Secondary / Danger / Ghost / Icon
├── Size: Small / Medium / Large
├── State: Default / Hover / Pressed / Disabled / Loading
├── Icon: None / Left / Right / Only
└── Width: Auto / Full
```

### Card Variants
```
Card/
├── Elevation: Level 0 / Level 1 / Level 2 / Level 3
├── Padding: Compact (16px) / Default (24px) / Spacious (32px)
├── Radius: Small (8px) / Default (12px) / Large (16px)
└── Header: None / Title / Title + Action / Title + Subtitle
```

### Risk Badge Variants
```
RiskBadge/
├── Zone: Green / Yellow / Amber / Red / Crimson
├── Size: Small (20px) / Default (24px) / Large (32px)
├── Style: Pill / Flag / Dot
└── Icon: True / False
```

### Input Variants
```
Input/
├── Type: Text / Number / Select / Date / Textarea / Search
├── Size: Small (32px) / Default (40px) / Large (48px)
├── State: Default / Hover / Focus / Error / Disabled
├── Icon: None / Left / Right / Both
└── Label: True / False
```

---

## 5. Auto-Layout Specifications (Figma)

### 5.1 Dashboard Widget Card
```
Auto Layout: Vertical
├── Direction: Top to Bottom
├── Padding: 24px
├── Gap: 16px
├── Alignment: Left
├── Fill: Hug Contents (Width: Fill Container)
└── Children:
    ├── Header Row (Horizontal, Space Between)
    │   ├── Title (H3)
    │   └── Action Icon (24px)
    ├── Content Area (Vertical, Hug)
    │   └── [Chart / Table / Metrics]
    └── Footer (Horizontal, optional)
        └── Meta text (Caption)
```

### 5.2 Team Readiness Row
```
Auto Layout: Horizontal
├── Direction: Left to Right
├── Padding: 12px 16px
├── Gap: 16px
├── Alignment: Center
├── Fill: Fill Container
├── Background: Conditional (Risk zone 5% tint)
└── Children:
    ├── Athlete Cell (Horizontal, Hug)
    │   ├── Avatar (32px)
    │   └── Name Stack (Vertical)
    ├── Metrics (Horizontal, Fixed widths)
    │   ├── Readiness (80px, Center)
    │   ├── Risk (80px, Center)
    │   ├── ACWR (60px, Center)
    │   └── ...
    └── Actions (Hug)
        └── ⋯ Icon Button
```

### 5.3 Mobile Survey Question
```
Auto Layout: Vertical
├── Direction: Top to Bottom
├── Padding: 32px
├── Gap: 24px
├── Alignment: Center
├── Fill: Fill Container
└── Children:
    ├── Progress Dots (Horizontal, Center, Gap 8px)
    ├── Question Text (H1, Center, Max 90% width)
    ├── Input Component (Center, Width: Fill - 64px)
    └── Button Area (Vertical, Bottom)
        ├── Next Button (Primary, Full width)
        └── Skip Link (Ghost, Center)
```

---

## 6. Asset Export Specifications

### 6.1 Icons
- **Format:** SVG (vector, scalable)
- **Library:** Lucide React or Heroicons
- **Size:** 12px, 16px, 20px, 24px, 32px
- **Stroke:** 1.5px (consistent)
- **Color:** Inherit from CSS (currentColor)

### 6.2 Illustrations (Empty States)
- **Format:** SVG or Lottie JSON
- **Style:** Line art, 2px stroke, Neutral 500 color
- **Size:** 120px × 120px (empty state), 240px × 240px (error state)
- **Animation:** Subtle floating (±4px translateY, 3s, infinite)

### 6.3 Avatars
- **Format:** WebP with JPG fallback
- **Size:** 64px, 128px, 256px (srcset)
- **Shape:** Circle (border-radius 50%)
- **Fallback:** Initials in Neutral 100 circle (e.g., "ME" for Marcus Eriksson)

### 6.4 Charts
- **Format:** SVG (inline) or Canvas
- **Resolution:** 2x for retina displays
- **Colors:** Use design token variables
- **Accessibility:** Data tables as `<title>` + `<desc>` in SVG, or hidden table markup

---

## 7. Developer Handoff Checklist

### Per Frame
- [ ] Frame name follows naming convention (e.g., `01 - Desktop - Login`)
- [ ] Frame is pinned to correct breakpoint size
- [ ] All layers use design tokens (not hard-coded values)
- [ ] Auto-layout is applied correctly
- [ ] Component instances (not detached) used for repeated elements
- [ ] Variants are defined for interactive states
- [ ] Prototype connections link screens in user flow
- [ ] Annotations explain complex interactions
- [ ] Export settings defined for raster assets
- [ ] Dev mode enabled with CSS/code snippets

### Global
- [ ] Design tokens documented in separate page
- [ ] Component library published and organized
- [ ] Dark mode frames present for all key screens
- [ ] Responsive variants shown (mobile/tablet/desktop)
- [ ] Accessibility annotations (contrast, ARIA, tab order)
- [ ] User flow prototype walkthrough recorded
- [ ] Version history notes added for major changes

---

*End of Figma-Ready Mockup Description*

**Document Version:** 1.0  
**Status:** Complete  
**Date:** 08 July 2026  
**Total Frames Specified:** 9 key frames with pixel-perfect details  
**Figma Structure:** 6 pages, 45+ components, full token library
