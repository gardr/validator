var PHANTOM_HOOKS = [
    'onAlert',
    'onCallback',
    'onClosing',
    'onConfirm',
    'onConsoleMessage',
    'onError',
    'onFilePicker',
    'onInitialized',
    'onLoadFinished',
    'onLoadStarted',
    'onNavigationRequested',
    'onPageCreated',
    'onPrompt',
    'onResourceRequested',
    'onResourceReceived',
    'onResourceError',
    'onUrlChanged'
];

var HOOKS = [
    'onBeforeExit'/*,
    'onOpen',
    'onClientStarted'*/
];

var rule = {
    init: null,
    options: null
};

module.exports =  {
    HOOKS: PHANTOM_HOOKS.concat(HOOKS),
    rule: rule
};
