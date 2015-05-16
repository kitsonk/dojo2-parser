(function (deps, factory) {
    if (typeof module === 'object' && typeof module.exports === 'object') {
        var v = factory(require, exports); if (v !== undefined) module.exports = v;
    }
    else if (typeof define === 'function' && define.amd) {
        define(deps, factory);
    }
})(["require", "exports", './ReadableStream'], function (require, exports) {
    var ReadableStream_1 = require('./ReadableStream');
    /**
     * 3.5.9-1 has been ignored
     */
    function isReadableStreamController(x) {
        return Object.prototype.hasOwnProperty.call(x, '_controlledReadableStream');
    }
    exports.isReadableStreamController = isReadableStreamController;
    var ReadableStreamController = (function () {
        function ReadableStreamController(stream) {
            if (!stream.readable) {
                throw new TypeError('3.3.3-1: ReadableStreamController can only be constructed with a ReadableStream instance');
            }
            if (stream.controller !== undefined) {
                throw new TypeError('ReadableStreamController instances can only be created by the ReadableStream constructor');
            }
            this._controlledReadableStream = stream;
        }
        Object.defineProperty(ReadableStreamController.prototype, "desiredSize", {
            /**
             * 3.3.4.1. get desiredSize
             * @returns {number}
             */
            get: function () {
                return this._controlledReadableStream.desiredSize;
            },
            enumerable: true,
            configurable: true
        });
        /**
         *
         */
        ReadableStreamController.prototype.close = function () {
            if (!isReadableStreamController(this)) {
                throw new TypeError('3.3.4.2-1: ReadableStreamController#close can only be used on a ReadableStreamController');
            }
            var stream = this._controlledReadableStream;
            if (stream.closeRequested) {
                throw new TypeError('3.3.4.2-3: The stream has already been closed; do not close it again!');
            }
            if (stream.state === ReadableStream_1.State.Errored) {
                throw new TypeError('3.3.4.2-4: The stream is in an errored state and cannot be closed');
            }
            return stream.requestClose();
        };
        /**
         *
         */
        ReadableStreamController.prototype.enqueue = function (chunk) {
            if (!isReadableStreamController(this)) {
                throw new TypeError('3.3.4.3-1: ReadableStreamController#enqueue can only be used on a ReadableStreamController');
            }
            var stream = this._controlledReadableStream;
            if (stream.state === ReadableStream_1.State.Errored) {
                throw stream.storedError;
            }
            if (stream.closeRequested) {
                throw new TypeError('3.3.4.3-4: stream is draining');
            }
            stream.enqueue(chunk);
        };
        /**
         *
         */
        ReadableStreamController.prototype.error = function (e) {
            if (!isReadableStreamController(this)) {
                throw new TypeError('3.3.4.3-1: ReadableStreamController#enqueue can only be used on a ReadableStreamController');
            }
            if (this._controlledReadableStream.state !== ReadableStream_1.State.Readable) {
                throw new TypeError("3.3.4.3-2: the stream is " + this._controlledReadableStream.state + " and so cannot be errored");
            }
            // return errorReadableStream(this._controlledReadableStream, e);
            this._controlledReadableStream.error(e);
        };
        return ReadableStreamController;
    })();
    exports.default = ReadableStreamController;
});
//# sourceMappingURL=../_debug/streams/ReadableStreamController.js.map