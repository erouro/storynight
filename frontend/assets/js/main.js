import { API_BASE, getCategories, getStories, getStory, postDonate, postContact, postSubmitStory } from './api.js';
import { genDeviceId, showDrawer, saveTempPassword, popTempPassword, saveJwt, readJwt } from './ui.js';
import { doLogin, registerAndSubscribe } from './auth.js';

// basic init common to all pages
document.addEventListener('DOMContentLoaded', async ()=>{
  document.getElementById('menuBtn')?.addEventListener('click', ()=>showDrawer(true));
  document.getElementById('closeDrawer')?.addEventListener('click', ()=>showDrawer(false));
  // attach categories on header
  const cats = await getCategories().catch(()=>[]);
  const catBar = document.getElementById('categoryBar');
  if (catBar && cats.length){
    catBar.innerHTML = cats.map(c=>`<a class="chip" href="category.html?name=${encodeURIComponent(c.name)}">${c.name}</a>`).join(' ');
    const sc = document.getElementById('scategory');
    if (sc) sc.innerHTML = '<option value="">— Select Category —</option>'+cats.map(c=>`<option value="${c.name}">${c.name}</option>`).join('');
  }

  // device id ensure
  genDeviceId();

  // page-specific
  const path = location.pathname.split('/').pop();
  if (path === 'index.html' || path === '' ) await loadHome();
  if (path === 'story.html') await loadStory();
  if (path === 'category.html') await loadCategory();
  if (path === 'archive.html') await loadArchive();
  if (path === 'writers.html') await loadWriters();
  if (path === 'donate.html') initDonate();
  if (path === 'contact.html') initContact();
  if (path === 'subscribe.html') initSubscribe();
  if (path === 'submit-story.html') initSubmit();
  if (path === 'admin.html') initAdminLogin();

  // drawer for links
  document.querySelectorAll('.drawer nav a').forEach(a=>{
    a.addEventListener('click', ()=>showDrawer(false));
  });

  // scroll up
  document.getElementById('scrollUp')?.addEventListener('click', ()=>window.scrollTo({top:0,behavior:'smooth'}));
});

// --- Home
async function loadHome(){
  const data = await getStories().catch(()=>({data:[]}));
  const list = document.getElementById('list');
  if (!list) return;
  const items = data.data || data;
  list.innerHTML = items.map(s=>renderStoryCard(s)).join('');
  // attach click handlers
  document.querySelectorAll('.story-card').forEach(el=>{
    el.addEventListener('click', ()=>{ const id = el.dataset.id; location.href = 'story.html?id='+id; });
  });
}
function renderStoryCard(s){
  const cats = (s.categories || s.category || []).slice(0,3).map(c=>`<span class="chip">${c}</span>`).join(' ');
  const thumb = s.thumbnail_url || ('https://picsum.photos/seed/'+(s.id||Math.random())+'/600/400');
  return `<article class="story-card" data-id="${s.id}">
    <div class="thumb-wrap"><img class="thumb" src="${thumb}"></div>
    <div class="story-body">
      <h3 class="story-title">${escapeHtml(s.title)}</h3>
      <p class="story-excerpt">${escapeHtml(s.preview || s.excerpt || '')}</p>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px"><div>${cats}</div>${s.is_premium?'<span class="premium-badge">Premium</span>':''}</div>
    </div>
  </article>`;
}

// --- Story page
async function loadStory(){
  const id = new URLSearchParams(location.search).get('id');
  if (!id) return;
  const st = await getStory(id).catch(()=>null);
  if (!st) { document.getElementById('storyArea').innerHTML = '<div class="card">Not found</div>'; return; }
  document.getElementById('storyTitle').textContent = st.title;
  document.getElementById('storyThumb').src = st.thumbnail_url || '';
  if (st.thumbnail_url) document.getElementById('storyThumb').style.display='block';
  // preview logic: if story.is_premium and not subscribed -> show 10% preview
  const isPremium = st.is_premium == 1 || st.is_premium === true;
  if (isPremium && !await checkActive()){ // checkActive calls /api/subscribers/check
    const n = Math.max(50, Math.floor((st.content||st.excerpt||'').length * 0.10));
    document.getElementById('storyContent').textContent = (st.content || st.excerpt || '').slice(0,n) + '\n\n[Preview — Subscribe to read full story]';
  } else {
    document.getElementById('storyContent').textContent = st.content || st.excerpt || '';
  }
  // bookmark handler
  document.getElementById('bookmarkBtn').addEventListener('click', ()=>bookmarkAction(id));

  // PDF button
  document.getElementById('pdfBtn').addEventListener('click', async ()=>{
    const token = localStorage.getItem('jwt');
    if (!token) return alert('Login & subscription required to download PDF');
    // open pdf endpoint
    window.open(API_BASE + '/api/pdf/story/' + id + '?token=' + encodeURIComponent(token), '_blank');
  });

  // reading progress: save periodically
  let lastPercent = 0;
  window.addEventListener('scroll', throttle(async ()=>{
    const el = document.documentElement;
    const total = el.scrollHeight - el.clientHeight;
    const percent = total>0 ? Math.round((el.scrollTop/total)*100) : 0;
    if (Math.abs(percent - lastPercent) >= 5){
      lastPercent = percent;
      const token = localStorage.getItem('jwt');
      if (token){
        await fetch(API_BASE + '/api/progress/update', { method:'PATCH', headers:{'Authorization':'Bearer '+token,'Content-Type':'application/json'}, body: JSON.stringify({ story_id: id, percent, position: el.scrollTop }) });
      }
      document.getElementById('progressBar').style.width = percent + '%';
    }
  }, 1000));
}

// --- Category page
async function loadCategory(){
  const name = new URLSearchParams(location.search).get('name');
  const res = await getStories(name ? '?category='+encodeURIComponent(name) : '');
  const list = document.getElementById('categories') || document.getElementById('list');
  if (list && res.data){
    list.innerHTML = (res.data || res).map(s=>renderStoryCard(s)).join('');
  }
}

// --- Archive
async function loadArchive(){
  const res = await getStories();
  const arr = res.data || res;
  const out = arr.map(s=>`<div class="card"><a href="story.html?id=${s.id}">${escapeHtml(s.title)}</a><div style="font-size:13px;color:#777">${new Date(s.created_at||Date.now()).toLocaleDateString()}</div></div>`).join('');
  document.getElementById('archiveList').innerHTML = out;
}

// --- Writers
async function loadWriters(){
  const r = await fetch(API_BASE + '/api/writers').then(t=>t.json()).catch(()=>[]);
  document.getElementById('writersList').innerHTML = r.map(w=>`<div class="card"><h3>${w.name}</h3><p>${w.bio||''}</p><a href="writers.html?id=${w.id}">View stories</a></div>`).join('');
}

// --- Donate
function initDonate(){
  document.getElementById('upiId').textContent = 'Set your UPI in config';
  document.querySelectorAll('.donate-amt').forEach(b=>{
    b.addEventListener('click', ()=>{ document.getElementById('donTxn').value = ''; document.getElementById('donName').value = ''; document.getElementById('donateMsg').innerHTML = 'Scan & pay using UPI then press "I have donated".' });
  });
  document.getElementById('donateSubmit').addEventListener('click', async ()=>{
    const name = document.getElementById('donName').value || 'Anonymous';
    const txn = document.getElementById('donTxn').value || null;
    const amount = document.querySelector('.donate-amt.active')?.dataset?.amt || null;
    await postDonate({ name, amount: amount||0, txn_ref: txn, message: null });
    document.getElementById('donateMsg').innerHTML = '<b>Thank you! Your generous support means a lot to us.</b>';
  });
}

// --- Contact
function initContact(){
  document.getElementById('contactForm').addEventListener('submit', async (e)=>{
    e.preventDefault();
    const name = document.getElementById('cname').value.trim();
    const email = document.getElementById('cemail').value.trim();
    const message = document.getElementById('cmessage').value.trim();
    if (!name || !email || !message) return alert('All fields required');
    await postContact({ name, email, message });
    document.getElementById('contactResult').innerHTML = '<b>Thank you! We received your message and will contact you soon.</b>';
  });
}

// --- Subscribe (register + post subscribe)
function initSubscribe(){
  document.getElementById('subscribeForm').addEventListener('submit', async (e)=>{
    e.preventDefault();
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const plan = document.getElementById('plan').value;
    const txn = document.getElementById('txn').value.trim();
    if (!name||!email||!password||!plan||!txn) return alert('All fields required');
    // register user then call /api/subscribers
    const reg = await fetch(API_BASE + '/api/auth/register', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ name, email, password, device_id: genDeviceId() }) }).then(r=>r.json());
    if (reg.error) return alert('Register error: '+reg.error);
    // store temp password for activation view
    sessionStorage.setItem('temp_pw_'+email, password);
    const sub = await fetch(API_BASE + '/api/subscribers', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email, plan, txn_ref: txn, device_id: genDeviceId() })}).then(r=>r.json());
    if (sub.error) return alert('Subscribe error: '+sub.error);
    document.getElementById('subscribeResult').innerHTML = '<b>Subscription request received. Admin will verify. Please login after verification to see activation message.</b>';
  });
}

// --- Submit story init (handled in submit.js)
function initSubmit(){ /* nothing here; submit.js handles it */ }

// --- Admin login shell (basic)
function initAdminLogin(){
  // handled by admin.js
}

// small helpers
function escapeHtml(s=''){ return (s+'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'); }
function throttle(fn, delay){ let t=0; return (...a)=>{ const now=Date.now(); if (now - t > delay){ t = now; fn(...a); } } }
async function checkActive(){ const device = genDeviceId(); const r = await fetch(API_BASE + '/api/subscribers/check?device_id='+encodeURIComponent(device)).then(r=>r.json()).catch(()=>({active:false})); return r.active; }
async function bookmarkAction(storyId){
  const token = localStorage.getItem('jwt');
  if (!token) return alert('Login required to bookmark');
  await fetch(API_BASE + '/api/bookmarks/'+storyId, { method:'POST', headers:{'Authorization':'Bearer '+token} }).then(r=>r.json());
  alert('Bookmarked');
}
export {}; // module