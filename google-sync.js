(()=>{
  const ALLOWED='thebespokerenewal@gmail.com';
  const DEFAULT_CID='744394455846-q20ai91erndhf77ukrjr04530ergmh5r.apps.googleusercontent.com';
  const CID_KEY='law_google_cid_v1';
  const MAIL_KEY='law_mail_mode_v1';
  const SESS_KEY='law_google_sess_v2';
  const DB_FILE='lay-a-weigh-db.json';
  const KEYS=['law_bids_v1','law_zoos_v1','law_scans_v1','law_diags_v1'];
  const Q=String.fromCharCode(34);
  let token='', userEmail='', expiresAt=0;

  const getMailMode=()=>localStorage.getItem(MAIL_KEY)||'draft_only';
  const setMailMode=m=>localStorage.setItem(MAIL_KEY,m);
  const cleanCid=s=>String(s||'').replace(/\s+/g,'').trim();

  function minsLeft(){return Math.max(0,Math.round((expiresAt-Date.now())/60000));}
  function isValidSession(){return !!(token && userEmail && expiresAt>Date.now());}

  function saveSession(tk,em,expSec,mode){
    token=tk; userEmail=em;
    expiresAt=Date.now()+Math.max(300,(Number(expSec)||3500)-60)*1000;
    localStorage.setItem(SESS_KEY,JSON.stringify({token,userEmail,expiresAt,mailMode:mode}));
    syncChrome();
  }
  function clearSession(){
    token=''; userEmail=''; expiresAt=0;
    localStorage.removeItem(SESS_KEY);
    syncChrome();
  }
  function restoreSession(){
    try{
      const s=JSON.parse(localStorage.getItem(SESS_KEY)||'null');
      if(s && s.token && (s.userEmail||'').toLowerCase()===ALLOWED && s.expiresAt>Date.now()){
        token=s.token; userEmail=s.userEmail; expiresAt=s.expiresAt;
        return true;
      }
      if(s) localStorage.removeItem(SESS_KEY);
    }catch{}
    return false;
  }

  function syncChrome(){
    const ok=isValidSession();
    window.LAW?.updateCloudPill?.(ok, ok?`● Synced (${minsLeft()}m)`:'● Offline');
    setStatus(ok?`CONNECTED: ${userEmail} (${minsLeft()}m left • ${getMailMode()==='off'?'Drive Only':'Drafts Safe'})`:'Not connected (working offline)',ok);
  }

  function loadGis(){
    return new Promise((res,rej)=>{
      if(window.google?.accounts?.oauth2) return res();
      const s=document.createElement('script');
      s.src='https://accounts.google.com/gsi/client';
      s.onload=res; s.onerror=()=>rej(new Error('Google Sign-In script failed'));
      document.head.appendChild(s);
    });
  }

  function setStatus(msg,ok=false){
    const el=document.getElementById('gs-status');
    if(el){el.textContent=msg; el.style.color=ok?'#34d399':'#fbbf24';}
  }

  async function connect(silent=false){
    const rawInput=document.getElementById('gs-cid')?.value;
    const cid=cleanCid(rawInput||localStorage.getItem(CID_KEY)||DEFAULT_CID);
    if(!cid) return window.LAW.toast('Paste Google OAuth Client ID in Advanced Setup');
    localStorage.setItem(CID_KEY,cid);
    if(document.getElementById('gs-cid')) document.getElementById('gs-cid').value=cid;
    const mode=getMailMode();
    const scope=mode==='off'
      ?'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/drive.file'
      :'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/gmail.compose';
    if(!silent) setStatus('Opening Google sign-in...');
    try{await loadGis();}catch(e){setStatus(e.message); return;}
    const client=google.accounts.oauth2.initTokenClient({
      client_id:cid,
      hint:ALLOWED,
      scope,
      callback:async resp=>{
        if(resp.error){
          if(!silent) setStatus('Auth error: '+resp.error);
          return;
        }
        try{
          const r=await fetch('https://www.googleapis.com/oauth2/v3/userinfo',{headers:{Authorization:'Bearer '+resp.access_token}});
          const info=await r.json();
          if((info.email||'').toLowerCase()!==ALLOWED){
            clearSession();
            setStatus('BLOCKED: Sign in ONLY with '+ALLOWED);
            alert('Access restricted strictly to '+ALLOWED+'. You signed in as '+(info.email||'unknown')+'.');
            return;
          }
          saveSession(resp.access_token,info.email,resp.expires_in,mode);
          if(!silent) window.LAW.toast('Signed in — stays active across refreshes!');
        }catch{setStatus('Could not verify Google account');}
      }
    });
    client.requestAccessToken({prompt:silent?'none':''});
  }

  function disconnect(){
    if(token && window.google?.accounts?.oauth2){
      try{google.accounts.oauth2.revoke(token,()=>{});}catch{}
    }
    clearSession();
    window.LAW.toast('Google session signed out');
  }

  async function authFetch(url,opts={}){
    if(!isValidSession()) return null;
    const r=await fetch(url,{...opts,headers:{...(opts.headers||{}),Authorization:'Bearer '+token}});
    if(r.status===401){
      clearSession();
      window.LAW.toast('Google session expired — tap Sign In Google');
      return null;
    }
    return r;
  }

  async function findDbId(){
    const q=encodeURIComponent(`name='${DB_FILE}' and trashed=false`);
    const r=await authFetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,modifiedTime)`);
    if(!r) return '';
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
    if(!isValidSession()) return window.LAW.toast('Tap Sign In Google first');
    setStatus('Uploading database to Drive...');
    const body=JSON.stringify(packDb(),null,2);
    const id=await findDbId();
    let r;
    if(id){
      r=await authFetch(`https://www.googleapis.com/upload/drive/v3/files/${id}?uploadType=media`,{
        method:'PATCH',headers:{'Content-Type':'application/json'},body
      });
    }else{
      const b='law_drv_'+Date.now();
      const meta=JSON.stringify({name:DB_FILE,mimeType:'application/json'});
      const mp=`--${b}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${meta}\r\n--${b}\r\nContent-Type: application/json\r\n\r\n${body}\r\n--${b}--`;
      r=await authFetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',{
        method:'POST',headers:{'Content-Type':`multipart/related; boundary=${b}`},body:mp
      });
    }
    if(!r) return;
    setStatus(r.ok?'Synced to Drive ('+new Date().toLocaleTimeString()+')':'Drive upload failed ('+r.status+')',r.ok);
    if(r.ok) window.LAW.toast('Cloud backup pushed!');
  }

  async function pullDrive(){
    if(!isValidSession()) return window.LAW.toast('Tap Sign In Google first');
    setStatus('Pulling latest database from Drive...');
    const id=await findDbId();
    if(!id){setStatus('No Drive backup found yet — Push first.'); return;}
    const r=await authFetch(`https://www.googleapis.com/drive/v3/files/${id}?alt=media`);
    if(!r) return;
    const obj=await r.json();
    if(unpackDb(obj)){setStatus('Pulled & restored! Reloading...',true); setTimeout(()=>location.reload(),700);}
  }

  async function createGmailDraft(to,subj,textBody,pdfs){
    if(!isValidSession()) return false;
    if(getMailMode()==='off'){
      alert('EMAIL SAFETY LOCK IS ON (Drive Only).\n\nOpen Tools > Cloud Sync > Advanced Setup and switch to Drafts Only to attach PDFs to Gmail.');
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
    let raw=`To: ${to}\r\nSubject: ${subj}\r\nMIME-Version: 1.0\r\nContent-Type: multipart/mixed; boundary=${Q}${b}${Q}\r\n\r\n`;
    raw+=`--${b}\r\nContent-Type: text/plain; charset=${Q}UTF-8${Q}\r\n\r\n${textBody}\r\n\r\n`;
    (pdfs||[]).forEach(p=>{
      raw+=`--${b}\r\nContent-Type: application/pdf; name=${Q}${p.filename}${Q}\r\nContent-Disposition: attachment; filename=${Q}${p.filename}${Q}\r\nContent-Transfer-Encoding: base64\r\n\r\n${p.base64}\r\n\r\n`;
    });
    raw+=`--${b}--`;
    const b64=btoa(unescape(encodeURIComponent(raw))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
    const r=await authFetch('https://gmail.googleapis.com/gmail/v1/users/me/drafts',{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({message:{raw:b64}})
    });
    if(!r||!r.ok){window.LAW.toast('Gmail draft error — reconnect in Drafts Only mode'); return false;}
    window.open('https://mail.google.com/mail/u/0/#drafts','_blank');
    return true;
  }

  function renderSync(){
    const host=document.getElementById('sync-panel'); if(!host) return;
    const cid=cleanCid(localStorage.getItem(CID_KEY)||DEFAULT_CID);
    const mode=getMailMode();
    const ok=isValidSession();
    host.innerHTML=`
      <div class='guide-box'>
        <b>Cloud Sync Guide:</b> Sign in once with <b>${ALLOWED}</b>. Your session stays active across page refreshes (for ~1 hour per Google security policy). Use <b>Push to Drive</b> after major edits and <b>Pull from Drive</b> on another device.
      </div>
      <div class='card'>
        <div class='card-h'><div class='card-title'>Google Drive &amp; Gmail Sync</div><span class='pill'>${ALLOWED}</span></div>
        <div id='gs-status' style='font-size:12px;font-weight:700;color:${ok?'#34d399':'#fbbf24'};margin-bottom:10px'>${ok?`CONNECTED: ${userEmail} (${minsLeft()}m left)`:'Not connected (working offline)'}</div>
        <div class='btn-row'>
          <button type='button' class='btn primary' id='gs-conn'><b>${ok?'Refresh Session':'Sign In Google'}</b><small>Only ${ALLOWED}</small></button>
          <button type='button' class='btn green' id='gs-push'><b>Push to Drive</b><small>Save live database</small></button>
        </div>
        <div class='btn-row'>
          <button type='button' class='btn' id='gs-pull'><b>Pull from Drive</b><small>Load latest cloud edits</small></button>
          <button type='button' class='btn' id='gs-disc' style='border-color:#ef4444'><b style='color:#f87171'>Sign Out</b><small>Clear active session</small></button>
        </div>
        <details class='adv-box'>
          <summary><span>⚙️ Advanced Setup, Email Lock &amp; Offline Backup</span><span class='pill'>Options</span></summary>
          <div class='adv-body'>
            <label>Email Safety Lock</label>
            <select id='gs-mail-mode' style='margin-bottom:8px'>
              <option value='draft_only' ${mode==='draft_only'?'selected':''}>🔒 Drafts Only — Requires Confirm Popup (Never Auto-Sends)</option>
              <option value='off' ${mode==='off'?'selected':''}>🛑 Email OFF — Drive Sync Only</option>
            </select>
            <div style='display:flex;justify-content:space-between;align-items:center'><label style='margin:0'>Google OAuth Client ID</label><button type='button' class='btn-sm' id='gs-reset-cid' style='font-size:10px;padding:3px 7px'>Reset Default</button></div>
            <input id='gs-cid' value='${cid}' style='margin-top:4px;font-size:12px' placeholder='xxxxx.apps.googleusercontent.com'>
            <div class='btn-row'>
              <button type='button' class='btn' id='gs-export'><b>Export JSON File</b><small>Offline backup</small></button>
              <div style='padding:4px 0'><label style='margin-bottom:2px'>Restore JSON</label><input type='file' id='gs-import' accept='.json' style='padding:6px;font-size:11px'></div>
            </div>
          </div>
        </details>
      </div>`;
    document.getElementById('gs-mail-mode').onchange=e=>{
      setMailMode(e.target.value);
      if(isValidSession()) disconnect();
      window.LAW.toast(e.target.value==='off'?'Email OFF — Drive only mode':'Drafts Only safeguard active');
    };
    document.getElementById('gs-reset-cid').onclick=()=>{
      localStorage.setItem(CID_KEY,DEFAULT_CID);
      document.getElementById('gs-cid').value=DEFAULT_CID;
      window.LAW.toast('Reset OAuth Client ID to default');
    };
    document.getElementById('gs-conn').onclick=()=>connect(false);
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

  restoreSession();
  syncChrome();
  setInterval(()=>{if(token && expiresAt<=Date.now()) clearSession(); else if(token) syncChrome();},30000);

  window.LAW_CLOUD={isConnected:isValidSession,createGmailDraft,connect};
  window.addEventListener('law:sync-mount',renderSync);
  renderSync();
})();