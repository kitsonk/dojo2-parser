
interface ParserDefinitionOptions {
    object?: Object;
    doc?: Document;
    extensionOf?: string;
}

interface RemovalHandle {
    remove(): void;
}

interface DefinitionHandle {
    remove(): void;
    ctor: Function;
}

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
                if (node.nodeType === 1) {
                    console.log('add', node.tagName.toLowerCase(), node.getAttribute('as'));
                }
            });
            removedNodes = slice.call(observation.removedNodes);
            removedNodes.forEach((node: HTMLElement) => {
                if (node.nodeType === 1) {
                    console.log('remove', node.tagName.toLowerCase(), node.getAttribute('as'));
                }
            });
        }
        /* else discard */
    });
}

export function watch(doc: Document = document): RemovalHandle {
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
            }
        }
    };
}

export function define(tagName: string, options: ParserDefinitionOptions): DefinitionHandle {
    return {
        remove(): void { },
        ctor(): void { }
    };
}

export function scan(doc: Document = document): any[] {
    return [];
}
