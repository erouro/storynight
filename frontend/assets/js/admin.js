import { API_BASE } from './config.js';
import { saveJwt } from './ui.js';

document.addEventListener('DOMContentLoaded', ()=>{
  document.getElementById('adminLoginBtn')?.addEventListener('click', async ()=>{
    const email = document.getElementById('adminEmail').value;
    const pass = document.getElementById('adminPass').value;
    if (!email||!pass) return alert('Enter credentials');
    const r = await fetch(API_BASE + '/api/auth/login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email, password: pass })}).then(t=>t.json());
    if (r.token){
      saveJwt(r.token);
      document.getElementById('adminLoginCard').style.display='none';
      document.getElementById('adminShell').style.display='block';
      loadAdminTab('stories');
    } else {
      document.getElementById('adminMsg').textContent = r.error || 'Login failed';
    }
  });

  document.querySelectorAll('#adminShell nav button').forEach(b=>{
    b.addEventListener('click', ()=>loadAdminTab(b.dataset.tab));
  });
});

async function loadAdminTab(tab){
  const token = localStorage.getItem('jwt');
  const hdr = { 'Authorization': 'Bearer '+token };
  const c = document.getElementById('adminContent');
  c.innerHTML = 'Loading...';
  if (tab==='subscribers'){
    const rows = await fetch(API_BASE + '/api/admin/subscribers', { headers: hdr }).then(r=>r.json());
    c.innerHTML = rows.map(r=>`<div class="card"><b>${r.name||r.email}</b><div>${r.plan} — ${r.status}</div><button data-id="${r.id}" class="btn verify">Verify</button></div>`).join('');
    c.querySelectorAll('.verify').forEach(btn=>btn.addEventListener('click', async ()=>{
      const id = btn.dataset.id;
      await fetch(API_BASE + '/api/admin/subscribers/verify/'+id, { method:'POST', headers: hdr, body: JSON.stringify({ device_id: r.device_id||null })}).then(r=>r.json());
      loadAdminTab('subscribers');
    }));
  } else if (tab==='submissions'){
    const rows = await fetch(API_BASE + '/api/admin/submissions', { headers: hdr }).then(r=>r.json());
    c.innerHTML = rows.map(s=>`<div class="card"><b>${s.title}</b><div>ID:${s.tracking_id}</div><button data-id="${s.id}" class="btn approve">Approve</button></div>`).join('');
    c.querySelectorAll('.approve').forEach(btn=>btn.addEventListener('click', async ()=>{ await fetch(API_BASE + '/api/admin/submissions/approve/'+btn.dataset.id, { method:'POST', headers: hdr }).then(r=>r.json()); loadAdminTab('submissions'); }));
  } else {
    c.innerHTML = 'Not implemented in UI yet.';
  }
}
