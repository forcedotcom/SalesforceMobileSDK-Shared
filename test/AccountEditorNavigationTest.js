// Run with: node test/AccountEditorNavigationTest.js
var assert = require('assert');
var fs = require('fs');
var path = require('path');
var vm = require('vm');

var root = path.join(__dirname, '..');
var html = fs.readFileSync(path.join(root, 'samples/accounteditor/AccountEditor.html'), 'utf8');
var script = html.match(/<script>\s*([\s\S]*?)<\/script>/);
assert(script, 'AccountEditor inline script is present');

function extend(properties) {
    var Parent = this;
    function Child(options) {
        if (Parent !== Base) Parent.call(this, options);
        if (options && options.model) this.model = options.model;
        if (this.initialize) this.initialize();
    }
    Child.prototype = Object.create(Parent.prototype);
    Object.keys(properties).forEach(function(key) { Child.prototype[key] = properties[key]; });
    Child.extend = extend;
    return Child;
}
function Base() {}
Base.extend = extend;
Base.prototype.setElement = function(el) { this.el = el; return this; };
var listeners = {};
var offline = {
    online: true,
    get: function() { return this.online; },
    on: function(event, fn, context) { (listeners[event] || (listeners[event] = [])).push({fn: fn, context: context}); },
    set: function(key, value) {
        if (this.online === value) return;
        this.online = value;
        (listeners['change:isOnline'] || []).forEach(function(listener) { listener.fn.call(listener.context); });
    },
    toJSON: function() { return {isOnline: this.online}; }
};
var pending = [];
var alerts = [];
function Account(attrs) { this.id = attrs.Id; this.attrs = attrs; }
Account.prototype.get = function(key) { return this.attrs[key]; };
Account.prototype.set = function(key, value) {
    if (typeof key === 'object') Object.assign(this.attrs, key);
    else this.attrs[key] = value;
};
Account.prototype.toJSON = function() { return this.attrs; };
Account.prototype.cacheMode = function() { return 'cache'; };
Account.prototype.fetch = function(options) { pending.push({id: this.id, account: this, success: options.success, error: options.error}); };
Account.prototype.save = function(attrs, options) { options.success(); };
Account.extend = extend;
function $(selector) {
    return {
        html: function(value) { return value === undefined ? '' : this; },
        setElement: function() { return this; },
        hide: function() { return this; },
        attr: function() { return this; },
        append: function() { return this; },
        val: function() { return this; }
    };
}
var Backbone = {View: Base, Router: Base, Model: Base};
var context = {
    Backbone: Backbone, _: {template: function() { return function() { return ''; }; },
        extend: Object.assign, each: function(items, fn) { items.forEach(fn); }, map: function(items, fn) { return items.map(fn); }},
    $: $, Force: {SObject: {extend: function() { return Account; }}, SObjectCollection: Base,
        CACHE_MODE: {SERVER_FIRST: 'server'}, MERGE_MODE: {MERGE_FAIL_IF_CHANGED: 'fail'}},
    app: {models: {}, views: {}, offlineTracker: offline},
    window: {location: {hash: ''}}, console: {log: function() {}}, setTimeout: function(fn) { fn(); },
    alert: function(message) { alerts.push(message); }
};
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root, 'samples/common/stackrouter.js'), 'utf8'), context);
vm.runInContext(script[1], context);
var app = context.app;
app.editPage = new app.views.EditAccountPage();
app.searchPage = {el: {}, render: function() { return this; }};
app.searchResults = {fetch: function() {}};
var router = Object.create(app.Router.prototype);
router.pageHistory = [];
router.navigate = function(hash, options) {
    if (context.window.location.hash === hash) return;
    context.window.location.hash = hash;
    if (options.trigger) {
        if (hash === '#' || hash === '' || hash === '#list') this.list();
        else if (hash === '#add') this.addAccount();
        else if (hash.indexOf('#edit/accounts/') === 0) this.editAccount(hash.split('/')[2], hash.split('/')[3]);
    }
};
app.router = router;
router.list();
var onlineChanges = 0;
offline.on('change:isOnline', function() { onlineChanges++; });
offline.set('isOnline', true);
assert.strictEqual(onlineChanges, 0, 'setting unchanged connectivity does not emit a change');
function resolve(id) {
    var request = pending.shift();
    assert.strictEqual(request.id, id);
    request.success();
}

router.navigate('#edit/accounts/1/false', {trigger: true});
resolve('1');
assert.strictEqual(app.editPage.backAction, '#', 'first entry returns to list');
app.editPage.goBack();
assert.strictEqual(context.window.location.hash, '#', 'direct Back returns to list');

router.navigate('#edit/accounts/1/false', {trigger: true});
resolve('1');
app.views.OfflineToggler.prototype.toggle.call({model: offline}, {preventDefault: function() {}});
assert.strictEqual(offline.get('isOnline'), false, 'toggle updates cache mode state');
assert.strictEqual(app.editPage.backAction, '#', 'offline rerender retains entry destination');
app.editPage.goBack();
assert.strictEqual(context.window.location.hash, '#', 'Back after offline toggle returns to list');

router.navigate('#edit/accounts/2/false', {trigger: true});
resolve('2');
app.editPage.save();
assert.strictEqual(context.window.location.hash, '#', 'save after toggle returns to list');

router.navigate('#add', {trigger: true});
assert.strictEqual(app.editPage.backAction, '#', 'Add refreshes return route');
app.editPage.goBack();
assert.strictEqual(context.window.location.hash, '#', 'Add Back returns to list');

router.navigate('#edit/accounts/3/false', {trigger: true});
var stale = pending.shift();
router.navigate('#', {trigger: true});
stale.success();
assert.strictEqual(context.window.location.hash, '#', 'late fetch cannot reopen editor');
assert.strictEqual(router.currentPage, app.searchPage, 'late fetch leaves list visible');

router.navigate('#list', {trigger: true});
router.navigate('#edit/accounts/4/false', {trigger: true});
resolve('4');
assert.strictEqual(app.editPage.backAction, '#list', 'new entry captures a different prior route');
offline.set('isOnline', true);
assert.strictEqual(app.editPage.backAction, '#list', 'online rerender retains prior route');
app.editPage.goBack();
assert.strictEqual(context.window.location.hash, '#list', 'Back respects non-default list route');

router.navigate('#edit/accounts/5/false', {trigger: true});
var previous = pending.shift();
router.navigate('#edit/accounts/6/false', {trigger: true});
previous.success();
assert.strictEqual(app.editPage.model.id, '4', 'superseded fetch cannot replace the displayed model');
resolve('6');
assert.strictEqual(app.editPage.model.id, '6', 'latest fetch opens the requested account');
assert.strictEqual(app.editPage.backAction, '#list', 'latest fetch retains its entry destination');

router.navigate('#list', {trigger: true});
router.navigate('#edit/accounts/A/false', {trigger: true});
var firstA = pending.shift();
router.navigate('#list', {trigger: true});
router.navigate('#edit/accounts/A/false', {trigger: true});
var secondA = pending.shift();
firstA.success();
assert.strictEqual(app.editPage.model.id, '6', 'first A response cannot open second A entry');
secondA.success();
assert.strictEqual(app.editPage.model, secondA.account, 'second A response opens current entry');
assert.strictEqual(app.editPage.backAction, '#list', 'second A retains its own return destination');

router.navigate('#list', {trigger: true});
router.navigate('#edit/accounts/A/false', {trigger: true});
var olderA = pending.shift();
router.navigate('#list', {trigger: true});
router.navigate('#edit/accounts/A/false', {trigger: true});
var newerA = pending.shift();
newerA.success();
olderA.success();
assert.strictEqual(app.editPage.model, newerA.account, 'older A response cannot replace newer A model');

router.navigate('#list', {trigger: true});
router.navigate('#edit/accounts/A/false', {trigger: true});
var failedA = pending.shift();
router.navigate('#list', {trigger: true});
router.navigate('#edit/accounts/A/false', {trigger: true});
failedA.error();
assert.deepStrictEqual(alerts, [], 'superseded A failure does not alert');
resolve('A');

router.navigate('#list', {trigger: true});
router.navigate('#edit/accounts/B/false', {trigger: true});
var currentFailure = pending.shift();
currentFailure.error();
assert.deepStrictEqual(alerts, ['Failed to get record for edit'], 'current edit fetch failure alerts');

router.navigate('#list', {trigger: true});
var changesBeforeToggle = onlineChanges;
app.views.OfflineToggler.prototype.toggle.call({model: offline}, {preventDefault: function() {}});
assert.strictEqual(offline.get('isOnline'), false, 'list toggle updates connectivity state');
assert.strictEqual(onlineChanges, changesBeforeToggle + 1, 'list toggle emits one connectivity change');
assert.strictEqual(context.window.location.hash, '#list', 'list offline toggle does not navigate');
offline.set('isOnline', false);
assert.strictEqual(onlineChanges, changesBeforeToggle + 1, 'unchanged connectivity does not rerender');

console.log('AccountEditor navigation regression passed');
