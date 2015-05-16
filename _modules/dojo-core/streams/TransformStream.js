(function (deps, factory) {
    if (typeof module === 'object' && typeof module.exports === 'object') {
        var v = factory(require, exports); if (v !== undefined) module.exports = v;
    }
    else if (typeof define === 'function' && define.amd) {
        define(deps, factory);
    }
})(["require", "exports", '../Promise', './ReadableStream', './WritableStream'], function (require, exports) {
    var Promise_1 = require('../Promise');
    var ReadableStream_1 = require('./ReadableStream');
    var WritableStream_1 = require('./WritableStream');
    var TransformStream = (function () {
        function TransformStream(transformer) {
            var writeChunk;
            var writeDone;
            var errorWritable;
            var transforming = false;
            var chunkWrittenButNotYetTransformed = false;
            var enqueueInReadable;
            var closeReadable;
            var errorReadable;
            function maybeDoTransform() {
                if (!transforming) {
                    transforming = true;
                    try {
                        transformer.transform(writeChunk, enqueueInReadable, transformDone);
                        writeChunk = undefined;
                        chunkWrittenButNotYetTransformed = false;
                    }
                    catch (e) {
                        transforming = false;
                        errorWritable(e);
                        errorReadable(e);
                    }
                }
            }
            function transformDone() {
                transforming = false;
                writeDone();
            }
            this.writable = new WritableStream_1.default({
                abort: function () {
                    return Promise_1.default.resolve();
                },
                start: function (error) {
                    errorWritable = error;
                    return Promise_1.default.resolve();
                },
                write: function (chunk) {
                    writeChunk = chunk;
                    chunkWrittenButNotYetTransformed = true;
                    var p = new Promise_1.default(function (resolve) {
                        writeDone = resolve;
                    });
                    maybeDoTransform();
                    return p;
                },
                close: function () {
                    try {
                        transformer.flush(enqueueInReadable, closeReadable);
                        return Promise_1.default.resolve();
                    }
                    catch (e) {
                        errorWritable(e);
                        errorReadable(e);
                        return Promise_1.default.reject(e);
                    }
                }
            }, transformer.writableStrategy);
            this.readable = new ReadableStream_1.default({
                start: function (controller) {
                    enqueueInReadable = controller.enqueue.bind(controller);
                    closeReadable = controller.close.bind(controller);
                    errorReadable = controller.error.bind(controller);
                    return Promise_1.default.resolve();
                },
                pull: function (controller) {
                    if (chunkWrittenButNotYetTransformed) {
                        maybeDoTransform();
                    }
                    return Promise_1.default.resolve();
                },
                cancel: function () {
                    return Promise_1.default.resolve();
                }
            }, transformer.readableStrategy);
        }
        return TransformStream;
    })();
    exports.default = TransformStream;
});
//# sourceMappingURL=../_debug/streams/TransformStream.js.map