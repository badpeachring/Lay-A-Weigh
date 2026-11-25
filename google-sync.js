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
