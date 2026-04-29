# Requirements Document

## Introduction

The VyntRise Next.js website already has dark mode infrastructure in place: a `.dark` class strategy via `@variant dark (&:where(.dark, .dark *))` in `globals.css`, a `ThemeProvider` that adds/removes the `.dark` class on `<html>`, and a `ThemeToggle` button in the Header. Dark mode is partially applied to the Header, Footer, Hero, and homepage (`app/page.tsx`).

This feature extends dark mode support to all remaining pages and components that currently lack dark mode styling, ensuring a consistent, visually coherent experience across the entire site when the dark theme is active.

## Glossary

- **Dark_Mode**: The visual state of the site when the `.dark` class is present on `<html>`, triggered by the ThemeProvider.
- **ThemeProvider**: The React context provider in `components/ThemeProvider.tsx` that manages and persists the active theme.
- **Dark_Variant**: A Tailwind CSS utility prefixed with `dark:` that applies only when the `.dark` class is active on an ancestor element.
- **Color_Mapping**: The defined set of light-to-dark color substitutions that must be applied consistently across all pages.
- **Page_Component**: Any file under `app/` that exports a default React component rendered as a route.
- **UI_Component**: Any file under `components/` that exports a reusable React component used across multiple pages.
- **CTA_Section**: A call-to-action section with a `bg-slate-900` background that is already visually appropriate in dark mode and requires no changes.
- **Card**: A bordered, rounded container element used to display grouped content (stats, team members, features, etc.).
- **Input_Field**: An `<input>` or `<textarea>` element used in forms.

---

## Requirements

### Requirement 1: Consistent Dark Mode Color Mapping

**User Story:** As a site visitor, I want all pages to use a consistent dark color palette when dark mode is active, so that the site feels cohesive and professionally designed regardless of which page I am on.

#### Acceptance Criteria

1. THE Dark_Mode SHALL map `bg-white` to `dark:bg-[#0d1117]` on all page wrapper and section elements.
2. THE Dark_Mode SHALL map `bg-slate-50`, `bg-slate-50/40`, and `bg-slate-50/60` to `dark:bg-[#161b22]` on all section and container elements.
3. THE Dark_Mode SHALL map `bg-slate-100` to `dark:bg-[#161b22]` on all elements using that background.
4. THE Dark_Mode SHALL map `border-slate-100` and `border-slate-200` to `dark:border-[#21262d]` on all bordered elements.
5. THE Dark_Mode SHALL map `text-slate-900` to `dark:text-white` on all heading and primary text elements.
6. THE Dark_Mode SHALL map `text-slate-700` to `dark:text-[#e6edf3]` on all secondary text elements.
7. THE Dark_Mode SHALL map `text-slate-600` to `dark:text-[#8b949e]` on all body and descriptive text elements.
8. THE Dark_Mode SHALL map `text-slate-500` and `text-slate-400` to `dark:text-[#8b949e]` on all muted text elements.
9. THE Dark_Mode SHALL leave CTA_Section elements with `bg-slate-900` unchanged, as they are already visually appropriate in dark mode.

---

### Requirement 2: Dark Mode for About Page

**User Story:** As a site visitor browsing the About page in dark mode, I want all sections, cards, and text to render with the correct dark palette, so that the page is readable and visually consistent.

#### Acceptance Criteria

1. WHEN Dark_Mode is active, THE About_Page SHALL apply `dark:bg-[#0d1117]` to the root page wrapper (`bg-white`).
2. WHEN Dark_Mode is active, THE About_Page SHALL apply `dark:bg-[#161b22]` and `dark:border-[#21262d]` to all section backgrounds using `bg-slate-50/40`.
3. WHEN Dark_Mode is active, THE About_Page SHALL apply `dark:bg-[#161b22]` and `dark:border-[#21262d]` to all Card elements using `bg-white` with `border-slate-200`.
4. WHEN Dark_Mode is active, THE About_Page SHALL apply `dark:text-white` to all headings using `text-slate-900`.
5. WHEN Dark_Mode is active, THE About_Page SHALL apply `dark:text-[#8b949e]` to all body text using `text-slate-500` or `text-slate-600`.
6. WHEN Dark_Mode is active, THE About_Page SHALL apply `dark:bg-[#161b22]` to the comparison table header row using `bg-slate-50`.
7. WHEN Dark_Mode is active, THE About_Page SHALL apply `dark:bg-[#161b22]` to the "We're hiring" card using `bg-slate-50/60`.
8. WHEN Dark_Mode is active, THE About_Page SHALL apply `dark:bg-[#161b22]` to team member tag badges using `bg-slate-100`.
9. WHEN Dark_Mode is active, THE About_Page SHALL apply `dark:text-[#e6edf3]` to team member tag text using `text-slate-600`.
10. WHEN Dark_Mode is active, THE About_Page SHALL apply `dark:bg-[#4B6CF7] dark:hover:bg-[#3d5ce0]` to primary CTA buttons using `bg-slate-900 hover:bg-slate-700`.

---

### Requirement 3: Dark Mode for Services Index Page

**User Story:** As a site visitor browsing the Services page in dark mode, I want the sidebar navigation, service detail cards, and all panels to render with the correct dark palette.

#### Acceptance Criteria

1. WHEN Dark_Mode is active, THE Services_Page SHALL apply `dark:bg-[#0d1117]` to the root page wrapper.
2. WHEN Dark_Mode is active, THE Services_Page SHALL apply `dark:bg-[#161b22]` and `dark:border-[#21262d]` to the header section using `bg-slate-50/40`.
3. WHEN Dark_Mode is active, THE Services_Page sidebar SHALL apply `dark:bg-[#161b22] dark:text-[#e6edf3]` to inactive navigation items using `text-slate-600 hover:bg-slate-100`.
4. WHEN Dark_Mode is active, THE Services_Page sidebar info card SHALL apply `dark:bg-[#161b22] dark:border-[#21262d]` to the "Not sure where to start?" card.
5. WHEN Dark_Mode is active, THE Services_Page main panel SHALL apply `dark:bg-[#161b22] dark:border-[#21262d]` to all Card elements.
6. WHEN Dark_Mode is active, THE Services_Page SHALL apply `dark:text-white` to all headings and `dark:text-[#8b949e]` to all descriptive text.
7. WHEN Dark_Mode is active, THE Services_Page testimonial card SHALL apply `dark:bg-[#161b22]` to the `bg-slate-50/60` background.
8. WHEN Dark_Mode is active, THE Services_Page CTA strip SHALL apply `dark:bg-[#161b22] dark:border-[#21262d]` to the bottom CTA card.
9. WHEN Dark_Mode is active, THE Services_Page SHALL apply `dark:bg-[#4B6CF7] dark:hover:bg-[#3d5ce0]` to primary action buttons using `bg-slate-900`.

---

### Requirement 4: Dark Mode for Individual Service Pages

**User Story:** As a site visitor viewing a specific service detail page in dark mode, I want all module cards, stat panels, testimonials, and metric bars to render correctly in the dark palette.

#### Acceptance Criteria

1. WHEN Dark_Mode is active, THE Service_Detail_Page SHALL apply `dark:bg-[#0d1117]` to the root page wrapper.
2. WHEN Dark_Mode is active, THE Service_Detail_Page header section SHALL apply `dark:bg-[#161b22] dark:border-[#21262d]` to the `bg-slate-50/40` background.
3. WHEN Dark_Mode is active, THE Service_Detail_Page stat cards SHALL apply `dark:bg-[#161b22] dark:border-[#21262d]` to each stat card using `bg-white border-slate-200`.
4. WHEN Dark_Mode is active, THE Service_Detail_Page testimonial section SHALL apply `dark:bg-[#161b22] dark:border-[#21262d]` to the `bg-slate-50/40` background.
5. WHEN Dark_Mode is active, THE Service_Detail_Page module cards SHALL apply `dark:bg-[#161b22] dark:border-[#21262d]` to each module card.
6. WHEN Dark_Mode is active, THE Service_Detail_Page module left panel SHALL apply `dark:border-[#21262d]` to the `border-slate-100` divider.
7. WHEN Dark_Mode is active, THE Service_Detail_Page module right panel SHALL apply `dark:bg-[#161b22]` to the `bg-slate-50/50` metrics panel.
8. WHEN Dark_Mode is active, THE Service_Detail_Page metric bars SHALL apply `dark:bg-[#21262d]` to the progress bar track using `bg-slate-200`.
9. WHEN Dark_Mode is active, THE Service_Detail_Page SHALL apply `dark:text-white` to all headings and `dark:text-[#8b949e]` to all body text.
10. WHEN Dark_Mode is active, THE Service_Detail_Page "Back to Services" link SHALL apply `dark:text-[#8b949e] dark:hover:text-white` to the `text-slate-500 hover:text-slate-900` link.
11. THE Service_Detail_Page requirement applies to all five service pages: AI Search, Intelligent Automation, Custom Software, Data Architecture, and Digital Marketing.

---

### Requirement 5: Dark Mode for Solutions Page

**User Story:** As a site visitor browsing the Solutions page in dark mode, I want the industry sidebar, detail panels, stats, and the all-industries grid to render with the correct dark palette.

#### Acceptance Criteria

1. WHEN Dark_Mode is active, THE Solutions_Page SHALL apply `dark:bg-[#0d1117]` to the root page wrapper.
2. WHEN Dark_Mode is active, THE Solutions_Page header section SHALL apply `dark:bg-[#161b22] dark:border-[#21262d]` to the `bg-slate-50/60` background.
3. WHEN Dark_Mode is active, THE Solutions_Page sidebar SHALL apply `dark:bg-[#161b22] dark:text-[#e6edf3]` to inactive navigation items.
4. WHEN Dark_Mode is active, THE Solutions_Page sidebar info card SHALL apply `dark:bg-[#161b22] dark:border-[#21262d]` to the `bg-slate-50` card.
5. WHEN Dark_Mode is active, THE Solutions_Page main panel header card SHALL apply `dark:bg-[#161b22] dark:border-[#21262d]` and `dark:text-white` to headings.
6. WHEN Dark_Mode is active, THE Solutions_Page stat cards SHALL apply `dark:bg-[#161b22] dark:border-[#21262d]` and `dark:text-white` to stat values.
7. WHEN Dark_Mode is active, THE Solutions_Page challenges and solutions cards SHALL apply `dark:bg-[#161b22] dark:border-[#21262d]` and `dark:text-[#8b949e]` to body text.
8. WHEN Dark_Mode is active, THE Solutions_Page all-industries section SHALL apply `dark:bg-[#161b22] dark:border-[#21262d]` to the `bg-slate-50/60` background and each industry card.

---

### Requirement 6: Dark Mode for Pricing Page

**User Story:** As a site visitor viewing the Pricing page in dark mode, I want the pricing cards, comparison table, FAQ accordion, and testimonials to render correctly in the dark palette.

#### Acceptance Criteria

1. WHEN Dark_Mode is active, THE Pricing_Page SHALL apply `dark:bg-[#0d1117]` to the root page wrapper.
2. WHEN Dark_Mode is active, THE Pricing_Page header section SHALL apply `dark:bg-[#161b22] dark:border-[#21262d]` to the `bg-slate-50/40` background.
3. WHEN Dark_Mode is active, THE Pricing_Page billing toggle SHALL apply `dark:bg-[#161b22] dark:border-[#21262d]` to the toggle container and `dark:text-[#8b949e]` to inactive labels.
4. WHEN Dark_Mode is active, THE Pricing_Page non-highlighted plan cards SHALL apply `dark:bg-[#161b22] dark:border-[#21262d]` and `dark:text-white` to plan names.
5. WHEN Dark_Mode is active, THE Pricing_Page testimonial section SHALL apply `dark:bg-[#161b22] dark:border-[#21262d]` to the `bg-slate-50/40` background and each testimonial card.
6. WHEN Dark_Mode is active, THE Pricing_Page comparison table SHALL apply `dark:bg-[#161b22]` to the table header and category rows using `bg-slate-50`.
7. WHEN Dark_Mode is active, THE Pricing_Page comparison table rows SHALL apply `dark:bg-[#0d1117]` to white rows and `dark:bg-[#161b22]` to alternating rows.
8. WHEN Dark_Mode is active, THE Pricing_Page FAQ section SHALL apply `dark:bg-[#161b22] dark:border-[#21262d]` to the section background and each accordion item.
9. WHEN Dark_Mode is active, THE Pricing_Page FAQ accordion buttons SHALL apply `dark:text-white` to question text and `dark:text-[#8b949e]` to chevron icons.
10. WHEN Dark_Mode is active, THE Pricing_Page FAQ answer text SHALL apply `dark:text-[#8b949e]`.

---

### Requirement 7: Dark Mode for Contact Page

**User Story:** As a site visitor using the Contact page in dark mode, I want the form, input fields, sidebar cards, and address block to render correctly in the dark palette.

#### Acceptance Criteria

1. WHEN Dark_Mode is active, THE Contact_Page SHALL apply `dark:bg-[#0d1117]` to the root page wrapper.
2. WHEN Dark_Mode is active, THE Contact_Page header section SHALL apply `dark:bg-[#161b22] dark:border-[#21262d]` to the `bg-slate-50/60` background.
3. WHEN Dark_Mode is active, THE Contact_Page form card SHALL apply `dark:bg-[#161b22] dark:border-[#21262d]` to the form container.
4. WHEN Dark_Mode is active, THE Contact_Page Input_Fields SHALL apply `dark:bg-[#161b22] dark:border-[#21262d] dark:text-white dark:placeholder:text-[#8b949e]` to all `<input>` and `<textarea>` elements.
5. WHEN Dark_Mode is active, THE Contact_Page intent chip buttons (inactive) SHALL apply `dark:border-[#21262d] dark:bg-[#161b22] dark:text-[#8b949e]` to unselected chips.
6. WHEN Dark_Mode is active, THE Contact_Page sidebar trust stat cards SHALL apply `dark:bg-[#161b22] dark:border-[#21262d]` to each stat card.
7. WHEN Dark_Mode is active, THE Contact_Page sidebar info cards SHALL apply `dark:bg-[#161b22] dark:border-[#21262d]` to the "What happens next", "Email us directly", and "Office address" cards.
8. WHEN Dark_Mode is active, THE Contact_Page business hours card SHALL apply `dark:bg-[#161b22] dark:border-[#21262d]` to the `bg-slate-50/60` card.
9. WHEN Dark_Mode is active, THE Contact_Page email list items SHALL apply `dark:hover:bg-[#161b22]` to hover states using `hover:bg-slate-50`.
10. WHEN Dark_Mode is active, THE Contact_Page form labels SHALL apply `dark:text-[#e6edf3]` to `text-slate-700` labels.

---

### Requirement 8: Dark Mode for FAQ Page

**User Story:** As a site visitor using the FAQ page in dark mode, I want the search input, category sidebar, accordion items, and all text to render correctly in the dark palette.

#### Acceptance Criteria

1. WHEN Dark_Mode is active, THE FAQ_Page SHALL apply `dark:bg-[#0d1117]` to the root page wrapper.
2. WHEN Dark_Mode is active, THE FAQ_Page header section SHALL apply `dark:bg-[#161b22] dark:border-[#21262d]` to the `bg-slate-50/60` background.
3. WHEN Dark_Mode is active, THE FAQ_Page search Input_Field SHALL apply `dark:bg-[#161b22] dark:border-[#21262d] dark:text-white dark:placeholder:text-[#8b949e]` to the search input.
4. WHEN Dark_Mode is active, THE FAQ_Page category sidebar buttons (inactive) SHALL apply `dark:text-[#8b949e] dark:hover:bg-[#161b22] dark:hover:text-white`.
5. WHEN Dark_Mode is active, THE FAQ_Page accordion items SHALL apply `dark:bg-[#161b22] dark:border-[#21262d]` to each FAQ card.
6. WHEN Dark_Mode is active, THE FAQ_Page accordion question buttons SHALL apply `dark:text-white` to question text.
7. WHEN Dark_Mode is active, THE FAQ_Page accordion answer text SHALL apply `dark:text-[#8b949e]`.
8. WHEN Dark_Mode is active, THE FAQ_Page empty state SHALL apply `dark:text-[#8b949e]` to the "No results found" message.

---

### Requirement 9: Dark Mode for Support Page

**User Story:** As a site visitor using the Support page in dark mode, I want the contact channel cards, system status table, SLA table, resource cards, and popular topics to render correctly in the dark palette.

#### Acceptance Criteria

1. WHEN Dark_Mode is active, THE Support_Page SHALL apply `dark:bg-[#0d1117]` to the root page wrapper.
2. WHEN Dark_Mode is active, THE Support_Page header section SHALL apply `dark:bg-[#161b22] dark:border-[#21262d]` to the `bg-slate-50/60` background.
3. WHEN Dark_Mode is active, THE Support_Page contact channel cards SHALL apply `dark:bg-[#161b22] dark:border-[#21262d]` and `dark:text-white` to card titles.
4. WHEN Dark_Mode is active, THE Support_Page system status section SHALL apply `dark:bg-[#161b22] dark:border-[#21262d]` to the `bg-slate-50/50` background and the status table container.
5. WHEN Dark_Mode is active, THE Support_Page status table rows SHALL apply `dark:border-[#21262d]` to row dividers using `border-slate-100`.
6. WHEN Dark_Mode is active, THE Support_Page SLA table SHALL apply `dark:bg-[#161b22]` to the header row using `bg-slate-50` and `dark:border-[#21262d]` to row dividers.
7. WHEN Dark_Mode is active, THE Support_Page resource cards SHALL apply `dark:bg-[#161b22] dark:border-[#21262d]` and `dark:hover:bg-[#161b22]` to each resource card.
8. WHEN Dark_Mode is active, THE Support_Page popular topics section SHALL apply `dark:bg-[#161b22] dark:border-[#21262d]` to the `bg-slate-50/50` background.
9. WHEN Dark_Mode is active, THE Support_Page popular topic links SHALL apply `dark:bg-[#161b22] dark:border-[#21262d] dark:text-[#e6edf3]` to each topic link.

---

### Requirement 10: Dark Mode for Not Found Page

**User Story:** As a site visitor landing on the 404 page in dark mode, I want the error message and navigation buttons to render correctly in the dark palette.

#### Acceptance Criteria

1. WHEN Dark_Mode is active, THE Not_Found_Page SHALL apply `dark:text-white` to the "Page not found" heading using `text-slate-900`.
2. WHEN Dark_Mode is active, THE Not_Found_Page SHALL apply `dark:text-[#8b949e]` to the descriptive paragraph using `text-slate-500`.
3. WHEN Dark_Mode is active, THE Not_Found_Page primary button SHALL apply `dark:bg-[#4B6CF7] dark:hover:bg-[#3d5ce0]` to the `bg-slate-900 hover:bg-slate-700` button.
4. WHEN Dark_Mode is active, THE Not_Found_Page secondary buttons SHALL apply `dark:bg-[#161b22] dark:border-[#21262d] dark:text-[#e6edf3]` to the `bg-white border-slate-200 text-slate-700` buttons.

---

### Requirement 11: Dark Mode for CookieBanner Component

**User Story:** As a site visitor who sees the cookie consent banner in dark mode, I want the banner to render with the correct dark palette so it remains readable and visually consistent with the rest of the site.

#### Acceptance Criteria

1. WHEN Dark_Mode is active, THE CookieBanner SHALL apply `dark:bg-[#161b22] dark:border-[#21262d]` to the banner container using `bg-white border-slate-200`.
2. WHEN Dark_Mode is active, THE CookieBanner SHALL apply `dark:text-white` to the "We use cookies" heading using `text-slate-900`.
3. WHEN Dark_Mode is active, THE CookieBanner SHALL apply `dark:text-[#8b949e]` to the description text using `text-slate-500`.
4. WHEN Dark_Mode is active, THE CookieBanner "Accept all" button SHALL apply `dark:bg-[#4B6CF7] dark:hover:bg-[#3d5ce0]` to the `bg-slate-900 hover:bg-slate-700` button.
5. WHEN Dark_Mode is active, THE CookieBanner "Reject all" and "Manage" buttons SHALL apply `dark:bg-[#161b22] dark:border-[#21262d] dark:text-[#e6edf3]` to the `bg-white border-slate-200 text-slate-700` buttons.
6. WHEN Dark_Mode is active, THE CookieBanner detailed view header SHALL apply `dark:border-[#21262d]` to the `border-slate-100` divider.
7. WHEN Dark_Mode is active, THE CookieBanner category icon containers SHALL apply `dark:bg-[#161b22] dark:border-[#21262d]` to the `bg-slate-50 border-slate-200` containers.
8. WHEN Dark_Mode is active, THE CookieBanner category labels SHALL apply `dark:text-white` to `text-slate-900` labels.
9. WHEN Dark_Mode is active, THE CookieBanner category descriptions SHALL apply `dark:text-[#8b949e]` to `text-slate-500` descriptions.
10. WHEN Dark_Mode is active, THE CookieBanner Toggle component SHALL apply `dark:bg-[#21262d]` to the unchecked track using `bg-slate-200`.
11. WHEN Dark_Mode is active, THE CookieBanner footer SHALL apply `dark:border-[#21262d]` to the `border-slate-100` divider.
12. WHEN Dark_Mode is active, THE CookieBanner "Save preferences" button SHALL apply `dark:bg-[#4B6CF7] dark:hover:bg-[#3d5ce0]` to the `bg-slate-900 hover:bg-slate-700` button.
13. WHEN Dark_Mode is active, THE CookieBanner "Accept all" secondary button SHALL apply `dark:bg-[#161b22] dark:border-[#21262d] dark:text-[#e6edf3]` to the `bg-white border-slate-200 text-slate-700` button.
