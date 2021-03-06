module.exports = {
    actions: {
        trigger: {
            click: true,
            mouseover: true
        },
        trackWindowOpen: true
    },
    screenshots: {
        ms: 25,
        onlyUnique: true
    },
    scripts: {
        collectAttributes: true
    },
    codeUsage: {
        geolocation: {
            active: true,
            trackAfterInteraction: false
        }
    },
    css: {
        strictRules: true,
        filterOutStyleTagsWith: '* { padding: 0; margin: 0; border: 0; }'
    },
    errors: {
        //allowedErrors: 0
    },
    adops: {
        flatZIP: false
    },
    gardr: {
        // takes input from viewportOptions
        iframeNotAllowed: true,
        enforceStyling: true,
        //enforceSpec: true, <- old deprecated
        illegalTags: ['meta[name=\"viewport\"]']
    },
    gsap: {
        versionsBack: 1
    },
    jquery: {
        versionsBack: 1,
        wrapAnimate: true
    },
    log: {
        errorOnConsole: true
        //output logs to view maybe?
    },
    pagespeed: {
        runGooglePagespeed: true,
        scoreThreshold: 50,
        serveDomain: 'http://validator.gardr.org',
        serveIframeUrl: '/preview/built/iframe.html',
        apiKey: process.env['GOOG_PAGESPEED_API_KEY']
    },
    security: {
        checkUrl: true,
        apiKey: process.env['GOOG_SAFE_BROWSE_API_KEY']
    },
    har: {
        forceSecureUrls: true,
        checkTls: true,
        errorOnTls: true
    },
    sizes: {
        //refetchResources: true, // processReources.js
        //filterAfterUserInteraction: true, // onHalfTime triggers actions
        thresholdBytes: 100000, // bytes gziped
        giveExtraThreshold: {
            jQuery: true,
            jQueryThreshold: 33369,
            AdForm: true,
            GSAP: true
        },
        minimumPayloadSize: 100,
        maxRequests: {
            style: 0,
            script: 2,
            errors: 0,
            image: 20,
            other: 3
        }
    },
    timers: {
        nameToTriggerWrap: 'iframe.htm',
        setTimeout: 20,
        setInterval: 1,
        requestAnimationFrame: 0
    },
    touch: {
        swipeTop: true,
        swipeRight: true,
        swipeLeft: true,
        frames: 20,
        swipeTime: 250,
        delayBeforeNext: 1800
    }
};
