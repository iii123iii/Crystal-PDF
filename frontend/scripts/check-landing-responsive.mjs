// Optional browser check. Install Playwright without changing the lockfile:
// npm install --no-save --no-package-lock --legacy-peer-deps --ignore-scripts playwright
// Install its browser with: npx playwright install chromium
// Start Vite, then: node scripts/check-landing-responsive.mjs http://127.0.0.1:5173 ./screenshots
// Set BROWSER_CHANNEL=chrome to use an installed Chrome instead of Playwright Chromium.
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright'

const url = process.argv[2] || 'http://127.0.0.1:5173'
const output = process.argv[3]
if (output) await fs.mkdir(output, { recursive: true })
const browser = await chromium.launch({
  headless: true,
  ...(process.env.BROWSER_CHANNEL ? { channel: process.env.BROWSER_CHANNEL } : {}),
})
const checks = []
try {
  const page = await browser.newPage()
  for (const width of [320, 360, 375, 390, 414, 640, 768, 820, 1024, 1280, 1440, 1920]) {
    await page.setViewportSize({ width, height: width < 1024 ? 844 : 900 })
    await page.goto(url)
    await page.getByRole('heading', { level: 1 }).waitFor()
    for (const name of ['Get started', 'Sign in']) {
      assert.equal(await page.locator('nav').getByRole('link', { name, exact: true }).isVisible(), true)
    }
    await page.evaluate(() => document.fonts.ready)
    await page.addStyleTag({ content: '*, *::before, *::after { animation: none !important; transition: none !important; }' })
    const layout = await page.evaluate(() => {
      const bounds = element => element.getBoundingClientRect()
      const links = [...document.querySelectorAll('nav a')]
      const actions = links.slice(1).map(element => {
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT)
        const tops = new Set()
        while (walker.nextNode()) {
          if (!walker.currentNode.textContent.trim()) continue
          const range = document.createRange()
          range.selectNodeContents(walker.currentNode)
          for (const rect of range.getClientRects()) {
            if (rect.width && rect.height) tops.add(Math.round(rect.top))
          }
        }
        return { text: element.textContent.trim(), height: bounds(element).height, lines: tops.size }
      })
      const clipped = [...document.querySelectorAll('h1, h2, h3, p, a, .tool-card')].filter(element => {
        const rect = bounds(element)
        return rect.width > 0 && (rect.left < -1 || rect.right > innerWidth + 1 || element.scrollWidth > element.clientWidth + 1)
      }).map(element => element.textContent.trim())
      const rectangles = links.map(bounds)
      const overlap = rectangles.some((a, i) => rectangles.slice(i + 1).some(b =>
        Math.min(a.right, b.right) > Math.max(a.left, b.left) + 1 &&
        Math.min(a.bottom, b.bottom) > Math.max(a.top, b.top) + 1))
      return { viewport: innerWidth, scrollWidth: document.documentElement.scrollWidth, actions, clipped, overlap }
    })
    assert.ok(layout.scrollWidth <= width + 1, `horizontal scroll at ${width}`)
    assert.deepEqual(layout.clipped, [], `clipped content at ${width}`)
    assert.equal(layout.overlap, false, `overlapping navigation at ${width}`)
    for (const action of layout.actions) {
      assert.ok(action.lines <= 1, `wrapped nav label at ${width}: ${action.text}`)
      if (width < 640) assert.ok(action.height >= 44, `small touch target at ${width}`)
    }
    assert.equal(await page.locator('.tool-card').count(), 8)
    assert.equal(await page.locator('a[href="/register"]').count(), 3)
    assert.equal(await page.locator('a[href="/login"]').count(), 3)
    if (output) await page.screenshot({ path: path.join(output, `landing-${width}.png`), fullPage: true })
    checks.push({ width, passed: true })
  }
  await page.setViewportSize({ width: 320, height: 844 })
  await page.goto(url)
  await page.locator('nav').getByRole('link', { name: 'Get started', exact: true }).click()
  await page.waitForURL('**/register')
  await page.goto(url)
  await page.locator('nav').getByRole('link', { name: 'Sign in', exact: true }).click()
  await page.waitForURL('**/login')
  checks.push({ mobile_navigation_routes: 'passed' })
  console.log(JSON.stringify(checks, null, 2))
} finally {
  await browser.close()
}
