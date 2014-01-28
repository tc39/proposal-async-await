
```JavaScript
npm install 

sjs server.asyncawait.js -o server.js && node --harmony server.js
```


# Async Functions for  ECMAScript

The introduction of Promises and Generators in ECMAScript presents an opportunity to dramatically improve the language-level model for writing asynchronous code in ECMAScript.  

A similar proposal was made with [Defered Functions](http://wiki.ecmascript.org/doku.php?id=strawman:deferred_functions) during ES6 discussions.  The proposal here supports the same use cases, using similar or the same syntax, but directly building upong generators and promises instead of defining custom mechanisms.

## Example

Take the following example, first written using Promises.  This code chains a set of animations on an element, stopping when there is an exceptionin an animation, and returning the value produced by the final succesfully executed animation.

```JavaScript
function chainAnimationsPromise(elem, animations) {
    var ret = null;
    var p = currentPromise;
    for(var anim in animations) {
        p = p.then(function(val) {
            ret = val;
            return anim(elem);
        })
    }
    return p.catch(function(e) {
        /* ignore and keep going */
    }).then(function() {
        return ret;
    });
}
```

Already with promises, the code is much improved from a straight callback style, where this sort of looping and exception handling is challenging.

[Task.js](http://taskjs.org/) and similar libraries offer a way to use generators to further simplify the code maintaining the same meaning:

```JavaScript
function chainAnimationsGenerator(elem, animations) {
    return spawn(function*() {
        var ret = null;
        try {
            for(var anim in animations) {
                ret = yield anim(elem);
            }
        } catch(e) { /* ignore and keep going */ }
        return ret;
    });
}
```

This is a marked improvement.  All of the promise boilerplate above and beyond the semantic content of the code is removed, and the body of the inner function represents user intent.  However, there is an outer layer of boilerplate to wrap the code in an additional generator function and pass it to a library to convert to a promise.  This layer needs to be repeated in every function that uses this mechanism to produce a promise.  This is so common in typical async Javascript code, that there is value in removing the need for the remaining boilerplate.

With async functions, all the remaining boiler plate is removed, leaving only the semantically meaningfully code in the program text:

```JavaScript
async function chainAnimationsAsync(elem, animations) {
    var ret = null;
    try {
        for(var anim in animations) {
            ret = await anim(elem);
        }
    } catch(e) { /* ignore and keep going */ }
    return ret;
}
```

This is morally similar to generators, which are a function form that produces a Generator object.  This new async function form prduces a Promise object.

## Details

Async functions are a thin sugar over generators and a `spawn` function which converts generators into promise objects.  The internal generator object is never exposed directly to user code, so the rewrite below can be optimized significantly.

### Rewrite

```
async function <name>?<argumentlist><body>

=>

function <name>?<argumentlist>{ return spawn(function*() <body>); }
```

### Spawning

The `spawn` used in the above desugaring is a call to the following algorithm.  This algorithm does not need to be exposed directly as an API to user code, it is part of the semantics of async functions.

```JavaScript
function spawn(genF) {
    return new Promise(function(resovle,reject) {
        var gen = genF();
        function step(nextF) {
            var next;
            try {
                next = nextF();
            } catch(e) {
                // finished with failure, reject the promise
                reject(next); 
                return;
            }
            if(next.done) {
                // finished with success, resolve the promise
                resolve(next.value);
                return;
            } 
            // not finished, chain off the yielded promise and `step` again
            Promise.cast(next.value).then(function(v) {
                step(function() { return gen.next(v); });      
            }, function(e) {
                step(function() { return gen.throw(e); });
            });
        }
        step(function() { return gen.next(undefined) });
    })
}
```

### Syntax

The set of syntax forms are the same as for generators.

```JavaScript
AsyncMethod :
    async PropertyName (StrictFormalParameters)  { FunctionBody } 
AsyncDeclaration :
    function async BindingIdentifier ( FormalParameters ) { FunctionBody }
AsyncExpression :
    function async BindingIdentifier? ( FormalParameters ) { FunctionBody }

// If needed - see syntax options below
AwaitExpression :
    await [Lexical goal InputElementRegExp]   AssignmentExpression 
```

### await*

In generators, both `yield` and `yield*` can be used.  In async functions, only `await` is allowed.  `await*` does not directly have a useful meaning.  It could be considered to treat `await*` as Promise.all.  This would accept an value that is an array or Promises, and would (asynchronously) return an array of values returned by the promises.  This is slightly inconsistent from a typing perspective though. 

### Awaiting Non-Promise

When the value passed to `await` is a Promise, the completion of the async function is scheduled on completion of the Promise.  For non-promises, behaviour aligns with Promise conversation rules according to the proposed semantic polyfill.

### Surface syntax
Instead of `async function`/`await`, the following are options:
- `function^`/`await`
- `function!`/`yield`
- `function!`/`await`
- `function^`/`yield`

### Arrows
The same approach can apply to arrow functions.  For example, assuming the `async function` syntax:   `async () => yield fetch('www.bing.com')` or `async (z) => yield z*z` or `async () => { yield 1; return 1; }`.

### Notes on Types
For generators, an `Iterable<T>` is always returned, and the type of each yield argument must be `T`.  Return should not be passed any argument.

For async functions, a `Promise<T>` is returned, and the type of return expressions must be `T`.  Yield's arguments are `any`.
