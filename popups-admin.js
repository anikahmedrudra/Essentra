/* Essentra — Admin → Popups manager (no need to edit) */
(function(){
  'use strict';
  var root, editing = null;           // editing = popup object being edited (copy) or null
  var DEF = {enabled:true,title:'',subtitle:'',image:'',code:'',codeLabel:'Use code at checkout',footnote:'',buttonText:'Shop Now',buttonAction:'collection',buttonLink:'',audience:'all',delaySeconds:2,frequency:'session',startDate:'',endDate:''};

  function list(){ try{ if(Array.isArray(settings.popups)) return settings.popups; }catch(e){} return JSON.parse(JSON.stringify(window.ESSENTRA_POPUPS||[])); }
  function commit(arr){ settings.popups = arr; if(typeof syncSettingsCloud==='function') syncSettingsCloud(); else try{localStorage.setItem('essentra_settings',JSON.stringify(settings));}catch(e){} }
  function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  function plain(h){ var d=document.createElement('div'); d.innerHTML=h||''; return d.textContent||''; }
  function toast(m){ if(typeof showToast==='function') showToast(m); }
  function $(id){ return document.getElementById(id); }

  function freqLabel(f){ return f==='once'?'Once per visitor':f==='always'?'Every page load':f==='session'?'Once per visit':'Every '+f+' day'+(f==1?'':'s'); }

  /* ── LIST VIEW ── */
  function renderList(){
    var arr = list();
    var h = '<div class="admin-card"><div class="admin-card-head"><div class="admin-card-titles"><div class="admin-card-title">Your Popups</div>'
      + '<div class="admin-card-sub">Shown one at a time, top to bottom. Use ↑ ↓ to change the order.</div></div>'
      + '<button class="submit-product-btn pa-new" onclick="PopupsAdmin.add()">+ New Popup</button></div>';
    if(!arr.length) h += '<div style="text-align:center;padding:2.5rem;color:var(--muted);font-size:.83rem">No popups yet. Click “New Popup”.</div>';
    arr.forEach(function(p,i){
      var sched = (p.startDate||p.endDate) ? ' · '+(p.startDate||'now')+' → '+(p.endDate||'no end') : '';
      h += '<div class="pa-row'+(p.enabled?'':' pa-off')+'">'
        + '<div class="pa-main">'
        + (p.image?'<img class="pa-thumb" src="'+esc(p.image)+'" alt=""/>':'<div class="pa-thumb pa-thumb-empty"></div>')
        + '<div class="pa-info"><div class="pa-title">'+esc(plain(p.title)||'(no title)')+'</div>'
        + '<div class="pa-meta"><span class="pa-chip '+(p.enabled?'pa-chip-on':'pa-chip-off')+'">'+(p.enabled?'Active':'Off')+'</span>'
        + (p.code?'<span class="pa-chip">Code '+esc(p.code)+'</span>':'')
        + '<span class="pa-chip">'+(p.audience==='new'?'New customers':'Everyone')+'</span>'
        + '<span class="pa-chip">'+freqLabel(p.frequency)+'</span>'
        + (sched?'<span class="pa-chip">'+esc(sched.replace(/^ · /,''))+'</span>':'')
        + '</div></div></div>'
        + '<div class="pa-actions">'
        + '<button class="status-btn pa-icon" title="Move up" aria-label="Move up" onclick="PopupsAdmin.move('+i+',-1)">↑</button>'
        + '<button class="status-btn pa-icon" title="Move down" aria-label="Move down" onclick="PopupsAdmin.move('+i+',1)">↓</button>'
        + '<button class="status-btn" onclick="PopupsAdmin.preview('+i+')">Preview</button>'
        + '<button class="status-btn" onclick="PopupsAdmin.edit('+i+')">Edit</button>'
        + '<button class="status-btn" onclick="PopupsAdmin.toggle('+i+')">'+(p.enabled?'Turn Off':'Turn On')+'</button>'
        + '<button class="status-btn" onclick="PopupsAdmin.dup('+i+')">Copy</button>'
        + '<button class="status-btn pa-del" onclick="PopupsAdmin.del('+i+')">Delete</button>'
        + '</div></div>';
    });
    h += '</div>';
    h += '<div class="admin-card"><div class="admin-card-sub" style="line-height:1.7">Tip: to test a popup on your live site, add <b>?popup=ID</b> to the address. Visitors who already saw a popup won’t see it again until its “repeat” time passes — tick “Show again to everyone” when editing to reset that.</div></div>';
    root.innerHTML = h;
  }

  /* ── FORM VIEW ── */
  function field(label, inner, extra){ return '<div class="form-group"'+(extra?' style="'+extra+'"':'')+'><label class="form-label">'+label+'</label>'+inner+'</div>'; }
  function inp(id, v, ph, type){ return '<input class="form-input" id="'+id+'" type="'+(type||'text')+'" value="'+esc(v)+'" placeholder="'+esc(ph||'')+'"/>'; }

  function renderForm(){
    var p = editing, fIsDays = typeof p.frequency==='number', fSel = fIsDays?'days':p.frequency;
    var h = '<div class="admin-card"><div class="admin-card-head"><div class="admin-card-titles"><div class="admin-card-title">'+(p._isNew?'New Popup':'Edit Popup')+'</div>'
      + '<div class="admin-card-sub">Fill in what you need — leave the rest empty.</div></div></div>'
      + '<div class="admin-2col">'
      + field('Big Headline <span style="opacity:.6">(you can use &lt;em&gt;text&lt;/em&gt; for gold italic)</span>', inp('pp-title',p.title,'e.g. Get 10% OFF'))
      + field('Line Under Image', inp('pp-subtitle',p.subtitle,'e.g. Your first order'))
      + '</div>'
      + field('Image', '<div style="display:flex;gap:.7rem;align-items:center;flex-wrap:wrap"><img id="pp-imgprev" src="'+esc(p.image)+'" alt="" style="width:76px;height:76px;object-fit:cover;border-radius:8px;background:var(--dark2);'+(p.image?'':'display:none')+'"/>'
          + '<div style="flex:1;min-width:200px">'+inp('pp-image',p.image,'Image link (https://…) or images/name.jpg')+'<div style="margin-top:.5rem"><label class="status-btn" style="cursor:pointer;display:inline-block">Upload Image<input type="file" id="pp-file" accept="image/*" style="display:none"/></label> <button type="button" class="status-btn" onclick="PopupsAdmin.clearImg()">Remove</button></div></div></div>')
      + '<div class="admin-2col">'
      + field('Coupon Code <span style="opacity:.6">(optional)</span>', inp('pp-code',p.code,'e.g. WELCOME10').replace('class="form-input"','class="form-input" style="text-transform:uppercase"'))
      + field('Text Above Code', inp('pp-codeLabel',p.codeLabel,'Use code at checkout'))
      + '</div>'
      + field('Small Text at Bottom', inp('pp-footnote',p.footnote,'e.g. Limited time only'))
      + '<div class="admin-2col">'
      + field('Button Text', inp('pp-buttonText',p.buttonText,'Shop Now'))
      + field('Button Does', '<select class="form-select" id="pp-buttonAction"><option value="collection"'+(p.buttonAction==='collection'?' selected':'')+'>Open Collection page</option><option value="link"'+(p.buttonAction==='link'?' selected':'')+'>Go to a link</option><option value="close"'+(p.buttonAction==='close'?' selected':'')+'>Just close popup</option></select>')
      + '</div>'
      + '<div id="pp-linkWrap" style="'+(p.buttonAction==='link'?'':'display:none')+'">'+field('Button Link', inp('pp-buttonLink',p.buttonLink,'https://…'))+'</div>'
      + '<div class="admin-2col">'
      + field('Show To', '<select class="form-select" id="pp-audience"><option value="all"'+(p.audience==='all'?' selected':'')+'>Everyone</option><option value="new"'+(p.audience==='new'?' selected':'')+'>New customers (hide if already ordered)</option></select>')
      + field('Wait Before Showing (seconds)', inp('pp-delay',p.delaySeconds,'2','number'))
      + '</div>'
      + '<div class="admin-2col">'
      + field('How Often', '<select class="form-select" id="pp-freq"><option value="once"'+(fSel==='once'?' selected':'')+'>Only once per visitor</option><option value="session"'+(fSel==='session'?' selected':'')+'>Once every visit</option><option value="always"'+(fSel==='always'?' selected':'')+'>Every page load</option><option value="days"'+(fSel==='days'?' selected':'')+'>Repeat after some days…</option></select>')
      + '<div id="pp-daysWrap" style="'+(fIsDays?'':'display:none')+'">'+field('Days Between Showings', inp('pp-days',fIsDays?p.frequency:3,'3','number'))+'</div>'
      + '</div>'
      + '<div class="admin-2col">'
      + field('Start Date <span style="opacity:.6">(optional)</span>', inp('pp-start',p.startDate,'','date'))
      + field('End Date <span style="opacity:.6">(optional)</span>', inp('pp-end',p.endDate,'','date'))
      + '</div>'
      + '<div class="admin-2col">'
      + field('Status', '<select class="form-select" id="pp-enabled"><option value="1"'+(p.enabled?' selected':'')+'>On</option><option value="0"'+(p.enabled?'':' selected')+'>Off</option></select>')
      + field('Reset Views', '<label style="display:flex;gap:.5rem;align-items:center;font-size:.8rem;color:var(--muted);padding:.7rem 0"><input type="checkbox" id="pp-reset"/> Show again to everyone who already saw it</label>')
      + '</div>'
      + '<div style="display:flex;gap:.7rem;flex-wrap:wrap;margin-top:.4rem">'
      + '<button class="submit-product-btn" style="max-width:190px" onclick="PopupsAdmin.save()">Save Popup</button>'
      + '<button class="status-btn" style="padding:.8rem 1.4rem" onclick="PopupsAdmin.previewForm()">Preview</button>'
      + '<button class="status-btn" style="padding:.8rem 1.4rem" onclick="PopupsAdmin.cancel()">Cancel</button>'
      + '</div></div>';
    root.innerHTML = h;
    $('pp-buttonAction').onchange = function(){ $('pp-linkWrap').style.display = this.value==='link'?'':'none'; };
    $('pp-freq').onchange = function(){ $('pp-daysWrap').style.display = this.value==='days'?'':'none'; };
    $('pp-image').oninput = function(){ var im=$('pp-imgprev'); im.src=this.value; im.style.display=this.value?'':'none'; };
    $('pp-file').onchange = function(e){ upload(e.target.files[0]); };
  }

  function upload(file){
    if(!file) return;
    var r = new FileReader();
    r.onload = function(ev){
      var img = new Image();
      img.onload = function(){
        var max=900, sc=Math.min(1, max/Math.max(img.width,img.height)), c=document.createElement('canvas');
        c.width=Math.round(img.width*sc); c.height=Math.round(img.height*sc);
        c.getContext('2d').drawImage(img,0,0,c.width,c.height);
        var url = c.toDataURL('image/jpeg',.82);
        $('pp-image').value=url; var im=$('pp-imgprev'); im.src=url; im.style.display='';
      };
      img.src = ev.target.result;
    };
    r.readAsDataURL(file);
  }

  function readForm(){
    var p = Object.assign({}, editing);
    p.title=$('pp-title').value.trim(); p.subtitle=$('pp-subtitle').value.trim();
    p.image=$('pp-image').value.trim(); p.code=$('pp-code').value.trim().toUpperCase();
    p.codeLabel=$('pp-codeLabel').value.trim(); p.footnote=$('pp-footnote').value.trim();
    p.buttonText=$('pp-buttonText').value.trim()||'Shop Now'; p.buttonAction=$('pp-buttonAction').value;
    p.buttonLink=$('pp-buttonLink')?$('pp-buttonLink').value.trim():'';
    p.audience=$('pp-audience').value; p.delaySeconds=Math.max(0,Number($('pp-delay').value)||0);
    var f=$('pp-freq').value; p.frequency = f==='days' ? Math.max(1,Number($('pp-days').value)||3) : f;
    p.startDate=$('pp-start').value; p.endDate=$('pp-end').value; p.enabled=$('pp-enabled').value==='1';
    return p;
  }

  /* ── ACTIONS ── */
  var API = window.PopupsAdmin = {
    render: function(){ root=$('popupsAdminRoot'); if(!root) return; editing=null; renderList(); },
    add: function(){ editing = Object.assign({}, DEF, {id:'popup-'+Date.now().toString(36), _isNew:true}); renderForm(); window.scrollTo({top:0,behavior:'smooth'}); },
    edit: function(i){ editing = JSON.parse(JSON.stringify(list()[i])); editing = Object.assign({}, DEF, editing); renderForm(); window.scrollTo({top:0,behavior:'smooth'}); },
    cancel: function(){ editing=null; renderList(); },
    clearImg: function(){ $('pp-image').value=''; $('pp-imgprev').style.display='none'; },
    save: function(){
      var p = readForm();
      if(!p.title && !p.image){ toast('Add a headline or an image first.'); return; }
      if(p.buttonAction==='link' && !p.buttonLink){ toast('Please enter the button link.'); return; }
      if(p.startDate && p.endDate && p.endDate<p.startDate){ toast('End date is before start date.'); return; }
      if($('pp-reset').checked) p.rev = Date.now();
      var isNew = p._isNew; delete p._isNew;
      var arr = list().slice(), idx = arr.findIndex(function(x){return x.id===p.id;});
      if(idx>-1) arr[idx]=p; else if(isNew) arr.unshift(p); else arr.push(p);
      commit(arr); editing=null; renderList(); toast('✓ Popup saved.');
    },
    previewForm: function(){ window.EssentraPopup && EssentraPopup.preview(readForm()); },
    preview: function(i){ window.EssentraPopup && EssentraPopup.preview(list()[i]); },
    toggle: function(i){ var a=list().slice(); a[i]=Object.assign({},a[i],{enabled:!a[i].enabled}); commit(a); renderList(); },
    dup: function(i){ var a=list().slice(), c=JSON.parse(JSON.stringify(a[i])); c.id='popup-'+Date.now().toString(36); c.title=(c.title||'')+' (copy)'; c.enabled=false; a.splice(i+1,0,c); commit(a); renderList(); toast('Copied (turned off).'); },
    del: function(i){ if(!confirm('Delete this popup?')) return; var a=list().slice(); a.splice(i,1); commit(a); renderList(); },
    move: function(i,d){ var a=list().slice(), j=i+d; if(j<0||j>=a.length) return; var t=a[i]; a[i]=a[j]; a[j]=t; commit(a); renderList(); }
  };

  /* render when the Popups tab opens */
  var _st = window.switchTab;
  if(typeof _st==='function'){
    window.switchTab = function(id){ var r=_st.apply(this,arguments); if(id==='popups') API.render(); return r; };
  }
})();
