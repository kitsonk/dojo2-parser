(function (deps, factory) {
    if (typeof module === 'object' && typeof module.exports === 'object') {
        var v = factory(require, exports); if (v !== undefined) module.exports = v;
    }
    else if (typeof define === 'function' && define.amd) {
        define(deps, factory);
    }
})(["require", "exports", '../../Promise'], function (require, exports) {
    var Promise_1 = require('../../Promise');
    var ReadableNodeStreamSource = (function () {
        function ReadableNodeStreamSource(nodeStream) {
            ;
            this._isClosed = false;
            this._nodeStream = nodeStream;
        }
        // Perform internal close logic
        ReadableNodeStreamSource.prototype._close = function () {
            this._isClosed = true;
            this._removeListeners();
            this._nodeStream.unpipe();
        };
        // Handle external request to close
        ReadableNodeStreamSource.prototype._handleClose = function () {
            this._close();
            this._controller.close();
        };
        ReadableNodeStreamSource.prototype._handleError = function (error) {
            this._close();
            this._controller.error(error);
        };
        ReadableNodeStreamSource.prototype._removeListeners = function () {
            this._nodeStream.removeListener('close', this._onClose);
            this._nodeStream.removeListener('data', this._onData);
            this._nodeStream.removeListener('end', this._onClose);
            this._nodeStream.removeListener('error', this._onError);
        };
        ReadableNodeStreamSource.prototype.cancel = function (reason) {
            this._handleClose();
            return Promise_1.default.resolve();
        };
        ReadableNodeStreamSource.prototype.pull = function (controller) {
            if (this._isClosed) {
                return Promise_1.default.reject(new Error('Stream is closed'));
            }
            this._nodeStream.pause();
            var chunk = this._nodeStream.read();
            if (chunk) {
                controller.enqueue(chunk);
            }
            this._nodeStream.resume();
            return Promise_1.default.resolve();
        };
        ReadableNodeStreamSource.prototype.start = function (controller) {
            this._controller = controller;
            this._onClose = this._handleClose.bind(this);
            this._onData = this._controller.enqueue.bind(this._controller);
            this._onError = this._handleError.bind(this);
            this._nodeStream.on('close', this._onClose);
            this._nodeStream.on('data', this._onData);
            this._nodeStream.on('end', this._onClose);
            this._nodeStream.on('error', this._onError);
            return Promise_1.default.resolve();
        };
        return ReadableNodeStreamSource;
    })();
    exports.default = ReadableNodeStreamSource;
});
//# sourceMappingURL=../../_debug/streams/adapters/ReadableNodeStreamSource.js.map