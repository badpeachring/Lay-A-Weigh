const $=id=>document.getElementById(id);
const fmt=n=>'$'+Number(n||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
const toast=m=>{const t=$('toast');if(!t)return;t.textContent=m;t.style.display='block';clearTimeout(window._tt);window._tt=setTimeout(()=>t.style.display='none',2400);};
const SCOPES={
  new:{name:'New Full System Install (3/4″ Mats)',matRate:15,warr:'2-Year Limited Commercial Warranty',warrShort:'2-YR WARRANTY (NEW)',isNew:true,baseDays:5,sqftPerDay:350,hrsPerDay:9,risk:false},
  ripout:{name:'Full Rip-Out & Replace (3/4″ Mats)',matRate:15,warr:'2-Year Limited Commercial Warranty',warrShort:'2-YR WARRANTY (NEW)',isNew:true,baseDays:7,sqftPerDay:300,hrsPerDay:9,risk:false},
  old_retop:{name:'Old High-Risk Structural Retop (8+ yrs)',matRate:7,warr:'1-Year Limited Commercial Warranty',warrShort:'1-YR WARRANTY (RETOP)',isNew:false,baseDays:4,sqftPerDay:450,hrsPerDay:9.4,risk:true},
  std_retop:{name:'Standard 4-Year Proactive Retop',matRate:4.5,warr:'1-Year Limited Commercial Warranty',warrShort:'1-YR WARRANTY (RETOP)',isNew:false,baseDays:3,sqftPerDay:600,hrsPerDay:8.5,risk:false},
  wear_top:{name:'1/8″ Heavy Wear Top Only',matRate:4.5,warr:'1-Year Limited Commercial Warranty',warrShort:'1-YR WARRANTY (RETOP)',isNew:false,baseDays:3,sqftPerDay:650,hrsPerDay:8.5,risk:false},
  smooth:{name:'Smooth Top Coat System',matRate:4.5,warr:'1-Year Limited Commercial Warranty',warrShort:'1-YR WARRANTY (RETOP)',isNew:false,baseDays:2.5,sqftPerDay:750,hrsPerDay:8,risk:false}
};
let priceMode='full',lastBid=null,lastPO=null;

function switchView(v){
  document.querySelectorAll('.nav button').forEach(x=>x.classList.toggle('active',x.dataset.view===v));
  document.querySelectorAll('.view').forEach(x=>x.classList.toggle('active',x.id==='view-'+v));
  window.scrollTo({top:0,behavior:'instant'});
  window.dispatchEvent(new CustomEvent('law:view',{detail:v}));
}

function updateAdvPill(){
  let cnt=0;
  ['b-moist','b-pw','b-night','b-phased','b-lift','b-stor','b-ins','b-risk'].forEach(id=>{if($(id)?.checked) cnt++;});
  if((+$('b-stalls')?.value||0)>0) cnt++;
  if((+$('b-shift')?.value||12)!==12) cnt++;
  if((+$('b-markup')?.value||30)!==30) cnt++;
  if((+$('b-perdiem')?.value||0)>0) cnt++;
  if((+$('b-equip')?.value||0)>0) cnt++;
  const p=$('adv-count-pill');
  if(p) p.textContent=cnt?`${cnt} active`:'Default';
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
  $('markup-pill').textContent=markup+'%';
  updateAdvPill();
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
  $('out-risk-badge').innerHTML=useRisk?`<div class='badge b-warn'>+10% HIGH-RISK RESERVE</div>`:'';
  const rm=($('b-room').value||'').toLowerCase();
  const warn=(/pig|swine|hog|boar|cat|tiger|lion|jaguar|leopard|felid|chimp|orangutan|baboon|macaque|monkey/.test(rm));
  $('out-species-warn').innerHTML=warn?`<div class='badge b-warn'>⚠️ SPECIES EXCLUSION ALERT: Standard Lay A Weigh® is not recommended for rooting swine, large clawed felids, or edge-peeling primates.</div>`:'';
  let html='';
  if(priceMode==='full'){
    html=`
      <div class='kv'><span>Materials (${sqft} sf @ ${fmt(sc.matRate)}/sf)</span><b>${fmt(mats)}</b></div>
      <div class='kv'><span>Crew Labor (${crewHrs} hrs @ ${fmt(crewRate)}/hr, ${crew}-man)</span><b>${fmt(labor)}</b></div>
      ${perDiem?`<div class='kv'><span>Per Diem &amp; Lodging (${crew} × ${calDays}d)</span><b>${fmt(perDiem)}</b></div>`:''}
      ${(mob+logistics)?`<div class='kv'><span>Mobilization (${miles1} mi)${logistics?' + Site Fees':''}</span><b>${fmt(mob+logistics)}</b></div>`:''}
      ${equip?`<div class='kv'><span>Equipment Allocation</span><b>${fmt(equip)}</b></div>`:''}
      ${useIns?`<div class='kv'><span>Commercial Insurance (5%)</span><b>${fmt(ins)}</b></div>`:''}
      ${useRisk?`<div class='kv'><span>High-Risk Reserve (10%)</span><b>${fmt(riskRes)}</b></div>`:''}
      <div class='kv'><span>Hard Cost Subtotal</span><b>${fmt(hardTotal)}</b></div>
      <div class='kv'><span>Company Markup (${markup}%)</span><b>${fmt(profit)}</b></div>
      <div class='kv'><span>TOTAL COMMERCIAL BID</span><b style='color:#fbbf24'>${fmt(total)}</b></div>`;
  }else if(priceMode==='twopart'){
    html=`
      <div class='kv'><span>Part 1: Fixed Site Mobilization &amp; Deployment</span><b>${fmt(fixedDeploy)}</b></div>
      <div class='kv'><span>Part 2: System Application (${sqft} sf @ ${fmt(varPsf)}/sf)</span><b>${fmt(varTotal)}</b></div>
      <div class='kv'><span>Schedule Window (No Hourly Breakdown)</span><b>${calDays} Calendar Days</b></div>
      <div class='kv'><span>Warranty Included</span><b>${sc.warr}</b></div>
      <div class='kv'><span>TOTAL TURNKEY PROPOSAL</span><b style='color:#fbbf24'>${fmt(total)}</b></div>`;
  }else{
    html=stalls>0?`
      <div class='kv'><span>First Stall (Includes Mobilization &amp; Prep)</span><b>${fmt(firstStall)}</b></div>
      <div class='kv'><span>Each Additional Stall (${Math.max(0,stalls-1)} × ${fmt(addStall)})</span><b>${fmt(addStall)} / stall</b></div>
      <div class='kv'><span>Total Package (${stalls} Stalls / ${sqft} sq ft)</span><b style='color:#fbbf24'>${fmt(total)}</b></div>`:`<div style='font-size:12px;color:#94a3b8;padding:8px 0'>Open <b>Advanced Modifiers</b> above and enter a Stall Count to view per-stall menu pricing.</div>`;
  }
  $('out-breakdown').innerHTML=html;
}

function calcPO(){
  const rawSqft=Math.max(0,+$('m-sqft').value||0);
  if(!rawSqft){
    lastPO={rawSqft:0,area:0,waste:false,rows:[],tot:0};
    $('po-total-pill').textContent='$0.00';
    $('po-tbody').innerHTML=`<tr><td colspan='4' style='color:#94a3b8;text-align:center;padding:14px'>Enter square footage above to calculate 5-gal pails &amp; mats.</td></tr>`;
    return;
  }
  const waste=$('m-waste').checked, area=waste?rawSqft*1.10:rawSqft;
  const isNew=$('m-scope').value==='new', vrpCoats=+$('m-vrp').value;
  const rows=[], add=(acr,name,qty,unit,price)=>rows.push({acr,name,qty,unit,price,cost:qty*price});
  if(isNew){
    add('NVM','Non-Vulcanized 3/4″ Mats (4x6)',Math.ceil(area/24),'mats',104);
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
  $('po-tbody').innerHTML=rows.map(r=>`<tr><td><span class='acr'>${r.acr}</span>${r.name}</td><td><b>${r.qty}</b></td><td>${r.unit}</td><td>${fmt(r.cost)}</td></tr>`).join('');
}

function renderSaved(){
  const list=JSON.parse(localStorage.getItem('law_bids_v1')||'[]');
  $('saved-count').textContent=`${list.length} saved ▾`;
  if(!list.length){$('saved-list').innerHTML=`<div style='font-size:12px;color:#94a3b8'>No saved bids yet.</div>`;return;}
  $('saved-list').innerHTML=list.map((b,i)=>`<div class='saved-item'><div><b style='font-size:13px'>${b.client} — ${b.room}</b><div style='font-size:11px;color:#94a3b8'>${b.sqft} sf • ${fmt(b.total)} • ${b.scope?.warrShort||''}</div></div><div style='display:flex;gap:6px'><button onclick='loadBid(${i})'>Load</button><button onclick='delBid(${i})' style='color:#f87171'>✕</button></div></div>`).join('');
}

window.loadBid=i=>{
  const b=JSON.parse(localStorage.getItem('law_bids_v1')||'[]')[i]; if(!b) return;
  $('b-client').value=b.client; $('b-room').value=b.room; $('b-scope').value=b.scopeKey;
  $('b-sqft').value=b.sqft||''; $('b-stalls').value=b.stalls||''; $('b-crew').value=b.crew||'';
  $('b-shift').value=b.shift||12; $('b-markup').value=b.markup??30; $('b-miles').value=b.miles1||'';
  $('b-equip').value=b.equip||''; calcBid(); toast('Bid loaded');
};
window.delBid=i=>{
  const list=JSON.parse(localStorage.getItem('law_bids_v1')||'[]');
  list.splice(i,1); localStorage.setItem('law_bids_v1',JSON.stringify(list)); renderSaved();
};

$('btn-reset-bid').onclick=()=>{
  ['b-client','b-room','b-sqft','b-stalls','b-crew','b-miles','b-perdiem','b-equip'].forEach(id=>$(id).value='');
  ['b-moist','b-pw','b-night','b-phased','b-lift','b-stor','b-ins','b-risk'].forEach(id=>$(id).checked=false);
  $('b-shift').value='12'; $('b-markup').value=30; calcBid(); toast('Bid reset');
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
  renderSaved(); $('saved-bids-box').open=true; toast('Bid saved!');
};
$('btn-to-mat').onclick=()=>{
  $('m-sqft').value=$('b-sqft').value;
  const sk=$('b-scope').value;
  $('m-scope').value=(sk==='new'||sk==='ripout')?'new':'retop';
  calcPO(); switchView('mat'); toast('Loaded into Materials PO');
};
$('btn-to-docs').onclick=()=>{
  switchView('docs');
  setTimeout(()=>window.LAW_DOCS_HUB?.pullFromBid?.(),40);
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

const GUIDE_KEY='law_show_guides_v1';
function setGuides(on){
  document.body.classList.toggle('show-guides',!!on);
  $('btn-guide-toggle')?.classList.toggle('active',!!on);
  localStorage.setItem(GUIDE_KEY,on?'1':'0');
}
$('btn-guide-toggle').onclick=()=>setGuides(!document.body.classList.contains('show-guides'));
setGuides(localStorage.getItem(GUIDE_KEY)==='1');

$('cloud-pill').onclick=()=>{switchView('scan'); window.dispatchEvent(new CustomEvent('law:open-sync'));};

document.querySelectorAll('.nav button').forEach(btn=>btn.onclick=()=>switchView(btn.dataset.view));
document.querySelectorAll('.tabs-mini button').forEach(btn=>btn.onclick=()=>{
  document.querySelectorAll('.tabs-mini button').forEach(x=>x.classList.remove('active'));
  btn.classList.add('active'); priceMode=btn.dataset.mode; calcBid();
});
['b-client','b-room','b-scope','b-sqft','b-stalls','b-crew','b-shift','b-markup','b-miles','b-perdiem','b-equip','b-moist','b-pw','b-night','b-phased','b-lift','b-stor','b-ins','b-risk'].forEach(id=>$(id)?.addEventListener('input',calcBid));
['m-sqft','m-scope','m-vrp','m-waste'].forEach(id=>$(id)?.addEventListener('input',calcPO));

window.LAW={
  switchView,toast,
  loadFacilityToBid:z=>{
    $('b-client').value=z.name||''; $('b-room').value=z.species||''; $('b-sqft').value=z.sqft||'';
    calcBid(); switchView('bid'); toast('Loaded '+z.name+' into Bid Calc');
  },
  loadFacilityToDocs:z=>{
    switchView('docs');
    setTimeout(()=>window.LAW_DOCS_HUB?.loadFacility?.(z),40);
  },
  updateCloudPill:(connected,label)=>{
    const p=$('cloud-pill'); if(!p) return;
    p.textContent=connected?(label||'● Synced'):'● Offline';
    p.classList.toggle('online',!!connected);
  }
};
calcBid(); calcPO(); renderSaved();