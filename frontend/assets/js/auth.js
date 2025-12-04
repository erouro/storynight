import { registerUser, login } from './api.js';
import { genDeviceId, saveTempPassword, saveJwt } from './ui.js';

async function registerAndSubscribe({ name, email, password, plan, txn }){
  // register
  const device_id = genDeviceId();
  const r = await registerUser({ name, email, password, device_id });
  if (r && r.error) throw new Error(r.error);
  // save temp password for activation screen
  saveTempPassword(email, password);
  // now post subscription request
  const sub = await fetch(window.location.origin + '/api-bridge-subscribe', { // fallback if API_BASE not set in same origin - handled elsewhere
    method:'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ email, plan, txn_ref: txn, device_id })
  }).catch(()=>null);

  // we will call real backend using central api method in main.js subscribe handler
  return { ok: true, userId: r.id };
}

async function doLogin(email, password){
  const r = await login({ email, password });
  if (r && r.token){
    saveJwt(r.token);
    return r;
  }
  throw new Error(r.error || 'Login failed');
}

export { registerAndSubscribe, doLogin };