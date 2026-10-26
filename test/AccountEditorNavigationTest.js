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
var deferCacheFetch = false;
var cacheRequests = [];
var cacheFetches = 0;
var cacheRecords = [];
function AccountCollection() { this.models = []; this.length = 0; }
AccountCollection.prototype.fetch = function(options) {
    cacheFetches++;
    var collection = this;
    var request = {
        success: function(records) {
            collection.reset(records === undefined ? cacheRecords : records);
            options.success();
        },
        error: function() { options.error(); }
    };
    if (deferCacheFetch) cacheRequests.push(request);
    else request.success();
};
AccountCollection.prototype.reset = function(records) {
    this.models = records;
    this.length = records.length;
};
AccountCollection.extend = function() { return AccountCollection; };
function $(selector) {
    return {
        html: function(value) {
            if (value !== undefined && selector === editorElement) editorRenders++;
            return value === undefined ? '' : this;
        },
        setElement: function() { return this; },
        hide: function() { return this; },
        attr: function() { return this; },
        append: function() { return this; },
        val: function() { return this; }
    };
}
var Backbone = {View: Base, Router: Base, Model: Base};
var editorElement = {};
var editorRenders = 0;
var deferTransitions = false;
var pendingTransitions = [];
var browserEntries = null;
var context = {
    Backbone: Backbone, _: {template: function() { return function() { return ''; }; },
        extend: Object.assign, each: function(items, fn) { items.forEach(fn); }, map: function(items, fn) { return items.map(fn); }},
    $: $, Force: {SObject: {extend: function() { return Account; }}, SObjectCollection: AccountCollection,
        CACHE_MODE: {SERVER_FIRST: 'server'}, MERGE_MODE: {MERGE_FAIL_IF_CHANGED: 'fail'}},
    app: {models: {}, views: {}, offlineTracker: offline},
    window: {location: {hash: ''}}, console: {log: function() {}},
    setTimeout: function(fn) { if (deferTransitions) pendingTransitions.push(fn); else fn(); },
    alert: function(message) { alerts.push(message); }
};
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root, 'samples/common/stackrouter.js'), 'utf8'), context);
vm.runInContext(script[1], context);
var app = context.app;
app.editPage = new app.views.EditAccountPage();
app.editPage.el = editorElement;
app.searchPage = {el: {}, render: function() { return this; }};
app.syncPage = {el: {}, render: function() { return this; }};
var listFetches = 0;
app.searchResults = {fetch: function() { listFetches++; }};
app.localAccounts = new AccountCollection();
app.localAccounts.config = {type: 'cache'};
var router = Object.create(app.Router.prototype);
router.pageHistory = [];
router.navigate = function(hash, options) {
    options = options || {};
    if (context.window.location.hash === hash) return;
    if (browserEntries) {
        if (options.replace) browserEntries[browserEntries.length - 1] = hash;
        else browserEntries.push(hash);
    }
    context.window.location.hash = hash;
    if (options.trigger) {
        if (hash === '#' || hash === '' || hash === '#list') this.list();
        else if (hash === '#add') this.addAccount();
        else if (hash.indexOf('#edit/accounts/') === 0) this.editAccount(hash.split('/')[2], hash.split('/')[3]);
        else if (hash === '#sync') this.sync();
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

var fetchesBeforeOnline = listFetches;
app.views.OfflineToggler.prototype.toggle.call({model: offline}, {preventDefault: function() {}});
assert.strictEqual(context.window.location.hash, '#list', 'empty sync returns to list');
assert.strictEqual(listFetches, fetchesBeforeOnline + 1, 'returning online on list refreshes accounts');

router.navigate('#edit/accounts/9/false', {trigger: true});
resolve('9');
var editorModel = app.editPage.model;
var rendersBeforeToggle = editorRenders;
browserEntries = ['#list', '#edit/accounts/9/false'];
app.views.OfflineToggler.prototype.toggle.call({model: offline}, {preventDefault: function() {}});
app.views.OfflineToggler.prototype.toggle.call({model: offline}, {preventDefault: function() {}});
assert.deepStrictEqual(browserEntries, ['#list', '#edit/accounts/9/false'], 'empty sync does not add browser history');
browserEntries = null;
assert.strictEqual(editorRenders, rendersBeforeToggle, 'connectivity change does not replace editor inputs');
assert.strictEqual(context.window.location.hash, '#edit/accounts/9/false', 'empty sync returns to editor');
assert.strictEqual(pending.length, 0, 'empty sync does not refetch current editor');
assert.strictEqual(app.editPage.model, editorModel, 'empty sync does not recreate editor model');
assert.strictEqual(router.currentPage, app.editPage, 'empty sync leaves editor visible');
assert.strictEqual(app.editPage.backAction, '#list', 'returning online keeps editor Back destination');
app.editPage.goBack();
assert.strictEqual(context.window.location.hash, '#list', 'Back works after returning online');

router.navigate('#add', {trigger: true});
var draft = app.editPage.model;
draft.set('Name', 'Unsaved draft');
rendersBeforeToggle = editorRenders;
browserEntries = ['#list', '#add'];
app.views.OfflineToggler.prototype.toggle.call({model: offline}, {preventDefault: function() {}});
assert.strictEqual(draft.get('Name'), 'Unsaved draft', 'going offline retains unsaved Add fields');
app.views.OfflineToggler.prototype.toggle.call({model: offline}, {preventDefault: function() {}});
assert.deepStrictEqual(browserEntries, ['#list', '#add'], 'empty sync does not add Add browser history');
browserEntries = null;
assert.strictEqual(editorRenders, rendersBeforeToggle, 'connectivity change does not replace Add inputs');
assert.strictEqual(context.window.location.hash, '#add', 'empty sync returns to Add');
assert.strictEqual(app.editPage.model, draft, 'empty sync does not recreate Add model');
assert.strictEqual(draft.get('Name'), 'Unsaved draft', 'offline and online rerenders keep unsaved Add fields');
assert.strictEqual(router.currentPage, app.editPage, 'empty sync leaves Add visible');
assert.strictEqual(app.editPage.backAction, '#list', 'returning online keeps Add Back destination');
app.editPage.goBack();
assert.strictEqual(context.window.location.hash, '#list', 'Add Back works after returning online');

router.navigate('#edit/accounts/9/false', {trigger: true});
resolve('9');
editorModel = app.editPage.model;
var fetchesBeforeReentry = pending.length;
var rendersBeforeReentry = editorRenders;
var backBeforeReentry = app.editPage.backAction;
router.navigate('#sync', {trigger: true});
assert.strictEqual(context.window.location.hash, '#edit/accounts/9/false', 'empty Sync returns to Edit hash');
assert.strictEqual(pending.length, fetchesBeforeReentry, 'same-hash Edit re-entry does not fetch again');
assert.strictEqual(editorRenders, rendersBeforeReentry, 'same-hash Edit re-entry does not replace inputs');
assert.strictEqual(app.editPage.model, editorModel, 'same-hash Edit re-entry keeps model');
assert.strictEqual(app.editPage.backAction, backBeforeReentry, 'same-hash Edit re-entry keeps Back destination');
app.editPage.goBack();
assert.strictEqual(context.window.location.hash, '#list', 'Edit Back works after same-hash re-entry');

router.navigate('#add', {trigger: true});
draft = app.editPage.model;
draft.set('Name', 'Forced sync draft');
rendersBeforeReentry = editorRenders;
backBeforeReentry = app.editPage.backAction;
router.navigate('#sync', {trigger: true});
assert.strictEqual(context.window.location.hash, '#add', 'empty Sync returns to Add hash');
assert.strictEqual(editorRenders, rendersBeforeReentry, 'same-hash Add re-entry does not replace inputs');
assert.strictEqual(app.editPage.model, draft, 'same-hash Add re-entry keeps draft identity');
assert.strictEqual(draft.get('Name'), 'Forced sync draft', 'same-hash Add re-entry keeps unsaved value');
assert.strictEqual(app.editPage.backAction, backBeforeReentry, 'same-hash Add re-entry keeps Back destination');
app.editPage.goBack();
assert.strictEqual(context.window.location.hash, '#list', 'Add Back works after same-hash re-entry');

router.navigate('#add', {trigger: true});
assert.strictEqual(app.editPage.model.get('Name'), '', 'new Add entry starts with a blank name');
app.editPage.goBack();

router.navigate('#edit/accounts/10/false', {trigger: true});
resolve('10');
app.views.OfflineToggler.prototype.toggle.call({model: offline}, {preventDefault: function() {}});
cacheRecords = [{id: 'modified'}];
var fetchesBeforeSync = cacheFetches;
app.views.OfflineToggler.prototype.toggle.call({model: offline}, {preventDefault: function() {}});
assert.strictEqual(context.window.location.hash, '#sync', 'non-empty sync navigates to Sync');
assert.strictEqual(router.currentPage, app.syncPage, 'non-empty sync shows Sync page');
assert.strictEqual(cacheFetches, fetchesBeforeSync + 1, 'non-empty sync uses a single cache fetch');

cacheRecords = [];
router.navigate('#list', {trigger: true});
deferTransitions = true;
router.navigate('#edit/accounts/11/false', {trigger: true});
resolve('11');
assert.strictEqual(router.currentPage, app.searchPage, 'edit transition has not completed');
app.views.OfflineToggler.prototype.toggle.call({model: offline}, {preventDefault: function() {}});
app.views.OfflineToggler.prototype.toggle.call({model: offline}, {preventDefault: function() {}});
assert.strictEqual(context.window.location.hash, '#edit/accounts/11/false', 'empty sync returns to transitioning editor');
assert.strictEqual(pending.length, 0, 'transitioning editor is not refetched');
assert.strictEqual(app.editPage.backAction, '#list', 'transitioning editor keeps Back destination');
deferTransitions = false;
pendingTransitions.shift()();
assert.strictEqual(router.currentPage, app.editPage, 'pending editor transition completes');
app.editPage.goBack();

deferTransitions = true;
router.navigate('#add', {trigger: true});
var transitioningDraft = app.editPage.model;
transitioningDraft.set('Name', 'Pending draft');
assert.strictEqual(router.currentPage, app.searchPage, 'Add transition has not completed');
app.views.OfflineToggler.prototype.toggle.call({model: offline}, {preventDefault: function() {}});
app.views.OfflineToggler.prototype.toggle.call({model: offline}, {preventDefault: function() {}});
assert.strictEqual(app.editPage.model, transitioningDraft, 'empty sync does not recreate transitioning Add model');
assert.strictEqual(transitioningDraft.get('Name'), 'Pending draft', 'transitioning Add keeps model-backed draft');
assert.strictEqual(app.editPage.backAction, '#list', 'transitioning Add keeps Back destination');
deferTransitions = false;
pendingTransitions.shift()();
assert.strictEqual(router.currentPage, app.editPage, 'pending Add transition completes');

router.navigate('#list', {trigger: true});
router.navigate('#edit/accounts/12/false', {trigger: true});
var pendingEditor = pending.shift();
assert.strictEqual(router.currentPage, app.searchPage, 'editor is not shown before fetch completes');
fetchesBeforeOnline = listFetches;
app.views.OfflineToggler.prototype.toggle.call({model: offline}, {preventDefault: function() {}});
app.views.OfflineToggler.prototype.toggle.call({model: offline}, {preventDefault: function() {}});
assert.strictEqual(context.window.location.hash, '#edit/accounts/12/false', 'empty sync keeps pending edit route');
assert.strictEqual(listFetches, fetchesBeforeOnline, 'online toggle does not refresh list during pending edit');
pendingEditor.success();
assert.strictEqual(router.currentPage, app.editPage, 'pending edit finishes after empty sync');
assert.strictEqual(app.editPage.backAction, '#list', 'pending edit retains list Back destination');

router.navigate('#list', {trigger: true});
deferCacheFetch = true;
cacheRecords = [{id: 'modified'}];
offline.set('isOnline', false);
app.views.OfflineToggler.prototype.toggle.call({model: offline}, {preventDefault: function() {}});
app.views.OfflineToggler.prototype.toggle.call({model: offline}, {preventDefault: function() {}});
cacheRequests.shift().success([{id: 'stale-offline'}]);
assert.strictEqual(context.window.location.hash, '#list', 'stale online fetch cannot open Sync after going offline');
assert.strictEqual(app.localAccounts.length, 0, 'stale offline fetch does not replace Sync queue');

app.views.OfflineToggler.prototype.toggle.call({model: offline}, {preventDefault: function() {}});
router.navigate('#add', {trigger: true});
cacheRequests.shift().success([{id: 'stale-route'}]);
assert.strictEqual(context.window.location.hash, '#add', 'stale online fetch cannot leave a new route');
assert.strictEqual(app.localAccounts.length, 0, 'stale route fetch does not replace Sync queue');

router.navigate('#list', {trigger: true});
offline.set('isOnline', false);
app.views.OfflineToggler.prototype.toggle.call({model: offline}, {preventDefault: function() {}});
app.views.OfflineToggler.prototype.toggle.call({model: offline}, {preventDefault: function() {}});
app.views.OfflineToggler.prototype.toggle.call({model: offline}, {preventDefault: function() {}});
cacheRequests.shift().success([{id: 'older'}]);
assert.strictEqual(context.window.location.hash, '#list', 'older online fetch cannot navigate after a newer toggle');
assert.strictEqual(app.localAccounts.length, 0, 'older online fetch does not replace Sync queue');
cacheRequests.shift().success([{id: 'latest'}]);
assert.strictEqual(context.window.location.hash, '#sync', 'latest online fetch opens Sync');
assert.strictEqual(app.localAccounts.models[0].id, 'latest', 'Sync displays only latest cache result');

router.navigate('#list', {trigger: true});
offline.set('isOnline', false);
app.views.OfflineToggler.prototype.toggle.call({model: offline}, {preventDefault: function() {}});
app.views.OfflineToggler.prototype.toggle.call({model: offline}, {preventDefault: function() {}});
app.views.OfflineToggler.prototype.toggle.call({model: offline}, {preventDefault: function() {}});
var lateOlder = cacheRequests.shift();
cacheRequests.shift().success([{id: 'newest'}]);
lateOlder.success([{id: 'obsolete'}]);
assert.strictEqual(app.localAccounts.models[0].id, 'newest', 'late obsolete result cannot replace active Sync queue');

router.navigate('#list', {trigger: true});
offline.set('isOnline', false);
app.views.OfflineToggler.prototype.toggle.call({model: offline}, {preventDefault: function() {}});
cacheRequests.shift().error();
assert.strictEqual(offline.get('isOnline'), false, 'cache check failure restores offline mode');
assert.strictEqual(context.window.location.hash, '#list', 'cache check failure leaves current page visible');
assert.strictEqual(alerts[alerts.length - 1], 'Failed to check local records for sync', 'cache check failure is visible');

console.log('AccountEditor navigation regression passed');
