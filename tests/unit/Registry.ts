import assert = require('intern/chai!assert');
import registerSuite = require('intern!object');
import Registry = require('src/Registry');

registerSuite({
    name: 'Registry',
    'basic': function () {
        assert(Registry);
    }
});
