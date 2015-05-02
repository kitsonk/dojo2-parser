import has = require('dojo/has');

interface WeakMap<K, V> {
    delete(key: K): void;
    get(key: K): V;
    has(key: K): boolean;
    set(key: K, value?: V): WeakMap<K, V>;
}

interface WeakMapConstructor {
    new <K, V>(iterable?: Array<any>): WeakMap<K, V>;
    prototype: WeakMap<any, any>;
}
declare var WeakMap: WeakMapConstructor;

function getUID(): number {
	return Math.floor(Math.random() * 100000000);
}

var Ctor: typeof WeakMap;
interface Ctor<K, V> extends WeakMap<K, V> { }

has.add('es6-weak-map', typeof WeakMap !== 'undefined');

var oid = 0;

class WeakMapShim<K, V> implements WeakMap<K, V> {
    private _name: string;
    constructor(iterable?: Array<any>) {
        this._name = '__wms' + getUID() + (oid++ + '__');
        if (iterable && 'forEach' in iterable) {
            iterable.forEach((item: any, i: number) => {
                if (Array.isArray(item) && item.length === 2) {
                    this.set((<any> iterable)[i][0], (<any> iterable)[i][1]);
                }
                else {
                    this.set((<any> iterable)[i], i);
                }
            });
        }
    }
    delete(key: any): void {
        this.set(key, undefined);
    }
    get(key: any): any {
        var entry = key[this._name];
        return entry && entry[0] === key ? entry[1] : undefined;
    }
    has(key: any): boolean {
        var entry = key[this._name];
        return Boolean(entry && entry[0] === key && entry[1]);
    }
    set(key: any, value: any): WeakMapShim<any, any> {
        var entry = key[this._name];
        if (entry && entry[0] === key) {
            entry[1] = value;
        }
        else {
            Object.defineProperty(key, this._name, {
                value: [key, value],
                enumerable: false,
                writable: true,
                configurable: false
            });
        }
        return this;
    }
    static length: number = 1;
}

if (has('es6-weak-map')) {
	Ctor = WeakMap;
}
else {
	Ctor = WeakMapShim;
}

export = Ctor;
