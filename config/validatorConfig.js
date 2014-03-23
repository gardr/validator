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
    gardr: {
        // takes input from viewportOptions
        iframeNotAllowed: true,
        enforceStyling: true,
        enforceSpec: true,
        illegalTags: ['meta[name=\"viewport\"]']
    },
    jquery: {
        versionsBack: 1,
        wrapAnimate: true
    },
    log: {
        //output logs to view maybe?
    },
    sizes: {
        refetchResources: true, // processReources.js
        filterAfterUserInteraction: true, // onHalfTime triggers actions
        thresholdBytes: 100000, // bytes gziped
        giveExtraThreshold: {
            jQuery: true,
            AdForm: true
        },
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
    }
};
