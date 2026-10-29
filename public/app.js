import {createField} from '/ui-kit/field.js';
import {createButton} from '/ui-kit/button.js';
import {createSiteIcon} from '/site-icons.js';

// Navigation controls and text actions use the same button factory as the examples.
function iconButton(name,ariaLabel){
 const button=createButton({use:'Transparent',type:'Icon',size:'Md',ariaLabel});
 const icon=createSiteIcon(name);icon.classList.add('cp-button-icon');button.querySelector('.cp-button-icon').replaceWith(icon);return button;
}
for(const original of document.querySelectorAll('.menu-toggle,.menu-close,.demo-reset,.ventilation-button')){
 const reset=original.classList.contains('demo-reset'),vent=original.classList.contains('ventilation-button');
 let button;
 if(reset||vent){
  button=createButton({use:'Secondary',type:'Link',size:'Sm',label:reset?'Сбросить пример':'Проветрить',leftIcon:vent,rightIcon:reset});
  const icon=createSiteIcon(reset?'reset':'wind');icon.classList.add('cp-button-icon');button.querySelector('.cp-button-icon').replaceWith(icon);
  if(vent){icon.classList.add('ventilation-icon');button.querySelector('.cp-button-label').classList.add('ventilation-label');}
 }else button=iconButton(original.classList.contains('menu-toggle')?'menu':'close',original.getAttribute('aria-label'));
 for(const attr of original.attributes)if(!['class','type'].includes(attr.name))button.setAttribute(attr.name,attr.value);
 button.classList.add(...original.classList);original.replaceWith(button);
}

const searchFields=new Map();
for(const form of document.querySelectorAll('.search-form')){
 const original=form.querySelector('input');
 const field=createField({size:form.dataset.size||'Md',label:'',ariaLabel:'Поиск по документации',placeholder:original.placeholder,width:'100%',clearable:true,leftIcon:'24 Linear / Search'});
 field.input.type='search';field.input.id=original.id;field.input.name='q';field.input.required=true;
 field.input.setAttribute('pattern',String.raw`.*\S.*`);
 form.noValidate=true;form.replaceChildren(field.element);searchFields.set(field.input.id,field);
 field.input.addEventListener('keydown',event=>{if(event.key==='Enter'&&!field.input.value.trim())event.preventDefault();});
 form.addEventListener('submit',event=>{const query=field.input.value.trim();if(!query){event.preventDefault();field.input.focus();return;}field.input.value=query;});
}

const menu=document.querySelector('#mobile-navigation');
const menuButton=document.querySelector('.menu-toggle');
menuButton?.addEventListener('click',()=>{menu.showModal();menuButton.setAttribute('aria-expanded','true');document.body.style.overflow='hidden';menu.querySelector('.menu-close').focus({preventScroll:true});});
const desktopNavigation=matchMedia('(min-width: 1100px)');
desktopNavigation.addEventListener('change',event=>{if(event.matches&&!document.body.classList.contains('home-page')&&menu.open)menu.close();});
function closeMenu(){menu.close();}
menu?.querySelector('.menu-close').addEventListener('click',closeMenu);
menu?.addEventListener('click',e=>{if(e.target===menu){const b=menu.getBoundingClientRect();if(e.clientX<b.left||e.clientX>b.right||e.clientY<b.top||e.clientY>b.bottom)closeMenu();}});
menu?.addEventListener('close',()=>{menuButton.setAttribute('aria-expanded','false');document.body.style.overflow='';menuButton.focus();});
window.addEventListener('keydown',e=>{if((e.key==='k'&&(e.metaKey||e.ctrlKey))||(e.key==='/'&&!/INPUT|TEXTAREA/.test(document.activeElement?.tagName))){e.preventDefault();const input=document.querySelector('#site-search,#home-search');if(input&&input.getBoundingClientRect().width>0)input.focus();else{menuButton.click();menu.querySelector('input').focus();}}});
const headings=[...document.querySelectorAll('.prose h2,.prose h3')];
if(headings.length&&'IntersectionObserver' in window){let visible=new Set();const observer=new IntersectionObserver(entries=>{for(const e of entries){if(e.isIntersecting)visible.add(e.target);else visible.delete(e.target);}const active=headings.find(h=>visible.has(h));if(active){document.querySelectorAll('.toc a').forEach(a=>{if(decodeURIComponent(a.hash.slice(1))===active.id)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});}},{rootMargin:'-100px 0px -55% 0px',threshold:0});headings.forEach(h=>observer.observe(h));}
document.querySelectorAll('.mobile-toc a').forEach(a=>a.addEventListener('click',()=>document.querySelector('.mobile-toc').open=false));

const results=document.querySelector('#search-results');
if(results){
 const field=document.querySelector('#content-search');
 const status=document.querySelector('#search-status');
 const topField=document.querySelector('#site-search');
 const normalize=s=>s.toLocaleLowerCase('ru').replace(/ё/g,'е');
 const query=new URL(location.href).searchParams.get('q')||'';
 searchFields.get('content-search').setValue(query);if(topField)searchFields.get('site-search').setValue(query);
 let indexPromise=fetch('/search-index.json').then(r=>{if(!r.ok)throw Error('Search unavailable');return r.json();});
 function highlight(text,terms){const fragment=document.createDocumentFragment();const norm=normalize(text);let pos=0;while(pos<text.length){let start=text.length,term='';for(const t of terms){const hit=norm.indexOf(t,pos);if(hit>=0&&hit<start){start=hit;term=t;}}fragment.append(document.createTextNode(text.slice(pos,start)));if(!term)break;const mark=document.createElement('mark');mark.textContent=text.slice(start,start+term.length);fragment.append(mark);pos=start+term.length;}return fragment;}
 let revision=0;
 async function search(){const own=++revision;const q=field.value.trim();if(topField)searchFields.get('site-search').setValue(q);const url=new URL(location.href);q?url.searchParams.set('q',q):url.searchParams.delete('q');history.replaceState({},'',url);results.replaceChildren();if(!q){status.textContent='Введите слово или фразу, например «маска» или «потеря фокуса».';return;}
 status.textContent='Ищем в документации…';
 try{const data=await indexPromise;if(own!==revision)return;const terms=normalize(q).split(/\s+/).filter(Boolean);const matches=[];
 for(const article of data){const title=normalize(article.title+' '+article.alias);const text=normalize(article.sections.map(s=>s.heading+' '+s.text).join(' '));if(!terms.every(t=>title.includes(t)||text.includes(t)))continue;let best=null,bestScore=-1;for(const section of article.sections){const sectionText=normalize(section.heading+' '+section.text);const score=terms.reduce((n,t)=>n+(sectionText.includes(t)?1:0),0)+(terms.some(t=>normalize(section.heading).includes(t))?1:0);if(score>bestScore){best=section;bestScore=score;}}
 const titleScore=terms.every(t=>title.includes(t))?10:0;matches.push({article,section:best,score:titleScore+bestScore});}
 matches.sort((a,b)=>b.score-a.score||a.article.title.localeCompare(b.article.title,'ru'));
 status.textContent=`По запросу «${q}» найдено статей: ${matches.length}`;
 if(!matches.length){const empty=document.createElement('div');empty.className='search-empty';const h=document.createElement('h2');h.textContent='Ничего не найдено';const p=document.createElement('p');p.textContent='Попробуйте другое слово или более короткий запрос. Можно искать по названию компонента или правилу его использования.';const a=document.createElement('a');a.href='/';a.textContent='Посмотреть все материалы';a.append(createSiteIcon('right'));empty.append(h,p,a);results.append(empty);return;}
 for(const {article,section,score}of matches){const link=document.createElement('a');link.className='search-result';link.href=(article.url||`/docs/${article.slug}/`)+(score<10&&section?.id?`#${section.id}`:'');const meta=document.createElement('div');meta.className='result-meta';meta.textContent=article.category+(score<10&&section?.id?' / '+section.heading:'');const title=document.createElement('h2');title.append(highlight(article.title,terms));const p=document.createElement('p');const text=section?.text||article.description;const norm=normalize(text);const first=Math.min(...terms.map(t=>norm.indexOf(t)).filter(n=>n>=0));const start=Number.isFinite(first)?Math.max(0,first-65):0;const snippet=(start?'…':'')+text.slice(start,start+230)+(text.length>start+230?'…':'');p.append(highlight(snippet,terms));link.append(meta,title,p);results.append(link);}
 }catch{status.textContent='Не удалось загрузить поиск.';const p=document.createElement('p');p.append('Обновите страницу или откройте ');const a=document.createElement('a');a.href='/';a.textContent='каталог статей';p.append(a,'.');results.append(p);}}
 field.closest('form').addEventListener('submit',e=>{e.preventDefault();search();});
 let timer;field.addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(search,120);});
 search();
}

// Playback rate preserves the current angle while the gears accelerate and coast down.
const ventilationButton=document.querySelector('.ventilation-button');
if(ventilationButton&&typeof Animation!=='undefined'&&Animation.prototype.updatePlaybackRate){
 const label=ventilationButton.querySelector('.ventilation-label');
 const status=document.querySelector('.ventilation-status');
 const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
 let frame=0,animations=[],running=false;
 const smooth=t=>t*t*(3-2*t);
 function finish(){
  cancelAnimationFrame(frame);frame=0;
  for(const animation of animations)if(animation.playState!=='idle')animation.updatePlaybackRate(1);
  animations=[];running=false;ventilationButton.disabled=false;ventilationButton.removeAttribute('aria-busy');
  label.textContent='Проветрить';status.textContent='';
 }
 ventilationButton.hidden=false;
 ventilationButton.addEventListener('click',()=>{
  if(running||reducedMotion.matches)return;
  animations=[...document.querySelectorAll('.gear-rotor')].flatMap(gear=>gear.getAnimations());
  if(!animations.length)return;
  running=true;ventilationButton.disabled=true;ventilationButton.setAttribute('aria-busy','true');
  label.textContent='Проветриваем…';status.textContent='Проветривание началось. Шестерёнки ускорятся на пять секунд.';
  const start=performance.now();
  function tick(now){
   const elapsed=now-start;
   if(elapsed>=5000){finish();status.textContent='Проветрено. Шестерёнки снова вращаются медленно.';return;}
   const envelope=elapsed<700?smooth(elapsed/700):elapsed<2700?1:1-smooth((elapsed-2700)/2300);
   for(const animation of animations)animation.updatePlaybackRate(1+59*envelope);
   frame=requestAnimationFrame(tick);
  }
  frame=requestAnimationFrame(tick);
 });
 reducedMotion.addEventListener('change',finish);
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&running)finish();});
 window.addEventListener('pagehide',finish);
}
