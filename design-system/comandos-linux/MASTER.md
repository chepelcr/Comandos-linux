# Comandos Linux design direction

Status: tailored planning specification, to be verified visually during implementation.

UI UX Pro Max is available in `.agents/skills/ui-ux-pro-max` and was queried for
an education platform and developer training dashboard. The first result targeted
children; the narrower retry supplied useful developer typography and dark surfaces,
but its documentation landing pattern and dark-only advice do not fit this project.
This specification uses relevant guidance with explicit product decisions rather
than persisting those recommendations as a verified complete design system.

## Product and layout

A welcoming Linux and Git course for students and beginning developers. Use a calm,
modern learning workspace with clear typography, generous spacing, restrained cards,
and a visible learning path. Playfulness belongs in achievement feedback, not in
body typography or navigation. Do not invent testimonials or learner statistics.

- Landing: concise value proposition, interactive terminal preview, course paths,
  learning outcomes, instructor introduction, and start/continue action.
- Dashboard: continue lesson, module progress, earned points, and recent achievements.
- Lesson: desktop course outline and readable content; optional adjacent practice panel.
- Mobile: collapsible outline, stacked reading/practice, full-width controls.
- Standard viewport checks: 375, 768, 1024, and 1440 CSS pixels.

## Tokens and typography

- IBM Plex Sans for interface and prose; JetBrains Mono for commands and terminal.
  Use local licensed font files with system fallbacks when implemented.
- Light: off-white page, white cards, slate text, indigo primary actions.
- Dark: deep slate page, raised slate cards, near-white text, lighter indigo actions.
- Green identifies successful completion alongside checkmarks and text.
- Define semantic CSS variables for surfaces, text, primary, success, warning,
  error, border, focus, shadows, spacing, radii, and motion in both themes.
- Use a 4/8px spacing rhythm, 16px minimum body text, 1.5–1.75 line height,
  and a reading measure around 65–75 characters on desktop.
- Theme options: light and dark. Save preferences and apply before first paint.
- Use one SVG icon family consistently. Validate every foreground/background pair.

## Motion and interaction

- Immediate input feedback (120–180ms). The user requested a slower pace: a sequential 260ms
  cover, hidden update (120ms hold, or a 140ms theme color change), and 420ms reveal
  for language/theme/pages. Preference persistence happens at the covered midpoint. Language/theme cover the
  entire viewport, including navigation. Language uses a left-to-right curtain;
  theme uses a circle centered on its toggle; page transitions retain the content fade.
  Drawers use 800ms and mobile navigation 650ms. Shared tokens keep timings consistent.
- Prefer opacity/transform, cancel obsolete animations, and keep input responsive.
- Brief checkmark and points feedback; reserve larger celebrations for module completion.
- Respect reduced motion; no required information or completion depends on animation.
- Provide focus rings, labels, skip navigation, keyboard operation, meaningful route
  focus, and status announcements. Include error, empty, loading, offline, and retry states.
- Terminal shortcuts apply only while the terminal is focused. Offer accessible
  plain-text output and visible controls for reset, hints, and mode selection.

## Component contract

Build shared primitives and feature components from the mapping in
`docs/implementation-plan.md`. Components render typed content and receive state
through explicit props/hooks. Course prose, commands, translations, and rewards
belong in versioned data files, not JSX conditionals.
