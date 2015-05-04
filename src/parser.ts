import core = require('dojo/interfaces');
import has = require('dojo/has');
import Registry = require('dojo/Registry');
import Promise = require('dojo/Promise');
import WeakMap = require('./WeakMap');

'use strict';

declare module parser {
    export interface ParserObject {
        node: HTMLElement;
        id: string;
    }
    export interface ParserObjectConstructor {
        new (node?: HTMLElement, options?: any): ParserObject;
        prototype: ParserObject;
    }

    export interface IParserDefinitionOptions {
        proto?: {};
        Ctor?: Function;
        doc?: Document;
    }

    export interface IRegistrationHandle extends core.IHandle {
        Ctor: parser.ParserObjectConstructor;
    }

    export interface IParser<T> {
        watch(doc?: Document): core.IHandle;
        register(tagName: string, options: parser.IParserDefinitionOptions): parser.IRegistrationHandle;
        parse(doc?: Document): Promise<any>;
        byId(id: string): T;
        byNode(node: HTMLElement): T;
    }
}

var parserRegistryMap: WeakMap<any, any> = new WeakMap();
var parserIDMap: { [id: string]: parser.ParserObject } = {};
var parserNodeMap: WeakMap<any, any> = new WeakMap();

has.add('dom3-mutation-observer', typeof MutationObserver !== 'undefined');

var slice = Array.prototype.slice;
var observer: MutationObserver;

/**
 * Take a HTMLElement and instantiate an Object if registered
 */
function instantiateParserObject(node: HTMLElement): void {
    var Ctor: parser.ParserObjectConstructor;
    var obj: parser.ParserObject;
    var optionsString: string;
    var options: {};
    var parserRegistry = parserRegistryMap.get(node.ownerDocument);
    if (parserRegistry) {
        Ctor = parserRegistry.match(node);
        if (Ctor) {
            optionsString = node.getAttribute('data-options');
            if (optionsString) {
                try {
                    options = JSON.parse(optionsString);
                }
                catch (e) {
                    console.log('optionsString', optionsString);
                    console.error('Invalid data-options', e.message);
                }
            }
            obj = new Ctor(node, options);
            obj.node = node;
            if (node.id) {
                obj.id = node.id;
                if (!(obj.id in parserIDMap)) {
                    parserIDMap[obj.id] = obj;
                } /* What to do if it is already there? Maybe have a map per document? */
            }
            parserNodeMap.set(node, obj);
        }
    }
}

function observervationCallback(observations: MutationRecord[]): void {
    var addedNodes: HTMLElement[];
    var removedNodes: HTMLElement[];
    observations.forEach((observation: MutationRecord) => {
        if (observation.type === 'childList') {
            addedNodes = slice.call(observation.addedNodes);
            addedNodes.forEach(instantiateParserObject);
            removedNodes = slice.call(observation.removedNodes);
            removedNodes.forEach((node: HTMLElement) => {
                if (node.nodeType === 1) {
                    console.log('remove', node.tagName.toLowerCase(), node.getAttribute('is'));
                }
            });
        }
        /* else discard */
    });
}

class Parser implements parser.IParser<any> {
    watch(doc: Document = document): core.IHandle {
        if (has('dom3-mutation-observer') && typeof observer === 'undefined') {
            observer = new MutationObserver(observervationCallback);
            observer.observe(doc.body, {
                childList: true,
                subtree: true
            });
        }
        return {
            remove(): void {
                if (observer) {
                    observer.disconnect();
                    observer = undefined;
                }
            }
        };
    }
    register(tagName: string, options: parser.IParserDefinitionOptions): parser.IRegistrationHandle {
        tagName = tagName && tagName.toLowerCase();
        var Ctor: Function;
        if (!options.Ctor && options.proto) {
            Ctor = function ParserObject() { };
            Ctor.prototype = <parser.ParserObject> options.proto;
        }
        else if (options.Ctor) {
            Ctor = options.Ctor;
        }
        else {
            throw new SyntaxError('Missing either "Ctor" or "proto" in options.');
        }
        var parserRegistry = parserRegistryMap.get(options.doc || document);
        if (!parserRegistry) {
            parserRegistry = new Registry(null);
            parserRegistryMap.set(options.doc || document, parserRegistry);
        }
        var handle = parserRegistry.register((node: HTMLElement) => {
            if (node.tagName.toLowerCase() === tagName) {
                return true;
            }
            var attrIs: string = node.getAttribute('is');
            if (attrIs && attrIs.toLowerCase() === tagName) {
                return true;
            }
        }, Ctor);

        return {
            remove(): void {
                handle.remove();
            },
            Ctor: <parser.ParserObjectConstructor> Ctor
        };
    }
    parse(doc: Document = document): Promise<any> {
        return new Promise(function () { });
    }
    byId(id: string): any {
        return parserIDMap[id];
    }
    byNode(node: HTMLElement): any {
        return parserNodeMap.get(node);
    }
}

var parser = new Parser();

export = parser;
