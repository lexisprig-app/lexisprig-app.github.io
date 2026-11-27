# LexiSprig · 拾词贴 Official Website

Standalone GitHub Pages repository for **LexiSprig / 拾词贴** (`com.luckyxmobile.lexisprig`), structured to deploy directly to a dedicated GitHub Organization Pages repository (`<org>/<org>.github.io`, e.g., `lexisprig-app/lexisprig-app.github.io`).

## Structure

- `index.html`: Bilingual landing page structured in **3 → 2 → 1** user-value order (`#pain-3` Understand Vocabulary in Context → `#pain-2` Real Life Into Topics → `#pain-1` Multi-Language Without Switching Apps), a membership comparison/pricing section, and 5 localized screenshot slots reused across feature sections and the gallery.
- `support.html`: Bilingual App Support & FAQ page.
- `accessibility.html`: Bilingual Accessibility statement.
- `legal/privacy.html`: Bilingual Privacy Policy.
- `legal/terms.html`: Bilingual Terms of Use / Apple Standard EULA, including localized App Store pricing, introductory-offer eligibility, the same-subscription-group trial limit, auto-renewal/cancellation, lifetime purchases, and continued access to saved learning data.
- `data/apps.json`: Verified bilingual metadata and localized URLs for the seven apps in the product directory.
- `assets/app-icons/`: Optimized local copies of the six other apps' official icons; source repository URLs are recorded in `data/apps.json`.
- `scripts/generate-app-directory.mjs`: Generates static app cards and icons in `index.html`, filtering out the owner site (`lexisprig`) so descriptions and links are present in the published HTML.
- `robots.txt` and `sitemap.xml`: Allow normal crawling and list the five canonical site URLs.
- `css/style.css`: Responsive stylesheet with separated Chinese (`html[data-lang="zh"]`) and English (`html[data-lang="en"]`) typography, hamburger navigation below 1160px, and mobile content breakpoints.
- `js/main.js`: Automatic browser language detection (`zh-Hans` / `en`), manual language switcher with `localStorage` persistence, and localized screenshot labels.
- `icons/`: Current LexiSprig app icon assets (`AppIcon_Default.svg`, `app_icon.png`) plus root `apple-touch-icon.png`, `favicon-32x32.png`, and `favicon-16x16.png`.
- `assets/screenshots/{zh-Hans,en}/01..05.png`: Genuine localized captures from the current app used in the landing-page feature sections and gallery. Chinese captures use Chinese explanations with English and Japanese learning; English captures use English explanations with Chinese and Japanese learning.
- `appstore/fancy-screenshots/output/{zh-Hans,en}/iphone-6.9-01..06.png`: Design-only App Store compositions. Do not submit them to App Store Connect; replace them with approved final store creatives first.
- `scripts/validate-site.mjs`: Automated checks for site structure, design constraints, SEO metadata, and assets.

## Verification

```bash
node scripts/generate-app-directory.mjs
node scripts/validate-site.mjs
```

The app directory generator accepts an optional owner site ID when reused in another product-site repository, for example `node scripts/generate-app-directory.mjs displayset`.

## Local Preview and Responsive Testing

This static site has no bundled development server. To preview it temporarily from the repository root, run:

```bash
python3 -m http.server 8000 --bind 127.0.0.1 --directory .
```

Open `http://127.0.0.1:8000/` locally, and point Playwright at the same loopback URL. If port 8000 is occupied, choose another local port and update the URL. Stop the foreground server when checks are complete. Preview servers must bind only to `127.0.0.1` or `::1`; never bind to `0.0.0.0`, `::`, or a LAN interface, and do not use tunnels or port forwarding. Use browser or simulator viewport emulation for mobile and tablet checks rather than exposing the preview to a phone over Wi-Fi. These rules apply only to local development and testing; production GitHub Pages settings are unchanged.

Membership pricing on the public site reflects the currently configured mainland China and U.S. App Store Connect reference prices. The App Store purchase sheet remains authoritative for the customer's local price, eligibility, tax, and renewal details. Update the site when prices or offers change.
