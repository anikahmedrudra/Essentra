/* Essentra — stability layer: scroll lock, Escape-to-close, bfcache & preloader safety */
(function(){
  'use strict';
  var OPEN = '#contactOverlay.open,#authOverlay.open,#membershipOverlay.open,#reviewOverlay.open,#productModal.open,'+
             '#checkoutOverlay.open,#customerDetailModal.open,#cartSidebar.open,.search-overlay.open,.ep-open';
  var raf = 0;

  /* One source of truth for page scroll: locked only while something is open. */
  function reconcile(){
    raf = 0;
    var locked = !!document.querySelector(OPEN) || document.body.classList.contains('no-scroll');
    var want = locked ? 'hidden' : '';
    if(document.body.style.overflow !== want) document.body.style.overflow = want;
  }
  function schedule(){ if(!raf) raf = requestAnimationFrame(reconcile); }

  function init(){
    new MutationObserver(function(m){
      for(var i=0;i<m.length;i++){
        var t = m[i].target;
        if(t === document.body || (t.matches && (t.matches('.modal-overlay,.search-overlay,.cart-sidebar,.checkout-overlay,[class*="overlay"],[class*="modal"],[id$="Overlay"],[id$="Modal"]')))){ schedule(); return; }
      }
    }).observe(document.body,{attributes:true,subtree:true,attributeFilter:['class','style']});
    schedule();
  }
  if(document.body) init(); else document.addEventListener('DOMContentLoaded',init);

  /* Escape closes the topmost open layer, one per key press. */
  var stack = [
    ['.ep-open',            function(){ var b=document.querySelector('.ep-close'); if(b) b.click(); }],
    ['#productModal.open',  function(){ closeModal(); }],
    ['#reviewOverlay.open', function(){ closeReviewModal(); }],
    ['#customerDetailModal.open', function(){ closeCustomerDetail(); }],
    ['#authOverlay.open',   function(){ closeAuthOverlay(); }],
    ['#membershipOverlay.open', function(){ closeMembershipGate(); }],
    ['#checkoutOverlay.open', function(){ closeCheckout(); }],
    ['#contactOverlay.open',function(){ closeContactOverlay(); }],
    ['#trackOverlay.open',  function(){ closeTrackOverlay(); }],
    ['.search-overlay.open',function(){ closeSearchOverlay(); }],
    ['#cartSidebar.open',   function(){ document.getElementById('cartSidebar').classList.remove('open'); }]
  ];
  document.addEventListener('keydown',function(e){
    if(e.key!=='Escape') return;
    for(var i=0;i<stack.length;i++){
      if(document.querySelector(stack[i][0])){ try{ stack[i][1](); }catch(err){ console.warn(err); } schedule(); return; }
    }
  });

  /* Back/forward cache or tab restore must never leave the page frozen. */
  window.addEventListener('pageshow',function(){ schedule(); var p=document.getElementById('preloader'); if(p) p.classList.add('hide'); });
  document.addEventListener('visibilitychange',function(){ if(!document.hidden) schedule(); });

  /* Preloader can never trap the screen. */
  setTimeout(function(){ var p=document.getElementById('preloader'); if(p) p.classList.add('hide'); },2000);
})();
