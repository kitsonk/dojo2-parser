import assert = require('intern/chai!assert');
import registerSuite = require('intern!object');
import watch, { WatcherRecord, WatchType } from 'src/watcher';
import { jsdom } from 'src/has!host-node?../jsdom';
import { queueMicroTask } from 'dojo-core/queue';
import { Handle } from 'dojo-core/interfaces';

let doc: Document;

registerSuite({
    name: 'watcher',
    setup: function () {
        doc = typeof document === 'undefined' ? jsdom('<html><body></body></html>') : document;
        doc.body.innerHTML = '';
    },
    'basic': function () {
        const dfd = this.async(250);

        let handle: Handle;
        let div: HTMLDivElement;

        const callback = function (changes: WatcherRecord[]) {
            /* jsdom doesn't create text nodes, but other browsers do, but lets just focus on the nodes we care about */
            changes = changes.filter(function (value: WatcherRecord) {
                return value.node.nodeType === 1;
            });
            assert.equal(changes.length, 3);
            assert.equal(changes[0].type, WatchType.Added);
            assert.equal(changes[1].type, WatchType.Added);
            assert.equal(changes[2].type, WatchType.Added);
            assert.equal(changes[2].node, div);
            handle.destroy();
            doc.body.innerHTML = '';
            dfd.resolve();
        };

        handle = watch(doc.body, callback);
        doc.body.innerHTML = '<div></div><div></div>';
        div = doc.createElement('div');
        doc.body.appendChild(div);
    }
});
