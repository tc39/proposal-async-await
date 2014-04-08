var Q = require('q');

function Promise(f) {
    var def = Q.defer();
    f(def.resolve.bind(def), def.reject.bind(def));
    return def.promise;
}
Promise.resolve = function(v) {
    var def = Q.defer();
    def.resolve(v);
    return def.promise;
}
Promise.delay = Q.delay;
Promise.all = Q.all;

module.exports = Promise;