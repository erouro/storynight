// small UI helpers used across pages
function genDeviceId(){
  let d = localStorage.getItem('device_id');
  if (!d){
    d = (crypto && crypto.randomUUID) ? crypto.randomUUID() : 'd-'+Date.now()+'-'+Math.random().toString(36).slice(2,8);
    localStorage.setItem('device_id', d);
  }
  return d;
}
function showDrawer(open){
  const drawer = document.getElementById('drawer');
  if (!drawer) return;
  if (open){ drawer.classList.add('open'); const b = document.createElement('div'); b.className='backdrop'; b.id='backdrop'; b.onclick=()=>showDrawer(false); document.body.appendChild(b); }
  else { drawer.classList.remove('open'); const b = document.getElementById('backdrop'); if (b) b.remove(); }
}
function saveJwt(token){ localStorage.setItem('jwt', token); }
function readJwt(){ return localStorage.getItem('jwt'); }
function saveTempPassword(email, password){
  // keep until first successful login/activation view.
  sessionStorage.setItem('temp_pw_'+email, password);
}
function popTempPassword(email){ const p = sessionStorage.getItem('temp_pw_'+email); sessionStorage.removeItem('temp_pw_'+email); return p; }

export { genDeviceId, showDrawer, saveJwt, readJwt, saveTempPassword, popTempPassword };