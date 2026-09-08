# Landing page responsive verification

Compared unchanged main (`0df8ff5`) against this patch in Chromium, with both
versions served locally by Vite. Screenshots are full-page captures at 320, 768,
and 1440 pixels wide, with a 900-pixel viewport height. Entrance and decorative
rotation animations were disabled identically for stable captures.

At widths 320, 360, 375, 390, 414, 640, 768, 820, 1024, and 1440:

- The patched document has no horizontal overflow.
- All three navigation links remain inside the viewport and are at least 44px tall.
- Before/after screenshots at 320, 768, and 1440px are included here.

The original 320px header squeezes the authentication labels onto multiple
lines. The patch preserves each label on one line and lets the header wrap as
needed. Narrow tool cards now use one column below 360px and two columns until
the desktop breakpoint. The hero illustration no longer competes with the text
column on tablet widths.

Validation:

- `npm run build`: passes (existing bundle-size and Browserslist warnings).
- `npx eslint src/pages/LandingPage.tsx`: passes.
- `npm test`: 59 passed, 1 failed. The failing test is
  `src/lib/api.test.ts > apiFetch > passes options to fetch`, whose expected
  request omits `credentials: 'include'`.
- Ran that same API test on the separate unchanged-main worktree: the identical
  failure reproduces. This patch does not modify the API or its tests.

These checks cover the public landing page; they do not establish backend or
authenticated PDF processing behavior. This is an AI-assisted contribution.
