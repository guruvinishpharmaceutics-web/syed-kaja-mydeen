// === 3D Cursor Follow Effect ===
const cursorDot = document.querySelector('.cursor-dot');
const cursorOutline = document.querySelector('.cursor-outline');

window.addEventListener('mousemove', e => {
  const { clientX, clientY } = e;
  cursorDot.style.transform = `translate(${clientX}px, ${clientY}px)`;
  cursorOutline.style.transform = `translate(${clientX}px, ${clientY}px)`;
});

// Add hover expansion effect on interactive items
document.querySelectorAll('a, button, .card, .project').forEach(el => {
  el.addEventListener('mouseenter', () => {
    cursorOutline.style.transform += ' scale(1.3)';
  });
  el.addEventListener('mouseleave', () => {
    cursorOutline.style.transform = cursorOutline.style.transform.replace(' scale(1.3)', '');
  });
});

// script.js - particles + 3D interactions
(() => {
  // Canvas 3D-ish particles
  const canvas = document.getElementById('bg');
  const ctx = canvas.getContext('2d');
  let w, h, dpr;
  const PARTICLE_COUNT = 160;
  const particles = [];
  let mouse = {x: null, y: null, vx:0, vy:0};

  function resize(){
    dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    w = canvas.width = innerWidth * dpr;
    h = canvas.height = innerHeight * dpr;
    canvas.style.width = innerWidth + 'px';
    canvas.style.height = innerHeight + 'px';
  }
  window.addEventListener('resize', resize);
  resize();

  function rand(min, max){ return Math.random()*(max-min)+min }

  // Particle: has x,y,z (depth), velocity, size, hue
  class Particle {
    constructor(){
      this.reset(true);
    }
    reset(init=false){
      this.z = rand(0.2, 1.8); // depth
      this.size = (1.5 + Math.random()*3.5) * this.z;
      this.x = rand(0, w);
      this.y = rand(0, h);
      const speed = 0.02 + Math.random()*0.4;
      this.vx = (Math.random()*2-1) * speed * this.z * 0.6;
      this.vy = (Math.random()*2-1) * speed * this.z * 0.6;
      this.h = rand(180, 260);
      if(!init){
        // reposition at edges for smooth loop
        if(Math.random()>0.5) this.x = Math.random()>0.5 ? -20 : w+20;
        else this.y = Math.random()>0.5 ? -20 : h+20;
      }
    }
    update(){
      // drift, with slight attraction to mouse for parallax effect
      const mx = mouse.x !== null ? mouse.x * dpr : w/2;
      const my = mouse.y !== null ? mouse.y * dpr : h/2;
      const dx = (mx - this.x) * (0.00008 * this.z);
      const dy = (my - this.y) * (0.00008 * this.z);
      this.vx += dx; this.vy += dy;
      this.x += this.vx;
      this.y += this.vy;

      // wrap edges
      if(this.x < -40 || this.x > w + 40 || this.y < -40 || this.y > h + 40){
        this.reset();
      }
    }
    draw(){
      const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size*6);
      const hue = this.h;
      grad.addColorStop(0, `hsla(${hue},90%,70%,0.9)`);
      grad.addColorStop(0.2, `hsla(${hue},85%,62%,0.5)`);
      grad.addColorStop(0.6, `hsla(${hue},70%,58%,0.12)`);
      grad.addColorStop(1, `hsla(${hue},60%,55%,0)`);
      ctx.beginPath();
      ctx.fillStyle = grad;
      ctx.arc(this.x, this.y, this.size, 0, Math.PI*2);
      ctx.fill();
    }
  }

  for(let i=0;i<PARTICLE_COUNT;i++) particles.push(new Particle());

  function animate(){
    ctx.clearRect(0,0,w,h);
    // subtle vignette/background tint
    const bgGrad = ctx.createLinearGradient(0,0,w, h);
    bgGrad.addColorStop(0, 'rgba(6,8,12,0.6)');
    bgGrad.addColorStop(1, 'rgba(3,4,7,0.4)');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0,0,w,h);

    // draw particles sorted by depth (z) for 3D overlap
    particles.sort((a,b)=> a.z - b.z);
    for(const p of particles){
      p.update();
      p.draw();
    }

    // slight connection lines between nearby particles to give depth constellations
    ctx.lineWidth = 0.8 * dpr;
    for(let i=0;i<particles.length;i++){
      for(let j=i+1;j<i+6 && j<particles.length;j++){
        const a = particles[i], b = particles[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const dist = Math.hypot(dx, dy);
        if(dist < 140 * dpr){
          ctx.strokeStyle = `rgba(120,160,255,${0.06 * (1 - dist/(140*dpr))})`;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
    }

    requestAnimationFrame(animate);
  }
  animate();

  // mouse tracking for parallax
  window.addEventListener('mousemove', (e)=>{
    mouse.x = e.clientX; mouse.y = e.clientY;
  });
  window.addEventListener('mouseleave', ()=>{ mouse.x = null; mouse.y = null });

  // card tilt interactions for .tilt elements
  function attach3DTilt(el, options={max:10, scale:1.02}){
    el.style.transformStyle = 'preserve-3d';
    el.addEventListener('mousemove', (ev)=>{
      const r = el.getBoundingClientRect();
      const x = (ev.clientX - r.left) / r.width - 0.5;
      const y = (ev.clientY - r.top) / r.height - 0.5;
      const rx = (-y * options.max).toFixed(2);
      const ry = (x * options.max).toFixed(2);
      el.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) scale(${options.scale})`;
    });
    el.addEventListener('mouseleave', ()=>{
      el.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg) scale(1)';
    });
  }
  document.querySelectorAll('.tilt').forEach(el => attach3DTilt(el));

  // hero card tilt
  const heroCard = document.getElementById('heroCard');
  attach3DTilt(heroCard, {max:9, scale:1.01});

  // image upload for profile
  const input = document.getElementById('imgInput');
  const img = document.getElementById('profileImg');
  input.addEventListener('change', (e)=>{
    const f = e.target.files[0]; if(!f) return;
    const reader = new FileReader();
    reader.onload = ev => { img.src = ev.target.result; };
    reader.readAsDataURL(f);
  });

  // small entrance animation for hero elements
  window.addEventListener('load', ()=>{
    const card = document.getElementById('heroCard');
    card.animate([{opacity:0, transform:'translateY(18px) scale(.98)'}, {opacity:1, transform:'translateY(0px) scale(1)'}], {duration:700, easing:'cubic-bezier(.2,.9,.2,1)'});
    document.getElementById('year').textContent = new Date().getFullYear();
  });

})();
// Contact form submit
const contactForm = document.getElementById('contactForm');
contactForm.addEventListener('submit', (e)=>{
  e.preventDefault();
  // simple thank-you animation
  const btn = contactForm.querySelector('button');
  btn.textContent = "Sent ✅";
  btn.style.background = "linear-gradient(90deg,#5ee1ff,#8a5bff)";
  setTimeout(()=>{
    btn.textContent = "Send Message";
    btn.style.background = "";
    contactForm.reset();
  },2000);
});

// Add tilt effect to new contact/map cards
document.querySelectorAll('.contact-card, .map-card').forEach(el=>{
  attach3DTilt(el, {max:8, scale:1.02});
});
// Apply tilt effect to new About section cards
document.querySelectorAll('.about-text, .about-image, .skill-card, .stat-card').forEach(el=>{
  attach3DTilt(el, {max:8, scale:1.02});
});


