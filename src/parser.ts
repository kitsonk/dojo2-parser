import { Handle } from 'dojo-core/interfaces';
import has, { add as hasAdd } from 'dojo-core/has';
import Registry from './Registry';
import Promise from 'dojo-core/Promise';
import domWatch, { WatcherRecord, WatchType } from './watcher';
import WeakMap from 'dojo-core/WeakMap';

/* move to dojo-parser/has */
hasAdd('dom3-mutation-observer', typeof MutationObserver !== 'undefined');

export interface ParserObject {
    node: HTMLElement;
    id: string;
}
export interface ParserObjectConstructor {
    new (node?: HTMLElement, options?: any): ParserObject;
    prototype: ParserObject;
}

export interface ParserDefinitionOptions {
    proto?: {};
    Ctor?: ParserObjectConstructor;
    doc?: Document;
}

export interface RegistrationHandle extends Handle {
    Ctor: ParserObjectConstructor;
}

export type ParserResults = ParserObject[];

const slice = Array.prototype.slice;

const parserRegistryMap: WeakMap<any, any> = new WeakMap();
const parserNodeMap: WeakMap<any, any> = new WeakMap();
const parserIDMap: { [id: string]: ParserObject } = {};

/**
 * Take a HTMLElement and instantiate an Object if there is a match in the
 * registry and the Object doesn't appear to be instantiated yet.
 */
function instantiateParserObject(node: HTMLElement): ParserObject {
    const parserRegistry = parserRegistryMap.get(node.ownerDocument);
    let Ctor: ParserObjectConstructor;
    let obj: ParserObject = parserNodeMap.get(node);
    let options: {};

    if (parserRegistry && !obj) {
        Ctor = parserRegistry.match(node);
        if (Ctor) {
            let optionsString = node.getAttribute('data-options');
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
        return obj;
    }
}

/**
 * Determine if a parser object is in either of the maps and remove it, allowing
 * Garbage Collection to potentially occur for the object and the associated DOM
 * node.
 */
function dereferenceParserObject(obj: ParserObject): void {
    if (obj && obj.id && obj.id in parserIDMap) {
        delete parserIDMap[obj.id];
    }
    if (obj && obj.node) {
        parserNodeMap.delete(obj.node);
        obj.node = undefined;
    }
}

function observationCallback(observations: MutationRecord[]): void {
    let addedNodes: HTMLElement[];
    let removedNodes: HTMLElement[];
    observations.forEach((observation: MutationRecord) => {
        if (observation.type === 'childList') {
            addedNodes = slice.call(observation.addedNodes);
            addedNodes.forEach(instantiateParserObject);
            removedNodes = slice.call(observation.removedNodes);
            removedNodes.forEach((node: HTMLElement) => {
                if (node.nodeType === 1) {
                    dereferenceParserObject(byNode(node));
                }
            });
        }
        /* else discard */
    });
}

let watcherCallback = function watcherCallback(changes: WatcherRecord[]): void {
    changes.forEach(function (change: WatcherRecord) {
        if (change.type === WatchType.Added) {
            instantiateParserObject(change.node);
        }
        if (change.type === WatchType.Removed) {
            dereferenceParserObject(byNode(change.node));
        }
    });
};

let observer: MutationObserver;
let watcherHandle: Handle;

export function watch(root: HTMLElement|Document = document): Handle {
    if ('body' in root) {
        root = (<Document> root).body;
    }
    if (has('dom3-mutation-observer') && typeof observer === 'undefined') {
        observer = new MutationObserver(observationCallback);
        observer.observe(root, {
            childList: true,
            subtree: true
        });
    }
    else if (!has('dom3-mutation-observer') && typeof watcherHandle === 'undefined') {
        watcherHandle = domWatch(<HTMLElement> root, watcherCallback);
    }
    return {
        destroy(): void {
            if (observer) {
                observer.disconnect();
                observer = undefined;
            }
            if (watcherHandle) {
                watcherHandle.destroy();
            }
        }
    };
}

export function register(tagName: string, options: ParserDefinitionOptions): RegistrationHandle {
    tagName = tagName && tagName.toLowerCase();
    let Ctor: Function;
    if (!options.Ctor && options.proto) {
        Ctor = function (node?: HTMLElement, opts?: any): void {
            for (let key in opts) {
                this[key] = opts[key];
            }
            if (!node && !this.node) {
                this.node = (options.doc || document).createElement(tagName);
            }
        };
        Ctor.prototype = <ParserObject> options.proto;
    }
    else if (options.Ctor) {
        Ctor = options.Ctor;
    }
    else {
        throw new SyntaxError('Missing either "Ctor" or "proto" in options.');
    }
    let parserRegistry = parserRegistryMap.get(options.doc || document);
    if (!parserRegistry) {
        parserRegistry = new Registry(null);
        parserRegistryMap.set(options.doc || document, parserRegistry);
    }
    let handle = parserRegistry.register(function (node: HTMLElement) {
        if (node.tagName.toLowerCase() === tagName) {
            return true;
        }
        let attrIs: string = node.getAttribute('is');
        if (attrIs && attrIs.toLowerCase() === tagName) {
            return true;
        }
    }, Ctor);

    return {
        destroy(): void {
            handle.destroy();
        },
        Ctor: <ParserObjectConstructor> Ctor
    };
}

export function byId(id: string): ParserObject {
    return parserIDMap[id];
}

export function byNode(node: HTMLElement): ParserObject {
    return parserNodeMap.get(node);
}

export function removeObject(obj: ParserObject): void {
    dereferenceParserObject(obj);
}

interface ParseConfig {
    [tagName: string]: string|Function;
}

export interface ParseOptions {
    root?: HTMLElement|Document;
    config?: ParseConfig;
}

export default function parse(options?: ParseOptions): Promise<ParserObject[]> {
    let root = options && options.root || document;
    if ('body' in root) {
        root = (<Document> root).body;
    }
    const results: ParserObject[] = [];
    const promise: Promise<ParserObject[]> = new Promise<ParserObject[]>(function (resolve: (value?: ParserObject[]) => void) {
        const elements: HTMLElement[] = Array.prototype.slice.call(root.getElementsByTagName('*'));
        elements.filter((node: HTMLElement) => node.nodeType === 1).forEach(function (node: HTMLElement) {
            let parserObject = instantiateParserObject(node);
            if (parserObject) {
                results.push(parserObject);
            }
        });
        resolve(results);
    });
    return promise;
}
