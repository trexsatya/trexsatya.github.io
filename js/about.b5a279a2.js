(window["webpackJsonp"]=window["webpackJsonp"]||[]).push([["about"],{"04d0":function(t,e,r){"use strict";r.r(e);var n,a,i=function(){var t=this,e=t._self._c;return e("div",{staticClass:"editor-page"},[e("div",{staticClass:"container page"},[e("div",{staticClass:"row"},[e("div",{staticClass:"col-md-10 offset-md-1 col-xs-12"},[e("form",{on:{submit:function(e){return e.preventDefault(),t.onPublish(t.article.id)}}},[e("fieldset",{attrs:{disabled:t.inProgress}},[e("fieldset",{staticClass:"form-group"},[e("input",{directives:[{name:"model",rawName:"v-model",value:t.article.name,expression:"article.name"}],staticClass:"form-control form-control-lg",attrs:{type:"text",placeholder:"Article Title"},domProps:{value:t.article.name},on:{input:function(e){e.target.composing||t.$set(t.article,"name",e.target.value)}}})]),e("fieldset",{staticClass:"form-group"},[e("input",{directives:[{name:"model",rawName:"v-model",value:t.article.subject,expression:"article.subject"}],staticClass:"form-control",attrs:{type:"text",placeholder:"Subject"},domProps:{value:t.article.subject},on:{input:function(e){e.target.composing||t.$set(t.article,"subject",e.target.value)}}})]),e("fieldset",{staticClass:"form-group"},[e("textarea",{directives:[{name:"model",rawName:"v-model",value:t.article.content,expression:"article.content"}],staticClass:"form-control",attrs:{id:"editor",name:"editor",rows:"8",placeholder:"Write your article (in markdown)"},domProps:{value:t.article.content},on:{input:function(e){e.target.composing||t.$set(t.article,"content",e.target.value)}}})]),e("fieldset",{staticClass:"form-group"},[e("input",{directives:[{name:"model",rawName:"v-model",value:t.article.summary,expression:"article.summary"}],staticClass:"form-control",attrs:{type:"text",placeholder:"Description"},domProps:{value:t.article.summary},on:{input:function(e){e.target.composing||t.$set(t.article,"summary",e.target.value)}}})])]),e("button",{staticClass:"btn btn-lg pull-xs-left btn-primary",attrs:{disabled:t.inProgress,id:"publishArticleButton",type:"submit"}},[t._v(" Publish Article ")]),e("span",{staticClass:"btn btn-lg pull-xs-right btn-primary",attrs:{disabled:t.inProgress},on:{click:function(e){return t.onPreview()}}},[t._v(" Preview ")])])])])]),e("br"),e("br")])},o=[],s=r("ade3"),c=r("60a3"),l=r("2f62");let d=(n=Object(c["a"])({methods:Object(l["b"])(["fetchArticles"])}),n(a=class extends c["c"]{constructor(...t){super(...t),Object(s["a"])(this,"article",{}),Object(s["a"])(this,"errors",[]),Object(s["a"])(this,"inProgress",!1),Object(s["a"])(this,"CKEDITOR",window.CKEDITOR)}beforeRouteLeave(t,e,r){const n=confirm("Are you sure you want to leave?");return n?(localStorage.setItem("articleEditing",window.CKEDITOR.instances["editor"].getData()),r()):r(!1)}mounted(){console.log("mounted");const t=document.createElement("script");t.async=!1,t.src="/ckeditor/ckeditor.js",document.head.append(t),window.onload=t=>{window.CKEDITOR.replace("editor",{entities:!0,extraPlugins:"mathematica,codesnippet",allowedContent:!0}),this.setupEditor(),fetch(window.API_URL+"article/"+this.$route.params.id).then(t=>t.json()).then(t=>{this.article=t,setTimeout(()=>{CKEDITOR.instances["editor"].setData(this.article.content)},1e3)})}}setupEditor(){window.onbeforeunload=function(){return localStorage.setItem("articleEditing",window.CKEDITOR.instances["editor"].getData()),"Are you sure you want to leave?"};const t=window.CKEDITOR.instances["editor"];let e=!1,r=!1;t.on("key",(function(t){17==t.data.domEvent.$.keyCode&&(e=!1)})),t.on("key",(function(t){if(e=17==t.data.domEvent.$.keyCode||t.data.domEvent.$.metaKey||t.data.domEvent.$.ctrlKey,e||(e=t.metaKey||t.ctrlKey),e&&"s"==t.key&&(r=!0),r||83==t.data.domEvent.$.keyCode&&1==e){try{t.data.domEvent.$.preventDefault()}catch(n){}try{document.getElementById("publishArticleButton").click()}catch(a){}return e=!1,r=!1,!1}})),window.document.addEventListener("keydown",(function(t){if((window.navigator.platform.match("Mac")?t.metaKey:t.ctrlKey)&&83==t.keyCode){t.preventDefault();try{document.getElementById("publishArticleButton").click()}catch(t){}}}),!1)}validate(){console.log(this.article);const t={};return this.article.name||(t.title=["Can't be empty"]),this.article.subject||(t.subject=["Can't be empty"]),this.errors=t,0==Object.keys(t).length}onPreview(){const t=this.article.name,e=this.article.subject,r=this.article.summary;this.$store.dispatch("articlePreview",{content:CKEDITOR.instances["editor"].getData(),name:t,subject:e,summary:r})}onPublish(t){if(!this.validate())return;if(!window["X-Auth"]&&(window["X-Auth"]=prompt("Enter auth header"),!window["X-Auth"]))return;this.article.content=window.CKEDITOR.instances["editor"].getData();const e="POST",r=t?window.WRITE_API_URL+"article/"+t:window.WRITE_API_URL+"article";this.inProgress=!0,fetch(r+"?x-auth="+window["X-Auth"],{method:e,mode:"no-cors",body:JSON.stringify(this.article),headers:{"X-Auth":window["X-Auth"],"Content-Type":"application/json"}}).then(t=>(this.inProgress=!1,t.json()))}})||a);var u=d,g=r("2877"),h=Object(g["a"])(u,i,o,!1,null,null,null);e["default"]=h.exports},"0f88":function(t,e,r){},"291b":function(t,e,r){"use strict";r.r(e);var n,a,i=function(){var t=this,e=t._self._c;return e("b-container",{ref:"container",staticClass:"top-container articles-list"},[t.articles?t._e():e("b-spinner",{staticStyle:{width:"3rem",height:"3rem"},attrs:{label:"Large Spinner",type:"grow"}}),e("b-card-group",{attrs:{deck:""}},t._l(t.articles,(function(r,n){return e("div",{key:n,ref:"octagon",refInFor:!0,staticClass:"octagon-wrapper",staticStyle:{"text-align":"center"},attrs:{id:"hex1"}},[e("div",{staticClass:"octagon",attrs:{id:"color1"},on:{click:function(e){return t.onClick(r)}}},[e("span",{staticClass:"article-name"},[t._v(t._s(r.name))]),e("span",{staticClass:"sub-title"},[t._v(t._s(r.lastUpdated?t.getDateString(r.lastUpdated):"not ready"))])])])})),0)],1)},o=[],s=r("ade3"),c=(r("14d9"),r("60a3")),l=r("2f62");let d=(n=Object(c["a"])({methods:Object(l["b"])(["fetchArticles"])}),n(a=class extends c["c"]{constructor(...t){super(...t),Object(s["a"])(this,"articles",[]),Object(s["a"])(this,"API_BASE_URL",window.API_URL),Object(s["a"])(this,"IMAGES_BASE_URL",window.imageCdnUrl)}beforeRouteUpdate(t,e,r){console.log(this),r()}onClick(t){console.log(t),this.$router.push({path:"/article/"+t.id})}mounted(){console.log("mounted");const t=(t,e)=>{try{return t()}catch(r){return e}};fetch(this.API_BASE_URL+"articles/"+this.$route.params.subject).then(t=>t.json()).then(e=>{e=e.sort((e,r)=>{if(e.tags&&!r.tags)return-1;if(r.tags&&!e.tags)return 1;if(!e.tags&&!r.tags)return 0;let n=e.tags.find(t=>(t+"").indexOf("prity=")>=0),a=r.tags.find(t=>(t+"").indexOf("prity=")>=0);return n=t(()=>n.split("prity=")[1],null),a=t(()=>a.split("prity=")[1],null),n&&!a?-1:a&&!n?1:n||a?parseInt(n)-parseInt(a):0}),this.articles=e}),this.applyRandomTheme()}getDateString(t){if(!t)return"Jan 01, 2017";const e=new Date(t).toDateString();if(e.split(" ").length>1){const[t,r,n]=e.split(" ").slice(1);return`${t} ${r}, ${n}`}}relativeToAbsoluteUrl(t){return t?t.startsWith("http://")||t.startsWith("https://")?t:this.IMAGES_BASE_URL+t:"/img/placeholder.svg"}updated(){this.applyRandomTheme()}applyRandomTheme(){var t;function e(t,e){return r(t)>=165?"#000":"#fff"}function r(t){var e="string"===typeof t?n(t):t;return.2126*e[0]+.7152*e[1]+.0722*e[2]}function n(t){return t}function a(){var t=Math.round,e=Math.random,r=255;let n=[t(e()*r),t(e()*r),t(e()*r)];return{array:n,code:`rgba(${n.join(",")},1)`}}function i(t){try{var e=3;window.outerWidth<980&&(e=2),window.outerWidth<770&&(e=1),t.$refs.container.style["margin-left"]=Math.max(0,(window.outerWidth-310*e)/2)+"px",t.$refs.container.style["padding-left"]=0}catch(r){console.log(r)}}i(this),window.onresize=function(t){i(this)}.bind(this),null===(t=this.$refs.octagon)||void 0===t||t.forEach(t=>{let r=t.firstChild,n=t.firstChild.firstChild,i=t.firstChild.children[1],o=a();r.style["background-color"]=o.code,n.style["color"]=e(o.array),i.style["color"]=e(o.array,!0),n.style["transform"]="rotate(-45deg)"})}})||a);var u=d,g=(r("61b2"),r("2877")),h=Object(g["a"])(u,i,o,!1,null,null,null);e["default"]=h.exports},"2d3b":function(t,e,r){"use strict";r.r(e);var n,a,i=function(){var t=this,e=t._self._c;return e("b-container",{staticClass:"top-container"},[e("b-row",{staticClass:"search-container"},[e("input",{staticClass:"form-control",attrs:{id:"searchText",type:"text",placeholder:"Search (at least 3 letters)","aria-label":"Search"},domProps:{value:t.searchTerm},on:{keyup:function(e){return t.fetchArticles()}}})]),e("b-row",{},[t.isLoading?e("b-spinner",{staticStyle:{width:"3rem",height:"3rem"},attrs:{label:"Large Spinner",type:"grow"}}):t._e()],1),t.articles?t._e():e("div",[t._v(" No articles found! Try some other search text. ")]),e("b-card-group",{attrs:{deck:""}},t._l(t.articles,(function(r,n){return e("b-card",{key:n,staticClass:"article-card",staticStyle:{"margin-bottom":"5em"},attrs:{to:{name:"ArticleEdit",params:{id:r.id}},action:"",overlay:"","img-src":t.relativeToAbsoluteUrl(r.img),"bg-variant":"dark","text-variant":"white",title:r.name,"sub-title":"-","img-top":""},on:{click:function(e){return t.onClick(r)}},scopedSlots:t._u([{key:"footer",fn:function(){return[e("small",{staticClass:"text-muted"},[t._v(t._s(r.summary?"Last updated on "+t.getDateString(r.lastUpdated):"Under construction!"))])]},proxy:!0}],null,!0)},[e("b-card-text",{staticClass:"summary"},[t._v(" "+t._s(r.summary)+" ")])],1)})),1)],1)},o=[],s=r("ade3"),c=(r("14d9"),r("60a3")),l=r("2f62");let d=(n=Object(c["a"])({methods:Object(l["b"])([])}),n(a=class extends c["c"]{constructor(...t){super(...t),Object(s["a"])(this,"searched",!1),Object(s["a"])(this,"isLoading",!1),Object(s["a"])(this,"articles",[]),Object(s["a"])(this,"searchTerm",null),Object(s["a"])(this,"API_BASE_URL",window.API_URL),Object(s["a"])(this,"IMAGES_BASE_URL",window.imageCdnUrl)}beforeRouteUpdate(t,e,r){console.log(this),r()}onClick(t){console.log(t),this.$router.push({path:"/article/"+t.id})}mounted(){console.log("mounted"),this.articles=this.$store.state.searchPage.articles,this.searchTerm=this.$store.state.searchPage.searchTerm;try{window.PRELOAD_SEARCH&&fetch(this.API_BASE_URL+"search").then(t=>t.json()).then(t=>{this.preloadedSearch=t})}catch(t){console.log("Couldn't preload search")}}asyncFind(t){if(t){if(this.isLoading=!0,window.PRELOAD_SEARCH){let e=this.preloadedSearch.filter(e=>e.name.toLowerCase().indexOf(t.toLowerCase())>-1).map(t=>({name:t.name,id:t.id}));return this.articles=e,this.isLoading=!1,this.$store.commit("setSearchedArticles",{articles:e,searchTerm:t}),void(this.isLoading=!1)}fetch(this.API_BASE_URL+"search?query="+t).then(t=>t.json()).then(e=>{let r=e.map(t=>({name:t.name,id:t.id}));this.articles=r,this.isLoading=!1,this.$store.commit("setSearchedArticles",{articles:r,searchTerm:t})}).catch(t=>{this.isLoading=!1})}else this.isLoading=!1}fetchArticles(){const t=document.getElementById("searchText");this.isLoading=!0,this.searchTerm=t.value,this.searched=!0,t.value&&0!=t.value.trim().length||(this.articles=[],this.isLoading=!1,this.$store.commit("setSearchedArticles",{articles:[],searchTerm:""})),t.value.length<3?this.isLoading=!1:(console.log(t.value),this.asyncFind(t.value.trim()))}getDateString(t){if(!t)return"Jan 01, 2017";const e=new Date(t).toDateString();if(e.split(" ").length>1){const[t,r,n]=e.split(" ").slice(1);return`${t} ${r}, ${n}`}}relativeToAbsoluteUrl(t){return t?t.startsWith("http://")||t.startsWith("https://")?t:this.IMAGES_BASE_URL+t:"/img/placeholder.svg"}})||a);var u=d,g=(r("c2df"),r("2877")),h=Object(g["a"])(u,i,o,!1,null,null,null);e["default"]=h.exports},"3ad6":function(t,e,r){"use strict";r.r(e);var n=function(){var t=this,e=t._self._c;return e("div",[e("div",{staticClass:"article-container"},[t.article?t._e():e("b-spinner",{staticStyle:{width:"3rem",height:"3rem"},attrs:{label:"Large Spinner",type:"grow"}}),t.article?e("div",{staticClass:"article"},[e("div",{staticClass:"article-top"},[e("h2",{staticClass:"article-name",staticStyle:{"text-align":"center"}},[t._v(t._s(t.article.name))]),e("span",{staticClass:"last-updated"},[t._v("Last Updated: "+t._s(t.getDateString(t.article.lastUpdated)))]),e("div",{staticClass:"style"})]),e("div",{staticClass:"content",staticStyle:{"max-width":"100%",overflow:"auto"},domProps:{innerHTML:t._s(t.article.content)}})]):t._e()],1)])},a=[],i=r("ade3"),o=r("60a3"),s=r("2f62");r("14d9");function c(){document.querySelectorAll("img").forEach((t,e)=>{let r=t.getAttribute("src");r.startsWith("/images/")&&(r=r.replace("/images/",window.imageCdnUrl+"/images/"),t.src=r)})}const l=window.MathJax;function d(){document.querySelectorAll(".math").forEach(t=>{const e=t.innerHTML;t.innerHTML="",l.texReset();const r=l.getMetricsFor(t);r.display="DIV"===t.nodeName,l.tex2chtmlPromise(e,r).then((function(e){t.appendChild(e),l.startup.document.clear(),l.startup.document.updateDocument()})).catch((function(e){t.appendChild(document.createElement("pre")).appendChild(document.createTextNode(e.message))})).then((function(){console.log("done rendering math")}))})}function u(t){document.querySelectorAll;try{document.querySelectorAll(".flex-card-listitem").forEach((e,r)=>{const n=e.getAttribute("reactlink");e.style.cursor="pointer",e.onclick=()=>{t.push(n).catch(t=>{if("NavigationDuplicated"!=t.name)throw t})}}),document.querySelectorAll("a[reactlink]").forEach((e,r)=>{const n=e.getAttribute("reactlink");e.style.cursor="pointer",e.onclick=()=>{t.push(n).catch(t=>{if("NavigationDuplicated"!=t.name)throw t})}})}catch(e){console.log(e)}try{document.querySelectorAll("pre code").forEach(t=>{hljs.highlightBlock(t)})}catch(e){console.log(e)}try{c()}catch(e){console.log(e)}try{d()}catch(e){console.log(e)}(window.transformers||[]).forEach(t=>{try{t()}catch(e){console.log(e)}})}var g,h;window.appendScripts=function(t){t.forEach(t=>{const e=document.createElement("script");e.src=t,document.body.appendChild(e)})};let b=(g=Object(o["a"])({methods:Object(s["b"])(["fetchArticles"])}),g(h=class extends o["c"]{constructor(...t){super(...t),Object(i["a"])(this,"article",null),Object(i["a"])(this,"API_BASE_URL",window.API_URL),Object(i["a"])(this,"IMAGES_BASE_URL",window.imageCdnUrl)}beforeRouteUpdate(t,e,r){console.log(this),r()}mounted(){console.log("mounted"),fetch(this.API_BASE_URL+"article/"+this.$route.params.id).then(t=>t.json()).then(t=>{this.article=t})}updated(){u(this.$router)}relativeToAbsoluteUrl(t){return t?t.startsWith("http://")||t.startsWith("https://")?t:this.IMAGES_BASE_URL+t:"/img/placeholder.svg"}rafAsync(){return new Promise(t=>{requestAnimationFrame(t)})}checkElement(t){return null===document.querySelector(t)?this.rafAsync().then(()=>this.checkElement(t)):Promise.resolve(!0)}randomCss(){const t=()=>Math.floor(Math.random()*(Object.keys(this.gradientColors()).length-1-0)+0),e=t();this.fixCss(e)}fixCss(t){const e=this.gradientColors(),r={0:"white",2:"#5b5757",5:"#c4b2b2",11:"#5e5555"};$(".article-top .style").html(`<style>\n                div.article-top { ${e[t]} }\n                h2.article-name { color: ${r[t]||"white"}; }\n                </style>\n              `)}getDateString(t){if(!t)return"Jan 01, 2017";const e=new Date(t).toDateString();if(e.split(" ").length>1){const[t,r,n]=e.split(" ").slice(1);return`${t} ${r}, ${n}`}}gradientColors(){const t={0:"background: #232526;\nbackground: -webkit-linear-gradient(to right, #414345, #232526);\nbackground: linear-gradient(to right, #414345, #232526);\n",1:"\n                background: #642B73;\n                background: -webkit-linear-gradient(to right, #C6426E, #642B73);\n                background: linear-gradient(to right, #C6426E, #642B73);\n                ",2:"background: #36D1DC;\n                  background: -webkit-linear-gradient(to right, #5B86E5, #36D1DC);\n                  background: linear-gradient(to right, #5B86E5, #36D1DC);\n                ",3:"background: #CB356B;\n                background: -webkit-linear-gradient(to right, #BD3F32, #CB356B);\n                background: linear-gradient(to right, #BD3F32, #CB356B);\n                ",4:"background: #283c86;\n                background: -webkit-linear-gradient(to right, #45a247, #283c86);\n                background: linear-gradient(to right, #45a247, #283c86);\n                ",5:"background: #c0392b;\n                background: -webkit-linear-gradient(to right, #8e44ad, #c0392b);\n                background: linear-gradient(to right, #8e44ad, #c0392b);\n                ",6:"background: #EB5757;\n                background: -webkit-linear-gradient(to right, #000000, #EB5757);\n                background: linear-gradient(to right, #000000, #EB5757);\n                ",7:"background: #C33764;\n                background: -webkit-linear-gradient(to right, #1D2671, #C33764);\n                background: linear-gradient(to right, #1D2671, #C33764);\n                ",8:"background: #200122;\n                background: -webkit-linear-gradient(to right, #6f0000, #200122);\n                background: linear-gradient(to right, #6f0000, #200122);\n                ",9:"background: #4568DC;\n                background: -webkit-linear-gradient(to right, #B06AB3, #4568DC);\n                background: linear-gradient(to right, #B06AB3, #4568DC);\n                ",10:"background: #283048;\nbackground: -webkit-linear-gradient(to right, #859398, #283048);\nbackground: linear-gradient(to right, #859398, #283048);\n",11:"background: #DAE2F8;\nbackground: -webkit-linear-gradient(to right, #D6A4A4, #DAE2F8);\nbackground: linear-gradient(to right, #D6A4A4, #DAE2F8);\n",12:"background: #7474BF;\nbackground: -webkit-linear-gradient(to right, #348AC7, #7474BF);\nbackground: linear-gradient(to right, #348AC7, #7474BF);\n",13:"background: #5f2c82;\nbackground: -webkit-linear-gradient(to right, #49a09d, #5f2c82);\nbackground: linear-gradient(to right, #49a09d, #5f2c82);\n",14:"background: #C04848;\nbackground: -webkit-linear-gradient(to right, #480048, #C04848);\nbackground: linear-gradient(to right, #480048, #C04848);\n",15:"background: #FC354C;\nbackground: -webkit-linear-gradient(to right, #0ABFBC, #FC354C);\nbackground: linear-gradient(to right, #0ABFBC, #FC354C);\n",16:"background: #4b6cb7;\nbackground: -webkit-linear-gradient(to right, #182848, #4b6cb7);\nbackground: linear-gradient(to right, #182848, #4b6cb7);\n",17:"background: #1F1C2C;\nbackground: -webkit-linear-gradient(to right, #928DAB, #1F1C2C);\nbackground: linear-gradient(to right, #928DAB, #1F1C2C);\n",18:"background: #232526;\nbackground: -webkit-linear-gradient(to right, #414345, #232526);\nbackground: linear-gradient(to right, #414345, #232526);\n",19:"background: #16222A;\nbackground: -webkit-linear-gradient(to right, #3A6073, #16222A);\nbackground: linear-gradient(to right, #3A6073, #16222A);\n",20:"background: #4b6cb7;\nbackground: -webkit-linear-gradient(to right, #182848, #4b6cb7);\nbackground: linear-gradient(to right, #182848, #4b6cb7);\n",21:"background: #C04848;\nbackground: -webkit-linear-gradient(to right, #480048, #C04848);\nbackground: linear-gradient(to right, #480048, #C04848);\n",22:"background: #1e130c;\nbackground: -webkit-linear-gradient(to right, #9a8478, #1e130c);\nbackground: linear-gradient(to right, #9a8478, #1e130c);\n",23:"background: #360033;\nbackground: -webkit-linear-gradient(to right, #0b8793, #360033);\nbackground: linear-gradient(to right, #0b8793, #360033);\n",24:"background: #141E30;\nbackground: -webkit-linear-gradient(to right, #243B55, #141E30);\nbackground: linear-gradient(to right, #243B55, #141E30);\n",25:"background: #0f0c29;\nbackground: -webkit-linear-gradient(to right, #24243e, #302b63, #0f0c29);\nbackground: linear-gradient(to right, #24243e, #302b63, #0f0c29);\n",26:"background: #485563;\nbackground: -webkit-linear-gradient(to right, #29323c, #485563);\nbackground: linear-gradient(to right, #29323c, #485563);\n",27:"background: #333333;\nbackground: -webkit-linear-gradient(to right, #dd1818, #333333);\nbackground: linear-gradient(to right, #dd1818, #333333);\n",28:"background: #3C3B3F;\nbackground: -webkit-linear-gradient(to right, #605C3C, #3C3B3F);\nbackground: linear-gradient(to right, #605C3C, #3C3B3F);\n",29:"background: #ad5389;\nbackground: -webkit-linear-gradient(to right, #3c1053, #ad5389);\nbackground: linear-gradient(to right, #3c1053, #ad5389);\n",30:"background: #ff0084;\nbackground: -webkit-linear-gradient(to right, #33001b, #ff0084);\nbackground: linear-gradient(to right, #33001b, #ff0084);\n"};return t}})||h);var m=b,p=(r("afc4"),r("2877")),f=Object(p["a"])(m,n,a,!1,null,null,null);e["default"]=f.exports},"4e23":function(t,e,r){},"61b2":function(t,e,r){"use strict";r("edbe")},7836:function(t,e,r){"use strict";r("4e23")},a56e:function(t,e,r){},ade3:function(t,e,r){"use strict";function n(t,e,r){return e in t?Object.defineProperty(t,e,{value:r,enumerable:!0,configurable:!0,writable:!0}):t[e]=r,t}r.d(e,"a",(function(){return n}))},afc4:function(t,e,r){"use strict";r("0f88")},c2df:function(t,e,r){"use strict";r("a56e")},edbe:function(t,e,r){},f820:function(t,e,r){"use strict";r.r(e);var n=function(){var t=this,e=t._self._c;return e("div",{staticClass:"about"},[e("b-container",{staticClass:"top-container"},[e("h1",[t._v("About this site")]),e("b-row",{},[e("p",[t._v(" This is a personal site. Just as you like to keep your stuff neat and organized, much in the same way, I like to keep the things in my head neat and organized. From childhood I have been fascinated by what life is all about. And this is an ongoing journey. The website has been created in the same spirit. "),e("br"),t._v(" The site records not only what I have learned, but also what I want to learn! "),e("br"),t._v(" I've used my Engineering learnings to create this website (using the modern technologies). See the code for this website on "),e("a",{attrs:{href:"https://github.com/trexsatya/cupitor",target:"_blank"}},[t._v(" Github ")]),t._v(". ")])]),e("h1",[t._v("About me")]),e("b-row",{},[e("p",[t._v(" I am currently working as a Software Engineer. I am not very passionate about anything. "),e("br"),t._v(" But I am curious and I want to pursue wisdom. My goal is to eliminate traces of ego (along with all related vices) from my head, and act out of pure energy and serve others if possible. ")]),e("div",{staticClass:"col-xs-12 col-md-10 offset-md-1",staticStyle:{"margin-top":"3%"}},[t._v(" My Online Presence: "),e("link",{attrs:{rel:"stylesheet",href:"https://d1azc1qln24ryf.cloudfront.net/114779/Socicon/style-cf.css?rd5re8"}}),e("ul",{staticClass:"socicons-list",staticStyle:{"list-style":"none"}},[e("li",[e("a",{attrs:{href:"https://www.linkedin.com/in/satyendra-kumar-54671058/",target:"_blank"}},[e("span",{staticClass:"socicon"},[t._v("Linked In")])])]),e("li",[e("a",{attrs:{href:"https://github.com/trexsatya",target:"_blank"}},[e("span",{staticClass:"socicon"},[t._v("Github")])])]),e("li",[e("a",{attrs:{href:"https://stackoverflow.com/users/5332993/satyendra-kumar",target:"_blank"}},[e("span",{staticClass:"socicon"},[t._v("StackOverflow")])])]),e("li",[e("a",{attrs:{href:"https://stackexchange.com/users/5160541/satyendra-kumar",target:"_blank"}},[e("span",{staticClass:"socicon"},[t._v("StackExchange")])])])])])])],1)],1)},a=[],i=(r("7836"),r("2877")),o={},s=Object(i["a"])(o,n,a,!1,null,null,null);e["default"]=s.exports}}]);
//# sourceMappingURL=about.b5a279a2.js.map