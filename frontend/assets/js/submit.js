import { API_BASE } from './config.js';
import { genDeviceId } from './ui.js';

document.addEventListener('DOMContentLoaded', ()=>{
  const form = document.getElementById('submitStoryForm');
  form.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const title = document.getElementById('stitle').value.trim();
    const content = document.getElementById('scontent').value.trim();
    const file = document.getElementById('sfile').files[0];
    const email = document.getElementById('semail').value.trim();
    const category = document.getElementById('scategory').value;
    const author = document.getElementById('sauthor').value;
    if (!title) return alert('Title required');
    if (!content && !file) return alert('Write content or upload file (max 2MB)');
    if (!email) return alert('Email required');

    // file validation
    if (file){
      const allowed = ['text/plain','application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowed.includes(file.type) && !file.name.endsWith('.txt') && !file.name.endsWith('.docx') && !file.name.endsWith('.pdf')) return alert('Invalid file type');
      if (file.size > 2*1024*1024) return alert('File too large (max 2MB)');
    }

    const fd = new FormData();
    fd.append('title', title);
    fd.append('content', content);
    fd.append('email', email);
    fd.append('selected_category', category);
    fd.append('author_name', author);
    if (file) fd.append('file', file);

    const res = await fetch(API_BASE + '/api/submit-story', { method:'POST', body: fd }).then(r=>r.json());
    if (res.error) { document.getElementById('submitResult').innerHTML = '<b style="color:red">'+res.error+'</b>'; }
    else {
      document.getElementById('submitResult').innerHTML = '<b>Thank you! Submission received. Tracking ID: '+res.tracking_id+'</b>';
      form.reset();
    }
  });
});
