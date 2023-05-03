// Copyright (c) 2009-2022 SAP SE, All Rights Reserved
sap.ui.define([
], function () {
    "use strict";
    /* eslint-disable */
    var module = {};
    var exports = {};

// DO NOT EDIT THE CODE BELOW!

/*!
 * SAP XHR Library v2.1.0
 * (c) Copyright 2013-2019 SAP SE or an SAP affiliate company.
*/
(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.xhrlib = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
var ChannelPrototype;

/**
 * @classdesc Request pipeline enhancement
 * @desc Request channel
 * @param {XMLHttpRequest} xhr Parent request
 * @param {string} method HTTP method
 * @param {string} url Request URL
 * @param {boolean} async Asynchronous flag
 * @param {string} username
 * @param {string} password
 * @properties {object[]} filters Registered channel filters
 * @constructor
 */
function Channel(xhr, method, url, async, username, password) {
    this.filters = [];
    this.xhr = xhr;
    this.method = method;
    this.url = url;
    this.async = !!async;
    if (username !== undefined) {
        this.username = username;
    }
    if (password !== undefined) {
        this.password = password;
    }
}
module.exports = Channel;
ChannelPrototype = Channel.prototype;
ChannelPrototype._process = function (method) {
    var filters, filter, i, n;
    filters = this.filters;
    n = filters.length;
    for (i = 0; i < n; ++i) {
        filter = filters[i];
        if (typeof filter[method] === "function") {
            filter[method](this);
        }
    }
};
ChannelPrototype.aborting = function () {
    this._process("aborting");
};
ChannelPrototype.aborted = function () {
    this._process("aborted");
};
ChannelPrototype.opening = function () {
    this._process("opening");
};
ChannelPrototype.opened = function () {
    this._process("opened");
};
ChannelPrototype.sending = function () {
    this._process("sending");
};
ChannelPrototype.sent = function () {
    this._process("sent");
};
ChannelPrototype.reopening = function () {
    this._process("reopening");
};
ChannelPrototype["catch"] = function (error) {
    var filters, i, n;
    filters = this.filters;
    n = filters.length;
    for (i = 0; i < n; ++i) {
        if (typeof filters[i]["catch"] === "function") {
            try {
                filters[i]["catch"](error, this);
                error = null;
                break;
            }
            catch (err) {
                error = err;
            }
        }
    }
    if (error) {
        throw error;
    }
};
},{}],2:[function(require,module,exports){
"use strict";
var ChannelFactoryPrototype;
var Channel = require("./Channel.js");
var IgnoreList = require("./IgnoreList.js");

/**
 * @classdesc ChannelFactory creates the channel enhancing an XMLHttpRequest
 * @desc ChannelFactory Built-in channel factory
 * @constructor
 */
function ChannelFactory() {
    this._filterFactories = [];
    this.ignore = new IgnoreList();
}
module.exports = ChannelFactory;
ChannelFactoryPrototype = ChannelFactory.prototype;

function isFactory(x) {
    var t;
    t = typeof x;
    return (t === "function") || ((t === "object") && (x !== null) && (typeof x.addFilter === "function"));
}
function invokeFactory(x, channel) {
    if (typeof x === "function") {
        x(channel);
    }
    else {
        x.addFilter(channel);
    }
}
ChannelFactoryPrototype.reset = function () {
    this._filterFactories = [];
    this.ignore = new IgnoreList();
};
ChannelFactoryPrototype.addFilterFactory = function (factory) {
    var add, factories, i, n;
    if (!isFactory(factory)) {
        throw new TypeError("addFilterFactory expects a FilterFactory or a function parameter");
    }
    factories = this._filterFactories;
    add = true;
    n = factories.length;
    for (i = 0; i < n; ++i) {
        if (factories[i] === factory) {
            add = false;
            break;
        }
    }
    if (add) {
        this._filterFactories.push(factory);
    }
};
ChannelFactoryPrototype.removeFilterFactory = function (factory) {
    var factories, i, n;
    factories = this._filterFactories;
    n = factories.length;
    for (i = 0; i < n; ++i) {
        if (factories[i] === factory) {
            factories.splice(i, 1);
            break;
        }
    }
};
ChannelFactoryPrototype.getFilterFactories = function () {
    return this._filterFactories.slice();
};

/**
 * Creates the channel for a given HTTP request
 * @param xhr
 * @param method
 * @param url
 * @param async
 * @param username
 * @param password
 * @returns {Channel}
 */
ChannelFactoryPrototype.create = function (xhr, method, url, async, username, password) {
    var channel, factories, i, n;
    channel = new Channel(xhr, method, url, async, username, password);
    if (!this.ignore.ignored(url)) {
        factories = this._filterFactories;
        n = factories.length;
        for (i = 0; i < n; ++i) {
            invokeFactory(factories[i], channel);
        }
    }
    return channel;
};
},{"./Channel.js":1,"./IgnoreList.js":7}],3:[function(require,module,exports){
"use strict";

var util = require("./util.js");
var ConsoleLoggerPrototype, output;
var Level = {
    error: 10,
    warn: 20,
    info: 30,
    debug: 40
};

if (window.console && typeof window.console.log === "function") {
    output = {
        error: console.error ? console.error : console.log,
        warn: console.warn ? console.warn : console.log,
        info: console.log,
        debug: console.log
    };
}
else {
    output = {};
    output.error = output.warn = output.info = output.debug = function () {
    };
}

function ConsoleLogger(name, level) {
    this.name = name;
    this.setLevel(level);
}
module.exports = ConsoleLogger;
ConsoleLoggerPrototype = ConsoleLogger.prototype;

ConsoleLoggerPrototype.format = function (msg, severity) {
    return util.time() + " " + this.name + " [" + severity.toUpperCase() + "] " + msg;
};
ConsoleLoggerPrototype.setLevel = function (level) {
    if (level) {
        level = (typeof level === "number" ? ~~level : Level[level]);
    }
    this.level = level || Level.warn;
};
ConsoleLoggerPrototype.error = function (msg) {
    if (this.level >= Level.error) {
        output.error(this.format(msg, "error"));
    }
};
ConsoleLoggerPrototype.warning = function (msg) {
    if (this.level >= Level.warn) {
        output.warn(this.format(msg, "warn"));
    }
};
ConsoleLoggerPrototype.info = function (msg) {
    if (this.level >= Level.info) {
        output.info(this.format(msg, "info"));
    }
};
ConsoleLoggerPrototype.debug = function (msg) {
    if (this.level >= Level.debug) {
        output.debug(this.format(msg, "debug"));
    }
};

},{"./util.js":20}],4:[function(require,module,exports){
"use strict";
var events = require("./events.js");
var EventHandlers = require("./EventHandlers.js");
var DefaultLogonFrameProviderPrototype;
var AUTH_REQUIRED = "authenticationrequired";

/**
 * @classdesc Default implementation for creating, showing, and destroying a logon iframe.
 * @desc DefaultLogonFrameProvider
 * @constructor
 */
function DefaultLogonFrameProvider() {
    this.prefix = "xhrlibFrame" + Date.now().toString(36);
    this.handlers = new EventHandlers([AUTH_REQUIRED]);
}
module.exports = DefaultLogonFrameProvider;
DefaultLogonFrameProviderPrototype = DefaultLogonFrameProvider.prototype;

DefaultLogonFrameProvider.frameCounter = 0;

DefaultLogonFrameProviderPrototype.addEventListener = function (type, callback) {
    this.handlers.add(type, callback);
};
DefaultLogonFrameProviderPrototype.removeEventListener = function (type, callback) {
    this.handlers.remove(type, callback);
};
DefaultLogonFrameProviderPrototype.dispatchAuthenticationRequired = function () {
    var self = this, event = events.createEvent(AUTH_REQUIRED);
    setTimeout(function () {
        self.handlers.dispatch(event);
    }, 0);
};
DefaultLogonFrameProviderPrototype.create = function () {
    var frameId, onReadyStateChanged, self = this;
    this.destroy();
    // don't create frame if simple reload mode is used
    if (this.handlers.hasSubscribers(AUTH_REQUIRED)) {
        this.dispatchAuthenticationRequired();
        return null;
    }
    DefaultLogonFrameProvider.frameCounter += 1;
    frameId = this.prefix + DefaultLogonFrameProvider.frameCounter;
    this.frame = document.createElement("iframe");
    this.frame.id = frameId;
    this.frame.style.display = "none";
    if (document.readyState === "complete") {
        document.body.appendChild(this.frame);
    }
    else {
        // wait until document has been loaded
        onReadyStateChanged = function () {
            if (document.readyState === "complete") {
                document.body.appendChild(self.frame);
                events.removeEventListener(document, "readystatechange", onReadyStateChanged);
            }
        };
        events.addEventListener(document, "readystatechange", onReadyStateChanged);
    }
    return this.frame;
};
DefaultLogonFrameProviderPrototype.destroy = function () {
    if (this.frame) {
        document.body.removeChild(this.frame);
        this.frame = null;
    }
};
DefaultLogonFrameProviderPrototype.show = function (forceDisplay) {
    var frame = this.frame;
    if (!forceDisplay && this.handlers.hasSubscribers(AUTH_REQUIRED)) {
        this.dispatchAuthenticationRequired();
    }
    else if (frame) {
        frame.style.display = "block";
        frame.style.position = "absolute";
        frame.style.top = 0;
        frame.style.left = 0;
        frame.style.width = "100%";
        frame.style.height = "100%";
        frame.style.zIndex = 99999;
        frame.style.border = 0;
        frame.style.background = "white"; // Note: else it is transparent!
        setTimeout(function () {
            try {
                frame.contentWindow.focus();
            }
            catch (err) {
                void err;
            }
        }, 100);
    }
};
},{"./EventHandlers.js":5,"./events.js":16}],5:[function(require,module,exports){
"use strict";
var EventHandlersPrototype;
var xhrLogger = require("./Log.js").logger;
function EventHandlers(events) {
    var i, n;
    n = events.length;
    for (i = 0; i < n; ++i) {
        this["_" + events[i]] = [];
    }
    this.subscriptions = {};
    this.bufferedEvents = [];
}
module.exports = EventHandlers;

function isHandler(x) {
    return x && (typeof x === "function" || typeof x.handleEvent === "function");
}
function fireEvent(x, e, logger) {
    try {
        if (typeof x === "function") {
            // DOM4: if listener's callback is a Function object, its callback "this" value is the event's currentTarget attribute value.
            return x.call(e.currentTarget, e);
        }
        else {
            return x.handleEvent(e);
        }
    }
    catch (error) {
        if (logger) {
            logger.warning("Exception in " + e.type + " event handler: " + error.message + "\n" + error.stack);
        }
        throw error;
    }
}

/**
 * Checks whether the passed argument is a valid handler, i.e. a function or an object exposing a "handleEvent" function
 * @function
 * @param {*} handler
 */
EventHandlers.isHandler = isHandler;

/**
 * Invokes an event handler
 * @function
 * @param {object|function} handler Event handler
 * @param {Event} event
 * @param {Logger} [logger]
 * @type {fireEvent}
 */
EventHandlers.fireEvent = fireEvent;

EventHandlersPrototype = EventHandlers.prototype;
EventHandlersPrototype.add = function (type, handler) {
    var add, h, i, n;
    if (!isHandler(handler)) {
        throw new TypeError("Invalid event handler");
    }
    h = this["_" + type];
    if (h) {
        add = true;
        n = h.length;
        for (i = 0; i < n; ++i) {
            if (h[i] === handler) {
                add = false;
                break;
            }
        }
        if (add) {
            h.push(handler);
        }
    }
    return add;
};
EventHandlersPrototype.remove = function (type, handler) {
    var h, i, n, removed = false;
    if (isHandler(handler)) {
        h = this["_" + type];
        if (h) {
            n = h.length;
            for (i = 0; i < n; ++i) {
                if (h[i] === handler) {
                    removed = true;
                    if (n === 1) {
                        this["_" + type] = [];
                    }
                    else {
                        h.splice(i, 1);
                    }
                    break;
                }
            }
        }
    }
    return removed;
};
EventHandlersPrototype.dispatch = function (event) {
    var i, n, type = event.type, h = this["_" + type];
    if (!h || !h.length) {
        return;
    }

    if (this.suspend) {
        this.bufferedEvents.push(event);
    }
    else {
        h = h.slice(); // Copy handlers in case an event handler would mess with the subscriptions
        n = h.length;
        for (i = 0; i < n; ++i) {
            fireEvent(h[i], event, xhrLogger);
        }
    }
};
EventHandlersPrototype.clearEvents = function () {
    this.bufferedEvents = [];
};
EventHandlersPrototype.releaseEvents = function () {
    var k, n, events;
    events = this.bufferedEvents;
    n = events.length;
    if (n > 0) {
        this.clearEvents();
        for (k = 0; k < n; ++k) {
            this.dispatch(events[k]);
        }
    }
};
EventHandlersPrototype.hasSubscribers = function (type) {
    var h = this["_" + type];
    return (h && h.length > 0);
};
EventHandlersPrototype.subscribed = function (type) {
    return (this.subscriptions[type] ? true : false);
};
EventHandlersPrototype.subscribe = function (type) {
    this.subscriptions[type] = true;
};
EventHandlersPrototype.unsubscribe = function (type) {
    delete this.subscriptions[type];
};

},{"./Log.js":8}],6:[function(require,module,exports){
// Frame logon management
"use strict";

var DefaultLogonFrameProvider = require("./DefaultLogonFrameProvider.js");
var LogonManager = require("./LogonManager.js");
var XHRLogonManager = require("./XHRLogonManager.js");
var xhrLogger = require("./Log.js").logger;
var UrlObject = require("./UrlObject.js");
var UrlTimeout = require("./UrlTimeout.js");
var frameLogonManager, FrameLogonManagerPrototype;

/**
 * @classdesc Simple frame logon management
 * @desc FrameLogonManager
 * @param {LogonManager} logonManager
 * @constructor
 * @property logonFrameProvider Registered frame provider
 */
function FrameLogonManager() {
    xhrLogger.debug("Creating FrameLogonManager");
    this._lfp = new DefaultLogonFrameProvider();
    this._timeout = new UrlTimeout(FrameLogonManager.defaultTimeout);
}
module.exports = FrameLogonManager;
FrameLogonManagerPrototype = FrameLogonManager.prototype;

/**
 * Default frame timeout to allow for silent re-authentication (e.g. browser still has a valid Identity Provider session)
 * @type {number}
 */
FrameLogonManager.defaultTimeout = 600;

/**
 * Returns the FrameLogonManager singleton and creates it if needed
 * @param {boolean} [noCreate] Does not create the FrameLogonManager instance if it does not exist
 * @returns {FrameLogonManager}
 */
FrameLogonManager.getInstance = function (noCreate) {
    if (!frameLogonManager && !noCreate) {
        frameLogonManager = new FrameLogonManager();
    }
    return frameLogonManager;
};

/**
 * Starts FrameLogonManager singleton
 */
FrameLogonManager.start = function () {
    FrameLogonManager.getInstance().start();
};

/**
 * Shuts FrameLogonManager singleton down
 */
FrameLogonManager.shutdown = function () {
    if (frameLogonManager) {
        frameLogonManager.shutdown();
        frameLogonManager = null;
    }
};

Object.defineProperties(FrameLogonManagerPrototype, {
    logonFrameProvider: {
        get: function () {
            return this._lfp;
        },
        set: function (lfp) {
            if (lfp) {
                this._lfp = lfp;
            }
            else {
                // Setting null or undefined will reset to the default LogonFrameProvider
                this._lfp = new DefaultLogonFrameProvider();
            }
        }
    }
});
/**
 * Startup
 */
FrameLogonManagerPrototype.start = function () {
    var logonManager = LogonManager.getInstance();
    logonManager.addEventListener(LogonManager.LogonEvent.LOGON_COMPLETE, this);
    logonManager.addEventListener(LogonManager.LogonEvent.LOGON_FAILED, this);
    logonManager.registerAuthHandler(XHRLogonManager.logonScheme(XHRLogonManager.Scheme.IFRAME), this);
};
/**
 * Shutdown
 */
FrameLogonManagerPrototype.shutdown = function () {
    var logonManager = LogonManager.getInstance();
    this.cancelLogon();
    logonManager.removeEventListener(LogonManager.LogonEvent.LOGON_COMPLETE, this);
    logonManager.removeEventListener(LogonManager.LogonEvent.LOGON_FAILED, this);
    logonManager.unregisterAuthHandler(XHRLogonManager.logonScheme(XHRLogonManager.Scheme.IFRAME), this);
};
/**
 * Returns the timeout applying for a given URL
 * @param {string} url
 * @returns {number}
 */
FrameLogonManagerPrototype.getTimeout = function (url) {
    return this._timeout.getTimeout(url);
};
/**
 * Defines or reset a custom timeout for a given URL
 * @param {string} url
 * @param {number} [value] Timeout in milliseconds. If value is not set, timeout is reset for url
 */
FrameLogonManagerPrototype.setTimeout = function (url, value) {
    this._timeout.setTimeout(url, value);
};
FrameLogonManagerPrototype.getFrameLoadHandler = function (provider, frameId, timeout) {
    var loadHandler, cancelId;
    timeout = timeout || this.defaultTimeout;
    loadHandler = function () {
        if (cancelId) {
            // Frame has loaded a new page, reset previous timer
            clearTimeout(cancelId);
        }
        cancelId = setTimeout(function () {
            provider.show();
        }, timeout);
    };
    return loadHandler;
};
FrameLogonManagerPrototype.onLogon = function (request) {
    var url, provider, frame, timeout;
    this.onLogonEnd();
    xhrLogger.debug("Processing iframe logon for realm " + request.realm);
    timeout = this.getTimeout(request.channel.url);
    url = new UrlObject(request.channel.url);
    url.setParameter("xhr-logon", "iframe");
    provider = this.logonFrameProvider;
    frame = provider.create();
    if (frame) {
        if (!frame.onload) {
            frame.onload = this.getFrameLoadHandler(provider, frame.id, timeout);
        }
        frame.xhrTimeout = timeout;
        frame.src = url.href;
    }
    this.pending = {provider: provider, realm: request.realm};
};
FrameLogonManagerPrototype.onLogonEnd = function (realm) {
    if (this.pending && (!arguments.length || realm === this.pending.realm)) {
        this.pending.provider.destroy();
        this.pending = undefined;
    }
};
FrameLogonManagerPrototype.cancelLogon = function () {
    if (this.pending) {
        xhrLogger.debug("Cancelling logon for realm " + this.pending.realm);
        LogonManager.getInstance().abortLogon(this.pending.realm);
        this.onLogonEnd(this.pending.realm);
    }
};
FrameLogonManagerPrototype.handleEvent = function (event) {
    var request;
    switch (event.type) {
        case LogonManager.LogonEvent.LOGON:
            request = event.request;
            if (request) {
                this.onLogon(request);
                return true;
            }
            break;
        case LogonManager.LogonEvent.LOGON_COMPLETE:
            this.onLogonEnd(event.response.realm);
            break;
        case LogonManager.LogonEvent.LOGON_FAILED:
            this.onLogonEnd(event.response.realm);
            break;
    }
    return false;
};

},{"./DefaultLogonFrameProvider.js":4,"./Log.js":8,"./LogonManager.js":9,"./UrlObject.js":11,"./UrlTimeout.js":12,"./XHRLogonManager.js":15}],7:[function(require,module,exports){
"use strict";
var IgnoreListPrototype;
/**
 * @classdesc IgnoreList maintains a list ignore rules as prefixes, regular expressions or matching functions.
 * @desc IgnoreList constructor
 * @constructor
 */
function IgnoreList() {
    this.clear();
}
module.exports = IgnoreList;
IgnoreListPrototype = IgnoreList.prototype;

/**
 * Adds an ignore rule
 * @param {string|RegExp|function} rule Ignore rule
 * @throws {TypeError} Throws a TypeError for an unsupported rule type
 */
IgnoreListPrototype.add = function (rule) {
    switch (typeof rule) {
        case "string":
            this.p.push(rule);
            break;
        case "object":
            if (rule instanceof RegExp) {
                this.r.push(rule);
            }
            else {
                throw new TypeError("Unsupported ignore rule type");
            }
            break;
        case "function":
            this.f.push(rule);
            break;
        default:
            throw new TypeError("Unsupported ignore rule type");
    }
    this.empty = false;
};
/**
 * Tests whether an item should be ignored
 * @param {string} item Item to test
 * @returns {boolean}
 */
IgnoreListPrototype.ignored = function (item) {
    var ignore = false;
    if (!this.empty) {
        ignore = this._prefix(item) || this._regexp(item) || this._function(item);
    }
    return ignore;
};
/**
 * Clears all rules
 */
IgnoreListPrototype.clear = function () {
    this.empty = true;
    this.p = [];
    this.r = [];
    this.f = [];
};
/**
 * Tests against registered prefixes
 * @param {string} item
 * @returns {boolean}
 * @private
 */
IgnoreListPrototype._prefix = function (item) {
    var filters, k, n, res;
    if (!item) {
        return false;
    }
    res = false;
    filters = this.p;
    n = filters.length;
    for (k = 0; k < n; ++k) {
        if (item.startsWith(filters[k])) {
            res = true;
            break;
        }
    }
    return res;
};
/**
 * Tests against registered prefixes
 * @param item
 * @returns {boolean}
 * @private
 */
IgnoreListPrototype._regexp = function (item) {
    var filters, k, n, res;
    res = false;
    filters = this.r;
    n = filters.length;
    for (k = 0; k < n; ++k) {
        if (filters[k].test(item)) {
            res = true;
            break;
        }
    }
    return res;
};
/**
 * Tests against registered matchers
 * @param item
 * @returns {boolean}
 * @private
 */
IgnoreListPrototype._function = function (item) {
    var filters, k, n, res;
    res = false;
    filters = this.f;
    n = filters.length;
    for (k = 0; k < n; ++k) {
        try {
            if (filters[k](item)) {
                res = true;
                break;
            }
        }
        // eslint-disable-next-line no-empty
        catch (e) {}
    }
    return res;
};
},{}],8:[function(require,module,exports){
"use strict";
var ConsoleLogger = require("./ConsoleLogger.js");
var xhrLogger, defaultLogger, logMethods = ["error", "warning", "info", "debug"];
defaultLogger = new ConsoleLogger("sap.xhrlib");

function Log(logger) {
    this.logger = logger;
}
module.exports = Log;
function hasMethods(x, methods) {
    var i, n = methods.length;
    for (i = 0; i < n; ++i) {
        if (typeof x[methods[i]] !== "function") {
            return false;
        }
    }
    return true;
}
function isLogger(x) {
    return (x && (typeof x === "object") && hasMethods(x, logMethods));
}
Object.defineProperty(Log, "logger", {
    get: function () {
        return xhrLogger;
    },
    set: function (x) {
        if (!x) {
            xhrLogger.logger = defaultLogger;
        }
        else if (isLogger(x)) {
            xhrLogger.logger = x;
        }
    }
});
logMethods.forEach(function (method) {
    Log.prototype[method] = function (msg) {
        try {
            return this.logger[method](msg);
        }
            // eslint-disable-next-line no-empty
        catch (e) {
        }
    };
});
Log.setLevel = function (level) {
    if (typeof xhrLogger.logger.setLevel === "function") {
        xhrLogger.logger.setLevel(level);
    }
};
xhrLogger = new Log(defaultLogger);

},{"./ConsoleLogger.js":3}],9:[function(require,module,exports){
"use strict";
require("./xhr.js");
var createEvent = require("./events.js").createEvent;
var EventHandlers = require("./EventHandlers.js");
var xhrLogger = require("./Log.js").logger;
var LogonEvent, Status, logonManager, LogonManagerPrototype;

Status = {
    UNAUTHENTICATED: 0,
    PENDING: 1,
    AUTHENTICATED: 2
};

LogonEvent = {
    LOGON: "logon",
    LOGON_COMPLETE: "logoncomplete",
    LOGON_FAILED: "logonfailed",
    LOGON_ABORTED: "logonaborted"
};

/**
 * @classdesc LogonManager handles unauthenticated XMLHttpRequest
 * @desc LogonManager constructor
 * @constructor
 * @property {string[]} schemes List of authentication schemes with registered handlers
 */
function LogonManager() {
    xhrLogger.info("Creating Logon Manager");
    this.queue = [];
    this.realms = {};
    this.authHandlers = {};
    this._schemes = [];
    this.handlers = new EventHandlers([LogonEvent.LOGON, LogonEvent.LOGON_ABORTED, LogonEvent.LOGON_COMPLETE, LogonEvent.LOGON_FAILED]);
}
module.exports = LogonManager;

/**
 * Returns the LogonManager singleton and creates it if needed
 * @param {boolean} [noCreate] Does not create the LogonManager instance if it does not exist
 * @returns {LogonManager}
 */
LogonManager.getInstance = function (noCreate) {
    if (!logonManager && !noCreate) {
        logonManager = new LogonManager();
    }
    return logonManager;
};

/**
 * Stops and destroys the LogonManager singleton
 */
LogonManager.shutdown = function () {
    if (logonManager) {
        logonManager.shutdown();
        logonManager = undefined;
    }
};

/**
 * Logon Event enumeration
 * @type {{LOGON: string, LOGON_COMPLETE: string, LOGON_FAILED: string, LOGON_ABORTED: string}}
 */
LogonManager.LogonEvent = LogonEvent;

/**
 * Authentication Status
 * @type {{UNAUTHENTICATED: number, PENDING: number, AUTHENTICATED: number}}
 */
LogonManager.Status = Status;

LogonManagerPrototype = LogonManager.prototype;
Object.defineProperties(LogonManagerPrototype, {
    schemes: {
        get: function () {
            return this._schemes.slice();
        }
    }
});

LogonManagerPrototype._collectSchemes = function () {
    var scheme, schemes = [], authHandlers = this.authHandlers;
    for (scheme in authHandlers) {
        if (authHandlers.hasOwnProperty(scheme)) {
            schemes.push(scheme);
        }
    }
    this._schemes = schemes.sort();
};

/**
 * Registers an event handler
 * @param {LogonEvent} type Event type
 * @param {object|function} handler EventHandler: either a function or an object exposing an handleEvent function
 */
LogonManagerPrototype.addEventListener = function (type, handler) {
    this.handlers.add(type, handler);
};
/**
 * Unregisters an event handler
 * @param {LogonEvent} type Event type
 * @param {object|function} callback EventHandler: either a function or an object exposing an handleEvent function
 */
LogonManagerPrototype.removeEventListener = function (type, handler) {
    this.handlers.remove(type, handler);
};

/**
 * Registers an authentication handler for a given authentication scheme
 * @param {string} scheme
 * @param {object|function} handler
 * @returns {boolean}
 */
LogonManagerPrototype.registerAuthHandler = function (scheme, handler) {
    var i, n, handlers = this.authHandlers[scheme], add = true;
    if (!EventHandlers.isHandler(handler)) {
        throw new TypeError("Invalid authentication handler");
    }
    if (handlers) {
        for (i = 0, n = handlers.length; i < n; ++i) {
            if (handlers[i] === handler) {
                add = false;
                break;
            }
        }
        if (add) {
            handlers.push(handler);
        }
    }
    else {
        handlers = [handler];
        this.authHandlers[scheme] = handlers;
        this._collectSchemes();
    }
    return add;
};

/**
 * Unregisters an authentication handler for a given authentication scheme
 * @param {string} scheme
 * @param {object|function} handler
 * @returns {boolean}
 */
LogonManagerPrototype.unregisterAuthHandler = function (scheme, handler) {
    var i, n, handlers = this.authHandlers[scheme], removed = false;
    if (!EventHandlers.isHandler(handler)) {
        return false;
    }
    if (handlers) {
        for (i = 0, n = handlers.length; i < n; ++i) {
            if (handlers[i] === handler) {
                removed = true;
                if (n === 1) {
                    delete this.authHandlers[scheme];
                    this._collectSchemes();
                }
                else {
                    handlers.splice(i, 1);
                }
                break;
            }
        }
    }
    return removed;
};

/**
 * Unregisters all handlers for a given scheme or for all schemes
 * @param {string} [scheme]
 */
LogonManagerPrototype.unregisterAllHandlers = function (scheme) {
    if (scheme) {
        delete this.authHandlers[scheme];
    }
    else {
        this.authHandlers = {};
    }
    this._collectSchemes();
};

/**
 * Returns the list of registered authentication handlers for a given scheme
 * @param {string} scheme
 * @returns {EventHandler[]}
 */
LogonManagerPrototype.getAuthHandlers = function (scheme) {
    var handlers = this.authHandlers[scheme];
    var allHandlers = this.authHandlers["*"];
    if (handlers) {
        return allHandlers ? handlers.concat(allHandlers) : handlers.slice();
    }
    return allHandlers || [];
};


/**
 * Checks whether some handler has been registered for an authentication scheme
 * @param scheme
 * @returns {boolean}
 */
LogonManagerPrototype.isSchemeHandled = function (scheme) {
    return this.getAuthHandlers(scheme).length > 0;
};

/**
 * Dispatches a Logon event
 * @param {Event} event
 * @private
 */
LogonManagerPrototype.dispatchEvent = function (event) {
    this.handlers.dispatch(event);
};
LogonManagerPrototype.createLogonEvent = function (request) {
    var event = createEvent(LogonEvent.LOGON);
    event.request = request;
    return event;
};
LogonManagerPrototype.dispatchLogonEvent = function (request) {
    var event = this.createLogonEvent(request);
    this.dispatchEvent(event);
};
LogonManagerPrototype.dispatchLogonCompletedEvent = function (response) {
    var event = createEvent(LogonEvent.LOGON_COMPLETE);
    event.response = response;
    this.dispatchEvent(event);
};
LogonManagerPrototype.dispatchLogonFailedEvent = function (response) {
    var event = createEvent(LogonEvent.LOGON_FAILED);
    event.response = response;
    this.dispatchEvent(event);
};
LogonManagerPrototype.dispatchLogonAbortedEvent = function (realm) {
    var event = createEvent(LogonEvent.LOGON_ABORTED);
    event.realm = realm;
    this.dispatchEvent(event);
};

/**
 *
 * @param request
 * @returns {boolean}
 * @private
 */
LogonManagerPrototype.dispatchLogonRequest = function (request) {
    var i, n, handled = false, event = this.createLogonEvent(request), handlers = this.getAuthHandlers(request.scheme);
    if (handlers) {
        for (i = 0, n = handlers.length; i < n; ++i) {
            handled = EventHandlers.fireEvent(handlers[i], event, xhrLogger);
            if (handled) {
                break;
            }
        }
    }
    return handled;
};

/**
 * Returns authentication status for an identity realm
 * @param name
 * @returns {Status}
 */
LogonManagerPrototype.getAuthenticationStatus = function (name) {
    return this.realms[name] || Status.UNAUTHENTICATED;
};

/**
 * Tests if a given XHR request has already been queued for authentication
 * @param xhr
 * @returns {boolean}
 */
LogonManagerPrototype.isQueued = function (xhr) {
    var i, n, req;
    if (this.pending && this.pending.channel && this.pending.channel.xhr === xhr) {
        return true;
    }
    for (i = 0, n = this.queue.length; i < n; ++i) {
        req = this.queue[i];
        if (req.channel && req.channel.xhr === xhr) {
            return true;
        }
    }
    return false;
};

/**
 * Triggers a logon process
 * @param {LogonRequest} request
 */
LogonManagerPrototype.requestLogon = function (request) {
    var handled, realm;
    if (!request || !request.channel || !request.scheme) {
        xhrLogger.warning("Ignoring invalid Logon request");
        return;
    }
    if (this.isQueued(request.channel.xhr)) {
        xhrLogger.debug("Ignoring authentication request for already queued request " + request.channel.url);
        return;
    }
    xhrLogger.info("Authentication requested for " + request.channel.url + " with scheme " + request.scheme);
    this.dispatchLogonEvent(request);
    if (this.isSchemeHandled(request.scheme)) {
        // Initiate Logon sequence only if someone handles it :-)
        realm = request.realm;
        if (typeof realm !== "string") {
            realm = "" + realm;
        }
        if (this.pending) {
            xhrLogger.debug("Pending authentication process, queueing request");
            if (this.getAuthenticationStatus(realm) === Status.AUTHENTICATED) {
                this.realms[realm] = Status.UNAUTHENTICATED;
            }
            this.queue.push(request);
            handled = true;
        }
        else {
            xhrLogger.debug("Dispatching authentication request");
            this.realms[realm] = Status.PENDING;
            this.pending = request;
            handled = this.dispatchLogonRequest(request);
        }
    }
    else {
        xhrLogger.info("No authentication handler registered for scheme " + request.scheme);
    }
    if (!handled) {
        xhrLogger.warning("Unsupported authentication request for scheme " + request.scheme);
        if (this.pending === request) {
            this.pending = undefined;
        }
        this.abort([request]);
        // Process awaiting requests
        if (this.queue.length > 0) {
            this.requestLogon(this.queue.shift());
        }
    }
};

/**
 * Signals completion of a pending authentication
 * @param {LogonResponse} response
 * @param {string} response.realm Identity realm for which completion is reported
 * @param {boolean} response.success Authentication success
 */
LogonManagerPrototype.logonCompleted = function (response) {
    var realm, success, queue, processQueue, waitingQueue, i, n, req;
    realm = response.realm;
    queue = this.queue;
    processQueue = [];
    waitingQueue = [];
    success = response.success;
    this.realms[realm] = (success ? Status.AUTHENTICATED : Status.UNAUTHENTICATED);
    if (this.pending && (realm === this.pending.realm)) {
        processQueue.push(this.pending);
        this.pending = undefined;
    }
    n = queue.length;
    for (i = 0; i < n; ++i) {
        req = queue[i];
        if (req.realm === realm) {
            processQueue.push(req);
        }
        else {
            waitingQueue.push(req);
        }
    }
    this.queue = waitingQueue;
    if (processQueue.length > 0) {
        if (success) {
            xhrLogger.info("Authentication succeeded for realm " + realm + ", repeating requests.");
            this.retry(processQueue);
        }
        else {
            xhrLogger.warning("Authentication failed for realm " + realm);
            this.abort(processQueue);
        }
    }

    // Fire events to complete current logon process before initiating a new one
    if (success) {
        this.dispatchLogonCompletedEvent(response);
    }
    else {
        this.dispatchLogonFailedEvent(response);
    }

    // Process awaiting requests
    if (!this.pending && this.queue.length > 0) {
        this.requestLogon(this.queue.shift());
    }
};

/**
 * Abort Logon process for a given identity realm.
 * @param {string} [realm] Identity realm to abort (default to the pending authentication one)
 */
LogonManagerPrototype.abortLogon = function (realm) {
    var queue, processQueue, waitingQueue, i, n, req;
    if (!realm && this.pending) {
        realm = this.pending.realm;
    }
    if (realm) {
        queue = this.queue;
        processQueue = [];
        waitingQueue = [];
        this.realms[realm] = Status.UNAUTHENTICATED;
        if (this.pending) {
            if (realm === this.pending.realm) {
                processQueue.push(this.pending);
            }
            else {
                queue.push(this.pending);
            }
        }
        this.pending = undefined;
        n = queue.length;
        for (i = 0; i < n; ++i) {
            req = queue[i];
            if (req.realm === realm) {
                processQueue.push(req);
            }
            else {
                waitingQueue.push(req);
            }
        }
        this.queue = waitingQueue;
        if (processQueue.length > 0) {
            xhrLogger.warning("Authentication aborted for realm " + realm);
            this.abort(processQueue);
        }

        // Fire abort event(s)
        this.dispatchLogonAbortedEvent(realm);
    }
    else {
        xhrLogger.info("No pending authentication, ignoring abort");
    }

    // Process awaiting requests
    if (this.queue.length > 0) {
        this.requestLogon(this.queue.shift());
    }
};

/**
 * Repeats XHR requests
 * @param queue
 */
LogonManagerPrototype.retry = function (queue) {
    var i, n, channel, xhr;
    n = queue.length;
    for (i = 0; i < n; ++i) {
        try {
            channel = queue[i].channel;
            if (channel.async) {
                xhr = channel.xhr;
                xhr.repeat(); // renew request
            }
        }
        catch (error) {
            xhrLogger.warning("Error while repeating request: " + error.message);
            throw error;
        }
    }
};

/**
 * Resumes suspended XHR requests
 * @param queue
 */
LogonManagerPrototype.abort = function (queue) {
    var i, n, channel, xhr;
    n = queue.length;
    for (i = 0; i < n; ++i) {
        try {
            channel = queue[i].channel;
            if (channel.async) {
                xhr = channel.xhr;
                xhr.resumeEvents(true); // authentication failed, propagate buffered initial events
            }
        }
        catch (error) {
            xhrLogger.warning("Error while aborting request: " + error.message);
            throw error;
        }
    }
};

/**
 * Resumes all suspended requests
 */
LogonManagerPrototype.abortAll = function () {
    var abort;
    abort = this.queue;
    this.queue = [];
    if (this.pending) {
        abort.push(this.pending);
        this.pending = undefined;
    }
    this.abort(abort);
};

/**
 * @private
 */
LogonManagerPrototype.shutdown = function () {
    xhrLogger.info("Logon Manager shutdown");
    this.abortAll();
};

},{"./EventHandlers.js":5,"./Log.js":8,"./events.js":16,"./xhr.js":21}],10:[function(require,module,exports){
"use strict";
var OpenWindowAlertPrototype;

/**
 * @classdesc Window open dialog to avoid being blocked by pop-up blocker
 * @constructor
 */
function OpenWindowAlert() {
}

module.exports = OpenWindowAlert;
OpenWindowAlertPrototype = OpenWindowAlert.prototype;

function createHeader() {
    var header, text;
    header = document.createElement("div");
    header.style.fontSize = "1.25rem";
    header.style.textAlign = "center";
    header.style.marginBottom = "16px";
    header.style.color = "#003283";
    text = document.createTextNode("Authentication required");
    header.appendChild(text);
    return header;
}

function createButtons(onOpen, onCancel) {
    var block, loginButton, loginText, cancelButton, cancelText;
    block = document.createElement("div");
    block.style.width = "256px";
    block.style.margin = "0 auto";
    loginButton = document.createElement("button");
    setTimeout(function () {
        loginButton.focus();
    }, 300);
    loginButton.onclick = function () {
        onOpen();
    };
    loginButton.style.width = "120px";
    loginButton.style.height = "32px";
    loginButton.style.color = "#ffffff";
    loginButton.style.backgroundColor = "#5496cd";
    loginButton.style.border = "1px solid #367db8";
    loginButton.style.borderRadius = "4px";
    loginButton.style.testShadow = "0 1px #000000";
    loginButton.style.outline = "none";
    loginButton.onblur = function () {
        loginButton._focus = false;
        loginButton.style.testShadow = "0 1px #000000";
        loginButton.style.backgroundColor = "#5496cd";
        loginButton.style.borderColor = "#367db8";
    };
    loginButton.onfocus = function () {
        loginButton._focus = true;
        loginButton.style.testShadow = "none";
        loginButton.style.backgroundColor = "#427cac";
        loginButton.style.borderColor = "#427cac";
    };
    loginButton.onmouseover = function () {
        if (!loginButton._focus) {
            loginButton.style.backgroundColor = "#367db8";
            loginButton.style.borderColor = "#367db8";
        }
    };
    loginButton.onmouseout = function () {
        if (!loginButton._focus) {
            loginButton.style.backgroundColor = "#5496cd";
            loginButton.style.borderColor = "#367db8";
        }
    };
    loginText = document.createTextNode("To sign in");
    loginButton.appendChild(loginText);

    cancelButton = document.createElement("button");
    cancelButton.type = "button";
    cancelButton.onclick = function () {
        onCancel();
    };
    cancelButton.style.marginLeft = "16px";
    cancelButton.style.width = "120px";
    cancelButton.style.height = "32px";
    cancelButton.style.color = "#346187";
    cancelButton.style.backgroundColor = "#f7f7f7";
    cancelButton.style.border = "1px solid #ababab";
    cancelButton.style.borderRadius = "4px";
    cancelButton.style.outline = "none";
    cancelButton.onblur = function () {
        cancelButton._focus = false;
        cancelButton.style.backgroundColor = "#f7f7f7";
        cancelButton.style.borderColor = "#ababab";
    };
    cancelButton.onfocus = function () {
        cancelButton._focus = true;
        cancelButton.style.backgroundColor = "#bfbfbf";
        cancelButton.style.borderColor = "#ababab";
    };
    cancelButton.onmouseover = function () {
        if (!cancelButton._focus) {
            cancelButton.style.backgroundColor = "rgba(191, 191, 191, 0.5)";
            cancelButton.style.borderColor = "rgba(191, 191, 191, 0.5)";
        }
    };
    cancelButton.onmouseout = function () {
        if (!cancelButton._focus) {
            cancelButton.style.backgroundColor = "#f7f7f7";
            cancelButton.style.borderColor = "#ababab";
        }
    };
    cancelText = document.createTextNode("Cancel");
    cancelButton.appendChild(cancelText);
    block.appendChild(loginButton);
    block.appendChild(cancelButton);
    return block;
}

function createMain(onOpen, onCancel) {
    var main = document.createElement("div");
    main.style.width = "288px";
    main.style.margin = "0 auto";
    main.style.padding = "8px";
    main.style.backgroundColor = "#daeef8";
    main.style.border = "1px solid #00abfc";
    main.style.borderRadius = "4px";
    main.style.fontSize = "1rem";
    main.appendChild(createHeader());
    main.appendChild(createButtons(onOpen, onCancel));
    return main;
}


/**
 * Creates the "open window" dialog
 * @param {function} onOpen Callback function to call when user triggers open window action
 * @protected
 */
OpenWindowAlertPrototype.createAlertDialog = function (onOpen, onCancel) {
    var alertDialog = document.createElement("div");
    alertDialog.style.position = "absolute";
    alertDialog.style.top = "0";
    alertDialog.style.left = "0";
    alertDialog.style.height = "100%";
    alertDialog.style.width = "100%";
    alertDialog.style.margin = "0";
    alertDialog.style.padding = "16px 0";
    alertDialog.style.zIndex = "99999";
    alertDialog.appendChild(createMain(onOpen, onCancel));
    return alertDialog;
};

/**
 * Shows the "open window" dialog
 * @param {function} onOpen Callback function to call when user triggers open window action
 * @public
 */
OpenWindowAlertPrototype.show = function (onOpen, onCancel) {
    if (!onOpen) {
        throw new TypeError("Missing mandatory onOpen option");
    }
    this.close();
    this.alertDialog = this.createAlertDialog(onOpen, onCancel);
    document.body.appendChild(this.alertDialog);
};

/**
 * Closes the "open window" dialog
 * @public
 */
OpenWindowAlertPrototype.close = function () {
    if (this.alertDialog) {
        this.alertDialog.parentNode.removeChild(this.alertDialog);
        this.alertDialog = null;
    }
};

},{}],11:[function(require,module,exports){
"use strict";
var UrlObjectPrototype, anchorParser, parseUrl, basePath, currentOrigin, currentLocation = window.location;

if (typeof window.URL === "function") {
    parseUrl = function (url) {
        return new URL(url, window.location.href);
    };
}
else {
    // IE does not implement URL constructor
    parseUrl = function (url) {
        if (!anchorParser) {
            anchorParser = document.createElement("a");
        }
        anchorParser.href = url;
        return anchorParser;
    };
}

function dirname(path) {
    if (path === "/") {
        return "/";
    }
    var p = path.lastIndexOf("/");
    return p === -1 ? "/" : path.substring(0, p + 1);

}

basePath = dirname(currentLocation.pathname);

function resolve(relativePath) {
    var segments = relativePath.split("/"), resolved = basePath, i, n, segment;
    for (i = 0, n = segments.length; i < n; ++i) {
        segment = segments[i];
        switch (segment) {
            case ".":
                break;
            case "..":
                if (resolved !== "/") {
                    resolved = resolved[resolved.length - 1] === "/" ? dirname(resolved.substring(0, resolved.length - 1)) : dirname(resolved);
                }
                break;
            default:
                resolved = resolved[resolved.length - 1] === "/" ? resolved + segment : resolved + "/" + segment;
                break;
        }
    }
    return resolved;
}

/**
 * @classdesc Lightweight URL object
 * @desc Creates a new UrlObject
 * @param {string} url
 * @constructor
 * @property {string} protocol e.g. "http:" or "https:"
 * @property {string} hostname
 * @property {string} port Port will be empty if it corresponds to standard protocol port (i.e. 80 for http, 443 for https)
 * @property {string} host Host as hostname[:port]
 * @property {string} origin Origin as protocol//hostname[:port]
 * @property {boolean} crossOrigin URL is in a different origin
 * @property {string} pathname
 * @property {string} search Query string
 * @property {string} hash Fragment identifier
 * @property {string} href Gets or sets the URL as string
 * @property {object} parameters <key, value> hash corresponding to parsed query string
 */
function UrlObject(url) {
    this._parse(url);
}

module.exports = UrlObject;

/**
 * Retrieves the host of a given URL as hostname[:port]
 * Port will be omitted if it is the standard port (for http or https)
 * @param  {object} url
 * @param {string} url.protocol
 * @param {string} url.hostname
 * @param {string} url.port
 * @returns {string}
 */
UrlObject.getHost = function (url) {
    var host = url.hostname, port = url.port;
    switch (url.protocol) {
        case "http:":
            if (port && port !== "80") {
                host += ":" + port;
            }
            break;
        case "https:":
            if (port && port !== "443") {
                host += ":" + port;
            }
            break;
        default:
            break;
    }
    return host;
};

UrlObjectPrototype = UrlObject.prototype;
UrlObjectPrototype._parse = function (url) {
    url = String(url) || currentLocation.href;

    var parsed = parseUrl(url), ieRelative;

    // Internet Explorer does not set protocol, hostname and port on relative URLs
    // Normally this should not happen with trick on pathname[0]
    this.protocol = parsed.protocol || currentLocation.protocol;
    if (parsed.hostname) {
        this.hostname = parsed.hostname;
        this.port = parsed.port;
    }
    else {
        ieRelative = url[0] !== "/";
        this.hostname = currentLocation.hostname;
        this.port = currentLocation.port;
    }

    // Align behavior between Chrome, Firefox and IE
    if (this.protocol === "http:" && this.port === "80") {
        this.port = "";
    }
    else if (this.protocol === "https:" && this.port === "443") {
        this.port = "";
    }

    if (ieRelative) {
        this.pathname = resolve(parsed.pathname);
    }
    else {
        // Internet Explorer removes leading / on relative URLs with absolute path
        this.pathname = parsed.pathname[0] === "/" ? parsed.pathname : "/" + parsed.pathname;
    }
    this.hash = parsed.hash;
    this.parameters = UrlObject.parseSearch(parsed.search);
};

/**
 * Parses search parameter
 * @param {string} search
 * @returns {object}
 */
UrlObject.parseSearch = function (search) {
    var paramRegExp, matches, params;
    params = {};
    if (search) {
        paramRegExp = /[?&]([^&=]+)=?([^&]*)/g;
        matches = paramRegExp.exec(search);
        while (matches) {
            params[matches[1]] = matches[2];
            matches = paramRegExp.exec(search);
        }
    }
    return params;
};

/**
 * Gets query string parameter value
 * @param {string} name
 * @returns {string}
 */
UrlObjectPrototype.getParameter = function (name) {
    var value = this.parameters[name];
    return (value === undefined || value === null) ? value : decodeURIComponent(value);
};
/**
 * Removes query string parameter
 * @param {string} name
 */
UrlObjectPrototype.removeParameter = function (name) {
    delete this.parameters[name];
};
/**
 * Sets query string parameter
 * @param {string} name
 * @param {string} value
 */
UrlObjectPrototype.setParameter = function (name, value) {
    this.parameters[name] = encodeURIComponent(value);
};
Object.defineProperties(UrlObjectPrototype, {
    crossOrigin: {
        get: function () {
            return (this.origin !== currentOrigin);
        }
    },
    host: {
        get: function () {
            return UrlObject.getHost(this);
        }
    },
    href: {
        get: function () {
            return this.protocol + "//" + this.host + this.pathname + this.search + this.hash;
        },
        set: function (url) {
            this._parse(url);
        }
    },
    origin: {
        get: function () {
            return this.protocol + "//" + this.host;
        }
    },
    search: {
        get: function () {
            var search, params, name, value;
            search = "";
            params = this.parameters;
            for (name in params) {
                if (params.hasOwnProperty(name)) {
                    value = params[name];
                    if (search.length > 0) {
                        search += "&";
                    }
                    search += name;
                    if (value) {
                        search += "=";
                        search += value;
                    }
                }
            }
            return (search.length > 0) ? ("?" + search) : search;
        }
    }
});

currentOrigin = window.location.protocol + "//" + UrlObject.getHost(window.location);

},{}],12:[function(require,module,exports){
"use strict";

var lowerBound = require("./util.js").lowerBound;
var xhrLogger = require("./Log.js").logger;
var UrlTimeoutPrototype;

/**
 * @classdesc Manages custom url based timeout configuration
 * @param {number} [defaultTimeout = 600] Default timeout
 * @constructor
 */
function UrlTimeout(defaultTimeout) {
    this.defaultTimeout = defaultTimeout || 600;
    this.timeout = {};
    this.idxTimeout = [];
}
module.exports = UrlTimeout;
UrlTimeoutPrototype = UrlTimeout.prototype;

UrlTimeoutPrototype.indexTimeouts = function () {
    var k, index = [], timeout = this.timeout;
    for (k in timeout) {
        if (timeout.hasOwnProperty(k)) {
            index.push(k);
        }
    }
    this.idxTimeout = index.sort();
};
/**
 * Returns the timeout applying for a given URL
 * @param {string} url
 * @returns {number}
 */
UrlTimeoutPrototype.getTimeout = function (url) {
    var u, i = lowerBound(url, this.idxTimeout);
    if (i >= 0) {
        u = this.idxTimeout[i];
        if (url.substring(0, u.length) === u) {
            return this.timeout[u];
        }
    }
    return this.defaultTimeout;
};
/**
 * Defines or reset a custom timeout for a given URL
 * @param {string} url
 * @param {number} [value] Timeout in milliseconds. If value is not set, timeout is reset for url
 */
UrlTimeoutPrototype.setTimeout = function (url, value) {
    if (!url) {
        return;
    }
    if (typeof url !== "string") {
        url = "" + url;
    }
    if (value) {
        xhrLogger.info("Setting timeout " + value + " on " + url);
        this.timeout[url] = value;
    }
    else {
        xhrLogger.info("Reset timeout to default on " + url);
        delete this.timeout[url];
    }
    this.indexTimeouts();
};

},{"./Log.js":8,"./util.js":20}],13:[function(require,module,exports){
"use strict";

var events = require("./events.js");
var LogonManager = require("./LogonManager.js");
var XHRLogonManager = require("./XHRLogonManager.js");
var DefaultLogonFrameProvider = require("./DefaultLogonFrameProvider.js");
var OpenWindowAlert = require("./OpenWindowAlert.js");
var xhrLogger = require("./Log.js").logger;
var UrlObject = require("./UrlObject.js");
var UrlTimeout = require("./UrlTimeout.js");
var windowLogonManager, WindowLogonManagerPrototype;

/**
 * @classdesc
 * @property {OpenWindowAlert} alertDialog Dialog for prompting the user to open the login window in case of pop-up blocking
 * @property {number} pollingInterval Polling period for legacy iframe handling
 * @constructor
 */
function WindowLogonManager() {
    xhrLogger.debug("Creating WindowLogonManager");
    this.alertDialog = new OpenWindowAlert();
    this.frameProvider = new DefaultLogonFrameProvider();
    this.timeout = new UrlTimeout(WindowLogonManager.defaultTimeout);
    this.pollingInterval = 5000;
}

module.exports = WindowLogonManager;
WindowLogonManagerPrototype = WindowLogonManager.prototype;

/**
 * Default frame timeout to allow for silent re-authentication (e.g. browser still has a valid Identity Provider session)
 * @type {number}
 */
WindowLogonManager.defaultTimeout = 600;

/**
 * Returns the WindowLogonManager singleton and creates it if needed
 * @param {boolean} [noCreate] Does not create the WindowLogonManager instance if it does not exist
 * @returns {FrameLogonManager}
 */
WindowLogonManager.getInstance = function (noCreate) {
    if (!windowLogonManager && !noCreate) {
        windowLogonManager = new WindowLogonManager();
    }
    return windowLogonManager;
};
/**
 * Starts WindowLogonManager singleton
 */
WindowLogonManager.start = function () {
    WindowLogonManager.getInstance().start();
};

/**
 * Shuts WindowLogonManager singleton down
 */
WindowLogonManager.shutdown = function () {
    if (windowLogonManager) {
        windowLogonManager.shutdown();
        windowLogonManager = null;
    }
};

WindowLogonManagerPrototype.start = function () {
    var logonManager = LogonManager.getInstance();
    logonManager.addEventListener(LogonManager.LogonEvent.LOGON_COMPLETE, this);
    logonManager.addEventListener(LogonManager.LogonEvent.LOGON_FAILED, this);
    logonManager.registerAuthHandler(XHRLogonManager.logonScheme(XHRLogonManager.Scheme.STRICT_WINDOW), this);
    logonManager.registerAuthHandler(XHRLogonManager.logonScheme(XHRLogonManager.Scheme.WINDOW), this);
};
WindowLogonManagerPrototype.shutdown = function () {
    var logonManager = LogonManager.getInstance();
    this.cancelLogon();
    logonManager.removeEventListener(LogonManager.LogonEvent.LOGON_COMPLETE, this);
    logonManager.removeEventListener(LogonManager.LogonEvent.LOGON_FAILED, this);
    logonManager.unregisterAuthHandler(XHRLogonManager.logonScheme(XHRLogonManager.Scheme.IFRAME), this);
    logonManager.unregisterAuthHandler(XHRLogonManager.logonScheme(XHRLogonManager.Scheme.STRICT_WINDOW), this);
    logonManager.unregisterAuthHandler(XHRLogonManager.logonScheme(XHRLogonManager.Scheme.WINDOW), this);
};

/**
 * Returns the timeout applying for a given URL
 * @param {string} url
 * @returns {number}
 */
WindowLogonManagerPrototype.getTimeout = function (url) {
    return this.timeout.getTimeout(url);
};
/**
 * Defines or reset a custom timeout for a given URL
 * @param {string} url
 * @param {number} [value] Timeout in milliseconds. If value is not set, timeout is reset for url
 */
WindowLogonManagerPrototype.setTimeout = function (url, value) {
    this.timeout.setTimeout(url, value);
};

/**
 * Handles iframe XHR Logon as a window one (for legacy ABAP systems)
 */
WindowLogonManagerPrototype.handleLegacyIFrame = function () {
    var scheme = XHRLogonManager.logonScheme(XHRLogonManager.Scheme.IFRAME), logonManager = LogonManager.getInstance();
    logonManager.unregisterAllHandlers(scheme);
    logonManager.registerAuthHandler(scheme, this);
};

WindowLogonManagerPrototype.onLogon = function (request) {
    var handled = true;
    this.onLogonEnd();
    xhrLogger.debug("Processing " + request.scheme + " logon for realm " + request.realm);
    switch (XHRLogonManager.xhrScheme(request.scheme)) {
        case XHRLogonManager.Scheme.WINDOW:
            this.onWindowLogon(request);
            break;
        case XHRLogonManager.Scheme.STRICT_WINDOW:
            this.onStrictWindowLogon(request);
            break;
        case XHRLogonManager.Scheme.IFRAME:
            this.onWindowLogon(request, true);
            break;
        default:
            handled = false;
            xhrLogger.warning("WindowLogonManager unsupported request scheme " + request.scheme);
            break;
    }
    return handled;
};

WindowLogonManagerPrototype.onWindowLogon = function (request, legacyIframe) {
    var url, frame, timeout, cancelId, self = this;
    if (legacyIframe) {
        xhrLogger.debug("Processing iframe logon as window logon for realm " + request.realm);
    }
    else {
        xhrLogger.debug("Processing window logon for realm " + request.realm);
    }
    timeout = this.getTimeout(request.channel.url);
    url = new UrlObject(request.channel.url);
    url.setParameter("xhr-logon", legacyIframe ? "iframe" : "window");
    frame = this.frameProvider.create();
    frame.onload = function () {
        if (cancelId) {
            // Frame has loaded a new page, reset previous timer
            clearTimeout(cancelId);
        }
        cancelId = setTimeout(function () {
            self.createWindow(legacyIframe);
        }, timeout);
    };
    frame.xhrTimeout = timeout;
    frame.src = url.href;
    this.pending = {realm: request.realm, frame: frame.id, url: url.href};
};

WindowLogonManagerPrototype.onStrictWindowLogon = function (request) {
    var url = new UrlObject(request.channel.url);
    url.setParameter("xhr-logon", "strict-window");
    xhrLogger.debug("Processing strict-window logon for realm " + request.realm);
    this.pending = {realm: request.realm, url: url.href};
    this.createWindow();
};

WindowLogonManagerPrototype.createWindow = function (polling) {
    var auxWindow, self = this;
    if (!this.pending) {
        return;
    }
    auxWindow = window.open(this.pending.url, "_blank");
    if (!auxWindow || auxWindow.closed) {
        xhrLogger.warning("Failed to open logon window, alerting user");
        this.alertDialog.show(function () {
            self.createWindow(polling);
        }, function () {
            self.cancelLogon();
        });
        return;
    }
    this.window = auxWindow;
    try {
        auxWindow.opener = window;
    }
    catch (err) {
        void err;
    }
    this.windowMonitorId = setInterval(function () {
        // In cross-origin scenario, we cannot attach event handler to the auxiliary window
        if (!self.window || self.window.closed) {
            self.cancelLogon();
        }
    }, 300);
    if (polling) {
        self.pollIntervalId = setInterval(function () {
            // Robust coarse-grained polling
            self.poll();
        }, self.pollingInterval);
    }

    events.addEventListener(auxWindow, "load", function () {
        xhrLogger.info("Logon window opened");
        if (self.closed) {
            return;
        }
        if (polling) {
            setTimeout(function () {
                self.poll();
            }, 300);
        }
        self.windowIntervalId = setInterval(function () {
            // Fine-grained polling
            try {
                if (polling && typeof self.window.notifyParent === "function") {
                    self.poll();
                }
            }
            catch (err) {
                xhrLogger.warning("Logon polling failed: " + err.message);
            }
        }, 300);
    });
    events.addEventListener(auxWindow, "close", function () {
        self.cancelLogon();
    });
    setTimeout(function () {
        try {
            if (self.window) {
                self.window.focus();
            }
        }
        catch (err) {
            xhrLogger.warning("Failed to switch focus to logon window");
        }
    }, 300);
};

WindowLogonManagerPrototype.poll = function () {
    var frame;
    if (this.pending) {
        // Force frame destruction and recreation as forcing reload seems not to be working
        frame = this.frameProvider.create();
        this.pending.frame = frame.id;
        frame.src = this.pending.url;
    }
};

WindowLogonManagerPrototype.stopPolling = function () {
    if (this.windowMonitorId) {
        clearInterval(this.windowMonitorId);
        this.windowMonitorId = undefined;
    }
    if (this.windowIntervalId) {
        clearInterval(this.windowIntervalId);
        this.windowIntervalId = undefined;
    }
    if (this.pollIntervalId) {
        clearInterval(this.pollIntervalId);
        this.pollIntervalId = undefined;
    }
};

WindowLogonManagerPrototype.onLogonEnd = function (realm) {
    if (this.pending && (!arguments.length || realm === this.pending.realm)) {
        this.stopPolling();
        this.frameProvider.destroy();
        this.alertDialog.close();
        if (this.window) {
            this.window.close();
            this.window = undefined;
        }
        this.pending = undefined;
    }
};
WindowLogonManagerPrototype.cancelLogon = function () {
    if (this.pending) {
        xhrLogger.debug("Cancelling logon for realm " + this.pending.realm);
        LogonManager.getInstance().abortLogon(this.pending.realm);
        this.onLogonEnd(this.pending.realm);
    }
};
WindowLogonManagerPrototype.handleEvent = function (event) {
    var request;
    switch (event.type) {
        case LogonManager.LogonEvent.LOGON:
            request = event.request;
            if (request) {
                return this.onLogon(request);
            }
            break;
        case LogonManager.LogonEvent.LOGON_COMPLETE:
            this.onLogonEnd(event.response.realm);
            break;
        case LogonManager.LogonEvent.LOGON_FAILED:
            this.onLogonEnd(event.response.realm);
            break;
    }
    return false;
};

},{"./DefaultLogonFrameProvider.js":4,"./Log.js":8,"./LogonManager.js":9,"./OpenWindowAlert.js":10,"./UrlObject.js":11,"./UrlTimeout.js":12,"./XHRLogonManager.js":15,"./events.js":16}],14:[function(require,module,exports){
"use strict";
var httpUtil = require("./httpUtil.js");
var UrlObject = require("./UrlObject.js");
var XHRLogonFilterPrototype, useCompliantReadyStates, HEADERS_RECEIVED = 2, DONE = 4;

function XHRLogonFilter(manager, channel) {
    this.manager = manager;
    this.channel = channel;
    this.ignore = (this.manager.ignore && this.manager.ignore.ignored(channel.url));
    // Listen on the readystatechange event as this is the first one to be fired upon completion
    if (!this.ignore) {
        channel.xhr._addEventListener("readystatechange", this);
    }
}

module.exports = XHRLogonFilter;
XHRLogonFilterPrototype = XHRLogonFilter.prototype;

/**
 * Parses an XHR Logon response header
 * @param httpHeader
 * @returns {object}
 */
XHRLogonFilter.parseHeader = function (httpHeader) {
    var i, parsed = httpUtil.parseHeader(httpHeader);
    if (parsed.accept) {
        parsed.accept = parsed.accept.split(",");
        for (i = 0; i < parsed.accept.length; ++i) {
            parsed.accept[i] = parsed.accept[i].trim();
        }
    }
    return parsed;
};

XHRLogonFilterPrototype.sending = function (channel) {
    var xhr, accept, url = new UrlObject(channel.url);
    if (url.crossOrigin && !channel.xhr.withCredentials) {
        // Ignore Cross-Origin requests if withCredentials attribute is not set
        this.ignore = true;
    }
    if (this.ignore) {
        return;
    }
    xhr = channel.xhr;
    accept = this.manager.accept().join(",");
    if (xhr.getRequestHeader("X-XHR-Logon") === undefined) {
        xhr.setRequestHeader("X-XHR-Logon", "accept=" + JSON.stringify(accept));
    }
    if (xhr.getRequestHeader("X-Requested-With") === undefined) {
        xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
    }
};

XHRLogonFilterPrototype.handleEvent = function (event) {
    var channel, xhr, httpHeader, xhrLogonHeader, status, repeat, accept, i;
    channel = this.channel;
    xhr = channel.xhr;
    if (xhr.readyState < HEADERS_RECEIVED) {
        return;
    }
    if (xhr.readyState === HEADERS_RECEIVED) {
        // Some old IE versions use ready states from old XHR specification
        if (useCompliantReadyStates === undefined) {
            try {
                status = xhr.status;
                useCompliantReadyStates = !!status;
            }
            catch (err) {
                useCompliantReadyStates = false;
            }
            if (!status) {
                return;
            }
        }
        else if (!useCompliantReadyStates) {
            return;
        }
    }
    if (xhr.status === 403) {
        httpHeader = xhr.getResponseHeader("x-xhr-logon");
        if (httpHeader) {
            // prevent event propagation
            if (channel.async) {
                xhr.suspendEvents();
            }
            if (channel.async || this.manager.triggerLogonOnSyncRequest) {
                xhrLogonHeader = XHRLogonFilter.parseHeader(httpHeader);
                accept = xhrLogonHeader.accept;
                if (accept) {
                    for (i = 0; i < accept.length; ++i) {
                        if (accept[i] === "repeat") {
                            accept.splice(i, 1); // remove repeat from accept list to prevent looping
                            repeat = true;
                            break;
                        }
                    }
                }
                if (xhr.readyState === DONE) {
                    if (repeat && !channel.repeated) {
                        channel.repeated = true; // Prevent looping
                        accept = this.manager.accept(accept);
                        xhr.setRepeatHeader("X-XHR-Logon", "accept=\"" + accept.join(",") + "\"");
                        xhr.repeat();
                    }
                    else {
                        this.manager.requestLogon(channel, event, xhrLogonHeader);
                    }
                }
            }
        }
    }
};

},{"./UrlObject.js":11,"./httpUtil.js":17}],15:[function(require,module,exports){
"use strict";
var _XMLHttpRequest = require("./xhr.js");
var IgnoreList = require("./IgnoreList.js");
var xhrLogger = require("./Log.js").logger;
var XHRLogonFilter = require("./XHRLogonFilter.js");
var LogonManager = require("./LogonManager.js");
var events = require("./events.js");
var XHR_LOGON_PREFIX = "xhrlogon.";
var xhrLogonRegExp = /^\s*\{\s*"xhrLogon"\s*:/;
var xhrLogonManager, XHRLogonManagerPrototype;

/**
 * @classdesc XHRLogonManager handles XHR Logon protocol on the client
 * @desc XHRLogonManager constructor
 * @constructor
 * @property {string[]} schemes List of authentication schemes with registered handlers
 * @property {string[]} acceptOrder Ordered list of schemes in decreasing priority for scheme negotiation
 */
function XHRLogonManager() {
    xhrLogger.info("Creating XHR Logon Manager");
}
module.exports = XHRLogonManager;
XHRLogonManagerPrototype = XHRLogonManager.prototype;

/**
 * Returns the XHRLogonManager singleton and creates it if needed
 * @param {boolean} [noCreate] Does not create the LogonManager instance if it does not exist
 * @returns {XHRLogonManager}
 */
XHRLogonManager.getInstance = function (noCreate) {
    if (!xhrLogonManager && !noCreate) {
        xhrLogonManager = new XHRLogonManager();
    }
    return xhrLogonManager;
};
/**
 * Starts WindowLogonManager singleton
 */
XHRLogonManager.start = function () {
    XHRLogonManager.getInstance().start();
};
/**
 * Stops and destroys the XHRLogonManager singleton
 */
XHRLogonManager.shutdown = function () {
    if (xhrLogonManager) {
        xhrLogonManager.shutdown();
        xhrLogonManager = undefined;
    }
};

/**
 * Returns the Logon scheme associated to a given XHR-Logon scheme
 * @param {string} xhrScheme XHR Logon scheme (e.g. "repeat", "iframe", ...)
 * @returns {string} Logon scheme (i.e. `xhrlogon.${xhrScheme}`)
 */
XHRLogonManager.logonScheme = function (xhrScheme) {
    return XHR_LOGON_PREFIX + xhrScheme;
};

/**
 * Returns the XHR-Logon scheme associated to a given Logon scheme
 * @param {string} scheme Logon scheme (e.g. "xhrlogon.iframe", ...)
 * @returns {string} XHR-Logon scheme
 */
XHRLogonManager.xhrScheme = function (scheme) {
    return scheme.startsWith(XHR_LOGON_PREFIX) ? scheme.substring(XHR_LOGON_PREFIX.length) : "none";
};

/// Whether to trigger a logon process if a synchronous request gets an XHR logon challenge
XHRLogonManagerPrototype.triggerLogonOnSyncRequest = true;

// Standard scheme names
XHRLogonManager.Scheme = {
    NONE: "none",
    REPEAT: "repeat",
    IFRAME: "iframe",
    WINDOW: "window",
    STRICT_WINDOW: "strict-window"
};

/// Default scheme order for scheme negotiation
XHRLogonManager.defaultAccept = [
    XHRLogonManager.Scheme.REPEAT, XHRLogonManager.Scheme.IFRAME,
    XHRLogonManager.Scheme.WINDOW, XHRLogonManager.Scheme.STRICT_WINDOW
];

XHRLogonManagerPrototype.start = function () {
    if (!this.started) {
        xhrLogger.info("XHR Logon Manager startup");
        this.ignore = new IgnoreList();
        this._initializeTrustedOrigins();
        this._registerFilterFactory();
        this.acceptOrder = XHRLogonManager.defaultAccept.slice();
        events.addEventListener(window, "message", this.getEventHandler());
        this.started = true;
    }
};


/**
 * XHRLogonManager shutdown
 */
XHRLogonManagerPrototype.shutdown = function () {
    if (this.started) {
        xhrLogger.info("XHR Logon Manager shutdown");
        events.removeEventListener(window, "message", this.getEventHandler());
        this._unregisterFilterFactory();
        this.started = false;
    }
};

// Helper functions
function isSuccess(status) {
    return (status >= 200 && status < 300) || (status === 304);
}

function xhrLogonSchemes() {
    var i, n, s, schemes = [], allSchemes = LogonManager.getInstance().schemes;
    for (i = 0, n = allSchemes.length; i < n; ++i) {
        s = allSchemes[i];
        if (s.startsWith(XHR_LOGON_PREFIX)) {
            schemes.push(s.substring(XHR_LOGON_PREFIX.length));
        }
    }
    schemes.push(XHRLogonManager.Scheme.REPEAT); // Accept "repeat" scheme even if no handler is attached to it
    return schemes;
}

/**
 * Return the accepted schemes (optionally from a list of schemes)
 * @param {string[]} [schemes] List of schemes
 * @returns {string[]} List of client accepted schemes (in case of scheme mismatch, the "none" scheme will be added)
 */
XHRLogonManagerPrototype.accept = function (schemes) {
    var i, n, scheme, accept = [], logonManager = LogonManager.getInstance();
    schemes = schemes || xhrLogonSchemes();
    if (schemes.length) {
        for (i = 0, n = schemes.length; i < n; ++i) {
            scheme = schemes[i];
            if (logonManager.isSchemeHandled(XHRLogonManager.logonScheme(scheme))) {
                accept.push(scheme);
            }
        }
    }
    if (!accept.length) {
        accept.push(XHRLogonManager.Scheme.NONE);
    }
    return accept;
};

/**
 * Determines a suitable scheme from server accept list and client preferences
 * @param {string[]} schemes List of server accepted schemes
 */
XHRLogonManagerPrototype.acceptScheme = function (schemes) {
    if (!schemes || !schemes.length) {
        return XHRLogonManager.Scheme.NONE;
    }
    var i, n, scheme, result = XHRLogonManager.Scheme.NONE, acceptMap = {}, logonManager = LogonManager.getInstance();
    for (i = 0, n = schemes.length; i < n; ++i) {
        acceptMap[schemes[i]] = true;
    }
    for (i = 0, n = this.acceptOrder.length; i < n; ++i) {
        scheme = this.acceptOrder[i];
        if (logonManager.isSchemeHandled(XHRLogonManager.logonScheme(scheme)) && acceptMap[scheme]) {
            result = scheme;
            break;
        }
    }
    return result;
};


var NW_BASE_REALM = "SAP NetWeaver Application Server [";
function effectiveRealm(realm) {
    if (!realm) {
        return "";
    }
    if (realm.startsWith(NW_BASE_REALM)) {
        return realm.substring(0, NW_BASE_REALM.length + 3) + "]";
    }
    return realm;
}

/**
 * Triggers XHR Logon process
 * @param {Channel} channel
 * @param {Event} event
 * @param {object} xhrLogonRequest
 */
XHRLogonManagerPrototype.requestLogon = function (channel, event, xhrLogonRequest) {
    var scheme = this.acceptScheme(xhrLogonRequest.accept);
    LogonManager.getInstance().requestLogon({
        channel: channel,
        realm: effectiveRealm(xhrLogonRequest.realm),
        scheme: XHRLogonManager.logonScheme(scheme),
        event: event
    });
};

/**
 * Registers an authentication handler for a given XHR Logon scheme
 * @param {string} scheme
 * @param {object|function} handler
 * @returns {boolean}
 */
XHRLogonManagerPrototype.registerAuthHandler = function (scheme, handler) {
    scheme = XHRLogonManager.logonScheme(scheme);
    return LogonManager.getInstance().registerAuthHandler(scheme, handler);
};

/**
 * Unregisters an authentication handler for a given XHR Logon scheme
 * @param {string} scheme
 * @param {object|function} handler
 * @returns {boolean}
 */
XHRLogonManagerPrototype.unregisterAuthHandler = function (scheme, handler) {
    scheme = XHRLogonManager.logonScheme(scheme);
    return LogonManager.getInstance().unregisterAuthHandler(scheme, handler);
};

/**
 * @private
 * @param event
 */
XHRLogonManagerPrototype.handleEvent = function (event) {
    var data, xhrLogonStatus;
    data = event.data;
    if (xhrLogonRegExp.test(data)) {
        try {
            if (this.isTrusted(event.origin)) {
                xhrLogonStatus = JSON.parse(data);
                if (typeof xhrLogonStatus.xhrLogon !== "object") {
                    xhrLogger.warning("Invalid xhrLogon message: " + data);
                }
                else {
                    xhrLogonStatus.xhrLogon.realm = effectiveRealm(xhrLogonStatus.xhrLogon.realm);
                    xhrLogonStatus.xhrLogon.success = isSuccess(xhrLogonStatus.xhrLogon.status);
                    LogonManager.getInstance().logonCompleted(xhrLogonStatus.xhrLogon);
                }
            }
            else {
                xhrLogger.warning("Received xhrlogon message from untrusted origin " + event.origin);
            }
        }
        catch (error) {
            xhrLogger.warning("Invalid xhrLogon message: " + data);
        }
    }
};
XHRLogonManagerPrototype._initializeTrustedOrigins = function () {
    // Note: http://www.example.com yields "" port on Chrome and Firefox but "80" on IE
    var loc, protocol, origins;
    origins = {};
    loc = window.location;
    protocol = loc.protocol;
    origins[protocol + "//" + loc.host] = true;
    switch (protocol) {
        case "http:":
            if (loc.port === "") {
                origins["http://" + loc.hostname + ":80"] = true;
            }
            else if (loc.port === "80") {
                origins["http://" + loc.hostname] = true;
            }
            break;
        case "https:":
            if (loc.port === "") {
                origins["https://" + loc.hostname + ":443"] = true;
            }
            else if (loc.port === "443") {
                origins["https://" + loc.hostname] = true;
            }
            break;
        default:
            break;
    }
    this._trustedOrigins = origins;
};
XHRLogonManagerPrototype.isTrusted = function (origin) {
    return (!!this._trustedOrigins[origin]);
};

/**
 * Declares an origin (scheme://hostname[:port]) as trusted.
 * @param {string} origin
 */
XHRLogonManagerPrototype.addTrustedOrigin = function (origin) {
    this._trustedOrigins[origin] = true;
};
XHRLogonManagerPrototype.getEventHandler = function () {
    var handler, self;
    handler = this._eventHandler;
    if (!handler) {
        self = this;
        handler = function (event) {
            self.handleEvent(event);
        };
        this._eventHandler = handler;
    }
    return handler;
};
XHRLogonManagerPrototype._getFilterFactory = function () {
    var factory, self;
    factory = this._filterFactory;
    if (!factory) {
        self = this;
        factory = function (channel) {
            channel.filters.push(new XHRLogonFilter(self, channel));
        };
        this._filterFactory = factory;
    }
    return factory;
};
XHRLogonManagerPrototype._registerFilterFactory = function () {
    if (_XMLHttpRequest.channelFactory) {
        _XMLHttpRequest.channelFactory.addFilterFactory(this._getFilterFactory());
    }
};
XHRLogonManagerPrototype._unregisterFilterFactory = function () {
    if (_XMLHttpRequest.channelFactory) {
        _XMLHttpRequest.channelFactory.removeFilterFactory(this._getFilterFactory());
        delete this._filterFactory;
    }
};

},{"./IgnoreList.js":7,"./Log.js":8,"./LogonManager.js":9,"./XHRLogonFilter.js":14,"./events.js":16,"./xhr.js":21}],16:[function(require,module,exports){
"use strict";

var useOldEvents;
function createOldEvent(type, bubbles, cancelable) {
    var event;
    event = document.createEvent("Event");
    event.initEvent(type, bubbles, cancelable);
    return event;
}
function createEvent(type, bubbles, cancelable) {
    var event, eventInit;
    if (useOldEvents) {
        event = createOldEvent(type, bubbles, cancelable);
    }
    else {
        try {
            if (bubbles || cancelable) {
                eventInit = {
                    bubbles: bubbles,
                    cancelable: cancelable
                };
            }
            event = new Event(type, eventInit);
        }
        catch(error) {
            useOldEvents = true;
            event = createOldEvent(type, bubbles, cancelable);
        }
    }
    return event;
}
function addEventListener(target, type, listener, useCapture) {
    if (target.addEventListener) {
        target.addEventListener(type, listener, useCapture);
    }
    else if (target.attachEvent) {
        target.attachEvent("on" + type, listener);
    }
}
function removeEventListener(target, type, listener, useCapture) {
    if (target.removeEventListener) {
        target.removeEventListener(type, listener, useCapture);
    }
    else  if (target.detachEvent) {
        target.detachEvent("on" + type, listener);
    }
}
module.exports = {
    createEvent: createEvent,
    addEventListener: addEventListener,
    removeEventListener: removeEventListener
};
},{}],17:[function(require,module,exports){
"use strict";

var headerParser = /(?:,|^)\s*(?:,\s*)*(\w+)\s*=\s*(?:"((?:[^"\\]|\\.)*)"|(\w*))/g;

/**
 * Parses a comma separated list of token=token|quoted_string productions (cf. HTTP #rule https://www.w3.org/Protocols/rfc2616/rfc2616-sec2.html#sec2.1)
 * @param {string} header
 * @returns {object}
 */
function parseHeader(header) {
    var parsed = {}, result, token, val;
    if (header === undefined) {
        return parsed;
    }
    if (typeof header !== "string") {
        throw new TypeError("Invalid header value");
    }
    result = headerParser.exec(header);
    while (result !== null) {
        token = result[1];
        val = result[2] === undefined ? result[3] : result[2];
        parsed[token] = val ? val.replace(/\\(.)/g, "$1") : "";
        result = headerParser.exec(header);
    }
    return parsed;
}

module.exports = {
    parseHeader: parseHeader
};

},{}],18:[function(require,module,exports){
"use strict";
require("./polyfill.js");
require("./xhr.js");

var LogonManager = require("./LogonManager.js");
var FrameLogonManager = require("./FrameLogonManager.js");
var WindowLogonManager = require("./WindowLogonManager.js");
var XHRLogonManager = require("./XHRLogonManager.js");

/**
 *
 * @param options
 */
function start(options) {
    options = options || {};
    LogonManager.getInstance();
    XHRLogonManager.start();
    FrameLogonManager.start();
    WindowLogonManager.start();
    if (options.iframeAsWindow) {
        WindowLogonManager.getInstance().handleLegacyIFrame();
    }
}

/**
 *
 */
function shutdown() {
    XHRLogonManager.shutdown();
    FrameLogonManager.shutdown();
    WindowLogonManager.shutdown();
    WindowLogonManager.shutdown();
}

/**
 * @module sap-xhrlib
 */
module.exports = {
    start: start,
    shutdown: shutdown,
    FrameLogonManager: FrameLogonManager,
    LogonManager: LogonManager,
    URL: require("./UrlObject.js"),
    WindowLogonManager: WindowLogonManager,
    XHRLogonManager: XHRLogonManager
};

},{"./FrameLogonManager.js":6,"./LogonManager.js":9,"./UrlObject.js":11,"./WindowLogonManager.js":13,"./XHRLogonManager.js":15,"./polyfill.js":19,"./xhr.js":21}],19:[function(require,module,exports){
"use strict";

var trim;

// Polyfill for String.prototype.startsWith (updated to be anaolg as in XHRLogon 2.2.1)
if (!String.prototype.startsWith) {
    String.prototype.startsWith = function (searchString, position) {
        searchString = String(searchString);
        position = Number(position) || 0;
        position = position < 0 ? 0 : Math.floor(position);
        return (this.substr(position, searchString.length) === searchString);
    };
}

// Polyfill for String.prototype.trim
if (!String.prototype.trim) {
    trim = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g;
    String.prototype.trim = function () {
        return this.replace(trim, "");
    };
}

// Polyfill for Date.now
if (!Date.now) {
    Date.now = function() {
        return new Date().getTime();
    };
}

},{}],20:[function(require,module,exports){
"use strict";

var padding = ["", "0", "00", "000", "0000"];

/*
 * For a sorted array a, returns the index of largest element smaller or equal to x or -1 if such an element does not exist
 */
function lowerBound(x, a) {
    var i, v, s = 0, e = a.length - 1;
    if (e < 0 || x < a[0]) {
        return -1;
    }
    if (x >= a[e]) {
        return e;
    }
    --e;
    // We have always a[s] <= x < a[e + 1]
    while (s < e) {
        // when e = s + 1, i = e otherwise, interval [s, e] is divided by approximately 2
        i = (s + e + 1) >> 1; // integer division by 2, s < i <= e
        v = a[i];
        if (x < v) {
            e = i - 1;
        }
        else { // v <= x
            s = i;
        }
    }
    return s;
}

/**
 * Pads a number with leading 0
 * @param {number} num
 * @param {number} len
 * @returns {string}
 */
function pad(num, len) {
    var output = "" + num;
    if (output.length < len) {
        output = padding[len - output.length] + output;
    }
    return output;
}

/**
 * Returns current time as HH:mm:ss.fff
 */
function time() {
    var now = new Date();
    var output = pad(now.getHours(), 2) + ":" + pad(now.getMinutes(), 2) + ":";
    output += pad(now.getSeconds(), 2) + "." + pad(now.getMilliseconds(), 3);
    return output;
}


module.exports = {
    lowerBound: lowerBound,
    pad: pad,
    time: time
};
},{}],21:[function(require,module,exports){
// ------------------------------------------------------------
// XMLHttpRequest enhancement
// ------------------------------------------------------------
"use strict";

function xhrEnhance() {
    var Log = require("./Log.js");
    var ChannelFactory = require("./ChannelFactory.js");
    var EventHandlers = require("./EventHandlers.js");
    var progressEvents, xhrEvents, _XMLHttpRequest, XMLHttpRequestPrototype, uuid = 0, xhrLogger = Log.logger;
    progressEvents = ["loadstart", "progress", "abort", "error", "load", "timeout", "loadend"];
    xhrEvents = progressEvents.concat("readystatechange");

    var isFirefox = window.navigator.userAgent.toLowerCase().indexOf("firefox") !== -1;

    // Save reference to original XHR constructor in case it gets overloaded (e.g. by SinonJS)
    _XMLHttpRequest = XMLHttpRequest;
    XMLHttpRequest._SAP_ENHANCED = true;
    XMLHttpRequestPrototype = _XMLHttpRequest.prototype;
    XMLHttpRequest.channelFactory = new ChannelFactory();

    function makeProtected(obj, members) {
        var k, n, member, _fn, _member, fn;
        n = members.length;
        for (k = 0; k < n; ++k) {
            member = members[k];
            fn = obj[member];
            if (fn) {
                _member = "_" + member;
                _fn = obj[_member];
                if (!_fn) {
                    obj[_member] = fn;
                }
            }
        }
    }
    makeProtected(XMLHttpRequestPrototype, ["abort", "open", "setRequestHeader", "send", "addEventListener", "removeEventListener"]);

    XMLHttpRequestPrototype._getHandlers = function () {
        var h = this._handlers;
        if (!h) {
            h = new EventHandlers(xhrEvents);
            this._handlers = h;
        }
        return h;
    };
    XMLHttpRequestPrototype.handleEvent = function (event) {
        this._getHandlers().dispatch(event);
    };
    XMLHttpRequestPrototype.suspendEvents = function () {
        this._getHandlers().suspend = true;
    };
    XMLHttpRequestPrototype.resumeEvents = function (release) {
        var handlers = this._getHandlers();
        handlers.suspend = false;
        if (release) {
            handlers.releaseEvents();
        }
        else {
            handlers.clearEvents();
        }
    };
    XMLHttpRequestPrototype.clearEvents = function () {
        this._getHandlers().clearEvents();
    };
    XMLHttpRequestPrototype.getEventHandler = function () {
        var self = this, fnHandler = this._fnHandler;
        if (!fnHandler) {
            fnHandler = function (event) {
                self.handleEvent(event);
            };
            this._fnHandler = fnHandler;
        }
        return fnHandler;
    };
    XMLHttpRequestPrototype._checkEventSubscription = function (type, handlers) {
        // Some browser do not support multiple registrations of the same event handler
        handlers = handlers || this._getHandlers();
        if (!handlers.subscribed(type)) {
            this._addEventListener(type, this.getEventHandler());
            handlers.subscribe(type);
        }
    };

    XMLHttpRequestPrototype._checkEventSubscriptions = function () {
        var handlers, i, n;
        handlers = this._getHandlers();
        n = xhrEvents.length;
        for (i = 0; i < n; ++i) {
            this._checkEventSubscription(xhrEvents[i], handlers);
        }
    };

    // ------------------------------------------------------------
    //      XMLHttpRequest override
    // ------------------------------------------------------------
    XMLHttpRequestPrototype.addEventListener = function (type, callback) {
        this._getHandlers().add(type, callback);
    };
    XMLHttpRequestPrototype.removeEventListener = function (type, callback) {
        this._getHandlers().remove(type, callback);
    };

    function protectEventHandler(event) {
        Object.defineProperty(XMLHttpRequestPrototype, "on" + event, {
            configurable: true,
            get: function () {
                return this["_on" + event] || null;
            },
            set: function (value) {
                var member = "_on" + event;
                if (this[member]) {
                    this.removeEventListener(event, this[member]);
                }
                if (typeof value === "function" || typeof value === "object") {
                    this[member] = value;
                    if (EventHandlers.isHandler(value)) {
                        this.addEventListener(event, value);
                    }
                }
                else {
                    this[member] = null;
                }
            }
        });
    }
    xhrEvents.forEach(function (event) {
        protectEventHandler(event);
    });

    /**
     * Cancels any network activity.
     * (XMLHttpRequest standard)
     */
    XMLHttpRequestPrototype.abort = function () {
        var channel;
        try {
            channel = this._channel;
            if (channel) {
                xhrLogger.debug("Aborting request " + channel.method + " " + channel.url);
                channel.aborting();
                this._abort();
                channel.aborted();
            }
            else {
                xhrLogger.debug("Aborting request");
                this._abort();
            }
        }
        catch (error) {
            xhrLogger.warning("Failed to abort request: " + error.message);
            if (channel) {
                channel["catch"](error);
            }
            else {
                throw error;
            }
        }
    };

    /**
     * Sets the request method, request URL, and synchronous flag.
     * Throws a JavaScript TypeError if either method is not a valid HTTP method or url cannot be parsed.
     * Throws a "SecurityError" exception if method is a case-insensitive match for CONNECT, TRACE or TRACK.
     * Throws an "InvalidAccessError" exception if async is false, the JavaScript global environment is a document environment, and either the timeout attribute is not zero, the withCredentials attribute is true, or the responseType attribute is not the empty string.
     * (XMLHttpRequest standard)
     * @param {String} method
     * @param {String} url
     * @param {Boolean} async
     * @param {String} username
     * @param {String} password
     */
    XMLHttpRequestPrototype.open = function (method, url, async, username, password) {
        //  Cf. XHR specification
        //      If the async argument is omitted, set async to true, and set username and password to null.
        //      Due to unfortunate legacy constraints, passing undefined for the async argument is treated differently from async being omitted.
        var channel, arglen, origMethod, origUrl;
        this._id = ++uuid;
        xhrLogger.debug("Opening request #" + this._id + " " + method + " " + url);
        arglen = arguments.length;
        if (arglen <= 2) {
            async = true;
        }
        origMethod = method;
        origUrl = url;
        this._getHandlers().clearEvents(); // Clear possibly lingering events from previous execution
        channel = _XMLHttpRequest.channelFactory.create(this, method, url, async, username, password);
        this._channel = channel;
        try {
            this._clearParams(); // In case of XHR reuse, delete previously stored replay data
            channel.opening();
            // Allow channels to overload URL and method (e.g. for method tunneling)
            method = channel.method;
            url = channel.url;
            if ((origUrl !== url) || (origMethod !== method)) {
                xhrLogger.debug("Rewriting request #" + this._id + " to " + method + " " + url);
            }
            if (arglen <= 2) {
                this._open(method, url);
            }
            else {
                this._open(method, url, async, username, password);
            }
            channel.opened();

            // Always listen to readystatechange event AFTER all filters
            this._checkEventSubscriptions();
            this._removeEventListener("readystatechange", this.getEventHandler());
            this._addEventListener("readystatechange", this.getEventHandler());
        }
        catch (error) {
            xhrLogger.warning("Failed to open request #" + this._id + " " + method + " " + url + ": " + error.message);
            channel["catch"](error);
        }
    };

    /**
     * Appends an header to the list of author request headers, or if header is already in the list of author request headers, combines its value with value.
     * Throws an "InvalidStateError" exception if the state is not OPENED or if the send() flag is set.
     * Throws a JavaScript TypeError if header is not a valid HTTP header field name or if value is not a valid HTTP header field value.
     * (XMLHttpRequest standard)
     * @param {String} header
     * @param {String} value
     */
    XMLHttpRequestPrototype.setRequestHeader = function (header, value) {
        var headers, normalizedHeader;
        if (typeof value !== "string") {
            value = "" + value;
        }
        this._setRequestHeader(header, value);
        normalizedHeader = header.toLowerCase();
        headers = this.headers;
        if (headers[normalizedHeader] === undefined) {
            headers[normalizedHeader] = value;
        }
        else {
            // If header is in the author request headers list, append ",", followed by U+0020, followed by value, to the value of the header matching header.
            headers[normalizedHeader] += ", " + value;
        }
    };

    /**
     * Performs a setRequestHeader for all own properties of the headers object
     * (non standard)
     * @param {Object} headers
     */
    XMLHttpRequestPrototype.setRequestHeaders = function (headers) {
        var header, headerNames, i, n;
        if (typeof headers === "object") {
            headerNames = Object.getOwnPropertyNames(headers);
            n = headerNames.length;
            for (i = 0; i < n; ++i) {
                header = headerNames[i];
                this.setRequestHeader(header, headers[header]);
            }
        }
    };

    /**
     * Initiates the request. The optional argument provides the request entity body. The argument is ignored if request method is GET or HEAD.
     * Throws an "InvalidStateError" exception if the state is not OPENED or if the send() flag is set.
     * (XMLHttpRequest standard)
     * @param data
     */
    XMLHttpRequestPrototype.send = function (data) {
        var channel, method, url;
        try {
            channel = this._channel;
            if (channel) {
                // channel might not exist if object is not in the right state.
                // We let the native "send" method throw the corresponding exception
                method = channel.method;
                url = channel.url;
                xhrLogger.debug("Sending request #" + this._id + " " + method + " " + url);
                channel.sending();
            }
            this._saveParams(data);
            this._send(data);
            if (channel) {
                channel.sent();
            }
        }
        catch (error) {
            if (method) {
                xhrLogger.warning("Failed to send request #" + this._id + " " + method + " " + url + ": " + error.message);
            }
            else {
                xhrLogger.warning("Failed to send request #" + this._id + ": " + error.message);
            }
            if (channel) {
                channel["catch"](error);
            }
            else {
                throw error;
            }
        }
    };

    // ------------------------------------------------------------
    //      XMLHttpRequest enhancement
    // ------------------------------------------------------------
    /**
     * Retrieves the current value of a request header
     * (non standard)
     * @param {String} header
     * @returns {String}
     */
    XMLHttpRequestPrototype.getRequestHeader = function (header) {
        return this.headers[header.toLowerCase()];
    };

    /**
     * Deletes the repeat data for a given request header @see XMLHttpRequest#repeat
     * (non standard)
     * @param {String} header name of the HTTP header
     */
    XMLHttpRequestPrototype.deleteRepeatHeader = function (header) {
        delete this.headers[header.toLowerCase()];
    };

    /**
     * Changes the repeat data for a given request header @see XMLHttpRequest#repeat
     * (non standard)
     * @param {String} header
     * @param {String} value
     */
    XMLHttpRequestPrototype.setRepeatHeader = function (header, value) {
        this.headers[header.toLowerCase()] = value;
    };

    /**
     * Reopens a request and restores the settings and headers from the previous execution
     * (non standard)
     */
    XMLHttpRequestPrototype.reopen = function () {
        var channel = this._channel, method, url;
        if (channel) {
            method = channel.method;
            url = channel.url;
            xhrLogger.debug("Reopening request #" + this._id + " " + method + " " + url);
        }
        else {
            throw new TypeError("Cannot reopen request");
        }
        try {
            channel.reopening();
            channel.opening();
            this._open(method, url, channel.async, channel.username, channel.password);
            channel.opened();
            this._restoreParams();
            this.resumeEvents(); // Resume events and clear possibly lingering events from previous execution
        }
        catch (error) {
            xhrLogger.warning("Failed to reopen request #" + this._id + " " + method + " " + url + ": " + error.message);
            channel["catch"](error);
        }
    };

    /**
     * Repeats a request
     * (non standard)
     */
    XMLHttpRequestPrototype.repeat = function () {
        var channel = this._channel, self = this;
        if (!channel) {
            throw new TypeError("Cannot repeat request");
        }
        if (isFirefox) {
            // In Firefox some lingering events from 1st execution are fired whereas they should not
            setTimeout(function () {
                self.abort();
                self.reopen();
                self.send(self._data);
            }, 0);
        }
        else {
            this.abort();
            this.reopen();
            this.send(this._data);
        }
    };

    XMLHttpRequestPrototype.toString = function () {
        var channel = this._channel, str = "[object XMLHttpRequest]";
        if (channel) {
            str += "#" + this._id + " " + channel.method + " " + channel.url;
        }
        return str;
    };

    Object.defineProperties(XMLHttpRequestPrototype, {
        "channel": {
            get: function () {
                return this._channel;
            }
        },
        "headers": {
            get: function () {
                var headers = this._headers;
                if (!headers) {
                    headers = {};
                    this._headers = headers;
                }
                return headers;
            }
        },
        "id": {
            get: function () {
                return this._id;
            }
        }
    });

    // ------------------------------------------------------------
    //      Implementation
    // ------------------------------------------------------------
    XMLHttpRequestPrototype._clearParams = function () {
        delete this._headers;
        delete this._withCredentials;
        delete this._timeout;
        delete this._data;
    };
    XMLHttpRequestPrototype._restoreParams = function () {
        var timeout, headers;
        if (this._headers) {
            headers = this._headers;
            this._headers = {};
            this.setRequestHeaders(headers);
        }
        if (this._withCredentials) {
            this.withCredentials = true;
        }
        timeout = this._timeout;
        if (timeout) {
            this.timeout = timeout;
        }
    };
    XMLHttpRequestPrototype._saveParams = function (data) {
        var timeout;
        if ((data !== undefined) && (data !== null)) {
            this._data = data;
        }
        if (this.withCredentials) {
            this._withCredentials = true;
        }
        timeout = this.timeout;
        if (timeout) {
            this._timeout = timeout;
        }
    };
    Object.defineProperties(XMLHttpRequest, {
        "logger": {
            get: function () {
                return Log.logger;
            },
            set: function (logger) {
                Log.logger = logger;
            }
        }
    });
}

if (!XMLHttpRequest._SAP_ENHANCED) {
    xhrEnhance();
}
module.exports = XMLHttpRequest;
},{"./ChannelFactory.js":2,"./EventHandlers.js":5,"./Log.js":8}]},{},[18])(18)
});


    return module.exports;
});
