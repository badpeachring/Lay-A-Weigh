(()=>{
  const SCAN_KEY='law_scans_v1', DIAG_KEY='law_diags_v1';
  let mounted=false, subTab='ocr';
  const getArr=k=>{try{return JSON.parse(localStorage.getItem(k)||'[]');}catch{return[];}};
  const setArr=(k,a)=>localStorage.setItem(k,JSON.stringify(a));

  function renderScans(){
    const q=(document.getElementById('sc-search')?.value||'').toLowerCase();
    const f=document.getElementById('sc-ffilter')?.value||'all';
    const all=getArr(SCAN_KEY);
    const shown=all.filter(x=>(f==='all'||x.folder===f)&&(!q||[x.title,x.facility,x.contact,x.folder,x.text].join(' ').toLowerCase().includes(q)));
    document.getElementById('sc-count').textContent=`${shown.length} of ${all.length} docs`;
    const el=document.getElementById('sc-list');
    if(!shown.length){el.innerHTML='<div style="font-size:12px;color:#94a3b8">No scanned documents yet.</div>';return;}
    el.innerHTML=shown.map(x=>`
      <div class="saved-item" style="flex-direction:column;align-items:stretch">
        <div style="display:flex;justify-content:space-between;gap:8px;align-items:center">
          <div><span class="acr">${x.folder}</span><b style="font-size:13px">${x.title}</b></div>
          <div style="display:flex;gap:5px">
            <button onclick="window.__scCopy('${x.id}')">Copy</button>
            <button onclick="window.__scDel('${x.id}')" style="color:#f87171">✕</button>
          </div>
        </div>
        <div style="font-size:11px;color:#94a3b8">${x.facility||'Unassigned'}${x.contact?' • '+x.contact:''} • ${x.date}</div>
        <div style="font-size:11px;color:#cbd5e1;margin-top:4px;white-space:pre-wrap;max-height:76px;overflow:hidden">${(x.text||'').replace(/</g,'&lt;')}</div>
      </div>`).join('');
  }

  function evalDiag(){
    const reb=parseFloat(document.getElementById('dg-reb')?.value)||0;
    const mver=parseFloat(document.getElementById('dg-mver')?.value)||0;
    const trm=parseFloat(document.getElementById('dg-trm')?.value)||0;
    const age=parseFloat(document.getElementById('dg-age')?.value)||0;
    const bond=document.getElementById('dg-bond')?.value||'Solid';
    const pct=reb>0?Math.round((reb/16)*100):0;

    let rebTxt='Enter rebound height (16" = fresh baseline)';
    if(reb>=13.5) rebTxt=`${pct}% cushion retained (${reb}" vs 16") — Strong core! Retop unlocks ~8+ yrs.`;
    else if(reb>=11) rebTxt=`${pct}% cushion retained (${reb}" vs 16") — Viable for structural retop; verify at Yr 4.`;
    else if(reb>0) rebTxt=`${pct}% cushion retained (${reb}" vs 16") — Core hardened; recommend Full Rip-Out.`;

    let mTxt='Enter ASTM F1869 MVER (lbs/1000sf/24hr)';
    if(mver>15) mTxt=`${mver} lbs — STOP! Exceeds 15 lb VRP-111 max. Remediate slab.`;
    else if(mver>10) mTxt=`${mver} lbs — Requires 2-Coat VRP-111 (up to 15 lb block).`;
    else if(mver>3) mTxt=`${mver} lbs — Requires 1-Coat VRP-111 (up to 10 lb block).`;
    else if(mver>0) mTxt=`${mver} lbs — Standard slab (<=3.0 lbs).`;

    let tTxt=trm>0?(trm<=4.5?`Tramex ${trm}% — PASS (<=4.5% dry gate)`:`Tramex ${trm}% — WET (>4.5%) Run fans/dehumidifiers`):'Tramex Mode 5 optional';
    document.getElementById('dg-live').innerHTML=`
      <div class="kv"><span>Rebound Cushion</span><b style="color:${reb>=11?'#34d399':'#fbbf24'}">${rebTxt}</b></div>
      <div class="kv"><span>VRP-111 Moisture</span><b style="color:${mver>15?'#f87171':mver>3?'#fbbf24':'#34d399'}">${mTxt}</b></div>
      <div class="kv"><span>Tramex Gate</span><b style="color:${trm>4.5?'#f87171':'#34d399'}">${tTxt}</b></div>
      <div class="kv"><span>Bond / Age</span><b>${bond}${age?' • '+age+' yrs':''}</b></div>`;
    return {reb,pct,mver,trm,age,bond,rebTxt,mTxt,tTxt};
  }

  function renderDiags(){
    const list=getArr(DIAG_KEY);
    const el=document.getElementById('dg-list'); if(!el) return;
    if(!list.length){el.innerHTML='<div style="font-size:12px;color:#94a3b8">No diagnostic audits logged yet.</div>';return;}
    el.innerHTML=list.map(d=>`
      <div class="saved-item">
        <div><b style="font-size:13px">${d.fac} — ${d.area}</b>
        <div style="font-size:11px;color:#94a3b8">${d.date} • Rebound: ${d.reb||'—'}" (${d.pct}%) • MVER: ${d.mver||'—'} lb • ${d.bond}</div></div>
        <button onclick="window.__dgDel('${d.id}')" style="color:#f87171">✕</button>
      </div>`).join('');
  }

  function switchSub(t){
    subTab=t;
    document.querySelectorAll('#sc-tabs button').forEach(b=>b.classList.toggle('active',b.dataset.st===t));
    ['ocr','diag','sync'].forEach(k=>{const p=document.getElementById('sc-p-'+k); if(p) p.style.display=(k===t?'block':'none');});
    if(t==='sync') window.dispatchEvent(new CustomEvent('law:sync-mount'));
  }

  function mount(){
    if(mounted) return; mounted=true;
    const sec=document.getElementById('view-scan'); if(!sec) return;
    sec.innerHTML=`
      <div class="tabs-mini" id="sc-tabs">
        <button class="active" data-st="ocr">📷 OCR Archive</button>
        <button data-st="diag">🔬 Diagnostics</button>
        <button data-st="sync">☁️ Google Sync</button>
      </div>
      <div id="sc-p-ocr">
        <div class="card">
          <div class="card-h"><div class="card-title">Scan Paper File / Invoice (OCR)</div><span class="pill" id="sc-status">READY</span></div>
          <input type="file" id="sc-file" accept="image/*" capture="environment" style="margin-bottom:8px">
          <div class="grid2">
            <div><label>Document Title</label><input id="sc-title" placeholder="e.g. 2012 Detroit Invoice"></div>
            <div><label>Facility / Zoo</label><input id="sc-fac" placeholder="e.g. Detroit Zoo"></div>
          </div>
          <div class="grid2" style="margin-top:8px">
            <div><label>Archive Folder</label><select id="sc-folder"><option>01_Historical</option><option>02_Bids_&_Specs</option><option>03_Diagnostics</option><option>04_Contracts</option></select></div>
            <div><label>Contact / Phone</label><input id="sc-contact" placeholder="Name or phone"></div>
          </div>
          <div style="margin-top:8px"><label>Extracted Searchable Text (Editable)</label><textarea id="sc-text" rows="4" placeholder="Snap a photo above to run OCR, or type notes manually..."></textarea></div>
          <div class="btn-row">
            <button class="btn green" id="sc-save"><b>Save to Searchable Vault</b><small>Indexed locally + Drive sync</small></button>
            <button class="btn" id="sc-clear"><b>Clear Form</b><small>Ready for next page</small></button>
          </div>
        </div>
        <div class="card">
          <div class="card-h"><div class="card-title">Searchable Document Archive</div><small id="sc-count" style="color:#94a3b8"></small></div>
          <div class="grid2" style="margin-bottom:8px">
            <input id="sc-search" placeholder="Search any word, name, zoo...">
            <select id="sc-ffilter"><option value="all">All Folders</option><option>01_Historical</option><option>02_Bids_&_Specs</option><option>03_Diagnostics</option><option>04_Contracts</option></select>
          </div>
          <div id="sc-list"></div>
        </div>
      </div>
      <div id="sc-p-diag" style="display:none">
        <div class="card">
          <div class="card-h"><div class="card-title">On-Site Rebound & Moisture Logger</div></div>
          <div class="grid2">
            <div><label>Facility / Zoo</label><input id="dg-fac" placeholder="Facility name"></div>
            <div><label>Barn / Stall</label><input id="dg-area" placeholder="e.g. Rhino Stalls 2-4"></div>
          </div>
          <div class="grid3" style="margin-top:8px">
            <div><label>4-lb Ball Rebound (in)</label><input id="dg-reb" type="number" step="0.5" placeholder="0"></div>
            <div><label>ASTM F1869 MVER (lb)</label><input id="dg-mver" type="number" step="0.1" placeholder="0"></div>
            <div><label>Tramex Mode 5 (%)</label><input id="dg-trm" type="number" step="0.1" placeholder="0"></div>
          </div>
          <div class="grid2" style="margin-top:8px">
            <div><label>Acoustic Hammer Bond</label><select id="dg-bond"><option>Solid</option><option>Localized Hollows (&lt;15%)</option><option>Widespread Delamination (&gt;15%)</option></select></div>
            <div><label>Floor Age (Yrs)</label><input id="dg-age" type="number" placeholder="0"></div>
          </div>
          <div id="dg-live" style="margin-top:10px"></div>
          <div class="btn-row">
            <button class="btn primary" id="dg-script"><b>Copy Client Script</b><small>Expectation-management summary</small></button>
            <button class="btn green" id="dg-save"><b>Save Audit Log</b><small>Store to device & Drive</small></button>
          </div>
        </div>
        <div class="card"><div class="card-h"><div class="card-title">Logged Field Audits</div></div><div id="dg-list"></div></div>
      </div>
      <div id="sc-p-sync" style="display:none"><div id="sync-panel"></div></div>`;

    document.querySelectorAll('#sc-tabs button').forEach(b=>b.onclick=()=>switchSub(b.dataset.st));
    document.getElementById('sc-file').onchange=async e=>{
      const file=e.target.files?.[0]; if(!file) return;
      if(!window.Tesseract) return window.LAW.toast('OCR engine still loading...');
      const st=document.getElementById('sc-status'); st.textContent='OCR 0%';
      try{
        const res=await window.Tesseract.recognize(file,'eng',{logger:m=>{if(m.status==='recognizing text') st.textContent='OCR '+Math.round(m.progress*100)+'%';}});
        document.getElementById('sc-text').value=(res.data.text||'').trim();
        if(!document.getElementById('sc-title').value) document.getElementById('sc-title').value=file.name.replace(/\.[^.]+$/,'');
        st.textContent='DONE'; window.LAW.toast('OCR text extracted!');
      }catch{st.textContent='ERROR'; window.LAW.toast('OCR failed — try clearer photo');}
    };
    document.getElementById('sc-save').onclick=()=>{
      const title=document.getElementById('sc-title').value.trim()||'Scanned Doc';
      const text=document.getElementById('sc-text').value.trim();
      if(!text) return window.LAW.toast('Scan or type text first');
      const arr=getArr(SCAN_KEY);
      arr.unshift({id:'s_'+Date.now(),title,facility:document.getElementById('sc-fac').value.trim(),folder:document.getElementById('sc-folder').value,contact:document.getElementById('sc-contact').value.trim(),text,date:new Date().toLocaleDateString('en-US')});
      setArr(SCAN_KEY,arr); renderScans(); window.LAW.toast('Saved to searchable vault!');
    };
    document.getElementById('sc-clear').onclick=()=>['sc-title','sc-fac','sc-contact','sc-text','sc-file'].forEach(id=>document.getElementById(id).value='');
    document.getElementById('sc-search').addEventListener('input',renderScans);
    document.getElementById('sc-ffilter').addEventListener('change',renderScans);
    ['dg-reb','dg-mver','dg-trm','dg-age','dg-bond'].forEach(id=>document.getElementById(id).addEventListener('input',evalDiag));
    document.getElementById('dg-save').onclick=()=>{
      const ev=evalDiag(), arr=getArr(DIAG_KEY);
      arr.unshift({id:'d_'+Date.now(),fac:document.getElementById('dg-fac').value.trim()||'Facility',area:document.getElementById('dg-area').value.trim()||'Barn',date:new Date().toLocaleDateString('en-US'),...ev});
      setArr(DIAG_KEY,arr); renderDiags(); window.LAW.toast('Audit saved!');
    };
    document.getElementById('dg-script').onclick=()=>{
      const ev=evalDiag(), fac=document.getElementById('dg-fac').value.trim()||'your facility', area=document.getElementById('dg-area').value.trim()||'the enclosure';
      const s=`Following up on our diagnostic walkthrough of ${area} at ${fac}, my partner and I reviewed the physical test data. Using our 4-lb steel ball vertical rebound test (36" drop vs. 16" fresh baseline), the floor measured ${ev.reb||'—'} inches (${ev.pct}% cushion retained). Acoustic bond check: ${ev.bond}. Moisture: ${ev.mTxt}. Based on these metrics, we can structure targeted restoration/retop options (with a 4-year confirmation checkpoint) alongside a full rip-out lifecycle reset.`;
      navigator.clipboard.writeText(s).then(()=>window.LAW.toast('Client script copied!'));
    };
    window.__scCopy=id=>{const x=getArr(SCAN_KEY).find(i=>i.id===id); if(x) navigator.clipboard.writeText(x.text).then(()=>window.LAW.toast('Text copied!'));};
    window.__scDel=id=>{setArr(SCAN_KEY,getArr(SCAN_KEY).filter(i=>i.id!==id)); renderScans();};
    window.__dgDel=id=>{setArr(DIAG_KEY,getArr(DIAG_KEY).filter(i=>i.id!==id)); renderDiags();};
    renderScans(); evalDiag(); renderDiags();
    window.dispatchEvent(new CustomEvent('law:sync-mount'));
  }
  window.addEventListener('law:view',e=>{if(e.detail==='scan') mount();});
  mount();
})();
