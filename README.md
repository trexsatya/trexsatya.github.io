Download video and subtitles from YT:
```
yt-dlp -a urls_to_download.txt --sub-langs SV --write-subs --convert-subs srt --audio-format mp3 -x -o "%(uploader)s/%(title)s [%(id)s].%(ext)s" -o "subtitle:%(uploader)s/%(title)s [%(id)s].%(ext)s"

```
Python:
```
p = pathlib.Path("/Users/satyendra.kumar/Documents/Swedish_Media/Swedish_YT_9")
    for it in p.rglob("*.sv.srt"):
        new_name = f"{it}".replace('.sv.srt', '.srt')
        print(it, new_name)
        os.rename(f"{it}", f"{new_name}")
```


JS Bookmark to connect subtitles to Wiki
---------------------------------------
```
var observeDOM = (function(){
  var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;

  return function( obj, callback ){
    if( !obj || obj.nodeType !== 1 ) { console.log('Node type !=1 ', obj.nodeType); return} 

    if( MutationObserver ){
      // define a new observer
      var mutationObserver = new MutationObserver(callback)

      // have the observer observe for changes in children
      mutationObserver.observe( obj, { childList:true, subtree:true })
      return mutationObserver
    }
    
    // browser support fallback
    else if( window.addEventListener ){
      obj.addEventListener('DOMNodeInserted', callback, false)
      obj.addEventListener('DOMNodeRemoved', callback, false)
    }
  }
})()

let subContainer = document.createElement('div');
subContainer.id = 'subtitleWiki'
subContainer.style.padding = '1em';
subContainer.style.paddingTop = '3em';
subContainer.style.position = 'fixed';
subContainer.style.right = '0.2em';
subContainer.style.height = '100%';
subContainer.style.width = '35%';
subContainer.style.backgroundColor = 'white'
document.body.appendChild(subContainer)

let lastSubs = null
observeDOM( $('.jw-captions'), function(m){ 
   var addedNodes = [], removedNodes = [];

   m.forEach(record => record.addedNodes.length & addedNodes.push(...record.addedNodes))
   
   m.forEach(record => record.removedNodes.length & removedNodes.push(...record.removedNodes))

  console.clear();
  console.log('Added:', addedNodes, 'Removed:', removedNodes);
  let subs = addedNodes.find(it => Array.from(it.classList).includes('jw-text-track-display'))
  if(subs) {
  	subs = subs.innerText.replaceAll("\n", " ")
  	subs = subs.split(" ").map(it => 
  		it.replaceAll("-", "").replaceAll("–", "").replaceAll(".", "").replaceAll(",", "").replaceAll("?", ""))
  		.map(it => `<span> <a target="_blank" href="https://sv.wiktionary.org/wiki/${it.toLowerCase()}">${it}</a></span>&nbsp;`).join(" ")

  	if(subs !== lastSubs) {
  		subtitleWiki.innerHTML = subs
  		lastSubs = subs
  	}
  }
});


$('#subtitleWiki').onclick = e => {
    if(e.target.nodeName !== 'A') {
    	return
    }
    let ws = window.wordsCollected || []
    ws.push(e.target.innerHTML)
    window.wordsCollected = ws
	//document.getElementsByClassName('jw-icon-playback')[0].click()
}
```
