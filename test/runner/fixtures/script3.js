document.write('<div id="banner3"></div>');
var el = document.getElementById('banner3');

var iframe = document.createElement('iframe');

iframe.src = 'http://www.finn.no';

el.appendChild(iframe);

iframe.contentDocument.write('<div id="inner"><a target="_blank" href="http://www.finn.no/inner-iframe">inner link</a></div>');
