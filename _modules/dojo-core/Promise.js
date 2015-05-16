(function (deps, factory) {
    if (typeof module === 'object' && typeof module.exports === 'object') {
        var v = factory(require, exports); if (v !== undefined) module.exports = v;
    }
    else if (typeof define === 'function' && define.amd) {
        define(deps, factory);
    }
})(["require", "exports", './nextTick', './global', './has'], function (require, exports) {
    var nextTick_1 = require('./nextTick');
    var global_1 = require('./global');
    var has_1 = require('./has');
    /**
     * Return true if a given value meets Promise's definition of "iterable".
     */
    function isIterable(value) {
        return Array.isArray(value);
    }
    /**
     * Return true if a given value has a `then` method.
     */
    function isThenable(value) {
        return value && typeof value.then === 'function';
    }
    exports.isThenable = isThenable;
    /**
     * Copy an array of values, replacing any PlatformPromises in the copy with unwrapped global.Promises. This is necessary
     * for .all and .race so that the native promise doesn't treat the PlatformPromises like generic thenables.
     */
    function unwrapPromises(items) {
        if (!isIterable(items)) {
            throw new Error('invalid argument');
        }
        var unwrapped = [];
        var count = items.length;
        for (var i = 0; i < count; i++) {
            var item = items[i];
            unwrapped[i] = item instanceof Promise ? item.promise : item;
        }
        return unwrapped;
    }
    /**
     * PromiseShim is an implementation of the ES2015 Promise specification.
     *
     * @borrows Promise.all as PromiseShim.all
     * @borrows Promise.race as PromiseShim.race
     * @borrows Promise.reject as PromiseShim.reject
     * @borrows Promise.resolve as PromiseShim.resolve
     * @borrows Promise#catch as PromiseShim#catch
     * @borrows Promise#then as PromiseShim#then
     */
    var PromiseShim = (function () {
        /**
         * Creates a new PromiseShim.
         *
         * @constructor
         *
         * @param executor
         * The executor function is called immediately when the PromiseShim is instantiated. It is responsible for
         * starting the asynchronous operation when it is invoked.
         *
         * The executor must call either the passed `resolve` function when the asynchronous operation has completed
         * successfully, or the `reject` function when the operation fails.
         */
        function PromiseShim(executor) {
            var _this = this;
            /**
             * The current state of this promise.
             */
            this.state = State.Pending;
            /**
             * If true, the resolution of this promise is chained ("locked in") to another promise.
             */
            var isChained = false;
            /**
             * Whether or not this promise is in a resolved state.
             */
            var isResolved = function () {
                return _this.state !== State.Pending || isChained;
            };
            /**
             * Callbacks that should be invoked once the asynchronous operation has completed.
             */
            var callbacks = [];
            /**
             * Initially pushes callbacks onto a queue for execution once this promise settles. After the promise settles,
             * enqueues callbacks for execution on the next event loop turn.
             */
            var whenFinished = function (callback) {
                callbacks.push(callback);
            };
            /**
             * Schedules a callback for execution during the next round through the event loop.
             *
             * @method
             * @param callback The callback to execute on the next turn through the event loop.
             */
            function enqueue(callback) {
                nextTick_1.default(callback);
            }
            /**
             * Settles this promise.
             *
             * @param newState The resolved state for this promise.
             * @param {T|Error} value The resolved value for this promise.
             */
            var settle = function (newState, value) {
                // A promise can only be settled once.
                if (_this.state !== State.Pending) {
                    return;
                }
                _this.state = newState;
                _this.resolvedValue = value;
                whenFinished = enqueue;
                // Only enqueue a callback runner if there are callbacks so that initially fulfilled Promises don't have to
                // wait an extra turn.
                if (callbacks.length > 0) {
                    enqueue(function () {
                        var count = callbacks.length;
                        for (var i = 0; i < count; ++i) {
                            callbacks[i].call(null);
                        }
                        callbacks = null;
                    });
                }
            };
            /**
             * Resolves this promise.
             *
             * @param newState The resolved state for this promise.
             * @param {T|Error} value The resolved value for this promise.
             */
            var resolve = function (newState, value) {
                if (isResolved()) {
                    return;
                }
                if (value === _this) {
                    settle(State.Rejected, new TypeError('Cannot chain a promise to itself'));
                }
                else if (isThenable(value)) {
                    value.then(settle.bind(null, State.Fulfilled), settle.bind(null, State.Rejected));
                    isChained = true;
                }
                else {
                    settle(newState, value);
                }
            };
            this.then = function (onFulfilled, onRejected) {
                return new PromiseShim(function (resolve, reject) {
                    // whenFinished initially queues up callbacks for execution after the promise has settled. Once the
                    // promise has settled, whenFinished will schedule callbacks for execution on the next turn through the
                    // event loop.
                    whenFinished(function () {
                        var callback = _this.state === State.Rejected ? onRejected : onFulfilled;
                        if (typeof callback === 'function') {
                            try {
                                resolve(callback(_this.resolvedValue));
                            }
                            catch (error) {
                                reject(error);
                            }
                        }
                        else if (_this.state === State.Rejected) {
                            reject(_this.resolvedValue);
                        }
                        else {
                            resolve(_this.resolvedValue);
                        }
                    });
                });
            };
            try {
                executor(resolve.bind(null, State.Fulfilled), resolve.bind(null, State.Rejected));
            }
            catch (error) {
                settle(State.Rejected, error);
            }
        }
        PromiseShim.all = function (items) {
            return new this(function (resolve, reject) {
                var values = [];
                var complete = 0;
                var total = 0;
                var populating = true;
                function fulfill(index, value) {
                    values[index] = value;
                    ++complete;
                    finish();
                }
                function finish() {
                    if (populating || complete < total) {
                        return;
                    }
                    resolve(values);
                }
                function processItem(index, item) {
                    ++total;
                    if (item instanceof PromiseShim) {
                        // If an item PromiseShim rejects, this PromiseShim is immediately rejected with the item
                        // PromiseShim's rejection error.
                        item.then(fulfill.bind(null, index), reject);
                    }
                    else {
                        PromiseShim.resolve(item).then(fulfill.bind(null, index));
                    }
                }
                if (!isIterable(items)) {
                    throw new Error('invalid argument');
                }
                var count = items.length;
                for (var i = 0; i < count; ++i) {
                    // Handle sparse arrays
                    if (i in items) {
                        processItem(i, items[i]);
                    }
                }
                populating = false;
                finish();
            });
        };
        PromiseShim.race = function (items) {
            return new this(function (resolve, reject) {
                if (!isIterable(items)) {
                    throw new Error('invalid argument');
                }
                var count = items.length;
                var item;
                for (var i = 0; i < count; ++i) {
                    // Handle sparse arrays
                    if (i in items) {
                        item = items[i];
                        if (item instanceof PromiseShim) {
                            // If a PromiseShim item rejects, this PromiseShim is immediately rejected with the item
                            // PromiseShim's rejection error.
                            item.then(resolve, reject);
                        }
                        else {
                            PromiseShim.resolve(item).then(resolve);
                        }
                    }
                }
            });
        };
        PromiseShim.reject = function (reason) {
            return new this(function (resolve, reject) {
                reject(reason);
            });
        };
        PromiseShim.resolve = function (value) {
            if (value instanceof PromiseShim) {
                return value;
            }
            return new this(function (resolve) {
                resolve(value);
            });
        };
        return PromiseShim;
    })();
    exports.PromiseShim = PromiseShim;
    /**
     * PromiseConstructor points to the promise constructor this platform should use.
     */
    var PromiseConstructor = has_1.default('promise') ? global_1.default.Promise : PromiseShim;
    /**
     * PlatformPromise is a very thin wrapper around either a native promise implementation or PromiseShim.
     */
    var Promise = (function () {
        /**
         * Creates a new Promise.
         *
         * @constructor
         *
         * @param executor
         * The executor function is called immediately when the PromiseShim is instantiated. It is responsible for
         * starting the asynchronous operation when it is invoked.
         *
         * The executor must call either the passed `resolve` function when the asynchronous operation has completed
         * successfully, or the `reject` function when the operation fails.
         */
        function Promise(executor) {
            var _this = this;
            // Wrap the executor to verify that the the resolution value isn't this promise. Since any incoming promise
            // should be wrapped, the native resolver can't automatically detect self-resolution.
            this.promise = new Promise.PromiseConstructor((function (resolve, reject) {
                executor(function (value) {
                    if (value === _this) {
                        reject(new TypeError('Cannot chain a promise to itself'));
                    }
                    else {
                        resolve(value);
                    }
                }, function (reason) {
                    reject(reason);
                });
            }));
            this._state = State.Pending;
            this.promise.then(function () { _this._state = State.Fulfilled; }, function () { _this._state = State.Rejected; });
        }
        /**
         * Converts an iterable object containing promises into a single promise that resolves to a new iterable object
         * containing the fulfilled values of all the promises in the iterable, in the same order as the Promises in the
         * iterable. Iterable values that are not promises are converted to promises using PromiseShim.resolve.
         *
         * @example
         * PromiseShim.all([ PromiseShim.resolve('foo'), 'bar' ]).then(function (value) {
         *     value[0] === 'foo'; // true
         *     value[1] === 'bar'; // true
         * });
         *
         * @example
         * PromiseShim.all({
         *     foo: PromiseShim.resolve('foo'),
         *     bar: 'bar'
         * }).then((value) => {
         *     value.foo === 'foo'; // true
         *     value.bar === 'bar'; // true
         * });
         */
        Promise.all = function (items) {
            return this.copy(Promise.PromiseConstructor.all(unwrapPromises(items)));
        };
        /**
         * Converts an iterable object containing promises into a single promise that resolves or rejects as soon as one of
         * the promises in the iterable resolves or rejects, with the value of the resolved or rejected promise. Values in
         * the iterable that are not Promises are converted to Promises with PromiseShim.resolve.
         *
         * @example
         * PromiseShim.race([ PromiseShim.resolve('foo'), PromiseShim.resolve('bar') ]).then((value) => {
         *     value === 'foo'; // true
         * });
         *
         * @example
         * PromiseShim.race({
         *     foo: PromiseShim.resolve('foo'),
         *     bar: PromiseShim.resolve('bar')
         * }).then((value) => {
         *     value === 'foo'; // true
         * });
         */
        Promise.race = function (items) {
            return this.copy(Promise.PromiseConstructor.race(unwrapPromises(items)));
        };
        /**
         * Creates a new promise that is rejected with the given error.
         */
        Promise.reject = function (reason) {
            return this.copy(Promise.PromiseConstructor.reject(reason));
        };
        Promise.resolve = function (value) {
            if (value instanceof Promise) {
                return value;
            }
            return this.copy(Promise.PromiseConstructor.resolve(value));
        };
        /**
         * Copy another Promise, taking on its inner state.
         */
        Promise.copy = function (other) {
            var promise = Object.create(this.prototype, {
                promise: { value: other instanceof Promise.PromiseConstructor ? other : other.promise }
            });
            if (other instanceof Promise && other._state !== State.Pending) {
                promise._state = other._state;
            }
            else {
                promise._state = State.Pending;
                promise.promise.then(function () { promise._state = State.Fulfilled; }, function () { promise._state = State.Rejected; });
            }
            return promise;
        };
        /**
         * Adds a callback to the promise to be invoked when the asynchronous operation throws an error.
         */
        Promise.prototype.catch = function (onRejected) {
            return this.then(null, onRejected);
        };
        /**
         * Allows for cleanup actions to be performed after resolution of a Promise.
         */
        Promise.prototype.finally = function (callback) {
            // Handler to be used for fulfillment and rejection; whether it was fulfilled or rejected is explicitly
            // indicated by the first argument
            function handler(rejected, valueOrError) {
                // If callback throws, the handler will throw
                var result = callback();
                if (isThenable(result)) {
                    // If callback returns a Thenable that rejects, return the rejection. Otherwise, return or throw the
                    // incoming value as appropriate when the Thenable resolves.
                    return Promise.resolve(result).then(function () {
                        if (rejected) {
                            throw valueOrError;
                        }
                        return valueOrError;
                    });
                }
                else {
                    // If callback returns a non-Thenable, return or throw the incoming value as appropriate.
                    if (rejected) {
                        throw valueOrError;
                    }
                    return valueOrError;
                }
            }
            ;
            return this.then(handler.bind(null, false), handler.bind(null, true));
        };
        Object.defineProperty(Promise.prototype, "state", {
            /**
             * The current Promise state.
             */
            get: function () {
                return this._state;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Adds a callback to the promise to be invoked when the asynchronous operation completes successfully.
         */
        Promise.prototype.then = function (onFulfilled, onRejected) {
            return Promise.copy(this.promise.then(onFulfilled, onRejected));
        };
        /**
         * Points to the promise constructor this platform should use.
         */
        Promise.PromiseConstructor = has_1.default('promise') ? global_1.default.Promise : PromiseShim;
        return Promise;
    })();
    exports.default = Promise;
    /**
     * The State enum represents the possible states of a promise.
     */
    (function (State) {
        State[State["Fulfilled"] = 0] = "Fulfilled";
        State[State["Pending"] = 1] = "Pending";
        State[State["Rejected"] = 2] = "Rejected";
    })(exports.State || (exports.State = {}));
    var State = exports.State;
});
//# sourceMappingURL=_debug/Promise.js.map