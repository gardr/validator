module.exports = function(score){
    return {
        "kind": "pagespeedonline#result",
        "id": "http://validator.gardr.org/preview/built/iframe.html?ts=1403532919284#%7B%22name%22%3A%22pagespeed%22%2C%22minSize%22%3A39%2C%22timeout%22%3A200%2C%22url%22%3A%22%22%2C%22width%22%3A0%2C%22height%22%3A0%7D",
        "responseCode": 200,
        "title": "gardr ext",
        "score": score||98,
        "pageStats": {
            "numberResources": 2,
            "numberHosts": 1,
            "totalRequestBytes": "144",
            "numberStaticResources": 1,
            "htmlResponseBytes": "981",
            "javascriptResponseBytes": "73964",
            "numberJsResources": 1
        },
        "formattedResults": {
            "locale": "en_US",
            "ruleResults": {
                "AvoidLandingPageRedirects": {
                    "localizedRuleName": "Avoid landing page redirects",
                    "ruleImpact": 0.0,
                    "urlBlocks": [{
                        "header": {
                            "format": "Your page has no redirects. Learn more about avoiding landing page redirects.",
                            "args": [{
                                "type": "HYPERLINK",
                                "value": "https://developers.google.com/speed/docs/insights/AvoidRedirects"
                            }]
                        }
                    }]
                },
                "EnableGzipCompression": {
                    "localizedRuleName": "Enable compression",
                    "ruleImpact": 0.0,
                    "urlBlocks": [{
                        "header": {
                            "format": "You have compression enabled. Learn more about enabling compression.",
                            "args": [{
                                "type": "HYPERLINK",
                                "value": "https://developers.google.com/speed/docs/insights/EnableCompression"
                            }]
                        }
                    }]
                },
                "LeverageBrowserCaching": {
                    "localizedRuleName": "Leverage browser caching",
                    "ruleImpact": 0.0,
                    "urlBlocks": [{
                        "header": {
                            "format": "You have enabled browser caching. Learn more about browser caching recommendations.",
                            "args": [{
                                "type": "HYPERLINK",
                                "value": "https://developers.google.com/speed/docs/insights/LeverageBrowserCaching"
                            }]
                        }
                    }]
                },
                "MainResourceServerResponseTime": {
                    "localizedRuleName": "Reduce server response time",
                    "ruleImpact": 0.0,
                    "urlBlocks": [{
                        "header": {
                            "format": "Your server responded quickly. Learn more about server response time optimization.",
                            "args": [{
                                "type": "HYPERLINK",
                                "value": "https://developers.google.com/speed/docs/insights/Server"
                            }]
                        }
                    }]
                },
                "MinifyCss": {
                    "localizedRuleName": "Minify CSS",
                    "ruleImpact": 0.0,
                    "urlBlocks": [{
                        "header": {
                            "format": "Your CSS is minified. Learn more about minifying CSS.",
                            "args": [{
                                "type": "HYPERLINK",
                                "value": "https://developers.google.com/speed/docs/insights/MinifyResources"
                            }]
                        }
                    }]
                },
                "MinifyHTML": {
                    "localizedRuleName": "Minify HTML",
                    "ruleImpact": 0.0,
                    "urlBlocks": [{
                        "header": {
                            "format": "Your HTML is minified. Learn more about minifying HTML.",
                            "args": [{
                                "type": "HYPERLINK",
                                "value": "https://developers.google.com/speed/docs/insights/MinifyResources"
                            }]
                        }
                    }]
                },
                "MinifyJavaScript": {
                    "localizedRuleName": "Minify JavaScript",
                    "ruleImpact": 0.8716,
                    "urlBlocks": [{
                        "header": {
                            "format": "Compacting JavaScript code can save many bytes of data and speed up downloading, parsing, and execution time."
                        }
                    }, {
                        "header": {
                            "format": "Minify JavaScript for the following resources to reduce their size by $2 ($3 reduction).",
                            "args": [{
                                "type": "HYPERLINK",
                                "value": "https://developers.google.com/speed/docs/insights/MinifyResources"
                            }, {
                                "type": "BYTES",
                                "value": "8.5KiB"
                            }, {
                                "type": "PERCENTAGE",
                                "value": "44%"
                            }]
                        },
                        "urls": [{
                            "result": {
                                "format": "Minifying $1 could save $2 ($3 reduction) after compression.",
                                "args": [{
                                    "type": "URL",
                                    "value": "http://validator.gardr.org/preview/built/ext.js"
                                }, {
                                    "type": "BYTES",
                                    "value": "8.5KiB"
                                }, {
                                    "type": "PERCENTAGE",
                                    "value": "44%"
                                }]
                            }
                        }]
                    }]
                },
                "MinimizeRenderBlockingResources": {
                    "localizedRuleName": "Eliminate render-blocking JavaScript and CSS in above-the-fold content",
                    "ruleImpact": 0.0,
                    "urlBlocks": [{
                        "header": {
                            "format": "You have no render-blocking resources. Learn more about removing render-blocking resources.",
                            "args": [{
                                "type": "HYPERLINK",
                                "value": "https://developers.google.com/speed/docs/insights/BlockingJS"
                            }]
                        }
                    }]
                },
                "OptimizeImages": {
                    "localizedRuleName": "Optimize images",
                    "ruleImpact": 0.0,
                    "urlBlocks": [{
                        "header": {
                            "format": "Your images are optimized. Learn more about optimizing images.",
                            "args": [{
                                "type": "HYPERLINK",
                                "value": "https://developers.google.com/speed/docs/insights/OptimizeImages"
                            }]
                        }
                    }]
                },
                "PrioritizeVisibleContent": {
                    "localizedRuleName": "Prioritize visible content",
                    "ruleImpact": 0.0,
                    "urlBlocks": [{
                        "header": {
                            "format": "You have the above-the-fold content properly prioritized. Learn more about prioritizing visible content.",
                            "args": [{
                                "type": "HYPERLINK",
                                "value": "https://developers.google.com/speed/docs/insights/PrioritizeVisibleContent"
                            }]
                        }
                    }]
                }
            }
        },
        "version": {
            "major": 1,
            "minor": 15
        }
    };

};
