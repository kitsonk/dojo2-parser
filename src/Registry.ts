import { Handle } from 'dojo-core/interfaces';

function pullFromArray<T>(haystack: T[], needle: T): T[] {
	var removed: T[] = [];
	var i: number = 0;

	while ((i = haystack.indexOf(needle, i)) > -1) {
		removed.push(haystack.splice(i, 1)[0]);
	}

	return removed;
}

module Registry {
	export interface ITest {
		(...args: any[]): boolean;
	}
}

interface IEntry<ValueT> {
	test: Registry.ITest;
	value: ValueT;
}

class Registry<ValueT> {
	private _entries: IEntry<ValueT>[] = [];
	private _defaultValue: ValueT;

	constructor(defaultValue?: ValueT) {
		this._defaultValue = defaultValue;
	}

	match(...args: any[]): ValueT {
		var entries: IEntry<ValueT>[] = this._entries.slice(0);
		var entry: IEntry<ValueT>;

		for (var i = 0; (entry = entries[i]); ++i) {
			if (entry.test.apply(null, args)) {
				return entry.value;
			}
		}

		if (this._defaultValue !== undefined) {
			return this._defaultValue;
		}

		throw new Error('No match found');
	}

	register(test: Registry.ITest, value: ValueT, first?: boolean): Handle {
		var entries = this._entries;
		var entry: IEntry<ValueT> = {
			test: test,
			value: value
		};

		(<any> entries)[first ? 'unshift' : 'push'](entry);

		return {
			destroy: function (): void {
				this.remove = function (): void {};
				pullFromArray(entries, entry);
				test = value = entries = entry = null;
			}
		};
	}
}

export default Registry;
