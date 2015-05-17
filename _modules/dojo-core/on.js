(function (deps, factory) {
    if (typeof module === 'object' && typeof module.exports === 'object') {
        var v = factory(require, exports); if (v !== undefined) module.exports = v;
    }
    else if (typeof define === 'function' && define.amd) {
        define(deps, factory);
    }
})(["require", "exports", './lang'], function (require, exports) {
    var lang_1 = require('./lang');
    function emit(target, event) {
        if (target.dispatchEvent && target.ownerDocument && target.ownerDocument.createEvent) {
            var nativeEvent = target.ownerDocument.createEvent('HTMLEvents');
            nativeEvent.initEvent(event.type, Boolean(event.bubbles), Boolean(event.cancelable));
            for (var key in event) {
                if (!(key in nativeEvent)) {
                    nativeEvent[key] = event[key];
                }
            }
            return target.dispatchEvent(nativeEvent);
        }
        if (target.emit) {
            if (target.removeListener) {
                target.emit(event.type, event);
                return false;
            }
            else if (target.on) {
                target.emit(event);
                return false;
            }
        }
        throw new Error('Target must be an event emitter');
    }
    exports.emit = emit;
    function on(target, type, listener, capture) {
        if (type.call) {
            return type.call(this, target, listener, capture);
        }
        if (Array.isArray(type)) {
            var handles = type.map(function (type) {
                return on(target, type, listener, capture);
            });
            return lang_1.createCompositeHandle.apply(void 0, handles);
        }
        var callback = function () {
            listener.apply(this, arguments);
        };
        if (target.addEventListener && target.removeEventListener) {
            target.addEventListener(type, callback, capture);
            return lang_1.createHandle(function () {
                target.removeEventListener(type, callback, capture);
            });
        }
        if (target.on) {
            if (target.removeListener) {
                target.on(type, callback);
                return lang_1.createHandle(function () {
                    target.removeListener(type, callback);
                });
            }
            else if (target.emit) {
                return target.on(type, listener);
            }
        }
        throw new TypeError('Unknown event emitter object');
    }
    exports.default = on;
});
//# sourceMappingURL=_debug/on.js.map