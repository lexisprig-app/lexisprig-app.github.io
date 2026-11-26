import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ownerSiteId = process.argv[2] || 'lexisprig';
const markerStart = '<!-- APP_DIRECTORY_START -->';
const markerEnd = '<!-- APP_DIRECTORY_END -->';

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
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

function validateProduct(product, seenIds) {
  assert(product && typeof product === 'object', 'Each product must be an object');
  assert(typeof product.product_id === 'string' && product.product_id.length > 0, 'Each product needs a product_id');
  assert(!seenIds.has(product.product_id), `Duplicate product_id: ${product.product_id}`);
  seenIds.add(product.product_id);
  assert(typeof product.site_id === 'string' && product.site_id.length > 0, `${product.product_id} needs a site_id`);
  for (const locale of ['zh', 'en']) {
    assert(typeof product.name?.[locale] === 'string' && product.name[locale].length > 0,
      `${product.product_id} needs a ${locale} name`);
  }

  for (const locale of ['zh', 'en']) {
    assert(typeof product.description?.[locale] === 'string' && product.description[locale].length > 0,
      `${product.product_id} needs a ${locale} description`);
    const url = new URL(product.url?.[locale]);
    assert(url.protocol === 'https:', `${product.product_id} ${locale} URL must use HTTPS`);
  }
}

function renderCard(product) {
  const zhName = escapeHtml(product.name.zh);
  const enName = escapeHtml(product.name.en);
  const zhUrl = escapeHtml(product.url.zh);
  const enUrl = escapeHtml(product.url.en);
  const zhDescription = escapeHtml(product.description.zh);
  const enDescription = escapeHtml(product.description.en);
  const iconSrc = escapeHtml(product.icon.src);
  const productId = escapeHtml(product.product_id);

  return `      <article class="app-directory-card" data-app-product="${productId}">
        <img class="app-directory-icon" src="${iconSrc}" width="56" height="56" alt="" loading="lazy" decoding="async">
        <div class="app-directory-card-content">
          <a class="app-directory-card-link app-directory-card-link--zh" href="${zhUrl}" lang="zh-Hans">
            <h3>${zhName}</h3>
            <p>${zhDescription}</p>
            <span class="app-directory-cta">访问产品页</span>
          </a>
          <a class="app-directory-card-link app-directory-card-link--en" href="${enUrl}" lang="en">
            <h3>${enName}</h3>
            <p>${enDescription}</p>
            <span class="app-directory-cta">Visit product page</span>
          </a>
        </div>
      </article>`;
}

const catalog = JSON.parse(await fs.readFile(path.join(rootDir, 'data/apps.json'), 'utf8'));
assert(Array.isArray(catalog.products), 'data/apps.json must contain a products array');

const seenIds = new Set();
catalog.products.forEach((product) => validateProduct(product, seenIds));
const products = catalog.products.filter((product) => product.site_id !== ownerSiteId);
assert(products.length > 0, `No products found for owner site "${ownerSiteId}"`);
for (const product of products) {
  assert(typeof product.icon?.src === 'string' && product.icon.src.length > 0,
    `${product.product_id} needs a local icon src`);
  const iconPath = path.resolve(rootDir, product.icon.src);
  const relativeIconPath = path.relative(rootDir, iconPath);
  assert(relativeIconPath && !relativeIconPath.startsWith('..') && !path.isAbsolute(relativeIconPath),
    `${product.product_id} icon src must stay inside the repository`);
  const iconStat = await fs.stat(iconPath);
  assert(iconStat.isFile() && iconStat.size > 0, `${product.product_id} icon file is missing or empty`);
  const iconSource = new URL(product.icon.source);
  assert(iconSource.protocol === 'https:' && iconSource.hostname === 'raw.githubusercontent.com',
    `${product.product_id} icon source must be an official raw GitHub asset URL`);
}

const section = `<section class="app-directory-section" aria-labelledby="app-directory-title">
  <div class="container">
    <div class="section-header">
      <h2 id="app-directory-title">
        <span class="app-directory-locale app-directory-locale--zh" lang="zh-Hans">更多应用</span>
        <span class="app-directory-locale app-directory-locale--en" lang="en">Explore our other apps</span>
      </h2>
      <p>
        <span class="app-directory-locale app-directory-locale--zh" lang="zh-Hans">探索我们为日常工作与生活打造的其他应用。</span>
        <span class="app-directory-locale app-directory-locale--en" lang="en">Discover other apps we've built for everyday work and life.</span>
      </p>
    </div>
    <div class="app-directory-grid">
${products.map(renderCard).join('\n')}
    </div>
  </div>
</section>`;

const indexPath = path.join(rootDir, 'index.html');
const indexHtml = await fs.readFile(indexPath, 'utf8');
const startIndex = indexHtml.indexOf(markerStart);
const endIndex = indexHtml.indexOf(markerEnd);
assert(startIndex !== -1 && endIndex > startIndex, 'App directory markers are missing or out of order in index.html');
assert(indexHtml.indexOf(markerStart, startIndex + markerStart.length) === -1, 'Multiple app directory start markers found');
assert(indexHtml.indexOf(markerEnd, endIndex + markerEnd.length) === -1, 'Multiple app directory end markers found');

const sectionWithIndent = section.split('\n').map((line) => `    ${line}`).join('\n');
const generatedBlock = `${markerStart}\n${sectionWithIndent}\n    ${markerEnd}`;
const updatedHtml = `${indexHtml.slice(0, startIndex)}${generatedBlock}${indexHtml.slice(endIndex + markerEnd.length)}`;

if (updatedHtml !== indexHtml) {
  await fs.writeFile(indexPath, updatedHtml);
}

console.log(`Generated ${products.length} app cards for owner site "${ownerSiteId}" in index.html.`);
