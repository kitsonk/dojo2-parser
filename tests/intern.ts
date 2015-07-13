export var proxyPort = 9000;

// A fully qualified URL to the Intern proxy
export var proxyUrl = 'http://localhost:9000/';

// Default desired capabilities for all environments. Individual capabilities can be overridden by any of the
// specified browser environments in the `environments` array below as well. See
// https://code.google.com/p/selenium/wiki/DesiredCapabilities for standard Selenium capabilities and
// https://saucelabs.com/docs/additional-config#desired-capabilities for Sauce Labs capabilities.
// Note that the `build` capability will be filled in with the current commit ID from the Travis CI environment
// automatically
export let capabilities = {
	'selenium-version': '2.43.0',
	'idle-timeout': 30
};

// Browsers to run integration testing against. Note that version numbers must be strings if used with Sauce
// OnDemand. Options that will be permutated are browserName, version, platform, and platformVersion; any other
// capabilities options specified for an environment will be copied as-is
export let environments = [
	{ browserName: 'internet explorer', version: '11', platform: 'WIN8', fixSessionCapabilities: false },
	{ browserName: 'internet explorer', version: '10', platform: 'WIN8', fixSessionCapabilities: false },
	{ browserName: 'internet explorer', version: '9', platform: 'WINDOWS', fixSessionCapabilities: false },
	{ browserName: 'firefox', version: '33', platform: [ 'WINDOWS', 'MAC' ], fixSessionCapabilities: false },
	{ browserName: 'chrome', version: '38', platform: [ 'WINDOWS', 'MAC' ], fixSessionCapabilities: false }
];

// Maximum number of simultaneous integration tests that should be executed on the remote WebDriver service
export let maxConcurrency = 1;

// Name of the tunnel class to use for WebDriver tests
export var tunnel = 'BrowserStackTunnel';

// Configuration options for the module loader; any AMD configuration options supported by the specified AMD loader
// can be used here
export var loaderOptions = {
	// Packages that should be registered with the loader in each testing environment
	packages: [
		{ name: 'dojo-core', location: '_modules/dojo-core' },
		{ name: 'src', location: '_build/src'},
		{ name: 'tests', location: '_build/tests' }
	]
};

// Non-functional test suite(s) to run in each browser
export var suites = [ 'tests/unit/all' ];

// Functional test suite(s) to run in each browser once non-functional tests are completed
export var functionalSuites = [ 'tests/functional/all' ];

// A regular expression matching URLs to files that should not be included in code coverage analysis
export var excludeInstrumentation = /^(?:node_modules|bower_components|_modules|_build[\/\\]tests)[\/\\]/;
