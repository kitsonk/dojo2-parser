import assert = require('intern/chai!assert');
import registerSuite = require('intern!object');
import parse, { ParserObject, ParserResults, RegistrationHandle, register, removeObject, watch, byId, byNode } from 'src/parser';
import { jsdom } from 'src/has!host-node?../jsdom';

interface ParserTestInterface extends ParserObject {
    foo: any;
}

let doc: Document;

class TestClass implements ParserObject {
    constructor () {
        this.callCount++;
    };
    callCount: number = 0;
    node: HTMLElement;
    id: string;
}

class MyClass implements ParserObject {
    node: HTMLElement;
    id: string;
}

class OptionsClass implements ParserObject {
    constructor (node?: HTMLElement, options?: any) {
        if (options) {
            this.options = options;
        }
    };
    options: any;
    node: HTMLElement;
    id: string;
}

registerSuite({
    name: 'parser',
    setup: function () {
        doc = typeof document === 'undefined' ? jsdom('<html><body></body></html>') : document;
    },

    beforeEach: function () {
        doc.body.innerHTML = '';
    },

    /* This test tests the basic parser functionality with an implied current
     * document
     */
    'Native DOM Testing': function () {
        if (typeof document === 'undefined') {
            this.skip('No native DOM');
        }
        let handle = register('test-class', {
            Ctor: TestClass
        });
        document.body.innerHTML = '<test-class id="test1"></test-class>' +
            '<div is="test-class" id="test2"></div>';
        return parse().then(function (results: ParserResults) {
            assert.equal(results.length, 2);
            assert.equal(results[0].id, 'test1');
            assert.equal(results[1].id, 'test2');
            assert.equal((<TestClass> results[0]).callCount, 1);
            assert.equal((<TestClass> results[1]).callCount, 1);
            handle.destroy();
            removeObject(results[0]);
            removeObject(results[1]);
        });
    },

    /* For those runtimes that don't have a native DOM, we perform a similiar
     * function but we have to be explicit about which psuedo-DOM we are using
     */
    'Non-Native DOM Test': function () {
        if (typeof document === 'object') {
            this.skip('Native DOM');
        }
        let handle = register('test-class', {
            Ctor: TestClass,
            doc: doc
        });
        doc.body.innerHTML = '<test-class id="test1"></test-class>' +
            '<div is="test-class" id="test2"></div>';
        return parse({ root: doc }).then(function (results: ParserResults) {
            assert.equal(results.length, 2);
            assert.equal(results[0].id, 'test1');
            assert.equal(results[1].id, 'test2');
            assert.equal((<TestClass> results[0]).callCount, 1);
            assert.equal((<TestClass> results[1]).callCount, 1);
            handle.destroy();
            removeObject(results[0]);
            removeObject(results[1]);
        });
    },

    '.register()': function () {
        let handle1 = register('test1-class', {
            Ctor: TestClass,
            doc: doc
        });
        let handle2 = register('test2-class', {
            Ctor: MyClass,
            doc: doc
        });
        assert.isFunction(handle1.destroy);
        assert.isFunction(handle2.destroy);
        doc.body.innerHTML = '<test1-class id="test1"></test1-class>' +
            '<test2-class id="test2"></test2-class>';
        handle1.destroy();
        return parse({ root: doc }).then(function (results: ParserResults) {
            assert.equal(results.length, 1);
            assert.equal((<MyClass> results[0]).id, 'test2');
            assert.instanceOf(results[0], MyClass);
            handle2.destroy();
            removeObject(results[0]);
        });
    },

    '.register() - prototype': function () {
        let proto = {
            node: <HTMLElement> undefined,
            id: '',
            foo: 'bar'
        };
        let handle = register('test-class', {
            proto: proto,
            doc: doc
        });

        /* Ensure a valid constructor is in the handle */
        let obj = new (<RegistrationHandle> handle).Ctor();
        assert.equal((<any> obj).foo, 'bar');
        assert.equal(obj.node.tagName.toLowerCase(), 'test-class');
        assert.isNull(obj.node.parentNode);

        doc.body.innerHTML = '<div is="test-class"></div>';
        return parse({ root: doc }).then(function (results: ParserResults) {
            assert.equal((<any> results[0]).foo, 'bar');
            assert.equal(Object.getPrototypeOf(results[0]), proto);
            handle.destroy();
            removeObject(results[0]);
        });
    },

    '.watch()': function () {
        const dfd = this.async(250);
        const handle = register('test3-class', {
            Ctor: TestClass,
            doc: doc
        });

        const watchHandle = watch(doc);
        doc.body.innerHTML = '<test3-class id="test"></test3-class>';
        const test3Class = doc.createElement('test3-class');
        doc.body.appendChild(test3Class);
        const div = doc.createElement('div');
        div.setAttribute('is', 'test3-class');
        doc.body.appendChild(div);

        setTimeout(function () {
            let obj = byId('test');
            assert(obj);
            assert(obj.node);
            assert.equal(obj.node.tagName.toLowerCase(), 'test3-class');
            assert.instanceOf(obj, TestClass);
            let objTest3Class = byNode(test3Class);
            assert(objTest3Class);
            assert.strictEqual(objTest3Class.node, test3Class);
            assert.instanceOf(objTest3Class, TestClass);
            let objDiv = byNode(div);
            assert(objDiv);
            assert.strictEqual(objDiv.node, div);
            assert.instanceOf(objDiv, TestClass);

            watchHandle.destroy();
            handle.destroy();
            removeObject(obj);
            removeObject(objTest3Class);
            removeObject(objDiv);
            dfd.resolve();
        }, 100);
    },

    'attribute options': function () {
        const handle = register('test-options', {
            Ctor: OptionsClass,
            doc: doc
        });

        doc.body.innerHTML = "<test-options data-options='{ \"foo\": true }'></test-options>" +
            "<test-options data-options='{ \"foo\": \"bar\", \"baz\": 1, \"qat\": false }'></test-options>";

        var div = doc.createElement('div');
        div.setAttribute('data-options', '[ 0, 1, 2, 3 ]');
        div.setAttribute('is', 'test-options');
        doc.body.appendChild(div);

        return parse({ root: doc }).then(function (results: OptionsClass[]) {
            assert.equal(results.length, 3);
            assert.deepEqual(results[0].options, { foo: true });
            assert.deepEqual(results[1].options, { foo: 'bar', baz: 1, qat: false });
            assert.deepEqual(results[2].options, [ 0, 1, 2, 3 ]);
            handle.destroy();
            results.forEach(removeObject);
        });
    },

    'bad options throws': function () {
        const dfd = this.async();
        const handle = register('test-bad-opts', {
            Ctor: OptionsClass,
            doc: doc
        });

        var div = doc.createElement('test-bad-opts');
        div.setAttribute('data-options', '{ foo: bar }');
        doc.body.appendChild(div);

        parse({ root: doc }).then(function () { throw new Error('Resolved, not rejected') }, function (reason: any) {
            assert.instanceOf(reason, SyntaxError);
            handle.destroy();
            dfd.resolve();
        });
    },

    'bad registration throws': function () {
        assert.throws(function () {
            register('test-bad-opts', {
                doc: doc
            });
        }, 'Missing either "Ctor" or "proto" in options.');
    }
});
