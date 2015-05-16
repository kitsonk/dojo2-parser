(function (deps, factory) {
    if (typeof module === 'object' && typeof module.exports === 'object') {
        var v = factory(require, exports); if (v !== undefined) module.exports = v;
    }
    else if (typeof define === 'function' && define.amd) {
        define(deps, factory);
    }
})(["require", "exports", './observers/ObjectObserver', './has'], function (require, exports) {
    var ObjectObserver = require('./observers/ObjectObserver');
    var has_1 = require('./has');
    var slice = Array.prototype.slice;
    var hasOwnProperty = Object.prototype.hasOwnProperty;
    function isObject(item) {
        return item && typeof item === 'object' && !Array.isArray(item) && !(item instanceof RegExp);
    }
    function copyArray(array, kwArgs) {
        return array.map(function (item) {
            if (Array.isArray(item)) {
                return copyArray(item, kwArgs);
            }
            return isObject(item) ?
                copy({
                    sources: [item],
                    deep: kwArgs.deep,
                    descriptors: kwArgs.descriptors,
                    inherited: kwArgs.inherited,
                    assignPrototype: kwArgs.assignPrototype
                }) :
                item;
        });
    }
    function copy(kwArgs) {
        var target;
        var sources = kwArgs.sources;
        if (!sources.length) {
            throw new RangeError('lang.copy requires at least one source object.');
        }
        if (kwArgs.assignPrototype) {
            // create from the same prototype
            target = Object.create(Object.getPrototypeOf(sources[0]));
        }
        else {
            // use the target or create a new object
            target = kwArgs.target || {};
        }
        for (var i = 0; i < sources.length; i++) {
            // iterate through all the sources
            var source = sources[i];
            var name_1 = void 0;
            var value = void 0;
            if (kwArgs.descriptors) {
                // if we are copying descriptors, use to get{Own}PropertyNames so we get every property
                // (including non enumerables).
                var names = (kwArgs.inherited ? getPropertyNames : Object.getOwnPropertyNames)(source);
                for (var j = 0; j < names.length; j++) {
                    name_1 = names[j];
                    // get the descriptor
                    var descriptor = (kwArgs.inherited ?
                        getPropertyDescriptor : Object.getOwnPropertyDescriptor)(source, name_1);
                    value = descriptor.value;
                    if (kwArgs.deep) {
                        if (Array.isArray(value)) {
                            descriptor.value = copyArray(value, kwArgs);
                        }
                        else if (isObject(value)) {
                            descriptor.value = copy({
                                sources: [value],
                                deep: true,
                                descriptors: true,
                                inherited: kwArgs.inherited,
                                assignPrototype: kwArgs.assignPrototype
                            });
                        }
                    }
                    // and copy to the target
                    Object.defineProperty(target, name_1, descriptor);
                }
            }
            else {
                // If we aren't using descriptors, we use a standard for-in to simplify skipping
                // non-enumerables and inheritance. We could use Object.keys when we aren't inheriting.
                for (name_1 in source) {
                    if (kwArgs.inherited || hasOwnProperty.call(source, name_1)) {
                        value = source[name_1];
                        if (kwArgs.deep) {
                            if (Array.isArray(value)) {
                                value = copyArray(value, kwArgs);
                            }
                            else if (isObject(value)) {
                                value = copy({
                                    sources: [value],
                                    deep: true,
                                    inherited: kwArgs.inherited,
                                    assignPrototype: kwArgs.assignPrototype
                                });
                            }
                        }
                        target[name_1] = value;
                    }
                }
            }
        }
        return target;
    }
    exports.copy = copy;
    function create(prototype) {
        var mixins = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            mixins[_i - 1] = arguments[_i];
        }
        if (!mixins.length) {
            throw new RangeError('lang.create requires at least one mixin object.');
        }
        return copy({
            assignPrototype: false,
            deep: false,
            descriptors: false,
            inherited: false,
            target: Object.create(prototype),
            sources: mixins
        });
    }
    exports.create = create;
    function duplicate(source) {
        return copy({
            assignPrototype: true,
            deep: true,
            descriptors: true,
            sources: [source]
        });
    }
    exports.duplicate = duplicate;
    function getPropertyNames(object) {
        var setOfNames = {};
        var names = [];
        do {
            // go through each prototype to add the property names
            var ownNames = Object.getOwnPropertyNames(object);
            for (var i = 0, l = ownNames.length; i < l; i++) {
                var name_2 = ownNames[i];
                // check to make sure we haven't added it yet
                if (setOfNames[name_2] !== true) {
                    setOfNames[name_2] = true;
                    names.push(name_2);
                }
            }
            object = Object.getPrototypeOf(object);
        } while (object && object !== Object.prototype);
        return names;
    }
    exports.getPropertyNames = getPropertyNames;
    function getPropertyDescriptor(object, property) {
        var descriptor;
        do {
            descriptor = Object.getOwnPropertyDescriptor(object, property);
        } while (!descriptor && (object = Object.getPrototypeOf(object)));
        return descriptor;
    }
    exports.getPropertyDescriptor = getPropertyDescriptor;
    function isIdentical(a, b) {
        return a === b ||
            /* both values are NaN */
            (a !== a && b !== b);
    }
    exports.isIdentical = isIdentical;
    function lateBind(instance, method) {
        var suppliedArgs = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            suppliedArgs[_i - 2] = arguments[_i];
        }
        return suppliedArgs.length ?
            function () {
                var args = arguments.length ? suppliedArgs.concat(slice.call(arguments)) : suppliedArgs;
                // TS7017
                return instance[method].apply(instance, args);
            } :
            function () {
                return instance[method].apply(instance, arguments);
            };
    }
    exports.lateBind = lateBind;
    function observe(kwArgs) {
        var Ctor = kwArgs.nextTurn && has_1.default('object-observe') ? ObjectObserver.Es7Observer : ObjectObserver.Es5Observer;
        return new Ctor(kwArgs);
    }
    exports.observe = observe;
    function partial(targetFunction) {
        var suppliedArgs = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            suppliedArgs[_i - 1] = arguments[_i];
        }
        return function () {
            var args = arguments.length ? suppliedArgs.concat(slice.call(arguments)) : suppliedArgs;
            return targetFunction.apply(this, args);
        };
    }
    exports.partial = partial;
});
//# sourceMappingURL=_debug/lang.js.map