// script.js
// Multi-step, validation, cursor follower, parallax, confetti, Google Sheets integration

document.addEventListener('DOMContentLoaded', () => {
  const steps = Array.from(document.querySelectorAll('.step'));
  const nextBtns = document.querySelectorAll('.next');
  const prevBtns = document.querySelectorAll('.prev');
  const progress = document.getElementById('progressBar');
  const form = document.getElementById('leadForm');
  const confettiRoot = document.getElementById('confetti-root');
  const successModal = document.getElementById('successModal');
  const modalClose = document.getElementById('modalClose');
  const cursorFollower = document.getElementById('cursor-follower');
  let curStep = 0;

  // Google Apps Script Web App URL (replace with yours)
  const scriptURL = "https://script.google.com/macros/s/AKfycbzAtV6pqAm4tK_2-wGsTWaFJ6V30RBhGxEdpGcTe_Mp2EvPId3nkZxFVk4IheNwH_pe/exec";

  // update progress bar
  function updateProgress() {
    const pct = ((curStep) / (steps.length - 1)) * 100;
    progress.style.width = pct + '%';
    steps.forEach((s, i) => s.classList.toggle('active', i === curStep));
  }
  updateProgress();

  // step navigation
  nextBtns.forEach(btn => btn.addEventListener('click', () => {
    // example: basic validation before next step
    if (curStep === 0) {
      const name = document.getElementById('fullName');
      if (!name.value.trim()) { shake(name); name.focus(); return; }
    }
    if (curStep < steps.length - 1) curStep++;
    updateProgress();
  }));

  prevBtns.forEach(btn => btn.addEventListener('click', () => {
    if (curStep > 0) curStep--;
    updateProgress();
  }));

  function shake(el) {
    el.style.transition = 'transform .12s';
    el.style.transform = 'translateX(-8px)';
    setTimeout(()=> el.style.transform = 'translateX(8px)', 120);
    setTimeout(()=> el.style.transform = '', 240);
  }

  // form submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('fullName');
    const contact = document.getElementById('contactDetails');
    const contactMethod = Array.from(document.querySelectorAll('input[name="contactMethod"]')).some(r=>r.checked);
    const services = Array.from(document.querySelectorAll('input[name="services"]:checked'));

    // required validation
    if (!name.value.trim()) { shake(name); curStep = 0; updateProgress(); name.focus(); return; }
    if (!services.length) { curStep = 1; updateProgress(); document.getElementById('servicesGrid').scrollIntoView({behavior:'smooth', block:'center'}); return; }
    if (!contactMethod) { curStep = 1; updateProgress(); return; }
    if (!contact.value.trim()) { shake(contact); curStep = 1; updateProgress(); contact.focus(); return; }

    const payload = {
      fullName: document.getElementById('fullName').value,
      businessName: document.getElementById('businessName').value,
      businessType: document.getElementById('businessType').value,
      social: document.getElementById('social').value,
      services: Array.from(document.querySelectorAll('input[name="services"]:checked')).map(s => s.value).join(', '),
      contactMethod: Array.from(document.querySelectorAll('input[name="contactMethod"]')).find(r => r.checked).value,
      contactDetails: document.getElementById('contactDetails').value,
      additionalInfo: document.getElementById('additionalInfo').value,
      hearAbout: document.getElementById('hearAbout').value
    };

    // send to Google Sheets
    try {
      const response = await fetch(scriptURL, {
        method: 'POST',
        body: new URLSearchParams(payload)
      });
      const data = await response.json();
      if (data.status !== "success") throw new Error(data.message || "Unknown error");
    } catch(err) {
      console.error(err);
      alert("Form submission failed: " + err.message);
      return;
    }

    // optional: store locally
    try {
      const existing = JSON.parse(localStorage.getItem('pensivePixelsSubmissions') || '[]');
      existing.push(payload);
      localStorage.setItem('pensivePixelsSubmissions', JSON.stringify(existing));
    } catch(err){}

    // show success modal & confetti
    celebrateConfetti();
    showModal();

    // auto-hide modal after 6s
    setTimeout(() => {
      successModal.classList.remove('show');
      successModal.setAttribute('aria-hidden','true');
    }, 6000);

    form.reset();
    curStep = 0;
    updateProgress();
  });

  // modal controls
  function showModal() {
    successModal.classList.add('show');
    successModal.setAttribute('aria-hidden','false');
  }
  modalClose.addEventListener('click', () => {
    successModal.classList.remove('show');
    successModal.setAttribute('aria-hidden','true');
  });

  // mouse parallax & cursor follower
  const orbs = document.querySelectorAll('.orb');
  document.addEventListener('mousemove', (ev) => {
    const x = ev.clientX;
    const y = ev.clientY;
    cursorFollower.style.left = x + 'px';
    cursorFollower.style.top = y + 'px';
    orbs.forEach((o,i)=>{
      const intensity = (i===0)?0.02:-0.018;
      const tx = (x - window.innerWidth/2) * intensity;
      const ty = (y - window.innerHeight/2) * intensity;
      o.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
    });
  });

  // confetti generator
  function celebrateConfetti() {
    const count = 80;
    const colors = ['#ffd166','#06d6a0','#ef476f','#118ab2','#a084ff'];
    for (let i=0;i<count;i++){
      const el = document.createElement('div');
      el.className = 'confetti';
      el.style.position = 'fixed';
      el.style.left = (50 + (Math.random()*40-20)) + '%';
      el.style.top = '-10%';
      el.style.width = (6 + Math.random()*8) + 'px';
      el.style.height = (10 + Math.random()*14) + 'px';
      el.style.background = colors[Math.floor(Math.random()*colors.length)];
      el.style.transform = `rotate(${Math.random()*360}deg)`;
      el.style.zIndex = 99999;
      el.style.opacity = 0.95;
      confettiRoot.appendChild(el);

      const fallDuration = 4500 + Math.random()*1500;
      const endX = (Math.random()*200 - 100);
      el.animate([
        { transform: `translate3d(0,0,0) rotate(${Math.random()*360}deg)`, opacity:1 },
        { transform: `translate3d(${endX}px, ${window.innerHeight + 200}px,0) rotate(${Math.random()*720}deg)`, opacity:0.9 }
      ], { duration: fallDuration, easing: 'cubic-bezier(.2,.8,.2,1)' });

      setTimeout(()=> el.remove(), fallDuration + 500);
    }
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      successModal.classList.remove('show');
      successModal.setAttribute('aria-hidden','true');
    }
  });

  // admin quick debug
  window._pp_get_leads = ()=> JSON.parse(localStorage.getItem('pensivePixelsSubmissions') || '[]');
});


