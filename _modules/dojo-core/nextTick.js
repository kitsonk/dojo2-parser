(function (deps, factory) {
    if (typeof module === 'object' && typeof module.exports === 'object') {
        var v = factory(require, exports); if (v !== undefined) module.exports = v;
    }
    else if (typeof define === 'function' && define.amd) {
        define(deps, factory);
    }
})(["require", "exports", './has'], function (require, exports) {
    var has_1 = require('./has');
    /**
     * Create macro-scheduler based nextTick function.
     */
    function createMacroScheduler(schedule, clearSchedule) {
        var queue = new CallbackQueue();
        var timer;
        return function (callback) {
            var handle = queue.add(callback);
            if (!timer) {
                timer = schedule(function () {
                    clearSchedule(timer);
                    timer = null;
                    queue.drain();
                }, 0);
            }
            return handle;
        };
    }
    /**
     * A queue of callbacks that will be executed in FIFO order when the queue is drained.
     */
    var CallbackQueue = (function () {
        function CallbackQueue() {
            this._callbacks = [];
        }
        CallbackQueue.prototype.add = function (callback) {
            var _callback = {
                isActive: true,
                callback: callback
            };
            this._callbacks.push(_callback);
            callback = null;
            return {
                destroy: function () {
                    this.destroy = function () { };
                    _callback.isActive = false;
                    _callback = null;
                }
            };
        };
        CallbackQueue.prototype.drain = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i - 0] = arguments[_i];
            }
            var callbacks = this._callbacks;
            var item;
            var count = callbacks.length;
            // Any callbacks added after drain is called will be processed
            // the next time drain is called
            this._callbacks = [];
            for (var i = 0; i < count; i++) {
                item = callbacks[i];
                if (item && item.isActive) {
                    item.callback.apply(null, args);
                }
            }
        };
        return CallbackQueue;
    })();
    var nextTick;
    var nodeVersion = has_1.default('host-node');
    if (nodeVersion) {
        // In Node.JS 0.9.x and 0.10.x, deeply recursive process.nextTick calls can cause stack overflows, so use
        // setImmediate.
        if (nodeVersion.indexOf('0.9.') === 0 || nodeVersion.indexOf('0.10.') === 0) {
            nextTick = createMacroScheduler(setImmediate, clearImmediate);
        }
        else {
            nextTick = function (callback) {
                var removed = false;
                process.nextTick(function () {
                    // There isn't an API to remove a pending call from `process.nextTick`
                    if (removed) {
                        return;
                    }
                    callback();
                });
                return {
                    destroy: function () {
                        this.destroy = function () { };
                        removed = true;
                    }
                };
            };
        }
    }
    else if (has_1.default('dom-mutationobserver')) {
        var queue = new CallbackQueue();
        nextTick = (function () {
            var MutationObserver = this.MutationObserver || this.WebKitMutationObserver;
            var element = document.createElement('div');
            var observer = new MutationObserver(function () {
                queue.drain();
            });
            observer.observe(element, { attributes: true });
            return function (callback) {
                var handle = queue.add(callback);
                element.setAttribute('drainQueue', '1');
                return handle;
            };
        })();
    }
    else {
        // If nothing better is available, fallback to setTimeout
        nextTick = createMacroScheduler(setTimeout, clearTimeout);
    }
    exports.default = nextTick;
});
//# sourceMappingURL=_debug/nextTick.js.map