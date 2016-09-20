var http = require('http');
var Promise = require('./promise');
var request = require('./request.js');
var headers = { 'User-Agent': 'lukehoban', 'Authorization': 'token 3e9852ce188aa2f097a1e5dd6fbd36f73020a1d5' };

// Promise-returning asynchronous function
async function getCollaboratorImages(full_name) {
    // any exceptions thrown here will propogate into try/catch in callers - same as synchronous
    var url = 'https://api.github.com/repos/' + full_name + '/collaborators';
    // await a promise-returning async HTTP GET - same as synchronous 
    var res = await request({url: url, headers: headers}); 
    return JSON.parse(res.body).map(function(collab) {
        return collab.avatar_url;
    });
}

// can use a `async function` here because createServer doesn't care what this returns
http.createServer(async function (req, res) {
    console.log('starting...')
    var url = 'https://api.github.com/search/repositories?per_page=100&q=' + 'tetris';
    var results = [];
    // write a normal 'synchronous' while loop
    while(true) { 
        console.log('Got ' + results.length + ' items total.  Next: ' + url);
        // use normal exception handling
        try { 
            // promise-returning async HTTP GET
            var resp = await request({url: url, headers: headers});
            var items = JSON.parse(resp.body).items;
            // can do nested parallel work by constructing promises in
            // parallel then awaiting them, e.g. with Promise.all
            var newItems = await Promise.all(items.map(async function (item) {
                return {
                    full_name: item.full_name, 
                    collabs_images: await getCollaboratorImages(item.full_name)
               }
            }));
            results = results.concat(newItems);
            url = (/<(.*)>; rel="next"/.exec(res.headers.link) || [])[1];
            // break once there is no 'next' link
            if(!url) break; 
        } catch(err) {
            console.log('backing off... ' + err);
            // backoff on any error
            await Promise.delay(1000); 
            // then try again
            continue;  
        }
    }
    // when done, write response - appears in the usual synchronous 'at the end' 
    console.log('Done. Got ' + results.length + ' items total.');
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(results));    
}).listen(process.env.port || 1337);
console.log("Listening on http://127.0.0.1:" + (process.env.port || 1337));
