(function(e){function t(t){for(var n,o,s=t[0],c=t[1],l=t[2],u=0,d=[];u<s.length;u++)o=s[u],Object.prototype.hasOwnProperty.call(a,o)&&a[o]&&d.push(a[o][0]),a[o]=0;for(n in c)Object.prototype.hasOwnProperty.call(c,n)&&(e[n]=c[n]);f&&f(t);while(d.length)d.shift()();return i.push.apply(i,l||[]),r()}function r(){for(var e,t=0;t<i.length;t++){for(var r=i[t],n=!0,o=1;o<r.length;o++){var s=r[o];0!==a[s]&&(n=!1)}n&&(i.splice(t--,1),e=c(c.s=r[0]))}return e}var n={},o={app:0},a={app:0},i=[];function s(e){return c.p+"js/"+({about:"about"}[e]||e)+"."+{about:"f32e5fe5"}[e]+".js"}function c(t){if(n[t])return n[t].exports;var r=n[t]={i:t,l:!1,exports:{}};return e[t].call(r.exports,r,r.exports,c),r.l=!0,r.exports}c.e=function(e){var t=[],r={about:1};o[e]?t.push(o[e]):0!==o[e]&&r[e]&&t.push(o[e]=new Promise((function(t,r){for(var n="css/"+({about:"about"}[e]||e)+"."+{about:"b15f0370"}[e]+".css",a=c.p+n,i=document.getElementsByTagName("link"),s=0;s<i.length;s++){var l=i[s],u=l.getAttribute("data-href")||l.getAttribute("href");if("stylesheet"===l.rel&&(u===n||u===a))return t()}var d=document.getElementsByTagName("style");for(s=0;s<d.length;s++){l=d[s],u=l.getAttribute("data-href");if(u===n||u===a)return t()}var f=document.createElement("link");f.rel="stylesheet",f.type="text/css",f.onload=t,f.onerror=function(t){var n=t&&t.target&&t.target.src||a,i=new Error("Loading CSS chunk "+e+" failed.\n("+n+")");i.code="CSS_CHUNK_LOAD_FAILED",i.request=n,delete o[e],f.parentNode.removeChild(f),r(i)},f.href=a;var h=document.getElementsByTagName("head")[0];h.appendChild(f)})).then((function(){o[e]=0})));var n=a[e];if(0!==n)if(n)t.push(n[2]);else{var i=new Promise((function(t,r){n=a[e]=[t,r]}));t.push(n[2]=i);var l,u=document.createElement("script");u.charset="utf-8",u.timeout=120,c.nc&&u.setAttribute("nonce",c.nc),u.src=s(e);var d=new Error;l=function(t){u.onerror=u.onload=null,clearTimeout(f);var r=a[e];if(0!==r){if(r){var n=t&&("load"===t.type?"missing":t.type),o=t&&t.target&&t.target.src;d.message="Loading chunk "+e+" failed.\n("+n+": "+o+")",d.name="ChunkLoadError",d.type=n,d.request=o,r[1](d)}a[e]=void 0}};var f=setTimeout((function(){l({type:"timeout",target:u})}),12e4);u.onerror=u.onload=l,document.head.appendChild(u)}return Promise.all(t)},c.m=e,c.c=n,c.d=function(e,t,r){c.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:r})},c.r=function(e){"undefined"!==typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},c.t=function(e,t){if(1&t&&(e=c(e)),8&t)return e;if(4&t&&"object"===typeof e&&e&&e.__esModule)return e;var r=Object.create(null);if(c.r(r),Object.defineProperty(r,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var n in e)c.d(r,n,function(t){return e[t]}.bind(null,n));return r},c.n=function(e){var t=e&&e.__esModule?function(){return e["default"]}:function(){return e};return c.d(t,"a",t),t},c.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},c.p="/",c.oe=function(e){throw console.error(e),e};var l=window["webpackJsonp"]=window["webpackJsonp"]||[],u=l.push.bind(l);l.push=t,l=l.slice();for(var d=0;d<l.length;d++)t(l[d]);var f=u;i.push([0,"chunk-vendors"]),r()})({0:function(e,t,r){e.exports=r("cd49")},"0ac0":function(e,t,r){},5507:function(e,t,r){"use strict";r("0ac0")},"5c0b":function(e,t,r){"use strict";r("9c0c")},"9c0c":function(e,t,r){},cd49:function(e,t,r){"use strict";r.r(t);r("e260"),r("e6cf"),r("cca6"),r("a79d");var n=r("2b0e"),o=r("5f5b"),a=r("b1e0"),i=function(){var e=this,t=e.$createElement,r=e._self._c||t;return r("div",{attrs:{id:"app"}},[r("div",{attrs:{id:"nav"}},[r("router-link",{attrs:{to:"/"}},[e._v("Home")]),e._v(" | "),r("router-link",{attrs:{to:"/about"}},[e._v("About")]),e._v(" | "),r("router-link",{attrs:{to:"/search"}},[e._v("Search")])],1),r("router-view",{key:e.$route.fullPath})],1)},s=[],c=(r("5c0b"),r("2877")),l={},u=Object(c["a"])(l,i,s,!1,null,null,null),d=u.exports,f=r("9483");Object(f["a"])("".concat("/","service-worker.js"),{ready:function(){console.log("App is being served from cache by a service worker.\nFor more details, visit https://goo.gl/AFskqB")},registered:function(){console.log("Service worker has been registered.")},cached:function(){console.log("Content has been cached for offline use.")},updatefound:function(){console.log("New content is downloading.")},updated:function(){console.log("New content is available; please refresh.")},offline:function(){console.log("No internet connection found. App is running in offline mode.")},error:function(e){console.error("Error during service worker registration:",e)}});r("d3b7");var h=r("8c4f"),p=r("2fe1"),b=function(){var e=this,t=e.$createElement,r=e._self._c||t;return r("div",{staticClass:"home"},[r("div",{ref:"imgContainer",staticClass:"img-container"},[r("img",{staticClass:"bg",attrs:{src:"https://images.pexels.com/photos/132037/pexels-photo-132037.jpeg"}})]),r("div",{staticClass:"upper-container"},[r("b-row",{staticClass:"header"},[r("b-col",{staticStyle:{"padding-top":"2em","text-align":"left","padding-left":"8em"}},[r("div",{ref:"searchIcon",staticClass:"search-icon"},[r("i",{staticClass:"fa fa-search",staticStyle:{"margin-top":"35%","margin-left":"28%"}})]),r("multiselect",{ref:"searchBox",staticClass:"search-box-in-nav left",attrs:{id:"ajax",label:"name","track-by":"code",placeholder:"Type to search","open-direction":"bottom",options:e.searchResult,multiple:!0,searchable:!0,loading:e.isLoading,"internal-search":!1,"clear-on-select":!0,"close-on-select":!0,"options-limit":300,selectLabel:"Select",limit:3,"max-height":600,"show-no-results":!1,"hide-selected":!0,"group-values":"results","group-label":"entity","group-select":!1},on:{select:e.searchResultSelected,"search-change":e.asyncFind},scopedSlots:e._u([{key:"tag",fn:function(t){var n=t.option;return[r("span",{staticClass:"custom__tag"},[r("span",[e._v(e._s(n.name))])])]}},{key:"clear",fn:function(t){return[e.selectedsearchResult.length?r("div",{staticClass:"multiselect__clear",on:{mousedown:function(r){return r.preventDefault(),r.stopPropagation(),e.clearAll(t.search)}}}):e._e()]}},{key:"option",fn:function(t){return[r("div",{staticClass:"option__desc"},[t.option.fullSearchLink?r("span",{staticClass:"option__title"},[r("a",{staticStyle:{color:"black"},attrs:{href:"/search"}},[e._v("Users with name "+e._s(t.option.username))])]):r("span",{staticClass:"option__title"},[e._v(e._s(e.searchItemLabel(t)))])])]}}])})],1),r("b-col",{staticStyle:{"text-align":"left"},attrs:{cols:"8"}},[r("span",{staticClass:"logo"},[e._v("Living to Learn ")])])],1),r("b-container",{ref:"cardsContainer"},[r("b-card-group",{attrs:{columns:""}},[r("b-card",{attrs:{"no-body":"",header:"Computer Engineering"}},[r("b-card-body",[r("b-list-group",{attrs:{flush:""}},[r("b-list-group-item",[r("router-link",{attrs:{to:"/articles/programming"}},[e._v(" Programming ")])],1),r("b-list-group-item",[r("router-link",{attrs:{to:"/articles/algos"}},[e._v(" Algorithms & Problem-Solving ")])],1),r("b-list-group-item",[r("router-link",{attrs:{to:"/articles/devops"}},[e._v(" DevOps ")])],1),r("b-list-group-item",[r("router-link",{attrs:{to:"/articles/ai"}},[e._v(" Artificial Intelligence ")])],1),r("b-list-group-item",[r("router-link",{attrs:{to:"/articles/architecture"}},[e._v(" Design & Architecture ")])],1)],1)],1)],1),r("b-card",{attrs:{header:"Science","no-body":""}},[r("b-card-body",[r("b-list-group",{attrs:{flush:""}},[r("b-list-group-item",[r("router-link",{attrs:{to:"/articles/life-science"}},[e._v(' "Science" of Life ')])],1),r("b-list-group-item",[r("router-link",{attrs:{to:"/articles/psychology"}},[e._v(' "Science" of Psyche ')])],1),r("b-list-group-item",[r("router-link",{attrs:{to:"/articles/natural-science"}},[e._v(" Science of Matter ")])],1)],1)],1)],1),r("b-card",{staticStyle:{"background-color":"rgb(0 123 255 / 0.2) !important"},attrs:{"bg-variant":"primary","text-variant":"white"}},[r("blockquote",{staticClass:"card-blockquote"},[r("p",[e._v("Life is a journey, without any destination. "),r("br"),e._v("To make sense of it is my little ambition. ")]),r("footer",[r("small",[e._v("Anonymous")])])])]),r("b-card",{attrs:{"no-body":"",header:"Philosophy"}},[r("b-card-body",[r("b-list-group",{attrs:{flush:""}},[r("b-list-group-item",[r("router-link",{attrs:{to:"/articles/philosophy"}},[e._v(" Miscelleneous ")])],1)],1)],1)],1)],1)],1)],1)])},m=[],g=(r("4de4"),r("c975"),r("d81d"),r("b0c0"),r("ac1f"),r("841c"),r("96cf"),r("1da1")),v=r("d4ec"),y=r("bee2"),_=r("262e"),k=r("2caf"),w=r("9ab4"),S=r("8e5f"),C=r.n(S),L=r("60a3"),j=(r("e607"),function(e){Object(_["a"])(r,e);var t=Object(k["a"])(r);function r(){var e;return Object(v["a"])(this,r),e=t.apply(this,arguments),e.selected="",e.options=[],e.toggleSearchBar=!0,e.selectedsearchResult=[],e.searchResult=[],e.isLoading=!1,e.preloadedSearch=[],e.showingModalFor="Login",e.API_BASE_URL=window.API_URL,e}return Object(y["a"])(r,[{key:"asyncFind",value:function(e){var t=this;if(e){if(this.isLoading=!0,window.PRELOAD_SEARCH){var r=this.preloadedSearch.filter((function(t){return t.name.toLowerCase().indexOf(e.toLowerCase())>-1})).map((function(e){return{name:e.name,id:e.id}}));return this.searchResult=[{entity:"articles",results:r}],void(this.isLoading=!1)}fetch(this.API_BASE_URL+"search?query="+e).then((function(e){return e.json()})).then((function(e){var r=e.map((function(e){return{name:e.name,id:e.id}}));t.searchResult=[{entity:"articles",results:r}],t.isLoading=!1})).catch((function(e){t.isLoading=!1}))}}},{key:"searchItemLabel",value:function(e){return e.option.$groupLabel?e.option.$groupLabel:e.option.name}},{key:"clearAll",value:function(){this.selectedsearchResult=[]}},{key:"mounted",value:function(){var e=this;try{this.$refs.searchBox.$refs.search.setAttribute("autocomplete","off"),this.$refs.searchBox.$refs.tags.style.borderRadius=0;var t=this.$refs.searchBox,r=function(){var e=t.$el.style.visibility;t.$el.style.visibility="visible"!=e?"visible":"hidden"};this.$refs.searchIcon.onclick=r;var n=this.$refs.imgContainer;this.$refs.cardsContainer.onmouseover=function(){n.classList.add("more-visible")},this.$refs.cardsContainer.onmouseout=function(){n.classList.remove("more-visible")}}catch(o){console.log(o)}try{window.PRELOAD_SEARCH&&fetch(this.API_BASE_URL+"search").then((function(e){return e.json()})).then((function(t){e.preloadedSearch=t}))}catch(o){}}},{key:"signOut",value:function(){var e=Object(g["a"])(regeneratorRuntime.mark((function e(){return regeneratorRuntime.wrap((function(e){while(1)switch(e.prev=e.next){case 0:this.$auth.logout();case 1:case"end":return e.stop()}}),e,this)})));function t(){return e.apply(this,arguments)}return t}()},{key:"isLoggedIn",value:function(){return this.$auth.loggedIn}},{key:"userName",value:function(){return this.$auth.user.username}},{key:"signinClicked",value:function(){this.$bvModal.hide("signup-modal"),this.$bvModal.show("signin-modal")}},{key:"profileLink",value:function(){return"/users/"+this.$auth.user.username}},{key:"searchResultSelected",value:function(e){this.$router.push("/article/"+e.id)}},{key:"searchIconClicked",value:function(){}}]),r}(n["default"]));Object(w["a"])([Object(L["b"])()],j.prototype,"transparent",void 0),Object(w["a"])([Object(L["b"])()],j.prototype,"colorOnScroll",void 0),Object(w["a"])([Object(L["b"])({default:"white"})],j.prototype,"type",void 0),j=Object(w["a"])([Object(L["a"])({components:{Multiselect:C.a}})],j);var A=j,O=A,P=(r("5507"),Object(c["a"])(O,b,m,!1,null,"04b7e1cc",null)),$=P.exports;p["b"].registerHooks(["beforeRouteEnter","beforeRouteLeave","beforeRouteUpdate"]),n["default"].use(h["a"]);var x=[{path:"/",name:"Home",component:$},{path:"/about",name:"About",component:function(){return r.e("about").then(r.bind(null,"f820"))}},{path:"/articles/:subject",name:"Articles",component:function(){return r.e("about").then(r.bind(null,"291b"))}},{path:"/article/:id",name:"Article",component:function(){return r.e("about").then(r.bind(null,"3ad6"))}},{path:"/search",name:"SearchArticles",component:function(){return r.e("about").then(r.bind(null,"2d3b"))}},{path:"/editor/:id",name:"ArticleEdit",component:function(){return r.e("about").then(r.bind(null,"04d0"))}}],R=new h["a"]({mode:"hash",base:"/",routes:x}),E=R,I=r("2f62");n["default"].use(I["a"]);var T=new I["a"].Store({state:{searchPage:{articles:[],searchTerm:""}},getters:{},mutations:{setSearchedArticles:function(e,t){e.searchPage.articles=t.articles,e.searchPage.searchTerm=t.searchTerm}},actions:{},modules:{}});r("f9e3"),r("2dd8");n["default"].config.productionTip=!1,n["default"].use(o["a"]),n["default"].use(a["a"]),new n["default"]({router:E,store:T,render:function(e){return e(d)}}).$mount("#app")}});
//# sourceMappingURL=app.3fb999f3.js.map