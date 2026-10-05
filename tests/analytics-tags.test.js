import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = file => readFile(resolve(root, file), 'utf8');

const [indexHtml, siteTags, pageScript] = await Promise.all([
    read('index.html'),
    read('assets/js/site-tags.js'),
    read('assets/js/script.js')
]);

const staticSlots = [...indexHtml.matchAll(/data-ad-slot="(\d+)"/g)].map(match => match[1]);
const inlineSlots = [...pageScript.matchAll(/slot: '(\d+)'/g)].map(match => match[1]);
const allSlots = [...staticSlots, ...inlineSlots];

test('uses one centralized third-party tags loader', () => {
    assert.equal((indexHtml.match(/assets\/js\/site-tags\.js/g) || []).length, 1);
    assert.equal((indexHtml.match(/google-site-verification/g) || []).length, 1);
    assert.equal((indexHtml.match(/googletagmanager\.com\/ns\.html\?id=/g) || []).length, 1);
    assert.doesNotMatch(indexHtml, /googletagmanager\.com\/gtag\/js|google-analytics\.com\/analytics\.js/i);
});

test('centralizes GTM and GA4 without a direct gtag config', () => {
    assert.match(siteTags, /gtmId:\s*'GTM-N32B2XGG'/);
    assert.match(siteTags, /ga4Id:\s*'G-TTBZP0KPQF'/);
    assert.match(siteTags, /ga4Mode:\s*'gtm'/);
    assert.match(siteTags, /googletagmanager\.com\/gtm\.js/);
    assert.match(siteTags, /site_tags_ga4_config/);
    assert.match(siteTags, /ga4Mode !== 'direct'/);
    assert.match(siteTags, /if \(isConfigured\(TAG_CONFIG\.gtmId\)\) return initGtm\(\)/);
});

test('uses exactly one lazy AdSense slot per page', () => {
    assert.deepEqual(allSlots, ['3143411927']);
    assert.equal(inlineSlots.length, 0);
    assert.match(siteTags, /adsbygoogle\.js/);
    assert.match(siteTags, /IntersectionObserver/);
});

test('loads no legacy direct measurement tags', () => {
    assert.doesNotMatch(indexHtml, /google-analytics\.com|clarity\.ms/i);
    assert.doesNotMatch(pageScript, /googletagmanager\.com|google-analytics\.com|clarity\.ms/i);
});
