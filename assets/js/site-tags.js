/*
 * Centralized third-party tags loader.
 * GTM is the active analytics path on this site; the direct GA4 branch remains opt-in for reuse.
 */
(() => {
    'use strict';

    const TAG_CONFIG = Object.freeze({
        gtmId: 'GTM-N32B2XGG',
        ga4Id: 'G-TTBZP0KPQF',
        ga4Mode: 'gtm',
        adsenseClient: 'ca-pub-5656416032906373',
        gtmSrc: 'https://www.googletagmanager.com/gtm.js',
        adsenseSrc: 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js',
        adSelector: 'ins.adsbygoogle',
        adSlots: Object.freeze(['3143411927', '1760836049']),
        adRootMargin: '180px 0px'
    });

    const mountedAds = new WeakSet();
    const scriptLoads = new Map();
    let adObserver;
    let refreshScheduled = false;
    let gtmEventPushed = false;
    let ga4DataLayerPushed = false;

    function isConfigured(value) {
        return typeof value === 'string' && value.trim() !== '' && !/^x+$/i.test(value.trim());
    }

    function getDataLayer() {
        window.dataLayer = window.dataLayer || [];
        return window.dataLayer;
    }

    function loadScriptOnce(key, src) {
        if (scriptLoads.has(key)) return scriptLoads.get(key);

        const promise = new Promise(resolve => {
            const existing = [...document.scripts].find(script => script.src.startsWith(src));
            if (existing) {
                if (existing.dataset.siteTagsReady === 'true') {
                    resolve(true);
                    return;
                }
                existing.addEventListener('load', () => resolve(true), { once: true });
                existing.addEventListener('error', () => resolve(false), { once: true });
                return;
            }

            const script = document.createElement('script');
            script.async = true;
            script.src = src;
            if (key === 'adsense') script.crossOrigin = 'anonymous';
            script.addEventListener('load', () => {
                script.dataset.siteTagsReady = 'true';
                resolve(true);
            }, { once: true });
            script.addEventListener('error', () => resolve(false), { once: true });
            document.head.appendChild(script);
        });

        scriptLoads.set(key, promise);
        return promise;
    }

    function initGtm() {
        if (!isConfigured(TAG_CONFIG.gtmId)) return Promise.resolve(false);

        const dataLayer = getDataLayer();
        if (!gtmEventPushed) {
            dataLayer.push({
                'gtm.start': Date.now(),
                event: 'gtm.js'
            });
            gtmEventPushed = true;
        }

        if (TAG_CONFIG.ga4Mode === 'gtm' && isConfigured(TAG_CONFIG.ga4Id) && !ga4DataLayerPushed) {
            dataLayer.push({
                event: 'site_tags_ga4_config',
                ga4_id: TAG_CONFIG.ga4Id
            });
            ga4DataLayerPushed = true;
        }

        const src = `${TAG_CONFIG.gtmSrc}?id=${encodeURIComponent(TAG_CONFIG.gtmId)}`;
        return loadScriptOnce('gtm', src);
    }

    function initDirectGa4() {
        if (TAG_CONFIG.ga4Mode !== 'direct' || !isConfigured(TAG_CONFIG.ga4Id)) {
            return Promise.resolve(false);
        }

        const dataLayer = getDataLayer();
        window.gtag = window.gtag || function gtag() {
            dataLayer.push(arguments);
        };

        if (!ga4DataLayerPushed) {
            window.gtag('js', new Date());
            window.gtag('config', TAG_CONFIG.ga4Id);
            ga4DataLayerPushed = true;
        }

        return loadScriptOnce(
            'ga4',
            `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(TAG_CONFIG.ga4Id)}`
        );
    }

    function initMeasurement() {
        if (isConfigured(TAG_CONFIG.gtmId)) return initGtm();
        return initDirectGa4();
    }

    function createAdContainer(slot, position) {
        const container = document.createElement('section');
        container.className = 'ad-container ad-container--site ad-container--site-' + position;
        container.setAttribute('aria-label', position === 'primary' ? 'إعلان 1' : 'إعلان 2');
        container.innerHTML =
            '<div class="ad-shell ad-shell--responsive">' +
            '<span class="ad-label">إعلان</span>' +
            '<ins class="adsbygoogle ad-unit" style="display:block" ' +
            'data-ad-client="' + TAG_CONFIG.adsenseClient + '" ' +
            'data-ad-slot="' + slot + '" data-ad-format="auto" ' +
            'data-full-width-responsive="true"></ins></div>';
        return container;
    }

    function placeAdContainer(main, container, position) {
        const sections = [...main.children].filter(node =>
            node.tagName === 'SECTION' && !node.classList.contains('ad-container')
        );

        if (position === 'primary') {
            const first = sections[0];
            if (first) first.insertAdjacentElement('afterend', container);
            else main.prepend(container);
            return;
        }

        const resourcesSection = main.querySelector('#resources');
        if (resourcesSection) {
            resourcesSection.insertAdjacentElement('afterend', container);
            return;
        }

        const last = sections[sections.length - 1];
        if (last) last.insertAdjacentElement('afterend', container);
        else main.append(container);
    }

    function ensureAdSlots() {
        const main = document.querySelector('main');
        if (!main) return [];

        return TAG_CONFIG.adSlots.map((slot, index) => {
            const existing = document.querySelector(
                TAG_CONFIG.adSelector + '[data-ad-slot="' + slot + '"]'
            );
            if (existing) return existing;

            const position = index === 0 ? 'primary' : 'secondary';
            const container = createAdContainer(slot, position);
            placeAdContainer(main, container, position);
            return container.querySelector(TAG_CONFIG.adSelector);
        }).filter(Boolean);
    }

    function getAds() {
        return [...document.querySelectorAll(TAG_CONFIG.adSelector)];
    }

    function getAdSenseQueue() {
        window.adsbygoogle = window.adsbygoogle || [];
        return window.adsbygoogle;
    }

    function loadAdSense() {
        if (!getAds().length) return Promise.resolve(false);
        getAdSenseQueue();
        if (scriptLoads.has('adsense')) return scriptLoads.get('adsense');

        const source = `${TAG_CONFIG.adsenseSrc}?client=${encodeURIComponent(TAG_CONFIG.adsenseClient)}`;
        const promise = loadScriptOnce('adsense', source);
        return promise;
    }

    function mountAd(ad) {
        if (mountedAds.has(ad)) return;
        mountedAds.add(ad);

        loadAdSense().then(ready => {
            if (!ready || !document.documentElement.contains(ad)) return;
            getAdSenseQueue().push({});
        });
    }

    function refreshAds() {
        refreshScheduled = false;
        const ads = getAds();
        if (!ads.length) return;

        if (!('IntersectionObserver' in window)) {
            ads.forEach(mountAd);
            return;
        }

        if (!adObserver) {
            adObserver = new IntersectionObserver(entries => {
                entries.forEach(entry => {
                    if (!entry.isIntersecting) return;
                    adObserver.unobserve(entry.target);
                    mountAd(entry.target);
                });
            }, {
                rootMargin: TAG_CONFIG.adRootMargin,
                threshold: 0.01
            });
        }

        ads.forEach(ad => {
            if (!mountedAds.has(ad)) adObserver.observe(ad);
        });
    }

    function scheduleAdRefresh() {
        if (refreshScheduled) return;
        refreshScheduled = true;
        const run = window.requestIdleCallback || (callback => window.setTimeout(callback, 0));
        run(refreshAds, { timeout: 1200 });
    }

    function init() {
        initMeasurement();
        ensureAdSlots();
        scheduleAdRefresh();
    }

    window.SiteTags = Object.freeze({
        config: TAG_CONFIG,
        refreshAds: scheduleAdRefresh,
        ensureAdSlots
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})();
