// macros ----------------------------------------

macro function! {
  case {_ $name ($params ...) { $body ...} } => {
    return #{ var $name = require('q').async(function * $name ($params ...) { $body ... }) }
  }
  case {_ ($params ...) { $body ...} } => {
    return #{ require('q').async(function * ($params ...) { $body ... }) }
  }
}
macro await {
  case {_ $e:expr } => {
    return #{ yield $e }
  }
}

let var = macro {
  rule { $name:ident = $value:expr } => {
    var $name = $value
  }
 
  rule { {$name:ident (,) ...} = $value:expr } => {
    var object = $value
    $(, $name = object.$name) ...
  }
 
  rule { [$name:ident (,) ...] = $value:expr } => {
    var array = $value, index = 0
    $(, $name = array[index++]) ...
  }
}

// app ------------------------------------------------

var http = require('http');
var Q = require('q');
var request = require('./request.js');
var headers = { 'User-Agent': 'lukehoban', 'Authorization': 'token 665021d813ad67942206d94c47d7947716d27f66' };

function! getCollaboratorImages(full_name) {
  // promise-returning async HTTP GET
  // note - if any exceptions are thrown here they will propogate into try/catch in callers
  var url = 'https://api.github.com/repos/' + full_name + '/collaborators';
  var [response, body] = await request({url: url, headers: headers}); 
  console.log('got a collab response:' + url + ': ' + JSON.stringify(response.headers));
  return JSON.parse(body).map(function(collab) {
    console.log('got an avatar');
    return collab.avatar_url;
  });;
}

// can use a function! here because createServer doesn't care what this returns
http.createServer(function! (req, res) {
  console.log('starting...')
  var url = 'https://api.github.com/search/repositories?per_page=100&q=' + 'tetris';
  var items = [];
  // write a normal 'synchronous' while loop
  while(true) { 
    console.log('Got ' + items.length + ' items total.  Next: ' + url);
    // use normal exception handling
    try { 
      // promise-returning async HTTP GET
      var [response, body] = await request({url: url, headers: headers}); 
      var newItems = Q.all(JSON.parse(body).items.map(function!(item) {
        return { 
          full_name: item.full_name, 
          collabs_images: await getCollaboratorImages(item.full_name)
        };
      }));
      items = items.concat(await newItems);
      console.log(items);
      url = (/<(.*)>; rel="next"/.exec(response.headers.link) || [])[1];
      // break once there is no 'next' link
      if(!url) break; 
    } catch(err) {
      console.log('backing off... ' + err)
      // backoff on any error
      await Q.timeout(1000); 
      // then try again
      continue;  
    }
  }
  // when done, write response - appears in the usual synchronous 'at the end' 
  console.log('Done. Got ' + items.length + ' items total.');
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(items));    
}).listen(process.env.port || 1337);
