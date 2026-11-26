REPO CONTEXT (FULL): badpeachring/Lay-A-Weigh
Total Files: 11 | Packed Code Files: 10
All Files: README.md, app.js, docs-hub.js, field-scanner.js, google-sync.js, icon.png, index.html, manifest.json, styles.css, sw.js, zoo-map.js
----------------------------------------

=== FILE: README.md ===
# Lay-A-Weigh
Lay-A-Weigh — forged with App Forge

=== FILE: app.js ===
const $=id=>document.getElementById(id);
const fmt=n=>'$'+Number(n||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
const toast=m=>{const t=$('toast');t.textContent=m;t.style.display='block';clearTimeout(window._tt);window._tt=setTimeout(()=>t.style.display='none',2200);};
const SCOPES={
  new:{name:'New Full System Install (3/4" Mats)',matRate:15,warr:'2-Year Limited Commercial Warranty',warrShort:'2-YR WARRANTY (NEW)',isNew:true,baseDays:5,sqftPerDay:350,hrsPerDay:9,risk:false},
  ripout:{name:'Full Rip-Out & Replace (3/4" Mats)',matRate:15,warr:'2-Year Limited Commercial Warranty',warrShort:'2-YR WARRANTY (NEW)',isNew:true,baseDays:7,sqftPerDay:300,hrsPerDay:9,risk:false},
  old_retop:{name:'Old High-Risk Structural Retop (8+ yrs)',matRate:7,warr:'1-Year Limited Commercial Warranty',warrShort:'1-YR WARRANTY (RETOP)',isNew:false,baseDays:4,sqftPerDay:450,hrsPerDay:9.4,risk:true},
  std_retop:{name:'Standard 4-Year Proactive Retop',matRate:4.5,warr:'1-Year Limited Commercial Warranty',warrShort:'1-YR WARRANTY (RETOP)',isNew:false,baseDays:3,sqftPerDay:600,hrsPerDay:8.5,risk:false},
  wear_top:{name:'1/8" Heavy Wear Top Only',matRate:4.5,warr:'1-Year Limited Commercial Warranty',warrShort:'1-YR WARRANTY (RETOP)',isNew:false,baseDays:3,sqftPerDay:650,hrsPerDay:8.5,risk:false},
  smooth:{name:'Smooth Top Coat System',matRate:4.5,warr:'1-Year Limited Commercial Warranty',warrShort:'1-YR WARRANTY (RETOP)',isNew:false,baseDays:2.5,sqftPerDay:750,hrsPerDay:8,risk:false}
};
let priceMode='full',lastBid=null,lastPO=null;
function switchView(v){
  document.querySelectorAll('.nav button').forEach(x=>x.classList.toggle('active',x.dataset.view===v));
  document.querySelectorAll('.view').forEach(x=>x.classList.toggle('active',x.id==='view-'+v));
  window.dispatchEvent(new CustomEvent('law:view',{detail:v}));
}
function calcBid(){
  const sk=$('b-scope').value, sc=SCOPES[sk];
  const sqft=Math.max(0,+$('b-sqft').value||0);
  const stalls=Math.max(0,+$('b-stalls').value||0);
  const crew=Math.max(0,+$('b-crew').value||0);
  const shift=+$('b-shift').value||12;
  const markup=Math.max(0,+$('b-markup').value||0);
  const miles1=Math.max(0,+$('b-miles').value||0);
  const perDiemRate=Math.max(0,+$('b-perdiem').value||0);
  const equip=Math.max(0,+$('b-equip').value||0);
  const moist=$('b-moist').checked, pw=$('b-pw').checked, night=$('b-night').checked;
  const phased=$('b-phased').checked, lift=$('b-lift').checked, stor=$('b-stor').checked;
  const useIns=$('b-ins').checked, useRisk=(sqft>0&&sc.risk)||$('b-risk').checked;
  $('markup-pill').textContent=markup+'% MARKUP';
  let activeDays=sqft>0?Math.max(2,Math.ceil(sc.baseDays+(Math.max(0,sqft-400)/sc.sqftPerDay))):0;
  if(shift===8&&activeDays>0) activeDays=Math.ceil(activeDays*1.25);
  const pauseDays=(sqft>0&&moist)?2:0;
  const calDays=activeDays+pauseDays;
  let crewHrs=sqft>0?Math.round((activeDays*sc.hrsPerDay)+(moist?3:0)):0;
  if(phased&&crewHrs>0) crewHrs=Math.ceil(crewHrs*1.15);
  const leadRate=pw?120:110, skRate=pw?65:55;
  const crewRateBase=crew>0?(leadRate+Math.max(0,crew-1)*skRate):0;
  const crewRate=crew>0?(crewRateBase+(night?crew*5:0)):0;
  const labor=crewHrs*crewRate;
  const mats=sqft*sc.matRate;
  const perDiem=perDiemRate*crew*calDays;
  let mob=0;
  if(miles1>0){
    const rtMiles=miles1*2;
    if(miles1<=50){mob=250+(rtMiles*0.75);}
    else{
      const driveHrs=Math.ceil(rtMiles/58), travelDays=Math.max(1,Math.ceil(driveHrs/10));
      mob=(rtMiles*0.75)+400+(55.5*crew*travelDays)+(20*driveHrs*crew);
    }
  }
  const logistics=(lift?500:0)+(stor?500:0);
  const directHard=mats+equip+perDiem+mob+logistics+labor;
  const ins=useIns?directHard*0.05:0;
  const riskRes=useRisk?directHard*0.10:0;
  const hardTotal=directHard+ins+riskRes;
  const profit=hardTotal*(markup/100);
  const total=hardTotal+profit;
  const psf=sqft>0?total/sqft:0;
  const fixedDeploy=(mob+logistics+equip+perDiem)*(1+markup/100);
  const varTotal=Math.max(0,total-fixedDeploy);
  const varPsf=sqft>0?varTotal/sqft:0;
  const firstStall=stalls<=0?0:(stalls===1?total:fixedDeploy+(varTotal/stalls));
  const addStall=stalls<=1?0:(total-firstStall)/(stalls-1);
  lastBid={client:$('b-client').value||'Facility',room:$('b-room').value||'Animal Enclosure',scopeKey:sk,scope:sc,sqft,stalls,crew,shift,markup,miles1,calDays,activeDays,pauseDays,crewHrs,crewRate,labor,mats,equip,perDiem,mob,logistics,ins,riskRes,hardTotal,profit,total,psf,fixedDeploy,varPsf,firstStall,addStall};
  $('out-total').textContent=fmt(total);
  $('out-psf').textContent=`${fmt(psf)} / sq ft • ${calDays} Cal Days${activeDays?` (${activeDays} work${pauseDays?' + 2 moisture':''})`:''}`;
  const wb=$('out-warr'); wb.textContent=sc.warrShort; wb.className='badge '+(sc.isNew?'b-2yr':'b-1yr');
  $('out-risk-badge').innerHTML=useRisk?'<div class="badge b-warn">+10% HIGH-RISK RESERVE</div>':'';
  const rm=($('b-room').value||'').toLowerCase();
  const warn=(/pig|swine|hog|boar|cat|tiger|lion|jaguar|leopard|felid|chimp|orangutan|baboon|macaque|monkey/.test(rm));
  $('out-species-warn').innerHTML=warn?'<div class="badge b-warn">⚠️ SPECIES EXCLUSION ALERT: Standard Lay A Weigh® is not recommended for rooting swine, large clawed felids, or edge-peeling primates.</div>':'';
  let html='';
  if(priceMode==='full'){
    html=`
      <div class="kv"><span>Materials (${sqft} sf @ ${fmt(sc.matRate)}/sf)</span><b>${fmt(mats)}</b></div>
      <div class="kv"><span>Crew Labor (${crewHrs} hrs @ ${fmt(crewRate)}/hr, ${crew}-man)</span><b>${fmt(labor)}</b></div>
      <div class="kv"><span>Per Diem & Lodging (${crew} guys × ${calDays} days)</span><b>${fmt(perDiem)}</b></div>
      <div class="kv"><span>Mobilization (${miles1} mi one-way)${logistics?' + Site Fees':''}</span><b>${fmt(mob+logistics)}</b></div>
      <div class="kv"><span>Equipment Allocation</span><b>${fmt(equip)}</b></div>
      ${useIns?`<div class="kv"><span>Commercial Insurance (5%)</span><b>${fmt(ins)}</b></div>`:''}
      ${useRisk?`<div class="kv"><span>High-Risk Warranty Reserve (10%)</span><b>${fmt(riskRes)}</b></div>`:''}
      <div class="kv"><span>Hard Cost Subtotal</span><b>${fmt(hardTotal)}</b></div>
      <div class="kv"><span>Company Markup (${markup}%)</span><b>${fmt(profit)}</b></div>
      <div class="kv"><span>TOTAL COMMERCIAL BID</span><b style="color:#fbbf24">${fmt(total)}</b></div>`;
  }else if(priceMode==='twopart'){
    html=`
      <div class="kv"><span>Part 1: Fixed Site Mobilization & Deployment</span><b>${fmt(fixedDeploy)}</b></div>
      <div class="kv"><span>Part 2: System Application (${sqft} sf @ ${fmt(varPsf)}/sf)</span><b>${fmt(varTotal)}</b></div>
      <div class="kv"><span>Schedule Window (No Hourly Breakdown)</span><b>${calDays} Calendar Days</b></div>
      <div class="kv"><span>Warranty Included</span><b>${sc.warr}</b></div>
      <div class="kv"><span>TOTAL TURNKEY PROPOSAL</span><b style="color:#fbbf24">${fmt(total)}</b></div>`;
  }else{
    html=`
      <div class="kv"><span>First Stall (Includes Full Mobilization & Prep)</span><b>${fmt(firstStall)}</b></div>
      <div class="kv"><span>Each Additional Stall (${Math.max(0,stalls-1)} × ${fmt(addStall)})</span><b>${fmt(addStall)} / stall</b></div>
      <div class="kv"><span>Total Package (${stalls} Stalls / ${sqft} sq ft)</span><b style="color:#fbbf24">${fmt(total)}</b></div>`;
  }
  $('out-breakdown').innerHTML=html;
}
function calcPO(){
  const rawSqft=Math.max(0,+$('m-sqft').value||0);
  if(!rawSqft){
    lastPO={rawSqft:0,area:0,waste:false,rows:[],tot:0};
    $('po-total-pill').textContent='$0.00';
    $('po-tbody').innerHTML='<tr><td colspan="4" style="color:#94a3b8;text-align:center;padding:14px">Enter square footage above to calculate 5-gal pails & mats.</td></tr>';
    return;
  }
  const waste=$('m-waste').checked, area=waste?rawSqft*1.10:rawSqft;
  const isNew=$('m-scope').value==='new', vrpCoats=+$('m-vrp').value;
  const rows=[], add=(acr,name,qty,unit,price)=>rows.push({acr,name,qty,unit,price,cost:qty*price});
  if(isNew){
    add('NVM','Non-Vulcanized 3/4" Mats (4x6)',Math.ceil(area/24),'mats',104);
    if(vrpCoats>0) add('MBE',`Moisture Block VRP-111 (${vrpCoats}-coat)`,Math.ceil(area/(vrpCoats===2?250:500)),'kits',286);
    add('STE','Structural Epoxy (#3 Kit, 2.5g)',Math.ceil(area/800),'kits',240);
    add('BPU','Base Polymer - Underbed (5-gal)',Math.ceil(area/200),'pails',240);
    add('RBC','Rubber Base Compound Yellow (5-gal)',Math.ceil(area/500),'pails',233);
  }else{
    if(vrpCoats>0) add('MBE',`Moisture Block VRP-111 (${vrpCoats}-coat)`,Math.ceil(area/(vrpCoats===2?250:500)),'kits',286);
    add('STE','Structural Epoxy (#3 Kit, 2.5g)',Math.ceil(area/800),'kits',240);
    add('RBC','Rubber Base Compound Yellow (5-gal)',Math.ceil(area/600),'pails',233);
  }
  add('BPW','Base Polymer - Wear Layer (5-gal)',Math.ceil(area/175),'pails',240);
  const paintPails=Math.ceil(((area/45)+(area/160))/5), coat1Pails=Math.ceil((area/45)/5);
  add('CCP','Colorcoat AL Paint (5-gal w/ship)',paintPails,'pails',550);
  add('PAC','Paint Accelerator (1st coat only)',coat1Pails,'units',16.35);
  add('RGF','Rubber Granules - Fine (50lb)',Math.ceil((area/390)*2),'bags',93);
  add('RGR','Rubber Granules - Rough (50lb)',Math.ceil(area/390),'bags',135);
  add('SSD','Silica Sand (50lb)',Math.ceil(area/500),'bags',18);
  const tot=rows.reduce((s,r)=>s+r.cost,0);
  lastPO={rawSqft,area:Math.round(area),waste,rows,tot};
  $('po-total-pill').textContent=`${fmt(tot)} (${fmt(tot/rawSqft)}/sf)`;
  $('po-tbody').innerHTML=rows.map(r=>`<tr><td><span class="acr">${r.acr}</span>${r.name}</td><td><b>${r.qty}</b></td><td>${r.unit}</td><td>${fmt(r.cost)}</td></tr>`).join('');
}
function renderSaved(){
  const list=JSON.parse(localStorage.getItem('law_bids_v1')||'[]');
  $('saved-count').textContent=`${list.length} saved`;
  if(!list.length){$('saved-list').innerHTML='<div style="font-size:12px;color:#94a3b8">No saved bids yet.</div>';return;}
  $('saved-list').innerHTML=list.map((b,i)=>`<div class="saved-item"><div><b style="font-size:13px">${b.client} — ${b.room}</b><div style="font-size:11px;color:#94a3b8">${b.sqft} sf • ${fmt(b.total)} • ${b.scope.warrShort}</div></div><div style="display:flex;gap:6px"><button onclick="loadBid(${i})">Load</button><button onclick="delBid(${i})" style="color:#f87171">✕</button></div></div>`).join('');
}
window.loadBid=i=>{
  const b=JSON.parse(localStorage.getItem('law_bids_v1')||'[]')[i]; if(!b) return;
  $('b-client').value=b.client; $('b-room').value=b.room; $('b-scope').value=b.scopeKey;
  $('b-sqft').value=b.sqft||''; $('b-stalls').value=b.stalls||''; $('b-crew').value=b.crew||'';
  $('b-shift').value=b.shift; $('b-markup').value=b.markup; $('b-miles').value=b.miles1||'';
  $('b-equip').value=b.equip||''; calcBid(); toast('Bid loaded');
};
window.delBid=i=>{
  const list=JSON.parse(localStorage.getItem('law_bids_v1')||'[]');
  list.splice(i,1); localStorage.setItem('law_bids_v1',JSON.stringify(list)); renderSaved();
};
$('btn-reset-bid').onclick=()=>{
  ['b-client','b-room','b-sqft','b-stalls','b-crew','b-miles','b-perdiem','b-equip'].forEach(id=>$(id).value='');
  ['b-moist','b-pw','b-night','b-phased','b-lift','b-stor','b-ins','b-risk'].forEach(id=>$(id).checked=false);
  $('b-markup').value=30; calcBid(); toast('Reset to $0');
};
$('btn-copy-prop').onclick=()=>{
  const b=lastBid;
  const txt=`THE BESPOKE RENEWAL, LLC — LAY A WEIGH® COMMERCIAL PROPOSAL\nFacility: ${b.client} | Area: ${b.room}\nScope: ${b.scope.name} (${b.sqft} sq ft)\nEstimated Schedule: ${b.calDays} Calendar Days On-Site\n\nCOMMERCIAL TOTAL: ${fmt(b.total)} (${fmt(b.psf)} / sq ft)\n*Note: Mobilization, freight, and site logistics are fully included in the total above.\n\nWARRANTY: Covered by our ${b.scope.warr} (adhesion & material formulation; excludes standing water, third-party alterations, and abnormal mechanical/animal impact).\n\nContact: Seth McNab, COO | (254) 265-5275 | thebespokerenewal@gmail.com`;
  navigator.clipboard.writeText(txt).then(()=>toast('Proposal copied!'));
};
$('btn-save-bid').onclick=()=>{
  const list=JSON.parse(localStorage.getItem('law_bids_v1')||'[]');
  list.unshift({...lastBid,savedAt:new Date().toISOString()});
  localStorage.setItem('law_bids_v1',JSON.stringify(list.slice(0,50)));
  renderSaved(); toast('Bid saved!');
};
$('btn-sync-sqft').onclick=()=>{$('m-sqft').value=$('b-sqft').value; calcPO(); toast('Synced Sq Ft');};
$('btn-copy-po').onclick=()=>{
  if(!lastPO||!lastPO.rows.length) return toast('Enter sq ft first');
  const txt=`LAY A WEIGH® MATERIAL ORDER (${lastPO.rawSqft} sq ft${lastPO.waste?' + 10% waste':''})\n`+lastPO.rows.map(r=>`${r.qty}= ${r.name} [${r.acr}] (${r.unit})`).join('\n')+`\nEstimated Material Total: ${fmt(lastPO.tot)}`;
  navigator.clipboard.writeText(txt).then(()=>toast('Supplier PO copied!'));
};
$('btn-copy-acr').onclick=()=>{
  navigator.clipboard.writeText('NVM=Non-Vulcanized Mats | MBE=Moisture Block VRP-111 | STE=Structural Epoxy #3 | BPU=Base Polymer Underbed | RBC=Rubber Base Compound Yellow | BPW=Base Polymer Wear Layer | CCP=Colorcoat AL Paint | PAC=Paint Accelerator | RGF=Granules Fine | RGR=Granules Rough | SSD=Silica Sand').then(()=>toast('Legend copied!'));
};
document.querySelectorAll('.nav button').forEach(btn=>btn.onclick=()=>switchView(btn.dataset.view));
document.querySelectorAll('.tabs-mini button').forEach(btn=>btn.onclick=()=>{
  document.querySelectorAll('.tabs-mini button').forEach(x=>x.classList.remove('active'));
  btn.classList.add('active'); priceMode=btn.dataset.mode; calcBid();
});
['b-client','b-room','b-scope','b-sqft','b-stalls','b-crew','b-shift','b-markup','b-miles','b-perdiem','b-equip','b-moist','b-pw','b-night','b-phased','b-lift','b-stor','b-ins','b-risk'].forEach(id=>$(id).addEventListener('input',calcBid));
['m-sqft','m-scope','m-vrp','m-waste'].forEach(id=>$(id).addEventListener('input',calcPO));
window.LAW={switchView,toast,loadFacilityToBid:(z)=>{
  $('b-client').value=z.name||''; $('b-room').value=z.species||''; $('b-sqft').value=z.sqft||'';
  calcBid(); switchView('bid'); toast('Loaded '+z.name+' into Bid Calc');
}};
calcBid(); calcPO(); renderSaved();

=== FILE: docs-hub.js ===
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
    const drawHeader=()=>{
      pdf.setFillColor(15,23,42); pdf.rect(0,0,W,68,'F');
      pdf.setFillColor(245,158,11); pdf.rect(0,68,W,4,'F');
      pdf.setTextColor(255,255,255); pdf.setFont('helvetica','bold'); pdf.setFontSize(16);
      pdf.text('THE BESPOKE RENEWAL, LLC  |  LAY A WEIGH(R)',40,30);
      pdf.setFont('helvetica','normal'); pdf.setFontSize(9); pdf.setTextColor(203,213,225);
      pdf.text('Engineered Zoological Flooring  •  (254) 265-5275  •  thebespokerenewal@gmail.com',40,48);
      pdf.setTextColor(251,191,36); pdf.setFont('helvetica','bold'); pdf.setFontSize(10);
      pdf.text(d.title,40,62);
    };
    drawHeader();
    pdf.setTextColor(20,25,35); pdf.setFont('helvetica','normal'); pdf.setFontSize(10);
    let y=96;
    const lines=pdf.splitTextToSize(d.body,W-80);
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
      pdf.text(`The Bespoke Renewal, LLC • Lay A Weigh® System • Page ${i} of ${pages}`,40,H-24);
    }
    const slug=(ctx.client||'TBR').replace(/[^a-z0-9]+/gi,'_').slice(0,22);
    const filename=`TBR_${slug}_${docId}.pdf`;
    const base64=pdf.output('datauristring').split(',')[1];
    return {pdf,filename,base64,title:d.title,body:d.body};
  }
  function renderList(){
    const host=document.getElementById('d-list'); if(!host) return;
    host.innerHTML=window.LAW_DOCS.ITEMS.map(it=>`
      <div class="saved-item">
        <label style="display:flex;align-items:center;gap:8px;margin:0;cursor:pointer;text-transform:none;flex:1">
          <input type="checkbox" data-did="${it.id}" ${selected.has(it.id)?'checked':''} style="width:auto;accent-color:#f59e0b">
          <div><b style="color:#fff;font-size:13px">${it.name}</b><div style="font-size:11px;color:#94a3b8">${it.sub}</div></div>
        </label>
        <button data-prev="${it.id}">Preview</button>
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
  function mount(){
    if(mounted) return; mounted=true;
    const sec=document.getElementById('view-docs'); if(!sec) return;
    sec.innerHTML=`
      <div class="card">
        <div class="card-h"><div class="card-title">1. Auto-Fill Client & Warranty Rules</div><button class="btn-sm gold" id="d-pull-bid">Pull Active Bid</button></div>
        <div class="grid2">
          <div><label>Client / Facility</label><input id="d-client" placeholder="e.g. Detroit Zoo"></div>
          <div><label>Client Email</label><input id="d-email" type="email" placeholder="curator@zoo.org"></div>
        </div>
        <div class="grid3" style="margin-top:8px">
          <div><label>Barn / Enclosure</label><input id="d-room" placeholder="e.g. Rhino Barn"></div>
          <div><label>Effective Date</label><input id="d-date" type="date" value="${new Date().toISOString().slice(0,10)}"></div>
          <div><label>Warranty Tier</label><select id="d-tier"><option value="new">New Install (2-Yr)</option><option value="retop">Retop (1-Yr)</option></select></div>
        </div>
        <div class="grid2" style="margin-top:8px">
          <div><label>Max Pressure Washer PSI</label><select id="d-psi"><option value="2,500">2,500 PSI (Welcome Std)</option><option value="2,400">2,400 PSI (Maint Std)</option></select></div>
          <div><label>New Install At-Cost Window</label><select id="d-atcost"><option value="2yr">Years 3–4 (To Year 4 Retop)</option><option value="3yr">Years 3–5 (+3 Full Years)</option></select></div>
        </div>
      </div>
      <div class="card">
        <div class="card-h"><div class="card-title">2. Select Docs to Bundle & Attach</div></div>
        <div id="d-list"></div>
        <div style="margin-top:10px">
          <label>Email Subject</label>
          <input id="d-subj" value="The Bespoke Renewal — Lay A Weigh® Documentation">
        </div>
        <div style="margin-top:8px">
          <label>Email Cover Note</label>
          <textarea id="d-note" rows="3">Hi,\n\nPlease find the attached Lay A Weigh® documentation for your facility. Let us know if you have any questions.\n\nBest regards,\nSeth McNab, COO | The Bespoke Renewal, LLC | (254) 265-5275</textarea>
        </div>
        <div class="btn-row">
          <button class="btn primary" id="d-dl-pdfs"><b>Download Selected PDFs</b><small>Branded TBR letterhead PDFs</small></button>
          <button class="btn green" id="d-gmail-draft"><b>Gmail Draft w/ PDFs</b><small>Attaches PDFs via thebespokerenewal</small></button>
        </div>
        <div class="btn-row">
          <button class="btn" id="d-copy-all"><b>Copy Selected Text</b><small>Plain text for quick reply</small></button>
          <button class="btn" id="d-open-gmail"><b>Open Gmail Inbox</b><small>thebespokerenewal@gmail.com</small></button>
        </div>
      </div>
      <div class="card" id="d-prev-card" style="display:none">
        <div class="card-h"><div class="card-title" id="d-prev-title">Preview</div><button class="btn-sm" id="d-prev-copy">Copy</button></div>
        <textarea id="d-prev-text" rows="12" style="font-size:12px;line-height:1.45"></textarea>
      </div>`;
    renderList();
    document.getElementById('d-pull-bid').onclick=()=>{
      document.getElementById('d-client').value=document.getElementById('b-client')?.value||'';
      document.getElementById('d-room').value=document.getElementById('b-room')?.value||'';
      const sk=document.getElementById('b-scope')?.value||'new';
      document.getElementById('d-tier').value=(sk==='new'||sk==='ripout')?'new':'retop';
      const c=document.getElementById('d-client').value;
      if(c) document.getElementById('d-subj').value=`The Bespoke Renewal — ${c} Lay A Weigh® Docs`;
      window.LAW.toast('Pulled from Bid Calculator');
    };
    document.getElementById('d-prev-copy').onclick=()=>navigator.clipboard.writeText(document.getElementById('d-prev-text').value).then(()=>window.LAW.toast('Copied!'));
    document.getElementById('d-copy-all').onclick=()=>{
      if(!selected.size) return window.LAW.toast('Check at least 1 document');
      const ctx=getCtx();
      const txt=[...selected].map(id=>{const d=window.LAW_DOCS.build(id,ctx);return d.title+'\n'+'='.repeat(40)+'\n'+d.body;}).join('\n\n\n');
      navigator.clipboard.writeText(txt).then(()=>window.LAW.toast(`Copied ${selected.size} doc(s)!`));
    };
    document.getElementById('d-dl-pdfs').onclick=()=>{
      if(!selected.size) return window.LAW.toast('Check at least 1 document');
      if(!window.jspdf) return window.LAW.toast('PDF engine still loading...');
      const ctx=getCtx();
      [...selected].forEach(id=>{const o=makePdfObj(id,ctx); o.pdf.save(o.filename);});
      window.LAW.toast(`Downloaded ${selected.size} PDF(s)!`);
    };
    document.getElementById('d-gmail-draft').onclick=async()=>{
      if(!selected.size) return window.LAW.toast('Check at least 1 document');
      const ctx=getCtx(), subj=document.getElementById('d-subj').value, note=document.getElementById('d-note').value;
      const pdfs=[...selected].map(id=>makePdfObj(id,ctx));
      if(window.LAW_CLOUD?.isConnected()){
        window.LAW.toast('Creating Gmail draft with PDFs...');
        const ok=await window.LAW_CLOUD.createGmailDraft(ctx.email,subj,note,pdfs);
        if(ok) window.LAW.toast('Draft created in Gmail with PDFs!');
      }else{
        pdfs.forEach(o=>o.pdf.save(o.filename));
        window.location.href=`mailto:${encodeURIComponent(ctx.email)}?subject=${encodeURIComponent(subj)}&body=${encodeURIComponent(note)}`;
        window.LAW.toast('PDFs downloaded — connect Google Sync in Scanner tab for auto-attach');
      }
    };
    document.getElementById('d-open-gmail').onclick=()=>window.open('https://mail.google.com/mail/u/0/#drafts','_blank');
  }
  window.addEventListener('law:view',e=>{if(e.detail==='docs') mount();});
  mount();
})();

=== FILE: field-scanner.js ===
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

=== FILE: google-sync.js ===
(()=>{
  const ALLOWED='thebespokerenewal@gmail.com';
  const DEFAULT_CID='744394455846-q20ai91erndhf77ukrjr04530ergmh5r.apps.googleusercontent.com';
  const CID_KEY='law_google_cid_v1';
  const MAIL_KEY='law_mail_mode_v1';
  const DB_FILE='lay-a-weigh-db.json';
  const KEYS=['law_bids_v1','law_zoos_v1','law_scans_v1','law_diags_v1'];
  let token='', userEmail='';
  const getMailMode=()=>localStorage.getItem(MAIL_KEY)||'draft_only';
  const setMailMode=m=>localStorage.setItem(MAIL_KEY,m);
  function loadGis(){
    return new Promise((res,rej)=>{
      if(window.google?.accounts?.oauth2) return res();
      const s=document.createElement('script');
      s.src='https://accounts.google.com/gsi/client';
      s.onload=res; s.onerror=()=>rej(new Error('GIS failed'));
      document.head.appendChild(s);
    });
  }
  function setStatus(msg,ok=false){
    const el=document.getElementById('gs-status');
    if(el){el.textContent=msg; el.style.color=ok?'#34d399':'#fbbf24';}
  }
  async function connect(){
    const cid=(document.getElementById('gs-cid')?.value||localStorage.getItem(CID_KEY)||DEFAULT_CID).trim();
    if(!cid) return window.LAW.toast('Paste Google OAuth Client ID first');
    localStorage.setItem(CID_KEY,cid);
    const mode=getMailMode();
    const scope=mode==='off'
      ?'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/drive.file'
      :'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/gmail.compose';
    setStatus('Opening Google sign-in...');
    await loadGis();
    const client=google.accounts.oauth2.initTokenClient({
      client_id:cid,
      hint:ALLOWED,
      scope,
      callback:async resp=>{
        if(resp.error){setStatus('Auth error: '+resp.error); return;}
        const r=await fetch('https://www.googleapis.com/oauth2/v3/userinfo',{headers:{Authorization:'Bearer '+resp.access_token}});
        const info=await r.json();
        if((info.email||'').toLowerCase()!==ALLOWED){
          token=''; userEmail='';
          setStatus('BLOCKED: Sign in ONLY with '+ALLOWED);
          alert('Access restricted strictly to '+ALLOWED+'. You signed in as '+(info.email||'unknown')+'.');
          return;
        }
        token=resp.access_token; userEmail=info.email;
        setStatus('LOCKED & CONNECTED: '+userEmail+(mode==='off'?' (Drive Only)':' (Drafts Only)'),true);
        window.LAW.toast('Connected safely!');
      }
    });
    client.requestAccessToken();
  }
  function disconnect(){
    if(token&&window.google?.accounts?.oauth2){
      try{google.accounts.oauth2.revoke(token,()=>{});}catch{}
    }
    token=''; userEmail='';
    setStatus('Disconnected (working offline)');
    window.LAW.toast('Google session cut');
  }
  async function findDbId(){
    const q=encodeURIComponent(`name='${DB_FILE}' and trashed=false`);
    const r=await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,modifiedTime)`,{headers:{Authorization:'Bearer '+token}});
    const d=await r.json();
    return d.files?.[0]?.id||'';
  }
  function packDb(){
    const out={updatedAt:new Date().toISOString(),data:{}};
    KEYS.forEach(k=>{try{out.data[k]=JSON.parse(localStorage.getItem(k)||'[]');}catch{out.data[k]=[];}});
    return out;
  }
  function unpackDb(obj){
    if(!obj?.data) return false;
    KEYS.forEach(k=>{if(Array.isArray(obj.data[k])) localStorage.setItem(k,JSON.stringify(obj.data[k]));});
    return true;
  }
  async function pushDrive(){
    if(!token) return window.LAW.toast('Connect '+ALLOWED+' first');
    setStatus('Uploading database to Drive...');
    const body=JSON.stringify(packDb(),null,2);
    const id=await findDbId();
    let r;
    if(id){
      r=await fetch(`https://www.googleapis.com/upload/drive/v3/files/${id}?uploadType=media`,{
        method:'PATCH',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body
      });
    }else{
      const b='law_drv_'+Date.now();
      const meta=JSON.stringify({name:DB_FILE,mimeType:'application/json'});
      const mp=`--${b}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${meta}\r\n--${b}\r\nContent-Type: application/json\r\n\r\n${body}\r\n--${b}--`;
      r=await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',{
        method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':`multipart/related; boundary=${b}`},body:mp
      });
    }
    setStatus(r.ok?'Synced to Drive ('+new Date().toLocaleTimeString()+')':'Drive upload failed ('+r.status+')',r.ok);
    if(r.ok) window.LAW.toast('Cloud backup pushed!');
  }
  async function pullDrive(){
    if(!token) return window.LAW.toast('Connect '+ALLOWED+' first');
    setStatus('Pulling latest database from Drive...');
    const id=await findDbId();
    if(!id){setStatus('No Drive backup found yet — Push first.'); return;}
    const r=await fetch(`https://www.googleapis.com/drive/v3/files/${id}?alt=media`,{headers:{Authorization:'Bearer '+token}});
    const obj=await r.json();
    if(unpackDb(obj)){setStatus('Pulled & restored! Reloading...',true); setTimeout(()=>location.reload(),700);}
  }
  async function createGmailDraft(to,subj,textBody,pdfs){
    if(!token) return false;
    if(getMailMode()==='off'){
      alert('EMAIL SAFETY LOCK IS ON (Email Disabled).\n\nSwitch to "Drafts Only" under Scanner > Google Sync and reconnect to create drafts.');
      return false;
    }
    const files=(pdfs||[]).map(p=>p.filename).join(', ')||'None';
    const ok=confirm(
      'SAFEGUARD CHECK (DRAFT ONLY — WILL NOT SEND)\n\n'+
      'Account: '+ALLOWED+'\n'+
      'To: '+(to||'(Blank — add recipient inside Gmail)')+'\n'+
      'Subject: '+(subj||'(No subject)')+'\n'+
      'Attachments: '+files+'\n\n'+
      'Save this to Gmail Drafts for your manual review?'
    );
    if(!ok){window.LAW.toast('Draft cancelled'); return false;}
    const b='law_mail_'+Date.now();
    let raw=`To: ${to}\r\nSubject: ${subj}\r\nMIME-Version: 1.0\r\nContent-Type: multipart/mixed; boundary="${b}"\r\n\r\n`;
    raw+=`--${b}\r\nContent-Type: text/plain; charset="UTF-8"\r\n\r\n${textBody}\r\n\r\n`;
    (pdfs||[]).forEach(p=>{
      raw+=`--${b}\r\nContent-Type: application/pdf; name="${p.filename}"\r\nContent-Disposition: attachment; filename="${p.filename}"\r\nContent-Transfer-Encoding: base64\r\n\r\n${p.base64}\r\n\r\n`;
    });
    raw+=`--${b}--`;
    const b64=btoa(unescape(encodeURIComponent(raw))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
    const r=await fetch('https://gmail.googleapis.com/gmail/v1/users/me/drafts',{
      method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},
      body:JSON.stringify({message:{raw:b64}})
    });
    if(!r.ok){window.LAW.toast('Gmail draft error ('+r.status+') — reconnect in Drafts Only mode'); return false;}
    window.open('https://mail.google.com/mail/u/0/#drafts','_blank');
    return true;
  }
  function renderSync(){
    const host=document.getElementById('sync-panel'); if(!host) return;
    const cid=localStorage.getItem(CID_KEY)||DEFAULT_CID;
    const mode=getMailMode();
    host.innerHTML=`
      <div class="card">
        <div class="card-h"><div class="card-title">Single-Account Cloud Lock</div><span class="pill">${ALLOWED}</span></div>
        <div style="font-size:12px;color:#cbd5e1;margin-bottom:8px">Auto-sending is hard-disabled in code. Emails can only be saved as Drafts after you confirm a popup.</div>
        <label>Email Safety Lock</label>
        <select id="gs-mail-mode" style="margin-bottom:8px">
          <option value="draft_only" ${mode==='draft_only'?'selected':''}>🔒 Drafts Only — Requires Confirm Popup (Never Sends)</option>
          <option value="off" ${mode==='off'?'selected':''}>🛑 Email OFF — Drive Sync Only (Zero Gmail Access)</option>
        </select>
        <label>Google OAuth Client ID</label>
        <input id="gs-cid" value="${cid}" placeholder="Paste xxxxx.apps.googleusercontent.com">
        <div id="gs-status" style="font-size:12px;font-weight:700;color:${token?'#34d399':'#fbbf24'};margin-top:8px">${token?'LOCKED & CONNECTED: '+userEmail:'Not connected (working offline)'}</div>
        <div class="btn-row">
          <button class="btn primary" id="gs-conn"><b>Sign In Google</b><small>Only ${ALLOWED}</small></button>
          <button class="btn" id="gs-disc" style="border-color:#ef4444"><b style="color:#f87171">Disconnect</b><small>Cut session immediately</small></button>
        </div>
        <div class="btn-row">
          <button class="btn green" id="gs-push"><b>Push to Drive</b><small>Save live team database</small></button>
          <button class="btn" id="gs-pull"><b>Pull from Drive</b><small>Sync latest team edits</small></button>
        </div>
        <div class="btn-row">
          <button class="btn" id="gs-export"><b>Export JSON File</b><small>Offline device backup</small></button>
          <div style="padding:4px 0"><label style="margin-bottom:2px">Restore JSON Backup</label><input type="file" id="gs-import" accept=".json" style="padding:6px;font-size:11px"></div>
        </div>
      </div>`;
    document.getElementById('gs-mail-mode').onchange=e=>{
      setMailMode(e.target.value);
      if(token) disconnect();
      window.LAW.toast(e.target.value==='off'?'Email OFF — Drive only mode':'Drafts Only safeguard active');
    };
    document.getElementById('gs-conn').onclick=connect;
    document.getElementById('gs-disc').onclick=disconnect;
    document.getElementById('gs-push').onclick=pushDrive;
    document.getElementById('gs-pull').onclick=pullDrive;
    document.getElementById('gs-export').onclick=()=>{
      const blob=new Blob([JSON.stringify(packDb(),null,2)],{type:'application/json'});
      const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=DB_FILE; a.click();
      window.LAW.toast('Exported '+DB_FILE);
    };
    document.getElementById('gs-import').onchange=async e=>{
      const f=e.target.files?.[0]; if(!f) return;
      try{if(unpackDb(JSON.parse(await f.text()))){window.LAW.toast('Restored! Reloading...'); setTimeout(()=>location.reload(),600);}}catch{window.LAW.toast('Invalid JSON file');}
    };
  }
  window.LAW_CLOUD={isConnected:()=>!!token,createGmailDraft};
  window.addEventListener('law:sync-mount',renderSync);
  renderSync();
})();

=== FILE: index.html ===
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<title>Lay A Weigh® Command</title>
<link rel="manifest" href="./manifest.json?v=2">
<meta name="theme-color" content="#0f172a">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
<link rel="stylesheet" href="./styles.css?v=2">
</head>
<body>
<header class="topbar">
  <div class="brand">
    <div class="brand-title">LAY A WEIGH<span>®</span> COMMAND</div>
    <div class="brand-sub">THE BESPOKE RENEWAL, LLC • thebespokerenewal@gmail.com</div>
  </div>
  <div class="pill" id="markup-pill">30% MARKUP</div>
</header>
<div id="toast" class="toast">Copied!</div>
<main class="wrap">
  <section id="view-bid" class="view active">
    <div class="hero">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px">
        <div>
          <div style="font-size:11px;font-weight:800;color:#94a3b8;text-transform:uppercase">Commercial Bid Total</div>
          <div class="hero-amt" id="out-total">$0.00</div>
          <div class="hero-sub" id="out-psf">$0.00 / sq ft • 0 Calendar Days</div>
        </div>
        <div style="text-align:right">
          <div class="badge b-2yr" id="out-warr">2-YR WARRANTY</div>
          <div id="out-risk-badge"></div>
        </div>
      </div>
      <div id="out-species-warn" style="margin-top:8px"></div>
    </div>
    <div class="card">
      <div class="card-h"><div class="card-title">1. Job Scope & Facility</div><button class="btn-sm" id="btn-reset-bid">Reset to $0</button></div>
      <div class="grid2">
        <div><label>Facility / Zoo Name</label><input id="b-client" placeholder="Enter zoo or facility"></div>
        <div><label>Barn & Species</label><input id="b-room" placeholder="e.g. Rhino Stalls 2-4"></div>
      </div>
      <div class="grid3" style="margin-top:9px">
        <div>
          <label>Installation Scope</label>
          <select id="b-scope">
            <option value="new">New Full Install (3/4" Mats)</option>
            <option value="ripout">Full Rip-Out & Replace</option>
            <option value="old_retop">Old High-Risk Retop (8+ yrs)</option>
            <option value="std_retop">Standard 4-Yr Retop</option>
            <option value="wear_top">1/8" Wear Top Only</option>
            <option value="smooth">Smooth Top Coat</option>
          </select>
        </div>
        <div><label>Square Footage</label><input id="b-sqft" type="number" placeholder="0" min="0"></div>
        <div><label>Stall Count</label><input id="b-stalls" type="number" placeholder="0" min="0"></div>
      </div>
      <div class="grid3" style="margin-top:9px">
        <div><label>Crew Size</label><input id="b-crew" type="number" placeholder="0" min="0" max="8"></div>
        <div>
          <label>Shift Length</label>
          <select id="b-shift">
            <option value="12">12-Hr Shifts (Preferred)</option>
            <option value="8">8-Hr Shifts (+25% Days)</option>
          </select>
        </div>
        <div><label>Markup %</label><input id="b-markup" type="number" value="30" min="0" max="200"></div>
      </div>
      <div class="grid3" style="margin-top:9px">
        <div><label>One-Way Miles</label><input id="b-miles" type="number" placeholder="0" min="0"></div>
        <div><label>Per Diem / Guy / Day ($)</label><input id="b-perdiem" type="number" placeholder="0" min="0"></div>
        <div><label>Equipment Allowance ($)</label><input id="b-equip" type="number" placeholder="0" min="0"></div>
      </div>
      <div class="check-row">
        <label class="chk"><input type="checkbox" id="b-moist"> 48-Hr Moisture Pause (+2d / 3h)</label>
        <label class="chk"><input type="checkbox" id="b-pw"> Prevailing Wage ($120/$65)</label>
        <label class="chk"><input type="checkbox" id="b-night"> Night Shift (+$5/hr/guy)</label>
        <label class="chk"><input type="checkbox" id="b-phased"> Phased Access (+15% hrs)</label>
        <label class="chk"><input type="checkbox" id="b-lift"> No Dock/Forklift (+$500)</label>
        <label class="chk"><input type="checkbox" id="b-stor"> No Shaded Storage (+$500)</label>
        <label class="chk"><input type="checkbox" id="b-ins"> 5% Insurance</label>
        <label class="chk"><input type="checkbox" id="b-risk"> Force 10% Risk Reserve</label>
      </div>
    </div>
    <div class="card">
      <div class="card-h"><div class="card-title">2. Pricing View & Breakdown</div></div>
      <div class="tabs-mini">
        <button class="active" data-mode="full">Full Formula</button>
        <button data-mode="twopart">Two-Part (No Hrs)</button>
        <button data-mode="stall">Per-Stall Menu</button>
      </div>
      <div id="out-breakdown"></div>
      <div class="btn-row">
        <button class="btn primary" id="btn-copy-prop"><b>Copy Client Proposal</b><small>Includes warranty & mobilization note</small></button>
        <button class="btn green" id="btn-save-bid"><b>Save Bid Locally</b><small>Store to device (Drive sync Patch 4)</small></button>
      </div>
    </div>
    <div class="card">
      <div class="card-h"><div class="card-title">Saved Bids</div><small id="saved-count" style="color:#94a3b8"></small></div>
      <div id="saved-list"></div>
    </div>
  </section>
  <section id="view-mat" class="view">
    <div class="card">
      <div class="card-h"><div class="card-title">5-Gallon Pail & Mat PO Calculator</div><div class="pill" id="po-total-pill">$0.00</div></div>
      <div class="grid3">
        <div><label>Square Footage</label><input id="m-sqft" type="number" placeholder="0" min="0"></div>
        <div>
          <label>System Type</label>
          <select id="m-scope">
            <option value="new">Full System (Mats + Coatings)</option>
            <option value="retop">Retop Only (No Full Mats)</option>
          </select>
        </div>
        <div>
          <label>VRP-111 Coats</label>
          <select id="m-vrp">
            <option value="2">2 Coats (15 lb block)</option>
            <option value="1">1 Coat (10 lb block)</option>
            <option value="0">None</option>
          </select>
        </div>
      </div>
      <div class="check-row">
        <label class="chk"><input type="checkbox" id="m-waste" checked> Include 10% Waste Factor</label>
        <button class="btn-sm gold" id="btn-sync-sqft">Pull Sq Ft from Bid</button>
      </div>
    </div>
    <div class="card">
      <div class="card-h"><div class="card-title">Itemized Supplier Order (5-Gal Pail Pricing)</div></div>
      <div style="overflow-x:auto">
        <table>
          <thead><tr><th>Item</th><th>Qty</th><th>Unit</th><th>Est. Cost</th></tr></thead>
          <tbody id="po-tbody"></tbody>
        </table>
      </div>
      <div class="btn-row">
        <button class="btn primary" id="btn-copy-po"><b>Copy Supplier PO</b><small>Your exact order format</small></button>
        <button class="btn" id="btn-copy-acr"><b>Copy Acronym Legend</b><small>NVM through SSD quick ref</small></button>
      </div>
    </div>
  </section>
  <section id="view-map" class="view">
    <div class="card">
      <div class="card-h">
        <div class="card-title">Nationwide Zoo Radar</div>
        <div style="display:flex;gap:6px">
          <button class="btn-sm gold" id="btn-add-zoo">+ Add Zoo</button>
          <button class="btn-sm" id="btn-clear-zoos">Clear / Seed</button>
        </div>
      </div>
      <div class="filter-bar" id="map-filters"></div>
      <div id="zoo-map"></div>
    </div>
    <div class="card">
      <div class="card-h"><div class="card-title">Facility Directory</div><small id="zoo-count" style="color:#94a3b8"></small></div>
      <input id="zoo-search" placeholder="Search zoo, city, species, contact..." style="margin-bottom:10px">
      <div id="zoo-list"></div>
    </div>
  </section>
  <section id="view-docs" class="view">
    <div class="card placeholder">
      <div style="font-size:36px">📄</div>
      <h3>Harmonized Doc Vault & Gmail Hub (Patch 3)</h3>
      <p>Auto-filled 2-Year New / 1-Year Retop Warranties, Extended At-Cost Addendum, Welcome & Compliance, Pre-Install Sign-Off, Spec/Maintenance Sheets, Spot Repair Guide, and Questionnaires with 1-tap PDF bundling.</p>
    </div>
  </section>
  <section id="view-scan" class="view">
    <div class="card placeholder">
      <div style="font-size:36px">📷</div>
      <h3>OCR Scanner, Diagnostics & Drive Sync (Patch 4)</h3>
      <p>Camera OCR for 1998–2025 paper files, rebound & Tramex Mode 5 logger, and single-email Google Drive/Gmail OAuth sync.</p>
    </div>
  </section>
</main>
<div class="modal-bg" id="zoo-modal">
  <div class="modal-box">
    <div class="card-h"><div class="card-title" id="zm-title">Add Facility</div><button class="btn-sm" id="zm-close">✕</button></div>
    <input type="hidden" id="zm-id">
    <div class="grid2">
      <div><label>Facility / Zoo Name</label><input id="zm-name" placeholder="e.g. Omaha Henry Doorly Zoo"></div>
      <div><label>City, State</label><input id="zm-city" placeholder="e.g. Omaha, NE"></div>
    </div>
    <div class="grid3" style="margin-top:8px">
      <div><label>Latitude</label><input id="zm-lat" type="number" step="any" placeholder="Auto"></div>
      <div><label>Longitude</label><input id="zm-lng" type="number" step="any" placeholder="Auto"></div>
      <div style="display:flex;align-items:flex-end"><button class="btn-sm gold" id="zm-geo" style="width:100%;padding:10px">Find Coords</button></div>
    </div>
    <div class="grid2" style="margin-top:8px">
      <div>
        <label>Map Pin Status Color</label>
        <select id="zm-status">
          <option value="red">🔴 Red — Needs Attention / Overdue</option>
          <option value="yellow">🟡 Yellow — Retop Soon / Pending</option>
          <option value="green">🟢 Green — Healthy / Warrantied</option>
          <option value="blue">🔵 Blue — Scheduled / Active Job</option>
          <option value="purple">🟣 Purple — Historical Audit / AZA</option>
        </select>
      </div>
      <div><label>Barn & Species</label><input id="zm-species" placeholder="e.g. Rhino Barn"></div>
    </div>
    <div class="grid3" style="margin-top:8px">
      <div><label>Est. Sq Ft</label><input id="zm-sqft" type="number" placeholder="0"></div>
      <div><label>Install Year</label><input id="zm-inst" type="number" placeholder="e.g. 2022"></div>
      <div><label>Last Retop Yr</label><input id="zm-retop" type="number" placeholder="e.g. 2026"></div>
    </div>
    <div class="grid2" style="margin-top:8px">
      <div><label>Contact Name</label><input id="zm-contact" placeholder="Curator / Facilities"></div>
      <div><label>Phone / Email</label><input id="zm-phone" placeholder="Phone or email"></div>
    </div>
    <div style="margin-top:8px"><label>Notes / Diagnostics</label><textarea id="zm-notes" rows="2" placeholder="Rebound score, moisture notes, history..."></textarea></div>
    <div class="btn-row">
      <button class="btn green" id="zm-save"><b>Save Facility Pin</b><small>Updates glowing map immediately</small></button>
      <button class="btn" id="zm-del" style="border-color:#ef4444"><b style="color:#f87171">Delete Pin</b><small>Remove from map</small></button>
    </div>
  </div>
</div>
<nav class="nav">
  <button class="active" data-view="bid"><span>🧮</span>Bid Calc</button>
  <button data-view="mat"><span>📦</span>Materials</button>
  <button data-view="map"><span>🗺️</span>Zoo Map</button>
  <button data-view="docs"><span>📄</span>Docs/Mail</button>
  <button data-view="scan"><span>📷</span>Scanner</button>
</nav>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script src="./app.js?v=2"></script>
<script src="./zoo-map.js?v=2"></script>
  <script src="https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js"></script>
  <script src="./docs-templates.js?v=1"></script>
  <script src="./docs-hub.js?v=1"></script>
  <script src="https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js"></script>
  <script src="./field-scanner.js?v=1"></script>
  <script src="./google-sync.js?v=1"></script>
</body>
</html>

=== FILE: manifest.json ===
{
  "name": "Lay A Weigh® Command",
  "short_name": "Lay A Weigh®",
  "start_url": "/Lay-A-Weigh/",
  "scope": "/Lay-A-Weigh/",
  "display": "standalone",
  "background_color": "#0b111a",
  "theme_color": "#0f172a",
  "icons": []
}

=== FILE: styles.css ===
:root{--bg:#0b111a;--panel:#131c2b;--panel2:#1b2638;--line:#2b3a52;--txt:#f1f5f9;--muted:#94a3b8;--gold:#f59e0b;--gold2:#fbbf24;--green:#10b981;--red:#ef4444;--blue:#38bdf8;--purple:#a855f7}
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
body{margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:var(--bg);color:var(--txt);padding-bottom:84px}
.topbar{position:sticky;top:0;z-index:40;background:rgba(15,23,42,.96);backdrop-filter:blur(8px);border-bottom:1px solid var(--line);padding:12px 14px;display:flex;align-items:center;justify-content:space-between;gap:10px}
.brand{display:flex;flex-direction:column}
.brand-title{font-weight:800;font-size:17px;letter-spacing:.3px;color:#fff}
.brand-title span{color:var(--gold)}
.brand-sub{font-size:11px;color:var(--muted);letter-spacing:.4px}
.pill{font-size:11px;font-weight:700;padding:4px 9px;border-radius:999px;border:1px solid var(--line);background:var(--panel2);color:var(--gold)}
.wrap{max-width:960px;margin:0 auto;padding:12px}
.view{display:none}.view.active{display:block}
.card{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:14px;margin-bottom:12px}
.card-h{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;gap:8px}
.card-title{font-size:14px;font-weight:800;text-transform:uppercase;letter-spacing:.6px;color:var(--gold2)}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px}
@media(max-width:560px){.grid3{grid-template-columns:1fr 1fr}}
label{display:block;font-size:11px;font-weight:700;color:var(--muted);margin-bottom:4px;text-transform:uppercase;letter-spacing:.3px}
input,select,textarea{width:100%;background:#0a1019;color:#fff;border:1px solid var(--line);border-radius:10px;padding:10px 11px;font-size:14px;outline:none}
input:focus,select:focus,textarea:focus{border-color:var(--gold)}
.check-row{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}
.chk{display:flex;align-items:center;gap:6px;background:var(--panel2);border:1px solid var(--line);border-radius:10px;padding:8px 10px;font-size:12px;font-weight:600;color:var(--txt);cursor:pointer}
.chk input{width:auto;margin:0;accent-color:var(--gold)}
.btn-row{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}
.btn{background:var(--panel2);border:1px solid var(--line);color:#fff;border-radius:11px;padding:10px 12px;cursor:pointer;text-align:left;display:flex;flex-direction:column;gap:2px}
.btn b{font-size:13px}.btn small{font-size:11px;color:var(--muted)}
.btn.primary{background:linear-gradient(135deg,#d97706,#b45309);border-color:#f59e0b}.btn.primary small{color:#fef3c7}
.btn.green{background:#064e3b;border-color:#10b981}.btn.green small{color:#a7f3d0}
.btn-sm{background:var(--panel2);border:1px solid var(--line);color:#fff;border-radius:8px;padding:6px 10px;font-size:11px;font-weight:700;cursor:pointer}
.btn-sm.gold{background:var(--gold);color:#0b111a;border-color:var(--gold)}
.hero{background:linear-gradient(135deg,#172336,#0f172a);border:1px solid #d97706;border-radius:14px;padding:14px;margin-bottom:12px}
.hero-amt{font-size:30px;font-weight:900;color:#fff;line-height:1.1}
.hero-sub{font-size:13px;color:var(--gold2);font-weight:700;margin-top:4px}
.badge{display:inline-block;font-size:11px;font-weight:800;padding:3px 8px;border-radius:6px;margin-top:6px}
.b-2yr{background:rgba(16,185,129,.18);color:#34d399;border:1px solid #10b981}
.b-1yr{background:rgba(245,158,11,.18);color:#fbbf24;border:1px solid #f59e0b}
.b-warn{background:rgba(239,68,68,.18);color:#f87171;border:1px solid #ef4444}
.kv{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px dashed #243247;font-size:13px}
.kv:last-child{border-bottom:none}
.kv span:first-child{color:var(--muted)}.kv b{color:#fff}
.tabs-mini{display:flex;gap:6px;margin-bottom:10px}
.tabs-mini button{flex:1;padding:8px;border-radius:9px;border:1px solid var(--line);background:var(--panel2);color:var(--muted);font-size:12px;font-weight:700;cursor:pointer}
.tabs-mini button.active{background:var(--gold);color:#0b111a;border-color:var(--gold)}
table{width:100%;border-collapse:collapse;font-size:12px}
th,td{padding:8px 6px;border-bottom:1px solid #223045;text-align:left}
th{color:var(--gold2);font-size:11px;text-transform:uppercase}
.acr{display:inline-block;background:#0a1019;border:1px solid var(--gold);color:var(--gold2);font-weight:800;font-size:10px;padding:2px 5px;border-radius:5px;margin-right:4px}
.nav{position:fixed;bottom:0;left:0;right:0;z-index:50;background:rgba(15,23,42,.98);border-top:1px solid var(--line);display:grid;grid-template-columns:repeat(5,1fr);padding:6px 4px}
.nav button{background:none;border:none;color:var(--muted);display:flex;flex-direction:column;align-items:center;gap:2px;padding:6px 2px;font-size:10px;font-weight:700;cursor:pointer}
.nav button span{font-size:18px}
.nav button.active{color:var(--gold)}
.toast{position:fixed;top:66px;left:50%;transform:translateX(-50%);background:#10b981;color:#052e16;font-weight:800;font-size:13px;padding:9px 16px;border-radius:999px;display:none;z-index:99;box-shadow:0 8px 24px rgba(0,0,0,.45)}
.saved-item{display:flex;justify-content:space-between;align-items:center;padding:9px;background:var(--panel2);border:1px solid var(--line);border-radius:10px;margin-bottom:7px;gap:8px}
.saved-item button{background:#0a1019;border:1px solid var(--line);color:#fff;border-radius:8px;padding:6px 9px;font-size:11px;font-weight:700;cursor:pointer}
.placeholder{text-align:center;padding:28px 16px;color:var(--muted)}
.placeholder h3{color:#fff;margin:8px 0 6px}
.filter-bar{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px}
.fchip{padding:6px 10px;border-radius:999px;border:1px solid var(--line);background:var(--panel2);color:var(--txt);font-size:11px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:5px}
.fchip.active{border-color:var(--gold);background:#26354d}
.dot{width:9px;height:9px;border-radius:50%;display:inline-block}
.d-red{background:#ef4444;box-shadow:0 0 8px #ef4444}
.d-yellow{background:#f59e0b;box-shadow:0 0 8px #f59e0b}
.d-green{background:#10b981;box-shadow:0 0 8px #10b981}
.d-blue{background:#38bdf8;box-shadow:0 0 8px #38bdf8}
.d-purple{background:#a855f7;box-shadow:0 0 8px #a855f7}
#zoo-map{height:350px;width:100%;border-radius:12px;border:1px solid var(--line);background:#0a1019;z-index:1}
.glow-pin{width:16px;height:16px;border-radius:50%;border:2px solid #fff;position:relative}
.glow-pin::after{content:'';position:absolute;inset:-6px;border-radius:50%;opacity:.65;animation:gpulse 1.8s infinite}
.gp-red{background:#ef4444;box-shadow:0 0 14px #ef4444}.gp-red::after{border:2px solid #ef4444}
.gp-yellow{background:#f59e0b;box-shadow:0 0 14px #f59e0b}.gp-yellow::after{border:2px solid #f59e0b}
.gp-green{background:#10b981;box-shadow:0 0 12px #10b981}.gp-green::after{border:2px solid #10b981;animation-duration:3.2s}
.gp-blue{background:#38bdf8;box-shadow:0 0 14px #38bdf8}.gp-blue::after{border:2px solid #38bdf8}
.gp-purple{background:#a855f7;box-shadow:0 0 12px #a855f7}.gp-purple::after{border:2px solid #a855f7;animation-duration:2.8s}
@keyframes gpulse{0%{transform:scale(.85);opacity:.85}70%{transform:scale(1.85);opacity:0}100%{transform:scale(1.85);opacity:0}}
.leaflet-popup-content-wrapper,.leaflet-popup-tip{background:#131c2b;color:#f1f5f9;border:1px solid #2b3a52}
.modal-bg{position:fixed;inset:0;background:rgba(5,10,18,.82);z-index:80;display:none;align-items:center;justify-content:center;padding:12px}
.modal-bg.open{display:flex}
.modal-box{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:14px;width:100%;max-width:520px;max-height:90vh;overflow-y:auto}

=== FILE: sw.js ===
self.addEventListener('install',e=>self.skipWaiting());self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));self.addEventListener('fetch',e=>e.respondWith(fetch(e.request)));

=== FILE: zoo-map.js ===
(()=>{
  const KEY='law_zoos_v1';
  const STATUS={
    red:{label:'Needs Attention',dot:'d-red',pin:'gp-red',hex:'#ef4444'},
    yellow:{label:'Retop Soon',dot:'d-yellow',pin:'gp-yellow',hex:'#f59e0b'},
    green:{label:'Healthy',dot:'d-green',pin:'gp-green',hex:'#10b981'},
    blue:{label:'Scheduled',dot:'d-blue',pin:'gp-blue',hex:'#38bdf8'},
    purple:{label:'Historical / AZA',dot:'d-purple',pin:'gp-purple',hex:'#a855f7'}
  };
  const SEED=[
    {id:'z1',name:'Detroit Zoo',city:'Royal Oak, MI',lat:42.4767,lng:-83.1563,status:'blue',species:'Camel & Rhino Stalls 2-4',sqft:1600,inst:2012,retop:2026,contact:'',phone:'',notes:'Camel replacement + multi-stall rhino retop/rip-out.'},
    {id:'z2',name:'Kansas City Zoo & Aquarium',city:'Kansas City, MO',lat:39.0067,lng:-94.5285,status:'yellow',species:'Elephant Barn',sqft:0,inst:0,retop:0,contact:'',phone:'',notes:'Elephant barn maintenance & structural patch engineering.'},
    {id:'z3',name:'North Carolina Zoo',city:'Asheboro, NC',lat:35.6317,lng:-79.7664,status:'green',species:'Rhinoceros Habitat',sqft:4000,inst:0,retop:0,contact:'',phone:'',notes:'4,000 sq ft rhinoceros holding system.'},
    {id:'z4',name:'Houston Zoo',city:'Houston, TX',lat:29.7158,lng:-95.3905,status:'yellow',species:'Giraffe Barn Stalls',sqft:800,inst:0,retop:0,contact:'',phone:'',notes:'Giraffe barn stalls — check 4-year retop cycle.'},
    {id:'z5',name:'Tanganyika Wildlife Park',city:'Goddard, KS',lat:37.6606,lng:-97.5734,status:'green',species:'Penguin Habitat',sqft:0,inst:0,retop:0,contact:'',phone:'',notes:'Fine-granule penguin surface.'},
    {id:'z6',name:'ABQ BioPark Zoo',city:'Albuquerque, NM',lat:35.0772,lng:-106.6631,status:'yellow',species:'Elephant & Tortoise',sqft:0,inst:0,retop:0,contact:'',phone:'',notes:'Elephant and tortoise enclosures.'},
    {id:'z7',name:'Cheyenne Mountain Zoo',city:'Colorado Springs, CO',lat:38.7717,lng:-104.8550,status:'red',species:'Rhino & Camel Barns',sqft:1200,inst:0,retop:0,contact:'',phone:'',notes:'Old rhino retop evaluation & moisture check.'},
    {id:'z8',name:'Indianapolis Zoo',city:'Indianapolis, IN',lat:39.7675,lng:-86.1806,status:'yellow',species:'New Inquiry',sqft:0,inst:0,retop:0,contact:'',phone:'',notes:'Pending preliminary project questionnaire.'},
    {id:'z9',name:'Denver Zoo',city:'Denver, CO',lat:39.7501,lng:-104.9491,status:'purple',species:'Historical Habitat',sqft:0,inst:0,retop:0,contact:'',phone:'',notes:'Legacy installation — verify inventory & contact.'},
    {id:'z10',name:'Dallas Zoo',city:'Dallas, TX',lat:32.7405,lng:-96.8152,status:'purple',species:'Historical Habitat',sqft:0,inst:0,retop:0,contact:'',phone:'',notes:'Legacy installation — audit contact & floor age.'},
    {id:'z11',name:'Zoo Atlanta',city:'Atlanta, GA',lat:33.7341,lng:-84.3723,status:'purple',species:'Historical Habitat',sqft:0,inst:0,retop:0,contact:'',phone:'',notes:'Legacy installation — AZA soft-substrate check.'}
  ];
  let map=null, layer=null, filter='all';
  const getZoos=()=>{
    const raw=localStorage.getItem(KEY);
    if(raw===null){localStorage.setItem(KEY,JSON.stringify(SEED));return JSON.parse(JSON.stringify(SEED));}
    try{return JSON.parse(raw);}catch{return [];}
  };
  const saveZoos=arr=>localStorage.setItem(KEY,JSON.stringify(arr));
  function initMap(){
    if(map||typeof L==='undefined') return;
    map=L.map('zoo-map',{zoomControl:true,attributionControl:false}).setView([38.8,-96.5],4);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',{maxZoom:18}).addTo(map);
    layer=L.layerGroup().addTo(map);
    renderAll();
  }
  function renderFilters(zoos){
    const counts={all:zoos.length,red:0,yellow:0,green:0,blue:0,purple:0};
    zoos.forEach(z=>{if(counts[z.status]!==undefined) counts[z.status]++;});
    const bar=document.getElementById('map-filters');
    if(!bar) return;
    let html=`<button class="fchip ${filter==='all'?'active':''}" data-f="all">All (${counts.all})</button>`;
    Object.keys(STATUS).forEach(k=>{
      const s=STATUS[k];
      html+=`<button class="fchip ${filter===k?'active':''}" data-f="${k}"><span class="dot ${s.dot}"></span>${s.label} (${counts[k]})</button>`;
    });
    bar.innerHTML=html;
    bar.querySelectorAll('.fchip').forEach(b=>b.onclick=()=>{filter=b.dataset.f;renderAll();});
  }
  function renderAll(){
    const zoos=getZoos();
    renderFilters(zoos);
    const q=(document.getElementById('zoo-search')?.value||'').toLowerCase();
    const shown=zoos.filter(z=>(filter==='all'||z.status===filter)&&(!q||[z.name,z.city,z.species,z.contact,z.notes].join(' ').toLowerCase().includes(q)));
    if(layer){
      layer.clearLayers();
      shown.forEach(z=>{
        if(!z.lat||!z.lng) return;
        const st=STATUS[z.status]||STATUS.purple;
        const icon=L.divIcon({className:'',html:`<div class="glow-pin ${st.pin}"></div>`,iconSize:[16,16],iconAnchor:[8,8]});
        const m=L.marker([z.lat,z.lng],{icon}).addTo(layer);
        m.bindPopup(`<div style="min-width:190px"><b style="font-size:13px">${z.name}</b><div style="font-size:11px;color:#94a3b8">${z.city} • ${z.species||'Habitat'}</div><div style="margin:5px 0;font-size:11px;color:${st.hex};font-weight:800">● ${st.label}</div>${z.sqft?`<div style="font-size:11px">Footprint: ${z.sqft} sq ft</div>`:''}${z.notes?`<div style="font-size:11px;color:#cbd5e1;margin-top:4px">${z.notes}</div>`:''}<div style="display:flex;gap:5px;margin-top:8px"><button class="btn-sm gold" onclick="window.__zmBid('${z.id}')">Bid</button><button class="btn-sm" onclick="window.__zmEdit('${z.id}')">Edit</button><button class="btn-sm" onclick="window.__zmRoute('${z.id}')">Route</button></div></div>`);
      });
    }
    document.getElementById('zoo-count').textContent=`${shown.length} of ${zoos.length} facilities`;
    const list=document.getElementById('zoo-list');
    if(!shown.length){list.innerHTML='<div style="font-size:12px;color:#94a3b8">No matching facilities. Tap + Add Zoo to drop a pin.</div>';return;}
    list.innerHTML=shown.map(z=>{
      const st=STATUS[z.status]||STATUS.purple;
      return `<div class="saved-item" style="align-items:flex-start"><div style="flex:1"><div style="display:flex;align-items:center;gap:6px"><span class="dot ${st.dot}"></span><b style="font-size:13px">${z.name}</b></div><div style="font-size:11px;color:#94a3b8;margin-top:2px">${z.city} • ${z.species||'—'}${z.sqft?' • '+z.sqft+' sf':''}</div>${z.contact?`<div style="font-size:11px;color:#cbd5e1">${z.contact} ${z.phone||''}</div>`:''}</div><div style="display:flex;gap:5px;flex-wrap:wrap"><button onclick="window.__zmFocus('${z.id}')">Pin</button><button onclick="window.__zmBid('${z.id}')" style="color:#fbbf24">Bid</button><button onclick="window.__zmEdit('${z.id}')">Edit</button></div></div>`;
    }).join('');
  }
  function openModal(z=null){
    document.getElementById('zm-title').textContent=z?'Edit Facility':'Add Facility Pin';
    document.getElementById('zm-id').value=z?z.id:'';
    document.getElementById('zm-name').value=z?z.name:'';
    document.getElementById('zm-city').value=z?z.city:'';
    document.getElementById('zm-lat').value=z?z.lat:'';
    document.getElementById('zm-lng').value=z?z.lng:'';
    document.getElementById('zm-status').value=z?z.status:'yellow';
    document.getElementById('zm-species').value=z?z.species:'';
    document.getElementById('zm-sqft').value=z&&z.sqft?z.sqft:'';
    document.getElementById('zm-inst').value=z&&z.inst?z.inst:'';
    document.getElementById('zm-retop').value=z&&z.retop?z.retop:'';
    document.getElementById('zm-contact').value=z?z.contact:'';
    document.getElementById('zm-phone').value=z?z.phone:'';
    document.getElementById('zm-notes').value=z?z.notes:'';
    document.getElementById('zm-del').style.display=z?'flex':'none';
    document.getElementById('zoo-modal').classList.add('open');
  }
  async function geocode(){
    const q=[document.getElementById('zm-name').value,document.getElementById('zm-city').value].filter(Boolean).join(', ');
    if(!q) return window.LAW.toast('Enter Name or City, State first');
    window.LAW.toast('Searching coordinates...');
    try{
      const r=await fetch('https://nominatim.openstreetmap.org/search?format=json&limit=1&q='+encodeURIComponent(q));
      const d=await r.json();
      if(d&&d[0]){
        document.getElementById('zm-lat').value=Number(d[0].lat).toFixed(4);
        document.getElementById('zm-lng').value=Number(d[0].lon).toFixed(4);
        window.LAW.toast('Coordinates found!');
      }else{window.LAW.toast('Try City, State only');}
    }catch{window.LAW.toast('Lookup failed — enter manually');}
  }
  document.getElementById('btn-add-zoo').onclick=()=>openModal(null);
  document.getElementById('zm-close').onclick=()=>document.getElementById('zoo-modal').classList.remove('open');
  document.getElementById('zm-geo').onclick=geocode;
  document.getElementById('zoo-search').addEventListener('input',renderAll);
  document.getElementById('btn-clear-zoos').onclick=()=>{
    const cur=getZoos();
    if(cur.length){if(confirm('Clear all pins from the map?')){saveZoos([]);renderAll();window.LAW.toast('Map cleared');}}
    else{saveZoos(SEED);renderAll();window.LAW.toast('Restored 11 known zoos');}
  };
  document.getElementById('zm-save').onclick=async()=>{
    const name=document.getElementById('zm-name').value.trim();
    if(!name) return window.LAW.toast('Facility name required');
    if(!document.getElementById('zm-lat').value&&document.getElementById('zm-city').value) await geocode();
    const obj={
      id:document.getElementById('zm-id').value||('z_'+Date.now()),
      name,city:document.getElementById('zm-city').value.trim(),
      lat:parseFloat(document.getElementById('zm-lat').value)||0,
      lng:parseFloat(document.getElementById('zm-lng').value)||0,
      status:document.getElementById('zm-status').value,
      species:document.getElementById('zm-species').value.trim(),
      sqft:parseInt(document.getElementById('zm-sqft').value,10)||0,
      inst:parseInt(document.getElementById('zm-inst').value,10)||0,
      retop:parseInt(document.getElementById('zm-retop').value,10)||0,
      contact:document.getElementById('zm-contact').value.trim(),
      phone:document.getElementById('zm-phone').value.trim(),
      notes:document.getElementById('zm-notes').value.trim()
    };
    const zoos=getZoos(), idx=zoos.findIndex(x=>x.id===obj.id);
    if(idx>=0) zoos[idx]=obj; else zoos.unshift(obj);
    saveZoos(zoos);
    document.getElementById('zoo-modal').classList.remove('open');
    renderAll();
    if(map&&obj.lat&&obj.lng) map.setView([obj.lat,obj.lng],6);
    window.LAW.toast('Facility pin saved!');
  };
  document.getElementById('zm-del').onclick=()=>{
    const id=document.getElementById('zm-id').value;
    saveZoos(getZoos().filter(x=>x.id!==id));
    document.getElementById('zoo-modal').classList.remove('open');
    renderAll(); window.LAW.toast('Pin removed');
  };
  window.__zmFocus=id=>{
    const z=getZoos().find(x=>x.id===id);
    if(z&&map&&z.lat&&z.lng){map.setView([z.lat,z.lng],7);window.scrollTo({top:0,behavior:'smooth'});}
  };
  window.__zmEdit=id=>openModal(getZoos().find(x=>x.id===id));
  window.__zmBid=id=>{const z=getZoos().find(x=>x.id===id); if(z) window.LAW.loadFacilityToBid(z);};
  window.__zmRoute=id=>{
    const z=getZoos().find(x=>x.id===id);
    if(z) window.open('https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(z.name+' '+z.city),'_blank');
  };
  window.addEventListener('law:view',e=>{
    if(e.detail==='map'){initMap();setTimeout(()=>{if(map) map.invalidateSize();renderAll();},120);}
  });
})();