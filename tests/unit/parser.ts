import assert = require('intern/chai!assert');
import registerSuite = require('intern!object');
import parse, { ParserObject, ParserResults, register, removeObject } from 'src/parser';
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

registerSuite({
    name: 'parser',
    setup: function () {
        doc = typeof document === 'undefined' ? jsdom('<html><body></body></html>') : document;
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
        let obj = new handle.Ctor();
        assert.equal((<any> obj).foo, 'bar');

        doc.body.innerHTML = '<div is="test-class"></div>';
        return parse({ root: doc }).then(function (results: ParserResults) {
            assert.equal((<any> results[0]).foo, 'bar');
            assert.equal(Object.getPrototypeOf(results[0]), proto);
            handle.destroy();
            removeObject(results[0]);
        });
    }
});
