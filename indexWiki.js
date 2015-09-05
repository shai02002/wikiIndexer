// we will use this because we want to know that all indexes are done
// elastic search is much slower then the rest of this program so wait
canClose=0
// index sentence in elasticsearch
// we do not use bulk as it consumes more memmory
function indexSentence(client, orig, sentenc) {
  canClose++
  client.create({
    index: 'wiki',
    type: 'pages',
    body: {
      sentence: sentenc,
      origDoc: orig
    }
  }, function (error, response) {
    if (error != undefined) {
        console.log(error)
    }
    canClose--
  })
}

// gets a url and indexe it and all the innerlinks to sentences
function indexUrl(mainUrl, client)
{
    linksToIndex = getAllLinksToIndex(mainUrl)
    
    XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest
  for(i=0; i<linksToIndex.length; i++) {
    xmlHttp = new XMLHttpRequest()
    xmlHttp.open("GET", linksToIndex[i], false); // false for synchronous request
    xmlHttp.send()
    str = xmlHttp.responseText
    str = removeUnneededTags(str)
    pageParts = str.split(/<.*?>\s*/).filter(function (el) { return el.length > 0 })
    
    pageSentences = extractSentences(pageParts)
    
    console.log(linksToIndex[i] + ' '  + i)
 
    pageSentences.forEach(function(sentence){indexSentence(client, linksToIndex[i], sentence)})
  }

  console.log('indexed done')
}

// get all page parts and returns list of sentences in them
function extractSentences(pageParts) {
  pageSentences = []
  for(j=0;j<pageParts.length;j++) {
    partSentences=pageParts[j].split('. ')
    for(k=0;k<partSentences.length;k++) {
      if (partSentences[k].length < 2) { 
        continue
      }
            
      pageSentences.push(partSentences[k])
    }
  }

  return pageSentences
}

// remove tags that do not split senyences or have alot of potentially multiline text
function removeUnneededTags(page) {
  // delete <a><b><i> </b></i></a> tags, styles part of sentence
  page = page.replace(/(<a.*?>)|(<\/a>)|(<b.*?>)|(<\/b>)|(<i.*?>)|(<\/i>)/g, "")

  // remove scripts
  page = page.replace(/<script[\s\S]*?<\/script>/g, "")

  // remove styles
  page = page.replace(/<style[\s\S]*?<\/style>/g, "")

  // remove comments
  page = page.replace(/<!--[\s\S]*?-->/g, "")
 
  return page
}

// gets an array and returns a set. elements will be sorted
function removeDuplicates(dupArr) {
  return dupArr.sort().filter(function(item, index, array) {
      return !index || item != array[index - 1];
  })
}

// get a main url and all inner links without duplicates
function getAllLinksToIndex(url) {
  XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest
  xmlHttp = new XMLHttpRequest();
  xmlHttp.open("GET", url, false); // false for synchronous request
  xmlHttp.send();
  str = xmlHttp.responseText

  linksToIndex = getAllInnerLinks(str)
  linksToIndex.push(url)

  linksToIndex = removeDuplicates(linksToIndex)

  return linksToIndex
}
function getAllInnerLinks(str) {
  //get all links
  links = str.match(/(href\s*?=\s*?\").*?\"/gi)

  //remove 'href="' and '"'
 links.forEach(function (element, index, array) {
      element = element.substring(0, element.length - 1)
      array[index] = element.replace(/href\s*?=\"/, '')
  }) 

  // remove those who are not inner wiki links
  links = links.filter(function (element) {
      tocheck = '/wiki'
      return element.substring(0, tocheck.length) === tocheck
  })

  // add the http... prefix
  links.forEach(function (element, index, array) {
      array[index] = 'https://en.wikipedia.org' + element
  })

  return links
}


// create client and start indexing
elasticsearch = require('elasticsearch')
var client = new elasticsearch.Client({
  host: 'localhost:9200',
  log: 'error',
  requestTimeout: 60000
})

indexUrl('https://en.wikipedia.org/wiki/Main_Page', client)

// elastic search is much slower then us so wait untill it is done
setTimeout(function(){
  client.close()
  console.log('can close ' + canClose)
},30000 );

console.log('done')

