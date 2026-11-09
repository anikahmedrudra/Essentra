// ── CONFIG ──────────────────────────────────────────────────────────────────
const TYPE_LABELS = {edp:'Eau de Parfum',edt:'Eau de Toilette',parfum:'Parfum / Extrait',edc:'Eau de Cologne'};
const MASTER_BRANDS = ["Abdul Samad Al Qurashi","Acqua di Parma","Afnan","Ahmed Al Maghribi","Ajmal","Al Haramain","Al Wataniah","Alexandre.J","Amouage","Arabian Oud","Arabiyat Prestige","Ard Al Zaafaran","Ariana Grande","Armaf","Aromatix","Asdaaf","Atralia","Azzaro","Bentley","Bharara","Brandy","Burberry","Bvlgari","Byredo","Calvin Klein","Carolina Herrera","Cartier","Chanel","Chloé","Clive Christian","Creed","Davidoff","Dior","Dolce & Gabbana","Elie Saab","Emper","Estée Lauder","Ferrari","Fragrance World","French Avenue","Giorgio Armani","Givenchy","Gucci","Guerlain","Gulf Orchid","Hermès","Hind Al Oud","Hugo Boss","Ibraheem Al Qurashi","Initio","Issey Miyake","Jean Paul Gaultier","Jimmy Choo","Jo Malone","Kayaan","Kayali","KENZO","Khadlaj","Kilian","Lacoste","Lancôme","Lattafa","Le Labo","Louis Vuitton","Maison Alhambra","Maison Asrar","Maison Francis Kurkdjian","Mancera","Montale","Montblanc","Moschino","Mugler","Mykonos","Narciso Rodriguez","Nasomatto","Nautica","Nishane","Nusuk","Orientica","Paco Rabanne","Parfums de Marly","Paris Corner","Penhaligon's","Police","Prada","Raayhan","Ralph Lauren","Rasasi","Rayhaan","Riffs","Roja Parfums","Surrati","Swiss Arabian","Tiziana Terenzi","Tom Ford","Valentino","Versace","Victor & Rolf","Xerjoff","Yves Saint Laurent","Zimaya","Others"];
const CATEGORY_IMAGES = {
  "Men": "images/img1.jpg",
  "Unisex": "images/img2.jpg",
  "Women": "images/img3.jpg"
};
const SHOP_CATEGORIES = ["Men","Unisex","Women"];
const CATEGORY_IMAGE_SWAP = {"Men":"Unisex","Unisex":"Men"};
let testimonialIndex = 0;
const BOTTLE_SVG = `<svg width="70" height="115" viewBox="0 0 80 130" fill="none"><rect x="34" y="4" width="12" height="5" rx="1" fill="#C9A882" opacity=".5"/><rect x="35" y="9" width="10" height="12" rx="1" fill="#C9A882" opacity=".4"/><path d="M28 24 L52 24 L55 114 Q55 118 51 118 L29 118 Q25 118 25 114 Z" fill="url(#bs)" opacity=".65"/><defs><linearGradient id="bs" x1="25" y1="24" x2="55" y2="118" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="#3d3650"/><stop offset="100%" stop-color="#1a1720"/></linearGradient></defs></svg>`;

const ATOMIZER_SVG=`<svg width="34" height="54" viewBox="0 0 40 64" fill="none" aria-hidden="true"><rect x="15" y="2" width="10" height="6" rx="1.5" fill="#C9A882" opacity=".7"/><rect x="17" y="8" width="6" height="8" rx="1" fill="#C9A882" opacity=".5"/><rect x="9" y="16" width="22" height="44" rx="5" fill="#2a2536" stroke="#C9A882" stroke-opacity=".6"/><rect x="13" y="26" width="14" height="26" rx="2" fill="#C9A882" opacity=".18"/></svg>`;

// ── STATE ───────────────────────────────────────────────────────────────────
// Fresh start: wipe any old/corrupted product catalogue from previous versions
const DATA_VERSION = 'v3-fresh';
if(load('essentra_data_version') !== DATA_VERSION){
  localStorage.removeItem('essentra_products');
  save('essentra_data_version', DATA_VERSION);
}
let products = (load('essentra_products') || []).filter(p=>p && p.sizes && p.sizes.length).map(p=>{
  // Migrate legacy single product-level stock into a per-size stock figure
  let legacyStock=null;
  if(p.stock==='no'){ legacyStock=0; }
  else if(p.stock==='yes' || p.stock===undefined || p.stock===null || p.stock===''){ legacyStock=null; }
  else { legacyStock=parseInt(p.stock)||0; }
  p.sizes=(p.sizes||[]).map(s=>({
    ml:s.ml, price:s.price,
    stock:(s.stock!==undefined && s.stock!==null && s.stock!=='') ? (parseInt(s.stock)||0) : (legacyStock!==null?legacyStock:50)
  }));
  delete p.stock;
  return p;
});
function productTotalStock(p){ return (p.sizes||[]).reduce((s,x)=>s+(Number(x.stock)||0),0); }
function productInStock(p){ return productTotalStock(p)>0; }
function sizeStock(p,idx){ return (p.sizes && p.sizes[idx]) ? (Number(p.sizes[idx].stock)||0) : 0; }
function cartKey(){
  const s=load('essentra_session');
  if(s && s.type==='customer' && s.email) return 'essentra_cart_'+s.email;
  if(s && s.type==='admin') return 'essentra_cart_admin';
  return 'essentra_cart';
}
function saveCart(){ save(cartKey(),cart); }
let cart     = load(cartKey())     || [];
// call after login / register / logout so each account sees only its own cart
function switchCart(mergeGuest){
  const guest=load('essentra_cart')||[];
  cart=load(cartKey())||[];
  if(mergeGuest && cartKey()!=='essentra_cart' && !(session&&session.type==='admin')){
    guest.forEach(g=>{ const ex=cart.find(i=>i.key===g.key); if(ex) ex.qty+=g.qty; else cart.push(g); });
    if(guest.length){ save('essentra_cart',[]); saveCart(); }
  }
  appliedCoupon=null; appliedPoints=0;
  if(typeof renderCart==='function') renderCart();
}
let orders   = load('essentra_orders')   || [];
let coupons  = load('essentra_coupons')  || [];
let reviews  = load('essentra_reviews')  || [];
let appliedCoupon = null;
let appliedPoints = 0;
let settings = load('essentra_settings') || {siteName:'Essentra',bkash:'',nagad:'',rocket:'',phone:'',email:'',address:'',facebook:'',whatsapp:'',instagram:'',deliveryInside:80,deliveryOutside:140,freeabove:0,pointsMinSpend:500,pointsPerAmount:100,pointsValue:1};
if(settings.pointsMinSpend===undefined) settings.pointsMinSpend=500;
if(settings.pointsPerAmount===undefined) settings.pointsPerAmount=100;
if(settings.pointsValue===undefined) settings.pointsValue=1;

// Per-product discount: each product carries its own `discount` (% off, set by the admin). No site-wide discount.
function productDiscountPct(p){ const n=Number(p&&p.discount); return (n>0&&n<=100)?n:0; }
function getDiscountedPrice(price,p){
  const pct=productDiscountPct(p);
  if(pct<=0) return Math.round(price||0);
  return Math.round((price||0)*(100-pct)/100);
}
function priceHTML(price,mlLabel,p){
  const pct=productDiscountPct(p);
  const orig=price||0;
  if(pct>0){
    const disc=getDiscountedPrice(orig,p);
    return `৳${disc.toLocaleString()} <span style="text-decoration:line-through;color:var(--muted);font-size:.75rem;font-weight:400">৳${orig.toLocaleString()}</span>${mlLabel?` <span>/ ${mlLabel}ml</span>`:''}`;
  }
  return `৳ ${orig.toLocaleString()}${mlLabel?` <span>/ ${mlLabel}ml</span>`:''}`;
}
// "X% OFF" tag shown at the top-left of a product image (card + modal)
function discountBadgeHTML(p){
  const pct=productDiscountPct(p);
  return pct>0?`<div class="disc-badge">${+pct.toFixed(2)}% OFF</div>`:'';
}
// ── PREMIUM ATOMIZERS ────────────────────────────────────────────────────────
// Optional paid extras configured by the admin (settings.atomizers = [{id,ml,price,photo,active}]).
// They are NEVER discounted: no site-wide %, no coupon, no points redemption applies to them.
function getAtomizers(){ return Array.isArray(settings.atomizers)?settings.atomizers:[]; }
function getAtomizerForMl(ml){
  return getAtomizers().find(a=>a && a.active!==false && String(a.ml)===String(ml) && a.price!==''&&a.price!==null&&a.price!==undefined && Number(a.price)>=0) || null;
}
// Cart total WITHOUT atomizer lines — the only part discounts/coupons/points may touch
function cartMerchSubtotal(){ return cart.reduce((s,i)=>i.atomizer?s:s+i.price*i.qty,0); }
// Keep atomizer lines in sync with the admin's live list; returns true if one was removed or re-priced
function refreshAtomizerLines(){
  let changed=false;
  cart=cart.filter(i=>{
    if(!i.atomizer) return true;
    const a=getAtomizers().find(x=>x && String(x.id)===String(i.atomizerId) && x.active!==false && String(x.ml)===String(i.ml));
    if(!a){ changed=true; return false; }
    const price=Math.round(Number(a.price)||0);
    if(i.price!==price){ i.price=price; changed=true; }
    i.photo=a.photo||null;
    return true;
  });
  if(changed) saveCart();
  return changed;
}
// Re-price perfume lines from the live product (covers old carts and admin discount changes); true if any price moved
function refreshCartPrices(){
  let changed=false;
  cart.forEach(i=>{
    if(i.atomizer) return;
    const prod=products.find(pr=>pr.id===i.id);
    const size=prod && prod.sizes ? prod.sizes.find(s=>String(s.ml)===String(i.ml)) : null;
    if(!size) return;
    const np=getDiscountedPrice(size.price,prod);
    if(i.price!==np){ i.price=np; changed=true; }
  });
  if(changed) saveCart();
  return changed;
}
let users    = load('essentra_users')    || [];
let monthlyTarget = load('essentra_monthly_target') || null; // null = auto-calculated
let session  = load('essentra_session')  || null; // {type:'customer'|'admin', email, name}
let adminCreds = load('essentra_admin_creds') || {username:'admin', password: (localStorage.getItem('essentra_admin_pass')||'essentra2025')};
if(!adminCreds.name) adminCreds.name='Administrator';
let selectedSizes = {};
let currentModalProduct = null;
let currentModalSizeIdx = 0;
let modalAtomizerOn = false;
let uploadedPhoto = null;
let selectedPayment = 'bkash';
let editingProductId = null;
let collectionStockFilter = 'all';
let selectedBrands = [];
let selectedCategories = [];
let selectedSeasons = [];
let shopSearchQuery = '';
let shopSortMode = 'default';
let shopPriceMin = 0;
let shopPriceMax = 10000;
let brandShowAll = false;
const SHOP_SEASONS = ["Summer","Spring","Autumn","Winter"];
const BRAND_COLLAPSED_COUNT = 5;
// Promo constants must be declared before INIT (loadSettings uses them)
const PROMO_ICON='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41 11 3.83A2 2 0 0 0 9.59 3.24L4 3a1 1 0 0 0-1 1l.24 5.59a2 2 0 0 0 .59 1.41l9.58 9.59a2 2 0 0 0 2.83 0l4.35-4.35a2 2 0 0 0 0-2.83Z"/><circle cx="7.5" cy="7.5" r="1.5"/></svg>';
const PROMO_INTERVAL=2500; // default (ms)

function load(k){ try{return JSON.parse(localStorage.getItem(k))}catch{return null} }
let storageWarned=false;
function save(k,v){
  // Never let a full / blocked browser storage crash the action that called us
  // (this used to abort "Add to Collection" half-way: no toast, no form reset).
  try{ localStorage.setItem(k,JSON.stringify(v)); return true; }
  catch(e){
    console.warn('localStorage save failed for '+k, e);
    if(!storageWarned){
      storageWarned=true;
      setTimeout(()=>{ try{ showToast('⚠ Browser storage is full — changes are kept online only. Use smaller photos.','error'); }catch(_){} storageWarned=false; },300);
    }
    return false;
  }
}
const RECENT_KEY_GUEST='essentra_recent_guest', RECENT_MAX=8;
try{ localStorage.removeItem('essentra_recent'); }catch(e){}  // old shared key (mixed admin + customer history)

// ── SUPABASE SYNC ────────────────────────────────────────────────────────────
// `sb` comes from supabase-config.js. If it's not configured, every function
// below quietly no-ops and the site behaves exactly like the old localStorage
// version — so nothing breaks even before you fill in your project keys.
let cloudReadyResolve; const cloudReady=new Promise(r=>{cloudReadyResolve=r;});
const cloudOK={}, cloudErr={}, cloudSnap={};
function cloudFail(label, err){
  const msg=(err&&err.message)||String(err||'unknown error');
  console.error('Supabase '+label+' failed:', err);
  try{ showToast('⚠ Cloud save failed ('+label+'): '+msg); }catch(e){}
}
async function syncTable(table, getArr, getId){
  if(!sb) return;
  await cloudReady;
  const arr=getArr();   // read the CURRENT list after cloud load, never a stale copy
  if(!cloudOK[table]){ cloudFail(table, cloudErr[table]||'table not reachable — run schema.sql in Supabase'); return; }
  try{
    const snap=cloudSnap[table]||(cloudSnap[table]={});
    const ids=new Set(), rows=[];
    arr.forEach(item=>{
      const id=String(getId(item)); ids.add(id);
      const js=JSON.stringify(item);
      if(snap[id]!==js) rows.push({id:id,data:item,js:js});
    });
    if(rows.length){
      const {error}=await sb.from(table).upsert(rows.map(r=>({id:r.id,data:r.data})));
      if(error) throw error;
      rows.forEach(r=>{ snap[r.id]=r.js; });
    }
    const gone=Object.keys(snap).filter(id=>!ids.has(id));
    if(gone.length){
      const {error}=await sb.from(table).delete().in('id',gone);
      if(error) throw error;
      gone.forEach(id=>{ delete snap[id]; });
    }
  }catch(e){ cloudFail(table,e); }
}
function getSeasons(p){ const s=p&&p.season; if(Array.isArray(s)) return s.filter(Boolean); return s&&s!=='All Seasons'?[s]:[]; }
function getCats(p){ return Array.isArray(p.categories)&&p.categories.length ? p.categories : [p.category||'Unisex']; }
function getSelectedProdCategories(){ return [...document.querySelectorAll('#prodCategoryGroup input:checked')].map(i=>i.value); }
function setProdCategories(arr){ document.querySelectorAll('#prodCategoryGroup input').forEach(i=>{ i.checked=arr.includes(i.value); }); }
function getSelectedProdSeasons(){ return [...document.querySelectorAll('#prodSeasonGroup input:checked')].map(i=>i.value); }
function setProdSeasons(arr){ document.querySelectorAll('#prodSeasonGroup input').forEach(i=>{ i.checked=arr.includes(i.value); }); }
function syncProducts(){ save('essentra_products',products); syncTable('products',()=>products,p=>p.id); }
function syncOrders(){ save('essentra_orders',orders); syncTable('orders',()=>orders,o=>o.id); }
function syncReviews(){ save('essentra_reviews',reviews); syncTable('reviews',()=>reviews,r=>r.id); }
function syncCouponsCloud(){ save('essentra_coupons',coupons); syncTable('coupons',()=>coupons,c=>c.code); }
function syncUsersCloud(){ save('essentra_users',users); syncTable('users',()=>users,u=>normEmail(u.email)); }
async function syncSettingsCloud(){
  save('essentra_settings',settings);
  if(!sb) return;
  await cloudReady;
  if(!cloudOK.settings){ cloudFail('settings', cloudErr.settings||'table not reachable — run schema.sql in Supabase'); return; }
  try{
    const {error}=await sb.from('settings').upsert({id:'main',data:settings});
    if(error) throw error;
  }catch(e){ cloudFail('settings',e); }
}
async function syncAdminCredsCloud(){
  save('essentra_admin_creds',adminCreds);
  if(!sb) return;
  await cloudReady;
  if(!cloudOK.admin_creds){ cloudFail('admin', cloudErr.admin_creds||'table not reachable — run schema.sql in Supabase'); return; }
  try{
    const {error}=await sb.from('admin_creds').upsert({id:'main',data:adminCreds});
    if(error) throw error;
  }catch(e){ cloudFail('admin',e); }
}
async function cloudInit(){
  if(!sb){ cloudReadyResolve(); return; }
  const push=[];
  try{
    const names=['products','orders','coupons','users','reviews'];
    const res=await Promise.all([
      ...names.map(n=>sb.from(n).select('id,data')),
      sb.from('settings').select('data').eq('id','main').maybeSingle(),
      sb.from('admin_creds').select('data').eq('id','main').maybeSingle()
    ]);
    const local={products:products,orders:orders,coupons:coupons,users:users,reviews:reviews};
    names.forEach((n,i)=>{
      const r=res[i];
      if(r.error){ cloudOK[n]=false; cloudErr[n]=r.error; console.warn('Supabase read failed: '+n, r.error); return; }
      cloudOK[n]=true;
      const rows=r.data||[];
      cloudSnap[n]={}; rows.forEach(x=>{ cloudSnap[n][String(x.id)]=JSON.stringify(x.data); });
      const seedKey='essentra_cloud_seeded_'+n;
      if(rows.length){ local[n]=rows.map(x=>x.data); }
      else if(!load(seedKey) && local[n] && local[n].length){ push.push(n); }   // first-time upload of existing local data
      save(seedKey,true);
    });
    local.products=(local.products||[]).slice().sort((a,b)=>(Number(b.id)||0)-(Number(a.id)||0));   // DB returns rows unordered — newest first
    products=local.products; orders=local.orders; coupons=local.coupons; users=local.users; reviews=local.reviews;
    save('essentra_products',products); save('essentra_orders',orders); save('essentra_coupons',coupons); save('essentra_users',users); save('essentra_reviews',reviews);
    const sRes=res[5], aRes=res[6];
    if(sRes.error){ cloudOK.settings=false; cloudErr.settings=sRes.error; console.warn('Supabase read failed: settings', sRes.error); }
    else{
      cloudOK.settings=true;
      if(sRes.data && sRes.data.data){ settings=Object.assign({pointsMinSpend:500,pointsPerAmount:100,pointsValue:1},sRes.data.data); save('essentra_settings',settings); }
      else if(!load('essentra_cloud_seeded_settings')) push.push('settings');
      save('essentra_cloud_seeded_settings',true);
      if(settings.monthlyTarget!==undefined) monthlyTarget=settings.monthlyTarget||null;
    }
    if(aRes.error){ cloudOK.admin_creds=false; cloudErr.admin_creds=aRes.error; console.warn('Supabase read failed: admin_creds', aRes.error); }
    else{
      cloudOK.admin_creds=true;
      if(aRes.data && aRes.data.data){ adminCreds=aRes.data.data; if(!adminCreds.name) adminCreds.name='Administrator'; save('essentra_admin_creds',adminCreds); }
      else if(!load('essentra_cloud_seeded_admin')) push.push('admin');
      save('essentra_cloud_seeded_admin',true);
    }
    const failed=Object.keys(cloudOK).filter(k=>!cloudOK[k]);
    if(failed.length){ try{ showToast('⚠ Database not ready ('+failed.join(', ')+'). Run schema.sql in Supabase.'); }catch(e){} }
  }catch(e){ console.warn('Cloud init failed, staying on local data', e); }
  finally{ cloudReadyResolve(); }
  // push any first-time local data up
  push.forEach(n=>{
    if(n==='products') syncProducts(); else if(n==='orders') syncOrders(); else if(n==='coupons') syncCouponsCloud();
    else if(n==='users') syncUsersCloud(); else if(n==='reviews') syncReviews();
    else if(n==='settings') syncSettingsCloud(); else if(n==='admin') syncAdminCredsCloud();
  });
  ensureWelcomeCoupon();
  // re-render everything now that fresh cloud data is in
  renderProducts(); renderCollection(); renderCart(); loadSettings(); updateOrderBadge(); renderTestimonials(); updateReviewBadge();
  applyBranding(); updateContactInfo(); updatePromoBanner(); updateDeliveryZoneLabels(); updatePointsRuleBox();
  if(typeof renderReviews==='function') renderReviews();
  updatePaymentInstructions(); updateNavAccountUI(); updateWishlistBadge();
  if(typeof renderManageGrid==='function') renderManageGrid();
  if(typeof renderInventory==='function') renderInventory();
  if(typeof renderOrders==='function') renderOrders();
  if(typeof renderDashboard==='function') renderDashboard();
  if(typeof renderCoupons==='function') renderCoupons();
  if(typeof renderMyOrders==='function' && session && session.type==='customer') renderMyOrders();
}

// ── SCROLL-REVEAL ANIMATION SYSTEM ─────────────────────────────────────────
const revealObserver = ('IntersectionObserver' in window) ? new IntersectionObserver((entries)=>{
  entries.forEach(entry=>{
    if(entry.isIntersecting){
      entry.target.classList.add('in');
      revealObserver.unobserve(entry.target);
    }
  });
},{threshold:0.12,rootMargin:'0px 0px -40px 0px'}) : null;

function observeReveals(root){
  const scope = root || document;
  const els = scope.querySelectorAll('.reveal:not(.in), .reveal-scale:not(.in)');
  if(!revealObserver){
    els.forEach(el=>el.classList.add('in'));
    return;
  }
  els.forEach(el=>revealObserver.observe(el));
}

// ── INIT ────────────────────────────────────────────────────────────────────
populateBrandSelect();
renderProducts();
renderTestimonials();
renderCollection();
renderCart();
loadSettings();
updateOrderBadge();
updateReviewBadge();
updatePaymentInstructions();
updateNavAccountUI();
updateWishlistBadge();
setActiveNavLink('navLinkHome');
observeReveals();
ensureWelcomeCoupon();
/* start cloud sync after first paint so it never blocks the hero */
requestAnimationFrame(()=>setTimeout(()=>{ Promise.resolve(cloudInit()).finally(()=>window.dispatchEvent(new Event('essentra:ready'))); },0));
function scrollToSection(id){ document.getElementById(id).scrollIntoView({behavior:'smooth'}) }
function getAllBrands(){
  const set=new Map();
  MASTER_BRANDS.forEach(b=>{ if(b && b!=='Others') set.set(b.toLowerCase(),b); });
  (Array.isArray(products)?products:[]).forEach(p=>{ const b=(p&&p.brand||'').trim(); if(b && b!=='Others' && !set.has(b.toLowerCase())) set.set(b.toLowerCase(),b); });
  const list=[...set.values()].sort((a,b)=>a.localeCompare(b,'en',{sensitivity:'base'}));
  list.push('Others');
  return list;
}
function populateBrandSelect(){
  const sel=document.getElementById('prodBrand');
  if(!sel) return;
  const cur=sel.value; sel.innerHTML=getAllBrands().map(b=>`<option value="${b.replace(/"/g,'&quot;')}">${b}</option>`).join('');
  if(cur && [...sel.options].some(o=>o.value===cur)) sel.value=cur;
}
function openSearchOverlay(){
  const overlay=document.getElementById('searchOverlay');
  overlay.classList.add('open');
  const input=document.getElementById('searchOverlayInput');
  input.value='';
  setTimeout(()=>input.focus(),50);
}
function closeSearchOverlay(){
  document.getElementById('searchOverlay').classList.remove('open');
  document.getElementById('searchOverlayInput').value='';
  const sr=document.getElementById('searchResults'); if(sr){ sr.classList.remove('show'); sr.innerHTML=''; }
}
function openContactOverlay(){
  document.getElementById('contact').style.display='block';
  document.getElementById('contactOverlay').classList.add('open');
}
function closeContactOverlay(){
  document.getElementById('contactOverlay').classList.remove('open');
}
function liveSearch(val){
  const box=document.getElementById('searchResults'); if(!box) return;
  const q=(val||'').trim().toLowerCase();
  if(!q){ box.classList.remove('show'); box.innerHTML=''; return; }
  const words=q.split(/\s+/);
  const hits=products.filter(p=>{
    const hay=[p.name,p.brand].concat(getCats(p)).concat([p.gender]).concat(Array.isArray(p.accords)?p.accords:[]).join(' ').toLowerCase();
    return words.every(w=>hay.includes(w));
  });
  box.classList.add('show');
  if(!hits.length){ box.innerHTML='<div class="search-result-empty">No products found.</div>'; return; }
  box.innerHTML=hits.slice(0,6).map(p=>{
    const prices=(p.sizes||[]).map(s=>Number(getDiscountedPrice(s.price,p))).filter(n=>n>0);
    const from=prices.length?'৳ '+Math.min(...prices).toLocaleString():'';
    return `<div class="search-result-item" onclick="openSearchResult(${p.id})">
      <div class="search-result-img">${p.photo?`<img src="${p.photo}" alt=""/>`:'🧴'}</div>
      <div class="search-result-info"><div class="search-result-brand">${esc(p.brand||'')}</div><div class="search-result-name">${esc(p.name||'')}</div></div>
      <div class="search-result-price">${from}</div></div>`;
  }).join('')+(hits.length>6?`<div class="search-result-all" onclick="doNavSearch()">See all ${hits.length} results</div>`:'');
}
function openSearchResult(id){
  closeSearchOverlay();
  openModal(id);
}
function doNavSearch(){
  const input=document.getElementById('searchOverlayInput');
  const q=input.value.trim();
  input.value='';
  shopSearchQuery=q;
  closeSearchOverlay();
  showCollectionPage();
}
function setActiveNavLink(id){
  document.querySelectorAll('.nav-links a').forEach(a=>a.classList.remove('active'));
  const el=document.getElementById(id);
  if(el) el.classList.add('active');
}
function hideAllMainPages(){
  ['homePage','collectionPage','accountPage','scentFinderPage','policyPage_privacy','policyPage_terms','policyPage_return','policyPage_shipping','about','contact'].forEach(id=>{
    const el=document.getElementById(id); if(el) el.style.display='none';
  });
  document.getElementById('admin').style.display='none';
  document.querySelectorAll('.nav-links a.active').forEach(a=>a.classList.remove('active'));
  closeAuthOverlay();
  closeSearchOverlay();
  closeContactOverlay();
}
function animatePageIn(el){
  if(!el) return;
  el.classList.remove('page-fade-in');
  void el.offsetWidth;
  el.classList.add('page-fade-in');
}
function showCollectionPage(){
  hideAllMainPages();
  const el=document.getElementById('collectionPage');
  el.style.display='block';
  animatePageIn(el);
  renderCollection();
  setActiveNavLink('navLinkCollection');
  window.scrollTo({top:0,left:0,behavior:'instant'});
}
function showHomePage(){
  hideAllMainPages();
  const home=document.getElementById('homePage');
  const _wasHidden=home.style.display==='none';
  home.style.display='block';
  if(_wasHidden) window.scrollTo({top:0,left:0,behavior:'instant'});
  animatePageIn(home);
  document.getElementById('about').style.display='block';
  document.getElementById('contact').style.display='block';
  setActiveNavLink('navLinkHome');
  setTimeout(updateNavScrollSpy,60);
}
function showAuthPage(){ openAuthOverlay(); }
function openAuthOverlay(){
  document.getElementById('authOverlay').classList.add('open');
  switchAuthTab('login');
  setAuthNotice('loginNotice','');
  pwResetAll();
  clearAuthFields();
  document.body.style.overflow='hidden';
}
let checkoutAuthPending=false;
function openMembershipGate(){
  checkoutAuthPending=true;
  document.getElementById('membershipOverlay').classList.add('open');
  document.body.style.overflow='hidden';
}
function closeMembershipGate(){
  document.getElementById('membershipOverlay').classList.remove('open');
  if(!document.getElementById('authOverlay').classList.contains('open')) document.body.style.overflow='';
}
function openMembershipAuth(tab){
  closeMembershipGate();
  openAuthOverlay();
  switchAuthTab(tab);
}
function setAuthButtonLoading(id, loading, label){
  const btn=document.getElementById(id); if(!btn) return;
  if(loading){ btn.dataset.label=btn.textContent; btn.textContent=label; btn.classList.add('is-loading'); btn.disabled=true; }
  else { btn.textContent=btn.dataset.label||btn.textContent; btn.classList.remove('is-loading'); btn.disabled=false; }
}
async function getMembershipCustomer(){
  if(!sb) return null;
  const {data:{session:authSession}}=await sb.auth.getSession();
  if(!authSession) return null;
  const {data:profile,error}=await sb.from('customer_profiles').select('id,full_name,username,email,phone_normalized,created_at').maybeSingle();
  if(error || !profile) return null;
  return {authSession,profile};
}
async function completeCustomerAuthentication(){
  const member=await getMembershipCustomer();
  if(!member) throw new Error('Your account could not be verified. Please try again.');
  const p=member.profile;
  const found=users.find(u=>normEmail(u.email)===normEmail(p.email));
  if(found){ Object.assign(found,{name:p.full_name,username:p.username,email:p.email,phone:p.phone_normalized}); if(!found.createdAt) found.createdAt=p.created_at||new Date().toISOString(); }
  else users.push({id:p.id,name:p.full_name,username:p.username,email:p.email,phone:p.phone_normalized,avatar:null,addresses:[],wishlist:[],points:0,pointsHistory:[],createdAt:p.created_at||new Date().toISOString()});
  saveUsers(); // persist the customer row to the database (was missing: new accounts never reached the users table)
  session={type:'customer',email:p.email,name:p.full_name,authUserId:p.id};
  saveSession(); switchCart(true); updateNavAccountUI(); updateWishlistBadge();
  closeAuthOverlay();
  if(checkoutAuthPending){ checkoutAuthPending=false; await openCheckout(); }
  else showAccountPage();
}
function clearAuthFields(){
  const _t=document.getElementById('reg-terms'); if(_t) _t.checked=false;
  const _tw=document.getElementById('regTermsWrap'); if(_tw) _tw.classList.remove('auth-terms-err');
  ['login-email','login-password','reg-name','reg-username','reg-email','reg-phone','reg-password','reg-confirm','forgot-identifier','forgot-otp','forgot-newpass','forgot-confirm'].forEach(id=>{
    const el=document.getElementById(id);
    if(el) el.value='';
  });
}
function closeAuthOverlay(){
  const el=document.getElementById('authOverlay');
  if(el) el.classList.remove('open');
  document.body.style.overflow='';
  stopVerifyCooldown();
  pwResetAll();
  clearAuthFields();
}
// ── EMAIL VERIFICATION (sign-up sends a link; the account opens only after it is clicked) ──
let pendingVerifyIdentifier='';
let verifyCooldownTimer=null;
function setAuthNotice(id,msg,type){
  const el=document.getElementById(id); if(!el) return;
  if(!msg){ el.style.display='none'; el.textContent=''; return; }
  el.textContent=msg; el.className='auth-notice '+(type||'info'); el.style.display='block';
}
function stopVerifyCooldown(){
  if(verifyCooldownTimer){ clearInterval(verifyCooldownTimer); verifyCooldownTimer=null; }
  const b=document.getElementById('verifyResendBtn');
  if(b){ b.disabled=false; b.textContent='Resend Verification Email'; }
}
function startVerifyCooldown(seconds){
  stopVerifyCooldown();
  const b=document.getElementById('verifyResendBtn'); if(!b||seconds<=0) return;
  let left=seconds; b.disabled=true; b.textContent='Resend in '+left+'s';
  verifyCooldownTimer=setInterval(function(){
    left--; if(left<=0){ stopVerifyCooldown(); return; }
    b.textContent='Resend in '+left+'s';
  },1000);
}
// identifier = the email or username used to re-send; opts: {email, emailSent, notice}
function showVerifyPanel(identifier,opts){
  opts=opts||{};
  pendingVerifyIdentifier=identifier||'';
  ['authForm_login','authForm_register','authForm_forgot'].forEach(function(id){ const f=document.getElementById(id); if(f) f.style.display='none'; });
  document.getElementById('authTab_login').classList.remove('active');
  document.getElementById('authTab_register').classList.remove('active');
  document.getElementById('authForm_verify').style.display='block';
  const sub=document.getElementById('verifySub');
  sub.innerHTML=opts.email
    ? `We've sent a verification link to <strong>${esc(opts.email)}</strong>. Click it to verify your account, then sign in.`
    : `Click the verification link we emailed you to verify your account, then sign in.`;
  setAuthNotice('verifyNotice',opts.notice||'',opts.noticeType||'info');
  startVerifyCooldown(opts.emailSent===false?0:60);
}
async function resendVerificationEmail(){
  if(!pendingVerifyIdentifier){ setAuthNotice('verifyNotice','Please sign in again to request a new link.','error'); return; }
  if(!sb){ setAuthNotice('verifyNotice','Email service is not configured yet. Please try again later.','error'); return; }
  const btn=document.getElementById('verifyResendBtn'); if(btn) btn.disabled=true;
  try{
    const {error}=await sb.functions.invoke('resend-verification',{body:{identifier:pendingVerifyIdentifier}});
    if(error) throw error;
    setAuthNotice('verifyNotice','A new verification link is on its way. It may take a minute to arrive.','success');
    startVerifyCooldown(60);
  }catch(e){
    console.error('Resend verification failed',e);
    setAuthNotice('verifyNotice','We could not send the email right now. Please try again shortly.','error');
    if(btn) btn.disabled=false;
  }
}
// Runs when the customer lands from the emailed link (?verify_email=TOKEN)
async function handleEmailVerificationLink(token){
  openAuthOverlay();
  setAuthNotice('loginNotice','Verifying your email…','info');
  if(!sb){ setAuthNotice('loginNotice','Verification is unavailable right now. Please try again later.','error'); return; }
  try{
    const {data,error}=await sb.functions.invoke('verify-email',{body:{token}});
    if(error||!data||!data.ok) throw error||new Error('INVALID_OR_EXPIRED_LINK');
    setAuthNotice('loginNotice',data.already?'Your email is already verified. You can sign in.':'✓ Email verified! You can now sign in to your account.','success');
  }catch(e){
    console.error('Email verification failed',e);
    setAuthNotice('loginNotice','This verification link is invalid or has expired. Sign in with your details and we can send you a new one.','error');
  }
}
function switchAuthTab(which){
  document.getElementById('authTab_login').classList.toggle('active',which==='login');
  document.getElementById('authTab_register').classList.toggle('active',which==='register');
  document.getElementById('authForm_login').style.display=which==='login'?'block':'none';
  document.getElementById('authForm_register').style.display=which==='register'?'block':'none';
  const forgotForm=document.getElementById('authForm_forgot');
  if(forgotForm) forgotForm.style.display='none';
  const verifyForm=document.getElementById('authForm_verify');
  if(verifyForm) verifyForm.style.display='none';
  stopVerifyCooldown();
  document.getElementById('loginError').style.display='none';
  document.getElementById('registerError').style.display='none';
  pwResetAll();
}
function showForgotPassword(){
  document.getElementById('authTab_login').classList.remove('active');
  document.getElementById('authTab_register').classList.remove('active');
  document.getElementById('authForm_login').style.display='none';
  document.getElementById('authForm_register').style.display='none';
  const _vf=document.getElementById('authForm_verify'); if(_vf) _vf.style.display='none';
  stopVerifyCooldown();
  document.getElementById('authForm_forgot').style.display='block';
  document.getElementById('forgotStep1').style.display='block';
  document.getElementById('forgotStep2').style.display='none';
  document.getElementById('forgotSub').textContent='Enter the email or username linked to your account.';
  document.getElementById('forgot-identifier').value='';
  document.getElementById('forgotError').style.display='none';
  document.getElementById('forgotResetError').style.display='none';
  forgotTargetType=null; forgotTargetEmail=null;
  pwResetAll();
}
let forgotTargetType=null;
let forgotTargetEmail=null;
function forgotIdentify(){
  const idVal=document.getElementById('forgot-identifier').value.trim();
  const err=document.getElementById('forgotError');
  if(!idVal){ err.textContent='Please enter your email or username.'; err.style.display='block'; return; }
  const idLower=idVal.toLowerCase();
  if(idLower===(adminCreds.username||'admin').toLowerCase()){
    forgotTargetType='admin'; forgotTargetEmail=null;
    err.style.display='none';
    document.getElementById('forgotStep1').style.display='none';
    document.getElementById('forgotStep2').style.display='block';
    document.getElementById('forgotSub').textContent='Set a new password for the admin account.';
    document.getElementById('forgot-newpass').value=''; document.getElementById('forgot-confirm').value='';
    return;
  }
  const user=users.find(u=>u.email.toLowerCase()===idLower || (u.username && u.username.toLowerCase()===idLower));
  if(!user){ err.textContent="We couldn't find an account with that email or username."; err.style.display='block'; return; }
  forgotTargetType='customer'; forgotTargetEmail=user.email;
  err.style.display='none';
  document.getElementById('forgotStep1').style.display='none';
  document.getElementById('forgotStep2').style.display='block';
  document.getElementById('forgotSub').textContent=`Set a new password for ${user.name || user.email}.`;
  document.getElementById('forgot-newpass').value=''; document.getElementById('forgot-confirm').value='';
}
function forgotReset(){
  const pass=document.getElementById('forgot-newpass').value;
  const confirm=document.getElementById('forgot-confirm').value;
  const err=document.getElementById('forgotResetError');
  if(!pass || pass.length<6){ err.textContent='Password must be at least 6 characters.'; err.style.display='block'; return; }
  if(pass!==confirm){ err.textContent='Passwords do not match.'; err.style.display='block'; return; }
  let loginId='';
  if(forgotTargetType==='admin'){
    adminCreds.password=pass;
    saveAdminCreds();
    loginId=adminCreds.username||'admin';
    showToast('✓ Admin password has been reset. Please sign in.');
  } else if(forgotTargetType==='customer' && forgotTargetEmail){
    const user=users.find(u=>u.email===forgotTargetEmail);
    if(!user){ err.textContent='Something went wrong. Please try again.'; err.style.display='block'; return; }
    user.password=pass;
    saveUsers();
    loginId=user.email;
    showToast('✓ Password has been reset. Please sign in.');
  } else {
    err.textContent='Something went wrong. Please try again.'; err.style.display='block'; return;
  }
  err.style.display='none';
  switchAuthTab('login');
  document.getElementById('login-email').value=loginId;
  document.getElementById('login-password').value='';
  pwResetAll();
}

let passwordResetIdentifier='';
async function requestPasswordReset(){
  const identifier=document.getElementById('forgot-identifier').value.trim();
  const err=document.getElementById('forgotError');
  if(!identifier){ err.textContent='Please enter your email or username.'; err.style.display='block'; return; }
  if(!sb){ err.textContent='Password reset is not configured yet.'; err.style.display='block'; return; }
  setAuthButtonLoading('forgotRequestBtn',true,'Sending code…'); err.style.display='none';
  try{
    // The endpoint deliberately returns the same result for unknown accounts.
    await sb.functions.invoke('request-password-reset',{body:{identifier}});
    passwordResetIdentifier=identifier;
    document.getElementById('forgotStep1').style.display='none'; document.getElementById('forgotStep2').style.display='block';
    document.getElementById('forgotSub').textContent='If an account matches those details, a six-digit code has been sent. It expires in 5 minutes.';
    document.getElementById('forgot-otp').value=''; document.getElementById('forgot-newpass').value=''; document.getElementById('forgot-confirm').value='';
  }catch(e){ console.error('Password reset request failed',e); err.textContent='We could not start password reset. Please try again.'; err.style.display='block'; }
  finally{ setAuthButtonLoading('forgotRequestBtn',false); }
}
async function verifyPasswordReset(){
  const code=document.getElementById('forgot-otp').value.trim(); const password=document.getElementById('forgot-newpass').value; const confirm=document.getElementById('forgot-confirm').value; const err=document.getElementById('forgotResetError');
  if(!/^\d{6}$/.test(code)){ err.textContent='Enter the 6-digit code from your email.'; err.style.display='block'; return; }
  if(password.length<6){ err.textContent='Password must be at least 6 characters.'; err.style.display='block'; return; }
  if(password!==confirm){ err.textContent='Passwords do not match.'; err.style.display='block'; return; }
  setAuthButtonLoading('forgotVerifyBtn',true,'Resetting…'); err.style.display='none';
  try{
    const {data,error}=await sb.functions.invoke('verify-password-reset',{body:{identifier:passwordResetIdentifier,code,password}});
    if(error || !data?.ok) throw error||new Error(data?.error||'Invalid code');
    switchAuthTab('login'); document.getElementById('login-email').value=passwordResetIdentifier.includes('@')?passwordResetIdentifier:''; showToast('✓ Password reset. Please sign in.');
  }catch(e){ err.textContent='That code is invalid or expired. Request a new one and try again.'; err.style.display='block'; }
  finally{ setAuthButtonLoading('forgotVerifyBtn',false); }
}
function showAccountPage(){
  hideAllMainPages();
  const el=document.getElementById('accountPage');
  el.style.display='block';
  animatePageIn(el);
  renderAccountPage();
  window.scrollTo({top:0,left:0,behavior:'instant'});
}
function showScentFinderPage(){
  hideAllMainPages();
  const el=document.getElementById('scentFinderPage');
  el.style.display='block';
  animatePageIn(el);
  document.getElementById('scentFinderResults').innerHTML='';
  window.scrollTo({top:0,left:0,behavior:'instant'});
}
function showPolicyPage(which){
  hideAllMainPages();
  const el=document.getElementById('policyPage_'+which);
  if(el){ el.style.display='block'; animatePageIn(el); }
  window.scrollTo({top:0,left:0,behavior:'instant'});
}
/* Register form: open OUR OWN Terms & Conditions page in a new tab (keeps the sign-up form data intact) */
function openTermsInNewTab(e){
  if(e){ e.stopPropagation(); e.preventDefault(); }
  var url=/^https?:$/.test(location.protocol) ? '/policy/terms' : (location.pathname+'#/policy/terms');
  var w=window.open(url,'_blank','noopener');
  if(!w){ showPolicyPage('terms'); }   // popup blocked → show it in this tab instead
  return false;
}
function resetScentFinder(){
  ['sfGender','sfSeason','sfOccasion','sfScent','sfLongevity'].forEach(id=>{ document.getElementById(id).value=''; });
  document.getElementById('sfBudget').value='0';
  document.getElementById('scentFinderResults').innerHTML='';
}
function longevityForType(type){
  if(type==='parfum') return 'Long-lasting (7+ hrs)';
  if(type==='edp') return 'Moderate (4-6 hrs)';
  return 'Light (1-3 hrs)'; // edt, edc
}
function findMyFragrance(){
  const gender=document.getElementById('sfGender').value;
  const scent=document.getElementById('sfScent').value;
  const longevity=document.getElementById('sfLongevity').value;
  const budget=Number(document.getElementById('sfBudget').value)||0;
  const resultsEl=document.getElementById('scentFinderResults');

  if(!gender){ showToast('Please select a gender to continue.'); return; }

  let list=products.filter(p=>productInStock(p));

  list=list.filter(p=>getCats(p).includes(gender) || getCats(p).includes('Unisex') || gender==='Unisex');

  if(scent){
    const matches=list.filter(p=>{
      const hay=((p.topNotes||'')+' '+(p.middleNotes||'')+' '+(p.baseNotes||'')+' '+(p.notes||'')+' '+(p.desc||'')+' '+(p.name||'')).toLowerCase();
      return hay.includes(scent.toLowerCase());
    });
    if(matches.length) list=matches;
  }

  if(longevity){
    const matches=list.filter(p=>longevityForType(p.type)===longevity);
    if(matches.length) list=matches;
  }

  const sfSeason=document.getElementById('sfSeason').value;
  if(sfSeason && sfSeason!=='All Seasons'){
    const matches=list.filter(p=>{ const ss=getSeasons(p); return !ss.length || ss.includes(sfSeason); });
    if(matches.length) list=matches;
  }

  if(budget>0){
    const matches=list.filter(p=>Math.min(...p.sizes.map(s=>s.price))<=budget);
    if(matches.length) list=matches;
  }

  list=list.slice(0,12);

  if(!list.length){
    resultsEl.innerHTML=`<div style="text-align:center;color:var(--muted);font-size:.85rem;padding:2rem 0">No exact matches found — try adjusting your preferences, or <a href="/collection" onclick="showCollectionPage();return false;" style="color:var(--gold);text-decoration:none">browse the full collection</a>.</div>`;
    return;
  }

  resultsEl.innerHTML=`<h3 style="font-family:'Cormorant Garant',serif;font-weight:300;font-size:1.5rem;text-align:center;margin-bottom:1.5rem">Recommended For <em style="font-style:italic;color:var(--gold)">You</em></h3>
    <div class="product-grid">${list.map((p,idx)=>buildProductCard(p,idx)).join('')}</div>`;
  list.forEach(p=>{ if(selectedSizes[p.id]===undefined) selectedSizes[p.id]=0; });
  observeReveals(resultsEl);
  document.getElementById('scentFinderResults').scrollIntoView({behavior:'smooth',block:'nearest'});
}
let __toastTimer=null;
function showToast(msg,type){
  const t=document.getElementById('toast'); if(!t) return;
  if(!type) type=/^\s*⚠|fail|error|could not|can't|cannot|not found|invalid|out of stock|no more stock/i.test(String(msg))?'error':(/^\s*✓/.test(String(msg))?'success':'info');
  t.textContent=msg;
  t.setAttribute('role','status'); t.setAttribute('aria-live','polite');
  t.classList.remove('success','error','info','show');
  void t.offsetWidth;
  t.classList.add(type,'show');
  clearTimeout(__toastTimer);
  __toastTimer=setTimeout(()=>t.classList.remove('show'), type==='error'?4600:3000);
}
function calcDelivery(subtotal,zone){
  const d=zone==='outside'?(Number(settings.deliveryOutside)||140):(Number(settings.deliveryInside)||80);
  const fa=Number(settings.freeabove)||0;
  if(fa>0 && subtotal>=fa) return 0;
  return d;
}
function updateDeliveryZoneLabels(){
  const inOpt=document.getElementById('co-zoneInsideOpt');
  const outOpt=document.getElementById('co-zoneOutsideOpt');
  const inside=Number(settings.deliveryInside)||80;
  const outside=Number(settings.deliveryOutside)||140;
  if(inOpt) inOpt.textContent=`Inside Dhaka — ৳${inside.toLocaleString()}`;
  if(outOpt) outOpt.textContent=`Outside Dhaka — ৳${outside.toLocaleString()}`;
  const hint=document.getElementById('co-zoneHint');
  if(hint) hint.textContent=`Delivery charge: Inside Dhaka ৳${inside.toLocaleString()} · Outside Dhaka ৳${outside.toLocaleString()}`;
}

// ── CHECKOUT LOCATION (City → Zone → Area) ──────────────────────────────────
// Data lives in locations.js (all 64 districts → zones → areas). Edit that file to add/fix places.
// Dhaka-city zones are 'inside' (cheaper delivery); everything else is 'outside'.
const BD_LOCATIONS=window.ESSENTRA_LOCATIONS||{};
const DHAKA_OUTSIDE_ZONES=window.ESSENTRA_OUTSIDE_DHAKA_ZONES||[];
if(!Object.keys(BD_LOCATIONS).length){ BD_LOCATIONS['Dhaka']={'Dhaka City':[]}; }   // safety net if locations.js failed to load
const coSort=(a,b)=>String(a).localeCompare(String(b),'en',{numeric:true,sensitivity:'base'});
function coLocCities(){
  return Object.keys(BD_LOCATIONS).sort((a,b)=>a==='Dhaka'?-1:b==='Dhaka'?1:coSort(a,b));   // Dhaka first, rest A–Z
}
function coLocZones(city){
  if(!city) return [];
  if(BD_LOCATIONS[city]) return Object.keys(BD_LOCATIONS[city]).sort(coSort);
  return ['District Sadar','Other Upazila'];
}
function coLocAreas(city,zone){ return ((BD_LOCATIONS[city]&&BD_LOCATIONS[city][zone])||[]).slice().sort(coSort); }
function coFillSelect(el,items,placeholder,keep){
  const prev=keep?el.value:'';
  el.innerHTML='';
  const o0=document.createElement('option'); o0.value=''; o0.textContent=placeholder; el.appendChild(o0);
  items.forEach(t=>{ const o=document.createElement('option'); o.value=t; o.textContent=t; el.appendChild(o); });
  if(prev && items.indexOf(prev)>-1) el.value=prev;
}
function coInitLocation(){
  const citySel=document.getElementById('co-city'); if(!citySel) return;
  if(citySel.options.length<=1){
    coFillSelect(citySel,coLocCities(),'Select city...',false);
  }
  updateDeliveryZoneLabels();
  coSyncZoneType();
}
function onCityChange(){
  const city=document.getElementById('co-city').value;
  const zoneSel=document.getElementById('co-zoneSel');
  const areaSel=document.getElementById('co-area');
  coFillSelect(zoneSel,coLocZones(city),'Select zone...',false);
  zoneSel.disabled=!city;
  coFillSelect(areaSel,[],'Select area...',false);
  areaSel.disabled=true;
  coSyncZoneType();
}
function onZoneChange(){
  const city=document.getElementById('co-city').value;
  const zone=document.getElementById('co-zoneSel').value;
  const areaSel=document.getElementById('co-area');
  const areas=coLocAreas(city,zone);
  coFillSelect(areaSel,areas,'Select area...',false);
  areaSel.disabled=!areas.length;
  coSyncZoneType();
}
// sets the hidden #co-zone ('inside' | 'outside' | '') that delivery pricing already reads
function coSyncZoneType(){
  const city=document.getElementById('co-city').value;
  const zone=document.getElementById('co-zoneSel').value;
  const hid=document.getElementById('co-zone');
  if(!city||!zone) hid.value='';
  else hid.value=(city==='Dhaka' && DHAKA_OUTSIDE_ZONES.indexOf(zone)===-1)?'inside':'outside';
  renderCheckoutSummary();
}
// qty / remove straight from the checkout list
function coUpdateQty(key,delta){
  updateQty(key,delta);
  if(!cart.length){ closeCheckout(); return; }
  renderCheckoutSummary();
}
function coRemove(key){
  cart=cart.filter(i=>i.key!==key && i.key!==key+'_atz'); saveCart(); renderCart();
  if(!cart.length){ closeCheckout(); showToast('Your cart is empty.','info'); return; }
  renderCheckoutSummary();
}

// ── PRODUCTS ─────────────────────────────────────────────────────────────────
function addSizeRow(){
  const r=document.createElement('div');r.className='size-row';
  r.innerHTML=`<input autocomplete="off" class="form-input" name="size-ml" aria-label="Size in ml" placeholder="ML" style="max-width:80px"/><input autocomplete="off" class="form-input" name="size-price" aria-label="Price in taka" placeholder="Price ৳"/><input autocomplete="off" class="form-input" name="size-stock" aria-label="Stock quantity" type="number" min="0" step="1" placeholder="Stock" style="max-width:100px"/><button class="remove-size-btn" onclick="removeSizeRow(this)"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg></button>`;
  document.getElementById('sizePricingRows').appendChild(r);
}
function removeSizeRow(btn){ const rows=document.getElementById('sizePricingRows').querySelectorAll('.size-row');if(rows.length>1)btn.closest('.size-row').remove(); }

function compressImage(file,maxDim,cb){
  const reader=new FileReader();
  reader.onerror=()=>cb(null);
  reader.onload=ev=>{
    const src=ev.target.result;
    if(!/^image\//.test(file.type)||/svg/.test(file.type)){ cb(src); return; }
    const img=new Image();
    img.onerror=()=>cb(null);
    img.onload=()=>{
      try{
        let w=img.naturalWidth||img.width, h=img.naturalHeight||img.height;
        const k=Math.min(1,maxDim/Math.max(w,h));
        w=Math.max(1,Math.round(w*k)); h=Math.max(1,Math.round(h*k));
        const c=document.createElement('canvas'); c.width=w; c.height=h;
        const ctx=c.getContext('2d'); ctx.drawImage(img,0,0,w,h);
        const keepAlpha=/png|webp|gif/.test(file.type);
        let out=keepAlpha?c.toDataURL('image/webp',0.86):c.toDataURL('image/jpeg',0.86);
        if(keepAlpha && !/^data:image\/webp/.test(out)){            // browser can't encode webp (older Safari)
          const c2=document.createElement('canvas'); const k2=Math.min(1,700/Math.max(w,h));
          c2.width=Math.round(w*k2); c2.height=Math.round(h*k2); c2.getContext('2d').drawImage(c,0,0,c2.width,c2.height);
          out=c2.toDataURL('image/png');
        }
        cb(out.length<src.length||k<1?out:src);
      }catch(err){ cb(src); }
    };
    img.src=src;
  };
  reader.readAsDataURL(file);
}
function handlePhoto(e){
  const f=e.target.files[0]; if(!f) return;
  if(!/^image\//.test(f.type)){ showToast('Please choose an image file.','error'); e.target.value=''; return; }
  compressImage(f,900,function(data){
    if(!data){ showToast('Could not read that image. Try another one.','error'); return; }
    uploadedPhoto=data;
    document.getElementById('photoPreview').src=uploadedPhoto;
    document.getElementById('photoZone').style.display='none';
    document.getElementById('photoPreviewWrap').style.display='block';
  });
}
function removePhoto(){
  uploadedPhoto=null;
  document.getElementById('photoPreview').src='';
  document.getElementById('photoInput').value='';
  document.getElementById('photoZone').style.display='flex';
  document.getElementById('photoPreviewWrap').style.display='none';
}

function parseLegacyNotes(str){
  const map={top:'',heart:'',base:''};
  if(!str) return map;
  const parts=str.split(/(top|heart|middle|base)\s*:\s*/i);
  for(let i=1;i<parts.length-1;i+=2){
    const key=parts[i].toLowerCase();
    const val=(parts[i+1]||'').replace(/[,;]\s*$/,'').trim();
    if(val) map[key==='middle'?'heart':key]=val;
  }
  return map;
}

const PF_ORDER=['basic','notes','pricing'];
function pfShowSection(name){
  document.querySelectorAll('#tab-addProduct .pf-section').forEach(e=>e.classList.toggle('active',e.dataset.pf===name));
  document.querySelectorAll('#pfTabs .pf-tab').forEach(e=>e.classList.toggle('active',e.dataset.pf===name));
  const i=PF_ORDER.indexOf(name);
  const pv=document.getElementById('pfPrevBtn'), nx=document.getElementById('pfNextBtn');
  if(pv) pv.style.visibility=i>0?'visible':'hidden';
  if(nx) nx.style.visibility=i<PF_ORDER.length-1?'visible':'hidden';
}
function pfStep(d){
  const cur=(document.querySelector('#pfTabs .pf-tab.active')||{dataset:{pf:'basic'}}).dataset.pf;
  const n=PF_ORDER[Math.min(Math.max(PF_ORDER.indexOf(cur)+d,0),PF_ORDER.length-1)];
  pfShowSection(n);
}
function flashProduct(id){
  // Highlight the card that was just added/updated so the change is obvious
  setTimeout(()=>{
    const el=document.querySelector('#manageGrid .pm-card[data-pid="'+id+'"]');
    if(!el) return;
    el.classList.remove('pm-flash'); void el.offsetWidth; el.classList.add('pm-flash');
    el.scrollIntoView({behavior:'smooth',block:'center'});
    setTimeout(()=>el.classList.remove('pm-flash'),2600);
  },80);
}
let __submitting=false;
function submitProduct(){
  if(__submitting) return;
  const name=document.getElementById('prodName').value.trim();
  if(!name){ pfShowSection('basic'); showToast('Enter a fragrance name.','error'); return; }
  const rows=document.getElementById('sizePricingRows').querySelectorAll('.size-row');
  const sizes=[]; let badRow=false;
  rows.forEach(r=>{
    const i=r.querySelectorAll('input'); const ml=i[0].value.trim(); const pr=i[1].value.trim(); const st=i[2].value.trim();
    if(!ml && !pr && !st) return;
    const price=parseFloat(pr), stock=parseInt(st,10);
    if(!ml || !(price>=0) || isNaN(price) || (st!=='' && (isNaN(stock)||stock<0))){ badRow=true; return; }
    sizes.push({ml,price,stock:isNaN(stock)?0:stock});
  });
  if(badRow || !sizes.length){ pfShowSection('pricing'); showToast(badRow?'Check the size rows: ML, a valid price and stock are needed.':'Add at least one size, price & stock.','error'); return; }
  const discRaw=document.getElementById('prodDiscount').value.trim();
  const discount=discRaw===''?0:Number(discRaw);
  if(isNaN(discount)||discount<0||discount>100){ pfShowSection('pricing'); showToast('Discount must be a number from 0 to 100.','error'); return; }
  const brand=document.getElementById('prodBrand').value.trim()||'Others';
  const categories=getSelectedProdCategories();
  if(!categories.length){ pfShowSection('basic'); showToast('Please select at least one category.','error'); return; }
  const category=categories[0];
  const season=getSelectedProdSeasons();
  const type=document.getElementById('prodType').value;
  const desc=document.getElementById('prodDesc').value.trim()||'A remarkable fragrance.';
  const topNotes=document.getElementById('prodTopNotes').value.trim();
  const middleNotes=document.getElementById('prodMiddleNotes').value.trim();
  const baseNotes=document.getElementById('prodBaseNotes').value.trim();
  const bestseller=document.getElementById('prodBestseller').checked;
  const batch=document.getElementById('prodBatch').value.trim();

  __submitting=true;
  const btn=document.getElementById('productSubmitBtn');
  const oldLabel=btn?btn.textContent:'';
  if(btn){ btn.disabled=true; btn.textContent='Saving…'; }
  let savedId=null, msg='';
  try{
    if(editingProductId!==null){
      const idx=products.findIndex(p=>p.id===editingProductId);
      if(idx===-1){ showToast('Could not find product to update.','error'); editingProductId=null; resetForm(); return; }
      const existing=products[idx];
      products[idx]={
        ...existing,
        brand,category,categories,season,name,type,desc,topNotes,middleNotes,baseNotes,bestseller,batch,sizes,discount,
        photo: uploadedPhoto||null,   // form is pre-filled with the current photo, so removing it really removes it
      };
      delete products[idx].notes;
      savedId=products[idx].id; msg='✓ “'+name+'” updated.';
    } else {
      const p={
        id:Date.now(),
        brand,category,categories,season,name,type,desc,topNotes,middleNotes,baseNotes,bestseller,batch,discount,
        sizes, photo:uploadedPhoto||null,
      };
      products.unshift(p);
      savedId=p.id; msg='✓ “'+name+'” added to collection.';
    }
    syncProducts();
    editingProductId=null;
    resetForm();
    try{ renderProducts(); renderCollection(); renderManageGrid(); renderInventory(); }
    catch(re){ console.error('Render after save failed', re); }
    switchTab('manageProducts');
    showToast(msg,'success');
    flashProduct(savedId);
  }catch(err){
    console.error('Saving product failed', err);
    showToast('⚠ Could not save the product: '+((err&&err.message)||'unknown error'),'error');
  }finally{
    __submitting=false;
    if(btn){ btn.disabled=false; if(btn.textContent==='Saving…') btn.textContent=oldLabel; }
  }
}

function editProduct(id){
  const p=products.find(pr=>pr.id===id); if(!p) return;
  editingProductId=id;
  populateBrandSelect();
  switchTab('addProduct');
  pfShowSection('basic');
  document.getElementById('prodBrand').value=p.brand||'Others';
  setProdCategories(getCats(p));
  setProdSeasons(getSeasons(p));
  document.getElementById('prodName').value=p.name||'';
  document.getElementById('prodType').value=p.type||'edp';
  document.getElementById('prodDesc').value=p.desc||'';
  if(p.topNotes!==undefined||p.middleNotes!==undefined||p.baseNotes!==undefined){
    document.getElementById('prodTopNotes').value=p.topNotes||'';
    document.getElementById('prodMiddleNotes').value=p.middleNotes||'';
    document.getElementById('prodBaseNotes').value=p.baseNotes||'';
  } else if(p.notes){
    const legacy=parseLegacyNotes(p.notes);
    document.getElementById('prodTopNotes').value=legacy.top||'';
    document.getElementById('prodMiddleNotes').value=legacy.heart||'';
    document.getElementById('prodBaseNotes').value=legacy.base||'';
  } else {
    document.getElementById('prodTopNotes').value='';
    document.getElementById('prodMiddleNotes').value='';
    document.getElementById('prodBaseNotes').value='';
  }
  document.getElementById('prodBestseller').checked=!!p.bestseller;
  document.getElementById('prodBatch').value=p.batch||'';
  document.getElementById('prodDiscount').value=productDiscountPct(p)>0?productDiscountPct(p):'';

  const rowsWrap=document.getElementById('sizePricingRows');
  rowsWrap.innerHTML='';
  (p.sizes&&p.sizes.length?p.sizes:[{ml:'',price:'',stock:''}]).forEach(s=>{
    const r=document.createElement('div');r.className='size-row';
    r.innerHTML=`<input autocomplete="off" class="form-input" name="size-ml" aria-label="Size in ml" placeholder="ML" style="max-width:80px" value="${esc(s.ml)}"/><input autocomplete="off" class="form-input" name="size-price" aria-label="Price in taka" placeholder="Price ৳" value="${(s.price!==undefined&&s.price!==null)?esc(s.price):''}"/><input autocomplete="off" class="form-input" name="size-stock" aria-label="Stock quantity" type="number" min="0" step="1" placeholder="Stock" style="max-width:100px" value="${(s.stock!==undefined&&s.stock!==null)?s.stock:''}"/><button class="remove-size-btn" onclick="removeSizeRow(this)"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg></button>`;
    rowsWrap.appendChild(r);
  });

  uploadedPhoto=p.photo||null;
  const preview=document.getElementById('photoPreview');
  if(p.photo){
    preview.src=p.photo;
    document.getElementById('photoZone').style.display='none';
    document.getElementById('photoPreviewWrap').style.display='block';
  } else {
    document.getElementById('photoZone').style.display='flex';
    document.getElementById('photoPreviewWrap').style.display='none';
  }

  const submitBtn=document.getElementById('productSubmitBtn');
  if(submitBtn) submitBtn.textContent='Update Product';
  const cancelBtn=document.getElementById('cancelEditBtn');
  if(cancelBtn) cancelBtn.style.display='inline-block';
  updateProductFormMode(p.name);

  document.getElementById('admin').scrollIntoView({behavior:'smooth'});
}

// Keeps the "Add Product" ↔ "Edit Product" heading, icon, and badge in sync
// with whether editingProductId is currently set.
function updateProductFormMode(productName){
  const title=document.getElementById('addProductPageTitle');
  const sub=document.getElementById('addProductPageSub');
  const badge=document.getElementById('addProductPageBadge');
  const icon=document.getElementById('addProductPageIcon');
  const isEditing = editingProductId!==null && editingProductId!==undefined;
  if(title) title.innerHTML = isEditing ? 'Edit <em>Fragrance</em>' : 'Add New <em>Fragrance</em>';
  if(sub) sub.textContent = isEditing
    ? `Updating "${productName||'this product'}". Changes save when you click Update Product.`
    : 'Fill in the details below to list a new product in the catalogue.';
  if(badge){ badge.style.display = isEditing ? 'inline-flex' : 'none'; badge.textContent='Editing'; badge.classList.toggle('is-edit', isEditing); }
  if(icon) icon.innerHTML = isEditing
    ? '<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>'
    : '<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>';
}

function cancelEdit(){
  editingProductId=null;
  resetForm();
  showToast('Edit cancelled.');
}

function resetForm(){
  pfShowSection('basic');
  ['prodName','prodDesc','prodTopNotes','prodMiddleNotes','prodBaseNotes','prodBatch','prodDiscount'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('prodBrand').selectedIndex=0;
  setProdCategories(['Unisex']);
  setProdSeasons([]);
  document.getElementById('prodType').value='edp';
  document.getElementById('prodBestseller').checked=false;
  const rows=document.getElementById('sizePricingRows');
  rows.innerHTML='<div class="size-row"><input autocomplete="off" class="form-input" name="size-ml" aria-label="Size in ml" placeholder="ML" style="max-width:80px"/><input autocomplete="off" class="form-input" name="size-price" aria-label="Price in taka" placeholder="Price ৳"/><input autocomplete="off" class="form-input" name="size-stock" aria-label="Stock quantity" type="number" min="0" step="1" placeholder="Stock" style="max-width:100px"/><button class="remove-size-btn" onclick="removeSizeRow(this)"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg></button></div>';
  uploadedPhoto=null;
  document.getElementById('photoZone').style.display='flex';
  document.getElementById('photoPreviewWrap').style.display='none';
  document.getElementById('photoInput').value='';
  editingProductId=null;
  const submitBtn=document.getElementById('productSubmitBtn');
  if(submitBtn) submitBtn.textContent='Add to Collection';
  const cancelBtn=document.getElementById('cancelEditBtn');
  if(cancelBtn) cancelBtn.style.display='none';
  updateProductFormMode();
}

function buildProductCard(p,idx){
  idx=idx||0;
  const sizes=(p.sizes&&p.sizes.length)?p.sizes:[{ml:0,price:0,stock:0}];
  let savedIdx = (selectedSizes[p.id]!==undefined && sizes[selectedSizes[p.id]]) ? selectedSizes[p.id] : 0;
  // If the saved size is out of stock, default to the first size that has stock (if any)
  if(!(Number(sizes[savedIdx].stock)>0)){
    const inStockIdx=sizes.findIndex(s=>Number(s.stock)>0);
    if(inStockIdx>=0) savedIdx=inStockIdx;
  }
  const first=sizes[savedIdx];
  const firstHasStock=Number(first.stock)>0;
  const sizeOptions=sizes.map((s,idx)=>`<option value="${idx}"${idx===savedIdx?' selected':''}${!(Number(s.stock)>0)?' disabled':''}>${s.ml}ml (${(s.ml*15)||0}+ sprays)${!(Number(s.stock)>0)?' — Out of Stock':''}</option>`).join('');
  const img=p.photo?`<img class="card-img" src="${p.photo}" alt="${(p.name||'Fragrance').replace(/"/g,'&quot;')}" width="300" height="400" loading="lazy" decoding="async"/>`:`<div class="product-img-placeholder">${BOTTLE_SVG}</div>`;
  const tooltipText=(p.name||'Fragrance').replace(/"/g,'&quot;');
  return `<div class="product-card reveal" data-tooltip="${tooltipText}" style="transition-delay:${Math.min(idx*70,420)}ms">
      <div class="card-image-wrap" onclick="openModal(${p.id})">
        ${img}
        ${discountBadgeHTML(p)}
        ${wishHeartHTML(p.id)}
        ${(!productInStock(p))?'<div class="out-of-stock-badge">Out of Stock</div>':''}
        <div class="card-overlay"><button class="card-overlay-btn" onclick="event.stopPropagation();openModal(${p.id})">Quick View</button></div>
      </div>
      <div class="card-body">
        <div class="card-brand">${p.brand||'Others'}</div>
        <div class="card-name" onclick="openModal(${p.id})">${p.name||'Untitled Fragrance'}</div>
        <div class="card-type">${TYPE_LABELS[p.type]||p.type||''}</div>
        <div class="size-select-wrap">
          <select class="size-select" aria-label="Choose size for ${tooltipText}" name="size" onclick="event.stopPropagation()" onchange="event.stopPropagation();selectCardSizeDropdown(${p.id},this)">${sizeOptions}</select>
        </div>
        <div class="card-footer">
          <div class="card-price">${priceHTML(first.price||0,first.ml||0,p)}</div>
          <button class="add-to-cart" onclick="event.stopPropagation();addFromCard(${p.id})"${firstHasStock?'':' disabled style="opacity:.4;cursor:not-allowed"'}>${firstHasStock?'Add to Cart':'Unavailable'}</button>
        </div>
      </div>
    </div>`;
}

// Homepage grid — best sellers only
function renderProducts(){
  renderHomeCategories();
  renderRecentlyViewed();
  const grid=document.getElementById('productGrid');
  const empty=document.getElementById('emptyState');
  const list=products.filter(p=>p.bestseller);
  if(!list.length){ grid.innerHTML='';grid.classList.remove('marquee-wrap');empty.style.display='block';return; }
  empty.style.display='none';

  if(window.__marqueeTimer){ clearInterval(window.__marqueeTimer); window.__marqueeTimer=null; }

  if(list.length>4){
    // Auto-scrolling marquee (right → left), looping seamlessly.
    grid.classList.add('marquee-wrap');
    const cardsHTML=list.map((p,idx)=>buildProductCard(p,idx)).join('');
    // duplicate the set so the loop is seamless, then scroll by -50%
    grid.innerHTML=`<div class="marquee-track" id="productMarqueeTrack" style="animation-duration:${Math.max(list.length*6,24)}s">${cardsHTML}${cardsHTML}</div>`;
    grid.onmouseenter=null; grid.onmouseleave=null;
  }else{
    grid.classList.remove('marquee-wrap');
    grid.onmouseenter=null; grid.onmouseleave=null;
    grid.innerHTML=list.map((p,idx)=>buildProductCard(p,idx)).join('');
  }

  list.forEach(p=>{ if(selectedSizes[p.id]===undefined) selectedSizes[p.id]=0; });
  observeReveals();
}

function renderHomeCategories(){
  const wrap=document.getElementById('homeCategoryGrid');
  if(!wrap) return;
  wrap.innerHTML=SHOP_CATEGORIES.map((c,idx)=>{
    const count=products.filter(p=>getCats(p).includes(c)).length;
    const img=CATEGORY_IMAGES[CATEGORY_IMAGE_SWAP[c]||c]||'';
    return `<div class="category-card reveal-scale" data-tooltip="Shop ${c}" style="background-image:url('${img}');transition-delay:${idx*80}ms" onclick="goToCategory('${c}')">
        <div class="category-card-inner">
          <div class="category-card-name">${c}</div>
          <div class="category-card-count">${count} Fragrance${count===1?'':'s'}</div>
        </div>
      </div>`;
  }).join('');
  observeReveals();
}

function clean(v,max){ v=String(v==null?'':v).replace(/[<>]/g,'').trim(); return max?v.slice(0,max):v; }
function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch])); }
function getTestimonialPool(){
  return reviews.filter(r=>r.status==='approved').sort((a,b)=>(b.ts||0)-(a.ts||0));
}
function renderTestimonials(){
  const track=document.getElementById('rvTrack'); if(!track) return;
  const pool=getTestimonialPool();
  const n=pool.length;
  const avgEl=document.getElementById('rvSummary');
  const nav=document.getElementById('rvNav'), hint=document.getElementById('rvHint');
  if(avgEl){
    if(n){
      const avg=pool.reduce((s,r)=>s+(Math.max(1,Math.min(5,Number(r.rating)||5))),0)/n;
      avgEl.innerHTML=`<span class="rv-sum-star">★</span><b>${avg.toFixed(1)}</b> out of 5 · ${n} review${n===1?'':'s'}`;
      avgEl.style.display='';
    } else { avgEl.style.display='none'; }
  }
  if(nav) nav.style.display=n>1?'':'none';
  if(hint) hint.style.display=n>1?'':'none';
  if(!n){
    track.innerHTML=`<div class="rv-card rv-card-empty"><div class="rv-quote">“</div><div class="rv-text">No reviews yet. Be the first to share your experience with Essentra.</div><button class="rv-btn rv-btn-dark" style="align-self:flex-start" onclick="openReviewModal()">Write a review</button></div>`;
    return;
  }
  track.innerHTML=pool.map(t=>{
    const rt=Math.max(1,Math.min(5,Number(t.rating)||5));
    const stars='★'.repeat(rt)+'<span class="rv-star-off">'+'★'.repeat(5-rt)+'</span>';
    return `<div class="rv-card">
      <div class="rv-quote">“</div>
      <div class="rv-text">${esc(t.text)}</div>
      <div class="rv-stars-row">${stars}</div>
      <div class="rv-name">${esc(t.name)}</div>
    </div>`;
  }).join('');
  updateReviewNav();
}
function scrollReviews(dir){
  const t=document.getElementById('rvTrack'); if(!t) return;
  const card=t.querySelector('.rv-card');
  const step=card?card.offsetWidth+20:320;
  t.scrollBy({left:dir*step,behavior:'smooth'});
}
function updateReviewNav(){
  const t=document.getElementById('rvTrack'); if(!t) return;
  const p=document.getElementById('rvPrev'), n=document.getElementById('rvNext');
  if(p) p.disabled=t.scrollLeft<=4;
  if(n) n.disabled=t.scrollLeft+t.clientWidth>=t.scrollWidth-4;
}
window.addEventListener('resize',updateReviewNav);

// ── CUSTOMER REVIEWS ────────────────────────────────────────────────────────
let reviewRating=0;
function openReviewModal(){
  const cu=(session && session.type==='customer') ? users.find(u=>u.email===session.email) : null;
  document.getElementById('rv-name').value=cu?(cu.name||''):'';
  document.getElementById('rv-text').value='';
  document.getElementById('rv-error').style.display='none';
  setReviewRating(0);
  document.getElementById('reviewOverlay').classList.add('open');
  document.body.style.overflow='hidden';
}
function closeReviewModal(){
  document.getElementById('reviewOverlay').classList.remove('open');
  document.body.style.overflow='';
}
function setReviewRating(n){
  reviewRating=n;
  document.querySelectorAll('#rv-stars button').forEach((b,i)=>b.classList.toggle('on',i<n));
}
function submitReview(){
  const err=document.getElementById('rv-error');
  const name=clean(document.getElementById('rv-name').value,40);
  const text=clean(document.getElementById('rv-text').value,400);
  const fail=m=>{ err.textContent=m; err.style.display='block'; };
  if(name.length<2) return fail('Please enter your name.');
  if(!reviewRating) return fail('Please select a star rating.');
  if(text.length<10) return fail('Please write at least 10 characters.');
  const email=(session && session.type==='customer') ? session.email : '';
  reviews.unshift({id:'RV-'+Date.now(),name:name.slice(0,40),rating:reviewRating,text:text.slice(0,400),status:'pending',email,ts:Date.now(),date:new Date().toLocaleString('en-BD',{dateStyle:'medium',timeStyle:'short'})});
  syncReviews(); updateReviewBadge(); if(typeof renderReviews==='function') renderReviews(); renderTestimonials();
  closeReviewModal();
  showToast('✓ Thank you! Your review will appear once approved.');
}

// ── REVIEWS (ADMIN) ─────────────────────────────────────────────────────────
let reviewFilter='pending';
function updateReviewBadge(){
  const b=document.getElementById('reviewBadge'); if(!b) return;
  const n=reviews.filter(r=>r.status==='pending').length;
  b.textContent=n||''; b.style.display=n?'':'none';
}
function setReviewFilter(f){ reviewFilter=f; renderReviews(); }
function setReviewStatus(id,status){
  const r=reviews.find(x=>x.id===id); if(!r) return;
  r.status=status; syncReviews(); updateReviewBadge(); renderReviews(); renderTestimonials();
  showToast(status==='approved'?'✓ Review approved — now live on the homepage.':'Review rejected.');
}
function deleteReview(id){
  if(!confirm('Delete this review permanently?')) return;
  reviews=reviews.filter(r=>r.id!==id); syncReviews(); updateReviewBadge(); renderReviews(); renderTestimonials();
  showToast('✓ Review deleted.','success');
}
function renderReviews(){
  const con=document.getElementById('reviewsList'); if(!con) return;
  ['pending','approved','rejected','all'].forEach(f=>{
    const b=document.getElementById('rvf-'+f); if(!b) return;
    const cnt=f==='all'?reviews.length:reviews.filter(r=>r.status===f).length;
    b.textContent=f.charAt(0).toUpperCase()+f.slice(1)+' ('+cnt+')';
    b.classList.toggle('active',reviewFilter===f);
  });
  const list=reviews.filter(r=>reviewFilter==='all'||r.status===reviewFilter);
  if(!list.length){ con.innerHTML='<div style="text-align:center;color:var(--muted);font-size:.84rem;padding:3rem 0">No '+(reviewFilter==='all'?'':reviewFilter+' ')+'reviews.</div>'; return; }
  con.innerHTML=list.map(r=>{
    const rt=Math.max(1,Math.min(5,Number(r.rating)||5));
    const col=r.status==='approved'?'#8bc98b':r.status==='rejected'?'#dd8a8a':'var(--gold)';
    return `<div class="coupon-row" style="align-items:flex-start">
      <div style="flex:1;min-width:220px">
        <div style="color:var(--gold);letter-spacing:.12em;font-size:.85rem">${'★'.repeat(rt)}${'☆'.repeat(5-rt)} <span style="color:${col};font-size:.62rem;letter-spacing:.12em;text-transform:uppercase;margin-left:.6rem">${esc(r.status)}</span></div>
        <div style="font-size:.88rem;color:var(--cream);margin:.5rem 0;line-height:1.6;white-space:pre-line">${esc(r.text)}</div>
        <div style="font-size:.7rem;color:var(--muted)">${esc(r.name)}${r.email?' · '+esc(r.email):''} · ${esc(r.date||'')}</div>
      </div>
      <div style="display:flex;gap:.5rem;flex-wrap:wrap">
        ${r.status!=='approved'?`<button class="filter-btn" onclick="setReviewStatus('${r.id}','approved')">Approve</button>`:''}
        ${r.status!=='rejected'?`<button class="filter-btn" onclick="setReviewStatus('${r.id}','rejected')">Reject</button>`:''}
        <button class="filter-btn" onclick="deleteReview('${r.id}')">Delete</button>
      </div>
    </div>`;
  }).join('');
}


function goToCategory(cat){
  selectedCategories=[cat];
  showCollectionPage();
}

function selectCardSizeDropdown(id,selectEl){
  const idx=Number(selectEl.value);
  selectedSizes[id]=idx;
  const p=products.find(pr=>pr.id===id);
  if(!p) return;
  const s=p.sizes[idx];
  const card=selectEl.closest('.product-card');
  const priceEl=card?card.querySelector('.card-price'):document.getElementById('price_'+id);
  if(priceEl) priceEl.innerHTML=priceHTML(s.price||0,s.ml||0,p);
  const hasStock=Number(s.stock)>0;
  const addBtn=card?card.querySelector('.add-to-cart'):null;
  if(addBtn){
    addBtn.disabled=!hasStock;
    addBtn.textContent=hasStock?'Add to Cart':'Unavailable';
    addBtn.style.opacity=hasStock?'':'.4';
    addBtn.style.cursor=hasStock?'':'not-allowed';
  }
}

// ── COLLECTION PAGE (full catalog: category, price, brand, stock, search, sort) ──
function renderCollection(){
  renderCategoryChecklist();
  renderSeasonChecklist();
  renderBrandChecklist();
  syncShopControls();

  const grid=document.getElementById('collectionGrid');
  const empty=document.getElementById('collectionEmptyState');
  let list=[...products];

  if(collectionStockFilter!=='all') list=list.filter(p=>productInStock(p)===collectionStockFilter);

  if(selectedCategories.length>0) list=list.filter(p=>getCats(p).some(c=>selectedCategories.includes(c)));

  if(selectedSeasons.length>0) list=list.filter(p=>{ const ss=getSeasons(p); return !ss.length || ss.some(s=>selectedSeasons.includes(s)); });

  if(selectedBrands.length>0) list=list.filter(p=>selectedBrands.includes(p.brand));

  list=list.filter(p=>{
    const minPrice=Math.min(...p.sizes.map(s=>s.price));
    return minPrice>=shopPriceMin && minPrice<=shopPriceMax;
  });

  if(shopSearchQuery){
    const q=shopSearchQuery.toLowerCase();
    list=list.filter(p=>(p.name||'').toLowerCase().includes(q) || (p.brand||'').toLowerCase().includes(q));
  }

  if(shopSortMode==='price_asc') list.sort((a,b)=>Math.min(...a.sizes.map(s=>s.price))-Math.min(...b.sizes.map(s=>s.price)));
  else if(shopSortMode==='price_desc') list.sort((a,b)=>Math.min(...b.sizes.map(s=>s.price))-Math.min(...a.sizes.map(s=>s.price)));
  else if(shopSortMode==='name_asc') list.sort((a,b)=>a.name.localeCompare(b.name));
  else if(shopSortMode==='latest') list.sort((a,b)=>(Number(b.id)||0)-(Number(a.id)||0));

  const countEl=document.getElementById('shopResultsCount');
  if(countEl) countEl.textContent=`Showing ${list.length} of ${products.length} results`;

  if(!list.length){ grid.innerHTML='';empty.style.display='block';return; }
  empty.style.display='none';
  grid.innerHTML=list.map((p,idx)=>buildProductCard(p,idx)).join('');
  list.forEach(p=>{ if(selectedSizes[p.id]===undefined) selectedSizes[p.id]=0; });
  observeReveals();
}

function syncShopControls(){
  const maxEl=document.getElementById('priceMaxInput');
  if(maxEl && document.activeElement!==maxEl){
    maxEl.value=shopPriceMax;
    const label=document.getElementById('priceCurrentLabel');
    if(label) label.textContent='৳'+shopPriceMax.toLocaleString();
  }
  const sortEl=document.getElementById('sortSelect');
  if(sortEl) sortEl.value=shopSortMode;
}

function renderCategoryChecklist(){
  const wrap=document.getElementById('categoryChecklist');
  if(!wrap) return;
  wrap.innerHTML=SHOP_CATEGORIES.map(c=>{
    const checked=selectedCategories.includes(c)?'checked':'';
    const count=products.filter(p=>getCats(p).includes(c)).length;
    return `<label class="sidebar-check"><input type="checkbox" name="category" ${checked} onchange="toggleCategoryFilter('${c}',this)"/> ${c} <span class="scount">(${count})</span></label>`;
  }).join('');
}

function toggleCategoryFilter(cat,cb){
  if(cb.checked){ if(!selectedCategories.includes(cat)) selectedCategories.push(cat); }
  else { selectedCategories=selectedCategories.filter(c=>c!==cat); }
  renderCollection();
}

function renderSeasonChecklist(){
  const wrap=document.getElementById('seasonChecklist');
  if(!wrap) return;
  wrap.innerHTML=SHOP_SEASONS.map(s=>{
    const checked=selectedSeasons.includes(s)?'checked':'';
    return `<label class="sidebar-check"><input type="checkbox" name="season" ${checked} onchange="toggleSeasonFilter('${s}',this)"/> ${s}</label>`;
  }).join('');
}

function toggleSeasonFilter(season,cb){
  if(cb.checked){ if(!selectedSeasons.includes(season)) selectedSeasons.push(season); }
  else { selectedSeasons=selectedSeasons.filter(s=>s!==season); }
  renderCollection();
}

function renderBrandChecklist(){
  const wrap=document.getElementById('brandChecklist');
  const btn=document.getElementById('brandSeeMoreBtn');
  if(!wrap) return;
  const allBrands=getAllBrands();
  const inUse=allBrands.filter(b=>products.some(p=>p.brand===b)||selectedBrands.includes(b));
  const brandsToShow=brandShowAll?allBrands:inUse.concat(allBrands.filter(b=>!inUse.includes(b))).slice(0,Math.max(BRAND_COLLAPSED_COUNT,Math.min(inUse.length,8)));
  wrap.innerHTML=brandsToShow.map(b=>{
    const checked=selectedBrands.includes(b)?'checked':'';
    const count=products.filter(p=>p.brand===b).length;
    return `<label class="sidebar-check"><input type="checkbox" name="brand" ${checked} onchange="toggleBrandFilter('${b.replace(/'/g,"\\'")}',this)"/> ${b} <span class="scount">${count?'('+count+')':''}</span></label>`;
  }).join('');
  if(btn) btn.innerHTML=`<span class="brand-see-more-icon">${brandShowAll?'−':'+'}</span> ${brandShowAll?'See Less':'See More'}`;
}

function toggleBrandSeeMore(){
  brandShowAll=!brandShowAll;
  renderBrandChecklist();
}

function toggleBrandFilter(brand,cb){
  if(cb.checked){ if(!selectedBrands.includes(brand)) selectedBrands.push(brand); }
  else { selectedBrands=selectedBrands.filter(b=>b!==brand); }
  renderCollection();
}

let priceDebounceTimer=null;
function onPriceSliderInput(val){
  const v=Number(val)||0;
  const label=document.getElementById('priceCurrentLabel');
  if(label) label.textContent='৳'+v.toLocaleString();
  shopPriceMin=0;
  shopPriceMax=v;
  clearTimeout(priceDebounceTimer);
  priceDebounceTimer=setTimeout(renderCollection,120);
}

function applyPriceFilter(){
  shopPriceMin=0;
  shopPriceMax=Number(document.getElementById('priceMaxInput').value)||10000;
  renderCollection();
}

function applySort(){
  shopSortMode=document.getElementById('sortSelect').value;
  renderCollection();
}

function clearAllFilters(){
  selectedCategories=[];
  selectedSeasons=[];
  selectedBrands=[];
  brandShowAll=false;
  shopPriceMin=0;
  shopPriceMax=10000;
  shopSortMode='default';
  shopSearchQuery='';
  renderCollection();
  showToast('✓ Filters cleared.');
}

function renderManageGrid(){
  const grid=document.getElementById('manageGrid');
  const empty=document.getElementById('manageEmpty');
  const countEl=document.getElementById('manageCount');
  const statsEl=document.getElementById('manageStats');
  if(!grid) return;
  if(countEl) countEl.textContent = products.length ? `${products.length} product${products.length===1?'':'s'} in catalogue` : '';
  if(statsEl){
    if(!products.length){ statsEl.innerHTML=''; }
    else {
      const total=products.length;
      const bestsellers=products.filter(p=>p.bestseller).length;
      const outOfStock=products.filter(p=>!productInStock(p)).length;
      const inStock=total-outOfStock;
      statsEl.innerHTML = `
      <div class="stat-pill"><div class="stat-pill-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8 12 3 3 8v8l9 5 9-5Z"/><path d="M3 8l9 5 9-5"/><path d="M12 13v8"/></svg></div><div><div class="stat-pill-num">${total}</div><div class="stat-pill-label">Total Products</div></div></div>
      <div class="stat-pill accent-in"><div class="stat-pill-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></div><div><div class="stat-pill-num">${inStock}</div><div class="stat-pill-label">In Stock</div></div></div>
      <div class="stat-pill accent-out"><div class="stat-pill-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="m9.5 9.5 5 5m0-5-5 5"/></svg></div><div><div class="stat-pill-num">${outOfStock}</div><div class="stat-pill-label">Out of Stock</div></div></div>
      <div class="stat-pill"><div class="stat-pill-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2.5 14.9 9l7 .6-5.3 4.6 1.6 6.9-6.2-3.7-6.2 3.7 1.6-6.9L2.1 9.6l7-.6Z"/></svg></div><div><div class="stat-pill-num">${bestsellers}</div><div class="stat-pill-label">Best Sellers</div></div></div>`;
    }
  }
  if(!products.length){ grid.innerHTML='';if(empty)empty.style.display='block';return; }
  if(empty) empty.style.display='none';
  grid.innerHTML=products.map(p=>{
    const sizes=(p.sizes&&p.sizes.length)?p.sizes:[];
    const inStock=productInStock(p);
    const statusBadge = !inStock
      ? '<span class="badge badge-out">Out of Stock</span>'
      : '<span class="badge badge-in">In Stock</span>';
    return `
    <div class="pm-card" data-pid="${p.id}">
      <div class="pm-card-img">
        ${p.photo?`<img alt="" src="${p.photo}"/>`:'<div class="pm-card-img-placeholder"><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.4"/><path d="m21 16-5-5-4 4-3-3-5 5"/></svg></div>'}
        <div class="pm-card-badge">${statusBadge}</div>
      </div>
      <div class="pm-card-body">
        <div class="pm-card-brand">${p.brand||'Others'}${p.bestseller?' <span class="badge badge-star" style="padding:.15rem .45rem">★ Best Seller</span>':''}${productDiscountPct(p)>0?` <span class="badge badge-in" style="padding:.15rem .45rem">${+productDiscountPct(p).toFixed(2)}% OFF</span>`:''}</div>
        <div class="pm-card-name">${p.name||'Untitled'}</div>
        <div class="pm-sizes">${sizes.map(s=>{
          const st=Number(s.stock)||0;
          const clr = st<=0 ? '#c97070' : (st<=5 ? '#e8c87a' : '#8B9E8A');
          return `<span class="pm-size-chip">${s.ml}ml · ৳${s.price} · <span style="color:${clr}">${st}</span></span>`;
        }).join('')}</div>
        <div class="pm-card-actions">
          <button class="pm-btn" onclick="editProduct(${p.id})"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>Edit</button>
          <button class="pm-btn danger" onclick="deleteProduct(${p.id})"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>Delete</button>
        </div>
      </div>
    </div>`;
  }).join('');
}

function clearAllProducts(){
  if(!confirm('This will permanently remove ALL products from the catalogue. Continue?')) return;
  products=[];
  syncProducts();
  cart=[]; saveCart(); renderCart();
  renderProducts(); renderCollection(); renderManageGrid(); renderInventory();
  showToast('✓ All products cleared. Catalogue is fresh.','success');
}

function deleteProduct(id){
  const prod=products.find(p=>p.id===id);
  if(!confirm('Remove '+(prod?'“'+prod.name+'”':'this product')+'?')) return;
  products=products.filter(p=>p.id!==id); syncProducts();
  // also drop it from the current cart so checkout can't hit a ghost item
  if(cart.some(i=>i.id===id)){ cart=cart.filter(i=>i.id!==id); saveCart(); renderCart(); }
  renderProducts(); renderCollection(); renderManageGrid(); renderInventory();
  showToast('✓ '+(prod?'“'+prod.name+'”':'Product')+' removed.','success');
}

// ── MODAL ────────────────────────────────────────────────────────────────────
// ── RECENTLY VIEWED ("Decants You Looked At") — separate history per account ──
// Customer → saved inside their own user record  (Supabase table: users → data.recentViewed)
// Admin    → saved inside the admin record       (Supabase table: admin_creds → data.recentViewed)
// Guest    → this browser only (never uploaded)  (localStorage: essentra_recent_guest)
function getRecentOwner(){
  if(session && session.type==='admin') return {kind:'admin', obj:adminCreds};
  if(session && session.type==='customer'){
    const u=users.find(x=>x.email===session.email);
    if(u) return {kind:'customer', obj:u};
  }
  return {kind:'guest', obj:null};
}
function getRecentIds(){
  const o=getRecentOwner();
  if(o.kind==='guest'){ const r=load(RECENT_KEY_GUEST); return Array.isArray(r)?r:[]; }
  return Array.isArray(o.obj.recentViewed)?o.obj.recentViewed:[];
}
function setRecentIds(ids){
  const o=getRecentOwner();
  if(o.kind==='guest'){ save(RECENT_KEY_GUEST,ids); return; }
  o.obj.recentViewed=ids;
  if(o.kind==='admin') syncAdminCredsCloud(); else syncUsersCloud();
}
function recordRecentlyViewed(id){
  const ids=getRecentIds().filter(x=>x!==id); ids.unshift(id);
  setRecentIds(ids.slice(0,RECENT_MAX));
  renderRecentlyViewed();
}
function clearRecentlyViewed(){ setRecentIds([]); renderRecentlyViewed(); }
function renderRecentlyViewed(){
  const sec=document.getElementById('recentSection'), grid=document.getElementById('recentGrid');
  if(!sec||!grid) return;
  const list=getRecentIds().map(id=>products.find(p=>p.id===id)).filter(Boolean);
  if(!list.length){ sec.style.display='none'; grid.innerHTML=''; return; }
  sec.style.display='';
  grid.innerHTML=list.map((p,idx)=>{
    const prices=(p.sizes||[]).map(s=>Number(s.price)||0);
    const min=prices.length?Math.min(...prices):0;
    const img=p.photo?`<img class="card-img" src="${p.photo}" alt="${(p.name||'Fragrance').replace(/"/g,'&quot;')}" width="300" height="400" loading="lazy" decoding="async"/>`:`<div class="product-img-placeholder">${BOTTLE_SVG}</div>`;
    return `<div class="product-card reveal" style="transition-delay:${Math.min(idx*70,420)}ms">
      <div class="card-image-wrap" onclick="openModal(${p.id})">${img}${discountBadgeHTML(p)}${(!productInStock(p))?'<div class="out-of-stock-badge">Out of Stock</div>':''}</div>
      <div class="card-body">
        <div class="card-brand">${p.brand||'Others'}</div>
        <div class="card-name" onclick="openModal(${p.id})">${p.name||'Untitled Fragrance'}</div>
        <div class="card-footer"><div class="card-price">From ${priceHTML(min,0,p)}</div></div>
      </div>
    </div>`;
  }).join('');
  observeReveals(grid);
}
function openModal(id){
  const p=products.find(pr=>pr.id===id); if(!p) return;
  recordRecentlyViewed(id);
  currentModalProduct=p; currentModalSizeIdx=0;
  document.getElementById('modalBrand').textContent=p.brand;
  document.getElementById('modalName').textContent=p.name;
  const _d=document.getElementById('modalDesc'); _d.textContent=p.desc||''; document.getElementById('modalDescWrap').style.display=p.desc?'':'none';

  // Badges row: SKU, stock status, category, fragrance type
  const totalStock=(p.sizes||[]).reduce((s,sz)=>s+(Number(sz.stock)||0),0);
  const inStock=totalStock>0;
  const sku='F-'+String(p.id).padStart(4,'0');
  let badgesHTML=`<span class="modal-badge modal-badge-stock${inStock?'':' oos'}"><i></i>${inStock?'In Stock':'Out of Stock'}</span>`;
  getCats(p).forEach(c=>{ badgesHTML+=`<span class="modal-badge modal-badge-tag">${c}</span>`; });
  if(p.type) badgesHTML+=`<span class="modal-badge modal-badge-tag">${TYPE_LABELS[p.type]||p.type}</span>`;
  badgesHTML+=`<span class="modal-badge modal-badge-sku">${sku}</span>`;
  if(p.batch) badgesHTML+=`<span class="modal-badge modal-badge-tag">Batch: ${String(p.batch).replace(/</g,'&lt;')}</span>`;
  document.getElementById('modalBadges').innerHTML=badgesHTML;

  // Notes: Top / Heart / Base rendered as centered text within individual tier cards
  const notesGridEl=document.getElementById('modalNotesGrid');
  let notesMap={top:p.topNotes||'',heart:p.middleNotes||'',base:p.baseNotes||''};
  if(!notesMap.top&&!notesMap.heart&&!notesMap.base&&p.notes){
    notesMap=parseLegacyNotes(p.notes);
  }
  const noteCols=[['top','Top'],['heart','Heart'],['base','Base']].filter(([k])=>notesMap[k]);
  const chips=t=>String(t).split(/[,;·\n]+/).map(x=>x.trim()).filter(Boolean).map(x=>`<span class="qv-chip">${x}</span>`).join('');
  if(noteCols.length){
    notesGridEl.innerHTML=noteCols.map(([k,label])=>`<div class="qv-note"><div class="qv-note-label">${label}</div><div class="qv-note-chips">${chips(notesMap[k])}</div></div>`).join('');
    notesGridEl.hidden=false;
  } else if(p.notes){
    notesGridEl.innerHTML=`<div class="qv-note"><div class="qv-note-label">Notes</div><div class="qv-note-chips">${chips(p.notes)}</div></div>`;
    notesGridEl.hidden=false;
  } else {
    notesGridEl.innerHTML='';
    notesGridEl.hidden=true;
  }
  document.getElementById('modalNotesWrap').style.display=notesGridEl.hidden?'none':'';
  const imgEl=document.getElementById('modalImg');
  imgEl.innerHTML=(p.photo?`<img src="${p.photo}" alt=""/>`:`<div class="modal-img-ph">${BOTTLE_SVG}</div>`)+discountBadgeHTML(p)+wishHeartHTML(p.id);
  currentModalSizeIdx = p.sizes.findIndex(s=>Number(s.stock)>0);
  if(currentModalSizeIdx<0) currentModalSizeIdx=0;
  modalAtomizerOn=false;
  document.getElementById('modalSizes').innerHTML=p.sizes.map((s,i)=>{
    const oos=!(Number(s.stock)>0);
    return `<button class="modal-size-chip${i===currentModalSizeIdx?' selected':''}${oos?' modal-size-chip-oos':''}" ${oos?'disabled':''} onclick="selModalSize(${i},this)"><span class="msc-ml">${s.ml}ml</span><span class="msc-price">${oos?'Sold out':'৳'+(getDiscountedPrice(Number(s.price)||0,p)).toLocaleString()}</span></button>`;
  }).join('');
  renderModalAtomizer();
  updateModalPrice();
  document.getElementById('productModal').classList.add('open');
  document.body.style.overflow='hidden';
  resetScrollIn(document.getElementById('productModal'));
  requestAnimationFrame(()=>resetScrollIn(document.getElementById('productModal')));
  setTimeout(()=>resetScrollIn(document.getElementById('productModal')),60);
}
function selModalSize(idx,btn){
  currentModalSizeIdx=idx;
  document.querySelectorAll('.modal-size-chip').forEach(c=>c.classList.remove('selected'));
  btn.classList.add('selected');
  modalAtomizerOn=false;          // atomizer is per-size and always opt-in
  renderModalAtomizer(); updateModalPrice();
}
function renderModalAtomizer(){
  const wrap=document.getElementById('modalAtomizerWrap'), box=document.getElementById('modalAtomizer');
  if(!wrap||!box) return;
  const s=currentModalProduct && currentModalProduct.sizes ? currentModalProduct.sizes[currentModalSizeIdx] : null;
  const a=s?getAtomizerForMl(s.ml):null;
  if(!a){ wrap.style.display='none'; box.innerHTML=''; modalAtomizerOn=false; return; }
  wrap.style.display='';
  box.innerHTML=`<button type="button" class="atz-card${modalAtomizerOn?' on':''}" aria-pressed="${modalAtomizerOn?'true':'false'}" onclick="toggleModalAtomizer()">
    <span class="atz-img">${a.photo?`<img alt="" src="${esc(a.photo)}"/>`:ATOMIZER_SVG}</span>
    <span class="atz-info"><span class="atz-title">${esc(a.ml)}ml Premium Atomizer</span><span class="atz-note">Optional extra · discounts don't apply</span></span>
    <span class="atz-price">+৳${Math.round(Number(a.price)||0).toLocaleString()}</span>
    <span class="atz-check" aria-hidden="true">${modalAtomizerOn?'✓':'+'}</span>
  </button>`;
}
function toggleModalAtomizer(){ modalAtomizerOn=!modalAtomizerOn; renderModalAtomizer(); updateModalPrice(); }
function updateModalPrice(){
  const s=currentModalProduct.sizes[currentModalSizeIdx];
  const atz=modalAtomizerOn?getAtomizerForMl(s.ml):null;
  document.getElementById('modalPrice').innerHTML = atz
    ? `৳${(getDiscountedPrice(s.price||0,currentModalProduct)+Math.round(Number(atz.price)||0)).toLocaleString()} <span style="font-size:.68rem;font-weight:500;color:var(--muted)">with atomizer</span>`
    : priceHTML(s.price||0,0,currentModalProduct);
  const addBtn=document.querySelector('.modal-add');
  const hasStock=Number(s.stock)>0;
  if(addBtn){
    addBtn.disabled=!hasStock;
    addBtn.textContent=hasStock?'Add to Cart':'Out of Stock';
    addBtn.style.opacity=hasStock?'':'.4';
    addBtn.style.cursor=hasStock?'':'not-allowed';
  }
}
function closeModal(){ document.getElementById('productModal').classList.remove('open');document.body.style.overflow=''; resetScrollIn(document.getElementById('productModal')); }
function addModalToCart(){
  const s=currentModalProduct.sizes[currentModalSizeIdx];
  if(!s || !(Number(s.stock)>0)){ showToast('This size is out of stock.'); return; }
  addToCart(currentModalProduct,s,modalAtomizerOn?getAtomizerForMl(s.ml):null);
  closeModal();
}

// ── CART ─────────────────────────────────────────────────────────────────────
function addFromCard(id){
  const p=products.find(pr=>pr.id===id); if(!p) return;
  const idx=selectedSizes[id]||0;
  const size=p.sizes[idx];
  if(!size || !(Number(size.stock)>0)){ showToast('This size is out of stock.'); return; }
  addToCart(p,size);
}
function addToCart(product,size,atomizer){
  const key=`${product.id}_${size.ml}`;
  const avail=Number(size.stock)||0;
  const ex=cart.find(i=>i.key===key);
  if(ex){
    if(ex.qty+1>avail){ showToast('No more stock available for this size.'); return; }
    ex.qty++;
  } else {
    if(avail<1){ showToast('This size is out of stock.'); return; }
    cart.push({key,id:product.id,name:product.name,brand:product.brand,ml:size.ml,price:getDiscountedPrice(size.price,product),photo:product.photo||null,qty:1});
  }
  if(atomizer) addAtomizerLine(product,size,atomizer);
  saveCart(); renderCart();
  showToast(`✓ ${product.name} (${size.ml}ml) added${atomizer?' with premium atomizer':''}.`);
}
// Atomizer is its own cart line (full price, no discount) linked to the perfume line by key
function addAtomizerLine(product,size,a){
  const key=`${product.id}_${size.ml}_atz`;
  const ex=cart.find(i=>i.key===key);
  if(ex){ ex.qty++; return; }
  cart.push({key,id:product.id,atomizer:true,atomizerId:a.id,name:`Premium Atomizer — ${product.name}`,brand:'Extra',ml:a.ml,price:Math.round(Number(a.price)||0),photo:a.photo||null,qty:1});
}
function updateQty(key,delta){
  const item=cart.find(i=>i.key===key);
  if(!item) return;
  if(delta>0 && !item.atomizer){
    const prod=products.find(pr=>pr.id===item.id);
    const size=prod && prod.sizes ? prod.sizes.find(s=>String(s.ml)===String(item.ml)) : null;
    const avail=size?(Number(size.stock)||0):Infinity;
    if(item.qty+delta>avail){ showToast('No more stock available for this size.'); return; }
  }
  item.qty+=delta;
  if(item.qty<=0) cart=cart.filter(i=>i.key!==key && i.key!==key+'_atz');
  saveCart(); renderCart();
}
function removeFromCart(key){ cart=cart.filter(i=>i.key!==key && i.key!==key+'_atz');saveCart();renderCart();showToast('Item removed from cart.','info'); }

function renderCart(){
  refreshAtomizerLines(); refreshCartPrices();
  const subtotal=cart.reduce((s,i)=>s+i.price*i.qty,0);
  const tier=getTierDiscount(subtotal);
  const delivery=cart.length?calcDelivery(subtotal-tier.amount,'inside'):0;
  const total=subtotal-tier.amount+(cart.length?delivery:0);
  const count=cart.reduce((n,i)=>n+(Number(i.qty)||0),0);
  const cartCountEl=document.getElementById('cartCount');
  if(cartCountEl.textContent!==String(count)){
    cartCountEl.textContent=count;
    cartCountEl.classList.remove('badge-bump');
    void cartCountEl.offsetWidth;
    cartCountEl.classList.add('badge-bump');
  }
  document.getElementById('cartSubtotal').textContent=`৳ ${subtotal.toLocaleString()}`;
  const fa=Number(settings.freeabove)||0;
  if(cart.length && fa>0 && (subtotal-tier.amount)>=fa){
    document.getElementById('deliveryAmt').textContent='FREE';
    document.getElementById('deliveryLabel').textContent='Delivery';
  } else if(cart.length){
    document.getElementById('deliveryAmt').textContent=`from ৳ ${delivery}`;
    document.getElementById('deliveryLabel').textContent='Delivery';
  } else {
    document.getElementById('deliveryAmt').textContent='৳ —';
  }
  document.getElementById('cartTotal').textContent=`৳ ${total.toLocaleString()}`;
  const el=document.getElementById('cartItems');
  if(!cart.length){ el.innerHTML='<div class="cart-empty">Your cart is empty.<br/>Explore our collection.</div>';return; }
  el.innerHTML=cart.map(i=>`
    <div class="cart-item">
      <div class="cart-item-img">${i.photo?`<img alt="" src="${i.photo}"/>`:'🧴'}</div>
      <div class="cart-item-info">
        <div class="cart-item-name">${i.name}</div>
        <div class="cart-item-size">${i.brand} · ${i.ml}ml</div>
        <div class="cart-item-price">৳ ${(i.price*i.qty).toLocaleString()}</div>
        <div class="cart-item-qty">
          <button class="qty-btn" onclick="updateQty('${i.key}',-1)">−</button>
          <span class="qty-val">${i.qty}</span>
          <button class="qty-btn" onclick="updateQty('${i.key}',1)">+</button>
        </div>
      </div>
      <button class="cart-item-remove" onclick="removeFromCart('${i.key}')">Remove</button>
    </div>`).join('');
}
function toggleCart(){ document.getElementById('cartSidebar').classList.toggle('open'); }

// ── CHECKOUT ─────────────────────────────────────────────────────────────────
async function openCheckout(){
  if(!cart.length){ showToast('Your cart is empty.'); return; }
  let member=null;
  try{ member=await getMembershipCustomer(); }catch(e){ console.error('Membership check failed',e); }
  if(!member){ openMembershipGate(); return; }
  session={type:'customer',email:member.profile.email,name:member.profile.full_name,authUserId:member.profile.id}; saveSession();
  const cartSidebar=document.getElementById('cartSidebar'); if(cartSidebar.classList.contains('open')) cartSidebar.classList.remove('open');
  updateDeliveryZoneLabels();
  coInitLocation();
  document.getElementById('checkoutMain').style.display='';
  document.getElementById('orderSuccess').style.display='none';
  appliedCoupon=null;
  appliedPoints=0;
  document.getElementById('co-couponCode').value='';
  document.getElementById('couponApplyRow').style.display='';
  document.getElementById('couponAppliedMsg').style.display='none';
  document.getElementById('couponErrorMsg').style.display='none';
  document.getElementById('co-pointsAmt').value='';
  document.getElementById('pointsApplyRow').style.display='';
  document.getElementById('pointsAppliedMsg').style.display='none';
  document.getElementById('pointsErrorMsg').style.display='none';
  const pointsBlock=document.getElementById('pointsRedeemBlock');
  const currentUser=(session && session.type==='customer') ? users.find(u=>u.email===session.email) : null;
  if(currentUser){
    pointsBlock.style.display='block';
    document.getElementById('pointsAvailableLabel').textContent=(currentUser.points||0).toLocaleString();
  } else {
    pointsBlock.style.display='none';
  }
  renderCheckoutSummary();
  updatePaymentInstructions();
  if(session && session.type==='customer'){
    const user=users.find(u=>u.email===session.email);
    if(user){
      if(!document.getElementById('co-name').value) document.getElementById('co-name').value=user.name||'';
      if(!document.getElementById('co-phone').value) document.getElementById('co-phone').value=user.phone||'';
      if(!document.getElementById('co-email').value) document.getElementById('co-email').value=user.email||'';
    }
  }
  document.getElementById('checkoutOverlay').classList.add('open');
  document.getElementById('checkoutOverlay').scrollTop=0;
  document.body.style.overflow='hidden';
}
function closeCheckout(){
  document.getElementById('checkoutOverlay').classList.remove('open');
  document.body.style.overflow='';
}

// Spend-based discounts are no longer automatic — admin creates a coupon (with Minimum Order) instead.
function getTierDiscount(){ return {pct:0,min:0,amount:0}; }
function couponUsedCount(code){ return orders.filter(o=>o.coupon&&o.coupon.code===code).length; }
function couponExhausted(c){ const lim=Number(c.limit)||0; return lim>0 && couponUsedCount(c.code)>=lim; }
// returns error string, or '' if the coupon can be used right now
function couponError(c,subtotal){
  if(!c||!c.active||couponExhausted(c)) return 'Invalid or inactive coupon code.';
  if(c.min && subtotal<c.min) return `This coupon requires a minimum order of ৳${c.min.toLocaleString()}.`;
  if(c.newOnly){
    if(!(session && session.type==='customer')) return 'Please sign in with a new account to use this coupon.';
    const email=session.email;
    if(orders.some(o=>o.customerEmail===email)) return 'This coupon is only for your first order after creating an account.';
  }
  return '';
}
function ensureWelcomeCoupon(){
  if(settings.welcomeSeeded || coupons.some(c=>c.code==='WELCOME10')) return;
  settings.welcomeSeeded=true;
  coupons.unshift({code:'WELCOME10',type:'percent',value:10,min:0,limit:0,newOnly:true,active:true,created:new Date().toLocaleString('en-BD',{dateStyle:'medium',timeStyle:'short'})});
  syncCouponsCloud(); syncSettingsCloud();
}
function calcCouponDiscount(coupon,subtotal){
  if(!coupon) return 0;
  if(coupon.min && subtotal<coupon.min) return 0;
  let d = coupon.type==='percent' ? Math.round(subtotal*coupon.value/100) : coupon.value;
  const cap=Number(coupon.upto)||0; // admin-only max discount (৳); 0 = no cap
  if(cap>0) d=Math.min(d,cap);
  return Math.min(d,subtotal);
}

function applyCouponCode(){
  const code=document.getElementById('co-couponCode').value.trim().toUpperCase();
  const errEl=document.getElementById('couponErrorMsg');
  errEl.style.display='none';
  if(appliedCoupon){ errEl.textContent='Only one coupon can be used at a time. Remove the current coupon first.'; errEl.style.display='block'; return; }
  if(!code){ errEl.textContent='Please enter a coupon code.'; errEl.style.display='block'; return; }
  const coupon=coupons.find(c=>c.code===code);
  const subtotal=cartMerchSubtotal();   // atomizer is excluded from coupons
  const cErr=couponError(coupon,subtotal);
  if(cErr){ errEl.textContent=cErr; errEl.style.display='block'; return; }
  appliedCoupon=coupon;
  document.getElementById('couponApplyRow').style.display='none';
  const msgEl=document.getElementById('couponAppliedMsg');
  msgEl.innerHTML=`<span>✓ Coupon "${coupon.code}" applied</span> <button type="button" class="link-btn" onclick="removeCoupon()">Remove</button>`;
  msgEl.style.display='flex';
  renderCheckoutSummary();
}

function removeCoupon(){
  appliedCoupon=null;
  document.getElementById('co-couponCode').value='';
  document.getElementById('couponApplyRow').style.display='';
  document.getElementById('couponAppliedMsg').style.display='none';
  document.getElementById('couponErrorMsg').style.display='none';
  renderCheckoutSummary();
}

function applyPointsRedemption(){
  const errEl=document.getElementById('pointsErrorMsg');
  errEl.style.display='none';
  const currentUser=(session && session.type==='customer') ? users.find(u=>u.email===session.email) : null;
  if(!currentUser){ errEl.textContent='Please sign in to redeem Essentra Points.'; errEl.style.display='block'; return; }
  const amt=Math.floor(Number(document.getElementById('co-pointsAmt').value));
  if(!amt || amt<=0){ errEl.textContent='Please enter a valid number of points.'; errEl.style.display='block'; return; }
  const available=currentUser.points||0;
  if(amt>available){ errEl.textContent=`You only have ${available.toLocaleString()} points available.`; errEl.style.display='block'; return; }
  const subtotal=cartMerchSubtotal();   // atomizer can't be paid with points either
  const couponDiscount=Math.min(calcCouponDiscount(appliedCoupon,subtotal)+getTierDiscount(subtotal).amount,subtotal);
  const pointsValue=Number(settings.pointsValue)||1;
  const maxRedeemable=Math.floor(Math.max(subtotal-couponDiscount,0)/pointsValue);
  if(amt>maxRedeemable){ errEl.textContent=`You can redeem at most ${maxRedeemable.toLocaleString()} points on this order.`; errEl.style.display='block'; return; }
  appliedPoints=amt;
  document.getElementById('pointsApplyRow').style.display='none';
  const msgEl=document.getElementById('pointsAppliedMsg');
  msgEl.innerHTML=`<span>✓ ${amt.toLocaleString()} points applied (-৳${(amt*pointsValue).toLocaleString()})</span> <button type="button" class="link-btn" onclick="removePointsRedemption()">Remove</button>`;
  msgEl.style.display='flex';
  renderCheckoutSummary();
}

function removePointsRedemption(){
  appliedPoints=0;
  document.getElementById('co-pointsAmt').value='';
  document.getElementById('pointsApplyRow').style.display='';
  document.getElementById('pointsAppliedMsg').style.display='none';
  document.getElementById('pointsErrorMsg').style.display='none';
  renderCheckoutSummary();
}

function renderCheckoutSummary(){
  const subtotal=cart.reduce((s,i)=>s+i.price*i.qty,0);
  const merch=cartMerchSubtotal();      // discounts only ever apply to perfumes, never atomizers
  const couponOnly=calcCouponDiscount(appliedCoupon,merch);
  const tierD=getTierDiscount(merch);
  const discount=Math.min(couponOnly+tierD.amount,merch);
  const pointsDiscount=Math.min((appliedPoints||0)*(Number(settings.pointsValue)||1), Math.max(merch-discount,0));
  const zoneEl=document.getElementById('co-zone');
  const zone=zoneEl?zoneEl.value:'inside';
  const zoneChosen=zone==='inside'||zone==='outside';
  const delivery=zoneChosen?calcDelivery(subtotal-discount,zone):0;
  const total=subtotal-discount-pointsDiscount+delivery;
  const fa=Number(settings.freeabove)||0;
  document.getElementById('co-subtotal').textContent=`৳ ${subtotal.toLocaleString()}`;
  const couponLine=document.getElementById('co-couponLine');
  const tierLine=document.getElementById('co-tierLine');
  if(tierLine){
    if(tierD.amount>0){
      tierLine.style.display='';
      document.getElementById('co-tierLabel').textContent=`Spend Discount (${tierD.pct}%)`;
      document.getElementById('co-tierAmt').textContent=`-৳ ${tierD.amount.toLocaleString()}`;
    } else tierLine.style.display='none';
  }
  if(appliedCoupon && couponOnly>0){
    couponLine.style.display='';
    document.getElementById('co-couponLabel').textContent=`Coupon (${appliedCoupon.code})`;
    document.getElementById('co-couponAmt').textContent=`-৳ ${couponOnly.toLocaleString()}`;
  } else {
    couponLine.style.display='none';
  }
  const pointsLine=document.getElementById('co-pointsLine');
  if(pointsDiscount>0){
    pointsLine.style.display='';
    document.getElementById('co-pointsAmtDisplay').textContent=`-৳ ${pointsDiscount.toLocaleString()}`;
  } else {
    pointsLine.style.display='none';
  }
  document.getElementById('co-delivery').textContent=!zoneChosen?'Select zone to calculate':(fa>0&&(subtotal-discount)>=fa?'FREE':`৳ ${delivery}`);
  document.getElementById('co-deliveryLabel').textContent='Delivery';
  document.getElementById('co-total').textContent=`৳ ${total.toLocaleString()}`;
  document.getElementById('checkoutItems').innerHTML=cart.map(i=>`
    <div class="co2-item">
      <div class="co2-item-img">${i.photo?`<img alt="" src="${i.photo}"/>`:'🧴'}</div>
      <div class="co2-item-info">
        <div class="co2-item-name">${i.name}</div>
        <div class="co2-item-meta">${i.brand} · ${i.ml}ml · ৳${i.price.toLocaleString()} each</div>
      </div>
      <div class="co2-qty">
        <button type="button" class="co2-qty-btn" aria-label="Decrease quantity" onclick="coUpdateQty('${i.key}',-1)">−</button>
        <span class="co2-qty-val">${i.qty}</span>
        <button type="button" class="co2-qty-btn" aria-label="Increase quantity" onclick="coUpdateQty('${i.key}',1)">+</button>
      </div>
      <div class="co2-item-sub">৳ ${(i.price*i.qty).toLocaleString()}</div>
      <button type="button" class="co2-item-x" aria-label="Remove item" onclick="coRemove('${i.key}')">✕</button>
    </div>`).join('');
}

function selectPayment(method,label){
  selectedPayment=method;
  document.querySelectorAll('.payment-method').forEach(m=>m.classList.remove('selected'));
  label.classList.add('selected');
  updatePaymentInstructions();
}

function updatePaymentInstructions(){
  const inst=document.getElementById('pmInstructions');
  const title=document.getElementById('pmInstTitle');
  const body=document.getElementById('pmInstBody');
  const trxField=document.getElementById('trxField');
  const numMap={bkash:settings.bkash,nagad:settings.nagad,rocket:settings.rocket};
  if(selectedPayment==='cod'){
    title.textContent='Cash on Delivery';
    body.textContent=`Pay when you receive your order. Our team will call you to confirm your delivery. Contact: ${settings.phone||'[Set phone in Settings]'}`;
    trxField.style.display='none';
  } else {
    const num=numMap[selectedPayment]||'[Set number in Admin → Settings]';
    const names={bkash:'bKash',nagad:'Nagad',rocket:'Rocket'};
    title.textContent=`How to pay via ${names[selectedPayment]}`;
    body.innerHTML=`1. Open your ${names[selectedPayment]} app<br>2. Send Money / Pay to: <strong style="color:var(--champagne)">${num}</strong><br>3. Send the exact order total<br>4. Copy the Transaction ID (TrxID) and paste it below.`;
    trxField.style.display='block';
  }
}

let __placing=false;
async function placeOrder(){
  if(__placing) return;
  const btn=document.querySelector('.place-order-btn');
  __placing=true;
  if(btn){ btn.disabled=true; btn.dataset.label=btn.textContent; btn.textContent='Placing order…'; }
  try{ await _placeOrderImpl(); }
  catch(e){ console.error('Place order failed',e); showToast('We could not place your order. Please check your connection and try again.','error'); }
  finally{ __placing=false; if(btn){ btn.disabled=false; btn.textContent=btn.dataset.label||'Place Order'; } }
}
async function _placeOrderImpl(){
  let membership;
  try{ membership=await getMembershipCustomer(); }catch(e){ membership=null; }
  if(!membership){ closeCheckout(); openMembershipGate(); showToast('Please sign in before placing an order.','error'); return; }
  if(!cart.length){ showToast('Your cart is empty.','error'); return; }
  const name=clean(document.getElementById('co-name').value,60);
  const phone=clean(document.getElementById('co-phone').value,20);
  const address=clean(document.getElementById('co-address').value,250);
  if(!name||!phone||!address){ showToast('Please fill in name, phone & address.','error'); return; }
  const _city=document.getElementById('co-city').value, _zone=document.getElementById('co-zoneSel').value, _area=document.getElementById('co-area').value;
  if(!_city||!_zone){ showToast('Please select your city and zone.','error'); return; }
  if(selectedPayment!=='cod'){
    const trx=document.getElementById('co-trxid').value.trim();
    if(!trx){ showToast('Please enter the Transaction ID.','error'); return; }
  }
  // Atomizer extras follow the admin's live list: if one was removed or re-priced, tell the customer first
  const _atzChanged=refreshAtomizerLines(), _priceChanged=refreshCartPrices();
  if(_atzChanged||_priceChanged){ renderCart(); renderCheckoutSummary(); showToast('A price or availability changed — please review your order.','error'); return; }
  // Re-check live stock: a product may have sold out / been removed while it sat in the cart
  for(const item of cart){
    if(item.atomizer) continue;
    const prod=products.find(pr=>pr.id===item.id);
    const size=prod && prod.sizes ? prod.sizes.find(x=>String(x.ml)===String(item.ml)) : null;
    const avail=size?(Number(size.stock)||0):0;
    if(!prod||!size||avail<item.qty){
      if(!prod||!size||avail<=0) cart=cart.filter(c=>c.key!==item.key); else item.qty=avail;
      saveCart(); renderCart(); renderCheckoutSummary();
      showToast('“'+item.name+' ('+item.ml+'ml)” is no longer available in that quantity — cart updated.','error');
      if(!cart.length) closeCheckout();
      return;
    }
  }
  const subtotal=cart.reduce((s,i)=>s+i.price*i.qty,0);
  const merch=cartMerchSubtotal();      // atomizer lines are excluded from coupon / points maths
  if(appliedCoupon){
    const liveC=coupons.find(c=>c.code===appliedCoupon.code);
    const cErr=couponError(liveC,merch);
    if(cErr){ showToast(cErr); removeCoupon(); renderCheckoutSummary(); return; }
  }
  const couponOnlyDiscount=calcCouponDiscount(appliedCoupon,merch);
  const tierInfo=getTierDiscount(merch);
  const couponDiscount=Math.min(couponOnlyDiscount+tierInfo.amount,merch);
  const pointsValue=Number(settings.pointsValue)||1;
  const pointsQtyRedeemed=appliedPoints||0;
  const pointsRedeemed=Math.min(pointsQtyRedeemed*pointsValue, Math.max(merch-couponDiscount,0));
  const zoneEl=document.getElementById('co-zone');
  const deliveryZone=zoneEl?zoneEl.value:'inside';
  const deliveryZoneLabel=[_area,_zone,_city].filter(Boolean).join(', ');
  const delivery=calcDelivery(subtotal-couponDiscount,deliveryZone);
  const total=subtotal-couponDiscount-pointsRedeemed+delivery;
  const nowStamp=new Date().toLocaleString('en-BD',{dateStyle:'medium',timeStyle:'short'});
  const orderId='ESS-'+Date.now();

  // Essentra Points: work out redeem/earn now, but only APPLY them after the order is saved
  // (previously points were deducted first, so a failed order still cost the customer points).
  let pointsEarned=0, applyPoints=null;
  const orderCustomerEmail=(session && session.type==='customer') ? session.email : null;
  if(orderCustomerEmail){
    const pUser=users.find(u=>u.email===orderCustomerEmail);
    if(pUser){
      const qtyUsed = pointsValue>0 ? Math.round(pointsRedeemed/pointsValue) : 0;
      const netSpend=subtotal-couponDiscount-pointsRedeemed;
      const minSpend=Number(settings.pointsMinSpend)||0;
      const perAmount=Number(settings.pointsPerAmount)||100;
      if(netSpend>=minSpend) pointsEarned=Math.floor(netSpend/perAmount);
      applyPoints=function(){
        if(pUser.points===undefined) pUser.points=0;
        if(!pUser.pointsHistory) pUser.pointsHistory=[];
        if(qtyUsed>0){
          pUser.points-=qtyUsed;
          pUser.pointsHistory.push({title:`Redeemed on order ${orderId.replace('ESS-','')}`,amount:-qtyUsed,date:nowStamp});
        }
        if(pointsEarned>0){
          pUser.points+=pointsEarned;
          pUser.pointsHistory.push({title:`Earned on order ${orderId.replace('ESS-','')}`,amount:pointsEarned,date:nowStamp});
        }
        saveUsers();
      };
    }
  }

  const order={
    id:orderId,
    date:nowStamp,
    ts:Date.now(),
    customer:{name,phone,email:clean(document.getElementById('co-email').value,80),address,district:deliveryZoneLabel,city:_city,zone:_zone,area:_area,note:clean(document.getElementById('co-note').value,300)},
    deliveryZone,
    customerEmail: orderCustomerEmail,
    items:JSON.parse(JSON.stringify(cart)),
    payment:{method:selectedPayment,trxid:selectedPayment!=='cod'?clean(document.getElementById('co-trxid').value,60):'COD'},
    coupon: appliedCoupon ? {code:appliedCoupon.code,discount:couponOnlyDiscount} : null,
    tierDiscount: tierInfo.amount>0 ? {pct:tierInfo.pct,min:tierInfo.min,discount:tierInfo.amount} : null,
    pointsRedeemed, pointsEarned,
    subtotal,delivery,total,status:'pending',
    paid:0,due:total,
    history:[{stage:'pending',title:'Pending',note:'Order placed and awaiting confirmation.',date:nowStamp}],
  };
  // The database RPC is the authority for every customer order. It verifies
  // auth.uid(), the customer profile and stock/prices before writing anything.
  // Never fall back to localStorage here: a guest must not be able to create an order.
  const {data:storedOrder,error:orderError}=await sb.rpc('place_customer_order',{p_order:order});
  if(orderError){
    console.error('Secure order placement failed',orderError);
    showToast('We could not place your order. Please try again.','error');
    return;
  }
  if(storedOrder && storedOrder.id) Object.assign(order,storedOrder);
  if(applyPoints) applyPoints(); // order is safely stored — now update the customer's points
  // Delivery is server-side and idempotent. A mail outage never rolls back a valid order.
  sb.functions.invoke('send-order-confirmation',{body:{orderId:order.id}}).catch(e=>console.warn('Order confirmation email request failed',e));
  orders.unshift(order); save('essentra_orders',orders);
  // Reduce stock for the specific size (ml) of each ordered item; auto-flips to Out of Stock at 0
  cart.forEach(item=>{
    if(item.atomizer) return;
    const prod=products.find(pr=>pr.id===item.id);
    const size=prod && prod.sizes ? prod.sizes.find(s=>String(s.ml)===String(item.ml)) : null;
    if(size){ size.stock=Math.max((Number(size.stock)||0)-item.qty,0); }
  });
  // Stock is already decremented transactionally by place_customer_order().
  renderProducts(); renderCollection(); renderManageGrid(); renderInventory();
  cart=[]; saveCart(); renderCart(); updateOrderBadge();
  appliedCoupon=null;
  appliedPoints=0;
  document.getElementById('checkoutMain').style.display='none';
  document.getElementById('orderSuccess').style.display='flex';
  document.getElementById('checkoutOverlay').scrollTop=0;
  document.getElementById('successOrderId').textContent='Order ID: '+order.id;
  window.__lastOrderId=order.id;
  document.getElementById('successMsg').textContent=
    (selectedPayment==='cod'
      ? `Thank you, ${name}! We will call ${phone} to confirm your delivery soon.`
      : `Thank you, ${name}! Your payment is being verified. We'll confirm via ${phone} within 24 hours.`)
    + (pointsEarned>0 ? ` You earned ${pointsEarned.toLocaleString()} Essentra Points on this order.` : '');
  document.getElementById('successAcctLink').style.display=(session && session.type==='customer')?'block':'none';
}

// ── ORDERS (ADMIN) ────────────────────────────────────────────────────────────
const ORDER_STAGES=['pending','paymentPaid','confirmed','billing','shipped','delivered','finished'];
const ORDER_STAGE_LABELS={pending:'Pending',paymentPaid:'Payment Paid',confirmed:'Confirmed',billing:'Billing',shipped:'Shipped',delivered:'Delivered',finished:'Finished',cancelled:'Cancelled'};

function ensureOrderShape(o){
  if(!o.history) o.history=[{stage:'pending',title:'Pending',note:'Order placed and awaiting confirmation.',date:o.date}];
  if(!o.ts) o.ts=Date.now();
  if(o.paid===undefined){ o.paid=0; o.due=o.total; }
  if(o.deliveryPaid===undefined) o.deliveryPaid=false;
  if(o.pointsRedeemed===undefined) o.pointsRedeemed=0;
  if(o.pointsEarned===undefined) o.pointsEarned=0;
}

function renderOrders(){
  const con=document.getElementById('ordersContainer');
  const empty=document.getElementById('ordersEmpty');
  if(!orders.length){ con.innerHTML='';empty.style.display='block';return; }
  empty.style.display='none';
  orders.forEach(ensureOrderShape);
  con.innerHTML=orders.map(o=>{
    const stageIdx=ORDER_STAGES.indexOf(o.status);
    const stepperHTML = o.status==='cancelled'
      ? `<div class="order-cancelled-banner">✕ Order Cancelled${o.cancelReason?': '+o.cancelReason:''}</div>`
      : `<div class="order-stepper">${ORDER_STAGES.map((s,i)=>{
          const state = i<stageIdx ? 'done' : (i===stageIdx ? (s==='finished' ? 'done' : 'current') : '');
          return `<div class="order-step ${state}" onclick="advanceStage('${o.id}','${s}')" title="Mark as ${ORDER_STAGE_LABELS[s]}">
            <div class="order-step-line"></div>
            <div class="order-step-dot">${i<stageIdx || (i===stageIdx && s==='finished')?'✓':i+1}</div>
            <div class="order-step-label">${ORDER_STAGE_LABELS[s]}</div>
          </div>`;
        }).join('')}</div>`;
    return `
    <div class="order-card" id="ocard_${o.id}">
      <div class="order-card-header">
        <div>
          <div class="order-id-label">${o.id} · ${o.date}</div>
          <div class="order-customer" style="margin-top:.3rem">${o.customer.name} · ${o.customer.phone}</div>
          <div class="order-meta" style="margin-top:.25rem">${o.customer.address}${o.customer.district?', '+o.customer.district:''}</div>
          ${o.customer.note?`<div class="order-meta" style="margin-top:.2rem">Note: ${o.customer.note}</div>`:''}
        </div>
        <span class="order-status status-${o.status}">${ORDER_STAGE_LABELS[o.status]||o.status}</span>
      </div>

      <div class="order-products-list">
        ${o.items.map(i=>`<div class="order-product-line">${i.photo?`<img alt="" src="${i.photo}"/>`:''}<div class="order-product-name">${i.name}<small>${i.ml}ml × ${i.qty}</small></div><div class="order-product-total">৳${(i.price*i.qty).toLocaleString()}</div></div>`).join('')}
      </div>

      <div class="order-summary-box">
        <div class="os-label">Payment Method</div><div class="os-val">${o.payment.method.toUpperCase()}${o.payment.trxid&&o.payment.trxid!=='COD'?' · '+o.payment.trxid:''}</div>
        <div class="os-label">Subtotal</div><div class="os-val">৳${o.subtotal.toLocaleString()}</div>
        ${o.tierDiscount?`<div class="os-label">Spend Discount (${o.tierDiscount.pct}%)</div><div class="os-val">-৳${o.tierDiscount.discount.toLocaleString()}</div>`:''}
        ${o.coupon?`<div class="os-label">Coupon (${o.coupon.code})</div><div class="os-val">-৳${o.coupon.discount.toLocaleString()}</div>`:''}
        ${o.pointsRedeemed?`<div class="os-label">Points Redeemed</div><div class="os-val">-৳${o.pointsRedeemed.toLocaleString()}</div>`:''}
        <div class="os-label">Delivery</div><div class="os-val">৳${o.delivery.toLocaleString()}</div>
        <div class="os-total os-label">Total</div><div class="os-total os-val">৳${o.total.toLocaleString()}</div>
        <div class="os-label">Paid</div><div class="os-val">৳${o.paid.toLocaleString()}</div>
        <div class="os-label">Due</div><div class="os-val" style="${o.due>0?'color:#c9a882':''}">৳${o.due.toLocaleString()}</div>
        ${o.pointsEarned?`<div class="os-label">Points Earned</div><div class="os-val">+${o.pointsEarned.toLocaleString()}</div>`:''}
      </div>

      <div class="order-payment-row">
        <span style="font-size:.66rem;letter-spacing:.1em;text-transform:uppercase;color:var(--gold)">Delivery Charge (৳${o.delivery.toLocaleString()}):</span>
        ${o.deliveryPaid
          ? `<span class="order-status" style="border-color:rgba(139,199,139,.4);color:#8bc78b">✓ Paid</span> <button class="status-btn" onclick="setDeliveryPaid('${o.id}',false)">Undo</button>`
          : `<button class="status-btn" style="border-color:rgba(201,168,130,.35);color:var(--champagne)" onclick="setDeliveryPaid('${o.id}',true)">Mark Delivery Charge Paid</button>`}
      </div>

      ${stepperHTML}

      <div class="order-footer-actions">
        ${(o.status==='delivered'||o.status==='finished')?'':`<button class="status-btn" style="border-color:rgba(201,112,112,.3);color:#c97070" onclick="cancelOrder('${o.id}')">Cancel Order</button>`}
        <button class="status-btn" style="border-color:rgba(180,80,80,.3);color:#c97070" onclick="deleteOrder('${o.id}')">Delete</button>
      </div>
    </div>`;
  }).join('');
}

// Upserts a history entry for a given stage (updates date/note if the stage already has one)
function upsertHistory(o,stage,title,note){
  const date=new Date().toLocaleString('en-BD',{dateStyle:'medium',timeStyle:'short'});
  const existing=o.history.find(h=>h.stage===stage);
  if(existing){ existing.title=title; existing.note=note; existing.date=date; }
  else o.history.push({stage,title,note,date});
}

function setDeliveryPaid(id,val){
  const o=orders.find(x=>x.id===id); if(!o) return;
  ensureOrderShape(o);
  val=!!val;
  if(val===o.deliveryPaid) return;
  if(val){
    o.paid=Math.min((o.paid||0)+(o.delivery||0), o.total);
  } else {
    o.paid=Math.max((o.paid||0)-(o.delivery||0), 0);
  }
  o.due=Math.max(o.total-o.paid,0);
  o.deliveryPaid=val;
  syncOrders();

  // Auto-advance to "Confirmed" as soon as the delivery charge is marked paid
  // (skips the manual click on the stepper), but only if the order hasn't
  // already moved past that stage.
  const curIdx=ORDER_STAGES.indexOf(o.status);
  const confirmIdx=ORDER_STAGES.indexOf('confirmed');
  if(val && curIdx>-1 && curIdx<confirmIdx){
    advanceStage(id,'confirmed');
    return; // advanceStage() already saves/renders/toasts
  }

  renderOrders(); renderDashboard();
  if(session && session.type==='customer') renderMyOrders();
  showToast(val?`Delivery charge for ${id} marked as paid.`:`Delivery charge for ${id} marked as unpaid.`);
}
function advanceStage(id,stage){
  const o=orders.find(x=>x.id===id); if(!o) return;
  ensureOrderShape(o);
  if(o.status==='finished'){ showToast('This order is finished — its status can no longer be changed.'); return; }
  if(o.status==='delivered' && stage!=='finished'){ showToast('This order has already been delivered and cannot be moved back to an earlier status.'); return; }
  if(stage==='confirmed' && !o.deliveryPaid){ showToast('Please mark the delivery charge as paid before confirming this order.'); return; }
  let note='';
  if(stage==='paymentPaid'){
    if(o.payment.method==='cod'){
      note=`Cash on Delivery — to be collected on delivery.`;
    } else {
      const payer=prompt('Payer mobile number:', o.customer.phone||'')||'';
      note=`Payer Info: ${payer||'N/A'}, Gateway Status: 0000`;
      o.paid=o.total; o.due=0;
    }
  } else if(stage==='billing'){
    const invoiceNo='INV-ESS-'+new Date().getFullYear()+'-'+Math.floor(100000+Math.random()*899999);
    o.invoiceNo=invoiceNo;
    note=invoiceNo;
  } else if(stage==='shipped'){
    const dname=prompt('Deliveryman name:', o.deliverymanName||'')||'';
    const dphone=prompt('Deliveryman phone:', o.deliverymanPhone||'')||'';
    o.deliverymanName=dname; o.deliverymanPhone=dphone;
    note=`Dear Customer, your order has been shipped and will arrive soon.${dname?' Deliveryman: '+dname+(dphone?' ('+dphone+')':''):''}`;
  } else if(stage==='delivered'){
    note='done';
    if(o.payment.method==='cod'){ o.paid=o.total; o.due=0; }
  } else if(stage==='finished'){
    note='Order completed.';
  } else if(stage==='confirmed'){
    note='Order confirmed by the store.';
  } else if(stage==='pending'){
    note='Order placed and awaiting confirmation.';
  }
  o.status=stage;
  upsertHistory(o,stage,ORDER_STAGE_LABELS[stage],note);
  syncOrders();
  renderOrders(); updateOrderBadge();
  if(session && session.type==='customer') renderMyOrders();
  showToast(`Order ${id} marked as ${ORDER_STAGE_LABELS[stage]}.`);
}
function cancelOrder(id){
  const o=orders.find(x=>x.id===id); if(!o) return;
  ensureOrderShape(o);
  if(o.status==='delivered'||o.status==='finished'){ showToast('This order has already been delivered and can no longer be cancelled.'); return; }
  const reason=prompt('Please enter a reason for cancelling this order:', o.cancelReason||'');
  if(reason===null) return;
  if(!reason.trim()){ showToast('Cancellation reason is required.'); return; }
  o.status='cancelled'; o.cancelReason=reason.trim();
  upsertHistory(o,'cancelled','Cancelled',reason.trim());
  syncOrders();
  renderOrders(); updateOrderBadge(); showToast(`Order ${id} cancelled.`);
}

function deleteOrder(id){
  if(!confirm('Delete this order?')) return;
  orders=orders.filter(o=>o.id!==id); syncOrders();
  renderOrders(); updateOrderBadge();
  try{ renderDashboard(); }catch(e){}
  showToast('✓ Order deleted.','success');
}
function updateOrderBadge(){
  const pending=orders.filter(o=>o.status==='pending').length;
  const b=document.getElementById('orderBadge');
  b.textContent=pending||''; b.style.display=pending?'':'none';
}

// ── COUPONS (ADMIN) ───────────────────────────────────────────────────────────
function saveCoupons(){ syncCouponsCloud(); }

function addCoupon(){
  const code=document.getElementById('cpn-code').value.trim().toUpperCase();
  const type=document.getElementById('cpn-type').value;
  const value=Number(document.getElementById('cpn-value').value);
  const min=Number(document.getElementById('cpn-min').value)||0;
  const limit=Math.max(Math.floor(Number(document.getElementById('cpn-limit').value)||0),0);
  const upto=Math.max(Number(document.getElementById('cpn-upto').value)||0,0);
  const newOnly=document.getElementById('cpn-newonly').value==='1';
  if(!code){ showToast('Please enter a coupon code.'); return; }
  if(!value || value<=0){ showToast('Please enter a valid discount value.'); return; }
  if(coupons.some(c=>c.code===code)){ showToast('A coupon with this code already exists.'); return; }
  coupons.unshift({code,type,value,min,limit,upto,newOnly,active:true,created:new Date().toLocaleString('en-BD',{dateStyle:'medium',timeStyle:'short'})});
  saveCoupons();
  document.getElementById('cpn-code').value='';
  document.getElementById('cpn-value').value='';
  document.getElementById('cpn-min').value='';
  document.getElementById('cpn-limit').value='';
  document.getElementById('cpn-upto').value='';
  document.getElementById('cpn-newonly').value='0';
  renderCoupons();
  showToast(`✓ Coupon "${code}" created.`);
}

function toggleCouponActive(code){
  const c=coupons.find(x=>x.code===code); if(!c) return;
  c.active=!c.active; saveCoupons(); renderCoupons();
  showToast('Coupon "'+code+'" '+(c.active?'activated.':'paused.'),'info');
}

function deleteCoupon(code){
  if(!confirm(`Delete coupon "${code}"?`)) return;
  coupons=coupons.filter(c=>c.code!==code); saveCoupons(); renderCoupons();
  showToast('✓ Coupon "'+code+'" deleted.','success');
}

function renderCoupons(){
  const con=document.getElementById('couponsListContainer');
  const empty=document.getElementById('couponsEmpty');
  if(!con) return;
  if(!coupons.length){ con.innerHTML=''; empty.style.display='block'; return; }
  empty.style.display='none';
  con.innerHTML=coupons.map(c=>{ const ex=couponExhausted(c), used=couponUsedCount(c.code), lim=Number(c.limit)||0; return `
    <div class="coupon-row${c.active&&!ex?'':' coupon-inactive'}">
      <div>
        <div class="coupon-code-tag">${c.code}</div>
        <div class="coupon-details">${c.type==='percent'?c.value+'% off':'৳'+c.value.toLocaleString()+' off'}${c.min?' · Min order ৳'+c.min.toLocaleString():''}${c.upto?' · Up to ৳'+Number(c.upto).toLocaleString():''}${c.newOnly?' · New customers only':''}${lim?' · Used '+Math.min(used,lim)+'/'+lim:' · Used '+used}${ex?' · Limit reached':''} · ${c.active?'Active':'Disabled'}</div>
      </div>
      <div style="display:flex;gap:.5rem">
        <button class="status-btn" onclick="toggleCouponActive('${c.code}')">${c.active?'Disable':'Enable'}</button>
        <button class="status-btn" style="border-color:rgba(180,80,80,.3);color:#c97070" onclick="deleteCoupon('${c.code}')">Delete</button>
      </div>
    </div>`;}).join('');
}

// ── SETTINGS ─────────────────────────────────────────────────────────────────
function loadSettings(){
  document.getElementById('set-sitename').value=settings.siteName||'';
  document.getElementById('set-footerwordmark').value=settings.footerWordmark||'';
  document.getElementById('set-email').value=settings.email||'';
  document.getElementById('set-address').value=settings.address||'';
  document.getElementById('set-facebook').value=settings.facebook||'';
  document.getElementById('set-whatsapp').value=settings.whatsapp||'';
  document.getElementById('set-instagram').value=settings.instagram||'';
  document.getElementById('set-bkash').value=settings.bkash||'';
  document.getElementById('set-nagad').value=settings.nagad||'';
  document.getElementById('set-rocket').value=settings.rocket||'';
  document.getElementById('set-phone').value=settings.phone||'';
  document.getElementById('set-deliveryInside').value=settings.deliveryInside!==undefined?settings.deliveryInside:80;
  document.getElementById('set-deliveryOutside').value=settings.deliveryOutside!==undefined?settings.deliveryOutside:140;
  document.getElementById('set-freeabove').value=settings.freeabove||0;
  renderPromoItemsEditor();
  document.getElementById('set-pointsminspend').value=settings.pointsMinSpend!==undefined?settings.pointsMinSpend:500;
  document.getElementById('set-pointsperamount').value=settings.pointsPerAmount!==undefined?settings.pointsPerAmount:100;
  document.getElementById('set-pointsvalue').value=settings.pointsValue!==undefined?settings.pointsValue:1;
  document.getElementById('set-adminname').value=adminCreds.name||'Administrator';
  document.getElementById('set-adminuser').value=adminCreds.username||'admin';
  const avPrev=document.getElementById('adminAvatarPreview');
  if(avPrev){ if(adminCreds.avatar){ avPrev.src=adminCreds.avatar; avPrev.style.display='block'; } else { avPrev.style.display='none'; } }
}

function handleAdminAvatar(e){
  const file=e.target.files[0]; if(!file) return;
  const reader=new FileReader();
  reader.onload=function(ev){
    adminCreds.avatar=ev.target.result;
    saveAdminCreds();
    const avPrev=document.getElementById('adminAvatarPreview');
    if(avPrev){ avPrev.src=adminCreds.avatar; avPrev.style.display='block'; }
    renderAdminProfileCard();
    showToast('✓ Profile photo updated.');
  };
  reader.readAsDataURL(file);
}
function renderAdminProfileCard(){
  const nameEl=document.getElementById('admin-name-view');
  if(nameEl) nameEl.textContent=adminCreds.name||'Administrator';
  const userEl=document.getElementById('admin-username-view');
  if(userEl) userEl.textContent='@'+(adminCreds.username||'admin');
  const emailEl=document.getElementById('admin-email-view');
  if(emailEl) emailEl.textContent='Store Administrator';
  const avEl=document.getElementById('admin-avatar-view');
  if(avEl){
    if(adminCreds.avatar){ avEl.innerHTML=`<img alt="" src="${adminCreds.avatar}"/>`; }
    else { avEl.innerHTML=(adminCreds.name||'A').charAt(0).toUpperCase(); }
  }
}
// ── TABS ─────────────────────────────────────────────────────────────────────
function goToAddProduct(btn){
  // Navigating to "Add Product" from the nav (not via the Edit button) should always start with a clean, empty form
  resetForm();
  switchTab('addProduct',btn);
}
function switchTab(id,btn){
  // Leaving the Add Product tab while an edit was loaded but never saved should
  // silently discard that edit so the form is clean next time it's opened.
  if(id!=='addProduct' && typeof editingProductId!=='undefined' && editingProductId!==null){
    resetForm();
  }
  document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(t=>t.classList.remove('active'));
  // Always resolve the button by its data-tab so programmatic calls (e.g. from
  // editProduct/submitProduct) highlight the correct tab instead of whatever
  // button happened to be passed in (or the first button in the DOM).
  const targetBtn = document.querySelector('.tab-btn[data-tab="'+id+'"]') || btn;
  if(targetBtn) targetBtn.classList.add('active');
  const content = document.getElementById('tab-'+id);
  if(content) content.classList.add('active');
  if(id==='dashboard') renderDashboard();
  if(id==='customers') renderCustomers();
  if(id==='manageProducts') renderManageGrid();
  if(id==='inventory') renderInventory();
  if(id==='orders') renderOrders();
  if(id==='coupons') renderCoupons();
  if(id==='reviews') renderReviews();
  if(id==='atomizers') renderAtomizerAdmin();
  (document.scrollingElement||document.documentElement).scrollTo({top:0,left:0,behavior:'instant'});
}

// ── ADMIN DASHBOARD ────────────────────────────────────────────────────────────
const DASH_ICONS = {
  customers:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.2"/><path d="M2.5 20c0-3.6 3-5.8 6.5-5.8s6.5 2.2 6.5 5.8"/><circle cx="17.5" cy="8.5" r="2.6"/><path d="M16 14.4c2.7.3 5 2.3 5 5.6"/></svg>',
  orders:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h9l3 3v15H6z"/><path d="M9 9h6M9 13h6M9 17h4"/></svg>',
  products:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8 12 3 3 8v8l9 5 9-5Z"/><path d="M3 8l9 5 9-5"/><path d="M12 13v8"/></svg>',
  revenue:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><text x="12" y="18" text-anchor="middle" font-family="\'Cormorant Garant\',serif" font-size="19" font-weight="600" fill="currentColor">৳</text></svg>',
};

function trendBadge(pct){
  if(pct===null) return `<span class="dash-trend dash-trend-flat">New</span>`;
  const up = pct>=0;
  const arrow = up ? '↑' : '↓';
  const cls = pct===0?'dash-trend-flat':(up?'dash-trend-up':'dash-trend-down');
  return `<span class="dash-trend ${cls}">${arrow} ${Math.abs(pct).toFixed(1)}%</span>`;
}
function pctChange(cur,prev){
  if(!prev) return cur>0 ? null : 0;
  return ((cur-prev)/prev)*100;
}
function monthKey(d){ return `${d.getFullYear()}-${d.getMonth()}`; }
function dayKey(d){ return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`; }

function selectDashMonth(key){ window.__dashMonth=key; renderDashboard(); }
function editMonthlyTarget(){
  const current = monthlyTarget || '';
  const input = prompt('Set your monthly revenue target (৳):', current);
  if(input===null) return;
  const num = Math.round(parseFloat(String(input).replace(/[^\d.]/g,'')));
  if(!num || isNaN(num) || num<=0){ alert('Please enter a valid amount greater than 0.'); return; }
  monthlyTarget = num;
  save('essentra_monthly_target', monthlyTarget);
  settings.monthlyTarget=monthlyTarget; syncSettingsCloud();
  renderDashboard();
}
function resetMonthlyTarget(){
  monthlyTarget = null;
  save('essentra_monthly_target', null);
  settings.monthlyTarget=null; syncSettingsCloud();
  renderDashboard();
}
function renderDashboard(){
  orders.forEach(ensureOrderShape);
  const heroT=document.getElementById('dashHeroTitle'), heroS=document.getElementById('dashHeroSub');
  if(heroT) heroT.textContent='Welcome back, '+((adminCreds&&adminCreds.name)||'Admin').split(' ')[0];
  if(heroS) heroS.textContent=new Date().toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'})+" · here's what's happening in your store.";
  const now = new Date();
  const curMonthKey = monthKey(now);
  const prevMonthDate = new Date(now.getFullYear(), now.getMonth()-1, 1);
  const prevMonthKey = monthKey(prevMonthDate);

  let curMonthRevenue=0, prevMonthRevenue=0, curMonthOrders=0, prevMonthOrders=0;
  orders.forEach(o=>{
    const d = new Date(o.ts||Date.now());
    const k = monthKey(d);
    if(k===curMonthKey){ curMonthRevenue+=(o.paid||0); curMonthOrders++; }
    else if(k===prevMonthKey){ prevMonthRevenue+=(o.paid||0); prevMonthOrders++; }
  });
  let curMonthCustomers=0, prevMonthCustomers=0;
  users.forEach(u=>{
    if(!u.createdAt) return;
    const d = new Date(u.createdAt);
    const k = monthKey(d);
    if(k===curMonthKey) curMonthCustomers++;
    else if(k===prevMonthKey) prevMonthCustomers++;
  });
  const totalIncome = orders.reduce((s,o)=>s+(o.paid||0),0);

  // ── Stat cards
  const stats = [
    {key:'customers', label:'Customers', value:users.length, trend:pctChange(curMonthCustomers,prevMonthCustomers)},
    {key:'orders', label:'Orders', value:orders.length, trend:pctChange(curMonthOrders,prevMonthOrders)},
    {key:'products', label:'Products', value:products.length, trend:null},
    {key:'revenue', label:'Revenue', value:'৳'+totalIncome.toLocaleString(), trend:pctChange(curMonthRevenue,prevMonthRevenue)},
  ];
  const grid=document.getElementById('dashStatsGrid');
  if(grid){
    grid.innerHTML = stats.map(s=>`
      <div class="dash-stat-card dash-stat-${s.key}">
        <div class="dash-stat-icon">${DASH_ICONS[s.key]}</div>
        <div class="dash-stat-bottom">
          <div>
            <div class="dash-stat-value">${typeof s.value==='number'?s.value.toLocaleString():s.value}</div>
            <div class="dash-stat-label">${s.label}</div>
          </div>
          ${s.key==='products'?'':trendBadge(s.trend)}
        </div>
      </div>`).join('');
  }

  // ── Monthly Sales bar chart (last 12 months) — click a month to view its data
  const bar=document.getElementById('dashBarChart');
  if(bar){
    const months=[];
    for(let i=11;i>=0;i--){
      const d=new Date(now.getFullYear(), now.getMonth()-i, 1);
      months.push({key:monthKey(d), date:d, label:d.toLocaleString('en-US',{month:'short'}), revenue:0, orders:0, items:0, customers:0});
    }
    orders.forEach(o=>{
      const d=new Date(o.ts||Date.now());
      const m=months.find(m=>m.key===monthKey(d));
      if(m){ m.revenue += (o.paid||0); m.orders++; m.items += (o.items||[]).reduce((s,i)=>i.atomizer?s:s+(Number(i.qty)||1),0); }
    });
    users.forEach(u=>{
      if(!u.createdAt) return;
      const m=months.find(m=>m.key===monthKey(new Date(u.createdAt)));
      if(m) m.customers++;
    });
    if(!months.some(m=>m.key===window.__dashMonth)) window.__dashMonth=curMonthKey;
    const selKey=window.__dashMonth;
    const selIdx=months.findIndex(m=>m.key===selKey);
    const sel=months[selIdx], prev=months[selIdx-1];
    const max=Math.max(...months.map(m=>m.revenue), 1);
    const bars=months.map(m=>{
      const h = Math.max(4,(m.revenue/max)*150);
      const isSel = m.key===selKey;
      return `<button type="button" onclick="selectDashMonth('${m.key}')" title="${m.date.toLocaleString('en-US',{month:'long',year:'numeric'})} · ৳${m.revenue.toLocaleString()}" style="flex:1;min-width:0;display:flex;flex-direction:column;align-items:center;gap:.6rem;height:100%;justify-content:flex-end;background:none;border:none;cursor:pointer;padding:0;font-family:inherit">
        <div style="width:60%;max-width:30px;height:${h}px;background:${isSel?'var(--gold)':'rgba(201,168,130,.28)'};border-radius:5px 5px 0 0;transition:height .4s,background .2s"></div>
        <div style="font-size:clamp(.44rem,2vw,.64rem);letter-spacing:0;padding:.22rem clamp(0rem,.8vw,.45rem);max-width:100%;box-sizing:border-box;white-space:nowrap;border-radius:999px;border:1px solid ${isSel?'var(--gold)':'transparent'};color:${isSel?'var(--gold)':'var(--muted)'};background:${isSel?'rgba(201,168,130,.1)':'none'}">${m.label}</div>
      </button>`;
    }).join('');
    const stat=(label,val,tr)=>`<div style="flex:1 1 140px;min-width:0;background:rgba(255,255,255,.03);border:1px solid rgba(201,168,130,.12);border-radius:12px;padding:.8rem .9rem">
        <div style="font-size:.6rem;letter-spacing:.12em;text-transform:uppercase;color:var(--muted)">${label}</div>
        <div style="display:flex;align-items:center;justify-content:space-between;gap:.5rem;margin-top:.25rem"><div style="font-family:'Cormorant Garant',serif;font-size:1.2rem;color:var(--cream)">${val}</div>${tr===undefined?'':trendBadge(tr)}</div>
      </div>`;
    const aov=sel.orders?Math.round(sel.revenue/sel.orders):0;
    bar.innerHTML = `<div style="display:flex;align-items:flex-end;height:200px;gap:.2rem;padding-top:.5rem">${bars}</div>
      <div style="margin-top:1.2rem;padding-top:1.1rem;border-top:1px solid rgba(201,168,130,.1)">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:.8rem">
          <div style="font-size:.72rem;letter-spacing:.14em;text-transform:uppercase;color:var(--gold);font-weight:600">${sel.date.toLocaleString('en-US',{month:'long',year:'numeric'})}${sel.key===curMonthKey?' · This month':''}</div>
          ${sel.key!==curMonthKey?'<button type="button" onclick="selectDashMonth(\''+curMonthKey+'\')" style="background:none;border:1px solid rgba(201,168,130,.28);color:var(--gold);font-size:.6rem;letter-spacing:.1em;text-transform:uppercase;padding:.3rem .7rem;border-radius:999px;cursor:pointer;font-family:inherit">Back to current</button>':''}
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:.6rem">
          ${stat('Revenue','৳'+sel.revenue.toLocaleString(),prev?pctChange(sel.revenue,prev.revenue):undefined)}
          ${stat('Orders',sel.orders.toLocaleString(),prev?pctChange(sel.orders,prev.orders):undefined)}
          ${stat('Items Sold',sel.items.toLocaleString())}
          ${stat('New Customers',sel.customers.toLocaleString(),prev?pctChange(sel.customers,prev.customers):undefined)}
          ${stat('Avg. Order','৳'+aov.toLocaleString())}
        </div>
      </div>`;
  }

  // ── Monthly Target radial gauge
  const gauge=document.getElementById('dashTargetGauge');
  const gaugeFoot=document.getElementById('dashTargetFooter');
  if(gauge){
    const target = (monthlyTarget && monthlyTarget>0) ? monthlyTarget : 0;
    window.__currentMonthlyTarget = target;
    const pct = target>0 ? Math.min(100, Math.round((curMonthRevenue/target)*100)) : 0;
    const r=70, circumference=Math.PI*r; // half circle
    const dash = (pct/100)*circumference;
    gauge.innerHTML = `
      <div style="display:flex;justify-content:center;padding:.5rem 0 0">
        <svg width="220" height="130" viewBox="0 0 220 130">
          <path d="M 20 110 A 90 90 0 0 1 200 110" fill="none" stroke="rgba(201,168,130,.14)" stroke-width="14" stroke-linecap="round"/>
          <path d="M 20 110 A 90 90 0 0 1 200 110" fill="none" stroke="var(--gold)" stroke-width="14" stroke-linecap="round"
            stroke-dasharray="${(pct/100)*283} 283"/>
          <text x="110" y="95" text-anchor="middle" font-family="'Cormorant Garant',serif" font-size="34" fill="var(--cream)">${target>0?pct+'%':'—'}</text>
        </svg>
      </div>
      <div style="text-align:center;font-size:.72rem;color:var(--muted);line-height:1.6;padding:0 .5rem">
        ${target>0?`You've earned <span style="color:var(--gold)">৳${curMonthRevenue.toLocaleString()}</span> this month${curMonthRevenue>=prevMonthRevenue?", higher than last month.":"."}<br>Keep up the good work!`:'No monthly target set. Use the edit button to set one.'}
      </div>`;
    if(gaugeFoot){
      gaugeFoot.innerHTML = `
        <div style="display:flex;justify-content:space-between;margin-top:1.4rem;padding-top:1.2rem;border-top:1px solid rgba(201,168,130,.1)">
          <div style="text-align:center;flex:1">
            <div style="font-size:.62rem;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)">Target${monthlyTarget?' <span style="color:var(--gold)">•</span>':''}</div>
            <div style="font-family:'Cormorant Garant',serif;font-size:1.05rem;color:var(--cream);margin-top:.2rem">${target>0?'৳'+target.toLocaleString():'Not set'}</div>
            ${monthlyTarget?'<div style="font-size:.58rem;color:var(--muted);margin-top:.3rem"><button type="button" class="link-btn" onclick="resetMonthlyTarget()" style="color:var(--gold)">Remove target</button></div>':''}
          </div>
          <div style="text-align:center;flex:1;border-left:1px solid rgba(201,168,130,.1);border-right:1px solid rgba(201,168,130,.1)">
            <div style="font-size:.62rem;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)">Revenue</div>
            <div style="font-family:'Cormorant Garant',serif;font-size:1.05rem;color:var(--cream);margin-top:.2rem">৳${curMonthRevenue.toLocaleString()}</div>
          </div>
          <div style="text-align:center;flex:1">
            <div style="font-size:.62rem;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)">Last Month</div>
            <div style="font-family:'Cormorant Garant',serif;font-size:1.05rem;color:var(--cream);margin-top:.2rem">৳${prevMonthRevenue.toLocaleString()}</div>
          </div>
        </div>`;
    }
  }

  // ── Revenue movement area chart (last 14 days)
  const area=document.getElementById('dashAreaChart');
  if(area){
    const days=[];
    for(let i=13;i>=0;i--){
      const d=new Date(now.getFullYear(), now.getMonth(), now.getDate()-i);
      days.push({key:dayKey(d), label:d.getDate(), revenue:0});
    }
    orders.forEach(o=>{
      const d=new Date(o.ts||Date.now());
      const k=dayKey(d);
      const day=days.find(x=>x.key===k);
      if(day) day.revenue += (o.paid||0);
    });
    const w=560, h=200, pad=10;
    const max=Math.max(...days.map(d=>d.revenue),1);
    const stepX=(w-pad*2)/(days.length-1);
    const pts=days.map((d,i)=>{
      const x=pad+i*stepX;
      const y=h-pad-((d.revenue/max)*(h-pad*2));
      return {x,y,d};
    });
    const linePath = pts.map((p,i)=>(i===0?'M':'L')+p.x.toFixed(1)+' '+p.y.toFixed(1)).join(' ');
    const areaPath = linePath + ` L ${pts[pts.length-1].x.toFixed(1)} ${h-pad} L ${pts[0].x.toFixed(1)} ${h-pad} Z`;
    area.innerHTML = `<svg viewBox="0 0 ${w} ${h+24}" style="width:100%;height:auto;overflow:visible">
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="var(--gold)" stop-opacity=".35"/>
          <stop offset="100%" stop-color="var(--gold)" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <path d="${areaPath}" fill="url(${location.href.split('#')[0]}#areaGrad)"/>
      <path d="${linePath}" fill="none" stroke="var(--gold)" stroke-width="2"/>
      ${pts.map(p=>`<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="2.6" fill="var(--gold)"><title>${p.d.label}: ৳${p.d.revenue.toLocaleString()}</title></circle>`).join('')}
      ${pts.filter((_,i)=>i%2===0).map(p=>`<text x="${p.x.toFixed(1)}" y="${h+18}" text-anchor="middle" font-size="9" fill="var(--muted)">${p.d.label}</text>`).join('')}
    </svg>`;
  }

  // ── Order status donut
  const donut=document.getElementById('dashDonutChart');
  if(donut){
    const statusColors = {pending:'#e8c87a',paymentPaid:'#8bb3c9',confirmed:'#8bc98b',billing:'#c9ab8b',shipped:'#b3a8e0',delivered:'#C9A882',finished:'#8bc98b',cancelled:'#c97070'};
    const counts={};
    orders.forEach(o=>{ counts[o.status]=(counts[o.status]||0)+1; });
    const total=orders.length;
    if(!total){
      donut.innerHTML='<div style="padding:2.5rem 1rem;text-align:center;color:var(--muted);font-size:.8rem">No orders yet to break down.</div>';
    } else {
      let offset=0;
      const r=54, circ=2*Math.PI*r;
      const segs = Object.entries(counts).map(([status,count])=>{
        const frac=count/total;
        const seg = `<circle cx="70" cy="70" r="${r}" fill="none" stroke="${statusColors[status]||'#999'}" stroke-width="16"
          stroke-dasharray="${(frac*circ).toFixed(1)} ${circ.toFixed(1)}" stroke-dashoffset="${(-offset*circ).toFixed(1)}"/>`;
        offset += frac;
        return seg;
      }).join('');
      const legend = Object.entries(counts).map(([status,count])=>`
        <div style="display:flex;align-items:center;justify-content:space-between;gap:.6rem;font-size:.72rem;padding:.35rem 0">
          <div style="display:flex;align-items:center;gap:.5rem;color:var(--cream)">
            <span style="width:8px;height:8px;border-radius:50%;background:${statusColors[status]||'#999'};display:inline-block"></span>
            ${ORDER_STAGE_LABELS[status]||status}
          </div>
          <span style="color:var(--muted)">${count}</span>
        </div>`).join('');
      donut.innerHTML = `<div style="display:flex;align-items:center;gap:1.6rem;flex-wrap:wrap">
        <svg width="140" height="140" viewBox="0 0 140 140" style="transform:rotate(-90deg);flex-shrink:0">
          ${segs}
        </svg>
        <div style="flex:1;min-width:150px">${legend}</div>
      </div>`;
    }
  }

  // ── Recent orders / customers lists
  const recOrders=document.getElementById('dashRecentOrders');
  if(recOrders){
    if(!orders.length) recOrders.innerHTML='<div class="admin-empty-state" style="border:none;padding:2.5rem 1rem">No orders yet.</div>';
    else recOrders.innerHTML = orders.slice(0,6).map(o=>`
      <div class="dash-list-row">
        <div>
          <div style="font-size:.8rem;color:var(--cream)">${o.customer.name}</div>
          <div style="font-size:.66rem;color:var(--muted);margin-top:.15rem">${o.id} · ${o.date}</div>
        </div>
        <span class="order-status status-${o.status}" style="font-size:.6rem">${ORDER_STAGE_LABELS[o.status]||o.status}</span>
      </div>`).join('');
  }
  const recCust=document.getElementById('dashRecentCustomers');
  if(recCust){
    const recent=[...users].sort((a,b)=>(b.createdAt||'').localeCompare(a.createdAt||'')).slice(0,6);
    if(!recent.length) recCust.innerHTML='<div class="admin-empty-state" style="border:none;padding:2.5rem 1rem">No customers yet.</div>';
    else recCust.innerHTML = recent.map(u=>`
      <div class="dash-list-row">
        <div style="display:flex;align-items:center;gap:.7rem">
          ${u.avatar?`<img alt="" src="${u.avatar}" style="width:34px;height:34px;border-radius:50%;object-fit:cover"/>`:`<div style="width:34px;height:34px;border-radius:50%;background:var(--dark2);display:flex;align-items:center;justify-content:center;color:var(--gold);font-family:'Cormorant Garant',serif;font-size:.9rem;flex-shrink:0">${(u.name||'?')[0].toUpperCase()}</div>`}
          <div>
            <div style="font-size:.8rem;color:var(--cream)">${u.name}</div>
            <div style="font-size:.66rem;color:var(--muted);margin-top:.1rem">${u.email}${u.phone?' · '+u.phone:''}</div>
          </div>
        </div>
      </div>`).join('');
  }
}

// ── ADMIN CUSTOMERS ────────────────────────────────────────────────────────────
function renderCustomers(){
  const grid=document.getElementById('customersGrid');
  const empty=document.getElementById('customersEmpty');
  if(!grid) return;
  if(!users.length){ grid.innerHTML=''; if(empty)empty.style.display='block'; return; }
  if(empty) empty.style.display='none';
  grid.innerHTML = users.map(u=>{
    const orderCount = orders.filter(o=>o.customerEmail===u.email).length;
    return `
    <div class="customer-row-clickable" onclick="openCustomerDetail('${u.email}')" style="padding:1.1rem 1.3rem;border-bottom:1px solid rgba(201,168,130,.08);display:flex;justify-content:space-between;align-items:center;gap:1rem;flex-wrap:wrap">
      <div style="display:flex;align-items:center;gap:.8rem">
        ${u.avatar?`<img alt="" src="${u.avatar}" style="width:42px;height:42px;border-radius:50%;object-fit:cover"/>`:`<div style="width:42px;height:42px;border-radius:50%;background:var(--dark2);display:flex;align-items:center;justify-content:center;color:var(--gold);font-family:'Cormorant Garant',serif">${(u.name||'?')[0].toUpperCase()}</div>`}
        <div>
          <div style="font-size:.85rem;color:var(--cream)">${u.name}</div>
          <div style="font-size:.68rem;color:var(--muted)">${u.email}${u.phone?' · '+u.phone:''}</div>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:.9rem;flex-wrap:wrap">
        <div style="font-size:.68rem;color:var(--gold);letter-spacing:.08em;text-transform:uppercase">${orderCount} order${orderCount===1?'':'s'} · ${(u.points||0).toLocaleString()} pts</div>
        <button onclick="event.stopPropagation();removeCustomer('${u.email}')" style="background:transparent;border:1px solid rgba(180,80,80,.28);color:#c97070;font-size:.62rem;letter-spacing:.1em;text-transform:uppercase;padding:.3rem .7rem;cursor:pointer;font-family:'Inter',sans-serif">Remove</button>
      </div>
    </div>`;
  }).join('');
}
function removeCustomer(email){
  const u=users.find(x=>x.email===email); if(!u) return;
  if(!confirm(`Remove ${u.name || u.email} from your customer list? Their past orders will be kept for your records, but they will no longer be able to log in with this account.`)) return;
  users=users.filter(x=>x.email!==email);
  saveUsers();
  if(session && session.type==='customer' && session.email===email){ session=null; saveSession(); }
  renderCustomers(); renderDashboard();
  showToast('✓ Customer removed.');
}

function openCustomerDetail(email){
  const u=users.find(x=>x.email===email); if(!u) return;
  document.getElementById('cdName').textContent=u.name||'—';
  document.getElementById('cdUsername').textContent=u.username?'@'+u.username:'';
  document.getElementById('cdEmail').textContent=u.email+(u.phone?' · '+u.phone:'');
  document.getElementById('cdAvatarWrap').innerHTML = u.avatar
    ? `<img alt="" class="cust-detail-avatar" src="${u.avatar}"/>`
    : `<div class="cust-detail-avatar-fallback">${(u.name||'?')[0].toUpperCase()}</div>`;

  const mine=orders.filter(o=>o.customerEmail===u.email);
  mine.forEach(ensureOrderShape);
  const joined = u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-US',{day:'numeric',month:'short',year:'numeric'}) : '—';

  document.getElementById('cdStats').innerHTML=`
    <div class="cust-stat"><div class="cust-stat-val">${joined}</div><div class="cust-stat-label">Customer Since</div></div>
    <div class="cust-stat"><div class="cust-stat-val">${mine.length}</div><div class="cust-stat-label">Order${mine.length===1?'':'s'}</div></div>
    <div class="cust-stat"><div class="cust-stat-val">${(u.points||0).toLocaleString()}</div><div class="cust-stat-label">Points</div></div>
    <div class="cust-stat"><div class="cust-stat-val">${(u.wishlist||[]).length}</div><div class="cust-stat-label">Wish List</div></div>
  `;

  const addrSection=document.getElementById('cdAddressSection');
  const defAddr = (u.addresses||[]).find(a=>a.isDefault) || (u.addresses||[])[0];
  if(defAddr){
    addrSection.style.display='block';
    document.getElementById('cdAddress').innerHTML = `<strong style="color:var(--cream)">${defAddr.name||u.name}</strong><br>${defAddr.address}${defAddr.city?', '+defAddr.city:''}${defAddr.phone?'<br>Mobile: '+defAddr.phone:''}`;
  } else {
    addrSection.style.display='none';
  }

  const ordersEl=document.getElementById('cdOrders');
  if(!mine.length){
    ordersEl.innerHTML='<div class="cust-empty-note">No orders placed yet.</div>';
  } else {
    ordersEl.innerHTML = mine.map(o=>{
      const itemsHTML = o.items.map(i=>`
        <div class="cust-order-item-row">
          <div class="cust-order-item-img">${i.photo?`<img alt="" src="${i.photo}"/>`:'🧴'}</div>
          <div class="cust-order-item-info">
            <div class="cust-order-item-name">${i.name}</div>
            <div class="cust-order-item-meta">${i.brand?i.brand+' · ':''}${i.ml}ml × ${i.qty}</div>
          </div>
          <div class="cust-order-item-price">৳${(i.price*i.qty).toLocaleString()}</div>
        </div>`).join('');
      return `<div class="cust-order-row">
        <div class="cust-order-row-top">
          <div style="font-size:.8rem;color:var(--cream)">${o.id} · ${o.date}</div>
          <div style="display:flex;align-items:center;gap:.7rem">
            <span class="order-status status-${o.status}" style="font-size:.6rem">${ORDER_STAGE_LABELS[o.status]||o.status}</span>
            <span style="font-size:.8rem;color:var(--champagne)">৳${o.total.toLocaleString()}</span>
          </div>
        </div>
        <div class="cust-order-items">${itemsHTML}</div>
      </div>`;
    }).join('');
  }

  const wishEl=document.getElementById('cdWishlist');
  const wishIds=u.wishlist||[];
  if(!wishIds.length){
    wishEl.innerHTML='<div class="cust-empty-note">Wish list is empty.</div>';
  } else {
    wishEl.innerHTML = wishIds.map(pid=>{
      const p=products.find(x=>x.id===pid);
      if(!p) return '';
      return `<div class="cust-wish-item" onclick="closeCustomerDetail();openModal(${p.id})">
        <div class="cust-wish-item-img">${p.photo?`<img alt="" src="${p.photo}"/>`:'🧴'}</div>
        <div class="cust-wish-item-name">${p.name}</div>
      </div>`;
    }).join('');
  }

  document.getElementById('customerDetailModal').classList.add('open');
}
function closeCustomerDetail(){
  document.getElementById('customerDetailModal').classList.remove('open');
}

// ── ADMIN INVENTORY ────────────────────────────────────────────────────────────
let invFilter='all';
let invExpanded={};
function setInvFilter(f,btn){
  invFilter=f;
  document.querySelectorAll('#inventoryFilterChips .inv2-chip').forEach(c=>c.classList.remove('active'));
  if(btn) btn.classList.add('active');
  renderInventory();
}
function toggleInvRow(id){
  invExpanded[id]=!invExpanded[id];
  renderInventory();
}
function renderInventory(){
  const grid=document.getElementById('inventoryGrid');
  const empty=document.getElementById('inventoryEmpty');
  const countEl=document.getElementById('inventoryCount');
  const statsEl=document.getElementById('inventoryStats');
  if(!grid) return;

  if(statsEl){
    if(!products.length){ statsEl.innerHTML=''; }
    else {
      let totalUnits=0, lowCount=0, outCount=0, okCount=0;
      products.forEach(p=>{
        (p.sizes||[]).forEach(s=>{
          const st=Number(s.stock)||0;
          totalUnits+=st;
          if(st<=0) outCount++; else if(st<=5) lowCount++; else okCount++;
        });
      });
      statsEl.innerHTML = `
      <div class="inv2-stat">
        <div class="inv2-stat-top"><div class="inv2-stat-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7h18M5 7v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V7M9 11h6"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></div><div class="inv2-stat-trend">${products.length} SKUs</div></div>
        <div class="inv2-stat-num">${totalUnits}</div>
        <div class="inv2-stat-label">Total Units</div>
      </div>
      <div class="inv2-stat tone-good">
        <div class="inv2-stat-top"><div class="inv2-stat-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></div></div>
        <div class="inv2-stat-num">${okCount}</div>
        <div class="inv2-stat-label">Healthy Sizes</div>
      </div>
      <div class="inv2-stat tone-warn">
        <div class="inv2-stat-top"><div class="inv2-stat-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4"/><path d="M10.3 3.9 1.8 18a1.6 1.6 0 0 0 1.4 2.4h17.6a1.6 1.6 0 0 0 1.4-2.4L13.7 3.9a1.6 1.6 0 0 0-2.8 0Z"/><path d="M12 16h.01"/></svg></div></div>
        <div class="inv2-stat-num">${lowCount}</div>
        <div class="inv2-stat-label">Low Stock Sizes</div>
      </div>
      <div class="inv2-stat tone-bad">
        <div class="inv2-stat-top"><div class="inv2-stat-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="m9.5 9.5 5 5m0-5-5 5"/></svg></div></div>
        <div class="inv2-stat-num">${outCount}</div>
        <div class="inv2-stat-label">Out of Stock Sizes</div>
      </div>`;
    }
  }

  if(!products.length){ grid.innerHTML=''; if(empty)empty.style.display='block'; if(countEl)countEl.textContent=''; return; }

  const q=(document.getElementById('invSearchInput')?.value||'').trim().toLowerCase();
  const sortMode=document.getElementById('invSortSelect')?.value||'name';

  let list=products.filter(p=>{
    if(q && !((p.name||'').toLowerCase().includes(q) || (p.brand||'').toLowerCase().includes(q))) return false;
    const sizes=p.sizes||[];
    if(invFilter==='low') return sizes.some(s=>{const st=Number(s.stock)||0; return st>0 && st<=5;});
    if(invFilter==='out') return sizes.some(s=>(Number(s.stock)||0)<=0);
    return true;
  });

  list=list.slice().sort((a,b)=>{
    if(sortMode==='name') return (a.name||'').localeCompare(b.name||'');
    if(sortMode==='stockAsc') return productTotalStock(a)-productTotalStock(b);
    if(sortMode==='stockDesc') return productTotalStock(b)-productTotalStock(a);
    return 0;
  });

  if(countEl) countEl.textContent = `Showing ${list.length} of ${products.length} product${products.length===1?'':'s'}`;

  if(!list.length){ grid.innerHTML=''; if(empty){empty.style.display='block'; empty.querySelector('div:last-child').textContent='No products match your search or filter.';} return; }
  if(empty) empty.style.display='none';

  grid.innerHTML = list.map(p=>{
    const sizes=(p.sizes&&p.sizes.length)?p.sizes:[];
    const total=productTotalStock(p);
    const worstStock = sizes.length ? Math.min(...sizes.map(s=>Number(s.stock)||0)) : 0;
    const status = sizes.length===0 ? 'ok' : (worstStock<=0 ? 'out' : (sizes.some(s=>(Number(s.stock)||0)<=5) ? 'low' : 'ok'));
    const statusColor = status==='out' ? '#d98080' : (status==='low' ? '#e8c87a' : '#8bc98b');
    const statusLabel = status==='out' ? 'Out of Stock' : (status==='low' ? 'Low Stock' : 'In Stock');
    const gaugePct = Math.max(4, Math.min(100, Math.round((total/(sizes.length*30||30))*100)));
    const isOpen = !!invExpanded[p.id];
    return `
    <div class="inv2-row${isOpen?' expanded':''}">
      <div class="inv2-row-head" onclick="toggleInvRow(${p.id})">
        ${p.photo?`<img alt="" src="${p.photo}" class="inv2-thumb"/>`:'<div class="inv2-thumb-placeholder"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.4"/><path d="m21 16-5-5-4 4-3-3-5 5"/></svg></div>'}
        <div class="inv2-row-id">
          <div class="inv2-row-name">${p.name||'Untitled'}</div>
          <div class="inv2-row-meta"><span>${p.brand||'Others'}</span><span class="dot"></span><span>${sizes.length} size${sizes.length===1?'':'s'}</span></div>
        </div>
        <div class="inv2-row-gauge">
          <div class="inv2-gauge-track"><div class="inv2-gauge-fill" style="width:${gaugePct}%;background:${statusColor}"></div></div>
        </div>
        <div class="inv2-status-chip ${status}">${statusLabel}</div>
        <div class="inv2-row-total">${total}<span>units total</span></div>
        <svg class="inv2-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
      </div>
      <div class="inv2-row-body">
        <div class="inv2-sizes-grid">
          ${sizes.map((s,i)=>{
            const st=Number(s.stock)||0;
            const sColor = st<=0 ? '#d98080' : (st<=5 ? '#e8c87a' : '#8bc98b');
            const sLabel = st<=0 ? 'Out of Stock' : (st<=5 ? 'Low Stock' : 'In Stock');
            const barPct = Math.max(4, Math.min(100, Math.round((st/30)*100)));
            return `
            <div class="inv2-size-card">
              <div class="inv2-size-top">
                <span class="inv2-size-ml">${s.ml}ml</span>
                <span style="font-size:.65rem;color:var(--muted)">৳${s.price}</span>
              </div>
              <div class="inv-stock-input">
                <input type="number" name="size-stock" aria-label="Stock quantity" min="0" step="1" value="${st}" onclick="event.stopPropagation()" onchange="updateSizeStock(${p.id},${i},this.value)"/>
                <span style="font-size:.63rem;color:var(--muted);white-space:nowrap">units</span>
              </div>
              <div class="stock-bar-track"><div class="stock-bar-fill" style="width:${barPct}%;background:${sColor}"></div></div>
              <div style="font-size:.6rem;color:${sColor};text-transform:uppercase;letter-spacing:.08em">${sLabel}</div>
            </div>`;
          }).join('')}
        </div>
      </div>
    </div>`;
  }).join('');
}
function updateSizeStock(productId,sizeIdx,newVal){
  const p=products.find(pr=>pr.id===productId); if(!p||!p.sizes||!p.sizes[sizeIdx]) return;
  p.sizes[sizeIdx].stock=Math.max(parseInt(newVal)||0,0);
  syncProducts();
  renderProducts(); renderCollection(); renderManageGrid(); renderInventory();
  showToast('✓ Stock updated.');
}

// close overlays on bg click
document.getElementById('productModal').addEventListener('click',function(e){ if(e.target===this)closeModal(); });

// ── UNIFIED AUTH (ADMIN + CUSTOMER) ────────────────────────────────────────────
function saveUsers(){ syncUsersCloud(); }
function saveSession(){ save('essentra_session',session); }
function saveAdminCreds(){ syncAdminCredsCloud(); }

function normEmail(e){ return (e||'').trim().toLowerCase(); }
// Canonical Bangladesh mobile format used by both the browser and the database: 8801XXXXXXXXX.
// The database function is authoritative; this only gives the visitor immediate feedback.
function normalizeBangladeshPhone(value){
  let digits=String(value||'').replace(/\D/g,'');
  if(digits.startsWith('01')) digits='88'+digits;
  else if(digits.startsWith('1')) digits='880'+digits;
  else if(digits.startsWith('8801')) { /* already canonical */ }
  else return '';
  return /^8801[3-9]\d{8}$/.test(digits)?digits:'';
}

const PW_EYE_ON='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>';
const PW_EYE_OFF='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a20.6 20.6 0 0 1 5.06-5.94M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 7 11 7a20.6 20.6 0 0 1-3.22 4.4M14.12 14.12a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';
function pwToggle(btn,id){
  var inp=document.getElementById(id);
  if(!inp)return;
  var visible = btn.getAttribute('data-visible')==='1';
  if(visible){
    inp.type='password';
    btn.setAttribute('data-visible','0');
    btn.innerHTML=PW_EYE_ON;
  } else {
    inp.type='text';
    btn.setAttribute('data-visible','1');
    btn.innerHTML=PW_EYE_OFF;
  }
}
function pwResetAll(){
  document.querySelectorAll('.pw-toggle').forEach(function(btn){
    var wrap=btn.closest('.pw-wrap');
    var inp=wrap?wrap.querySelector('input'):null;
    if(inp) inp.type='password';
    btn.setAttribute('data-visible','0');
    btn.innerHTML=PW_EYE_ON;
  });
}
async function doLogin(){
  const idVal=document.getElementById('login-email').value.trim();
  const pass=document.getElementById('login-password').value;
  const err=document.getElementById('loginError');

  // 1. Check admin credentials first
  if(idVal===adminCreds.username && pass===adminCreds.password){
    session={type:'admin', name:adminCreds.name||'Administrator'};
    saveSession(); switchCart(false);
    document.getElementById('login-email').value='';
    document.getElementById('login-password').value='';
    err.style.display='none';
    updateNavAccountUI();
    renderRecentlyViewed();
    closeAuthOverlay();
    hideAllMainPages();
    document.getElementById('admin').style.display='block';
    switchTab('dashboard');
    renderAdminProfileCard();
    document.getElementById('admin').scrollIntoView({behavior:'smooth'});
    showToast(`✓ Welcome back, ${adminCreds.name||'Admin'}.`);
    return;
  }

  if(!idVal || !pass){ err.textContent='Please enter your email or username and password.'; err.style.display='block'; return; }
  if(!sb){ err.textContent='Secure customer sign-in is not configured yet. Please complete the Supabase migration.'; err.style.display='block'; return; }
  setAuthButtonLoading('loginSubmitBtn',true,'Signing in…'); err.style.display='none';
  try{
    let authError=null;
    if(idVal.includes('@')){ const {error}=await sb.auth.signInWithPassword({email:normEmail(idVal),password:pass}); authError=error; }
    else { const {data,error}=await sb.functions.invoke('login-customer',{body:{identifier:idVal,password:pass}}); if(error) throw error; if(data&&data.session){ const {error:setError}=await sb.auth.setSession(data.session); authError=setError; } else authError=new Error((data&&data.error)||'Incorrect email/username or password.'); }
    if(authError) throw authError;
    // Safety net: never open an account whose email has not been verified.
    const {data:{session:_cs}}=await sb.auth.getSession();
    if(_cs&&_cs.user&&!_cs.user.email_confirmed_at){ await sb.auth.signOut(); throw new Error('EMAIL_NOT_VERIFIED'); }
    await completeCustomerAuthentication();
    document.getElementById('login-email').value=''; document.getElementById('login-password').value=''; showToast('✓ Welcome back.');
  }catch(e){
    console.error('Customer login failed',e);
    const m=String((e&&e.message)||'');
    if(e&&(e.code==='email_not_confirmed'||/email not confirmed/i.test(m)||m==='EMAIL_NOT_VERIFIED')){
      showVerifyPanel(idVal,{email:idVal.includes('@')?normEmail(idVal):'',notice:'Your email is not verified yet. Please click the link we emailed you, or request a new one below.'});
      return;
    }
    err.textContent='Incorrect email/username or password.'; err.style.display='block';
  }
  finally{ setAuthButtonLoading('loginSubmitBtn',false); }
}

async function doRegister(){
  const name=clean(document.getElementById('reg-name').value,60);
  let username=clean(document.getElementById('reg-username').value,30).replace(/[^\w.\-]+/g,'_');
  const email=normEmail(document.getElementById('reg-email').value);
  const phone=clean(document.getElementById('reg-phone').value,20);
  const pass=document.getElementById('reg-password').value;
  const confirm=document.getElementById('reg-confirm').value;
  const err=document.getElementById('registerError');

  if(!name||!username||!email||!phone||!pass||!confirm){ err.textContent='Please complete all required fields.'; err.style.display='block'; return; }
  if(!/^[^\s@'"<>`\\]+@[^\s@'"<>`\\]+\.[^\s@'"<>`\\]+$/.test(email)){ err.textContent='Please enter a valid email address.'; err.style.display='block'; return; }
  const normalizedPhone=normalizeBangladeshPhone(phone);
  if(!normalizedPhone){ err.textContent='Please enter a valid Bangladesh phone number.'; err.style.display='block'; return; }
  if(pass.length<6){ err.textContent='Password must be at least 6 characters.'; err.style.display='block'; return; }
  if(pass!==confirm){ err.textContent='Passwords do not match.'; err.style.display='block'; return; }
  const termsBox=document.getElementById('reg-terms');
  if(!termsBox||!termsBox.checked){ err.textContent='Please agree to the Terms & Conditions to create your account.'; err.style.display='block'; const tw=document.getElementById('regTermsWrap'); if(tw) tw.classList.add('auth-terms-err'); return; }
  if(!sb){ err.textContent='Secure customer registration is not configured yet. Please complete the Supabase migration.'; err.style.display='block'; return; }
  setAuthButtonLoading('registerSubmitBtn',true,'Creating account…'); err.style.display='none';
  try{
    const {data,error}=await sb.functions.invoke('register-customer',{body:{fullName:name,username,email,phone:normalizedPhone,password:pass}});
    if(error) throw error; if(data&&data.error){ const x=new Error(data.error); throw x; }
    // The account stays locked until the emailed link is opened, so there is no automatic sign-in here.
    ['reg-name','reg-username','reg-email','reg-phone','reg-password','reg-confirm'].forEach(id=>document.getElementById(id).value='');
    termsBox.checked=false;
    const sent=!(data&&data.emailSent===false);
    showVerifyPanel(email,{email,emailSent:sent,notice:sent?'':'We could not send the email just now. Please tap “Resend Verification Email”.',noticeType:'error'});
    showToast(sent?'✓ Account created — please check your email to verify it.':'Account created — please resend the verification email.');
  }catch(e){
    console.error('Customer registration failed',e); const msg=String(e.message||'');
    if(msg==='EMAIL_NOT_VERIFIED'){ showVerifyPanel(email,{email,notice:'This email is already registered but not verified yet. Use the button below to get a fresh link.'}); return; }
    err.textContent=msg==='EMAIL_EXISTS'?'This email is already registered. Please sign in to your existing account.':msg==='PHONE_EXISTS'?'This phone number is already registered. Please use another number or sign in to your existing account.':msg==='EMAIL_AND_PHONE_EXISTS'?'An account with this email and phone number already exists. Please sign in.':msg==='USERNAME_EXISTS'?'That username is already taken.':'We could not create your account. Please check your details and try again.'; err.style.display='block';
  }finally{ setAuthButtonLoading('registerSubmitBtn',false); }
}

function doLogout(){
  if(session && session.type==='customer' && sb) sb.auth.signOut().catch(e=>console.warn('Supabase sign-out failed',e));
  session=null; saveSession(); switchCart(false);
  updateNavAccountUI();
  renderRecentlyViewed();
  if(typeof updateWishlistBadge==='function') updateWishlistBadge();
  if(typeof switchTab==='function') switchTab('dashboard');
  const acctDash=document.getElementById('acctView_dashboard');
  if(acctDash){
    ['dashboard','profile','password','orders','orderDetail','track','addresses','points','wishlist'].forEach(s=>{
      const el=document.getElementById('acctView_'+s);
      if(el) el.style.display = (s==='dashboard') ? 'block' : 'none';
    });
  }
  hideAllMainPages();
  showHomePage();
  scrollToTop();
  showToast('You have been logged out.');
}

function handleAccountClick(){
  if(!session){ showAuthPage(); return; }
  if(session.type==='admin'){
    hideAllMainPages();
    document.getElementById('admin').style.display='block';
    switchTab('dashboard');
    renderAdminProfileCard();
    document.getElementById('admin').scrollIntoView({behavior:'smooth'});
  } else {
    showAccountPage();
  }
}

function updateNavAccountUI(){
  const btn=document.getElementById('navAccountBtn');
  if(!btn) return;
  if(!session) btn.title='Login';
  else if(session.type==='admin') btn.title='Admin Panel';
  else btn.title=session.name.split(' ')[0];
}

function getCurrentUser(){
  if(!session || session.type!=='customer') return null;
  return users.find(u=>u.email===session.email) || null;
}

function renderAccountPage(){
  if(!session || session.type!=='customer'){ showAuthPage(); return; }
  const user=getCurrentUser();
  if(!user.addresses) user.addresses=[];
  if(!user.wishlist) user.wishlist=[];
  if(user.points===undefined) user.points=0;
  if(!user.pointsHistory) user.pointsHistory=[];
  document.getElementById('acct-name').textContent=user?user.name:session.name;
  document.getElementById('acct-username-view').textContent=user&&user.username?'@'+user.username:'';
  document.getElementById('acct-email').textContent=session.email;
  const avEl=document.getElementById('acct-avatar-view');
  avEl.innerHTML=user&&user.avatar?`<img alt="" src="${user.avatar}"/>`:(user&&user.name?user.name.charAt(0).toUpperCase():'—');
  document.getElementById('acctDashOrderCount').textContent=orders.filter(o=>o.customerEmail===session.email).length;
  document.getElementById('acctDashAddrCount').textContent=user.addresses.length;
  document.getElementById('acctDashWishCount').textContent=user.wishlist.length;
  document.getElementById('acctDashPointsCount').textContent=user.points||0;
  const heroT=document.getElementById('acctHeroTitle');
  if(heroT) heroT.textContent='Welcome back, '+((user&&user.name)||session.name||'').split(' ')[0];
  const rec=document.getElementById('acctRecentOrders');
  if(rec){
    const mine=orders.filter(o=>o.customerEmail===session.email).slice(0,4);
    rec.innerHTML=mine.length?mine.map(o=>`
      <div class="dash-list-row" style="cursor:pointer" onclick="viewOrderDetail('${o.id}')">
        <div>
          <div style="font-size:.84rem;color:var(--cream);font-weight:600">${esc(o.id)}</div>
          <div style="font-size:.7rem;color:var(--muted);margin-top:.15rem">${esc(o.date||'')} · ৳${Number(o.total||0).toLocaleString()}</div>
        </div>
        <span class="order-status status-${o.status}" style="font-size:.6rem">${ORDER_STAGE_LABELS[o.status]||o.status}</span>
      </div>`).join(''):'<div class="admin-empty-state" style="border:none;padding:2.2rem 1rem;background:transparent">You haven\'t placed any orders yet.</div>';
  }
  showAcctSection('dashboard');
}

function showAcctSection(name){
  ['dashboard','profile','password','orders','orderDetail','track','addresses','points','wishlist'].forEach(s=>{
    const el=document.getElementById('acctView_'+s);
    if(el) el.style.display = (s===name) ? 'block' : 'none';
  });
  const navKey=(name==='orderDetail')?'orders':name;
  document.querySelectorAll('#acctNav .acct-nav-btn').forEach(b=>b.classList.toggle('active',b.dataset.acct===navKey));
  if(name==='profile') populateProfileForm();
  if(name==='orders') renderMyOrders();
  if(name==='track') renderTrackSection();
  if(name==='orders'||name==='track'||name==='orderDetail') refreshMyOrders();
  if(name==='addresses') renderAddresses();
  if(name==='points') renderPointsPage();
  if(name==='wishlist') renderWishlist();
  if(name==='password'){
    ['pw-current','pw-new','pw-confirm'].forEach(id=>{const el=document.getElementById(id); if(el) el.value='';});
    document.getElementById('passwordError').style.display='none';
    pwResetAll();
  }
  window.scrollTo({top:0,behavior:'smooth'});
}

// ── EDIT PROFILE ─────────────────────────────────────────────────────────────
function populateProfileForm(){
  const user=getCurrentUser(); if(!user) return;
  document.getElementById('prof-name').value=user.name||'';
  document.getElementById('prof-username').value=user.username||'';
  document.getElementById('prof-email').value=user.email||'';
  document.getElementById('prof-phone').value=user.phone||'';
  document.getElementById('profileAvatarCircle').innerHTML=user.avatar?`<img alt="" src="${user.avatar}"/>`:(user.name?user.name.charAt(0).toUpperCase():'—')+'<div class="avatar-upload-edit">Change</div>';
  document.getElementById('profileError').style.display='none';
}
function handleAvatarUpload(e){
  const file=e.target.files&&e.target.files[0];
  if(!file) return;
  if(!file.type.startsWith('image/')){ showToast('Please select an image file.'); return; }
  const reader=new FileReader();
  reader.onload=function(ev){
    const user=getCurrentUser(); if(!user) return;
    user.avatar=ev.target.result;
    saveUsers();
    document.getElementById('profileAvatarCircle').innerHTML=`<img alt="" src="${user.avatar}"/><div class="avatar-upload-edit">Change</div>`;
    document.getElementById('acct-avatar-view').innerHTML=`<img alt="" src="${user.avatar}"/>`;
    showToast('✓ Profile photo updated.');
  };
  reader.readAsDataURL(file);
}
function removeAvatar(){
  const user=getCurrentUser(); if(!user) return;
  user.avatar=null; saveUsers();
  document.getElementById('profileAvatarCircle').innerHTML=(user.name?user.name.charAt(0).toUpperCase():'—')+'<div class="avatar-upload-edit">Change</div>';
  document.getElementById('acct-avatar-view').innerHTML=user.name?user.name.charAt(0).toUpperCase():'—';
  showToast('Profile photo removed.');
}
function saveProfile(){
  const user=getCurrentUser(); if(!user) return;
  const err=document.getElementById('profileError');
  const name=clean(document.getElementById('prof-name').value,60);
  const username=clean(document.getElementById('prof-username').value,30).replace(/[^\w.\-]+/g,'_');
  const phone=clean(document.getElementById('prof-phone').value,20);
  if(!name){ err.textContent='Please enter your full name.'; err.style.display='block'; return; }
  if(!username){ err.textContent='Please choose a username.'; err.style.display='block'; return; }
  const clash=users.find(u=>u.username && u.username.toLowerCase()===username.toLowerCase() && u.email!==user.email);
  if(clash){ err.textContent='That username is already taken.'; err.style.display='block'; return; }
  err.style.display='none';
  user.name=name; user.username=username; user.phone=phone;
  saveUsers();
  if(session){ session.name=name; saveSession(); }
  updateNavAccountUI();
  renderAccountPage();
  showAcctSection('dashboard');
  showToast('✓ Profile updated.');
}

// ── CHANGE PASSWORD ──────────────────────────────────────────────────────────
function changePassword(){
  const user=getCurrentUser(); if(!user) return;
  const err=document.getElementById('passwordError');
  const current=document.getElementById('pw-current').value;
  const next=document.getElementById('pw-new').value;
  const confirm=document.getElementById('pw-confirm').value;
  if(current!==user.password){ err.textContent='Current password is incorrect.'; err.style.display='block'; return; }
  if(next.length<6){ err.textContent='New password must be at least 6 characters.'; err.style.display='block'; return; }
  if(next!==confirm){ err.textContent='New passwords do not match.'; err.style.display='block'; return; }
  err.style.display='none';
  user.password=next; saveUsers();
  ['pw-current','pw-new','pw-confirm'].forEach(id=>document.getElementById(id).value='');
  showAcctSection('dashboard');
  showToast('✓ Password updated.');
}

// ── ADDRESSES ─────────────────────────────────────────────────────────────────
function renderAddresses(){
  const user=getCurrentUser(); if(!user) return;
  if(!user.addresses) user.addresses=[];
  const con=document.getElementById('addrListContainer');
  const empty=document.getElementById('addrEmpty');
  closeAddressForm();
  if(!user.addresses.length){ con.innerHTML=''; empty.style.display='block'; return; }
  empty.style.display='none';
  con.innerHTML=user.addresses.map((a,idx)=>`
    <div class="addr-card${a.isDefault?' is-default':''} reveal" style="transition-delay:${Math.min(idx*70,350)}ms">
      <div class="addr-top-row">
        <span class="addr-label-tag">${a.label||'Address'}</span>
        ${a.isDefault?'<span class="addr-default-badge">Default</span>':''}
      </div>
      <div class="addr-name-line">${a.name||''} ${a.phone?'· '+a.phone:''}</div>
      <div class="addr-detail-line">${a.address||''}${a.city?', '+a.city:''}</div>
      <div class="addr-card-actions">
        ${!a.isDefault?`<button class="status-btn" onclick="setDefaultAddress('${a.id}')">Set Default</button>`:''}
        <button class="status-btn" onclick="openAddressForm('${a.id}')">Edit</button>
        <button class="status-btn" style="border-color:rgba(201,112,112,.3);color:#c97070" onclick="deleteAddress('${a.id}')">Delete</button>
      </div>
    </div>`).join('');
  observeReveals();
}
function openAddressForm(id){
  const user=getCurrentUser(); if(!user) return;
  document.getElementById('addrFormWrap').style.display='block';
  document.getElementById('addressError').style.display='none';
  const addr = id ? user.addresses.find(a=>a.id===id) : null;
  document.getElementById('addr-edit-id').value=addr?addr.id:'';
  document.getElementById('addr-label').value=addr?addr.label:'';
  document.getElementById('addr-name').value=addr?addr.name:(user.name||'');
  document.getElementById('addr-phone').value=addr?addr.phone:(user.phone||'');
  document.getElementById('addr-address').value=addr?addr.address:'';
  document.getElementById('addr-city').value=addr?addr.city:'';
  document.getElementById('addr-default').checked=addr?!!addr.isDefault:(user.addresses.length===0);
  document.getElementById('addrFormWrap').scrollIntoView({behavior:'smooth',block:'center'});
}
function closeAddressForm(){
  const el=document.getElementById('addrFormWrap');
  if(el) el.style.display='none';
}
function saveAddress(){
  const user=getCurrentUser(); if(!user) return;
  const err=document.getElementById('addressError');
  const label=clean(document.getElementById('addr-label').value,30)||'Address';
  const name=clean(document.getElementById('addr-name').value,60);
  const phone=clean(document.getElementById('addr-phone').value,20);
  const address=clean(document.getElementById('addr-address').value,200);
  const city=clean(document.getElementById('addr-city').value,60);
  const isDefault=document.getElementById('addr-default').checked;
  const editId=document.getElementById('addr-edit-id').value;
  if(!name||!phone||!address){ err.textContent='Please fill in name, phone, and address.'; err.style.display='block'; return; }
  err.style.display='none';
  if(!user.addresses) user.addresses=[];
  if(isDefault) user.addresses.forEach(a=>a.isDefault=false);
  if(editId){
    const a=user.addresses.find(x=>x.id===editId);
    if(a){ Object.assign(a,{label,name,phone,address,city,isDefault}); }
  } else {
    user.addresses.push({id:'addr_'+Date.now(),label,name,phone,address,city,isDefault:isDefault||user.addresses.length===0});
  }
  saveUsers();
  renderAddresses();
  showToast('✓ Address saved.');
}
function setDefaultAddress(id){
  const user=getCurrentUser(); if(!user) return;
  user.addresses.forEach(a=>a.isDefault=(a.id===id));
  saveUsers(); renderAddresses(); showToast('✓ Default address updated.');
}
function deleteAddress(id){
  const user=getCurrentUser(); if(!user) return;
  if(!confirm('Delete this address?')) return;
  user.addresses=user.addresses.filter(a=>a.id!==id);
  if(user.addresses.length && !user.addresses.some(a=>a.isDefault)) user.addresses[0].isDefault=true;
  saveUsers(); renderAddresses(); showToast('Address deleted.');
}

// ── WISHLIST ──────────────────────────────────────────────────────────────────
function wishHeartHTML(productId){
  const active=isWishlisted(productId);
  return `<button class="wish-heart-btn${active?' active':''}" title="${active?'Remove from wish list':'Add to wish list'}" onclick="event.stopPropagation();toggleWishlist(${productId})">
    <svg viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78Z"/></svg>
  </button>`;
}
function isWishlisted(productId){
  const user=getCurrentUser();
  return !!(user && user.wishlist && user.wishlist.includes(productId));
}
function toggleWishlist(productId){
  const user=getCurrentUser();
  if(!user){ showToast('Please sign in to save items to your wish list.'); showAuthPage(); return; }
  if(!user.wishlist) user.wishlist=[];
  const i=user.wishlist.indexOf(productId);
  if(i>-1){ user.wishlist.splice(i,1); showToast('Removed from wish list.'); }
  else { user.wishlist.push(productId); showToast('✓ Added to wish list.'); }
  saveUsers();
  updateWishlistBadge();
  renderProducts(); renderCollection();
  if(currentModalProduct && currentModalProduct.id===productId){
    const btn=document.querySelector('#modalImg .wish-heart-btn');
    if(btn) btn.outerHTML=wishHeartHTML(productId);
  }
  const wlView=document.getElementById('acctView_wishlist');
  if(wlView && wlView.style.display!=='none') renderWishlist();
}
function renderPointsPage(){
  const user=getCurrentUser(); if(!user) return;
  if(user.points===undefined) user.points=0;
  if(!user.pointsHistory) user.pointsHistory=[];
  document.getElementById('pointsBalanceDisplay').textContent=(user.points||0).toLocaleString()+' PTS';
  document.getElementById('pointsBalanceValue').textContent=(user.points||0).toLocaleString();
  const con=document.getElementById('pointsHistoryContainer');
  const empty=document.getElementById('pointsHistoryEmpty');
  const history=user.pointsHistory.slice().reverse();
  if(!history.length){ con.innerHTML=''; empty.style.display='block'; return; }
  empty.style.display='none';
  con.innerHTML=history.map(h=>`
    <div class="points-history-row">
      <div>
        <div class="points-history-title">${h.title}</div>
        <div class="points-history-date">${h.date}</div>
      </div>
      <div class="points-history-amt ${h.amount>=0?'earn':'redeem'}">${h.amount>=0?'+':''}${h.amount.toLocaleString()} PTS</div>
    </div>`).join('');
}
function renderWishlist(){
  const user=getCurrentUser();
  const grid=document.getElementById('wishlistGrid');
  const empty=document.getElementById('wishlistEmpty');
  const ids=(user&&user.wishlist)?user.wishlist:[];
  const list=products.filter(p=>ids.includes(p.id));
  if(!list.length){ grid.innerHTML=''; empty.style.display='block'; return; }
  empty.style.display='none';
  grid.innerHTML=list.map((p,idx)=>buildProductCard(p,idx)).join('');
  observeReveals();
}
function updateWishlistBadge(){
  const user=getCurrentUser();
  const count=(user&&user.wishlist)?user.wishlist.length:0;
  const el=document.getElementById('wishlistCount');
  if(el) el.textContent=count;
}
function handleWishlistNavClick(){
  if(!session || session.type!=='customer'){ showToast('Please sign in to view your wish list.'); showAuthPage(); return; }
  showAccountPage();
  showAcctSection('wishlist');
}

const CHECK_ICON='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="m8.5 12.5 2.5 2.5 5-5"/></svg>';

function renderMyOrders(){
  const con=document.getElementById('myOrdersContainer');
  const empty=document.getElementById('myOrdersEmpty');
  const mine=orders.filter(o=>o.customerEmail && o.customerEmail===session.email);
  mine.forEach(ensureOrderShape);
  if(!mine.length){ con.innerHTML=''; empty.style.display='block'; return; }
  empty.style.display='none';
  con.innerHTML=mine.map((o,idx)=>{
    const first=o.items[0];
    const extraCount=o.items.length-1;
    return `
    <div class="myorder-card reveal" style="transition-delay:${Math.min(idx*70,350)}ms">
      <div class="myorder-card-top">
        <div>
          <div class="myorder-id">Order# ${o.id.replace('ESS-','')}</div>
          <div class="myorder-date">Date Added: ${o.date}</div>
        </div>
        <span class="order-status myorder-status-pill status-${o.status}">${o.status==='finished'?CHECK_ICON:''}${ORDER_STAGE_LABELS[o.status]||o.status}</span>
      </div>
      ${buildMiniProgress(o)}
      <div class="myorder-products">
        <div class="myorder-product-row">
          <div class="myorder-product-img">${first.photo?`<img alt="" src="${first.photo}"/>`:'🧴'}</div>
          <div class="myorder-product-name">${first.name}${extraCount>0?`<br><span style="color:var(--muted);font-size:.72rem">+${extraCount} Item(s)</span>`:`<br><span style="color:var(--muted);font-size:.72rem">${first.brand} · ${first.ml}ml${first.qty>1?' × '+first.qty:''}</span>`}</div>
          <div class="myorder-product-price">৳${o.total.toLocaleString()}</div>
          <button class="myorder-view-btn" onclick="viewOrderDetail('${o.id}')">View</button>
          <button class="myorder-view-btn myorder-track-btn" onclick="trackFromCard('${o.id}')">Track</button>
        </div>
      </div>
    </div>`;}).join('');
  observeReveals();
}

let __odCurrent='';
function fillOrderDetail(o){
  ensureOrderShape(o);
  __odCurrent=o.id;
  const trk=document.getElementById('odTracker'); if(trk) trk.innerHTML=`<div class="trk-card">${buildTrackerHTML(o,{noUpdates:true})}</div>`;
  document.getElementById('odIdHeading').textContent='#'+o.id.replace('ESS-','');
  const pill=document.getElementById('odStatusPill');
  pill.className='order-status status-'+o.status;
  pill.textContent=ORDER_STAGE_LABELS[o.status]||o.status;

  document.getElementById('odAddress').innerHTML=`
    <strong>${o.customer.name}</strong><br>
    ${o.customer.address}${o.customer.district?', '+o.customer.district:''}<br>
    Bangladesh
    <div class="muted-line">Mobile: ${o.customer.phone}</div>`;

  document.getElementById('odSummary').innerHTML=`
    <div class="order-summary-row"><span>Sub-Total</span><span>৳${o.subtotal.toLocaleString()}</span></div>
    <div class="order-summary-row"><span>Home Delivery</span><span>৳${o.delivery.toLocaleString()}</span></div>
    ${o.tierDiscount?`<div class="order-summary-row"><span>Spend Discount (${o.tierDiscount.pct}%)</span><span>-৳${o.tierDiscount.discount.toLocaleString()}</span></div>`:''}
    ${o.coupon?`<div class="order-summary-row"><span>Coupon (${o.coupon.code})</span><span>-৳${o.coupon.discount.toLocaleString()}</span></div>`:''}
    ${o.pointsRedeemed?`<div class="order-summary-row"><span>Essentra Points Redeemed</span><span>-৳${o.pointsRedeemed.toLocaleString()}</span></div>`:''}
    <div class="order-summary-row grand"><span>Total</span><span>৳${o.total.toLocaleString()}</span></div>
    <div class="order-summary-row paid"><span>Paid</span><span>৳${o.paid.toLocaleString()}</span></div>
    <div class="order-summary-row due"><span>Due</span><span>৳${o.due.toLocaleString()}</span></div>
    ${o.pointsEarned?`<div class="order-summary-row"><span>Points Earned</span><span>+${o.pointsEarned.toLocaleString()} PTS</span></div>`:''}`;

  document.getElementById('odProductsBody').innerHTML=o.items.map(i=>`
    <tr>
      <td><div class="order-detail-prod-cell"><div class="myorder-product-img">${i.photo?`<img alt="" src="${i.photo}"/>`:'🧴'}</div><span>${i.name}</span></div></td>
      <td>${i.qty}</td>
      <td>৳${(i.price*i.qty).toLocaleString()}</td>
    </tr>`).join('');

  let cancelBtnWrap=document.getElementById('odCancelBtnWrap');
  if(!cancelBtnWrap){
    cancelBtnWrap=document.createElement('div');
    cancelBtnWrap.id='odCancelBtnWrap';
    cancelBtnWrap.style.marginTop='1.6rem';
    document.querySelector('#acctView_orderDetail .order-detail-card').appendChild(cancelBtnWrap);
  }
  cancelBtnWrap.innerHTML = o.status==='pending'
    ? `<button class="status-btn" style="border-color:rgba(201,112,112,.3);color:#c97070" onclick="customerCancelOrder('${o.id}')">Cancel Order</button>`
    : '';

  const stageEntries=o.history.filter(h=>h.stage!=='cancelled').slice().reverse();
  const cancelledEntry=o.history.find(h=>h.stage==='cancelled');
  const allEntries=cancelledEntry?[cancelledEntry,...stageEntries]:stageEntries;
  document.getElementById('odTimeline').innerHTML=allEntries.map(h=>`
    <div class="timeline-item${h.stage==='cancelled'?' is-cancelled':''}">
      <div class="timeline-title">${h.title}</div>
      ${h.note?`<div class="timeline-note">${h.note}</div>`:''}
      <div class="timeline-date">${h.date}</div>
    </div>`).join('');

}
function viewOrderDetail(id){
  const o=orders.find(x=>x.id===id); if(!o) return;
  fillOrderDetail(o);
  showAcctSection('orderDetail');
}

function customerCancelOrder(id){
  const o=orders.find(x=>x.id===id);
  if(!o || o.status!=='pending') return;
  const reason=prompt('Please enter a reason for cancelling this order:','');
  if(reason===null) return;
  if(!reason.trim()){ showToast('Please provide a cancellation reason.'); return; }
  o.status='cancelled'; o.cancelReason=reason.trim();
  upsertHistory(o,'cancelled','Cancelled',reason.trim());
  syncOrders();
  showAcctSection('orders');
  showToast(`Order ${id} has been cancelled.`);
}

// ── ORDER TRACKING (customer) ────────────────────────────────────────────────
const TRACK_INFO={
  pending:'We have received your order and will confirm it shortly.',
  paymentPaid:'Your payment has been received. Thank you!',
  confirmed:'Your order is confirmed and is being prepared.',
  billing:'Your invoice has been generated and your order is being packed.',
  shipped:'Your order is on its way to you.',
  delivered:'Your order has been delivered.',
  finished:'Order completed. Thank you for shopping with us!'
};
const TRACK_PAY_NAMES={cod:'Cash on Delivery',bkash:'bKash',nagad:'Nagad',rocket:'Rocket'};
function trkEsc(s){ return String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function trkShortId(id){ return String(id||'').replace(/^ESS-/i,''); }
function trkNormId(v){ v=String(v||'').trim().replace(/\s+/g,''); if(!v) return ''; return /^ess-/i.test(v)?'ESS-'+v.slice(4):'ESS-'+v; }
function trkPhoneKey(v){ return String(v||'').replace(/\D/g,'').slice(-10); }
function trkNote(h){
  if(!h) return '';
  const n=String(h.note||'').trim();
  if(!n || /^done$/i.test(n)) return TRACK_INFO[h.stage]||'';
  if(h.stage==='paymentPaid' && /^Payer Info/i.test(n)) return TRACK_INFO.paymentPaid;
  return n;
}
function buildMiniProgress(o){
  if(o.status==='cancelled') return '<div class="trk-mini trk-mini-cancel">✕ This order was cancelled</div>';
  let idx=ORDER_STAGES.indexOf(o.status); if(idx<0) idx=0;
  const pct=Math.round(((idx+1)/ORDER_STAGES.length)*100);
  return `<div class="trk-mini"><div class="trk-mini-bar"><span style="width:${pct}%"></span></div><div class="trk-mini-txt">${trkEsc(ORDER_STAGE_LABELS[o.status]||o.status)} · step ${idx+1} of ${ORDER_STAGES.length}</div></div>`;
}
function buildTrackerHTML(o,opts){
  opts=opts||{};
  ensureOrderShape(o);
  const cancelled=o.status==='cancelled';
  let idx=ORDER_STAGES.indexOf(o.status); if(idx<0) idx=0;
  const hist=Array.isArray(o.history)?o.history.filter(Boolean):[];
  const byStage={}; hist.forEach(h=>{ if(h.stage) byStage[h.stage]=h; });
  const steps=ORDER_STAGES.map((s,i)=>{
    let st='';
    if(cancelled) st=byStage[s]?'done':'';
    else if(i<idx || (s==='finished' && i===idx)) st='done';
    else if(i===idx) st='current';
    const h=byStage[s];
    return `<li class="trk-step ${st}"><span class="trk-dot">${st==='done'?'✓':i+1}</span><div class="trk-stext"><div class="trk-sl">${ORDER_STAGE_LABELS[s]}</div><div class="trk-sd">${(st&&h&&h.date)?trkEsc(h.date):''}</div></div></li>`;
  }).join('');

  let now='';
  if(cancelled){
    now=`<div class="trk-cancel"><b>Order cancelled</b>${o.cancelReason?`<div>Reason: ${trkEsc(o.cancelReason)}</div>`:''}</div>`;
  } else {
    const cur=byStage[o.status];
    let extra='';
    if(o.status==='shipped' && (o.deliverymanName||o.deliverymanPhone)){
      extra+=`<div class="trk-ride"><span>🚚 Deliveryman: <b>${trkEsc(o.deliverymanName||'Our rider')}</b></span>${o.deliverymanPhone?`<a class="trk-call" href="tel:${trkEsc(String(o.deliverymanPhone).replace(/[^\d+]/g,''))}">Call ${trkEsc(o.deliverymanPhone)}</a>`:''}</div>`;
    }
    if(o.invoiceNo && idx>=ORDER_STAGES.indexOf('billing')) extra+=`<div class="trk-ride"><span>🧾 Invoice: <b>${trkEsc(o.invoiceNo)}</b></span></div>`;
    now=`<div class="trk-now"><div class="trk-now-title">${trkEsc(ORDER_STAGE_LABELS[o.status]||o.status)}</div><div class="trk-now-text">${trkEsc(trkNote(cur)||TRACK_INFO[o.status]||'')}</div>${extra}</div>`;
  }

  const items=(o.items||[]).map(i=>`<li><span>${trkEsc(i.name)}${i.ml?` <em>${trkEsc(i.ml)}ml</em>`:''}</span><b>× ${Number(i.qty)||1}</b></li>`).join('');
  const total=Number(o.total)||0, paid=Number(o.paid)||0, due=Math.max(0,Number(o.due)||0);
  const pmKey=o.payment&&o.payment.method?String(o.payment.method).toLowerCase():'';
  const payLine=`${trkEsc(TRACK_PAY_NAMES[pmKey]||pmKey.toUpperCase()||'Payment')} · Total ৳${total.toLocaleString()} · ${due>0?`<b>Due ৳${due.toLocaleString()}</b>`:`<b class="trk-paid">Paid ৳${paid.toLocaleString()}</b>`}`;
  const updates=hist.slice().reverse().map(h=>{
    const n=trkNote(h);
    return `<li><div class="trk-u-t">${trkEsc(h.title||ORDER_STAGE_LABELS[h.stage]||h.stage)}</div>${n?`<div class="trk-u-n">${trkEsc(n)}</div>`:''}<div class="trk-u-d">${trkEsc(h.date||'')}</div></li>`;
  }).join('');
  const last=hist.length?hist[hist.length-1]:null;
  const nItems=(o.items||[]).reduce((n,i)=>n+(Number(i.qty)||1),0);
  return `<div class="trk-in">
    <div class="trk-head">
      <div><div class="trk-id">Order #${trkEsc(trkShortId(o.id))}</div><div class="trk-sub">Placed ${trkEsc(o.date||'')} · ${nItems} item${nItems===1?'':'s'}</div></div>
      <span class="order-status status-${trkEsc(o.status)}">${trkEsc(ORDER_STAGE_LABELS[o.status]||o.status)}</span>
    </div>
    ${now}
    <ol class="trk-steps${cancelled?' trk-steps-x':''}">${steps}</ol>
    <div class="trk-cols${opts.noUpdates?' trk-cols-1':''}">
      <div><div class="trk-h">Items</div><ul class="trk-items">${items}</ul><div class="trk-pay">${payLine}</div></div>
      ${opts.noUpdates?'':`<div><div class="trk-h">All updates</div><ul class="trk-updates">${updates||'<li><div class="trk-u-n">No updates yet.</div></li>'}</ul></div>`}
    </div>
    ${last&&last.date?`<div class="trk-foot">Last updated: ${trkEsc(last.date)}</div>`:''}
  </div>`;
}

function myOrdersList(){
  if(!session || session.type!=='customer') return [];
  const m=orders.filter(o=>o.customerEmail && o.customerEmail===session.email);
  m.forEach(ensureOrderShape);
  return m.slice().sort((a,b)=>(b.ts||0)-(a.ts||0));
}
function renderTrackSection(){
  const box=document.getElementById('trkAcctResult'); if(!box) return;
  const input=document.getElementById('trkAcctInput');
  const q=String(input?input.value:'').trim().toLowerCase().replace(/^ess-/,'');
  const mine=myOrdersList();
  if(!mine.length){
    box.innerHTML='<div class="trk-empty">You haven\'t placed any orders yet. <a href="/collection" onclick="showCollectionPage();return false;" style="color:var(--gold)">Start shopping →</a></div>';
    return;
  }
  let list;
  if(q){
    list=mine.filter(o=>trkShortId(o.id).toLowerCase().includes(q));
    if(!list.length){ box.innerHTML=`<div class="trk-empty">None of your orders match “${trkEsc(q)}”.</div>`; return; }
  } else {
    const active=mine.filter(o=>['finished','cancelled','delivered'].indexOf(o.status)===-1);
    list=active.length?active:[mine[0]];
  }
  box.innerHTML=list.map(o=>`<div class="trk-card">${buildTrackerHTML(o)}<div class="trk-actions"><button type="button" class="status-btn" onclick="viewOrderDetail('${trkEsc(o.id)}')">Full order details</button></div></div>`).join('')
    +(!q&&mine.length>list.length?`<div class="trk-more">Showing ${list.length>1?'your active orders':'your latest order'}. Search an Order ID above for any other order, or <a href="#" onclick="showAcctSection('orders');return false;">view all orders</a>.</div>`:'');
}
function trackFromCard(id){
  showAcctSection('track');
  const input=document.getElementById('trkAcctInput'); if(input) input.value=trkShortId(id);
  renderTrackSection();
}
function trackJustPlaced(){
  const id=window.__lastOrderId||'';
  closeCheckout();
  if(session && session.type==='customer'){
    showAccountPage(); showAcctSection('track');
    const input=document.getElementById('trkAcctInput'); if(input){ input.value=trkShortId(id); renderTrackSection(); }
  } else openTrackOverlay(id);
}

// ── public "Track Order" window (Order ID + phone) ───────────────────────────
let __trkTimer=null, __trkLast='';
function openTrackOverlay(prefillId){
  const ov=document.getElementById('trackOverlay'); if(!ov) return;
  if(prefillId) document.getElementById('trkOrderId').value=trkShortId(prefillId);
  try{ const u=getCurrentUser&&getCurrentUser(); const ph=document.getElementById('trkPhone'); if(u&&u.phone&&ph&&!ph.value) ph.value=u.phone; }catch(e){}
  document.getElementById('trkMsg').textContent='';
  ov.classList.add('open');
  if(document.getElementById('trkOrderId').value && (document.getElementById('trkPhone').value || myOrdersList().length)) trackOrderLookup();
}
function closeTrackOverlay(){
  const ov=document.getElementById('trackOverlay'); if(ov) ov.classList.remove('open');
  stopTrkWatch();
}
function stopTrkWatch(){ if(__trkTimer){ clearInterval(__trkTimer); __trkTimer=null; } __trkLast=''; }
function startTrkWatch(){
  if(__trkTimer) return;
  __trkTimer=setInterval(async()=>{
    const ov=document.getElementById('trackOverlay');
    if(document.hidden || !ov || !ov.classList.contains('open')) return;
    if(session && session.type==='customer') await refreshMyOrders(true);
    trackOrderLookup(true);
  },30000);
}
async function trkFetch(id,phoneKey){
  if(sb){
    try{
      const {data,error}=await sb.rpc('track_order',{p_order_id:id,p_phone:phoneKey});
      if(!error && data) return data.found?{order:data.order}:{order:null};
    }catch(e){}
  }
  // tracking function not installed (or offline): use the orders this browser already has
  const o=orders.find(x=>x.id===id && trkPhoneKey(x.customer&&x.customer.phone)===phoneKey);
  return {order:o||null};
}
async function trackOrderLookup(silent){
  const msg=document.getElementById('trkMsg'), res=document.getElementById('trkResult'), btn=document.getElementById('trkGo');
  const id=trkNormId(document.getElementById('trkOrderId').value);
  const pk=trkPhoneKey(document.getElementById('trkPhone').value);
  const own=(session&&session.type==='customer')?orders.find(o=>o.id===id && o.customerEmail && o.customerEmail===session.email):null;
  if(!id){ msg.textContent='Please enter your Order ID.'; return; }
  if(!own && pk.length<10){ msg.textContent='Please enter the phone number you used for this order.'; return; }
  if(!silent){ btn.disabled=true; btn.textContent='Checking…'; msg.textContent=''; }
  let r; try{ r=own?{order:own}:await trkFetch(id,pk); }catch(e){ r={order:null}; }
  if(!silent){ btn.disabled=false; btn.textContent='Track Order'; }
  if(!r.order){
    if(!silent){ msg.textContent='We could not find an order with those details. Please check the Order ID and phone number.'; res.innerHTML=''; stopTrkWatch(); }
    return;
  }
  msg.textContent='';
  const o=r.order; ensureOrderShape(o);
  const key=o.id+':'+o.status;
  if(silent && __trkLast && __trkLast.split(':')[0]===o.id && __trkLast!==key) showToast(`Your order is now ${ORDER_STAGE_LABELS[o.status]||o.status}.`);
  __trkLast=key;
  res.innerHTML=`<div class="trk-card">${buildTrackerHTML(o)}</div>`;
  startTrkWatch();
}

// ── live refresh: admin changes reach the customer without reloading ─────────
let __ordSyncBusy=false;
function trkViewVisible(){
  return ['acctView_orders','acctView_track','acctView_orderDetail'].some(id=>{ const e=document.getElementById(id); return e && e.style.display==='block'; });
}
function rerenderTrackingViews(){
  const vis=id=>{ const e=document.getElementById(id); return !!e && e.style.display==='block'; };
  try{
    if(vis('acctView_orders')) renderMyOrders();
    if(vis('acctView_track')) renderTrackSection();
    if(vis('acctView_orderDetail') && __odCurrent){ const o=orders.find(x=>x.id===__odCurrent); if(o) fillOrderDetail(o); }
  }catch(e){ console.warn('tracking re-render failed',e); }
}
async function refreshMyOrders(silent){
  if(__ordSyncBusy || !sb || !session || session.type!=='customer') return;
  __ordSyncBusy=true;
  try{
    const ids=myOrdersList().map(o=>o.id);
    let rows=null;
    if(ids.length){
      const r2=await sb.from('orders').select('id,data').in('id',ids);       // the store's live copy (has admin updates)
      if(!r2.error && r2.data && r2.data.length) rows=r2.data;
    }
    if(!rows){
      const r1=await sb.from('customer_orders').select('id,data');          // customer's own copy (kept in sync by tracking SQL)
      if(!r1.error && r1.data && r1.data.length) rows=r1.data;
    }
    if(!rows) return;
    let changed=false;
    rows.forEach(r=>{
      const d=r.data; if(!d||!d.id) return;
      const i=orders.findIndex(o=>o.id===d.id);
      if(i===-1){ if(d.customerEmail===session.email){ orders.push(d); changed=true; } return; }
      const old=orders[i];
      if(JSON.stringify(old)===JSON.stringify(d)) return;
      if(old.status!==d.status && !silent){ try{ showToast(`Order #${trkShortId(d.id)} is now ${ORDER_STAGE_LABELS[d.status]||d.status}.`); }catch(e){} }
      orders[i]=d; changed=true;
      if(typeof cloudSnap!=='undefined' && cloudSnap && cloudSnap.orders) cloudSnap.orders[String(d.id)]=JSON.stringify(d);
    });
    if(changed){ save('essentra_orders',orders); rerenderTrackingViews(); }
  }catch(e){ console.warn('order refresh failed',e); }
  finally{ __ordSyncBusy=false; }
}
setInterval(()=>{ if(!document.hidden && session && session.type==='customer' && trkViewVisible()) refreshMyOrders(); },30000);
document.addEventListener('visibilitychange',()=>{ if(!document.hidden && session && session.type==='customer' && trkViewVisible()) refreshMyOrders(); });

// Admin username/password now managed via Settings tab
function saveSettings(){
  const newName = document.getElementById('set-adminname') ? document.getElementById('set-adminname').value.trim() : '';
  const newUser = document.getElementById('set-adminuser') ? document.getElementById('set-adminuser').value.trim() : '';
  const newPass = document.getElementById('set-newpass') ? document.getElementById('set-newpass').value.trim() : '';
  if(newName){ adminCreds.name=newName; if(session && session.type==='admin'){ session.name=newName; saveSession(); } }
  if(newUser){ adminCreds.username=newUser; }
  if(newPass && newPass.length>=6){ adminCreds.password=newPass; }
  saveAdminCreds();
  renderAdminProfileCard();
  if(newName || newUser || (newPass && newPass.length>=6)) showToast('✓ Admin credentials updated.');
  settings={
    ...settings,
    siteName:document.getElementById('set-sitename').value.trim()||'Essentra',
    footerWordmark:document.getElementById('set-footerwordmark').value.trim(),
    email:document.getElementById('set-email').value.trim(),
    address:document.getElementById('set-address').value.trim(),
    facebook:document.getElementById('set-facebook').value.trim(),
    whatsapp:document.getElementById('set-whatsapp').value.trim(),
    instagram:document.getElementById('set-instagram').value.trim(),
    bkash:document.getElementById('set-bkash').value.trim(),
    nagad:document.getElementById('set-nagad').value.trim(),
    rocket:document.getElementById('set-rocket').value.trim(),
    phone:document.getElementById('set-phone').value.trim(),
    deliveryInside:Number(document.getElementById('set-deliveryInside').value)||80,
    deliveryOutside:Number(document.getElementById('set-deliveryOutside').value)||140,
    freeabove:Number(document.getElementById('set-freeabove').value)||0,
    promoItems:[...document.querySelectorAll('#promoItemsList input')].map(i=>i.value.trim()).filter(Boolean),
    promoInterval:clampPromoInterval(document.getElementById('set-promoInterval')?document.getElementById('set-promoInterval').value:2.5),
    pointsMinSpend:Number(document.getElementById('set-pointsminspend').value)||0,
    pointsPerAmount:Number(document.getElementById('set-pointsperamount').value)||100,
    pointsValue:Number(document.getElementById('set-pointsvalue').value)||1,
  };
  syncSettingsCloud();
  document.getElementById('set-newpass').value='';
  renderCart(); updateContactInfo(); applyBranding(); renderProducts(); renderCollection(); updatePointsRuleBox(); updatePromoBanner(); updateDeliveryZoneLabels(); showToast('✓ Settings saved.');
}

// Update contact info & social links from settings (all set by the site owner in Admin → Settings)
function updateContactInfo(){
  const setLine=(id,val)=>{
    const el=document.getElementById(id); if(!el) return;
    el.textContent=val||'Set in Admin → Settings';
    if(id.startsWith('footer-') && el.parentElement) el.parentElement.style.display=val?'':'none';
  };
  setLine('contact-phone',settings.phone);
  setLine('footer-phone',settings.phone);
  setLine('footer-email',settings.email);
  setLine('contact-email',settings.email);
  setLine('footer-address',settings.address);
  setLine('contact-address',settings.address);
  wireSocial('footerIG', settings.instagram, 'Instagram link not set yet. Add it in Admin → Settings.');
  wireSocial('footerFB', settings.facebook, 'Facebook link not set yet. Add it in Admin → Settings.');
  wireSocial('footerWA', settings.whatsapp ? ('https://wa.me/'+settings.whatsapp.replace(/[^0-9]/g,'')) : '', 'WhatsApp number not set yet. Add it in Admin → Settings.');
}
function wireSocial(id,url,msg){
  const el=document.getElementById(id);
  if(!el) return;
  if(url){
    el.href=url; el.target='_blank'; el.rel='noopener';
    el.onclick=null;
  } else {
    el.href=location.origin+'/'; el.removeAttribute('target');
    el.onclick=function(e){ e.preventDefault(); showToast(msg); };
  }
}
function updatePointsRuleBox(){
  const box=document.getElementById('pointsRuleBox');
  if(!box) return;
  const minSpend=Number(settings.pointsMinSpend)||0;
  const perAmount=Number(settings.pointsPerAmount)||100;
  const val=Number(settings.pointsValue)||1;
  box.textContent=`Earn 1 point for every ৳${perAmount.toLocaleString()} spent on orders above ৳${minSpend.toLocaleString()}. 1 point = ৳${val.toLocaleString()} — redeem your points as a discount at checkout.`;
}
function clampPromoInterval(v){
  const n=parseFloat(v);
  if(!isFinite(n)) return PROMO_INTERVAL/1000;
  return Math.min(60,Math.max(1,n));
}
function getPromoIntervalMs(){
  return Math.round(clampPromoInterval(settings && settings.promoInterval!=null ? settings.promoInterval : PROMO_INTERVAL/1000)*1000);
}
function setPromoIntervalPreset(sec){
  const inp=document.getElementById('set-promoInterval'); if(inp) inp.value=sec;
}
let __promoTimer=null;
function getPromoItems(){
  let items=Array.isArray(settings.promoItems)?settings.promoItems.map(s=>String(s).trim()).filter(Boolean):[];
  if(!items.length && settings.promoText && String(settings.promoText).trim()) items=[String(settings.promoText).trim()];
  if(!items.length){ items=['Shop The Full Collection']; }
  return items;
}
function promoItemEl(txt){
  const s=document.createElement('span'); s.className='promo-marquee-item'; s.innerHTML=PROMO_ICON;
  const t=document.createElement('span'); t.className='promo-discount-text'; t.textContent=txt; s.appendChild(t); return s;
}
function updatePromoBanner(){
  const bar=document.getElementById('promoBar'); if(!bar) return;
  if(__promoTimer){ clearInterval(__promoTimer); __promoTimer=null; }
  bar.innerHTML=''; bar.classList.add('promo-static');
  const items=getPromoItems();
  const el=promoItemEl(items[0]); bar.appendChild(el);
  if(items.length>1){
    let idx=0; const txt=el.querySelector('.promo-discount-text');
    __promoTimer=setInterval(()=>{
      el.classList.add('promo-out');
      setTimeout(()=>{ idx=(idx+1)%items.length; txt.textContent=items[idx]; el.classList.remove('promo-out'); },300);
    },getPromoIntervalMs());
  }
}
function addPromoRow(val){
  const list=document.getElementById('promoItemsList'); if(!list) return;
  const row=document.createElement('div'); row.className='size-row';
  const inp=document.createElement('input'); inp.className='form-input'; inp.placeholder='Banner text'; inp.maxLength=120; inp.value=val||'';
  const btn=document.createElement('button'); btn.type='button'; btn.className='remove-size-btn'; btn.title='Remove';
  btn.innerHTML='<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>';
  btn.onclick=()=>row.remove();
  row.appendChild(inp); row.appendChild(btn); list.appendChild(row);
  if(!val) inp.focus();
}
function renderPromoItemsEditor(){
  const list=document.getElementById('promoItemsList'); if(!list) return;
  const ivl=document.getElementById('set-promoInterval'); if(ivl) ivl.value=getPromoIntervalMs()/1000;
  list.innerHTML='';
  let items=Array.isArray(settings.promoItems)?settings.promoItems:[];
  if(!items.length && settings.promoText) items=[settings.promoText];
  items.forEach(t=>addPromoRow(t));
}
// ── ADMIN: PREMIUM ATOMIZERS ─────────────────────────────────────────────────
let atomizerDraft=[];
function renderAtomizerAdmin(){
  atomizerDraft=getAtomizers().map(a=>({id:a.id,ml:a.ml,price:a.price,photo:a.photo||null,active:a.active!==false}));
  drawAtomizerRows();
}
function drawAtomizerRows(){
  const el=document.getElementById('atomizerRows'); if(!el) return;
  if(!atomizerDraft.length){ el.innerHTML='<div class="cust-empty-note">No atomizers yet. Click “Add Atomizer” to create one.</div>'; return; }
  el.innerHTML=atomizerDraft.map((a,i)=>`
    <div class="atz-admin-row">
      <div class="atz-admin-photo">
        <div class="atz-admin-thumb">${a.photo?`<img alt="" src="${esc(a.photo)}"/>`:'<span>No photo</span>'}</div>
        <label class="atz-upload-btn">${a.photo?'Change':'Upload'} photo<input type="file" accept="image/*" hidden onchange="handleAtomizerPhoto(${i},this)"/></label>
        ${a.photo?`<button type="button" class="link-btn" onclick="removeAtomizerPhoto(${i})">Remove photo</button>`:''}
      </div>
      <div class="atz-admin-fields">
        <div class="atz-admin-grid">
          <div class="form-group"><label class="form-label" for="atz-ml-${i}">Size (ml)</label><input autocomplete="off" name="atz-ml-${i}" class="form-input" id="atz-ml-${i}" type="number" min="1" step="1" placeholder="e.g. 5" value="${esc(a.ml)}" oninput="atomizerDraft[${i}].ml=this.value"/></div>
          <div class="form-group"><label class="form-label" for="atz-price-${i}">Price (৳)</label><input autocomplete="off" name="atz-price-${i}" class="form-input" id="atz-price-${i}" type="number" min="0" step="1" placeholder="e.g. 350" value="${esc(a.price)}" oninput="atomizerDraft[${i}].price=this.value"/></div>
        </div>
        <label class="atz-active"><input type="checkbox" name="atz-active-${i}" ${a.active?'checked':''} onchange="atomizerDraft[${i}].active=this.checked"/> Show on store</label>
      </div>
      <button type="button" class="remove-size-btn" title="Remove atomizer" aria-label="Remove atomizer" onclick="removeAtomizerRow(${i})"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg></button>
    </div>`).join('');
}
function addAtomizerRow(){
  atomizerDraft.push({id:'atz_'+Date.now().toString(36)+Math.random().toString(36).slice(2,6),ml:'',price:'',photo:null,active:true});
  drawAtomizerRows();
}
function removeAtomizerRow(i){ atomizerDraft.splice(i,1); drawAtomizerRows(); }
function removeAtomizerPhoto(i){ if(atomizerDraft[i]){ atomizerDraft[i].photo=null; drawAtomizerRows(); } }
function handleAtomizerPhoto(i,input){
  const f=input.files&&input.files[0]; if(!f||!atomizerDraft[i]) return;
  if(!/^image\//.test(f.type)){ showToast('Please choose an image file.','error'); input.value=''; return; }
  compressImage(f,500,function(data){
    if(!data){ showToast('Could not read that image. Try another one.','error'); return; }
    if(atomizerDraft[i]){ atomizerDraft[i].photo=data; drawAtomizerRows(); }
  });
}
function saveAtomizers(){
  const seen=new Set(); const out=[];
  for(let i=0;i<atomizerDraft.length;i++){
    const a=atomizerDraft[i];
    const ml=parseInt(a.ml,10); const price=Number(a.price);
    if(!(ml>0) || a.price==='' || a.price===null || isNaN(price) || price<0){ showToast(`Atomizer ${i+1}: enter a valid size (ml) and price.`,'error'); return; }
    if(seen.has(ml)){ showToast(`You added the ${ml}ml atomizer twice — only one per size is allowed.`,'error'); return; }
    seen.add(ml);
    out.push({id:a.id,ml,price:Math.round(price),photo:a.photo||null,active:a.active!==false});
  }
  settings={...settings,atomizers:out};
  syncSettingsCloud();
  renderCart();
  if(currentModalProduct && document.getElementById('productModal').classList.contains('open')){ renderModalAtomizer(); updateModalPrice(); }
  renderAtomizerAdmin();
  showToast('✓ Atomizers saved.');
}
function applyBranding(){
  const name = settings.siteName || 'Essentra';
  document.querySelectorAll('.dynamicSiteName').forEach(el=>el.textContent=name);
  document.getElementById('pageTitle').textContent = name + ' — Premium Fragrances';
  const fc = document.getElementById('footerCopy');
  if(fc) fc.textContent = '© ' + new Date().getFullYear() + ' ' + name;
  const fw = document.getElementById('footerSiteName');
  if(fw){
    const fwt = (typeof settings.footerWordmark==='string') ? settings.footerWordmark.trim() : name;
    fw.textContent = fwt;
    const wrap = fw.closest('.ft-wordmark-wrap'); if(wrap) wrap.style.display = fwt ? '' : 'none';
    if(fwt) fitFooterWordmark();
  }
}
updateContactInfo();
applyBranding();
updatePointsRuleBox();
updatePromoBanner();
updateDeliveryZoneLabels();

function joinNewsletter(){
  const el=document.getElementById('footerEmail');
  const email=el.value.trim();
  if(!email || !email.includes('@')){ showToast('Please enter a valid email address.'); return; }
  el.value='';
  showToast(`✓ Thanks for joining the ${settings.siteName||'Essentra'} Club!`);
}

// ── CONTACT FORM ──────────────────────────────────────────────────────────────
function sendContactMsg(){
  const name=document.getElementById('msg-name').value.trim();
  const phone=document.getElementById('msg-phone').value.trim();
  const msg=document.getElementById('msg-text').value.trim();
  if(!name||!msg){ showToast('Please fill in your name and message.'); return; }
  document.getElementById('msg-name').value='';
  document.getElementById('msg-phone').value='';
  document.getElementById('msg-text').value='';
  document.getElementById('contactSuccess').style.display='block';
  setTimeout(()=>document.getElementById('contactSuccess').style.display='none',4000);
}

// Back to top button + nav scroll-spy
window.addEventListener('scroll', function(){
  const btn=document.getElementById('backToTopBtn');
  if(btn){
    if(window.scrollY>400) btn.classList.add('show'); else btn.classList.remove('show');
  }
  updateNavScrollSpy();
});
function updateNavScrollSpy(){
  const homePage=document.getElementById('homePage');
  if(!homePage || homePage.style.display==='none') return;
  const about=document.getElementById('about');
  if(!about) return;
  const probe=window.scrollY + window.innerHeight*0.3;
  let activeId='navLinkHome';
  if(probe>=about.offsetTop) activeId='navLinkStory';
  const current=document.querySelector('.nav-links a.active');
  if(!current || current.id!==activeId) setActiveNavLink(activeId);
}
function scrollToTop(){ (document.scrollingElement||document.documentElement).scrollTo({top:0,left:0,behavior:'smooth'}); }

/* ══════════════════════════════════════════════════════════════════════
   MODERN UI ENHANCEMENT LAYER — JS
   ══════════════════════════════════════════════════════════════════════ */

// ── Preloader ──
(function(){
  function hidePre(){ const pl=document.getElementById('preloader'); if(pl) pl.classList.add('hide'); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', hidePre); else hidePre();
})();

// ── Scroll progress bar + nav shrink (extends existing scroll behaviour) ──
window.addEventListener('scroll', function(){
  const doc=document.documentElement;
  const max=(doc.scrollHeight-doc.clientHeight)||1;
  const pct=Math.min(100,(window.scrollY/max)*100);
  const sp=document.getElementById('scrollProgress');
  if(sp) sp.style.width=pct+'%';
  const navEl=document.querySelector('nav');
  if(navEl){ if(window.scrollY>40) navEl.classList.add('nav-scrolled'); else navEl.classList.remove('nav-scrolled'); }
},{passive:true});

// ── Cursor glow (desktop/hover-capable only) ──
if(window.matchMedia && window.matchMedia('(hover:hover) and (pointer:fine)').matches){
  const glow=document.getElementById('cursorGlow');
  if(glow){
    let gx=0,gy=0,cx=0,cy=0;
    window.addEventListener('mousemove', function(e){
      gx=e.clientX; gy=e.clientY;
      glow.classList.add('active');
    },{passive:true});
    (function raf(){
      cx += (gx-cx)*0.12; cy += (gy-cy)*0.12;
      glow.style.transform='translate('+cx+'px,'+cy+'px) translate(-50%,-50%)';
      requestAnimationFrame(raf);
    })();
  }
}

// ── Ripple effect on interactive buttons ──
document.addEventListener('click', function(e){
  const sel='.btn-primary,.btn-ghost,.nav-cta,.checkout-btn,.place-order-btn,.modal-add,.submit-product-btn,.sidebar-clear-all-btn,.footer-join-btn,.card-overlay-btn,.filter-btn';
  const btn=e.target.closest(sel);
  if(!btn) return;
  const rect=btn.getBoundingClientRect();
  const size=Math.max(rect.width,rect.height);
  const span=document.createElement('span');
  span.className='ripple-el';
  span.style.width=span.style.height=size+'px';
  span.style.left=(e.clientX-rect.left-size/2)+'px';
  span.style.top=(e.clientY-rect.top-size/2)+'px';
  btn.appendChild(span);
  setTimeout(()=>span.remove(),650);
});

// ── Count-up animation for stat numbers (e.g. "100%", "50+") ──
(function(){
  const nums=document.querySelectorAll('.stat-num');
  if(!nums.length || !('IntersectionObserver' in window)) return;
  const io=new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if(!entry.isIntersecting) return;
      io.unobserve(entry.target);
      const el=entry.target;
      const raw=el.textContent.trim();
      const match=raw.match(/^(\d+)(.*)$/);
      if(!match) return;
      const target=parseInt(match[1],10);
      const suffix=match[2]||'';
      let cur=0; const dur=1100; const start=performance.now();
      function step(now){
        const p=Math.min(1,(now-start)/dur);
        const eased=1-Math.pow(1-p,3);
        cur=Math.round(target*eased);
        el.textContent=cur+suffix;
        if(p<1) requestAnimationFrame(step); else el.textContent=target+suffix;
      }
      requestAnimationFrame(step);
    });
  },{threshold:0.4});
  nums.forEach(function(el){ io.observe(el); });
})();


// ── FOOTER ───────────────────────────────────────────────────────────────────
function footerAccount(section){
  if(!session || session.type!=='customer'){ handleAccountClick(); return; }
  showAccountPage();
  if(typeof showAcctSection==='function') showAcctSection(section);
}
function fitFooterWordmark(){
  const box=document.getElementById('ftWordmark'); if(!box) return;
  const span=box.firstElementChild; if(!span) return;
  const avail=box.clientWidth; if(!avail) return;
  box.style.fontSize='100px';
  const w=span.getBoundingClientRect().width; if(!w) return;
  box.style.fontSize=Math.max(10,Math.floor(100*avail/w*0.995))+'px';
}
(function(){
  const box=document.getElementById('ftWordmark'); if(!box) return;
  window.addEventListener('resize',fitFooterWordmark);
  window.addEventListener('load',fitFooterWordmark);
  if(document.fonts&&document.fonts.ready) document.fonts.ready.then(fitFooterWordmark);
  new MutationObserver(fitFooterWordmark).observe(box,{childList:true,subtree:true,characterData:true});
  fitFooterWordmark();
})();


/* ══════════════ MOBILE UI (menu + filter sheet) ══════════════ */
function toggleMobileMenu(force){
  const d=document.getElementById('mmDrawer'), b=document.getElementById('mmBackdrop'), btn=document.getElementById('navBurger');
  if(!d) return;
  const open=(typeof force==='boolean')?force:!d.classList.contains('open');
  d.classList.toggle('open',open); b.classList.toggle('open',open);
  d.setAttribute('aria-hidden',String(!open)); if(btn){ btn.classList.toggle('open',open); btn.setAttribute('aria-expanded',String(open)); }
  document.body.classList.toggle('no-scroll',open);
}
function toggleShopFilters(force){
  const s=document.getElementById('shopSidebar'), b=document.getElementById('sfBackdrop');
  if(!s) return;
  const open=(typeof force==='boolean')?force:!s.classList.contains('open');
  s.classList.toggle('open',open); b.classList.toggle('open',open);
  document.body.classList.toggle('no-scroll',open);
}
document.addEventListener('keydown',function(e){ if(e.key==='Escape'){ toggleMobileMenu(false); toggleShopFilters(false); } });
window.addEventListener('resize',function(){ if(window.innerWidth>860){ toggleMobileMenu(false); toggleShopFilters(false); } });

// ── MOBILE APP-STYLE NAV (admin + customer account) ──────────────────────────
(function(){
  const CFG=[
    {key:'admin',root:'admin',title:'Admin Menu',attr:'tab',btns:'#admin .admin-sidebar .tab-btn',groups:'#admin .admin-sidebar .nav-group',
      bar:[['dashboard','Home'],['orders','Orders'],['addProduct','Add',1],['manageProducts','Products']],
      moreIcon:true,badge:'orderBadge'},
    {key:'acct',root:'accountPage',title:'My Account',attr:'acct',btns:'#acctNav .acct-nav-btn',groups:'#acctNav .nav-group',
      bar:[['dashboard','Home'],['orders','Orders'],['wishlist','Wishlist'],['points','Points']],moreIcon:true}
  ];
  const MORE='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="5" cy="12" r="1.4" fill="currentColor"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/><circle cx="19" cy="12" r="1.4" fill="currentColor"/></svg>';
  const OUT='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/></svg>';
  const inst=[];
  function label(b){return (b.textContent||'').replace(/\s+/g,' ').trim().replace(/\d+$/,'').trim();}
  function svgOf(b){const s=b.querySelector('svg');return s?s.outerHTML.replace(/ width="\d+"/,'').replace(/ height="\d+"/,''):'';}
  function build(c){
    const origs=[...document.querySelectorAll(c.btns)]; if(!origs.length) return;
    const keyOf=b=>b.dataset[c.attr];
    const bar=document.createElement('div'); bar.setAttribute('role','navigation'); bar.className='mobnav'; bar.dataset.for=c.key; bar.setAttribute('aria-label',c.title);
    const items={};
    c.bar.forEach(([k,short,cta])=>{
      const o=origs.find(b=>keyOf(b)===k); if(!o) return;
      const btn=document.createElement('button'); btn.type='button'; btn.className='mobnav-btn'+(cta?' cta':''); btn.dataset.k=k; btn.setAttribute('aria-label',label(o));
      btn.innerHTML=svgOf(o)+'<span class="l">'+short+'</span>'+(k==='orders'&&c.badge?'<i class="mobnav-badge"></i>':'');
      btn.onclick=()=>{closeSheet();o.click();};
      bar.appendChild(btn); items[k]=btn;
    });
    const more=document.createElement('button'); more.type='button'; more.className='mobnav-btn'; more.dataset.k='__more'; more.setAttribute('aria-label','More');
    more.innerHTML=MORE+'<span class="l">More</span>'; more.onclick=()=>openSheet(c.key);
    bar.appendChild(more);
    const bd=document.createElement('div'); bd.className='mobsheet-bd'; bd.dataset.for=c.key; bd.onclick=closeSheet;
    const sh=document.createElement('div'); sh.className='mobsheet'; sh.dataset.for=c.key; sh.setAttribute('role','dialog'); sh.setAttribute('aria-label',c.title);
    sh.innerHTML='<div class="mobsheet-grab"></div><div class="mobsheet-head"><div class="mobsheet-title">'+c.title+'</div><button type="button" class="mobsheet-x" aria-label="Close">&times;</button></div><div class="mobsheet-body"></div>';
    sh.querySelector('.mobsheet-x').onclick=closeSheet;
    const body=sh.querySelector('.mobsheet-body'); const sItems={};
    const nodes=[...document.querySelectorAll(c.groups+','+c.btns)].sort((a,b)=>a.compareDocumentPosition(b)&2?1:-1);
    let grid=null;
    nodes.forEach(n=>{
      if(n.classList.contains('nav-group')){
        const g=document.createElement('div'); g.className='mobsheet-group'; g.textContent=n.textContent.trim(); body.appendChild(g);
        grid=document.createElement('div'); grid.className='mobsheet-grid'; body.appendChild(grid);
      }else{
        if(!grid){grid=document.createElement('div');grid.className='mobsheet-grid';body.appendChild(grid);}
        const it=document.createElement('button'); it.type='button'; it.className='mobsheet-item'; it.dataset.k=keyOf(n);
        it.innerHTML=svgOf(n)+'<span>'+label(n)+'</span>'+(keyOf(n)==='orders'&&c.badge?'<i class="mobnav-badge"></i>':'');
        it.onclick=()=>{closeSheet();n.click();};
        grid.appendChild(it); sItems[keyOf(n)]=it;
      }
    });
    const g=document.createElement('div'); g.className='mobsheet-group'; g.textContent='Session'; body.appendChild(g);
    const lg=document.createElement('div'); lg.className='mobsheet-grid'; body.appendChild(lg);
    const lo=document.createElement('button'); lo.type='button'; lo.className='mobsheet-item danger'; lo.innerHTML=OUT+'<span>Log out</span>';
    lo.onclick=()=>{closeSheet();if(typeof doLogout==='function')doLogout();}; lg.appendChild(lo);
    document.body.append(bar,bd,sh);
    const o={c,origs,bar,bd,sh,items,sItems,more,keyOf};
    inst.push(o);
    function sync(){
      const act=origs.find(b=>b.classList.contains('active')); const k=act?keyOf(act):null;
      Object.entries(items).forEach(([kk,el])=>el.classList.toggle('active',kk===k));
      more.classList.toggle('active',!!k&&!items[k]);
      Object.entries(sItems).forEach(([kk,el])=>el.classList.toggle('active',kk===k));
      if(c.badge){
        const b=document.getElementById(c.badge); const t=b?b.textContent.trim():''; const show=!!t&&b.style.display!=='none';
        document.querySelectorAll('[data-for="'+c.key+'"] .mobnav-badge').forEach(x=>{x.textContent=t;x.style.display=show?'flex':'none';});
      }
    }
    o.sync=sync; sync();
    const mo=new MutationObserver(sync);
    origs.forEach(b=>mo.observe(b,{attributes:true,attributeFilter:['class']}));
    if(c.badge){const b=document.getElementById(c.badge); if(b) mo.observe(b,{attributes:true,childList:true,characterData:true,subtree:true});}
  }
  function openSheet(key){document.body.classList.add('mobsheet-open','no-scroll');inst.forEach(i=>i.sh.style.visibility=i.c.key===key?'visible':'hidden');document.body.dataset.sheet=key;
    inst.forEach(i=>{i.bd.style.display=i.c.key===key?'block':'none';});}
  function closeSheet(){document.body.classList.remove('mobsheet-open','no-scroll');}
  function visible(id){const el=document.getElementById(id);return !!el&&el.style.display!=='none'&&getComputedStyle(el).display!=='none';}
  function refresh(){
    let on=false;
    inst.forEach(i=>{const v=visible(i.c.root); i.bar.style.display=v&&innerWidth<=900?'flex':'none'; if(v&&innerWidth<=900) on=true; i.sync();});
    document.body.classList.toggle('mobnav-on',on);
    if(!on||innerWidth>900) closeSheet();
  }
  function init(){
    CFG.forEach(build);
    const mo=new MutationObserver(refresh);
    CFG.forEach(c=>{const el=document.getElementById(c.root); if(el) mo.observe(el,{attributes:true,attributeFilter:['style']});});
    addEventListener('resize',refresh); addEventListener('orientationchange',refresh);
    document.addEventListener('keydown',e=>{if(e.key==='Escape')closeSheet();});
    refresh();
  }
  init();
})();


/* -- SCROLL RESET FOR EVERY OVERLAY / MODAL / DRAWER --
   Opening any popup always starts at its top (the scrolling element differs by screen size:
   overlay, .modal, .modal-body or .modal-scroll), so a previous scroll position never carries over. */
function resetScrollIn(root){
  if(!root) return;
  try{
    root.scrollTop=0;
    root.querySelectorAll('*').forEach(function(el){
      if(el.scrollTop>0) el.scrollTop=0;
    });
  }catch(e){}
}
(function(){
  var SEL='.modal-overlay,.cart-sidebar,.search-overlay,.contact-overlay,.auth-overlay,.mm-drawer,.sf-sheet,.shop-sidebar,[id$="Overlay"],[id$="Modal"]';
  function opened(el){
    return el.classList.contains('open')||el.classList.contains('show')||el.classList.contains('active')||(el.style.display&&el.style.display!=='none');
  }
  var mo=new MutationObserver(function(list){
    list.forEach(function(m){
      var el=m.target;
      if(!el||el.nodeType!==1||!el.matches||!el.matches(SEL)) return;
      if(m.attributeName==='class'){
        var was=(m.oldValue||'').split(/\s+/);
        var now=el.className.split(/\s+/);
        var gained=['open','show','active'].some(function(c){return now.indexOf(c)>-1&&was.indexOf(c)<0;});
        if(gained) { resetScrollIn(el); requestAnimationFrame(function(){resetScrollIn(el);}); }
      }else if(m.attributeName==='style'){
        var old=m.oldValue||'';
        if(/display\s*:\s*none/.test(old)&&el.style.display&&el.style.display!=='none'){ resetScrollIn(el); requestAnimationFrame(function(){resetScrollIn(el);}); }
      }
    });
  });
  function start(){ mo.observe(document.body,{subtree:true,attributes:true,attributeFilter:['class','style'],attributeOldValue:true}); }
  if(document.body) start(); else document.addEventListener('DOMContentLoaded',start);
})();

// ── Landing from the verification email: /?verify_email=TOKEN ──
(function(){
  let token=''; try{ token=new URLSearchParams(location.search).get('verify_email')||''; }catch(e){}
  if(!/^[a-f0-9]{64}$/.test(token)) return;
  try{ const u=new URL(location.href); u.searchParams.delete('verify_email'); history.replaceState(history.state,'',u.pathname+u.search+u.hash); }catch(e){}
  setTimeout(function(){ handleEmailVerificationLink(token); },700);
})();
