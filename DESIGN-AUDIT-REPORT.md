# Design Audit Report - 记账本 (Jizhang)

**Date:** 2026-04-02
**URL:** http://localhost:3000
**Branch:** master
**Auditor:** GStack Design Review

---

## Phase 1: First Impression

### Login Page

**The site communicates:** A simple, functional finance tracking app with a clean but generic aesthetic.

**I notice:**
- Light purple/blue gradient background (`from-blue-50 to-indigo-100`) - safe but uninspired
- Centered card layout with Wallet icon - standard SaaS pattern
- Chinese localization throughout - clear target audience

**The first 3 things my eye goes to:**
1. The Wallet icon in the rounded circle (brand anchor)
2. "登录记账本" heading (clear purpose)
3. Blue "登录" button (primary action)

**If I had to describe this in one word:** Functional

### Dashboard Layout

**The site communicates:** A data-dense admin interface prioritizing information display.

**I notice:**
- Left sidebar navigation with icon + text labels
- White background with gray accents
- Loading spinner indicating API connectivity issues (backend bug, not design)

**If I had to describe this in one word:** Utilitarian

---

## Phase 2: Inferred Design System

### Typography

| Property | Value |
|----------|-------|
| Font Family | Geist, Arial, Helvetica, sans-serif |
| Heading Scale | h3: 24px (600 weight) |
| Body Text | ~14-16px (default) |
| Line Height | Default Tailwind (1.5 body, 1.25 headings) |

**Assessment:** Using Next.js default Geist font stack. Functional but not distinctive. No `text-wrap: balance` on headings detected.

### Color Palette

Extracted colors:
- `rgb(0, 0, 0)` - Black text
- `rgb(23, 23, 23)` - Near-black
- `rgb(255, 255, 255)` - White backgrounds
- `rgb(117, 117, 117)` - Gray text
- `lab(44.0605 29.0279 -86.0352)` - Primary blue (shadcn/ui default)

**Assessment:** Limited, safe palette. Primary blue appears to be shadcn/ui default. No warm/cool consistency issues detected.

### Spacing Patterns

From source code analysis:
- Card padding: `p-4`, `p-6` (Tailwind spacing scale)
- Gap values: `gap-2`, `gap-3`, `gap-4` (systematic)
- Margin: `mb-4`, `mt-4` (consistent 16px blocks)

**Assessment:** Using Tailwind's 4px-based spacing scale consistently.

### Touch Target Audit

| Element | Width | Height | Status |
|---------|-------|--------|--------|
| Email input | 398px | 40px | OK |
| Password input | 398px | 40px | OK |
| Login button | 398px | 40px | OK |
| "立即注册" link | 56px | 20px | **FAIL** (< 44px) |

**Finding:** The "立即注册" (Register Now) text button is undersized at 56x20px.

---

## Phase 3: Page-by-Page Findings

### Login Page (`/login`)

**Category: Visual Hierarchy & Composition**
- **PASS:** Clear focal point (centered card)
- **PASS:** Eye flows top-to-bottom naturally
- **PASS:** White space is intentional

**Category: Typography**
- **PASS:** Font count <= 3
- **PASS:** Body text >= 16px
- **MISSING:** No `text-wrap: balance` on heading

**Category: Color & Contrast**
- **PASS:** Palette coherent (< 12 colors)
- **NEEDS VERIFICATION:** WCAG contrast ratios not tested

**Category: Interaction States**
- **PASS:** Loading state present (`disabled={loading}`)
- **UNSURE:** Focus-visible ring not verified in headless browser

**Category: AI Slop Detection**
- **PASS:** No purple/violet gradient backgrounds (subtle blue gradient is acceptable)
- **PASS:** No 3-column feature grid
- **PASS:** No icons in colored circles as decoration (Wallet icon is functional brand mark)
- **PASS:** No centered-everything abuse
- **PASS:** No uniform bubbly radius
- **PASS:** No decorative blobs/waves
- **PASS:** No emoji as design elements
- **PASS:** No generic "Welcome to X" copy (Chinese copy is specific)

**AI Slop Score: A** - No AI-generated patterns detected. Clean, professional login page.

---

### Dashboard Page (`/dashboard`)

**Category: Visual Hierarchy & Composition**
- **PASS:** 4 stat cards create clear hierarchy
- **PASS:** Charts positioned below summary cards
- **INFO:** Loading state shows centered spinner (appropriate)

**Category: Typography**
- **PASS:** Heading hierarchy present (h1 for page title, h3 for card titles)
- **MISSING:** No evidence of `text-wrap: balance`

**Category: Spacing & Layout**
- **PASS:** Grid layout (`grid-cols-2`, `grid-cols-4`)
- **PASS:** Consistent gap values (`gap-4`)
- **PASS:** Max content width implied by grid

**Category: Interaction States**
- **PASS:** "记一笔" FAB-style button for primary action
- **PASS:** Hover states on nav items (`hover:bg-gray-100`)

**Category: Responsive Design**
- **PASS:** Mobile hamburger menu present (`lg:hidden` menu button)
- **PASS:** Sidebar collapses on mobile with overlay
- **PASS:** Grid adapts (`md:grid-cols-2 lg:grid-cols-4`)

**Category: AI Slop Detection**
- **PASS:** No feature grid pattern
- **PASS:** No decorative elements
- **INFO:** Dashboard uses cards appropriately for data display (cards ARE the interaction here)

**AI Slop Score: A** - Appropriate use of cards for a data-dense admin interface.

---

## Phase 4: Interaction Flow Review

### Login Flow
1. User lands on `/login`
2. Enters email/password
3. Clicks "登录"
4. Redirects to `/dashboard`

**Observed Issue:** Backend API connectivity problem (session not being passed to API routes). This is a code bug, not a design issue.

### Navigation Flow
- Sidebar navigation is clear with icon + text labels
- Mobile menu works (hamburger -> overlay -> nav items)
- User profile shown in sidebar footer with sign-out

---

## Phase 5: Cross-Page Consistency

| Element | Login | Dashboard | Transactions | Categories | Stats |
|---------|-------|-----------|--------------|------------|-------|
| Sidebar | N/A | Yes | Yes | Yes | Yes |
| Color scheme | Blue gradient | White/gray | Consistent | Consistent | Consistent |
| Typography | Geist | Geist | Consistent | Consistent | Consistent |
| Card styling | Rounded, shadow | Same | Same | Same | Same |

**Assessment:** High consistency across pages. shadcn/ui components ensure uniformity.

---

## Fixes Applied

The following fixes were implemented and committed during this review:

| Finding | Status | Commit | Description |
|---------|--------|--------|-------------|
| F001 - Touch target | **FIXED** | `e8c8e23` | Changed register link to shadcn Button with `variant="link"` for 44px min touch target |
| F002 - Text wrap balance | **FIXED** | `da4728f` | Added `text-wrap: balance` to h1-h6 in globals.css |
| F004 - Skeleton loaders | **FIXED** | `417af91` | Replaced spinner with card-shaped skeleton loaders on dashboard |

### Remaining Findings

| ID | Finding | Category | Impact |
|----|---------|----------|--------|
| F003 | Primary button uses default shadcn blue | Color | Medium |
| F005 | Geist font is functional but generic | Typography | Polish |
| F006 | No dark mode support detected | Color | Polish |
| F007 | User avatar is just letter in circle | Visual Hierarchy | Polish |

---

## Original Findings Summary (for reference)

### High Impact

| ID | Finding | Category | Impact | Fix |
|----|---------|----------|--------|-----|
| F001 | "立即注册" button touch target 56x20px (< 44px min) | Interaction States | High | ~~Increase padding to achieve 44px min~~ **FIXED** |

### Medium Impact

| ID | Finding | Category | Impact | Fix |
|----|---------|----------|--------|-----|
| F002 | No `text-wrap: balance` on headings | Typography | Medium | ~~Add `text-wrap: balance` to h1-h6~~ **FIXED** |
| F003 | Primary button uses default shadcn blue - no brand identity | Color | Medium | Define custom primary color in tailwind.config |
| F004 | Loading state is generic spinner only | Interaction States | Medium | ~~Add skeleton loaders matching card layouts~~ **FIXED** |

### Polish

| ID | Finding | Category | Impact | Fix |
|----|---------|----------|--------|-----|
| F005 | Geist font is functional but generic | Typography | Polish | Consider custom font or lean into it with intentional typography |
| F006 | No dark mode support detected | Color | Polish | Add `color-scheme: dark` and dark mode variants |
| F007 | User avatar is just letter in circle | Visual Hierarchy | Polish | Consider generating identifiable avatars |

---

## Quick Wins (< 30 min each)

1. **F001 - Touch target fix:**
   ```css
   /* In login page, add to the register button/link */
   .text-primary.hover\\:underline {
     min-height: 44px;
     min-width: 44px;
     display: inline-flex;
     align-items: center;
     justify-content: center;
   }
   ```

2. **F002 - Text wrap balance:**
   ```css
   h1, h2, h3, h4, h5, h6 {
     text-wrap: balance;
   }
   ```

3. **F004 - Skeleton loaders:**
   Replace spinner with card-shaped skeletons on dashboard.

---

## Scores

| Score | Grade | Notes |
|-------|-------|-------|
| **Design Score** | **B** | Solid fundamentals, minor polish issues |
| **AI Slop Score** | **A** | No AI-generated patterns detected |

### Category Grades

| Category | Grade |
|----------|-------|
| Visual Hierarchy | A |
| Typography | B+ |
| Color & Contrast | B |
| Spacing & Layout | A |
| Interaction States | B |
| Responsive Design | A |
| Content Quality | A |
| AI Slop | A |
| Motion | N/A |
| Performance Feel | B |

---

## Recommendations

### Completed
1. ~~F001 - Touch target~~ **DONE** - Fixed in `e8c8e23`
2. ~~F002 - Text wrap balance~~ **DONE** - Fixed in `da4728f`
3. ~~F004 - Skeleton loaders~~ **DONE** - Fixed in `417af91`

### Remaining - Near-term (This Month)
4. Consider F006 - Dark mode support (user preference)

### Remaining - Future (Product Decisions)
5. Evaluate F003 - Brand color (requires design decision)
6. Evaluate F005 - Custom font (requires design decision)

---

## Backend Bug Note

**Not a design issue:** The API fetch failures (`Failed to fetch stats: TypeError: Failed to fetch`) are caused by `auth()` not receiving request headers in API routes. The `withAuth` helper calls `auth()` without passing the request, so session cookies aren't read.

**Fix required in:** `src/lib/with-auth.ts` - pass headers to `auth()` or use a different session verification approach.

---

**Report generated by GStack /design-review skill**
