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

// 1. Verify required files and current app icons (Constraint 1 & 3)
const requiredFiles = [
  'index.html',
  'support.html',
  'accessibility.html',
  'legal/privacy.html',
  'legal/terms.html',
  'css/style.css',
  'js/main.js',
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

// 2. Verify zero Emoji across HTML, CSS, and JS (Constraint 4)
const textFiles = [
  'index.html',
  'support.html',
  'accessibility.html',
  'legal/privacy.html',
  'legal/terms.html',
  'css/style.css',
  'js/main.js'
];

const emojiRegex = /\p{Extended_Pictographic}/gu;

for (const rel of textFiles) {
  const content = readText(rel);
  const matches = content.match(emojiRegex);
  assert(!matches, `Found forbidden Emoji in ${rel}: ${matches ? matches.join(', ') : ''}`);
}

// 3. Verify 3 -> 2 -> 1 Pain Point ordering and 6 screenshot slots in index.html
const indexHtml = readText('index.html');
const idxPain3 = indexHtml.indexOf('id="pain-3"');
const idxPain2 = indexHtml.indexOf('id="pain-2"');
const idxPain1 = indexHtml.indexOf('id="pain-1"');
assert(idxPain3 > 0 && idxPain2 > idxPain3 && idxPain1 > idxPain2, 'Pain points in index.html must appear in strict 3 -> 2 -> 1 order (#pain-3 -> #pain-2 -> #pain-1)');

for (let slot = 1; slot <= 6; slot++) {
  assert(
    indexHtml.includes(`data-screenshot="${slot}"`),
    `index.html is missing [data-screenshot="${slot}"]`
  );
}

// 4. Verify CSS language style separation and mobile responsive menu rules (Constraint 2 & 6)
const styleCss = readText('css/style.css');
assert(styleCss.includes('html[data-lang="zh"]'), 'css/style.css must define html[data-lang="zh"] typography rules');
assert(styleCss.includes('html[data-lang="en"]'), 'css/style.css must define html[data-lang="en"] typography rules');
assert(styleCss.includes('@media (max-width: 860px)'), 'css/style.css must include mobile hamburger breakpoint @media (max-width: 860px)');
assert(styleCss.includes('.nav-menu.is-open'), 'css/style.css must define .nav-menu.is-open drawer state');

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

for (const page of htmlPages) {
  const html = readText(page);
  assert(html.includes('icons/app_icon.png'), `${page} must include the current app icon in brand title/footer`);
  assert(html.includes('favicon-32x32.png'), `${page} must link favicon-32x32.png`);
  assert(html.includes('apple-touch-icon.png'), `${page} must link apple-touch-icon.png`);
  assert(html.includes('id="nav-toggle"'), `${page} must include mobile hamburger button #nav-toggle`);
  assert(html.includes('id="site-nav-menu"'), `${page} must include collapsible menu #site-nav-menu`);
  assert(html.includes('<svg'), `${page} must use inline SVG icons`);

  for (const match of html.matchAll(i18nAttrRegex)) {
    allDataI18nKeys.add(match[1]);
  }
}

// 6. Verify every data-i18n key used in HTML exists in both zh and en dictionaries in js/main.js
const mainJs = readText('js/main.js');
const dictStart = mainJs.indexOf('const translations = {');
const dictEnd = mainJs.indexOf('const pageMeta = {');
assert(dictStart !== -1 && dictEnd > dictStart, 'Could not locate translations object in js/main.js');

const sandbox = {};
vm.runInNewContext(`${mainJs.slice(dictStart, dictEnd)}\nglobalThis.translations = translations;`, sandbox);
const { translations } = sandbox;

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
- Zero Emoji characters across all ${textFiles.length} source files
- 3 -> 2 -> 1 pain point order verified in index.html
- ${allDataI18nKeys.size} data-i18n keys verified in both zh and en dictionaries`);
