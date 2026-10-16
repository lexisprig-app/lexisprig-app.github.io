# LexiSprig · 拾词贴 Official Website

Standalone GitHub Pages repository for **LexiSprig / 拾词贴** (`com.luckyxmobile.lexisprig`), structured to deploy directly to a dedicated GitHub Organization Pages repository (`<org>/<org>.github.io`, e.g., `lexisprig-app/lexisprig-app.github.io`).

## Structure

- `index.html`: Bilingual landing page structured in **3 → 2 → 1** user-value order (`#pain-3` Understand Vocabulary in Context → `#pain-2` Real Life Into Topics → `#pain-1` Multi-Language Without Switching Apps), a membership comparison/pricing section, and 5 localized screenshot slots reused across feature sections and the gallery.
- `support.html`: Bilingual App Support & FAQ page.
- `accessibility.html`: Bilingual Accessibility statement.
- `legal/privacy.html`: Bilingual Privacy Policy.
- `legal/terms.html`: Bilingual Terms of Use / Apple Standard EULA, including localized App Store pricing, introductory-offer eligibility, the same-subscription-group trial limit, auto-renewal/cancellation, lifetime purchases, and continued access to saved learning data.
- `css/style.css`: Responsive stylesheet with separated Chinese (`html[data-lang="zh"]`) and English (`html[data-lang="en"]`) typography and mobile hamburger navigation (`#nav-toggle` / `#site-nav-menu`).
- `js/main.js`: Automatic browser language detection (`zh-Hans` / `en`), manual language switcher with `localStorage` persistence, and localized screenshot labels.
- `icons/`: Current LexiSprig app icon assets (`AppIcon_Default.svg`, `app_icon.png`) plus root `apple-touch-icon.png`, `favicon-32x32.png`, and `favicon-16x16.png`.
- `assets/screenshots/{zh-Hans,en}/01..05.png`: Genuine localized captures from the current app used in the landing-page feature sections and gallery. Chinese captures use Chinese explanations with English and Japanese learning; English captures use English explanations with Chinese and Japanese learning.
- `appstore/fancy-screenshots/output/{zh-Hans,en}/iphone-6.9-01..06.png`: Design-only App Store compositions. Do not submit them to App Store Connect; replace them with approved final store creatives first.
- `scripts/validate-site.mjs`: Automated BDD verification script checking all 6 design & engineering constraints.

## Verification

```bash
node scripts/validate-site.mjs
```

Membership pricing on the public site reflects the currently configured mainland China and U.S. App Store Connect reference prices. The App Store purchase sheet remains authoritative for the customer's local price, eligibility, tax, and renewal details. Update the site when prices or offers change.
