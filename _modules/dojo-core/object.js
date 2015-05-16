(function (deps, factory) {
    if (typeof module === 'object' && typeof module.exports === 'object') {
        var v = factory(require, exports); if (v !== undefined) module.exports = v;
    }
    else if (typeof define === 'function' && define.amd) {
        define(deps, factory);
    }
})(["require", "exports"], function (require, exports) {
    /**
     * Copies the values of all enumerable own properties of one or more source objects to the target object.
     * @return The modified target object
     */
    function assign(target) {
        var sources = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            sources[_i - 1] = arguments[_i];
        }
        if (target == null) {
            throw new TypeError('Cannot convert first argument to object');
        }
        target = Object(target);
        for (var i = 0, length_1 = sources.length, source = void 0; i < length_1; i++) {
            source = sources[i];
            if (source) {
                source = Object(source);
                var keys = Object.keys(source);
                for (var j = 0, keysLength = keys.length, key = void 0; j < keysLength; j++) {
                    key = keys[j];
                    target[key] = source[key];
                }
            }
        }
        return target;
    }
    exports.assign = assign;
    /**
     * Determines whether two values are the same value.
     * @return true if the values are the same; false otherwise
     */
    function is(value1, value2) {
        if (value1 === value2) {
            return value1 !== 0 || 1 / value1 === 1 / value2; // -0
        }
        return value1 !== value1 && value2 !== value2; // NaN
    }
    exports.is = is;
});
//# sourceMappingURL=_debug/object.js.map