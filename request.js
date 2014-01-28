module.exports = function request(opts) {
    var def = require('q').defer();
    require('request')(opts, function(err, resp, body) {
        if(err) {
            def.reject(err);
        } else {
            def.resolve([resp, body]);
        }
    })
    return def.promise;
}