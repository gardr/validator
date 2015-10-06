var wrap = require('./wrap.js');

function Context(phantom, page, result, name) {
    this.phantom = phantom;
    this.page = page;
    this.result = result;
    this.name = name||'common';
    if (!this.result[this.name]){
        this.result[this.name] = {};
    }
    this.context = this.result[this.name];
    this.wrap = wrap.createWrap(this.page);

    return this;
}

// Triggers on page object. TODO: add events inside webpage when needed
Context.prototype.trigger = function(eventName, payload){
    var fn = this.page[eventName];
    if (fn) {
        setTimeout(function(){fn(payload);}, 1);
    }
};

Context.prototype.evaluate = function apiEvaluate() {
    return this.page.evaluate.apply(this.page, Array.prototype.slice.call(arguments));
};

Context.prototype.injectLocalJs = function () {
    return this.page.injectJs.apply(this.page, Array.prototype.slice.call(arguments));
};

Context.prototype.getPNG = function () {
    return this.page.renderBase64('PNG');
};

Context.prototype.renderToFile = function (path) {
    return this.page.render(path);
};


Context.prototype.getViewportSize = function () {
    return this.page.viewportSize;
};

Context.prototype.getCookies = function () {
    return this.phantom.cookies;
};

Context.prototype.switchToIframe = function () {
    this.page.switchToMainFrame();
    this.page.switchToFrame(0);
};

Context.prototype.switchToMainFrame = function () {
    this.page.switchToMainFrame();
};

Context.prototype.getOptions = function apiGetOptions() {
    return this.page.options;
};

Context.prototype.getResult = Context.prototype.getResultObject = function () {
    return this.context;
};

Context.prototype.getGlobalResult = Context.prototype.getGlobalResultObject = function () {
    return this.result;
};

Context.prototype.createSubContext = function (name) {
    return new Context(this.phantom, this.page, this.result, name||'sub');
};

Context.prototype.set = function (key, value) {
    if (this.context[key]){
        // todo merge magicly?
        throw new Error('Key already present');
    }
    this.context[key] = value;
    return this;
};

Context.prototype.setPush = function(key, value){
    if (!this.context[key]){
        this.context[key] = [value];
    } else {
        this.context[key].push(value);
    }
    return this;
};

Context.prototype.lockNavigation = function() {
    this.page.navigationLocked = true;
};

Context.prototype.sendMouseEvent = function(type, x, y, buttonPos) {
    page.sendEvent(type, x, y, buttonPos);
};

module.exports = function (phantom, page, result, name) {
    return new Context(phantom, page, result||{}, name);
};
