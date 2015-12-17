# Async Functions for  ECMAScript

The introduction of Promises and Generators in ECMAScript presents an opportunity to dramatically improve the language-level model for writing asynchronous code in ECMAScript. The spec text can be found [here](https://tc39.github.io/ecmascript-asyncawait).


This proposal is implemented in a [regenerator](https://github.com/facebook/regenerator) which can compile ES5 code containing `async` and `await` down to vanilla ES5 to run in existing browsers and runtimes.

This repo contains a complete example using a large number of the features of the proposal.  To run this example:

```Shell
npm install
regenerator -r server.asyncawait.js | node
```

## Debatable Syntax & Semantics

### Awaiting Non-Promise
When the value passed to `await` is a Promise, the completion of the async function is scheduled on completion of the Promise.  For non-promises, behaviour aligns with Promise conversion rules according to the proposed semantic polyfill.

### Surface syntax
Instead of `async function`/`await`, the following are options:
- `function^`/`await`
- `function!`/`yield`
- `function!`/`await`
- `function^`/`yield`
