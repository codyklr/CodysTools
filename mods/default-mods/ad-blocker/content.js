(function(mod) {
    'use strict';

    // Check if ad blocker is already injected
    if (window.adBlockerInjected) return;
    window.adBlockerInjected = true;

    const adSelectors = [
        '[id*="ad"]',
        '[class*="ad"]',
        '[data-ad]',
        '.advertisement',
        '.adsbygoogle',
        '.banner-ad',
        '.sponsored',
        '.promoted',
        '[data-testid="placementTracking"]',
        '.ad-container',
        '.ad-wrapper'
    ];

    const whitelist = mod.settings?.whitelist || [];
    const currentDomain = window.location.hostname;

    // Check if current site is whitelisted
    const isWhitelisted = whitelist.some(site => currentDomain.includes(site));
    if (isWhitelisted) {
        console.log('Ad blocker disabled for whitelisted site:', currentDomain);
        return;
    }

    function blockAds() {
        adSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                if (element && element.style) {
                    element.style.display = 'none';
                    element.setAttribute('data-ad-blocked', 'true');
                }
            });
        });
    }

    // Initial block
    blockAds();

    // Monitor for new ads
    const observer = new MutationObserver(() => {
        blockAds();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Clean up on page unload
    window.addEventListener('beforeunload', () => {
        observer.disconnect();
    });

    console.log('Ad blocker mod loaded and active');
})(window.modConfig || {});
