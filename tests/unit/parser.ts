import assert = require('intern/chai!assert');
import registerSuite = require('intern!object');
import parser = require('src/parser');

interface ParserTestInterface extends parser.ParserObject {
    foo: any;
}

registerSuite({
    name: 'parser',
    'basic': function () {
        if (typeof document === 'undefined') {
            this.skip('No DOM');
        }
        var dfd = this.async();
        var watchHandle = parser.watch();

        var TestCtor = function TestCtor(node: HTMLElement) {
            assert(node);
        };
        TestCtor.prototype = <ParserTestInterface> {
            'foo': 'bar'
        };

        var registerHandle = parser.register('test-div', {
            Ctor: TestCtor
        });

        document.body.innerHTML = '<div is="test-div" id="test1"></div><test-div id="test2"></test-div>';

        var test1 = document.getElementById('test1');
        var test2 = document.getElementById('test2');
        setTimeout(function () {
            assert.equal((<ParserTestInterface> parser.byId('test1')).foo, 'bar');
            assert.strictEqual(parser.byId('test1').node, test1);
            assert.strictEqual(parser.byNode(test1).id, 'test1');

            assert.equal((<ParserTestInterface> parser.byId('test2')).foo, 'bar');
            assert.strictEqual(parser.byId('test2').node, test2);
            assert.strictEqual(parser.byNode(test2).id, 'test2');

            watchHandle.remove();
            registerHandle.remove();
            dfd.resolve();
        }, 1);
    }
});
