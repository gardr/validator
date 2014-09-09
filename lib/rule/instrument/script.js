module.exports = {
    'onBeforeExit': function (api) {

        function instrumentScriptGetScripts() {
            function filterOutGardr(v) {
                return !!v && !!v.trim() && v.indexOf('banner.start();') !== 0;
            }

            function mapContent(tag) {
                return tag.innerHTML;
            }

            function actualScriptTags(tag) {
                return tag && tag.getAttribute('type') === null || tag && tag.getAttribute('type') === 'text/javascript';
            }

            var tags = Array.prototype.slice.call(document.body.querySelectorAll('script'));

            return tags.filter(actualScriptTags).map(mapContent).filter(filterOutGardr);
        }


        function instrumentScriptGetCodeAttributes(){
            var all = Array.prototype.slice.call(document.body.getElementsByTagName('*'));

            var result = [];

            var attributesToCheckFor = [
                'onload', 'onreadystatechange',
                'onclick',
                'onblur', 'onchange', 'onfocus',
                'onmouseover', 'onmouseout', 'onmouseenter', 'onmouseleave', 'onmouseup', 'onmousewheel',
                'onresize', 'onscroll',
                'onsubmit',
                'onunload'
            ];

            all.forEach(function(el){

                var matches = attributesToCheckFor.filter(function(key){
                    return el.hasAttribute(key);
                });

                if (matches.length > 0){
                    result.push({
                        tag: el.tagName,
                        matches: matches.map(function(key){
                            var attr = el.getAttribute(key);
                            return {
                                key: key,
                                value: attr && attr.toString()
                            };
                        })
                    });
                }

            });

            return result;
        }

        api.switchToIframe();
        api.set('tags', api.evaluate(instrumentScriptGetScripts));
        api.set('attributes', api.evaluate(instrumentScriptGetCodeAttributes));
    }
};
