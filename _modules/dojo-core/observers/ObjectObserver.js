var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
(function (deps, factory) {
    if (typeof module === 'object' && typeof module.exports === 'object') {
        var v = factory(require, exports); if (v !== undefined) module.exports = v;
    }
    else if (typeof define === 'function' && define.amd) {
        define(deps, factory);
    }
})(["require", "exports", '../object', '../has', '../Scheduler'], function (require, exports) {
    var object_1 = require('../object');
    var has_1 = require('../has');
    var Scheduler_1 = require('../Scheduler');
    has_1.add('object-observe', typeof Object.observe === 'function');
    var BaseObjectObserver = (function () {
        function BaseObjectObserver(kwArgs) {
            this._listener = kwArgs.listener;
            this._propertyStore = {};
            this._target = kwArgs.target;
        }
        return BaseObjectObserver;
    })();
    var Es7Observer = (function (_super) {
        __extends(Es7Observer, _super);
        function Es7Observer(kwArgs) {
            _super.call(this, kwArgs);
            this.onlyReportObserved = ('onlyReportObserved' in kwArgs) ? kwArgs.onlyReportObserved : true;
            this._setObserver();
        }
        Es7Observer.prototype.destroy = function () {
            var target = this._target;
            Object.unobserve(target, this._observeHandler);
            this._listener = this._observeHandler = this._propertyStore = this._target = null;
        };
        Es7Observer.prototype.observeProperty = function () {
            var properties = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                properties[_i - 0] = arguments[_i];
            }
            var store = this._propertyStore;
            properties.forEach(function (property) {
                store[property] = 1;
            });
        };
        Es7Observer.prototype.removeProperty = function () {
            var properties = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                properties[_i - 0] = arguments[_i];
            }
            var store = this._propertyStore;
            properties.forEach(function (property) {
                // Since the store is just a simple map, using the `delete` operator is not problematic.
                delete store[property];
            });
        };
        Es7Observer.prototype._setObserver = function () {
            var target = this._target;
            var store = this._propertyStore;
            this._observeHandler = function (changes) {
                var propertyMap = {};
                var events = changes.reduce(function (events, change) {
                    var property = change.name;
                    if (!this.onlyReportObserved || (property in store)) {
                        if (property in propertyMap) {
                            events.splice(propertyMap[property], 1);
                        }
                        propertyMap[property] = events.length;
                        events.push({
                            target: target,
                            name: property
                        });
                    }
                    return events;
                }.bind(this), []);
                if (events.length) {
                    this._listener(events);
                }
            }.bind(this);
            Object.observe(target, this._observeHandler);
        };
        return Es7Observer;
    })(BaseObjectObserver);
    exports.Es7Observer = Es7Observer;
    function getPropertyDescriptor(target, property) {
        var descriptor;
        if (!(property in target)) {
            return {
                enumerable: true,
                configurable: true,
                writable: true
            };
        }
        do {
            descriptor = Object.getOwnPropertyDescriptor(target, property);
        } while (!descriptor && (target = Object.getPrototypeOf(target)));
        return descriptor;
    }
    var Es5Observer = (function (_super) {
        __extends(Es5Observer, _super);
        function Es5Observer(kwArgs) {
            _super.call(this, kwArgs);
            if (!this.constructor._scheduler) {
                this.constructor._scheduler = new Scheduler_1.default({ type: 'micro' });
            }
            this.nextTurn = ('nextTurn' in kwArgs) ? kwArgs.nextTurn : true;
            this._descriptors = {};
            this._scheduler = this.constructor._scheduler;
            this._boundDispatch = this._dispatch.bind(this);
        }
        Es5Observer.prototype.destroy = function () {
            var descriptors = this._descriptors;
            Object.keys(descriptors).forEach(this._restore, this);
            this._descriptors = this._listener = this._propertyStore = this._target = null;
        };
        Es5Observer.prototype.observeProperty = function () {
            var properties = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                properties[_i - 0] = arguments[_i];
            }
            var target = this._target;
            var store = this._propertyStore;
            var self = this;
            properties.forEach(function (property) {
                var descriptor = getPropertyDescriptor(target, property);
                if (descriptor.writable) {
                    var observableDescriptor = {
                        configurable: descriptor ? descriptor.configurable : true,
                        enumerable: descriptor ? descriptor.enumerable : true,
                        get: function () {
                            return store[property];
                        },
                        set: function (value) {
                            var previous = store[property];
                            if (!object_1.is(value, previous)) {
                                store[property] = value;
                                self._schedule(property);
                            }
                        }
                    };
                    store[property] = target[property];
                    self._descriptors[property] = descriptor;
                    Object.defineProperty(target, property, observableDescriptor);
                }
            });
        };
        Es5Observer.prototype.removeProperty = function () {
            var properties = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                properties[_i - 0] = arguments[_i];
            }
            var store = this._propertyStore;
            properties.forEach(function (property) {
                this._restore(property);
                // Since the store is just a simple map, using the `delete` operator is not problematic.
                delete store[property];
            }, this);
        };
        Es5Observer.prototype._dispatch = function () {
            var queue = this._currentlyScheduled;
            var events = Object.keys(queue).map(function (property) {
                return queue[property];
            });
            this._currentlyScheduled = null;
            this._listener(events);
        };
        Es5Observer.prototype._restore = function (property) {
            var target = this._target;
            var store = this._propertyStore;
            Object.defineProperty(target, property, (this._descriptors[property] || {
                configurable: true,
                enumerable: true,
                value: target[property],
                writable: true
            }));
            target[property] = store[property];
        };
        Es5Observer.prototype._schedule = function (property) {
            var event = {
                target: this._target,
                name: property
            };
            if (this.nextTurn) {
                if (!this._currentlyScheduled) {
                    this._currentlyScheduled = {};
                    this._scheduler.schedule(this._boundDispatch);
                }
                this._currentlyScheduled[property] = event;
            }
            else {
                this._listener([event]);
            }
        };
        return Es5Observer;
    })(BaseObjectObserver);
    exports.Es5Observer = Es5Observer;
});
//# sourceMappingURL=../_debug/observers/ObjectObserver.js.map