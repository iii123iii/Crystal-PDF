// Run against a production preview; install puppeteer-core separately and set NODE_PATH.
const assert = require('node:assert/strict')
const { mkdir } = require('node:fs/promises')
const puppeteer = require('puppeteer-core')

;(async () => {
  const browser = await puppeteer.launch({
    executablePath: process.env.CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  })
  const failures = []
  try {
    const page = await browser.newPage()
    // Keep the check local and deterministic; use the configured fallback fonts.
    await page.setRequestInterception(true)
    page.on('request', r => r.url().startsWith('http://127.0.0.1:') || r.url().startsWith('data:') ? r.continue() : r.abort())
    const base = process.env.LANDING_URL || 'http://127.0.0.1:4173'
    for (const width of [320, 360, 375, 390, 414, 640, 768, 820, 1024, 1440]) {
      await page.setViewport({ width, height: 900, isMobile: width < 640, hasTouch: width < 640 })
      await page.goto(base, { waitUntil: 'networkidle0' })
      await page.evaluate(() => {
        for (const a of document.getAnimations()) { if (a.effect.getTiming().iterations !== Infinity) a.finish() }
      })
      for (const scale of [1, 2]) {
        await page.evaluate(s => { document.documentElement.style.fontSize = `${16 * s}px` }, scale)
        for (const time of [0, 5000, 10000, 15000, 20000, 30000]) {
          await page.evaluate(t => {
            for (const a of document.getAnimations()) {
              if (a.effect.getTiming().iterations === Infinity) { a.pause(); a.currentTime = t }
            }
          }, time)
          const errors = await page.evaluate(() => {
            const errors = []
            if (document.documentElement.scrollWidth > innerWidth + 1) errors.push(`page overflows: ${document.documentElement.scrollWidth} > ${innerWidth}`)
            for (const a of document.querySelectorAll('a')) {
              const r = a.getBoundingClientRect()
              if (r.left < -1 || r.right > innerWidth + 1 || r.width < 44 || r.height < 44) errors.push(`link bounds/touch target: ${a.textContent.trim()} ${r.width}x${r.height}`)
              const range = document.createRange(); range.selectNodeContents(a)
              if (a.closest('nav') && range.getBoundingClientRect().height > parseFloat(getComputedStyle(a).lineHeight) * 1.5) errors.push(`wrapped nav label: ${a.textContent.trim()}`)
            }
            for (const p of document.querySelectorAll('.tool-card p')) {
              if (p.scrollWidth > p.clientWidth + 1) errors.push(`card text overflows: ${p.textContent}`)
            }
            return errors
          })
          for (const e of errors) failures.push(`${width}px text x${scale} animation ${time}: ${e}`)
        }
      }
      if (process.env.FAIL_FAST && failures.length) { failures.forEach(f => console.error(f)); assert.fail('baseline layout regression reproduced') }
      await page.evaluate(() => { document.documentElement.style.fontSize = '' })
      if (process.env.SCREENSHOT_DIR) {
        await mkdir(process.env.SCREENSHOT_DIR, { recursive: true })
        // Capture a fresh viewport so a prior 200% text layout cannot leave stale mobile metrics.
        const visual = await browser.newPage()
        await visual.setViewport({ width, height: 900 })
        await visual.setRequestInterception(true)
        visual.on('request', r => r.url().startsWith(base) || r.url().startsWith('data:') ? r.continue() : r.abort())
        await visual.goto(base, { waitUntil: 'networkidle0' })
        await visual.evaluate(() => { for (const a of document.getAnimations()) if (a.effect.getTiming().iterations !== Infinity) a.finish() })
        await visual.screenshot({ path: `${process.env.SCREENSHOT_DIR}/${width}.png`, fullPage: true })
        await visual.close()
      }
      const links = await page.$$eval('a', as => as.map(a => ({ text: a.textContent.trim(), path: a.getAttribute('href') })))
      assert.equal(links.length, 7, 'brand plus six auth links remain available')
      for (let i = 0; i < links.length; i++) {
        await page.goto(base, { waitUntil: 'networkidle0' })
        await page.evaluate(() => { for (const a of document.getAnimations()) if (a.effect.getTiming().iterations !== Infinity) a.finish() })
        const anchors = await page.$$('a')
        await anchors[i].evaluate(a => a.scrollIntoView({ block: 'center' }))
        await anchors[i].click()
        await page.waitForFunction(path => location.pathname === path, {}, links[i].path)
      }
      console.log(`${width}px: checked overflow, links, labels and card text at 100%/200% text across six animation phases; all seven navigation destinations checked`)
    }
    failures.forEach(f => console.error(f))
    assert.equal(failures.length, 0, `${failures.length} layout failures`)
  } finally { await browser.close() }
})().catch(e => { console.error(e); process.exitCode = 1 })
