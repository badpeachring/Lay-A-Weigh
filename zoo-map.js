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
