/// <reference path="../jsdom/jsdom.d.ts" />

declare module 'src/has!host-node?../jsdom' {
	import jsdom = require('jsdom');
	var jd: {
		jsdom(markup: string, config?: jsdom.Config): Document;
	};
	export = jd;
}

declare module 'src/node!../../node_modules/jsdom/lib/jsdom' {
	import jsdom = require('jsdom');
	var jd: {
		jsdom(markup: string, config?: jsdom.Config): Document;
	};
	export = jd;
}
