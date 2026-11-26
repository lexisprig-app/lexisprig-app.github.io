import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const rootDir = path.resolve(import.meta.dirname, '..');

function assert(condition, message) {
  if (!condition) {
    throw new Error(`ASSERTION FAILED: ${message}`);
  }
}

function readText(relPath) {
  const fullPath = path.join(rootDir, relPath);
  assert(fs.existsSync(fullPath), `Missing file: ${relPath}`);
  return fs.readFileSync(fullPath, 'utf8');
}

function getSingleCapture(content, regex, message) {
  const matches = [...content.matchAll(regex)];
  assert(matches.length === 1, message);
  return matches[0][1];
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);
}

function assertEnglishCopy(value, label) {
  if (typeof value === 'string') {
    assert(!/\p{Script=Han}/u.test(value), `${label} contains Chinese characters`);
    assert(!/[()（）]/u.test(value), `${label} contains parentheses`);
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => assertEnglishCopy(item, `${label}[${index}]`));
    return;
  }

  if (value && typeof value === 'object') {
    for (const [key, nestedValue] of Object.entries(value)) {
      assertEnglishCopy(nestedValue, `${label}.${key}`);
    }
  }
}

// 1. Verify required files and current app icons (Constraint 1 & 3)
const requiredFiles = [
  'index.html',
  'support.html',
  'accessibility.html',
  'legal/privacy.html',
  'legal/terms.html',
  'css/style.css',
  'js/main.js',
  'data/apps.json',
  'scripts/generate-app-directory.mjs',
  'robots.txt',
  'sitemap.xml',
  'assets/app-icons/displaypreset.png',
  'assets/app-icons/displaypilot.png',
  'assets/app-icons/scriptpace.png',
  'assets/app-icons/beiwen.png',
  'assets/app-icons/inspiration-draft.png',
  'assets/app-icons/wristmark.svg',
  'icons/AppIcon_Default.svg',
  'icons/app_icon.png',
  'apple-touch-icon.png',
  'favicon-32x32.png',
  'favicon-16x16.png'
];

for (const file of requiredFiles) {
  const fullPath = path.join(rootDir, file);
  assert(fs.existsSync(fullPath), `Required file missing: ${file}`);
  assert(fs.statSync(fullPath).size > 0, `File is empty: ${file}`);
}

// Verify screenshot slots 01..06 for zh-Hans and en (Constraint 5)
for (const locale of ['zh-Hans', 'en']) {
  for (let i = 1; i <= 6; i++) {
    const slot = String(i).padStart(2, '0');
    const pngRel = `appstore/fancy-screenshots/output/${locale}/iphone-6.9-${slot}.png`;
    const pngFull = path.join(rootDir, pngRel);
    assert(fs.existsSync(pngFull), `Missing screenshot placeholder: ${pngRel}`);
    assert(fs.statSync(pngFull).size > 1000, `Screenshot placeholder too small: ${pngRel}`);
  }
}

// Verify all five website screenshot assets are present and are full-size PNG captures.
for (const locale of ['zh-Hans', 'en']) {
  for (let i = 1; i <= 5; i++) {
    const slot = String(i).padStart(2, '0');
    const pngRel = `assets/screenshots/${locale}/${slot}.png`;
    const pngFull = path.join(rootDir, pngRel);
    assert(fs.existsSync(pngFull), `Missing website screenshot: ${pngRel}`);
    const image = fs.readFileSync(pngFull);
    assert(image.length > 100_000, `Website screenshot is too small to be a full-size capture: ${pngRel}`);
    assert(image.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])), `Invalid PNG file: ${pngRel}`);
    assert(image.readUInt32BE(16) === 1320 && image.readUInt32BE(20) === 2868,
      `Website screenshot must be 1320x2868: ${pngRel}`);
  }
}

// 2. Verify zero Emoji across HTML, CSS, and JS (Constraint 4)
const textFiles = [
  'index.html',
  'support.html',
  'accessibility.html',
  'legal/privacy.html',
  'legal/terms.html',
  'css/style.css',
  'js/main.js',
  'data/apps.json'
];

const emojiRegex = /\p{Extended_Pictographic}/gu;

for (const rel of textFiles) {
  const content = readText(rel);
  const matches = content.match(emojiRegex);
  assert(!matches, `Found forbidden Emoji in ${rel}: ${matches ? matches.join(', ') : ''}`);
}

// 3. Verify 3 -> 2 -> 1 Pain Point ordering and 5 screenshot slots in index.html
const indexHtml = readText('index.html');
const idxPain3 = indexHtml.indexOf('id="pain-3"');
const idxPain2 = indexHtml.indexOf('id="pain-2"');
const idxPain1 = indexHtml.indexOf('id="pain-1"');
assert(idxPain3 > 0 && idxPain2 > idxPain3 && idxPain1 > idxPain2, 'Pain points in index.html must appear in strict 3 -> 2 -> 1 order (#pain-3 -> #pain-2 -> #pain-1)');

for (let slot = 1; slot <= 5; slot++) {
  assert(
    indexHtml.includes(`data-screenshot="${slot}"`),
    `index.html is missing [data-screenshot="${slot}"]`
  );
}

// 4. Verify CSS language style separation and mobile responsive menu rules (Constraint 2 & 6)
const styleCss = readText('css/style.css');
assert(styleCss.includes('html[data-lang="zh"]'), 'css/style.css must define html[data-lang="zh"] typography rules');
assert(styleCss.includes('html[data-lang="en"]'), 'css/style.css must define html[data-lang="en"] typography rules');
assert(styleCss.includes('@media (max-width: 1160px)'), 'css/style.css must include the compact navigation breakpoint @media (max-width: 1160px)');
assert(styleCss.includes('@media (max-width: 860px)'), 'css/style.css must include mobile content breakpoints @media (max-width: 860px)');
assert(styleCss.includes('.nav-menu.is-open'), 'css/style.css must define .nav-menu.is-open drawer state');
assert(!styleCss.includes('overflow-x: hidden') && !styleCss.includes('overflow-x: clip'),
  'Global horizontal clipping must not mask responsive layout overflow');

// 5. Verify every HTML page has brand title icon, favicon links, SVG icons, and hamburger menu
const htmlPages = [
  'index.html',
  'support.html',
  'accessibility.html',
  'legal/privacy.html',
  'legal/terms.html'
];

const allDataI18nKeys = new Set();
const i18nAttrRegex = /data-i18n="([^"]+)"/g;
const expectedCanonicals = new Map([
  ['index.html', 'https://lexisprig-app.github.io/'],
  ['support.html', 'https://lexisprig-app.github.io/support.html'],
  ['accessibility.html', 'https://lexisprig-app.github.io/accessibility.html'],
  ['legal/privacy.html', 'https://lexisprig-app.github.io/legal/privacy.html'],
  ['legal/terms.html', 'https://lexisprig-app.github.io/legal/terms.html']
]);
const canonicalUrls = new Set();
const pageTitles = new Set();
const pageDescriptions = new Set();
const socialImageUrl = 'https://lexisprig-app.github.io/icons/app_icon.png';

for (const page of htmlPages) {
  const html = readText(page);
  assert(html.includes('icons/app_icon.png'), `${page} must include the current app icon in brand title/footer`);
  assert(html.includes('favicon-32x32.png'), `${page} must link favicon-32x32.png`);
  assert(html.includes('apple-touch-icon.png'), `${page} must link apple-touch-icon.png`);
  assert(html.includes('id="nav-toggle"'), `${page} must include mobile hamburger button #nav-toggle`);
  assert(html.includes('id="site-nav-menu"'), `${page} must include collapsible menu #site-nav-menu`);
  assert(html.includes('<svg'), `${page} must use inline SVG icons`);
  assert(html.includes('data-i18n="nav.chinese"') && html.includes('data-i18n="nav.english"'),
    `${page} language switcher labels must be localized`);

  const canonical = getSingleCapture(html, /<link rel="canonical" href="([^"]+)">/g, `${page} must have exactly one canonical URL`);
  assert(canonical === expectedCanonicals.get(page), `${page} has an unexpected canonical URL: ${canonical}`);
  assert(!canonicalUrls.has(canonical), `Duplicate canonical URL: ${canonical}`);
  canonicalUrls.add(canonical);

  const title = getSingleCapture(html, /<title>([^<]+)<\/title>/g, `${page} must have exactly one title`);
  const description = getSingleCapture(html, /<meta name="description" content="([^"]*)">/g, `${page} must have exactly one meta description`);
  const ogTitle = getSingleCapture(html, /<meta property="og:title" content="([^"]*)">/g, `${page} must have exactly one Open Graph title`);
  const ogDescription = getSingleCapture(html, /<meta property="og:description" content="([^"]*)">/g, `${page} must have exactly one Open Graph description`);
  const ogUrl = getSingleCapture(html, /<meta property="og:url" content="([^"]*)">/g, `${page} must have exactly one Open Graph URL`);
  const ogSiteName = getSingleCapture(html, /<meta property="og:site_name" content="([^"]*)">/g, `${page} must have exactly one Open Graph site name`);
  const ogImage = getSingleCapture(html, /<meta property="og:image" content="([^"]*)">/g, `${page} must have exactly one Open Graph image`);
  const ogImageAlt = getSingleCapture(html, /<meta property="og:image:alt" content="([^"]*)">/g, `${page} must have exactly one Open Graph image alt`);
  const twitterCard = getSingleCapture(html, /<meta name="twitter:card" content="([^"]*)">/g, `${page} must have exactly one Twitter card type`);
  const twitterTitle = getSingleCapture(html, /<meta name="twitter:title" content="([^"]*)">/g, `${page} must have exactly one Twitter title`);
  const twitterDescription = getSingleCapture(html, /<meta name="twitter:description" content="([^"]*)">/g, `${page} must have exactly one Twitter description`);
  const twitterImage = getSingleCapture(html, /<meta name="twitter:image" content="([^"]*)">/g, `${page} must have exactly one Twitter image`);
  const twitterImageAlt = getSingleCapture(html, /<meta name="twitter:image:alt" content="([^"]*)">/g, `${page} must have exactly one Twitter image alt`);
  const language = html.match(/<html lang="([^"]+)" data-lang="([^"]+)">/);

  assert(title === ogTitle && title === twitterTitle, `${page} social titles must match its initial title`);
  assert(description === ogDescription && description === twitterDescription, `${page} social descriptions must match its initial description`);
  assert(ogUrl === canonical, `${page} Open Graph URL must match its canonical URL`);
  assert(ogImage === socialImageUrl && twitterImage === socialImageUrl, `${page} social images must use the absolute app icon URL`);
  assertEnglishCopy(ogSiteName, `${page} Open Graph site name`);
  assertEnglishCopy(ogImageAlt, `${page} Open Graph image alt`);
  assertEnglishCopy(twitterImageAlt, `${page} Twitter image alt`);
  assert(twitterCard === 'summary', `${page} should use the summary Twitter card for its square app icon`);
  assert(language && language[1] === 'zh-Hans' && language[2] === 'zh',
    `${page} initial HTML content is Chinese and must declare zh-Hans/zh`);
  pageTitles.add(title);
  pageDescriptions.add(description);

  for (const match of html.matchAll(i18nAttrRegex)) {
    allDataI18nKeys.add(match[1]);
  }
}

assert(canonicalUrls.size === htmlPages.length, 'Each HTML page must have a unique canonical URL');
assert(pageTitles.size === htmlPages.length, 'Each HTML page must have a unique title');
assert(pageDescriptions.size === htmlPages.length, 'Each HTML page must have a unique description');

const sitemapUrl = 'https://lexisprig-app.github.io/sitemap.xml';
const robots = readText('robots.txt');
assert(/^User-agent:\s*\*\s*$/m.test(robots), 'robots.txt must include a wildcard user-agent');
assert(/^Allow:\s*\/\s*$/m.test(robots), 'robots.txt must allow normal crawling');
assert(robots.includes(`Sitemap: ${sitemapUrl}`), 'robots.txt must point to the sitemap');
assert(!/^\s*Disallow:/mi.test(robots), 'robots.txt must not block crawling');

const sitemap = readText('sitemap.xml');
const sitemapLocs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
assert(sitemapLocs.length === htmlPages.length, `Sitemap must contain exactly ${htmlPages.length} canonical URLs`);
assert(new Set(sitemapLocs).size === sitemapLocs.length, 'Sitemap URLs must be unique');
for (const url of sitemapLocs) {
  assert(canonicalUrls.has(url), `Sitemap contains a non-canonical URL: ${url}`);
  const pathname = new URL(url).pathname;
  const localPath = pathname === '/' ? 'index.html' : pathname.slice(1);
  assert(fs.existsSync(path.join(rootDir, localPath)), `Sitemap URL has no local page: ${url}`);
}

const appCatalog = JSON.parse(readText('data/apps.json'));
assert(Array.isArray(appCatalog.products), 'App catalog must contain a products array');
assert(appCatalog.products.length === 7, 'App catalog must contain all seven verified products');
const ownerSiteId = 'lexisprig';
const otherProducts = appCatalog.products.filter((product) => product.site_id !== ownerSiteId);
assert(otherProducts.length === 6, 'The LexiSprig homepage must link to the six other apps');
assert(!appCatalog.products.some((product) => product.site_id === ownerSiteId && product.product_id !== 'lexisprig'),
  'The app catalog has unexpected LexiSprig-owned products');

assert(indexHtml.includes('更多应用') && indexHtml.includes('Explore our other apps'),
  'The static app directory must include both localized section headings');
assert(!indexHtml.includes('data-app-product="lexisprig"'), 'The app directory must exclude the owner product');
const englishDirectoryText = [...indexHtml.matchAll(/<span class="app-directory-locale app-directory-locale--en"[\s\S]*?<\/span>/g)]
  .map((match) => match[0]);
assert(englishDirectoryText.length === 2, 'The app directory must include its English title and introduction in static HTML');
englishDirectoryText.forEach((copy, index) => assertEnglishCopy(copy, `English app directory text ${index + 1}`));
const appCardCount = [...indexHtml.matchAll(/<article class="app-directory-card" data-app-product="/g)].length;
assert(appCardCount === otherProducts.length, `Expected ${otherProducts.length} static app cards, found ${appCardCount}`);

for (const product of otherProducts) {
  const marker = `data-app-product="${product.product_id}"`;
  assert(indexHtml.split(marker).length === 2, `${product.product_id} must have exactly one app card`);
  const cardStart = indexHtml.indexOf(`<article class="app-directory-card" ${marker}>`);
  const cardEnd = indexHtml.indexOf('</article>', cardStart);
  const card = indexHtml.slice(cardStart, cardEnd);
  assert(product.name && typeof product.name.zh === 'string' && typeof product.name.en === 'string',
    `${product.product_id} must have localized names`);
  assert(card.includes(`href="${escapeHtml(product.url.zh)}"`) && card.includes(`href="${escapeHtml(product.url.en)}"`),
    `${product.product_id} must have both localized URLs in static HTML`);
  assert(card.includes(escapeHtml(product.name.zh)) && card.includes(escapeHtml(product.name.en)),
    `${product.product_id} must have both localized names in static HTML`);
  assert(card.includes(escapeHtml(product.description.zh)) && card.includes(escapeHtml(product.description.en)),
    `${product.product_id} must have both localized descriptions in static HTML`);
  assert(product.icon && typeof product.icon.src === 'string' && typeof product.icon.source === 'string',
    `${product.product_id} must have an official icon source and local asset`);
  const iconSrc = getSingleCapture(card, /<img class="app-directory-icon" src="([^"]+)" width="56" height="56" alt="" loading="lazy" decoding="async">/g,
    `${product.product_id} must have exactly one decorative, lazy-loaded icon with fixed dimensions`);
  assert(iconSrc === product.icon.src, `${product.product_id} card must use its local icon asset`);
  const iconSource = new URL(product.icon.source);
  assert(iconSource.protocol === 'https:' && iconSource.hostname === 'raw.githubusercontent.com',
    `${product.product_id} icon provenance must use its official GitHub repository`);
  const englishCard = card.match(/<a class="app-directory-card-link app-directory-card-link--en"[\s\S]*?<\/a>/);
  assert(englishCard, `${product.product_id} must have an English app card link`);
  assertEnglishCopy(englishCard[0], `${product.product_id} English app card`);
  assertEnglishCopy(product.name.en, `${product.product_id} English name`);
  assertEnglishCopy(product.description.en, `${product.product_id} English description`);
}

const jsonLdTags = [...indexHtml.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
assert(jsonLdTags.length === 1, 'Homepage must include exactly one JSON-LD script');
const softwareApplication = JSON.parse(jsonLdTags[0][1]);
assert(softwareApplication['@type'] === 'SoftwareApplication'
  && softwareApplication.name === 'LexiSprig'
  && softwareApplication.applicationCategory === 'EducationalApplication'
  && softwareApplication.operatingSystem === 'iOS'
  && softwareApplication.url === expectedCanonicals.get('index.html')
  && softwareApplication.downloadUrl === 'https://apps.apple.com/app/id6818102711'
  && !('offers' in softwareApplication)
  && !('aggregateRating' in softwareApplication),
'Homepage SoftwareApplication JSON-LD must contain only the verified app identity and URLs');
assertEnglishCopy(JSON.stringify(softwareApplication), 'Homepage SoftwareApplication JSON-LD');

// 6. Verify every data-i18n key used in HTML exists in both zh and en dictionaries in js/main.js
const mainJs = readText('js/main.js');
const dictStart = mainJs.indexOf('const translations = {');
const pageMetaStart = mainJs.indexOf('const pageMeta = {');
const screenshotAltsStart = mainJs.indexOf('const screenshotAlts = {');
const definitionsEnd = mainJs.indexOf('const STORAGE_KEY =');
assert(dictStart !== -1 && pageMetaStart > dictStart && screenshotAltsStart > pageMetaStart && definitionsEnd > screenshotAltsStart,
  'Could not locate localized copy in js/main.js');

const sandbox = {};
vm.runInNewContext(`${mainJs.slice(dictStart, definitionsEnd)}
globalThis.translations = translations;
globalThis.pageMeta = pageMeta;
globalThis.screenshotAlts = screenshotAlts;`, sandbox);
const { translations, pageMeta, screenshotAlts } = sandbox;

assertEnglishCopy(translations.en, 'English interface translations');
assertEnglishCopy(screenshotAlts.en, 'English screenshot alt text');
for (const [page, metadata] of Object.entries(pageMeta)) {
  assertEnglishCopy(metadata.en, `English metadata for ${page}`);
}

assert(mainJs.includes('document.documentElement.dataset.lang = currentLang;'),
  'Language switching must update the document language used by the app directory');
assert(mainJs.includes('window.innerWidth > 1160'),
  'Navigation JavaScript must use the CSS collapse breakpoint');
assert(mainJs.includes('twitterTitle.setAttribute("content", meta.title)')
  && mainJs.includes('twitterDesc.setAttribute("content", meta.description)'),
'Language switching must update English Twitter metadata from the localized page metadata');
assert(styleCss.includes('html[data-lang="en"] .app-directory-card-link--en')
  && styleCss.includes('html[data-lang="en"] .app-directory-card-link--zh'),
'App directory links must switch to English and hide Chinese when English is active');
assert(styleCss.includes('.app-directory-icon') && styleCss.includes('object-fit: contain'),
  'App directory icons must be styled with object-fit: contain');

function getPath(obj, dotPath) {
  return dotPath.split('.').reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined), obj);
}

for (const key of allDataI18nKeys) {
  const zhVal = getPath(translations.zh, key);
  const enVal = getPath(translations.en, key);
  assert(typeof zhVal === 'string' && zhVal.length > 0, `Missing zh translation for data-i18n="${key}"`);
  assert(typeof enVal === 'string' && enVal.length > 0, `Missing en translation for data-i18n="${key}"`);
}

console.log(`ALL CHECKS PASSED:
- ${requiredFiles.length} core files & icons verified
- 12 bilingual screenshot placeholders (zh-Hans & en, 01..06) verified
- 10 full-size website screenshots (zh-Hans & en, 01..05) verified
- Zero Emoji characters across all ${textFiles.length} source files
- ${canonicalUrls.size} canonical URLs, page metadata, robots.txt, and sitemap.xml verified
- ${otherProducts.length} app cards with bilingual descriptions and URLs verified in static HTML
- ${otherProducts.length} official local app icons verified with fixed dimensions, empty alt, lazy loading, and object-fit
- English interface copy checked for Chinese characters and parentheses
- 3 -> 2 -> 1 pain point order verified in index.html
- ${allDataI18nKeys.size} data-i18n keys verified in both zh and en dictionaries`);
