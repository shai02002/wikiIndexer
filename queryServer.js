
// take qurey results, parse them and respond
function sendResponse(queryResult, response) {
  response.writeHead(200, {"Content-Type": "text/plain"})
  
  hits = queryResult.hits.hits
  response.write('{ result: ')
  response.write('["' + hits[0]._source.sentence + '", ' + hits[0]._source.origDoc + ']')
  
  for(i=1; i<hits.length; i++) {
    response.write(', ["' + hits[i]._source.sentence + '", ' + hits[i]._source.origDoc + ']')
  }
  response.write(' }')
  
  response.end()
}

// check url is in correct format and search
function search(url, response) {
  urlParts = url.split('=')
  if(urlParts.length>2)
    throw 'too meny parameters'
  if(urlParts[0]!='keyword')
    throw 'unknowm query type'
 
  urlParts[1] = urlParts[1].replace('%20', ' ')
   
  elasticsearch = require('elasticsearch')

  client = new elasticsearch.Client({
    host: 'localhost:9200',
    log: 'trace'
  });
  
  client.search({
    index: 'wiki',
    type: 'pages',
    q: 'sentence: ' + urlParts[1],
    size: 500
  }).then(function(result){
    console.log('query completed')
    sendResponse(result, response)
    });
}


// start server :)
console.log("hello")

http = require("http");

http.createServer(function(request, response) {
  urlParts=request.url.split('?')
  if(urlParts[0]==='/search' && urlParts.length==2) {
    try {
      search(urlParts[1], response)
    }
    catch(err) {
      console.log(err)
    }
  }
  else {
    console.log('page url error' + request.url)
  }
}).listen(8888);

