import { expect, test } from "@playwright/test";

const widths = [375, 390, 768];
const routes = [
  "/",
  "/eclipssebrand",
  "/personaliza",
  "/checkout",
  "/legal/aviso-legal",
  "/legal/privacidad",
];

for (const width of widths) {
  for (const route of routes) {
    test(`${route} no desborda horizontalmente a ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 812 });

      const response = await page.goto(route, { waitUntil: "domcontentloaded" });

      expect(response?.status()).toBe(200);
      await expect
        .poll(() =>
          page.evaluate(() => ({
            viewport: window.innerWidth,
            document: document.documentElement.scrollWidth,
            body: document.body.scrollWidth,
          })),
        )
        .toEqual({ viewport: width, document: width, body: width });
    });
  }
}
