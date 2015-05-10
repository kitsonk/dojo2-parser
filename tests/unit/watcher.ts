import assert = require('intern/chai!assert');
import registerSuite = require('intern!object');
import watcher = require('src/watcher');
import jsdom = require('dojo/has!host-node?../jsdom');

registerSuite({
    name: 'watcher',
    'basic': function () {
        var dfd = this.async(250);
        var doc: Document = typeof document === 'undefined' ? jsdom.jsdom('<html><body></body></html>') : document;

        var callback = function (changes: watcher.WatcherRecord[]) {
            assert.equal(changes.length, 3);
            assert.equal(changes[0].type, watcher.WatchType.Added);
            assert.equal(changes[1].type, watcher.WatchType.Added);
            assert.equal(changes[2].type, watcher.WatchType.Added);
            assert.equal(changes[2].node, div);
            handle.remove();
            doc.body.innerHTML = '';
            dfd.resolve();
        };

        var handle = watcher.watch(doc.body, callback);
        doc.body.innerHTML = '<div></div><div></div>';
        var div = doc.createElement('div');
        doc.body.appendChild(div);
    }
});
