declare var require: any;

var global: any = (function () {
	return this;
})();

var nodeRequire: Function = global.require && global.require.nodeRequire;

if (!nodeRequire) {
	throw new Error('Cannot find the Node.js require');
}

var module: any = nodeRequire('module');

export function load(id: string, contextRequire: any, load: Function) {
	/*global define:true */

	if (module._findPath && module._nodeModulePaths) {
		var localModulePath = module._findPath(id, module._nodeModulePaths(contextRequire.toUrl('.')));
		if (localModulePath !== false) {
			id = localModulePath;
		}
	}

	var oldDefine: any = global.define;
	var result: any;

	// Some modules attempt to detect an AMD loader by looking for global AMD `define`. This causes issues
	// when other CommonJS modules attempt to load them via the standard Node.js `require`, so hide it
	// during the load
	global.define = undefined;

	try {
		result = nodeRequire(id);
	}
	finally {
		global.define = oldDefine;
	}

	load(result);
}

export function normalize(id: string, normalize: Function): string {
	if (id.charAt(0) === '.') {
		// absolute module IDs need to be generated based on the AMD loader's knowledge of the parent module,
		// since Node.js will try to use the directory containing `dojo.js` as the relative root if a
		// relative module ID is provided
		id = require.toUrl(normalize('./' + id));
	}

	return id;
}
