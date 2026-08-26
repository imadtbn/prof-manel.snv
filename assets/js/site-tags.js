/*
 * Centralized third-party tags loader.
 * Keeps external script loading in one place and leaves page-specific UI in script.js.
 */
(() => {
    'use strict';

    const CONFIG = Object.freeze({
        adsenseClient: 'ca-pub-5656416032906373',
        adsenseSrc: 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js',
        adSelector: 'ins.adsbygoogle',
        rootMargin: '360px 0px',
        statusCheckDelay: 250,
        statusCheckLimit: 48
    });

    const mountedAds = new WeakSet();
    let adsenseLoad;
    let adObserver;
    let mutationObserver;
    let refreshScheduled = false;

    function getAds() {
        return [...document.querySelectorAll(CONFIG.adSelector)];
    }

    function getAdSenseQueue() {
        window.adsbygoogle = window.adsbygoogle || [];
        return window.adsbygoogle;
    }

    function loadAdSense() {
        if (!getAds().length) return Promise.resolve(false);
        getAdSenseQueue();
        if (adsenseLoad) return adsenseLoad;

        adsenseLoad = new Promise(resolve => {
            const source = `${CONFIG.adsenseSrc}?client=${encodeURIComponent(CONFIG.adsenseClient)}`;
            const existing = [...document.scripts].find(script => script.src.startsWith(CONFIG.adsenseSrc));

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
            script.crossOrigin = 'anonymous';
            script.src = source;
            script.addEventListener('load', () => {
                script.dataset.siteTagsReady = 'true';
                resolve(true);
            }, { once: true });
            script.addEventListener('error', () => resolve(false), { once: true });
            document.head.appendChild(script);
        });

        return adsenseLoad;
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
            if (checks < CONFIG.statusCheckLimit) {
                checks += 1;
                window.setTimeout(checkStatus, CONFIG.statusCheckDelay);
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
                rootMargin: CONFIG.rootMargin,
                threshold: 0.01
            });
        }

        ads.forEach(ad => {
            if (!mountedAds.has(ad)) adObserver.observe(ad);
        });
    }

    function scheduleRefresh() {
        if (refreshScheduled) return;
        refreshScheduled = true;
        const run = window.requestIdleCallback || (callback => window.setTimeout(callback, 0));
        run(refreshAds, { timeout: 1200 });
    }

    function init() {
        scheduleRefresh();

        if ('MutationObserver' in window && document.body) {
            mutationObserver = new MutationObserver(scheduleRefresh);
            mutationObserver.observe(document.body, { childList: true, subtree: true });
        }
    }

    window.SiteTags = Object.freeze({
        config: CONFIG,
        refreshAds: scheduleRefresh
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})();
