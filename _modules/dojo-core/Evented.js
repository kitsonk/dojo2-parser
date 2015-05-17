(function (deps, factory) {
    if (typeof module === 'object' && typeof module.exports === 'object') {
        var v = factory(require, exports); if (v !== undefined) module.exports = v;
    }
    else if (typeof define === 'function' && define.amd) {
        define(deps, factory);
    }
})(["require", "exports", './aspect'], function (require, exports) {
    var aspect_1 = require('./aspect');
    var Evented = (function () {
        function Evented() {
        }
        Evented.prototype.emit = function (data) {
            var type = '__on' + data.type;
            var method = this[type];
            if (method) {
                return method.call(this, data);
            }
        };
        Evented.prototype.on = function (type, listener) {
            var name = '__on' + type;
            if (!this[name]) {
                Object.defineProperty(this, name, {
                    configurable: true,
                    value: undefined,
                    writable: true
                });
            }
            return aspect_1.on(this, '__on' + type, listener);
        };
        return Evented;
    })();
    exports.default = Evented;
});
//# sourceMappingURL=_debug/Evented.js.map