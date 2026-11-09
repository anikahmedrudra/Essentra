/* ─────────────────────────────────────────────────────────────────────────────
   Essentra — navigation history (Back / Forward support)
   The store is a single page that swaps "pages" with show/hide. Without history
   entries the browser Back button had nowhere to go inside the site and simply
   left it. This file gives every page, account section, admin tab and overlay
   (product popup, cart, checkout, login, search…) its own history entry:

     /   /collection   /scent-finder   /policy/<name>
     /account/<section>   /account/order/<id>   /admin/<tab>

   These are real paths (history.pushState), not "#/…" hashes. The server must
   serve index.html for them — see netlify.toml / vercel.json / _redirects /
   .htaccess. Old "#/collection" links are converted automatically.

   Nothing here needs editing. It loads after script.js and wraps its functions.
   ───────────────────────────────────────────────────────────────────────────── */
(function(){
  'use strict';
  if(!window.history || !history.pushState) return;
  try{ history.scrollRestoration='manual'; }catch(e){}

  var $=function(id){ return document.getElementById(id); };
  var R={ layer:null, silent:0, cur:'/home', tick:false };

  /* real-path URLs (falls back to #/hash only when opened from file://) */
  var HASHMODE=!/^https?:$/.test(location.protocol);
  function urlOf(route){ if(HASHMODE) return '#'+route; return route==='/home'?'/':route; }
  function routeFromLocation(){
    var h=String(location.hash||'');
    if(h.indexOf('#/')===0) return h.slice(1);                  // legacy  /#/collection  links
    if(HASHMODE) return '/home';
    var p=location.pathname.replace(/\/index\.html$/,'').replace(/\/+$/,'');
    return p||'/home';
  }

  var ACCT_SECTIONS=['dashboard','profile','password','orders','track','addresses','points','wishlist'];
  var POLICIES=['privacy','terms','return','shipping'];

  /* ── helpers ── */
  function isAdmin(){ try{ return !!(session && session.type==='admin'); }catch(e){ return false; } }
  function isCustomer(){ try{ return !!(session && session.type==='customer'); }catch(e){ return false; } }
  function visible(id){ var el=$(id); return !!el && el.style.display!=='none' && getComputedStyle(el).display!=='none'; }
  function markTick(){ R.tick=true; setTimeout(function(){ R.tick=false; },0); }
  function setState(st,url){
    try{ if(url===undefined) history.replaceState(st,''); else history.replaceState(st,'',url); }catch(e){}
  }

  /* ── page routes ── */
  function push(route){
    if(R.silent){ R.cur=route; return; }
    if(R.layer){
      var wasSame=(route===R.cur);
      R.layer=null;
      if(wasSame){ scheduleLayerPop(); return; }       // overlay entry just needs to disappear
      setState({r:route},urlOf(route)); R.cur=route; markTick(); return;   // overlay entry becomes the new page
    }
    if(route===R.cur) return;
    if(R.tick){ setState({r:route},urlOf(route)); R.cur=route; return; }  // several calls in one click → final one wins
    setState(Object.assign({},history.state||{r:R.cur},{y:window.scrollY||0}));   // remember where we were
    try{ history.pushState({r:route},'',urlOf(route)); }catch(e){ return; }
    R.cur=route; markTick();
  }
  function scheduleLayerPop(){
    setTimeout(function(){
      if(!R.layer && history.state && history.state.o){ try{ history.back(); }catch(e){} }
    },0);
  }

  /* ── overlay layers (popup, cart, checkout…) detected by their "open" class ── */
  var LAYERS={
    product :{is:function(){ return has('productModal','open'); },        close:function(){ call('closeModal'); }},
    cart    :{is:function(){ return has('cartSidebar','open'); },         close:function(){ if(has('cartSidebar','open')) call('toggleCart'); }},
    checkout:{is:function(){ return has('checkoutOverlay','open'); },     close:function(){ call('closeCheckout'); }},
    auth    :{is:function(){ return has('authOverlay','open'); },         close:function(){ call('closeAuthOverlay'); }},
    search  :{is:function(){ return has('searchOverlay','open'); },       close:function(){ call('closeSearchOverlay'); }},
    contact :{is:function(){ return has('contactOverlay','open'); },      close:function(){ call('closeContactOverlay'); }},
    track   :{is:function(){ return has('trackOverlay','open'); },        close:function(){ call('closeTrackOverlay'); }},
    menu    :{is:function(){ return has('mmDrawer','open'); },            close:function(){ call('toggleMobileMenu',false); }},
    filters :{is:function(){ return has('shopSidebar','open'); },         close:function(){ call('toggleShopFilters',false); }},
    review  :{is:function(){ return has('reviewOverlay','open'); },       close:function(){ call('closeReviewModal'); }},
    customer:{is:function(){ return has('customerDetailModal','open'); }, close:function(){ call('closeCustomerDetail'); }},
    popup   :{is:function(){ return !!document.querySelector('.ep-overlay.ep-open'); },
              close:function(){ var b=document.querySelector('.ep-overlay.ep-open .ep-close'); if(b) b.click(); }},
    sheet   :{is:function(){ return document.body.classList.contains('mobsheet-open'); },
              close:function(){ document.body.classList.remove('mobsheet-open','no-scroll'); }}
  };
  var known={};
  function has(id,cls){ var el=$(id); return !!el && el.classList.contains(cls); }
  function call(name,arg){ try{ if(typeof window[name]==='function') window[name](arg); }catch(e){ console.warn('router close failed',name,e); } }

  function openLayer(name){
    if(R.silent){ R.layer=name; return; }
    var st={r:R.cur,o:name,y:window.scrollY||0};
    if(R.layer){ setState(st); }                      // switching overlay → reuse the entry
    else{ try{ history.pushState(st,''); }catch(e){} }
    R.layer=name;
  }
  function closeLayer(name){
    if(R.silent){ if(R.layer===name) R.layer=null; return; }
    if(R.layer!==name) return;
    // wait one tick: if another overlay / page opens right away the entry is reused instead
    setTimeout(function(){
      if(R.layer===name && !LAYERS[name].is()){
        R.layer=null;
        if(history.state && history.state.o){ try{ history.back(); }catch(e){} }
      }
    },0);
  }
  function checkLayers(){
    Object.keys(LAYERS).forEach(function(n){
      var now=!!LAYERS[n].is();
      if(now===!!known[n]) return;
      known[n]=now;
      if(now) openLayer(n); else closeLayer(n);
    });
  }
  function closeAllLayers(){
    Object.keys(LAYERS).forEach(function(n){ if(LAYERS[n].is()){ try{ LAYERS[n].close(); }catch(e){} } });
    document.body.style.overflow='';
    Object.keys(LAYERS).forEach(function(n){ known[n]=false; });
    R.layer=null;
  }

  /* ── applying a route (used by Back / Forward / refresh) ── */
  function parse(route){
    var parts=String(route||'').replace(/^#/,'').split('/').filter(Boolean).map(function(p){ try{ return decodeURIComponent(p); }catch(e){ return p; } });
    return parts;
  }
  function normalise(route){
    var p=parse(route), head=p[0]||'home';
    if(head==='collection') return '/collection';
    if(head==='scent-finder') return '/scent-finder';
    if(head==='policy') return '/policy/'+(POLICIES.indexOf(p[1])>-1?p[1]:'privacy');
    if(head==='account'){
      if(!isCustomer()) return '/home';
      if(p[1]==='order' && p[2]){
        var o=(typeof orders!=='undefined')?orders.find(function(x){ return x.id===p[2] && x.customerEmail===session.email; }):null;
        return o?'/account/order/'+encodeURIComponent(p[2]):'/account/orders';
      }
      return '/account/'+(ACCT_SECTIONS.indexOf(p[1])>-1?p[1]:'dashboard');
    }
    if(head==='admin'){
      if(!isAdmin()) return '/home';
      var tab=p[1]||'dashboard';
      return '/admin/'+(document.getElementById('tab-'+tab)?tab:'dashboard');
    }
    return '/home';
  }
  function show(route){
    var p=parse(route), head=p[0];
    R.silent++;
    try{
      if(head==='collection'){ showCollectionPage(); }
      else if(head==='scent-finder'){ showScentFinderPage(); setActiveNavLink('navLinkScent'); }
      else if(head==='policy'){ showPolicyPage(p[1]); }
      else if(head==='account'){
        showAccountPage();
        if(p[1]==='order') viewOrderDetail(p[2]); else showAcctSection(p[1]);
      }
      else if(head==='admin'){
        hideAllMainPages();
        $('admin').style.display='block';
        switchTab(p[1]);
        if(typeof renderAdminProfileCard==='function') renderAdminProfileCard();
      }
      else{ showHomePage(); }
    }finally{ R.silent--; }
  }
  function restoreScroll(y){
    y=y||0;
    var tries=0, stop=false;
    function cancel(){ stop=true; }
    ['wheel','touchstart','keydown','mousedown'].forEach(function(ev){ window.addEventListener(ev,cancel,{once:true,passive:true}); });
    function go(){
      if(stop) return;
      window.scrollTo({top:y,left:0,behavior:'instant'});
      // content (products, reviews, images) can still be loading and clamp the target: keep retrying until it sticks
      if(Math.abs(window.scrollY-y)>2 && tries++<40) setTimeout(go,100);
    }
    go(); requestAnimationFrame(go); setTimeout(go,120); setTimeout(go,350);
  }
  function applyEntry(st){
    var wanted=(st&&st.r)?st.r:routeFromLocation();
    var route=normalise(wanted);
    var changed=(route!==R.cur);
    var hadOverlay=Object.keys(LAYERS).some(function(n){ return LAYERS[n].is(); });
    R.silent++;
    try{ closeAllLayers(); }finally{ R.silent--; }
    if(changed){
      show(route);
      R.cur=route;
      restoreScroll(st&&st.y);
    }
    // keep the entry honest (strip stale overlay marker / fix redirected route)
    if((st&&st.o) || route!==wanted){ setState({r:route,y:st&&st.y},urlOf(route)); }
    return hadOverlay;
  }

  window.addEventListener('popstate',function(e){ applyEntry(e.state); });

  /* ── wrap the page-switching functions so every visit is recorded ── */
  function wrap(name,routeFn,guard){
    var orig=window[name]; if(typeof orig!=='function') return;
    window[name]=function(){
      var out=orig.apply(this,arguments);
      try{
        if(!guard || guard.apply(this,arguments)){
          var r=routeFn.apply(this,arguments);
          if(r) push(r);
        }
      }catch(e){ console.warn('router',name,e); }
      return out;
    };
  }
  var lastOrderId=null;
  wrap('showHomePage',        function(){ return '/home'; });
  wrap('showCollectionPage',  function(){ return '/collection'; });
  wrap('showScentFinderPage', function(){ return '/scent-finder'; });
  wrap('showPolicyPage',      function(which){ return '/policy/'+(POLICIES.indexOf(which)>-1?which:'privacy'); });
  (function(){                                     // remember which order is open BEFORE its section is shown
    var orig=window.viewOrderDetail; if(typeof orig!=='function') return;
    window.viewOrderDetail=function(id){ lastOrderId=id; return orig.apply(this,arguments); };
  })();
  wrap('showAcctSection',     function(name){
    if(name==='orderDetail') return lastOrderId?'/account/order/'+encodeURIComponent(lastOrderId):'/account/orders';
    return '/account/'+name;
  }, function(){ return visible('accountPage') && isCustomer(); });
  wrap('switchTab',           function(id){ return '/admin/'+id; }, function(){ return visible('admin') && isAdmin(); });

  /* ── overlays: watch their "open" classes ── */
  var watch=['productModal','cartSidebar','checkoutOverlay','authOverlay','searchOverlay','contactOverlay','mmDrawer','shopSidebar','reviewOverlay','customerDetailModal'];
  var mo=new MutationObserver(checkLayers);
  watch.forEach(function(id){ var el=$(id); if(el) mo.observe(el,{attributes:true,attributeFilter:['class']}); });
  mo.observe(document.body,{attributes:true,attributeFilter:['class']});
  window.__essentraWatch=function(el){ if(el) mo.observe(el,{attributes:true,attributeFilter:['class']}); };   // used by popups.js

  /* ── remember scroll position of the current entry (so Back lands where you were) ── */
  var scrollT=null;
  window.addEventListener('scroll',function(){
    clearTimeout(scrollT);
    scrollT=setTimeout(function(){
      if(R.silent) return;
      var st=history.state||{r:R.cur};
      if(Math.abs((st.y||0)-window.scrollY)<4) return;
      setState(Object.assign({},st,{y:window.scrollY||0}));
    },180);
  },{passive:true});

  /* ── first load: honour the URL (refresh / shared link / bookmark) ── */
  function boot(){
    var wanted=routeFromLocation();
    var route=normalise(wanted);
    var h=String(location.hash||'');
    var anchor=(h && h.indexOf('#/')!==0)?h:'';           // e.g. /#about, /#contact, /#reviews
    if(route!=='/home'){ show(route); }
    var _y=(history.state&&history.state.y)||0;
    if(_y>0) setTimeout(function(){ restoreScroll(_y); },0);
    R.cur=route;
    var url=(HASHMODE && !h)?location.href:(urlOf(route)+(route==='/home'?anchor:''));
    setState({r:route,y:_y}, url);
    if(anchor && route==='/home' && !_y){
      var t=document.getElementById(anchor.slice(1));
      if(t){ setTimeout(function(){ t.scrollIntoView({behavior:'smooth',block:'start'}); },400); }
    }
  }
  boot();

  /* save the exact position when the tab is refreshed / closed / hidden */
  function saveY(){ if(R.silent) return; var st=history.state||{r:R.cur}; setState(Object.assign({},st,{y:window.scrollY||0})); }
  window.addEventListener('pagehide',saveY);
  document.addEventListener('visibilitychange',function(){ if(document.visibilityState==='hidden') saveY(); });

  /* ctrl/cmd/shift/middle-click on our links: let the browser open a new tab */
  document.addEventListener('click',function(e){
    if(e.defaultPrevented) return;
    if(!(e.ctrlKey||e.metaKey||e.shiftKey||e.button===1)) return;
    var a=e.target&&e.target.closest?e.target.closest('a[href]'):null;
    if(a && a.getAttribute('onclick') && /^\//.test(a.getAttribute('href'))) e.stopPropagation();
  },true);

  /* public helper */
  window.EssentraRouter={ go:function(route){ R.silent=0; show(normalise(route)); push(normalise(route)); } };
})();
