/* Essentra popup engine — no need to edit. Edit popups-config.js instead. */
(function(){
  'use strict';
  function LISTF(){ try{ if(typeof settings!=='undefined' && settings && Array.isArray(settings.popups)) return settings.popups; }catch(e){} return window.ESSENTRA_POPUPS || []; }
  function skey(p){ return p.id+(p.rev?':'+p.rev:''); }
  var KEY  = 'essentra_popup_seen_';
  var queue = [], showing = false, current = null, lastFocus = null;

  /* ── styles ── */
  var css = `
  .ep-overlay{position:fixed;inset:0;z-index:100000;display:flex;align-items:center;justify-content:center;padding:1rem;background:rgba(5,4,7,.78);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);opacity:0;visibility:hidden;transition:opacity .35s ease,visibility .35s}
  .ep-overlay.ep-open{opacity:1;visibility:visible}
  .ep-card{position:relative;width:100%;max-width:440px;max-height:94vh;overflow-y:auto;background:#F7F2EC;color:#111;border-radius:6px;border:1px solid #C9A882;box-shadow:0 30px 80px rgba(0,0,0,.65),0 0 0 4px rgba(201,168,130,.12);text-align:center;transform:translateY(24px) scale(.96);transition:transform .45s cubic-bezier(.2,.9,.3,1.1);scrollbar-width:none}
  .ep-card::-webkit-scrollbar{display:none}
  .ep-open .ep-card{transform:none}
  .ep-close{position:absolute;top:10px;right:10px;z-index:3;width:34px;height:34px;border-radius:50%;border:none;background:rgba(20,18,22,.85);color:#fff;font-size:15px;line-height:1;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .2s,transform .2s}
  .ep-close:hover{background:#000;transform:rotate(90deg)}
  .ep-title{font-family:'Cormorant Garant',Georgia,serif;font-weight:700;font-size:clamp(2rem,8vw,2.75rem);line-height:1.02;letter-spacing:-.01em;padding:1.7rem 3rem .5rem;color:#0D0B0F}
  .ep-title em{font-style:italic;color:#9c7a4d}
  .ep-orn{display:flex;align-items:center;justify-content:center;gap:.6rem;margin:.2rem 1.6rem .9rem;color:#C9A882}
  .ep-orn::before,.ep-orn::after{content:'';flex:1;height:1px;background:linear-gradient(90deg,transparent,#C9A882)}
  .ep-orn::after{background:linear-gradient(270deg,transparent,#C9A882)}
  .ep-img{display:block;width:100%;height:230px;object-fit:cover;object-position:center 20%;border-radius:0 0 50% 50%/0 0 26px 26px;border-bottom:2px solid #C9A882}
  .ep-sub{font-family:'Cormorant Garant',Georgia,serif;font-weight:700;font-size:clamp(1.55rem,6vw,2rem);line-height:1.1;margin:1.05rem 1.2rem .2rem;color:#0D0B0F}
  .ep-code{margin:.9rem auto .2rem;width:calc(100% - 3rem);max-width:300px}
  .ep-code-label{font-family:'Inter',sans-serif;font-size:.62rem;letter-spacing:.16em;text-transform:uppercase;color:#6b6258;margin-bottom:.4rem}
  .ep-code-box{display:flex;align-items:stretch;border:1.5px dashed #9c7a4d;background:#fff;border-radius:4px;overflow:hidden}
  .ep-code-text{flex:1;font-family:'Inter',sans-serif;font-weight:600;font-size:1.05rem;letter-spacing:.2em;padding:.7rem .5rem;color:#0D0B0F;user-select:all}
  .ep-copy{border:none;border-left:1.5px dashed #9c7a4d;background:#0D0B0F;color:#E8D5B0;font-family:'Inter',sans-serif;font-size:.68rem;letter-spacing:.12em;text-transform:uppercase;padding:0 1rem;cursor:pointer;transition:background .2s,color .2s;min-width:78px}
  .ep-copy:hover{background:#9c7a4d;color:#fff}
  .ep-copy.ep-done{background:#2f6b45;color:#fff}
  .ep-btn{display:inline-flex;align-items:center;justify-content:center;gap:.5rem;margin:1rem 0 .3rem;padding:.85rem 2.4rem;border-radius:7px;background:#0D0B0F;color:#fff;border:2px solid #C9A882;font-family:'Inter',sans-serif;font-weight:600;font-size:1.02rem;cursor:pointer;text-decoration:none;box-shadow:0 0 0 3px #0D0B0F;transition:transform .2s,background .2s}
  .ep-btn:hover{background:#000;transform:translateY(-2px)}
  .ep-note{font-family:'Inter',sans-serif;font-size:.7rem;letter-spacing:.12em;text-transform:uppercase;font-weight:600;color:#3a342d;padding:.35rem 1rem 1.3rem}
  .ep-note:empty{display:none}
  .ep-skip{display:block;margin:0 auto 1.2rem;background:none;border:none;font-family:'Inter',sans-serif;font-size:.72rem;color:#8a8178;cursor:pointer;text-decoration:underline}
  @media(max-width:480px){.ep-img{height:190px}.ep-title{padding:1.5rem 2.6rem .4rem}}
  @media(prefers-reduced-motion:reduce){.ep-overlay,.ep-card{transition:none}}
  `;
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  /* ── helpers ── */
  function today(){ var d=new Date(); return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2); }
  function getSeen(id){ try{ return JSON.parse(localStorage.getItem(KEY+id)); }catch(e){ return null; } }
  function setSeen(id){ try{ localStorage.setItem(KEY+id, JSON.stringify({t:Date.now()})); }catch(e){} }
  function sessSeen(id){ try{ return sessionStorage.getItem(KEY+id)==='1'; }catch(e){ return false; } }
  function setSess(id){ try{ sessionStorage.setItem(KEY+id,'1'); }catch(e){} }

  function hasOrdered(){
    try{
      if(typeof session!=='undefined' && session && session.type==='customer' && typeof orders!=='undefined'){
        return orders.some(function(o){ return o.customerEmail===session.email; });
      }
    }catch(e){}
    return false;
  }

  function isAdminSession(){
    try{ return !!(typeof session!=='undefined' && session && session.type==='admin'); }catch(e){ return false; }
  }
  function eligible(p, force){
    var id = skey(p);
    if(!p || p.enabled===false) return false;
    if(force) return true;
    if(isAdminSession()) return false;     // never interrupt the admin panel with shop popups
    var t = today();
    if(p.startDate && t < p.startDate) return false;
    if(p.endDate && t > p.endDate) return false;
    if(p.audience==='new' && hasOrdered()) return false;
    var f = p.frequency===undefined ? 'session' : p.frequency, seen = getSeen(id);
    if(f==='always') return true;
    if(f==='session') return !sessSeen(id);
    if(f==='once') return !seen;
    if(typeof f==='number'){
      if(sessSeen(id)) return false;
      return !seen || (Date.now()-seen.t) > f*86400000;
    }
    return true;
  }

  /* ── build + show ── */
  var overlay = document.createElement('div');
  overlay.className = 'ep-overlay'; overlay.setAttribute('role','dialog'); overlay.setAttribute('aria-modal','true');
  overlay.addEventListener('click', function(e){ if(e.target===overlay) close(); });
  document.addEventListener('keydown', function(e){ if(e.key==='Escape' && current) close(); });
  document.body.appendChild(overlay);
  try{ if(typeof window.__essentraWatch==='function') window.__essentraWatch(overlay); }catch(e){}

  function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }

  function render(p){
    var h = '<div class="ep-card">'
      + '<button class="ep-close" aria-label="Close">✕</button>'
      + '<div class="ep-title">'+(p.title||'')+'</div>'
      + '<div class="ep-orn"><svg width="22" height="10" viewBox="0 0 22 10" fill="currentColor"><path d="M11 0l2.2 5L11 10 8.8 5zM0 5l6-1.2v2.4zM22 5l-6-1.2v2.4z"/></svg></div>'
      + (p.image ? '<img class="ep-img" src="'+esc(p.image)+'" alt="'+esc(p.imageAlt||'Special offer')+'"/>' : '')
      + (p.subtitle ? '<div class="ep-sub">'+p.subtitle+'</div>' : '')
      + (p.code ? '<div class="ep-code">'+(p.codeLabel?'<div class="ep-code-label">'+esc(p.codeLabel)+'</div>':'')
          + '<div class="ep-code-box"><div class="ep-code-text">'+esc(p.code)+'</div><button class="ep-copy" type="button">Copy</button></div></div>' : '')
      + '<button class="ep-btn" type="button">'+esc(p.buttonText||'Shop Now')+' <span aria-hidden="true">›</span></button>'
      + '<div class="ep-note">'+(p.footnote?esc(p.footnote):'')+'</div>'
      + '</div>';
    overlay.innerHTML = h;
    overlay.querySelector('.ep-close').onclick = close;
    var cp = overlay.querySelector('.ep-copy');
    if(cp) cp.onclick = function(){ copyCode(p.code, cp); };
    overlay.querySelector('.ep-btn').onclick = function(){ act(p); };
  }

  function copyCode(code, btn){
    function done(){
      try{ sessionStorage.setItem('essentra_pending_coupon', code); }catch(e){}
      btn.textContent='Copied ✓'; btn.classList.add('ep-done');
      setTimeout(function(){ btn.textContent='Copy'; btn.classList.remove('ep-done'); },2200);
    }
    if(navigator.clipboard && window.isSecureContext){ navigator.clipboard.writeText(code).then(done,fallback); }
    else fallback();
    function fallback(){
      var ta=document.createElement('textarea'); ta.value=code; ta.style.position='fixed'; ta.style.opacity='0';
      document.body.appendChild(ta); ta.select(); try{document.execCommand('copy');}catch(e){} document.body.removeChild(ta); done();
    }
  }

  function act(p){
    if(p.code){ try{ sessionStorage.setItem('essentra_pending_coupon', p.code); }catch(e){} }
    var a = p.buttonAction || 'close';
    close();
    if(a==='collection' && typeof showCollectionPage==='function'){ showCollectionPage(); }
    else if(a==='link' && p.buttonLink){ window.location.href = p.buttonLink; }
  }

  /* never show offers over the login / create-account / membership screens */
  function authBusy(){
    try{
      return ['authOverlay','membershipOverlay'].some(function(id){
        var el=document.getElementById(id); return !!(el && el.classList.contains('open'));
      });
    }catch(e){ return false; }
  }

  function open(p){
    if(!p._preview && authBusy()) return;
    showing = true; current = p; lastFocus = document.activeElement;
    render(p);
    requestAnimationFrame(function(){ overlay.classList.add('ep-open'); });
    document.body.style.overflow='hidden';
    if(!p._preview){ setSeen(skey(p)); setSess(skey(p)); }
    var c = overlay.querySelector('.ep-close'); if(c) c.focus();
  }

  function close(){
    overlay.classList.remove('ep-open');
    var busy = authBusy();
    if(!busy) document.body.style.overflow='';
    current = null;
    if(!busy && lastFocus && lastFocus.focus){ try{lastFocus.focus();}catch(e){} }
    setTimeout(function(){ showing=false; next(); }, 450);
  }

  function next(){
    if(showing) return;
    var p = queue.shift(); if(!p) return;
    setTimeout(function(){ if(!showing) open(p); }, (queue.length||p._chained) ? 600 : 0);
  }

  /* ── schedule ── */
  function ready(fn){
    var tries=0;
    (function wait(){
      var pl=document.getElementById('preloader');
      if((!pl || pl.classList.contains('hide') || pl.style.display==='none' || tries>40)) return fn();
      tries++; setTimeout(wait,150);
    })();
  }

  var scheduled=false;
  function schedule(){
    if(scheduled) return; scheduled=true;
    var LIST = LISTF();
    var params = new URLSearchParams(location.search), test = params.get('popup');
    LIST.forEach(function(p, i){
      if(test){ if(p.id!==test) return; }   // ?popup=welcome10 forces a popup for testing
      else if(!eligible(p)) return;
      var delay = (test ? 0.5 : (Number(p.delaySeconds)||0)) * 1000;
      setTimeout(function(){
        ready(function(){ if(isAdminSession()) return; if(showing){ p._chained=true; queue.push(p); } else open(p); });
      }, delay);
    });
  }

  /* ── prefill coupon at checkout after copying / clicking ── */
  var _oc = window.openCheckout;
  if(typeof _oc==='function'){
    window.openCheckout = function(){
      var r = _oc.apply(this, arguments);
      try{
        var code = sessionStorage.getItem('essentra_pending_coupon'), el = document.getElementById('co-couponCode');
        if(code && el && !el.value) el.value = code;
      }catch(e){}
      return r;
    };
  }

  /* ── public helpers (use in console or from any button) ──
     EssentraPopup.open('bundle-offer')   → show a popup now
     EssentraPopup.reset()                → forget "already seen" (for testing)   */
  window.EssentraPopup = {
    preview: function(p){ var c=JSON.parse(JSON.stringify(p)); c._preview=true; if(showing){ close(); setTimeout(function(){open(c);},500);} else open(c); },
    open: function(id){ var p=LISTF().filter(function(x){return x.id===id;})[0]; if(p){ if(showing) close(); setTimeout(function(){open(p);}, showing?500:0); } },
    reset: function(){ Object.keys(localStorage).forEach(function(k){ if(k.indexOf(KEY)===0) localStorage.removeItem(k); }); try{Object.keys(sessionStorage).forEach(function(k){ if(k.indexOf(KEY)===0) sessionStorage.removeItem(k); });}catch(e){} }
  };

  /* if the visitor opens login / sign-up while an offer is on screen, close it */
  ['authOverlay','membershipOverlay'].forEach(function(id){
    var el=document.getElementById(id); if(!el || !window.MutationObserver) return;
    new MutationObserver(function(){ if(authBusy() && showing && current && !current._preview){ queue.length=0; close(); } })
      .observe(el,{attributes:true,attributeFilter:['class']});
  });

  var loaded = document.readyState==='complete', cloud=false;
  function go(){ if(loaded && cloud) schedule(); }
  if(!loaded) window.addEventListener('load', function(){ loaded=true; go(); });
  window.addEventListener('essentra:ready', function(){ cloud=true; go(); });
  setTimeout(function(){ cloud=true; go(); }, 4500); // fallback if cloud is slow
})();
