import core = require('./interfaces');
import has, { add as hasAdd } from 'dojo-core/has';
import Registry = require('./Registry');
import Promise from 'dojo-core/Promise';
import watcher = require('./watcher');
import WeakMap from 'dojo-core/WeakMap';

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

hasAdd('dom3-mutation-observer', typeof MutationObserver !== 'undefined');

var slice = Array.prototype.slice;

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

function watcherCallback(changes: watcher.WatcherRecord[]): void {
    changes.forEach((change: watcher.WatcherRecord) => {
        if (change.type === watcher.WatchType.Added) {
            instantiateParserObject(change.node);
        }
        if (change.type === watcher.WatchType.Removed) {
            // todo
        }
    });
}

class Parser implements parser.IParser<any> {
    private _observer: MutationObserver;
    private _watcherHandle: core.IHandle;
    watch(doc: Document = document): core.IHandle {
        if (has('dom3-mutation-observer') && typeof this._observer === 'undefined') {
            this._observer = new MutationObserver(observervationCallback);
            this._observer.observe(doc.body, {
                childList: true,
                subtree: true
            });
        }
        else if (!has('dom3-mutation-observer') && typeof this._watcherHandle === 'undefined') {
            this._watcherHandle = watcher.watch(doc.body, watcherCallback);
        }
        return {
            remove(): void {
                if (this._observer) {
                    this._observer.disconnect();
                    this._observer = undefined;
                }
                if (this._watcherHandle) {
                    this._watcherHandle.remove();
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
