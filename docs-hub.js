(()=>{
  let mounted=false, selected=new Set(['warranty','welcome']);
  function getCtx(){
    return {
      client:document.getElementById('d-client')?.value.trim()||'',
      email:document.getElementById('d-email')?.value.trim()||'',
      room:document.getElementById('d-room')?.value.trim()||'',
      date:document.getElementById('d-date')?.value||new Date().toISOString().slice(0,10),
      isNew:(document.getElementById('d-tier')?.value||'new')==='new',
      psi:document.getElementById('d-psi')?.value||'2,500',
      atCost:document.getElementById('d-atcost')?.value||'2yr'
    };
  }
  function makePdfObj(docId,ctx){
    const d=window.LAW_DOCS.build(docId,ctx);
    const {jsPDF}=window.jspdf;
    const pdf=new jsPDF({unit:'pt',format:'letter'});
    const W=pdf.internal.pageSize.getWidth(), H=pdf.internal.pageSize.getHeight();
    const cleanTxt=s=>String(s||'').replace(/″/g,'in.').replace(/°/g,' deg ');
    const drawHeader=()=>{
      pdf.setFillColor(15,23,42); pdf.rect(0,0,W,68,'F');
      pdf.setFillColor(245,158,11); pdf.rect(0,68,W,4,'F');
      pdf.setTextColor(255,255,255); pdf.setFont('helvetica','bold'); pdf.setFontSize(16);
      pdf.text('THE BESPOKE RENEWAL, LLC  |  LAY A WEIGH(R)',40,30);
      pdf.setFont('helvetica','normal'); pdf.setFontSize(9); pdf.setTextColor(203,213,225);
      pdf.text('Engineered Zoological Flooring  •  (254) 265-5275  •  thebespokerenewal@gmail.com',40,48);
      pdf.setTextColor(251,191,36); pdf.setFont('helvetica','bold'); pdf.setFontSize(10);
      pdf.text(cleanTxt(d.title),40,62);
    };
    drawHeader();
    pdf.setTextColor(20,25,35); pdf.setFont('helvetica','normal'); pdf.setFontSize(10);
    let y=96;
    const lines=pdf.splitTextToSize(cleanTxt(d.body),W-80);
    lines.forEach(ln=>{
      if(y>H-52){
        pdf.addPage(); drawHeader(); y=96;
        pdf.setTextColor(20,25,35); pdf.setFont('helvetica','normal'); pdf.setFontSize(10);
      }
      const isHdr=/^(PART \d|PHASE \d|SECTION \d|STEP \d|\d\. [A-Z])/.test(ln.trim());
      pdf.setFont('helvetica',isHdr?'bold':'normal');
      pdf.text(ln,40,y); y+=14;
    });
    const pages=pdf.internal.getNumberOfPages();
    for(let i=1;i<=pages;i++){
      pdf.setPage(i); pdf.setFontSize(8); pdf.setTextColor(120,130,145);
      pdf.text(`The Bespoke Renewal, LLC • Lay A Weigh(R) System • Page ${i} of ${pages}`,40,H-24);
    }
    const slug=(ctx.client||'TBR').replace(/[^a-z0-9]+/gi,'_').slice(0,22);
    const filename=`TBR_${slug}_${docId}.pdf`;
    const base64=pdf.output('datauristring').split(',')[1];
    return {pdf,filename,base64,title:d.title,body:d.body};
  }
  function renderList(){
    const host=document.getElementById('d-list'); if(!host) return;
    if(!window.LAW_DOCS?.ITEMS){
      host.innerHTML=`<div style='font-size:12px;color:#f87171'>Document templates not loaded. Refresh page.</div>`;
      return;
    }
    host.innerHTML=window.LAW_DOCS.ITEMS.map(it=>`
      <div class='saved-item'>
        <label style='display:flex;align-items:center;gap:8px;margin:0;cursor:pointer;text-transform:none;flex:1'>
          <input type='checkbox' data-did='${it.id}' ${selected.has(it.id)?'checked':''} style='width:auto;accent-color:#f59e0b'>
          <div><b style='color:#fff;font-size:13px'>${it.name}</b><div style='font-size:11px;color:#94a3b8'>${it.sub}</div></div>
        </label>
        <button type='button' data-prev='${it.id}'>Preview</button>
      </div>`).join('');
    host.querySelectorAll('input[data-did]').forEach(cb=>cb.onchange=()=>{if(cb.checked) selected.add(cb.dataset.did); else selected.delete(cb.dataset.did);});
    host.querySelectorAll('button[data-prev]').forEach(b=>b.onclick=()=>{
      const d=window.LAW_DOCS.build(b.dataset.prev,getCtx());
      document.getElementById('d-prev-title').textContent=d.title;
      document.getElementById('d-prev-text').value=d.body;
      document.getElementById('d-prev-card').style.display='block';
      document.getElementById('d-prev-card').scrollIntoView({behavior:'smooth'});
    });
  }
  function pullFromBid(){
    mount();
    const c=document.getElementById('b-client')?.value||'';
    const r=document.getElementById('b-room')?.value||'';
    const sk=document.getElementById('b-scope')?.value||'new';
    document.getElementById('d-client').value=c;
    document.getElementById('d-room').value=r;
    document.getElementById('d-tier').value=(sk==='new'||sk==='ripout')?'new':'retop';
    if(c) document.getElementById('d-subj').value=`The Bespoke Renewal — ${c} Lay A Weigh® Docs`;
    window.LAW.toast('Pulled client & scope from Bid Calc');
  }
  function loadFacility(z){
    mount();
    if(!z) return;
    document.getElementById('d-client').value=z.name||'';
    document.getElementById('d-room').value=z.species||'';
    const emailMatch=(z.phone||'').match(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/i);
    document.getElementById('d-email').value=emailMatch?emailMatch[0]:'';
    if(z.name) document.getElementById('d-subj').value=`The Bespoke Renewal — ${z.name} Lay A Weigh® Docs`;
    window.LAW.toast('Loaded '+z.name+' into Docs/Mail');
  }
  function mount(){
    if(mounted) return; mounted=true;
    const sec=document.getElementById('view-docs'); if(!sec) return;
    sec.innerHTML=`
      <div class='guide-box'>
        <b>Docs &amp; PDF Builder:</b> Tap <b>Pull Active Bid</b> (or pick a zoo from the map), check the documents you need, and tap <b>Download Selected PDFs</b> or <b>Gmail Draft w/ PDFs</b>. Connecting Cloud Sync in Tools auto-attaches PDFs directly into your Gmail Drafts.
      </div>
      <div class='card'>
        <div class='card-h'><div class='card-title'>1. Client &amp; Document Info</div><button class='btn-sm gold' id='d-pull-bid'>Pull Active Bid</button></div>
        <div class='grid2'>
          <div><label>Client / Facility</label><input id='d-client' placeholder='e.g. Detroit Zoo'></div>
          <div><label>Client Email</label><input id='d-email' type='email' placeholder='curator@zoo.org'></div>
        </div>
        <div class='grid2' style='margin-top:8px'>
          <div><label>Barn / Enclosure</label><input id='d-room' placeholder='e.g. Rhino Barn'></div>
          <div><label>Warranty Tier</label><select id='d-tier'><option value='new'>New Install (2-Yr)</option><option value='retop'>Retop (1-Yr)</option></select></div>
        </div>
        <details class='adv-box'>
          <summary><span>⚙️ Date, PSI Cap &amp; At-Cost Clause Options</span><span class='pill'>2,500 PSI</span></summary>
          <div class='adv-body'>
            <div class='grid3'>
              <div><label>Effective Date</label><input id='d-date' type='date' value='${new Date().toISOString().slice(0,10)}'></div>
              <div><label>Max Pressure PSI</label><select id='d-psi'><option value='2,500'>2,500 PSI (Welcome Std)</option><option value='2,400'>2,400 PSI (Maint Std)</option></select></div>
              <div><label>At-Cost Window</label><select id='d-atcost'><option value='2yr'>Years 3–4 (To Yr 4 Retop)</option><option value='3yr'>Years 3–5 (+3 Full Yrs)</option></select></div>
            </div>
          </div>
        </details>
      </div>
      <div class='card'>
        <div class='card-h'><div class='card-title'>2. Pick Documents to Bundle</div></div>
        <div id='d-list'></div>
        <details class='adv-box'>
          <summary><span>✉️ Customize Email Subject &amp; Cover Note</span><span class='pill'>Edit</span></summary>
          <div class='adv-body'>
            <label>Email Subject</label>
            <input id='d-subj' value='The Bespoke Renewal — Lay A Weigh® Documentation'>
            <label style='margin-top:8px'>Email Cover Note</label>
            <textarea id='d-note' rows='3'>Hi,

Please find the attached Lay A Weigh® documentation for your facility. Let us know if you have any questions.

Best regards,
Seth McNab, COO | The Bespoke Renewal, LLC | (254) 265-5275</textarea>
          </div>
        </details>
        <div class='btn-row'>
          <button type='button' class='btn primary' id='d-dl-pdfs'><b>Download Selected PDFs</b><small>Branded TBR letterhead PDFs</small></button>
          <button type='button' class='btn green' id='d-gmail-draft'><b>Gmail Draft w/ PDFs</b><small>Auto-attaches via Cloud Sync</small></button>
        </div>
        <div class='btn-row'>
          <button type='button' class='btn' id='d-copy-all'><b>Copy Selected Text</b><small>Plain text for quick reply</small></button>
          <button type='button' class='btn' id='d-open-gmail'><b>Open Gmail Drafts</b><small>thebespokerenewal@gmail.com</small></button>
        </div>
      </div>
      <div class='card' id='d-prev-card' style='display:none'>
        <div class='card-h'><div class='card-title' id='d-prev-title'>Preview</div><div style='display:flex;gap:6px'><button class='btn-sm gold' id='d-prev-copy'>Copy</button><button class='btn-sm' id='d-prev-close'>✕</button></div></div>
        <textarea id='d-prev-text' rows='12' style='font-size:12px;line-height:1.45'></textarea>
      </div>`;
    renderList();
    document.getElementById('d-pull-bid').onclick=pullFromBid;
    document.getElementById('d-prev-copy').onclick=()=>navigator.clipboard.writeText(document.getElementById('d-prev-text').value).then(()=>window.LAW.toast('Copied!'));
    document.getElementById('d-prev-close').onclick=()=>document.getElementById('d-prev-card').style.display='none';
    document.getElementById('d-copy-all').onclick=()=>{
      if(!selected.size) return window.LAW.toast('Check at least 1 document');
      const ctx=getCtx();
      const txt=[...selected].map(id=>{const d=window.LAW_DOCS.build(id,ctx);return d.title+'\n'+'='.repeat(40)+'\n'+d.body;}).join('\n\n\n');
      navigator.clipboard.writeText(txt).then(()=>window.LAW.toast(`Copied ${selected.size} doc(s)!`));
    };
    document.getElementById('d-dl-pdfs').onclick=()=>{
      if(!selected.size) return window.LAW.toast('Check at least 1 document');
      if(!window.jspdf) return window.LAW.toast('PDF engine still loading — try again in 2s');
      const ctx=getCtx();
      [...selected].forEach(id=>{const o=makePdfObj(id,ctx); o.pdf.save(o.filename);});
      window.LAW.toast(`Downloaded ${selected.size} PDF(s)!`);
    };
    document.getElementById('d-gmail-draft').onclick=async()=>{
      if(!selected.size) return window.LAW.toast('Check at least 1 document');
      if(!window.jspdf) return window.LAW.toast('PDF engine still loading — try again in 2s');
      const ctx=getCtx(), subj=document.getElementById('d-subj').value, note=document.getElementById('d-note').value;
      const pdfs=[...selected].map(id=>makePdfObj(id,ctx));
      if(window.LAW_CLOUD?.isConnected()){
        window.LAW.toast('Creating Gmail draft with PDFs...');
        const ok=await window.LAW_CLOUD.createGmailDraft(ctx.email,subj,note,pdfs);
        if(ok) window.LAW.toast('Draft created in Gmail with PDFs!');
      }else{
        pdfs.forEach(o=>o.pdf.save(o.filename));
        window.location.href=`mailto:${encodeURIComponent(ctx.email)}?subject=${encodeURIComponent(subj)}&body=${encodeURIComponent(note)}`;
        window.LAW.toast('PDFs downloaded — sign into Cloud Sync for auto-attach');
      }
    };
    document.getElementById('d-open-gmail').onclick=()=>window.open('https://mail.google.com/mail/u/0/#drafts','_blank');
  }
  window.LAW_DOCS_HUB={pullFromBid,loadFacility};
  window.addEventListener('law:view',e=>{if(e.detail==='docs') mount();});
  mount();
})();