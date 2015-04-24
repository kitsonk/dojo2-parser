import assert = require('intern/chai!assert');
import registerSuite = require('intern!object');
import parser = require('src/parser');

registerSuite({
    name: 'parser',
    'basic': function () {
        var dfd = this.async();
        var handle = parser.watch();
        document.body.innerHTML = '<div as="test-div"></div>';
        setTimeout(function () {
            handle.remove();
            dfd.resolve();
        }, 1);
    }
});
