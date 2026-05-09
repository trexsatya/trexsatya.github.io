(function() {
  function pinVideo() {
    let videoEl = null;
    let host = new URL(document.location.href).host;
    if(host === 'www.riksdagen.se') {
      // Pin the video player
      videoEl = document.querySelector("video-js");
      // alert(videoEl);
      let el = videoEl?.parentElement?.parentElement?.parentElement?.parentElement;
      console.log(el);
      if(el && el.style) { 
          el.style.position = 'fixed';
          el.style.zIndex = 2000;
          el.style.top = '5px';
          el.style.left = '10px';
          el.style.width = '100%';
          el.style.height = '10%';
      }
      console.log(el.style.position);
    }
  }
  
  try {
    setTimeout(pinVideo, 3000);
  } catch(e) {
    alert("Error" + e);
  }
})()
