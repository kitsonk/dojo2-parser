import assert = require('intern/chai!assert');
import registerSuite = require('intern!object');
import parser = require('src/parser');
import jsdom = require('dojo/has!host-node?../jsdom');

interface ParserTestInterface extends parser.ParserObject {
    foo: any;
}

registerSuite({
    name: 'parser',
    'basic': function () {
        var doc: Document = typeof document === 'undefined' ? jsdom.jsdom('<html><body></body></html>') : document;
        var dfd = this.async(250);
        var watchHandle = parser.watch(doc);

        var TestCtor = function TestCtor(node: HTMLElement, options: any) {
            assert(node);
            assert.isTrue(options.bar);
        };
        TestCtor.prototype = <ParserTestInterface> {
            'foo': 'bar'
        };

        var registerHandle = parser.register('test-div', {
            Ctor: TestCtor,
            doc: doc
        });

        doc.body.innerHTML = "<div is='test-div' id='test1'" +
            " data-options='{ \"bar\": true }'></div><test-div id='test2'" +
            " data-options='{ \"bar\": true }'></test-div>";

        var test1 = doc.getElementById('test1');
        var test2 = doc.getElementById('test2');

        /* watching only fires at the end of the turn, therefore need to
         * complete test asnyc. */
        setTimeout(function () {
            assert.equal((<ParserTestInterface> parser.byId('test1')).foo, 'bar');
            assert.strictEqual(parser.byId('test1').node, test1);
            assert.strictEqual(parser.byNode(test1).id, 'test1');

            assert.equal((<ParserTestInterface> parser.byId('test2')).foo, 'bar');
            assert.strictEqual(parser.byId('test2').node, test2);
            assert.strictEqual(parser.byNode(test2).id, 'test2');

            watchHandle.remove();
            registerHandle.remove();
            doc.body.innerHTML = '';
            dfd.resolve();
        }, 100);
    }
});
