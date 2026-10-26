/** Shared native DOM helpers. Visual tokens come from the source importer. */
import {CONTROL_DATA} from './control-data.js';
export function cpElement(tag, className, text) {
  const el=document.createElement(tag); if(className) el.className=className;
  if(text!==undefined) el.textContent=text; return el;
}
let cpSequence=0;
export function cpId(prefix='control'){return `cp-${prefix}-${++cpSequence}`;}
export function cpStyle(el, rules){Object.assign(el.style,rules||{});return el;}
export function cpVariant(family, p={}) {
  const v=CONTROL_DATA[family]?.find(v=>Object.entries(p).every(([k,x])=>v.p[k]===String(x)));
  if(!v) throw new RangeError(`Unknown ${family}: ${JSON.stringify(p)}`);return v;
}
export function cpIcon(name,size=20,color) {
  const key=CONTROL_DATA.icons[name]; if(!key) throw new RangeError(`Missing original icon: ${name}`);
  const el=cpElement('span',`cp-glyph ${key}`);el.setAttribute('aria-hidden','true');
  el.style.width=el.style.height=size+'px';if(color)el.style.color=color;return el;
}
export function cpTextNodes(n){return [n,...(n.children||[]).flatMap(cpTextNodes)].filter(x=>x.type==='TEXT');}
export function cpColor(n){return n.typo?.color||n.style?.backgroundColor||(n.children||[]).map(cpColor).find(Boolean);}
// Only small, non-interactive control glyphs are reconstructed as CSS shapes.
export function cpVisual(node) {
  const e=cpElement('span','cp-source-visual');e.setAttribute('aria-hidden','true');
  e.style.width=node.box.width+'px';e.style.height=node.box.height+'px';
  function draw(n,parent,top=false){
    if(!n.visible)return;
    const iconKey=CONTROL_DATA.icons[n.name];
    const el=iconKey?cpIcon(n.name,n.box.width,cpColor(n)):cpElement('span');
    if(iconKey)el.style.height=n.box.height+'px';
    else {cpStyle(el,n.style);if(n.type==='ELLIPSE')el.style.borderRadius='50%';}
    Object.assign(el.style,{position:'absolute',left:(top?0:n.box.x)+'px',top:(top?0:n.box.y)+'px',width:n.box.width+'px',height:n.box.height+'px',padding:'0'});
    parent.append(el);
    if(!iconKey)for(const c of n.children||[])if(c.type!=='TEXT')draw(c,el);
  }
  draw(node,e,true);return e;
}
export function cpFlash(el){el.classList.remove('cp-flash');void el.offsetWidth;el.classList.add('cp-flash');}
export function cpPopup(anchor,popup){
  const place=()=>{
    if(popup.hidden)return;
    popup.style.bottom='';popup.style.top='';popup.style.left='0';popup.style.right='';
    const r=anchor.getBoundingClientRect(),h=popup.getBoundingClientRect().height;
    if(innerHeight-r.bottom<h+8 && r.top>innerHeight-r.bottom){popup.style.bottom=anchor.offsetHeight+8+'px';popup.style.top='auto';}
    else popup.style.top=anchor.offsetTop+anchor.offsetHeight+8+'px';
    const right=popup.getBoundingClientRect().right;
    if(right>innerWidth-8){popup.style.left='auto';popup.style.right='0';}
  };
  const closeOutside=e=>{if(!anchor.parentElement.contains(e.target))popup.dispatchEvent(new Event('cp-dismiss'));};
  document.addEventListener('pointerdown',closeOutside);window.addEventListener('resize',place);
  return {place,destroy(){document.removeEventListener('pointerdown',closeOutside);window.removeEventListener('resize',place);}};
}
/** Native input owns keyboard/editing; the mirror shows mask spacing and segment selection. */
export function cpMaskMirror(input,shell,filledColor,maskColor){
  const mirror=cpElement('span','cp-mask-mirror');mirror.setAttribute('aria-hidden','true');shell.append(mirror);input.classList.add('cp-masked-input');
  function update(emptyPrefix=false,selection=null){
    mirror.replaceChildren();Object.assign(mirror.style,{fontFamily:input.style.fontFamily,fontSize:input.style.fontSize,fontWeight:input.style.fontWeight,lineHeight:input.style.lineHeight,letterSpacing:'0px',left:shell.style.paddingLeft||getComputedStyle(shell).paddingLeft,right:shell.style.paddingRight||getComputedStyle(shell).paddingRight});
    const value=input.value,bounds=selection?[0,selection[0],selection[1],value.length]:[0,value.length];
    for(let group=0;group<bounds.length-1;group++){
      const from=bounds[group],to=bounds[group+1];if(to<=from)continue;
      const wrapper=cpElement('span',selection&&group===1?'cp-mask-active':'');let offset=from;
      for(const run of value.slice(from,to).split(/(_+)/)){
        if(!run)continue;const span=cpElement('span',run.startsWith('_')?'cp-mask-empty':'cp-mask-value',run);span.dataset.start=offset;span.dataset.end=offset+run.length;offset+=run.length;
        span.style.color=run.startsWith('_')||emptyPrefix||input.disabled?maskColor:filledColor;wrapper.append(span);
      }
      mirror.append(wrapper);
    }
  }
  update.indexAt=x=>{
    const runs=[...mirror.querySelectorAll('[data-start]')];
    for(const run of runs){const r=run.getBoundingClientRect();if(x<r.left)return +run.dataset.start;if(x<=r.right)return +run.dataset.start+Math.min(run.textContent.length-1,Math.floor((x-r.left)/r.width*run.textContent.length));}
    return Math.max(0,input.value.length-1);
  };
  return update;
}
