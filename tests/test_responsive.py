#!/usr/bin/env python3
"""Build/QA check for Crystal-PDF issue #3 (responsive landing page).

This is a static-analysis test that verifies the responsive.css stylesheet
actually contains the constructs required to make the landing page work on
mobile. It requires no third-party dependencies (stdlib only) and exits
non-zero if any check fails, so it can be wired into CI as a build gate.

Run:
    python3 tests/test_responsive.py
"""
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
CSS_PATH = os.path.join(HERE, "..", "css", "responsive.css")
TSX_PATH = os.path.join(HERE, "..", "src", "pages", "LandingPage.tsx")


def read_css() -> str:
    with open(CSS_PATH, "r", encoding="utf-8") as fh:
        return fh.read()


def read_tsx() -> str:
    with open(TSX_PATH, "r", encoding="utf-8") as fh:
        return fh.read()


def main() -> int:
    css = read_css()
    failures = []

    def check(name, condition):
        if condition:
            print(f"PASS  {name}")
        else:
            print(f"FAIL  {name}")
            failures.append(name)

    # 1. Viewport meta is documented / referenced.
    check(
        "references viewport meta for mobile",
        "width=device-width" in css,
    )

    # 2. box-sizing reset present (prevents overflow).
    check("box-sizing: border-box reset", "box-sizing: border-box" in css)

    # 3. overflow-x guard against horizontal scroll.
    check("overflow-x hidden guard", "overflow-x: hidden" in css)

    # 4. Fluid typography via clamp().
    check("fluid typography uses clamp()", css.count("clamp(") >= 2)

    # 5. Responsive images.
    check("responsive media max-width:100%", "max-width: 100%" in css)

    # 6. At least three min-width breakpoints (mobile-first).
    breakpoints = re.findall(r"@media\s*\(min-width:\s*(\d+)px\)", css)
    check(
        ">=3 min-width breakpoints",
        len(breakpoints) >= 3,
    )

    # 7. Touch target sizing (>=44px) for interactive elements.
    check(
        "touch targets >= 44px",
        bool(re.search(r"min-height:\s*(4[4-9]|[5-9]\d)px", css)),
    )

    # 8. Grid that collapses to a single column on mobile.
    check(
        "grid single-column base",
        "grid-template-columns: 1fr" in css,
    )

    # 9. Reduced-motion accessibility.
    check(
        "prefers-reduced-motion handled",
        "prefers-reduced-motion" in css,
    )

    # 10. No fixed pixel widths that would break small screens.
    fixed_widths = re.findall(r"(?<!max-)(?<!min-)width:\s*(\d{3,})px", css)
    check(
        "no rigid >=100px fixed widths",
        len(fixed_widths) == 0,
    )

    # 11. The actual React LandingPage.tsx is responsive too.
    tsx = read_tsx()
    check(
        "LandingPage.tsx uses responsive Tailwind breakpoints",
        bool(re.search(r"\b(sm|md|lg):", tsx)),
    )
    check(
        "LandingPage.tsx has fluid clamp() typography",
        "clamp(" in tsx,
    )
    check(
        "LandingPage.tsx guards horizontal overflow",
        "overflow-x-hidden" in tsx,
    )
    check(
        "LandingPage.tsx respects prefers-reduced-motion",
        "prefers-reduced-motion" in tsx,
    )
    check(
        "LandingPage.tsx tool grid collapses to 1 col on mobile",
        "grid-cols-1" in tsx,
    )

    print()
    if failures:
        print(f"{len(failures)} check(s) failed: {', '.join(failures)}")
        return 1
    print("All responsive checks passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())