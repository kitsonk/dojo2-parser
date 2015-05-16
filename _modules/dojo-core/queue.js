(function (deps, factory) {
    if (typeof module === 'object' && typeof module.exports === 'object') {
        var v = factory(require, exports); if (v !== undefined) module.exports = v;
    }
    else if (typeof define === 'function' && define.amd) {
        define(deps, factory);
    }
})(["require", "exports", './global', './has'], function (require, exports) {
    var global_1 = require('./global');
    var has_1 = require('./has');
    function executeTask(item) {
        if (item.isActive) {
            item.callback();
        }
    }
    function getQueueHandle(item, destructor) {
        return {
            destroy: function () {
                this.destroy = function () { };
                item.isActive = false;
                item.callback = null;
                if (destructor) {
                    destructor();
                }
            }
        };
    }
    exports.queueTask = (function () {
        var enqueue;
        var destructor;
        // Since the IE implementation of `setImmediate` is not flawless, we will test for
        // `postMessage` first.
        if (has_1.default('postmessage')) {
            var queue = [];
            global_1.default.addEventListener('message', function (event) {
                // Confirm that the event was triggered by the current window and by this particular implementation.
                if (event.source === global_1.default && event.data === 'dojo-queue-message') {
                    event.stopPropagation();
                    if (queue.length) {
                        executeTask(queue.shift());
                    }
                }
            });
            enqueue = function (item) {
                queue.push(item);
                global_1.default.postMessage('dojo-queue-message', '*');
            };
        }
        else if (has_1.default('setimmediate')) {
            destructor = global_1.default.clearImmediate;
            enqueue = function (item) {
                return setImmediate(executeTask.bind(null, item));
            };
        }
        else {
            destructor = global_1.default.clearTimeout;
            enqueue = function (item) {
                return setTimeout(executeTask.bind(null, item), 0);
            };
        }
        return function (callback) {
            var item = {
                isActive: true,
                callback: callback
            };
            var id = enqueue(item);
            return getQueueHandle(item, destructor && function () {
                destructor(id);
            });
        };
    })();
    /**
     * Since requestAnimationFrame's behavior does not match that expected from `queueTask`, it is not used there.
     * However, at times it makes more sense to delegate to requestAnimationFrame; hence the following method.
     */
    exports.queueAnimationTask = (function () {
        if (!has_1.default('raf')) {
            return exports.queueTask;
        }
        return function (callback) {
            var item = {
                isActive: true,
                callback: callback
            };
            var rafId = requestAnimationFrame(executeTask.bind(null, item));
            return getQueueHandle(item, function () {
                cancelAnimationFrame(rafId);
            });
        };
    })();
    exports.queueMicroTask = (function () {
        var enqueue;
        if (has_1.default('promise')) {
            enqueue = function (item) {
                global_1.default.Promise.resolve(item).then(executeTask);
            };
        }
        else if (has_1.default('host-node')) {
            enqueue = function (item) {
                global_1.default.process.nextTick(executeTask.bind(null, item));
            };
        }
        else if (has_1.default('dom-mutationobserver')) {
            var HostMutationObserver = global_1.default.MutationObserver || global_1.default.WebKitMutationObserver;
            var queue = [];
            var node = document.createElement('div');
            var observer = new HostMutationObserver(function () {
                var item = queue.length && queue.shift();
                if (item && item.isActive) {
                    item.callback();
                }
            });
            observer.observe(node, { attributes: true });
            enqueue = function (item) {
                queue.push(item);
                node.setAttribute('queueStatus', '1');
            };
        }
        else {
            return exports.queueTask;
        }
        return function (callback) {
            var item = {
                isActive: true,
                callback: callback
            };
            enqueue(item);
            return getQueueHandle(item);
        };
    })();
});
//# sourceMappingURL=_debug/queue.js.map