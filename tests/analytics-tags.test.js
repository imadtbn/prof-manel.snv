import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = file => readFile(resolve(root, file), 'utf8');

const representativePages = [
  'index.html',
  'resources/index.html',
  'years/first-year.html',
  'about.html',
  'contact.html',
  'favorites.html',
  'resources/items/3as-immune-system-bac-exam.html'
];

test('embeds direct GA4 tracking on representative pages', async () => {
  for (const file of representativePages) {
    const html = await read(file);
    assert.match(html, /googletagmanager\.com\/gtag\/js\?id=G-BT30MKHK77/);
    assert.match(html, /gtag\('config',\s*'G-BT30MKHK77'\)/);
    assert.doesNotMatch(html, /site-tags\.js|GTM-N32B2XGG|G-TTBZP0KPQF/);
  }
});

test('embeds verification and AdSense directly on representative pages', async () => {
  for (const file of representativePages) {
    const html = await read(file);
    assert.match(html, /google-site-verification/);
    assert.match(html, /google-adsense-account/);
    assert.match(html, /pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js\?client=ca-pub-5656416032906373/);
    assert.match(html, /crossorigin="anonymous"/);
  }
});

test('uses exactly two direct ad units per representative page', async () => {
  for (const file of representativePages) {
    const html = await read(file);
    const slots = [...html.matchAll(/data-ad-slot="(\d+)"/g)].map(m => m[1]).sort();
    assert.deepEqual(slots, ['1760836049', '3143411927']);
    assert.equal((html.match(/adsbygoogle = window\.adsbygoogle/g) || []).length, 2);
  }
});
