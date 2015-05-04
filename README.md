# dojo2-parser [![Build Status](https://travis-ci.org/kitsonk/dojo2-parser.png)](https://travis-ci.org/dojo/dojo2-parser)

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

    handle.remove(); // Will no longer parse tags of "test-tag"
});
```

### parser.watch(doc?)

Starts watching a document for any nodes being inserted or removed.  If some of
the nodes being inserted match a registered tag name, or contain the attribute
of `is` with a value of a registered tag name, the corresponding object will be
created and registered with the parser.

If a node is being removed and there was an object created by the parser, it
will be dereferenced in the parser's registery.

### parser.parse(doc?)

### parser.byId(id)

### parser.byNode(node)


© 2004–2015 Dojo Foundation & contributors. [New BSD](http://opensource.org/licenses/BSD-3-Clause) license.
