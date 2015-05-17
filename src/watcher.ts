import core = require('./interfaces');
import nextTick from 'dojo-core/nextTick';
import WeakMap from 'dojo-core/WeakMap';

'use strict';

interface ElementStructure {
    node: HTMLElement,
    kids?: ElementStructure[]
}

interface IteratorCallback {
    (value: HTMLElement, index?: number, array?: HTMLElement[]|NodeList): ElementStructure;
}

export let checkInterval: number = 30;

export enum WatchType { Added, Removed }
export interface WatcherRecord {
    node: HTMLElement,
    type: WatchType
}

export interface WatcherCallback {
    (changes: WatcherRecord[]): void;
}

function clone(target: HTMLElement): ElementStructure {
    function map(list: HTMLElement[]|NodeList, iterator: IteratorCallback): ElementStructure[] {
        var results: ElementStructure[] = [];
        for (var i = 0; i < list.length; i++) {
            results[i] = iterator(<HTMLElement> list[i], i, list);
        }
        return results;
    }

    function copy(target: HTMLElement): ElementStructure {
        var elementStructure: ElementStructure = {
            node: target
        };
        if (target.nodeType === 1) {
            elementStructure.kids = map(target.childNodes, copy);
        }
        return elementStructure;
    }
    return copy(target);
}

let nodeIDCounter: number = 0;
let nodeIDWeakMap: WeakMap<any, any> = new WeakMap();

function getNodeID(node: HTMLElement): string {
    let id: string = node.id || nodeIDWeakMap.get(node);
    if (!id) {
        nodeIDWeakMap.set(node, id = ('__node_id' + ++nodeIDCounter));
    }
    return id;
}

function indexOf(collection: any[]|NodeList, searchFor: any, fromIndex: number, property?: string): number {
    for (; fromIndex < collection.length; fromIndex++) {
        if ((property ? collection[fromIndex][property] : collection[fromIndex]) === searchFor) {
            return fromIndex;
        }
    }
    return -1;
}

interface Conflict {
    i: number,
    j: number
}

function searchSubTree(changes: WatcherRecord[], target: HTMLElement, oldState: ElementStructure): boolean {
    let dirty: boolean = false;

    function resolveConflicts(conflicts: Conflict[], kids: NodeList, oldKids: ElementStructure[]): void {
        let currentNode: HTMLElement;
        let oldStructure: ElementStructure;
        let conflict: Conflict;
        while ((conflict = conflicts.pop())) {
            currentNode = <HTMLElement> kids[conflict.i];
            oldStructure = oldKids[conflict.j];
            findMutations(currentNode, oldStructure);
        }
    }

    function findMutations (node: HTMLElement, state: ElementStructure): void {
        let kids: NodeList = node.childNodes;
        let klen: number = kids.length;
        let oldKids: ElementStructure[] = state.kids;
        let olen: number = oldKids ? oldKids.length : 0;
        let map: { [id: string] : boolean };
        let conflicts: Conflict[];
        let id: string;
        let idx: number;
        let oldStructure: ElementStructure;
        let currentNode: HTMLElement;
        let oldNode: HTMLElement;
        let numberNodesAdded: number = 0;
        let i: number = 0;
        let j: number = 0;
        while (i < klen || j < olen) {
            currentNode = <HTMLElement> kids[i];
            oldStructure = oldKids[j];
            oldNode = oldStructure && oldStructure.node;
            if (currentNode === oldNode) {
                if (conflicts) {
                    // resolveConflicts
                }
                if (currentNode.childNodes.length || oldStructure.kids && oldStructure.kids.length) {
                    findMutations(currentNode, oldStructure);
                }
                i++;
                j++;
            }
            else {
                dirty = true;
                if (typeof map === 'undefined') {
                    map = {};
                    conflicts = [];
                }
                if (currentNode) {
                    if (!(map[id = getNodeID(currentNode)])) {
                        map[id] = true;
                        if ((idx = indexOf(oldKids, currentNode, j, 'node')) === -1) {
                            changes.push({
                                node: currentNode,
                                type: WatchType.Added
                            });
                            numberNodesAdded++;
                        }
                        else {
                            conflicts.push({
                                i: i,
                                j: idx
                            });
                        }
                    }
                    i++;
                }

                if (oldNode && oldNode !== kids[i]) {
                    if (!(map[id = getNodeID(oldNode)])) {
                        map[id] = true;
                        if ((idx = indexOf(kids, oldNode, i, 'node')) === -1) {
                            changes.push({
                                node: oldNode,
                                type: WatchType.Removed
                            });
                            numberNodesAdded--;
                        }
                        else {
                            conflicts.push({
                                i: idx,
                                j: j
                            });
                        }
                    }
                    j++;
                }
            }
            if (conflicts) {
                resolveConflicts(conflicts, kids, oldKids);
            }
        }
    }
    findMutations(target, oldState);
    return dirty;
}

interface ChangeDetector {
    (changes: WatcherRecord[]): void;
}

interface NodeMapElement {
    target: HTMLElement,
    detector: ChangeDetector,
    callback: WatcherCallback
}

let nodeMap: NodeMapElement[] = [];

function getChangeDetector(target: HTMLElement): ChangeDetector {
    let oldState: ElementStructure = clone(target);

    return function detectChanges(changes: WatcherRecord[]) {
        let olen: number = changes.length;
        let dirty: boolean = searchSubTree(changes, target, oldState);
        if (dirty || changes.length !== olen) {
            oldState = clone(target);
        }
    };
}

var timer: number|NodeJS.Timer;

function checkChanges(): void {
    timer = undefined;
    nodeMap.forEach((item: NodeMapElement) => {
        let changes: WatcherRecord[] = [];
        item.detector(changes);
        if (changes.length) {
            nextTick(() => {
                item.callback(changes);
            });
        }
    });
    if (nodeMap.length) {
        startTimer();
    }
}

function startTimer(): void {
    timer = setTimeout(checkChanges, checkInterval);
}

export function watch(node: HTMLElement, callback: WatcherCallback): core.IHandle {
    let item: NodeMapElement = {
        target: node,
        detector: getChangeDetector(node),
        callback: callback
    };
    nodeMap.push(item);
    if (!timer) {
        startTimer();
    }
    return {
        remove(): void {
            var idx = nodeMap.indexOf(item);
            if (~idx) {
                nodeMap.splice(idx, 1);
            }
        }
    };
}
