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

test('uses one centralized AdSense loader', () => {
    assert.equal((indexHtml.match(/assets\/js\/site-tags\.js/g) || []).length, 1);
    assert.equal((indexHtml.match(/adsbygoogle\.js/g) || []).length, 0);
    assert.match(siteTags, /adsbygoogle\.js/);
});

test('keeps the supplied AdSense slots unique and complete', () => {
    assert.deepEqual([...new Set(allSlots)].sort(), [
        '1760836049',
        '3143411927',
        '6152718642',
        '6528123169',
        '7867079394',
        '8546947691'
    ]);
    assert.equal(allSlots.length, new Set(allSlots).size);
});

test('loads no legacy direct measurement tags', () => {
    assert.doesNotMatch(indexHtml, /googletagmanager|google-analytics|clarity\.ms/i);
    assert.doesNotMatch(pageScript, /googletagmanager|google-analytics|clarity\.ms/i);
});
