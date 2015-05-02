import core = require('dojo/interfaces');
import Registry = require('dojo/Registry');
import WeakMap = require('./WeakMap');

'use strict';

export interface ParserObject {
    node: HTMLElement;
    id: string;
}
export interface ParserObjectConstructor {
    new (node?: HTMLElement): ParserObject;
    prototype: ParserObject;
}
declare var ParserObject: ParserObjectConstructor;

interface IParserDefinitionOptions {
    proto?: {};
    Ctor?: Function;
    doc?: Document;
    extensionOf?: string;
}

interface IRegistrationHandle extends core.IHandle {
    Ctor: ParserObjectConstructor;
}

var parserRegistry = new Registry(null);
var parserIDMap: { [id: string]: ParserObject } = {};
var parserNodeMap: WeakMap<any, any> = new WeakMap();

var _hasMutationObservers: boolean;

function hasMutationObservers(): boolean {
    if (typeof _hasMutationObservers === 'undefined') {
        _hasMutationObservers = typeof MutationObserver !== 'undefined';
    }
    return _hasMutationObservers;
}

var slice = Array.prototype.slice;
var observer: MutationObserver;

function observervationCallback(observations: MutationRecord[]): void {
    var addedNodes: HTMLElement[];
    var removedNodes: HTMLElement[];
    observations.forEach((observation: MutationRecord) => {
        if (observation.type === 'childList') {
            addedNodes = slice.call(observation.addedNodes);
            addedNodes.forEach((node: HTMLElement) => {
                var Ctor: ParserObjectConstructor = parserRegistry.match(node);
                var obj: ParserObject = new Ctor(node);
                obj.node = node;
                if (node.id) {
                    obj.id = node.id;
                    parserIDMap[obj.id] = obj;
                }
                parserNodeMap.set(node, obj);
            });
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

export function watch(doc: Document = document): core.IHandle {
    if (hasMutationObservers() && typeof observer === 'undefined') {
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

export function register(tagName: string, options: IParserDefinitionOptions): IRegistrationHandle {
    tagName = tagName && tagName.toLowerCase();
    var Ctor: Function;
    if (!options.Ctor && options.proto) {
        Ctor = function ParserObject() { };
        Ctor.prototype = <ParserObject> options.proto;
    }
    else if (options.Ctor) {
        Ctor = options.Ctor;
    }
    else {
        throw new SyntaxError('Missing either "Ctor" or "proto" in options.');
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
        Ctor: <ParserObjectConstructor> Ctor
    };
}

export function scan(doc: Document = document): any[] {
    return [];
}

export function byId(id: string) {
    return parserIDMap[id];
}

export function byNode(node: HTMLElement) {
    return parserNodeMap.get(node);
}
