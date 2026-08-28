/*
 * Centralized third-party tags loader.
 * GTM is the active analytics path on this site; the direct GA4 branch remains opt-in for reuse.
 */
(() => {
    'use strict';

    const TAG_CONFIG = Object.freeze({
        gtmId: 'GTM-N32B2XGG',
        ga4Id: 'G-BT30MKHK77',
        ga4Mode: 'gtm',
        adsenseClient: 'ca-pub-5656416032906373',
        gtmSrc: 'https://www.googletagmanager.com/gtm.js',
        adsenseSrc: 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js',
        adSelector: 'ins.adsbygoogle',
        adRootMargin: '360px 0px',
        adStatusCheckDelay: 250,
        adStatusCheckLimit: 48
    });

    const mountedAds = new WeakSet();
    const scriptLoads = new Map();
    let adObserver;
    let mutationObserver;
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

    function collapseUnfilledAd(ad) {
        const shell = ad.closest('.ad-shell');
        if (!shell) return;

        let checks = 0;
        const checkStatus = () => {
            const status = ad.getAttribute('data-ad-status');
            if (status === 'unfilled') {
                shell.classList.add('is-collapsed');
                return;
            }
            if (status === 'filled') {
                shell.classList.add('is-filled');
                return;
            }
            if (checks < TAG_CONFIG.adStatusCheckLimit) {
                checks += 1;
                window.setTimeout(checkStatus, TAG_CONFIG.adStatusCheckDelay);
            }
        };

        checkStatus();
    }

    function mountAd(ad) {
        if (mountedAds.has(ad)) return;
        mountedAds.add(ad);

        loadAdSense().then(ready => {
            if (!ready || !document.documentElement.contains(ad)) return;
            getAdSenseQueue().push({});
            collapseUnfilledAd(ad);
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
        scheduleAdRefresh();

        if ('MutationObserver' in window && document.body) {
            mutationObserver = new MutationObserver(scheduleAdRefresh);
            mutationObserver.observe(document.body, { childList: true, subtree: true });
        }
    }

    window.SiteTags = Object.freeze({
        config: TAG_CONFIG,
        refreshAds: scheduleAdRefresh
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})();
