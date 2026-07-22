import { test, expect } from '@playwright/test'

// Regression coverage for the mobile-carousel bugs found and fixed in
// portals.html / portals_fiction.html: wrong isMobile detection, desktop
// math drifting when mobile code changed, panels/videos failing to load,
// and the story overlay auto-scrolling away from the top while typing.
//
// This does NOT catch real-device browser quirks (Safari/Chrome-iOS touch
// detection, video autoplay on a detached element) — those only showed up
// on an actual phone. Always confirm on a real iPhone before shipping.

const PAGES = [
  { path: '/portals.html', panelCount: 9, hasVideos: false },
  { path: '/portals_fiction.html', panelCount: 8, hasVideos: true },
]

const DESKTOP_VIEWPORT = { width: 1400, height: 900 }
const MOBILE_VIEWPORT  = { width: 390, height: 844 }

function collectErrors(page) {
  const errors = []
  page.on('pageerror', (err) => errors.push(err.message))
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()) })
  return errors
}

for (const { path, panelCount, hasVideos } of PAGES) {
  test.describe(path, () => {
    test('desktop viewport: loads clean, desktop math untouched', async ({ page }) => {
      const errors = collectErrors(page)
      await page.setViewportSize(DESKTOP_VIEWPORT)
      await page.goto(path)
      await page.waitForFunction(() => typeof panels !== 'undefined' && panels.length > 0)

      const state = await page.evaluate(() => ({
        isMobile, panelsLength: panels.length, THICK, SPREAD,
      }))

      expect(errors, `console errors: ${errors.join('; ')}`).toEqual([])
      expect(state.isMobile).toBe(false)
      expect(state.panelsLength).toBe(panelCount)
      expect(state.THICK).toBe(0.16) // must stay byte-identical to pre-mobile-fix value
      expect(state.SPREAD).toBe(1)
    })

    test('mobile viewport: loads clean, ring built correctly', async ({ page }) => {
      const errors = collectErrors(page)
      await page.setViewportSize(MOBILE_VIEWPORT)
      await page.goto(path)
      await page.waitForFunction(() => typeof panels !== 'undefined' && panels.length > 0)

      const state = await page.evaluate(() => ({
        isMobile, panelsLength: panels.length, THICK, SPREAD, MOB_RADIUS, MOB_CAM_Z,
      }))

      expect(errors, `console errors: ${errors.join('; ')}`).toEqual([])
      expect(state.isMobile).toBe(true)
      expect(state.panelsLength).toBe(panelCount)
      expect(state.SPREAD).toBe(1) // compression mismatch bug: must never be <1 again
      expect(state.THICK).toBeLessThan(0.16) // must scale down, not use desktop's absolute size
      expect(state.MOB_RADIUS).toBeLessThan(state.MOB_CAM_Z) // camera must stay outside the ring
    })

    test('isMobile flips at the 1024px boundary', async ({ page }) => {
      await page.setViewportSize({ width: 1023, height: 800 })
      await page.goto(path)
      await page.waitForFunction(() => typeof isMobile !== 'undefined')
      expect(await page.evaluate(() => isMobile)).toBe(true)

      await page.setViewportSize({ width: 1025, height: 800 })
      await page.reload()
      await page.waitForFunction(() => typeof isMobile !== 'undefined')
      expect(await page.evaluate(() => isMobile)).toBe(false)
    })

    if (hasVideos) {
      test('cover videos are attached to the DOM and buffering', async ({ page }) => {
        await page.setViewportSize(DESKTOP_VIEWPORT)
        await page.goto(path)
        await page.waitForFunction(() => typeof allCoverVideos !== 'undefined' && allCoverVideos.length > 0)
        await page.waitForTimeout(1500)

        const videos = await page.evaluate(() =>
          allCoverVideos.map(v => ({ inDom: document.body.contains(v), readyState: v.readyState }))
        )
        expect(videos.length).toBeGreaterThan(0)
        for (const v of videos) {
          expect(v.inDom).toBe(true) // detached video elements silently fail to autoplay on iOS WebKit
          expect(v.readyState).toBeGreaterThanOrEqual(2)
        }
      })
    }
  })
}

test('portals_fiction.html: story overlay stays at the top while typing', async ({ page }) => {
  await page.setViewportSize(DESKTOP_VIEWPORT)
  await page.goto('/portals_fiction.html')
  await page.waitForFunction(() => typeof openStory !== 'undefined')
  await page.evaluate(() => openStory(HUM_INDEX))
  await page.waitForTimeout(600) // mid-typing — this is exactly when the old bug jumped to the bottom
  const scrollTop = await page.evaluate(() => document.getElementById('storyOverlay').scrollTop)
  expect(scrollTop).toBe(0)
})
