/* ==========================================================================
   Shree Vaibhav Mahal — shared behaviour for every route
   ========================================================================== */

/* ---- SWAP BEFORE SENDING: your own details in the footer ---- */
const DESIGNER = {
  name : "Beni · PdktDev",
  phone: "+91 XXXXX XXXXX",      // e.g. "+91 98450 12345"
  tel  : "+91XXXXXXXXXX",        // digits only, e.g. "+919845012345"
  email: "beniel.herlin@gmail.com"
};
/* Business WhatsApp — used as the fallback if /api/enquiry is unreachable */
const BUSINESS_WA = "919876543210";

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- footer designer block ---------- */
(function designer(){
  const n=document.getElementById('d-name'), p=document.getElementById('d-phone'),
        m=document.getElementById('d-mail'), w=document.getElementById('d-wa');
  if(!n) return;
  n.textContent=DESIGNER.name;
  p.textContent=DESIGNER.phone; p.href='tel:'+DESIGNER.tel.replace(/\s/g,'');
  m.textContent=DESIGNER.email; m.href='mailto:'+DESIGNER.email;
  const digits=DESIGNER.tel.replace(/[^0-9]/g,'');
  if(w) w.href = /^\d{10,}$/.test(digits)
    ? 'https://wa.me/'+digits+'?text='+encodeURIComponent("Hi, I saw the demo site you built. Let's talk about making it live.")
    : 'mailto:'+DESIGNER.email;
})();

/* ---------- scroll reveal ---------- */
(function reveal(){
  const els=document.querySelectorAll('.reveal');
  if(!('IntersectionObserver' in window)){ els.forEach(e=>e.classList.add('in')); return; }
  const io=new IntersectionObserver((entries)=>{
    entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
  },{threshold:.12, rootMargin:'0px 0px -8% 0px'});
  els.forEach(el=>io.observe(el));
})();

/* ---------- nav state, mobile menu, sticky call bar ---------- */
(function chrome(){
  const nav=document.getElementById('nav'), bar=document.getElementById('bar'),
        burger=document.getElementById('burger'), menu=document.getElementById('menu');
  let ticking=false;
  function onScroll(){
    const y=window.scrollY;
    if(nav && !nav.classList.contains('solid')) nav.classList.toggle('scrolled', y>40);
    if(bar) bar.classList.toggle('show', y>window.innerHeight*.5);
    ticking=false;
  }
  window.addEventListener('scroll',()=>{ if(!ticking){ requestAnimationFrame(onScroll); ticking=true; } },{passive:true});
  onScroll();

  if(burger && menu){
    const toggle=(open)=>{
      document.body.classList.toggle('menu-open', open);
      burger.setAttribute('aria-expanded', open?'true':'false');
      menu.setAttribute('aria-hidden', open?'false':'true');
    };
    burger.addEventListener('click',()=>toggle(!document.body.classList.contains('menu-open')));
    menu.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>toggle(false)));
    document.addEventListener('keydown',e=>{ if(e.key==='Escape') toggle(false); });
  }
})();

/* ---------- count-up stats ---------- */
(function counters(){
  const nums=document.querySelectorAll('[data-count]');
  if(!nums.length || !('IntersectionObserver' in window)) return;
  const io=new IntersectionObserver((es)=>{
    es.forEach(e=>{
      if(!e.isIntersecting) return;
      const el=e.target, end=+el.dataset.count, suf=el.dataset.suffix||'';
      io.unobserve(el);
      if(reduceMotion) return;
      let t0=null;
      const step=(ts)=>{
        if(!t0) t0=ts;
        const k=Math.min((ts-t0)/1100,1), val=Math.round(end*(1-Math.pow(1-k,3)));
        el.textContent=val.toLocaleString('en-IN')+(k===1?suf:'');
        if(k<1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  },{threshold:.6});
  nums.forEach(n=>io.observe(n));
})();

/* ---------- marquee seamless loop ---------- */
(function marquee(){
  const track=document.getElementById('track');
  if(track) track.innerHTML += track.innerHTML;
})();

/* ---------- gallery: drop photos that fail to load ---------- */
(function gallery(){
  document.querySelectorAll('.tile img').forEach(img=>{
    const ok=()=>img.classList.add('ok');
    if(img.complete && img.naturalWidth>0) ok(); else img.addEventListener('load',ok,{once:true});
    img.addEventListener('error',()=>img.remove(),{once:true});
  });
})();

/* ==========================================================================
   BACKGROUND HERO VIDEO
   A fixed, muted, looping layer behind the hero. Content scrolls straight over
   it — no scrub, no extra scroll distance before the page starts moving.
   ========================================================================== */
(function heroVideo(){
  const video=document.getElementById('hero-video');
  if(!video) return;

  /* fade in only once a frame exists; the poster (CSS background on .vmedia) holds the spot */
  const markReady=()=>{
    video.classList.add('ready');
    requestAnimationFrame(()=>{                 // nudge the compositor to paint frame 1
      video.style.transform='scale(1.0401)';
      requestAnimationFrame(()=>{ video.style.transform=''; });
    });
  };
  if(video.readyState>=2) markReady();
  video.addEventListener('loadeddata',markReady);
  video.addEventListener('canplay',markReady);

  /* reduced motion: hold the poster frame, never animate */
  if(reduceMotion){ video.removeAttribute('autoplay'); video.pause(); return; }

  /* big screens on a real connection get the full-quality file */
  const conn=navigator.connection||{};
  const wantsHQ = window.matchMedia('(min-width:900px)').matches && !conn.saveData
                  && !/2g|slow-2g/.test(conn.effectiveType||'');
  if(wantsHQ && video.dataset.hq){ video.src=video.dataset.hq; video.load(); }

  video.loop=true; video.muted=true; video.defaultMuted=true;
  video.setAttribute('playsinline','');

  const play=()=>video.play().catch(()=>{});
  play();
  /* browsers that block autoplay until the visitor interacts */
  ['touchstart','click','scroll','keydown'].forEach(ev=>
    document.addEventListener(ev,play,{once:true,passive:true}));
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden) video.pause(); else play();   // don't burn battery in a background tab
  });

  /* stop decoding once the hero is scrolled past — it's hidden behind opaque
     sections anyway, and a fixed video decoding off-screen costs battery */
  const hero=document.getElementById('vhero');
  if(hero && 'IntersectionObserver' in window){
    new IntersectionObserver(([e])=>{ e.isIntersecting ? play() : video.pause(); },
      {threshold:0.01}).observe(hero);
  }
})();

/* ==========================================================================
   ENQUIRY FORM  →  POST /api/enquiry
   Falls back to a pre-filled WhatsApp message if the API isn't reachable
   (e.g. if the site is hosted somewhere without serverless functions).
   ========================================================================== */
(function enquiry(){
  const form=document.getElementById('enq');
  if(!form) return;
  const msgBox=document.getElementById('formmsg');
  const btn=form.querySelector('button[type=submit]');

  /* ?package=Gold from the "Request a quote" buttons */
  const pkg=new URLSearchParams(location.search).get('package');
  if(pkg){
    const sel=form.querySelector('[name=package]');
    if(sel && [...sel.options].some(o=>o.value===pkg)) sel.value=pkg;
    const ta=form.querySelector('[name=message]');
    if(ta && !ta.value) ta.value=`I'd like a quote for the ${pkg} package. Function date: ______, around ______ guests.`;
    form.scrollIntoView({behavior:reduceMotion?'auto':'smooth',block:'center'});
  }

  const show=(type,text)=>{ msgBox.className='formmsg '+type; msgBox.textContent=text; };

  form.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const data=Object.fromEntries(new FormData(form).entries());
    const name=(data.name||'').trim(), phone=(data.phone||'').trim();

    form.querySelectorAll('[aria-invalid]').forEach(el=>el.removeAttribute('aria-invalid'));
    if(!name || !/[0-9]{6,}/.test(phone.replace(/\D/g,''))){
      if(!name) form.querySelector('[name=name]').setAttribute('aria-invalid','true');
      if(!/[0-9]{6,}/.test(phone.replace(/\D/g,''))) form.querySelector('[name=phone]').setAttribute('aria-invalid','true');
      show('err','Please add your name and a phone number we can call back on.');
      return;
    }

    btn.disabled=true; const label=btn.textContent; btn.textContent='Sending…';
    try{
      const res=await fetch('/api/enquiry',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify(data)
      });
      const out=await res.json().catch(()=>({}));
      if(!res.ok || !out.ok) throw new Error(out.error||'Request failed');
      show('ok',`Thank you ${name} — your enquiry is in. We'll call you on ${phone} with availability and a written quote.`);
      form.reset();
    }catch(err){
      const text=`Hi, I'd like to enquire about ${data.package||'the hall'}.%0AName: ${encodeURIComponent(name)}%0APhone: ${encodeURIComponent(phone)}%0A${encodeURIComponent(data.message||'')}`;
      show('err','Couldn’t reach the server just now — opening WhatsApp instead so your enquiry still gets through.');
      window.open(`https://wa.me/${BUSINESS_WA}?text=${text}`,'_blank','noopener');
    }finally{
      btn.disabled=false; btn.textContent=label;
    }
  });
})();
