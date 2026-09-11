  const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduce){document.querySelectorAll('animateMotion').forEach(a=>a.setAttribute('begin','indefinite'))}
  const io=new IntersectionObserver((es)=>{es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{threshold:.14});
  document.querySelectorAll('.rise:not(.in)').forEach(el=>io.observe(el));

  const fmt=(n)=>n.toLocaleString('de-DE');
  const cUp=new IntersectionObserver((es)=>{es.forEach(e=>{
    if(!e.isIntersecting)return;const el=e.target,target=+el.dataset.target,thou=el.dataset.format==='thousand';cUp.unobserve(el);
    if(reduce){el.textContent=thou?fmt(target):target;return}
    let s=null;const dur=1400;
    const tick=(t)=>{if(!s)s=t;const p=Math.min((t-s)/dur,1);const v=Math.round((1-Math.pow(1-p,3))*target);
      el.textContent=thou?fmt(v):v;if(p<1)requestAnimationFrame(tick)};
    requestAnimationFrame(tick);
  })},{threshold:.6});
  document.querySelectorAll('[data-target]').forEach(el=>cUp.observe(el));

  // Swipe-Slider Pfeile
  document.querySelectorAll('.swipe-wrap').forEach(w=>{
    const track=w.querySelector('.swipe');
    w.querySelectorAll('[data-swipe]').forEach(btn=>btn.addEventListener('click',()=>{
      const card=track.firstElementChild;
      const step=card?card.getBoundingClientRect().width+20:280;
      track.scrollBy({left:btn.dataset.swipe==='next'?step:-step,behavior:'smooth'});
    }));
  });

  // Ersparnis-Balken bei Sichtbarkeit füllen
  const barIO=new IntersectionObserver((es)=>{es.forEach(e=>{if(e.isIntersecting){e.target.style.width=e.target.dataset.width;barIO.unobserve(e.target)}})},{threshold:.4});
  document.querySelectorAll('.bar-fill[data-width]').forEach(el=>barIO.observe(el));

  // ---------- Lead-Versand (von ALLEN Formularen genutzt) ----------
  // Liegt bewusst hier oben im gemeinsamen Bereich: Der Funnel auf der
  // Startseite und die Formulare auf /anfragen/ liegen auf verschiedenen
  // Seiten und brauchen beide diese Funktion.
  // Gibt true zurueck, wenn FormSubmit die Anfrage angenommen hat.
  async function sendLead(lead){
    try{
      const payload=Object.assign({
        _subject:'Neue Anfrage ('+lead.typ+') – BHD Website',
        _template:'table',
        _captcha:'false'
      },lead);
      if(Array.isArray(payload.interesse))payload.interesse=payload.interesse.join(', ');
      // Formular-kodiert (application/x-www-form-urlencoded) statt JSON:
      // vermeidet den CORS-Preflight, der Browser-Absendungen still blockieren kann.
      // Content-Type NICHT manuell setzen.
      const data=new URLSearchParams();
      Object.keys(payload).forEach(k=>data.append(k, payload[k]==null?'':payload[k]));
      const res=await fetch('https://formsubmit.co/ajax/info@bhd-energie.de',{
        method:'POST',
        headers:{'Accept':'application/json'},
        body:data
      });
      const out=await res.json().catch(()=>null);
      const ok=res.ok && !(out && String(out.success)==='false');
      if(!ok)console.error('Lead-Versand abgelehnt:',out);
      return ok;
    }catch(e){console.error('Lead-Versand fehlgeschlagen',e);return false;}
  }

  // Ersatz-Hinweis, wenn der Versand scheitert – besser als ein falsches „Danke"
  function leadFallback(box){
    if(!box)return;
    const h=box.querySelector('h3'), p=box.querySelector('p');
    if(h)h.textContent='Bitte melden Sie sich kurz direkt';
    if(p)p.innerHTML='Ihre Angaben konnten technisch leider nicht übermittelt werden. '+
      'Rufen Sie uns gern an: <a href="tel:+491634440392" style="color:inherit"><b>0163 4440392</b></a> '+
      'oder schreiben Sie an <a href="mailto:info@bhd-energie.de" style="color:inherit"><b>info@bhd-energie.de</b></a>.';
  }

  // ---------- Einwilligung & Reichweitenmessung ----------
  // Google Analytics wird ERST nach ausdruecklicher Zustimmung nachgeladen.
  // Vorher wird kein Skript eingebunden und kein Cookie gesetzt (§ 25 TDDDG).
  // Die Mess-ID kommt ueber data-ga am <body> aus build.js; ist sie leer,
  // bleibt das Banner unsichtbar und die Seite komplett trackingfrei.
  (function(){
    var GA=document.body.dataset.ga||'';
    var KEY='bhd-consent';
    var box=document.getElementById('consent');

    function gelesen(){try{return localStorage.getItem(KEY)}catch(e){return null}}
    function merken(v){try{localStorage.setItem(KEY,v)}catch(e){}}
    function zeigen(){if(box)box.hidden=false}
    function schliessen(){if(box)box.hidden=true}

    function ladeGA(){
      if(!GA||window.__gaAktiv)return;
      window.__gaAktiv=true;
      window.dataLayer=window.dataLayer||[];
      window.gtag=function(){window.dataLayer.push(arguments)};
      gtag('js',new Date());
      // Consent Mode v2: alles aus, nur die Statistik wird freigegeben.
      gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',
        ad_personalization:'denied',analytics_storage:'denied'});
      gtag('consent','update',{analytics_storage:'granted'});
      gtag('config',GA,{anonymize_ip:true});
      var s=document.createElement('script');
      s.async=true;
      s.src='https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(GA);
      document.head.appendChild(s);
    }

    var wahl=gelesen();
    if(!GA)schliessen();
    else if(wahl==='ja'){ladeGA();schliessen()}
    else if(wahl==='nein')schliessen();
    else zeigen();

    var ja=document.getElementById('consent-ja'),nein=document.getElementById('consent-nein');
    if(ja)ja.addEventListener('click',function(){merken('ja');ladeGA();schliessen()});
    if(nein)nein.addEventListener('click',function(){merken('nein');schliessen()});

    // Aus der Datenschutzerklaerung heraus widerrufbar
    window.bhdEinwilligung=function(){try{localStorage.removeItem(KEY)}catch(e){}zeigen()};
    document.querySelectorAll('[data-consent]').forEach(function(el){
      el.addEventListener('click',function(e){e.preventDefault();window.bhdEinwilligung()});
    });
  })();

  // Lead-Ereignis melden. Wird von allen drei Formularwegen aufgerufen und
  // laeuft ins Leere, solange keine Einwilligung vorliegt – genau so gewollt.
  function trackLead(quelle){
    try{if(window.gtag)gtag('event','generate_lead',{method:quelle})}catch(e){}
  }

  // ---------- Video im Hero (nur Startseite) ----------
  // Reihenfolge ist hier der ganze Trick: sichtbar ist zuerst nur das
  // Standbild. Das Video wird erst NACH dem Seitenaufbau geholt, damit es
  // den Erstaufbau und damit die Ladewerte nicht ausbremst.
  (function(){
    var v=document.querySelector('.hero-vid');
    if(!v)return;
    // Bewegung reduzieren: gar nicht laden, das Standbild bleibt stehen.
    if(reduce)return;
    // Datensparmodus und langsame Verbindungen verschonen.
    var netz=navigator.connection||{};
    if(netz.saveData)return;
    if(/(^|-)2g$/.test(netz.effectiveType||''))return;

    // Welche Fassung geladen wird, entscheidet die TATSAECHLICHE Anzeigebreite,
    // nicht die Bildschirmbreite allein. Auf dem PC liegt das Video full-bleed
    // hinter dem ganzen Hero: bei 1920 px Fenster wurde die alte 1280er-Datei
    // um das 1,5-Fache hochgezogen und sah entsprechend weich aus. Unter
    // 1025 px steht das Video als schmales Band (siehe CSS) - dort reicht die
    // kleine Fassung, und die grosse waere nur unnoetige Datenmenge.
    var bandLayout=window.matchMedia('(max-width:1024px)').matches;
    var dpr=Math.min(window.devicePixelRatio||1,2);
    var langsam=/(^|-)[23]g$/.test(netz.effectiveType||'');
    function quelle(){
      if(langsam)return v.dataset.vidKlein;
      var b=Math.round((v.getBoundingClientRect().width||window.innerWidth)*dpr);
      if(bandLayout)return b>=1100?v.dataset.vidMittel:v.dataset.vidKlein;
      return b>=1400?v.dataset.vidGross:v.dataset.vidMittel;
    }
    function start(){
      v.src=quelle();
      v.addEventListener('playing',function(){v.classList.add('laeuft')},{once:true});
      var p=v.play();
      if(p&&p.catch)p.catch(function(){});
    }
    // Etwas Luft nach dem load-Ereignis, damit Schrift und Funnel zuerst stehen.
    if(document.readyState==='complete')setTimeout(start,300);
    else window.addEventListener('load',function(){setTimeout(start,300)});
  })();

  // ---------- Funnel (nur Startseite) ----------
  (function(){
    if(!document.getElementById('funnel'))return;
  const answers={};
  const steps=[...document.querySelectorAll('.step[data-step]')];
  const total=steps.length;
  const pfill=document.getElementById('pfill');
  const label=document.getElementById('stepLabel');
  const success=document.getElementById('fsuccess');
  let idx=0;
  function show(i){
    steps.forEach(s=>s.classList.remove('active'));
    if(i>=total){label.textContent='Fertig';pfill.style.width='100%';success.classList.add('show');return}
    steps[i].classList.add('active');label.textContent=`Schritt ${i+1} von ${total}`;pfill.style.width=((i+1)/total*100)+'%';idx=i;
  }
  function next(){show(idx+1);document.getElementById('funnel').scrollIntoView({behavior:'smooth',block:'nearest'})}
  function back(){if(idx>0)show(idx-1)}
  document.querySelectorAll('.choice').forEach(btn=>btn.addEventListener('click',()=>{answers[btn.dataset.field]=btn.dataset.value;next()}));
  document.querySelectorAll('[data-back]').forEach(b=>b.addEventListener('click',back));
  const plz=document.getElementById('plz');
  plz.addEventListener('input',()=>{plz.value=plz.value.replace(/\D/g,'')});
  document.querySelector('[data-next-valid="plz"]').addEventListener('click',()=>{
    if(plz.value.length!==5){plz.style.borderColor='#d64545';plz.focus();return}
    plz.style.borderColor='';answers.plz=plz.value;next();
  });
  document.getElementById('finalSubmit').addEventListener('click',()=>{
    const name=document.getElementById('name'),tel=document.getElementById('tel'),mail=document.getElementById('mail'),dsgvo=document.getElementById('dsgvo');
    let ok=true;
    [name,tel,mail].forEach(f=>{if(!f.value.trim()){f.style.borderColor='#d64545';ok=false}else{f.style.borderColor=''}});
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail.value)){mail.style.borderColor='#d64545';ok=false}
    if(!dsgvo.checked){dsgvo.parentElement.style.color='#d64545';ok=false}else{dsgvo.parentElement.style.color=''}
    if(!ok)return;
    answers.typ='Startseite';
    answers.name=name.value;answers.tel=tel.value;answers.mail=mail.value;answers.dsgvo='ja';
    const msgEl=document.getElementById('msg');
    answers.nachricht=msgEl?msgEl.value.trim():'';
    const first=name.value.trim().split(' ')[0];
    if(first)document.getElementById('successName').textContent=first;
    show(total);
    // Anfrage wirklich verschicken. Scheitert der Versand, wird die
    // Erfolgsmeldung durch die Rückfallmeldung mit Telefonnummer ersetzt.
    sendLead(answers).then(function(ok){ if(ok)trackLead('funnel'); else leadFallback(success); });
  });

  })();

  // ---------- Referenzen: Filter nach Anlagentyp ----------
  (function(){
    const btns=document.querySelectorAll('.ref-filter .fbtn');
    const grid=document.querySelector('.ref-grid');
    const cards=document.querySelectorAll('.ref-grid .rcard[data-type]');
    const more=document.getElementById('ref-more');
    if(!btns.length||!cards.length)return;

    // Abschluss-Karte so breit machen, dass die letzte Reihe voll wird
    function fitMore(){
      if(!more||!grid)return;
      // Spaltenzahl aus den berechneten Pixelbreiten – nur zuverlässig, wenn das Grid sichtbar ist
      const cols=getComputedStyle(grid).gridTemplateColumns.split(' ')
                   .filter(function(v){return v.indexOf('px')>-1;}).length;
      if(!cols)return;
      let visible=0;
      cards.forEach(function(c){ if(!c.classList.contains('is-hidden'))visible++; });
      const rest=visible%cols;
      more.style.gridColumn='span '+(rest===0?cols:cols-rest);
    }

    btns.forEach(function(b){
      b.addEventListener('click',function(){
        const f=b.dataset.filter;
        btns.forEach(function(x){x.classList.toggle('active',x===b);});
        cards.forEach(function(c){
          c.classList.toggle('is-hidden', f!=='all' && c.dataset.type!==f);
        });
        fitMore();
      });
    });

    fitMore();
    window.addEventListener('resize',fitMore);
    // greift auch, wenn die Referenzen-Ansicht erst per Routing sichtbar wird
    if(window.ResizeObserver)new ResizeObserver(fitMore).observe(grid);
  })();

  // ---------- Navigation (echte Unterseiten) ----------
  (function(){
    // aktiven Menuepunkt markieren
    var page=document.body.dataset.page;
    document.querySelectorAll('.nav-links [data-nav]').forEach(function(a){
      a.classList.toggle('active', a.dataset.nav===page);
    });
    // Alte Adressen mit # auf die neuen Seiten umleiten (fuer geteilte Links)
    var map={"#referenzen":"/referenzen/","#anfragen":"/anfragen/","#ueber-uns":"/ueber-uns/","#angebots-check":"/angebots-check/","#waermepumpen-rechner":"/waermepumpen-rechner/","#partner-werden":"/partner-werden/","#photovoltaik":"/photovoltaik/","#ratgeber-photovoltaik":"/ratgeber/photovoltaik-lohnt-sich/","#ratgeber-waermepumpe":"/ratgeber/waermepumpe-altbau/","#ratgeber-angebot":"/ratgeber/angebot-pruefen/","#stromspeicher":"/stromspeicher/","#waermepumpe":"/waermepumpe/","#kosten":"/kosten/","#ratgeber":"/ratgeber/","#impressum":"/impressum/","#datenschutz":"/datenschutz/"};
    if(map[location.hash]){location.replace(map[location.hash]);return;}
    // „Jetzt anfragen": auf der Startseite sanft scrollen, sonst normal verlinken
    document.querySelectorAll('[data-go-funnel]').forEach(function(el){
      el.addEventListener('click',function(e){
        var f=document.getElementById('funnel');
        if(!f)return;
        e.preventDefault();
        f.scrollIntoView({behavior:'smooth',block:'start'});
      });
    });
  })();
  // ---------- Formulare der Anfragen-Seite ----------
  const isMail=(v)=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  // Fehlerhafte Felder auch fuer Screenreader kennzeichnen, nicht nur farblich.
  // Farbe allein reicht nicht: wer sie nicht sieht, erfaehrt sonst gar nicht,
  // welches Feld beanstandet wurde.
  const mark=(el,bad)=>{
    el.style.borderColor=bad?'#d64545':'';
    if(bad)el.setAttribute('aria-invalid','true');
    else el.removeAttribute('aria-invalid');
  };
  function validateRequired(fields){
    let ok=true;
    fields.forEach(el=>{const empty=!el.value.trim();mark(el,empty);if(empty)ok=false;});
    return ok;
  }
  // sendLead() ist weiter oben im gemeinsamen Bereich definiert – der Funnel
  // auf der Startseite braucht sie ebenfalls.

  // ===== Angebotsanfrage – nur auf /anfragen/ =====
  (function(){
  if(!document.getElementById('b2c-form'))return;
  // PLZ nur Ziffern
  const b2cPlz=document.getElementById('b2c-plz');
  b2cPlz.addEventListener('input',()=>{b2cPlz.value=b2cPlz.value.replace(/\D/g,'')});

  // B2C absenden
  document.getElementById('b2c-submit').addEventListener('click',()=>{
    const name=document.getElementById('b2c-name'),tel=document.getElementById('b2c-tel'),
          mail=document.getElementById('b2c-mail'),plz=document.getElementById('b2c-plz'),
          dsgvo=document.getElementById('b2c-dsgvo');
    let ok=validateRequired([name,tel,mail,plz]);
    if(!isMail(mail.value)){mark(mail,true);ok=false;}
    if(plz.value.length!==5){mark(plz,true);ok=false;}
    const interesse=[...document.querySelectorAll('#b2c-form input[name="interesse"]:checked')].map(c=>c.value);
    const optWrap=document.querySelector('#b2c-form .optgrid');
    if(interesse.length===0){optWrap.style.outline='2px solid #d64545';optWrap.style.outlineOffset='4px';optWrap.style.borderRadius='14px';ok=false;}
    else{optWrap.style.outline='';}
    if(!dsgvo.checked){dsgvo.parentElement.style.color='#d64545';ok=false;}else{dsgvo.parentElement.style.color='';}
    if(!ok)return;
    const lead={typ:'B2C',interesse,name:name.value,plz:plz.value,tel:tel.value,mail:mail.value,
      wohnsituation:document.getElementById('b2c-eigentum').value,nachricht:document.getElementById('b2c-msg').value};
    const done=document.getElementById('b2c-done');
    sendLead(lead).then(function(sent){ if(sent)trackLead('anfragen-b2c'); else leadFallback(done); });
    document.getElementById('b2c-form').style.display='none';
    done.classList.add('show');
    document.getElementById('b2c-card').scrollIntoView({behavior:'smooth',block:'center'});
  });
  })();

  // ===== Partneranfrage – nur auf /partner-werden/ =====
  (function(){
  if(!document.getElementById('b2b-form'))return;
  document.getElementById('b2b-submit').addEventListener('click',()=>{
    const firma=document.getElementById('b2b-firma'),name=document.getElementById('b2b-name'),
          mail=document.getElementById('b2b-mail'),tel=document.getElementById('b2b-tel'),
          art=document.getElementById('b2b-art'),dsgvo=document.getElementById('b2b-dsgvo');
    let ok=validateRequired([firma,name,mail,tel]);
    if(!isMail(mail.value)){mark(mail,true);ok=false;}
    if(!art.value){mark(art,true);ok=false;}else{mark(art,false);}
    if(!dsgvo.checked){dsgvo.parentElement.style.color='#d64545';ok=false;}else{dsgvo.parentElement.style.color='';}
    if(!ok)return;
    const lead={typ:'B2B',firma:firma.value,ansprechpartner:name.value,mail:mail.value,tel:tel.value,
      art:art.value,region:document.getElementById('b2b-region').value,
      kapazitaet:document.getElementById('b2b-kapa').value,
      website:document.getElementById('b2b-web').value,
      montageteam:document.getElementById('b2b-mitarbeiter').value,
      nachricht:document.getElementById('b2b-msg').value};
    const done=document.getElementById('b2b-done');
    sendLead(lead).then(function(sent){ if(sent)trackLead('partner-b2b'); else leadFallback(done); });
    document.getElementById('b2b-form').style.display='none';
    done.classList.add('show');
    document.getElementById('b2b-card').scrollIntoView({behavior:'smooth',block:'center'});
  });
  })();

  // ===== Wärmepumpen-Rechner – nur auf /waermepumpen-rechner/ =====
  (function(){
  const root=document.getElementById('wp-rechner');
  if(!root)return;

  const $=(id)=>document.getElementById(id);
  const num=(id,def)=>{const v=parseFloat(($(id)||{}).value);return isFinite(v)?v:(def===undefined?0:def);};
  const nf=(n,d)=>n.toLocaleString('de-DE',{minimumFractionDigits:d||0,maximumFractionDigits:d||0});
  const eur=(n)=>nf(Math.round(n))+' €';

  // Heizwert und Nutzungsgrad je Energieträger.
  // kwh = Energiegehalt einer Einheit, eta = wie viel davon als Wärme ankommt.
  const TRAEGER={
    'gas-kwh':     {kwh:1,   eta:0.90, einheit:'kWh',   preis:0.12, preisEinheit:'€/kWh'},
    'gas-m3':      {kwh:10,  eta:0.90, einheit:'m³',    preis:1.20, preisEinheit:'€/m³'},
    'oel':         {kwh:10,  eta:0.85, einheit:'Liter', preis:1.10, preisEinheit:'€/Liter'},
    'fluessiggas': {kwh:6.6, eta:0.85, einheit:'Liter', preis:0.90, preisEinheit:'€/Liter'},
    'strom':       {kwh:1,   eta:1.00, einheit:'kWh',   preis:0.32, preisEinheit:'€/kWh'}
  };

  const VOLLSTUNDEN=2100;      // Vollbenutzungsstunden Heizung pro Jahr (Richtwert Deutschland)
  const WW_PRO_PERSON=500;     // kWh Warmwasserwärme je Person und Jahr
  const MAX_KOSTEN=28000;      // förderfähige Kosten 1. Wohneinheit, KfW 458 ab 21.07.2026
  const MAX_QUOTE=80;          // Deckel nur bei anzusetzendem zvE bis 30.000 €
  const REGEL_QUOTE=70;        // sonst gilt der Regeldeckel von 70 %

  // Jahresarbeitszahl einer Luft-Wasser-Wärmepumpe je Vorlauftemperatur
  const JAZ_VL={35:4.3, 40:4.0, 45:3.6, 55:3.0, 60:2.7};
  // Gerätestufen, wie sie am Markt üblich sind
  const STUFEN=[4,5,6,7,8,9,10,11,12,14,16,18,20];

  // Verbrauchsfeld nur freigeben, wenn ein Energieträger gewählt ist
  function syncTraeger(){
    const key=$('wp-traeger').value;
    const t=TRAEGER[key];
    const menge=$('wp-menge');
    menge.disabled=!t;
    if(!t){menge.value='';}
    $('wp-preis-alt-unit').textContent=t?t.preisEinheit:'€/kWh';
    if(t && !$('wp-preis-alt').dataset.touched){ $('wp-preis-alt').value=t.preis; }
  }

  function rechne(){
    const flaeche=num('wp-flaeche',0);
    const personen=Math.max(1,num('wp-personen',1));
    const spez=num('wp-standard',85);
    const typF=num('wp-typ',1);
    const norm=num('wp-region',-12);
    const vl=num('wp-uebergabe',55);
    const wwUeberWP=num('wp-ww',1)===1;
    const hinweise=[];

    if(!(flaeche>0)){
      $('r-geraet').textContent='–';
      $('r-hinweise').innerHTML='<div class="cn cn-warn">Bitte tragen Sie die beheizte Wohnfläche ein.</div>';
      return null;
    }

    // --- Heizlast, Weg A: über den Verbrauch ---
    const tKey=$('wp-traeger').value;
    const t=TRAEGER[tKey];
    const menge=num('wp-menge',0);
    let heizwaerme=null, heizlastVerbrauch=null;
    if(t && menge>0){
      const endenergie=menge*t.kwh;           // kWh Brennstoff pro Jahr
      const nutzwaerme=endenergie*t.eta;      // davon nutzbare Wärme
      const wwAlt=wwUeberWP?personen*WW_PRO_PERSON:0;
      heizwaerme=Math.max(0,nutzwaerme-wwAlt);
      heizlastVerbrauch=heizwaerme/VOLLSTUNDEN;
    }

    // --- Heizlast, Weg B: über die Fläche ---
    const heizlastFlaeche=flaeche*spez*typF/1000;

    // Klimakorrektur: die Flächenwerte gelten für rund -12 °C Auslegungstemperatur
    const klimaF=1+((-12)-norm)*0.03;
    const heizlastFlaecheKorr=heizlastFlaeche*klimaF;

    let heizlast, methode;
    if(heizlastVerbrauch!==null){
      heizlast=heizlastVerbrauch; methode='Ihren Jahresverbrauch';
      const abw=Math.abs(heizlastVerbrauch-heizlastFlaecheKorr)/heizlastFlaecheKorr;
      if(abw>0.35){
        hinweise.push(['warn','Verbrauch und Wohnfläche führen zu deutlich verschiedenen Werten ('+
          nf(heizlastVerbrauch,1)+' kW gegenüber '+nf(heizlastFlaecheKorr,1)+' kW). Das kann an einem ungewöhnlichen Heizverhalten, an leerstehenden Räumen oder an einer falschen Verbrauchsangabe liegen. Hier lohnt sich eine Prüfung vor Ort besonders.']);
      }
    }else{
      heizlast=heizlastFlaecheKorr; methode='Ihre Wohnfläche';
      hinweise.push(['info','Ohne Verbrauchsangabe wird über die Wohnfläche gerechnet. Tragen Sie Ihren Jahresverbrauch ein, dann wird das Ergebnis deutlich genauer.']);
    }

    // --- Gerätegröße ---
    const zuschlag=wwUeberWP?1.10:1.00;
    const leistung=heizlast*zuschlag;
    const stufe=STUFEN.find(s=>s>=leistung)||Math.ceil(leistung);

    // --- Jahresarbeitszahl ---
    let jaz=JAZ_VL[vl]||3.0;
    if(wwUeberWP)jaz-=0.2;
    if(norm<=-14)jaz-=0.15;
    if(norm>=-10)jaz+=0.1;
    jaz=Math.min(4.6,Math.max(2.3,jaz));

    // --- Jahresstrombedarf ---
    const waermeHeizung=heizwaerme!==null?heizwaerme:heizlast*VOLLSTUNDEN;
    const waermeWW=wwUeberWP?personen*WW_PRO_PERSON:0;
    const strom=(waermeHeizung+waermeWW)/jaz;

    // --- Speicher ---
    const wwSpeicher=personen<=2?200:personen<=4?300:personen<=6?400:500;
    const puffer=Math.max(50,Math.round(leistung*20/10)*10);

    // --- Förderung ---
    const selbstnutzer=num('wp-eigentum',1)===1;
    const altOK=num('wp-altheizung',0)===1;
    const kinder=Math.max(0,num('wp-kinder',0));
    const zveRaw=parseFloat($('wp-zve').value);
    const zveAngegeben=isFinite(zveRaw)&&zveRaw>0;
    const zve=zveAngegeben?Math.max(0,zveRaw-kinder*10000):null;

    let quote=30;
    const bausteine=['30 % Grundförderung'];
    if(selbstnutzer&&altOK){quote+=16;bausteine.push('16 % Klimageschwindigkeitsbonus');}
    if(selbstnutzer&&zveAngegeben){
      let ek=0;
      if(zve<=30000)ek=40; else if(zve<=40000)ek=30; else if(zve<=50000)ek=10;
      if(ek){quote+=ek;bausteine.push(ek+' % Einkommensbonus');}
    }
    const quoteVorDeckel=quote;
    // Deckel: laut KfW-Merkblatt 458 grundsaetzlich 70 %. Die 80 % gibt es nur
    // fuer selbstnutzende Eigentuemer mit einem anzusetzenden zu versteuernden
    // Haushaltseinkommen bis 30.000 € (Kinder sind oben bereits abgezogen).
    // Vorher stand hier pauschal 80 % - das hat im Bereich 30.001 bis 40.000 €
    // sechs Prozentpunkte zu viel ausgewiesen, also bis zu 1.680 € Zuschuss,
    // den es nicht gibt.
    const deckel=(selbstnutzer&&zveAngegeben&&zve<=30000)?MAX_QUOTE:REGEL_QUOTE;
    quote=Math.min(deckel,quote);

    const investRaw=parseFloat($('wp-invest').value);
    const investAngegeben=isFinite(investRaw)&&investRaw>0;
    const invest=investAngegeben?investRaw:MAX_KOSTEN;
    const foerderfaehig=Math.min(invest,MAX_KOSTEN);
    const zuschuss=foerderfaehig*quote/100;
    const eigen=invest-zuschuss;

    // --- Kostenvergleich ---
    const preisStrom=num('wp-preis-strom',0.26);
    const preisAlt=num('wp-preis-alt',0);
    let kostenAlt=null,kostenNeu=null;
    if(t&&menge>0&&preisAlt>0){
      kostenAlt=menge*preisAlt;
      kostenNeu=strom*preisStrom;
      if(!wwUeberWP){
        hinweise.push(['info','Im Kostenvergleich steckt auf der alten Seite noch das Warmwasser, auf der neuen nicht, weil Sie es getrennt lassen wollen. Die Differenz fällt dadurch zu günstig aus.']);
      }
    }

    // --- Fachliche Hinweise ---
    if(vl>=55){
      hinweise.push(['warn','Bei '+vl+' °C Vorlauf arbeitet eine Luft-Wasser-Wärmepumpe noch, aber unwirtschaftlich. Größere Heizkörper in wenigen Räumen und ein hydraulischer Abgleich bringen die Vorlauftemperatur oft um 10 bis 15 °C herunter. Das ist meist die günstigste Maßnahme überhaupt.']);
    }
    if(spez>=100){
      hinweise.push(['warn','Bei unsaniertem Altbau ist die Heizlast hoch. Dämmung von Dach oder oberster Geschossdecke senkt sowohl die nötige Gerätegröße als auch die laufenden Kosten deutlich.']);
    }
    if(stufe>=16){
      hinweise.push(['info','Ab dieser Größenordnung ist zu prüfen, ob eine Kaskade aus zwei Geräten oder eine Erdwärmequelle sinnvoller ist.']);
    }
    hinweise.push(['info','Für die Wärmepumpe braucht es eine eigene Absicherung mit Fehlerstromschutzschalter Typ B und eine Steuereinrichtung nach § 14a EnWG. Ob Ihr Zählerschrank dafür Platz hat, zeigt erst die Prüfung vor Ort.']);
    if(!selbstnutzer){
      hinweise.push(['info','Klimageschwindigkeits- und Einkommensbonus gibt es nur für selbstnutzende Eigentümer. Gerechnet ist deshalb nur die Grundförderung.']);
    }else if(!zveAngegeben){
      hinweise.push(['info','Ohne Angabe zum Haushaltseinkommen ist der Einkommensbonus nicht eingerechnet. Bis 50.000 € zu versteuerndem Einkommen kommen 10 bis 40 Prozentpunkte dazu.']);
    }
    if(quoteVorDeckel>deckel){
      hinweise.push(['info','Die Boni summieren sich auf '+quoteVorDeckel+' %. Gefördert werden in Ihrem Fall höchstens '+deckel+' %'+
        (deckel===REGEL_QUOTE?' – die 80 % gibt es nur bei einem anzusetzenden Haushaltseinkommen bis 30.000 €.':'.')]);
    }

    // --- Ausgabe ---
    $('r-geraet').textContent=nf(leistung,1)+' kW';
    $('r-geraet-sub').textContent='bei '+nf(norm,0)+' °C Außentemperatur · übliche Gerätestufe '+stufe+' kW';
    $('r-heizlast').textContent=nf(heizlast,1)+' kW';
    $('r-methode').textContent=methode;
    $('r-vl').textContent=nf(vl,0)+' °C';
    $('r-jaz').textContent=nf(jaz,1);
    $('r-strom').textContent=nf(Math.round(strom/10)*10)+' kWh';
    $('r-wwspeicher').textContent=wwUeberWP?(nf(wwSpeicher)+' Liter'):'entfällt';
    $('r-puffer').textContent='ca. '+nf(puffer)+' Liter';

    const kb=$('r-kosten-block');
    if(kostenAlt!==null){
      kb.hidden=false;
      $('r-kosten-alt').textContent=eur(kostenAlt);
      $('r-kosten-neu').textContent=eur(kostenNeu);
      const diff=kostenAlt-kostenNeu;
      $('r-kosten-diff-lbl').textContent=diff>=0?'Ersparnis pro Jahr':'Mehrkosten pro Jahr';
      $('r-kosten-diff').textContent=eur(Math.abs(diff));
      $('r-kosten-diff').style.color=diff>=0?'var(--gold-deep)':'#b4453c';
    }else{ kb.hidden=true; }

    $('r-quote').textContent=nf(quote)+' %';
    $('r-zuschuss').textContent=eur(zuschuss);
    $('r-eigen').textContent=eur(eigen);
    $('r-fund-note').textContent=bausteine.join(' + ')+'. Gerechnet auf '+eur(foerderfaehig)+
      (investAngegeben?' förderfähige Kosten':' Förderhöchstbetrag, weil keine Investitionssumme angegeben ist')+'.';

    $('r-hinweise').innerHTML=hinweise.map(h=>'<div class="cn cn-'+h[0]+'">'+h[1]+'</div>').join('');

    return {
      wohnflaeche:flaeche+' m²', personen:personen, gebaeude:$('wp-standard').selectedOptions[0].text,
      gebaeudeart:$('wp-typ').selectedOptions[0].text, region:$('wp-region').selectedOptions[0].text,
      waermeverteilung:$('wp-uebergabe').selectedOptions[0].text,
      warmwasser_ueber_wp:wwUeberWP?'ja':'nein',
      verbrauch:t&&menge>0?(nf(menge)+' '+t.einheit+' '+$('wp-traeger').selectedOptions[0].text):'keine Angabe',
      heizlast:nf(heizlast,1)+' kW ('+methode+')',
      erforderliche_leistung:nf(leistung,1)+' kW, übliche Stufe '+stufe+' kW',
      vorlauftemperatur:vl+' °C', jaz:nf(jaz,1),
      jahresstrom:nf(Math.round(strom/10)*10)+' kWh',
      warmwasserspeicher:wwUeberWP?wwSpeicher+' Liter':'entfällt',
      pufferspeicher:puffer+' Liter',
      altheizung:$('wp-altheizung').selectedOptions[0].text,
      selbstnutzer:selbstnutzer?'ja':'nein',
      foerderquote:quote+' %', zuschuss:eur(zuschuss),
      investitionssumme:investAngegeben?eur(invest):'nicht angegeben'
    };
  }

  let letztesErgebnis=null;
  function update(){ letztesErgebnis=rechne(); }

  root.querySelectorAll('input,select').forEach(el=>{
    el.addEventListener('input',update);
    el.addEventListener('change',()=>{ if(el.id==='wp-traeger')syncTraeger(); update(); });
  });
  $('wp-menge').addEventListener('input',()=>{$('wp-menge').dataset.touched='1';});
  $('wp-preis-alt').addEventListener('input',()=>{$('wp-preis-alt').dataset.touched='1';});
  syncTraeger();
  update();

  // Kontaktformular einblenden
  $('wp-send').addEventListener('click',()=>{
    if(!letztesErgebnis){ $('wp-flaeche').focus(); return; }
    const box=$('wp-kontakt');
    box.hidden=false;
    box.scrollIntoView({behavior:'smooth',block:'start'});
  });

  $('wp-k-submit').addEventListener('click',()=>{
    const name=$('wp-k-name'),tel=$('wp-k-tel'),mail=$('wp-k-mail'),plz=$('wp-k-plz'),dsgvo=$('wp-k-dsgvo');
    let ok=validateRequired([name,tel,mail,plz]);
    if(!isMail(mail.value)){mark(mail,true);ok=false;}
    if(plz.value.length!==5){mark(plz,true);ok=false;}
    if(!dsgvo.checked){dsgvo.parentElement.style.color='#d64545';ok=false;}else{dsgvo.parentElement.style.color='';}
    if(!ok)return;
    const lead=Object.assign({typ:'Wärmepumpen-Rechner',name:name.value,plz:plz.value,
      tel:tel.value,mail:mail.value,nachricht:$('wp-k-msg').value}, letztesErgebnis||{});
    const done=$('wp-k-done');
    sendLead(lead).then(function(sent){ if(sent)trackLead('waermepumpen-rechner'); else leadFallback(done); });
    $('wp-form').style.display='none';
    done.classList.add('show');
    $('wp-card').scrollIntoView({behavior:'smooth',block:'center'});
  });

  $('wp-k-plz').addEventListener('input',()=>{$('wp-k-plz').value=$('wp-k-plz').value.replace(/\D/g,'')});
  })();

  // ===== Rentabilitätsrechner – nur auf /rentabilitaetsrechner/ =====
  // Zwei Rechner in einem Umschalter. Bewusst kurz gehalten: wenige Eingaben,
  // eine Leitzahl, alle Annahmen stehen sichtbar unter dem Rechner.
  //
  // WICHTIG: Die Kennwerte sind mit dem Rest der Website abgeglichen und
  // duerfen nicht einzeln geaendert werden.
  //  - 7,7 ct Einspeisung  = anzulegender Wert der Bundesnetzagentur fuer
  //    Anlagen bis 10 kW, Inbetriebnahme 01.08.2026 bis 31.01.2027.
  //  - Preise je kWp / je kWh Speicher = Mitte der Spannen auf /kosten/.
  //  - JAZ je Vorlauftemperatur = dieselbe Tabelle wie im Waermepumpen-Rechner.
  //  - Foerderdeckel 70 %, 80 % nur bis 30.000 € anzusetzendem zvE (KfW 458).
  // Das Rechenbeispiel auf /photovoltaik/ muss dasselbe Ergebnis liefern.
  (function(){
  const wurzel=document.getElementById('rendite');
  if(!wurzel)return;

  const $=(id)=>document.getElementById(id);
  const nf=(n,d)=>n.toLocaleString('de-DE',{minimumFractionDigits:d||0,maximumFractionDigits:d||0});
  const eur=(n)=>nf(Math.round(n))+' €';
  const num=(id,def)=>{const v=parseFloat(($(id)||{}).value);return isFinite(v)?v:(def===undefined?0:def);};

  const VERGUETUNG=0.077;      // €/kWh Ueberschusseinspeisung bis 10 kW
  const PREIS_KWP=1450;        // € je kWp schluesselfertig, ohne Speicher
  const PREIS_SPEICHER={0:0,5:3750,8:5000,10:5750,15:8000};
  const BETRIEB_ANTEIL=0.01;   // Versicherung, Wartung, Zaehler, Ruecklage WR
  const BETRIEB_MIN=120;
  const DEGRADATION=0.005;     // Leistungsverlust der Module pro Jahr
  const JAHRE=20;

  const MAX_KOSTEN=28000, MAX_QUOTE=80, REGEL_QUOTE=70;
  const JAZ_VL={35:4.3,40:4.0,45:3.6,55:3.0,60:2.7};
  const TRAEGER={
    'gas-kwh':     {kwh:1,   eta:0.90, preis:0.12, einheit:'€/kWh'},
    'gas-m3':      {kwh:10,  eta:0.90, preis:1.20, einheit:'€/m³'},
    'oel':         {kwh:10,  eta:0.85, preis:1.10, einheit:'€/Liter'},
    'fluessiggas': {kwh:6.6, eta:0.85, preis:0.90, einheit:'€/Liter'},
    'strom':       {kwh:1,   eta:1.00, preis:0.32, einheit:'€/kWh'}
  };

  function hinweiseAus(id,liste){
    $(id).innerHTML=liste.map(h=>'<div class="cn cn-'+h[0]+'">'+h[1]+'</div>').join('');
  }
  function jahre(n){
    if(!isFinite(n)||n<=0)return null;
    return n>=JAHRE*2?null:n;
  }

  /* ------------------------------------------------------ Photovoltaik */

  // Autarkiegrad: Anteil Ihres Strombedarfs, den die Anlage deckt.
  // Kalibriert auf zwei belastbare Stuetzpunkte: ohne Speicher rund 30 %
  // bei einer Anlage, die den Jahresverbrauch gerade erzeugt, und rund 66 %
  // in der Konstellation des Rechenbeispiels auf /photovoltaik/
  // (10 kWp, 8 kWh Speicher, 4.500 kWh Verbrauch). Der Deckel bei knapp
  // 70 % ist Absicht - hoehere Jahreswerte traegt der Winter nicht.
  function autarkie(ertrag,verbrauch,speicher){
    const r=ertrag/verbrauch;
    const a0=0.439*(1-Math.exp(-1.15*r));
    const c=speicher/(verbrauch/1000);
    const g=0.446*(1-Math.exp(-2.0*c))*Math.min(1,r);
    return Math.min(0.92,a0+g*(1-a0));
  }

  let investBeruehrt=false;
  function pvVorschlag(){
    const kwp=num('rp-kwp',10);
    const sp=num('rp-speicher',0);
    return Math.round((kwp*PREIS_KWP+(PREIS_SPEICHER[sp]||sp*600))/100)*100;
  }
  function pvInvestSetzen(){
    if(investBeruehrt)return;
    $('rp-invest').value=pvVorschlag();
  }

  function rechnePV(){
    const verbrauch=num('rp-verbrauch',0);
    const preis=num('rp-preis',0.35);
    const kwp=num('rp-kwp',0);
    const spez=num('rp-ausrichtung',950);
    const speicher=num('rp-speicher',0);
    const hinweise=[];

    if(!(verbrauch>0)||!(kwp>0)){
      $('rp-amort').textContent='–';
      $('rp-amort-sub').textContent='Bitte Verbrauch und Anlagengröße eintragen.';
      hinweiseAus('rp-hinweise',[]);
      return;
    }

    const invest=Math.max(0,num('rp-invest',pvVorschlag()));
    const ertrag=kwp*spez;
    const quote=autarkie(ertrag,verbrauch,speicher);
    const eigen=Math.min(verbrauch*quote,ertrag*0.9);
    const eingespeist=Math.max(0,ertrag-eigen);
    const gespart=eigen*preis;
    const erloes=eingespeist*VERGUETUNG;
    const betrieb=Math.max(BETRIEB_MIN,invest*BETRIEB_ANTEIL);
    const vorteil=gespart+erloes-betrieb;
    // Ueber 20 Jahre mit mittlerem Leistungsverlust der Module
    const mittel=1-DEGRADATION*(JAHRE-1)/2;
    const summe20=(gespart+erloes)*mittel*JAHRE-betrieb*JAHRE-invest;
    const amort=jahre(invest/vorteil);

    $('rp-amort').textContent=amort?nf(amort,1).replace(',0','')+' Jahren':'–';
    $('rp-amort-sub').textContent=amort
      ? 'Danach bleiben rund '+eur(vorteil)+' im Jahr übrig. Module halten typischerweise 25 bis 30 Jahre.'
      : 'Mit diesen Werten rechnet sich die Anlage rechnerisch nicht innerhalb von 40 Jahren. Prüfen Sie Investition, Verbrauch und Strompreis.';
    $('rp-ertrag').textContent=nf(ertrag)+' kWh';
    $('rp-eigen').textContent=nf(eigen)+' kWh';
    $('rp-autarkie').textContent=nf(quote*100)+' % aus eigener Sonne';
    $('rp-sparen').textContent=eur(gespart)+'/Jahr';
    $('rp-erloes').textContent=eur(erloes)+'/Jahr';
    $('rp-betrieb').textContent='− '+eur(betrieb)+'/Jahr';
    $('rp-vorteil').textContent=eur(vorteil)+'/Jahr';
    $('rp-invest-out').textContent=eur(invest);
    $('rp-20').textContent=(summe20>=0?'+ ':'− ')+eur(Math.abs(summe20));
    $('rp-invest-hint').textContent='Vorschlag aus unserer Preisübersicht: '+eur(pvVorschlag())+
      ' für '+nf(kwp,1).replace(',0','')+' kWp'+(speicher?' mit '+speicher+' kWh Speicher':' ohne Speicher')+'.';

    const rel=ertrag/verbrauch;
    if(rel<0.8)hinweise.push(['info','Die Anlage erzeugt weniger, als Sie verbrauchen. Zusätzliche Module kosten anteilig wenig, weil Gerüst, Montage und Anschluss ohnehin anfallen – im Zweifel lieber ein paar Module mehr aufs Dach.']);
    if(rel>2.6)hinweise.push(['info','Die Anlage erzeugt ein Vielfaches Ihres Verbrauchs. Der Überschuss geht zu 7,7 Cent ins Netz statt 35 Cent zu sparen. Sinnvoll wird das vor allem mit Wärmepumpe oder E-Auto.']);
    if(speicher>0&&speicher/(verbrauch/1000)>2.2)hinweise.push(['warn','Der Speicher ist im Verhältnis zum Verbrauch groß. Als Richtwert gilt etwa 1 kWh je 1.000 kWh Jahresstromverbrauch. Ein Speicher, der im Sommer nie leer wird, verdient sein Geld nicht zurück.']);
    if(speicher===0)hinweise.push(['info','Ohne Speicher decken Sie vor allem den Tagesverbrauch. Ein Speicher hebt den Eigenverbrauch deutlich, kostet aber auch – probieren Sie beide Varianten durch.']);
    hinweise.push(['info','Nicht enthalten: steigende Strompreise und ein E-Auto. Beide würden das Ergebnis verbessern. Enthalten sind dagegen Betriebskosten und Leistungsverlust der Module.']);
    hinweiseAus('rp-hinweise',hinweise);
  }

  /* ------------------------------------------------------ Wärmepumpe */

  function rechneWP(){
    const t=TRAEGER[$('rw-traeger').value]||TRAEGER['gas-kwh'];
    const menge=num('rw-menge',0);
    const preisAlt=num('rw-preis-alt',0);
    const vl=num('rw-vl',55);
    const preisStrom=num('rw-preis-strom',0.26);
    const invest=Math.max(0,num('rw-invest',28000));
    const hinweise=[];

    $('rw-preis-alt-unit').textContent=t.einheit;

    if(!(menge>0)||!(preisAlt>0)){
      $('rw-amort').textContent='–';
      $('rw-amort-sub').textContent='Bitte Verbrauch und Preis Ihrer heutigen Heizung eintragen.';
      hinweiseAus('rw-hinweise',[]);
      return;
    }

    const waerme=menge*t.kwh*t.eta;
    let jaz=(JAZ_VL[vl]||3.0)-0.2;          // 0,2 Abzug für die Warmwasserbereitung
    jaz=Math.min(4.6,Math.max(2.3,jaz));
    const strom=waerme/jaz;
    const kostenAlt=menge*preisAlt;
    const kostenNeu=strom*preisStrom;
    const ersparnis=kostenAlt-kostenNeu;

    // --- Förderung nach KfW 458 ---
    const selbst=num('rw-selbst',1)===1;
    const altOK=num('rw-alt',0)===1;
    const kinder=Math.max(0,num('rw-kinder',0));
    const zveRaw=parseFloat($('rw-zve').value);
    const zveDa=isFinite(zveRaw)&&zveRaw>0;
    const zve=zveDa?Math.max(0,zveRaw-kinder*10000):null;

    let quote=30;
    if(selbst&&altOK)quote+=16;
    if(selbst&&zveDa){
      if(zve<=30000)quote+=40; else if(zve<=40000)quote+=30; else if(zve<=50000)quote+=10;
    }
    const vorDeckel=quote;
    const deckel=(selbst&&zveDa&&zve<=30000)?MAX_QUOTE:REGEL_QUOTE;
    quote=Math.min(deckel,quote);
    const zuschuss=Math.min(invest,MAX_KOSTEN)*quote/100;
    const eigen=invest-zuschuss;

    const amort=jahre(eigen/ersparnis);
    // Gegenrechnung: der alte Kessel muss ohnehin ersetzt werden. Eine neue
    // Gasheizung kostet eingebaut rund 10.000 € - diese Ausgabe spart man
    // durch die Waermepumpe ebenfalls.
    const ohnehin=10000;
    const amortGegen=jahre(Math.max(0,eigen-ohnehin)/ersparnis);

    $('rw-amort').textContent=amort?nf(amort,1).replace(',0','')+' Jahren':'–';
    $('rw-amort-sub').innerHTML=amort
      ? 'Gegengerechnet mit einer ohnehin fälligen neuen Heizung (rund '+eur(ohnehin)+'): <b>'+
        (amortGegen?nf(amortGegen,1).replace(',0','')+' Jahre':'sofort')+'</b>.'
      : 'Mit diesen Werten spart die Wärmepumpe rechnerisch nichts. Das liegt fast immer an einer hohen Vorlauftemperatur oder an einem günstigen Altvertrag.';
    $('rw-alt-kosten').textContent=eur(kostenAlt)+'/Jahr';
    $('rw-neu-kosten').textContent=eur(kostenNeu)+'/Jahr';
    $('rw-ersparnis').textContent=(ersparnis>=0?'':'− ')+eur(Math.abs(ersparnis))+'/Jahr';
    $('rw-jaz').textContent=nf(jaz,1);
    $('rw-strom').textContent=nf(strom)+' kWh/Jahr';
    $('rw-quote').textContent=nf(quote)+' %';
    $('rw-zuschuss').textContent=eur(zuschuss);
    $('rw-eigen').textContent=eur(eigen);
    $('rw-20').textContent=eur(ersparnis*JAHRE);

    if(vl>=55)hinweise.push(['warn','Bei '+vl+' °C Vorlauf arbeitet eine Luft-Wasser-Wärmepumpe noch, aber unwirtschaftlich. Größere Heizkörper in wenigen Räumen und ein hydraulischer Abgleich bringen die Vorlauftemperatur oft um 10 bis 15 °C herunter – das ist meist die günstigste Maßnahme überhaupt. Stellen Sie oben einmal 45 °C ein und vergleichen Sie.']);
    if(!selbst)hinweise.push(['info','Klimageschwindigkeits- und Einkommensbonus gibt es nur für selbstnutzende Eigentümer. Gerechnet ist deshalb nur die Grundförderung.']);
    else if(!zveDa)hinweise.push(['info','Ohne Angabe zum Haushaltseinkommen fehlt der Einkommensbonus. Bis 50.000 € zu versteuerndem Einkommen kommen 10 bis 40 Prozentpunkte dazu.']);
    if(vorDeckel>deckel)hinweise.push(['info','Die Boni summieren sich auf '+vorDeckel+' %. Gefördert werden in Ihrem Fall höchstens '+deckel+' %'+(deckel===REGEL_QUOTE?' – die 80 % gibt es nur bis 30.000 € anzusetzendem Einkommen.':'.')]);
    if(invest>MAX_KOSTEN)hinweise.push(['info','Gefördert werden höchstens '+eur(MAX_KOSTEN)+' für die erste Wohneinheit. Was darüber liegt, zahlen Sie voll.']);
    hinweise.push(['info','Nicht enthalten: steigende Gas- und Ölpreise. Ab 2027 wird der CO₂-Preis für Gebäude im europäischen Emissionshandel am Markt gebildet – wohin das führt, kann heute niemand seriös beziffern. Welche Größe zu Ihrem Haus passt, rechnet der <a href="/waermepumpen-rechner/">Wärmepumpen-Rechner</a>.']);
    hinweiseAus('rw-hinweise',hinweise);
  }

  /* ------------------------------------------------------ Umschalter */

  function zeige(welche){
    ['pv','wp'].forEach(k=>{
      const feld=$('rt-'+k), knopf=$('rt-tab-'+k), an=(k===welche);
      feld.hidden=!an;
      knopf.classList.toggle('is-on',an);
      knopf.setAttribute('aria-selected',an?'true':'false');
    });
    if(location.hash!=='#'+welche)history.replaceState(null,'',location.pathname+'#'+welche);
  }
  document.querySelectorAll('.rt-tab').forEach(b=>b.addEventListener('click',()=>zeige(b.dataset.rt)));
  if(location.hash==='#wp')zeige('wp');

  // Preisvorschlag nur so lange nachführen, wie niemand von Hand eingreift
  $('rp-invest').addEventListener('input',()=>{investBeruehrt=true;});
  ['rp-kwp','rp-speicher'].forEach(id=>$(id).addEventListener('input',()=>{pvInvestSetzen();rechnePV();}));
  ['rp-verbrauch','rp-preis','rp-ausrichtung','rp-invest'].forEach(id=>$(id).addEventListener('input',rechnePV));
  ['rw-traeger','rw-menge','rw-preis-alt','rw-vl','rw-preis-strom','rw-invest',
   'rw-selbst','rw-alt','rw-zve','rw-kinder'].forEach(id=>$(id).addEventListener('input',rechneWP));
  $('rw-traeger').addEventListener('change',()=>{
    const t=TRAEGER[$('rw-traeger').value];
    if(t)$('rw-preis-alt').value=t.preis;
    rechneWP();
  });

  pvInvestSetzen();
  rechnePV();
  rechneWP();
  })();


  // ---------- Angebots-Check: sanftes Scrollen zum Formular ----------
  document.querySelectorAll('[data-scrollto]').forEach(el=>el.addEventListener('click',(e)=>{
    e.preventDefault();
    const t=document.getElementById(el.dataset.scrollto);
    if(t)t.scrollIntoView({behavior:'smooth',block:'start'});
  }));

  // ---------- Mobiles Menü (Burger) ----------
  // Die Gruppen "Leistungen", "Über uns" und "Kontakt" standen im Handy-Menü
  // dauerhaft offen: 20 Zeilen, 1114px hoch bei 844px Bildschirm. Man musste
  // im Menü scrollen, die letzten Punkte lagen unter der Schnellkontakt-Leiste.
  // Jetzt sind sie zugeklappt und öffnen auf Tipp - 9 Zeilen, passt aufs Bild.
  (function(){
    const navEl=document.querySelector('nav');
    const tgl=document.getElementById('nav-toggle');
    const links=document.getElementById('nav-links');
    if(!navEl||!tgl||!links)return;

    const handy=()=>window.matchMedia('(max-width:1099px)').matches;
    const gruppen=[...links.querySelectorAll('.nav-drop')];
    const label=g=>g.querySelector('.nav-drop-lbl');

    function setzeGruppe(g,auf){
      g.classList.toggle('open',auf);
      const l=label(g);
      if(l)l.setAttribute('aria-expanded',auf?'true':'false');
    }
    // Die Gruppe aufklappen, in der die gerade gezeigte Seite steht - sonst
    // sucht man seinen Standort in einer zugeklappten Liste.
    function aktiveGruppeOeffnen(){
      gruppen.forEach(g=>setzeGruppe(g,!!g.querySelector('.nav-sub a.active')));
    }

    let aufraeumen;
    const closeMenu=()=>{
      navEl.classList.remove('open');
      tgl.setAttribute('aria-expanded','false');
      tgl.setAttribute('aria-label','Menü öffnen');
      // erst nach dem Zufahren zuklappen, sonst ruckelt es sichtbar
      clearTimeout(aufraeumen);
      aufraeumen=setTimeout(()=>{if(!navEl.classList.contains('open'))gruppen.forEach(g=>setzeGruppe(g,false));},360);
    };

    tgl.addEventListener('click',()=>{
      const open=navEl.classList.toggle('open');
      tgl.setAttribute('aria-expanded',open?'true':'false');
      tgl.setAttribute('aria-label',open?'Menü schließen':'Menü öffnen');
      if(open){clearTimeout(aufraeumen);aktiveGruppeOeffnen();}
    });

    // Tipp auf eine Gruppenzeile klappt nur auf/zu, statt zu navigieren.
    // Muss in der Capture-Phase abgefangen werden: "Über uns" und "Kontakt"
    // sind <a data-nav> und haengen schon am globalen Navigations-Handler.
    links.addEventListener('click',(e)=>{
      if(!handy())return;
      const l=e.target.closest('.nav-drop-lbl');
      if(!l||!links.contains(l))return;
      e.preventDefault();
      e.stopPropagation();
      const g=l.closest('.nav-drop');
      setzeGruppe(g,!g.classList.contains('open'));
    },true);

    // Gruppenzeilen auch mit der Tastatur bedienbar machen
    gruppen.forEach(g=>{
      const l=label(g);
      if(!l)return;
      l.setAttribute('aria-expanded','false');
      if(!l.hasAttribute('tabindex'))l.setAttribute('tabindex','0');
      l.addEventListener('keydown',(e)=>{
        if(!handy())return;
        if(e.key!=='Enter'&&e.key!==' ')return;
        e.preventDefault();
        setzeGruppe(g,!g.classList.contains('open'));
      });
    });

    // Menü schließen, wenn ein echter Link oder der CTA angeklickt wird
    document.querySelectorAll('#nav-links a:not(.nav-drop-lbl), .nav-cta').forEach(a=>a.addEventListener('click',closeMenu));
    // Schließen mit Escape
    document.addEventListener('keydown',(e)=>{if(e.key==='Escape')closeMenu();});
  })();

  // ---------- Angebots-Check: Danke-Meldung nach Upload ----------
  // FormSubmit leitet nach erfolgreichem Absenden per _next auf ?checkok=1 zurück.
  (function(){
    if(new URLSearchParams(location.search).get('checkok')!=='1')return;
    const form=document.getElementById('check-form-el');
    const done=document.getElementById('check-done');
    if(form)form.style.display='none';
    if(done)done.classList.add('show');
    trackLead('angebots-check');
    const anchor=document.getElementById('check-form');
    if(anchor)anchor.scrollIntoView({behavior:'smooth',block:'center'});
    history.replaceState(null,'',location.pathname);
  })();

  // ---------- Bestandsanlagen-Check: Danke-Meldung nach Upload ----------
  // Eigene Marke ?bestandok=1, damit sie sich nicht mit dem Angebots-Check
  // beisst. Steigt aus, wenn das Formular auf dieser Seite gar nicht steht.
  (function(){
    if(new URLSearchParams(location.search).get('bestandok')!=='1')return;
    const form=document.getElementById('bestand-form-el');
    const done=document.getElementById('bestand-done');
    if(!form||!done)return;
    form.style.display='none';
    done.classList.add('show');
    trackLead('bestandsanlagen-check');
    const anchor=document.getElementById('bestand-form');
    if(anchor)anchor.scrollIntoView({behavior:'smooth',block:'center'});
    history.replaceState(null,'',location.pathname);
  })();

  // ---------- Terminkalender ----------
  // Reine Anzeige im Browser, kein Server dahinter. Die Anfrage geht per
  // FormSubmit an uns und wird von Hand bestaetigt.
  (function(){
    const grid=document.getElementById('cal-grid');
    if(!grid)return;

    const monatLbl=document.getElementById('cal-monat');
    const slotBox=document.getElementById('slots');
    const slotTitel=document.getElementById('slots-titel');
    const slotSub=document.getElementById('slots-sub');
    const feld=document.getElementById('t-termin');
    const gewaehltTxt=document.getElementById('t-gewaehlt');
    const gewaehltBox=document.getElementById('t-gewaehlt-box');
    const warnung=document.getElementById('t-warnung');
    const btnPrev=document.querySelector('[data-cal-prev]');
    const btnNext=document.querySelector('[data-cal-next]');
    const formular=document.getElementById('termin-form-el');

    const TAGE=['Sonntag','Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag'];
    const MONATE=['Januar','Februar','März','April','Mai','Juni','Juli','August',
                  'September','Oktober','November','Dezember'];

    const heute=new Date(); heute.setHours(0,0,0,0);
    const letzterTag=new Date(heute); letzterTag.setDate(letzterTag.getDate()+30);
    const ersterMonat=new Date(heute.getFullYear(),heute.getMonth(),1);

    let sicht=new Date(ersterMonat);
    let tagWahl=null, zeitWahl=null;

    const key=d=>d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate();
    const uhr=m=>String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0');

    /* Deterministischer Streuwert aus einem Text (FNV-1a + Streuschritt).
     * Wichtig: derselbe Tag ergibt IMMER dieselben belegten Zeiten. Mit
     * echtem Zufall wuerden bei jedem Neuladen andere Zeiten belegt sein –
     * das faellt sofort auf und wirkt unseriös. */
    function streu(text){
      let h=2166136261;
      for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619);}
      h^=h>>>15; h=Math.imul(h,2246822507); h^=h>>>13;
      return (h>>>0)/4294967296;
    }

    /* Gesetzliche Feiertage. Der Kalender reicht nur 30 Tage voraus, trotzdem
     * hat ein buchbarer Termin am 3. Oktober oder am zweiten Weihnachtstag
     * frueher oder spaeter jeden getroffen. Beruecksichtigt sind die
     * bundeseinheitlichen Feiertage, der Berliner Frauentag (Sitz Berlin)
     * sowie Heiligabend und Silvester - beides zwar keine Feiertage, aber
     * an beiden Tagen rufen wir niemanden an. */
    const osterCache={};
    function ostersonntag(j){
      if(osterCache[j])return osterCache[j];
      const a=j%19,b=Math.floor(j/100),c=j%100,d=Math.floor(b/4),e=b%4,
            f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),
            h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,
            l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),
            mon=Math.floor((h+l-7*m+114)/31),tag=((h+l-7*m+114)%31)+1;
      return (osterCache[j]=new Date(j,mon-1,tag));
    }
    const feierCache={};
    function feiertage(j){
      if(feierCache[j])return feierCache[j];
      const o=ostersonntag(j);
      const rel=off=>{const d=new Date(o);d.setDate(d.getDate()+off);return key(d)};
      return (feierCache[j]=new Set([
        j+'-1-1',      // Neujahr
        j+'-3-8',      // Internationaler Frauentag (Berlin)
        j+'-5-1',      // Tag der Arbeit
        j+'-10-3',     // Tag der Deutschen Einheit
        j+'-12-24', j+'-12-25', j+'-12-26', j+'-12-31',
        rel(-2),       // Karfreitag
        rel(1),        // Ostermontag
        rel(39),       // Christi Himmelfahrt
        rel(50)        // Pfingstmontag
      ]));
    }
    const istFeiertag=d=>feiertage(d.getFullYear()).has(key(d));

    /* Oeffnungszeiten: Mo–Mi 10–20 Uhr, Do–Fr 10–16 Uhr, Wochenende zu.
     * Freitags ist 12:30–14:30 Uhr fest gesperrt, an Feiertagen ganz zu. */
    function zeitenAm(d){
      const wt=d.getDay();
      if(wt===0||wt===6)return [];
      if(istFeiertag(d))return [];
      const ende=(wt<=3)?20*60:16*60;
      const liste=[];
      for(let m=10*60;m<ende;m+=30){
        if(wt===5&&m>=750&&m<870)continue;   // Freitag 12:30 bis 14:30
        liste.push(m);
      }
      return liste;
    }

    /* Rund 20 Prozent der Zeiten eines Tages als vergeben ausweisen –
     * genau so viele, nicht je Zeit einzeln gewuerfelt, sonst schwankt der
     * Anteil pro Tag stark. */
    function belegtAm(d,alle){
      const wieViele=Math.round(alle.length*0.2);
      return new Set(alle
        .map(m=>({m,r:streu(key(d)+'#'+m)}))
        .sort((a,b)=>a.r-b.r)
        .slice(0,wieViele)
        .map(x=>x.m));
    }

    /* Vergangene Zeiten fallen ganz weg. Fuer heute zusaetzlich zwei Stunden
     * Vorlauf, weil wir den Termin erst bestaetigen muessen. */
    function slotsAm(d){
      const alle=zeitenAm(d);
      if(!alle.length)return [];
      const weg=belegtAm(d,alle);
      const jetzt=new Date();
      const grenze=(key(d)===key(jetzt))?(jetzt.getHours()*60+jetzt.getMinutes()+120):-1;
      return alle.filter(m=>m>grenze).map(m=>({m,belegt:weg.has(m)}));
    }

    const hatFrei=d=>slotsAm(d).some(s=>!s.belegt);
    const imFenster=d=>d>=heute&&d<=letzterTag;

    function zeichneMonat(){
      monatLbl.textContent=MONATE[sicht.getMonth()]+' '+sicht.getFullYear();
      grid.innerHTML='';
      const vorlauf=(new Date(sicht.getFullYear(),sicht.getMonth(),1).getDay()+6)%7;
      for(let i=0;i<vorlauf;i++)grid.appendChild(document.createElement('span'));
      const anzahl=new Date(sicht.getFullYear(),sicht.getMonth()+1,0).getDate();
      for(let t=1;t<=anzahl;t++){
        const d=new Date(sicht.getFullYear(),sicht.getMonth(),t);
        const b=document.createElement('button');
        b.type='button'; b.className='cal-tag'; b.textContent=t;
        const frei=imFenster(d)&&hatFrei(d);
        b.disabled=!frei;
        b.setAttribute('aria-label',t+'. '+MONATE[d.getMonth()]+(frei?' – Termine frei':' – keine Termine'));
        if(tagWahl&&key(tagWahl)===key(d))b.classList.add('is-sel');
        if(frei)b.addEventListener('click',()=>{tagWahl=d;zeitWahl=null;zeichneMonat();zeichneSlots();});
        grid.appendChild(b);
      }
      btnPrev.disabled=new Date(sicht.getFullYear(),sicht.getMonth(),1)<=ersterMonat;
      btnNext.disabled=new Date(sicht.getFullYear(),sicht.getMonth()+1,1)>letzterTag;
    }

    function zeichneSlots(){
      slotBox.innerHTML='';
      if(!tagWahl){
        slotTitel.textContent='Bitte zuerst einen Tag wählen';
        slotSub.textContent='Alle Zeiten in 30-Minuten-Schritten.';
        slotBox.innerHTML='<p class="slots-leer">Sobald Sie im Kalender einen Tag antippen, erscheinen hier die freien Zeiten.</p>';
        setzeFeld(); return;
      }
      slotTitel.textContent=TAGE[tagWahl.getDay()]+', '+String(tagWahl.getDate()).padStart(2,'0')+'. '+MONATE[tagWahl.getMonth()];
      const liste=slotsAm(tagWahl);
      const frei=liste.filter(s=>!s.belegt).length;
      slotSub.textContent=frei===1?'Nur noch 1 freie Zeit an diesem Tag.':frei+' freie Zeiten an diesem Tag.';
      liste.forEach(s=>{
        const b=document.createElement('button');
        b.type='button'; b.className='slot'; b.textContent=uhr(s.m);
        if(s.belegt){b.disabled=true;b.setAttribute('aria-label',uhr(s.m)+' Uhr – bereits vergeben');}
        else{
          b.setAttribute('aria-label',uhr(s.m)+' Uhr auswählen');
          if(zeitWahl===s.m)b.classList.add('is-sel');
          b.addEventListener('click',()=>{zeitWahl=s.m;zeichneSlots();});
        }
        slotBox.appendChild(b);
      });
      setzeFeld();
    }

    function setzeFeld(){
      if(tagWahl&&zeitWahl!==null){
        const d=tagWahl;
        feld.value=TAGE[d.getDay()]+', '+String(d.getDate()).padStart(2,'0')+'.'+
          String(d.getMonth()+1).padStart(2,'0')+'.'+d.getFullYear()+' um '+uhr(zeitWahl)+' Uhr';
        gewaehltTxt.textContent='Ihr Wunschtermin: '+feld.value;
        gewaehltBox.classList.add('gesetzt');
        warnung.hidden=true;
      }else{
        feld.value='';
        gewaehltTxt.textContent='Noch kein Termin gewählt';
        gewaehltBox.classList.remove('gesetzt');
      }
    }

    btnPrev.addEventListener('click',()=>{sicht=new Date(sicht.getFullYear(),sicht.getMonth()-1,1);zeichneMonat();});
    btnNext.addEventListener('click',()=>{sicht=new Date(sicht.getFullYear(),sicht.getMonth()+1,1);zeichneMonat();});

    /* Eingangsbestaetigung fuer den Kunden zusammensetzen. FormSubmit
     * verschickt den Inhalt von _autoresponse an die Adresse aus dem Feld
     * "email". Bewusst als EINGANGSbestaetigung formuliert: der Termin ist
     * erst fest, wenn beide Seiten bestaetigt haben. Wer hier "Ihr Termin
     * ist bestaetigt" schreibt, erzeugt genau das Missverstaendnis. */
    function baueBestaetigung(){
      const ziel=document.getElementById('t-autoresponse');
      if(!ziel)return;
      const art=(document.querySelector('input[name="Terminart"]:checked')||{}).value||'Telefontermin';
      ziel.value=
        'Guten Tag,\n\n'+
        'vielen Dank für Ihre Terminanfrage bei BHD – Beratung Heimenergie Deutschland.\n\n'+
        'Ihr Wunschtermin: '+(feld.value||'(nicht angegeben)')+'\n'+
        'Art des Termins: '+art+'\n\n'+
        'Bitte beachten Sie: Dieser Termin ist noch nicht fest gebucht. Wir prüfen den '+
        'Zeitpunkt und melden uns in der Regel am selben Werktag bei Ihnen – mit einer '+
        'Bestätigung oder einem Alternativvorschlag. Erst wenn Sie diese Bestätigung kurz '+
        'zurückbestätigen, ist der Termin fest eingetragen.\n\n'+
        'Das Telefongespräch ist für Sie kostenlos und unverbindlich.\n\n'+
        'Wenn es eilig ist, erreichen Sie uns direkt unter 0163 4440392.\n\n'+
        'Freundliche Grüße\n'+
        'Kürşat Yıldırım\n\n'+
        'BHD – Beratung Heimenergie Deutschland\n'+
        'Brotherhooddeen UG (haftungsbeschränkt)\n'+
        'Prinzenallee 44b, 13359 Berlin\n'+
        'Telefon 0163 4440392 · info@bhd-energie.de\n\n'+
        'Diese Nachricht wurde automatisch erzeugt.';
    }

    /* Ohne gewaehlten Termin nicht absenden – das Pflichtfeld ist versteckt,
     * die native Pruefung des Browsers greift dort nicht. */
    if(formular)formular.addEventListener('submit',e=>{
      if(!feld.value){
        e.preventDefault();
        warnung.hidden=false;
        document.getElementById('kalender').scrollIntoView({behavior:'smooth',block:'start'});
        return;
      }
      baueBestaetigung();
    });

    /* Ersten freien Tag vorauswaehlen, damit sofort Zeiten sichtbar sind. */
    for(let i=0;i<=30;i++){
      const d=new Date(heute); d.setDate(d.getDate()+i);
      if(hatFrei(d)){tagWahl=d;sicht=new Date(d.getFullYear(),d.getMonth(),1);break;}
    }
    zeichneMonat();
    zeichneSlots();
  })();

  // ---------- Cal.com: Buchungskalender erst auf Klick laden ----------
  // Zwei-Klick-Loesung: Ohne Zutun des Besuchers wird nichts von Cal.com
  // geladen und keine IP-Adresse uebertragen. Der Block steht nur auf der
  // Seite, wenn in build.js ein CAL_LINK hinterlegt ist.
  (function(){
    var knopf=document.getElementById('cal-start');
    if(!knopf)return;
    knopf.addEventListener('click',function(){
      var hinweis=document.getElementById('cal-laden');
      var platz=document.getElementById('cal-einbettung');
      if(hinweis)hinweis.hidden=true;
      if(platz)platz.hidden=false;
      // Einbettungscode von Cal.com
      (function(C,A,L){var p=function(a,ar){a.q.push(ar)};var d=C.document;C.Cal=C.Cal||function(){
        var cal=C.Cal;var ar=arguments;if(!cal.loaded){cal.ns={};cal.q=cal.q||[];
        d.head.appendChild(d.createElement('script')).src=A;cal.loaded=true;}
        if(ar[0]===L){var api=function(){p(api,arguments)};var namespace=ar[1];
        api.q=api.q||[];if(typeof namespace==='string'){cal.ns[namespace]=cal.ns[namespace]||api;
        p(cal.ns[namespace],ar);p(cal,['initNamespace',namespace]);}else p(cal,ar);return;}
        p(cal,ar);};})(window,'https://app.cal.com/embed/embed.js','init');
      Cal('init',{origin:'https://app.cal.com'});
      Cal('inline',{elementOrSelector:'#cal-einbettung',calLink:'',layout:'month_view'});
      Cal('ui',{layout:'month_view',hideEventTypeDetails:false});
      if(typeof trackLead==='function')trackLead('termin-kalender-geoeffnet');
    },{once:true});
  })();

  // ---------- Termin: Danke-Meldung nach dem Absenden ----------
  (function(){
    if(new URLSearchParams(location.search).get('terminok')!=='1')return;
    const form=document.getElementById('termin-form-el');
    const done=document.getElementById('termin-done');
    if(!form||!done)return;
    form.style.display='none';
    done.classList.add('show');
    trackLead('termin');
    const anchor=document.getElementById('kalender');
    if(anchor)anchor.scrollIntoView({behavior:'smooth',block:'center'});
    history.replaceState(null,'',location.pathname);
  })();
