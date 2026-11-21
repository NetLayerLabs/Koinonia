# Koinonia design system — "the missal"

Koinonia is used inside churches, so it borrows its look from the book on the altar: the **missal**. Missals are printed in two inks on paper. What is said aloud is in black; instructions and labels (the *rubrics*) are in red. Everything here follows from that.

The aim is a calm, printed, typographic look. Avoid anything that reads as a generic AI template.

## Never

- **Shapes:** no rounded-2xl or rounded-3xl cards, no drop shadows, no glass or backdrop-blur panels.
- **Colour:** no gradient blobs, no gradient text, no glowing badges.
- **Emoji and flags:** no emoji anywhere (📍🎓🗓️🔒🤝🎉⚠️✓✕ and the rest). Use the icons in `src/components/brand/Icons.tsx`, lucide for plain controls, or words. Never use flags for languages; use `<LangMark code="ar" />`.
- **Old colours:** none of `#FAF7F2`, `#16181D`, `#C86D51`, `#2E5A44`, `#D4AF37`, `emerald-*`, `amber-*`, `stone-*` or `bg-sacred-gradient`. Use the tokens below.
- **Letter-spaced uppercase:** no `font-mono` + `uppercase` + `tracking` labels. Labels are rubrics (small caps), not shouting.
- **Unearned claims:** no "AI-powered", "seamless", "revolutionary", or made-up numbers, and no claims the code doesn't back up, such as integrations that don't exist.

## Colour tokens (Tailwind classes)

| Token | Use |
|---|---|
| `paper` | page background (body already has it, with a faint fibre texture) |
| `vellum` | panels ("leaves") |
| `parchment` | insets, hover, quoted text |
| `rule`, `rule-strong` | hairlines and borders |
| `ink`, `ink-2`, `ink-3` | text: primary, secondary, muted |
| `rubric`, `rubric-deep`, `rubric-wash` | the second ink: labels, active state, primary call to action, links |
| `gold`, `gold-wash` | rare emphasis (sample-data notices, "illumination") |
| `vine`, `vine-wash` | approved / safe / done |
| `alarm`, `alarm-wash` | crisis only, nothing else |
| `nave`, `nave-2`, `nave-3` | dark surfaces: the staff top bar, phone frames, the occasional dark leaf |

Examples: `bg-vellum`, `text-ink-2`, `border-rule`, `bg-rubric-wash`, `text-rubric`.

## Type

| Class | Font | Use |
|---|---|---|
| `font-serif` | Alegreya | headings, quoted text, Bible passages, prose (`prose-missal`) |
| `font-sans` (default) | Alegreya Sans | interface text |
| `font-sc` | Alegreya Sans SC | small caps; the `.rubric` class sets this up |
| `font-mono` | IBM Plex Mono | pickup codes, redaction tokens, URLs only |

Headings are serif, weight 500, never bold-black. Sizes are generous with tight leading (e.g. `text-4xl leading-[1.05]`).

## Component classes (in `src/index.css`)

| Class | What it is |
|---|---|
| `.rubric` | small-caps red label, e.g. `<p className="rubric">The request</p>`; `.rubric-ink` is the grey version |
| `.leaf` | the basic panel: vellum, 1px rule border, 3px radius, no shadow; pad it with `p-5` or `p-6` |
| `.inset` | parchment block inside a leaf |
| `.rule`, `.double-rule` | a hairline, or a printed double rule, as a top border |
| `.btn` | button; add a variant: `btn-ink`, `btn-rubric` (main call to action), `btn-vine` (approve), `btn-alarm` (crisis actions only), `btn-outline`, `btn-ghost`; sizes `btn-sm`, `btn-lg` |
| `.field` | text inputs, selects, textareas |
| `.tag` | small-caps chip; variants `tag-rubric`, `tag-vine`, `tag-gold`, `tag-alarm` |
| `.vr-mark` | the ℣ (versicle) and ℟ (response) marks. Use ℣ before an attendee's request and ℟ before the pastor's reply, e.g. `<span className="vr-mark">℣</span>` |
| `.drop-cap` | red illuminated initial; use at most once per screen |

## Brand components

- `src/components/brand/Logo.tsx`
  - `<VesicaMark />`: the mark alone.
  - `<Wordmark greek />`: the mark plus "Koinonia" and the Greek line.
  - `tone="light"` for dark backgrounds.
- `src/components/brand/Icons.tsx`
  - `IconPew`, `IconCare`, `IconBell`, `IconLectern`, `IconTable`, `IconPewCard`, `IconKey`, `IconScrub`, `IconLifebuoy`, `IconGlossary`, `IconInsights`, `IconSeal`, `IconBridge`, `IconRoundTrip`, `IconCrook`, `IconDoor`, `IconCandle`, `VesicaBullet`.
  - All take `className` (default `w-5 h-5`) and use `currentColor`.
- `src/components/brand/LangMark.tsx`: `<LangMark code active size />`, a tile showing the language in its own script (En, It, 中, ع, 한, Ук…).

## Layout

- Pages sit in `page-container`; top bars use `page-header-container`. Don't change these widths.
- Structure comes from rules and whitespace, not boxes inside boxes. A leaf may contain insets; avoid leaf-in-leaf.
- **Section headers:** a rubric line, then a serif heading, then a sentence of `text-ink-2`. Optionally put a red roman numeral (I, II, III) in a narrow left column, like an order of service.
- **Lists of items:** rows separated by `divide-y divide-rule`, not a stack of separate cards.
- **Status:**
  - Pending: `tag` or `tag-gold`.
  - Approved: `tag-vine` with `IconSeal`.
  - Crisis: `tag-alarm` with `IconLifebuoy`.
- **Selected state:**
  - In lists and tabs: a 2px rubric bar on the left (or underline for tabs) plus `bg-parchment`.
  - On buttons: `btn-ink`.

## Voice

Plain and warm. "A person approves every reply", not "Human-in-the-loop governance". Keep every claim true to what the code does. Sample data must stay labelled as sample.

## Phones (≤ 900px): the native-app pattern

On phones the app should feel like a native app, modelled on the HSL (Helsinki transport) app. Desktop keeps the sidebar.

- **Bottom tab bar.** Four or five items. Each has an icon above a small-caps label. The active item is in rubric with a 3px rubric bar at its top edge. Counts sit as small round badges on the icon: `alarm` for urgent, `ink` for waiting.
  - **Staff:** Today, Care, Live, Pew, More.
  - **Attendees:** Homily, Service, Prayer, More.
- **Top bar.** Slim, with the screen title centred in serif. The logo sits on the left and links to the landing page. On the staff app, the role avatar on the right opens More. The "Today" screen has no bar; it opens with a large greeting and a round avatar instead.
- **Info card.** A softly rounded (14px) card with a tint, a bold one-line title, one sentence, and two pill buttons: "Not now" (outline) and the action (filled rubric). Pills and the 14px radius are allowed only here, on Today cards and in the tab bar.
- **More screen.** Grouped full-width rows separated by grey gaps:
  - each row has a 28px rubric icon, a title in `rubric-deep` and a subtitle in `ink-2`;
  - the small links go at the bottom, centred.
  - **No chevrons or right arrows:** the user does not want right arrows on buttons.
- **Rules from `Mobile_View.md`:**
  - 16px inputs;
  - primary buttons at least 44px tall;
  - `pb-tabbar` on content so nothing hides behind the bar;
  - safe-area padding;
  - no horizontal scrolling at 390px;
  - wide tables use `table.scroll-x`.
