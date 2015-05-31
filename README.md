# dojo-parser [![Build Status](https://travis-ci.org/kitsonk/parser.png)](https://travis-ci.org/kitsonk/parser) [![Coverage Status](https://coveralls.io/repos/kitsonk/parser/badge.svg)](https://coveralls.io/r/kitsonk/parser)

## parser

### parser.register(tagName, options)

Register a tag name

#### Registering an Custom Tag

```js
require('parser', function (parser) {
    parser.register('test-tag', {
        proto: {
            foo: 'bar'
        }
    });
});
```

### Registering a constructor

```js
require('parser', function (parser) {
    var MyObject = function (node, options) {
        // node: HTMLElement
        // options: Any parsed JSON data put into data-options
    };
    MyObject.prototype = {
        foo: 'bar'
    };

    parser.register('test-tag', { Ctor: MyObject });
});
```

### De-registeration

```js
require('parser', function (parser) {
    var handle = parser.register('test-tag', {
        proto: {
            foo: 'bar'
        }
    });

    handle.destroy(); // Will no longer parse tags of "test-tag"
});
```

### watch(options?)

Starts watching a document for any nodes being inserted or removed.  If some of
the nodes being inserted match a registered tag name, or contain the attribute
of `is` with a value of a registered tag name, the corresponding object will be
created and registered with the parser.

If a node is being removed and there was an object created by the parser, it
will be dereferenced in the parser's registry.

### parse(options?)

### byId(id)

### byNode(node)

### removeObject(obj)

© 2004–2015 Dojo Foundation & contributors. [New BSD](http://opensource.org/licenses/BSD-3-Clause) license.
