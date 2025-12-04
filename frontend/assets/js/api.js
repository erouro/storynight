import { API_BASE } from './config.js';

// wrapper
async function req(path, opts={}){
  const headers = opts.headers || {};
  headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  opts.headers = headers;
  const url = API_BASE + path;
  const res = await fetch(url, opts);
  const text = await res.text();
  try { return JSON.parse(text); } catch(e){ return text; }
}

async function getCategories(){ return req('/api/categories'); }
async function getStories(q=''){ return req('/api/stories'+(q?('?q='+encodeURIComponent(q)):'')); }
async function getStory(id){ return req('/api/stories/'+id); }
async function registerUser(data){ return req('/api/auth/register', { method:'POST', body: JSON.stringify(data) }); }
async function login(data){ return req('/api/auth/login', { method:'POST', body: JSON.stringify(data) }); }
async function postSubscribe(data){ return req('/api/subscribers', { method:'POST', body: JSON.stringify(data) }); }
async function postDonate(data){ return req('/api/donations', { method:'POST', body: JSON.stringify(data) }); }
async function postContact(data){ return req('/api/contact', { method:'POST', body: JSON.stringify(data) }); }
async function postSubmitStory(formData){ // multipart
  const url = API_BASE + '/api/submit-story';
  const r = await fetch(url, { method:'POST', body: formData });
  return r.json();
}
export { API_BASE, req, getCategories, getStories, getStory, registerUser, login, postSubscribe, postDonate, postContact, postSubmitStory };