import {CONTROL_DATA} from './control-data.js';
import {createField} from './field.js';
import {cpNormalizeOptions,cpDropdownSurface,cpOption,cpInlineAdd,cpListStatus} from './dropdown.js';
import {cpElement,cpId,cpStyle,cpIcon,cpPopup,cpVariant,cpVisual,cpTextNodes,cpScrollWithin} from './control-core.js';
export function createTokenField({options=[],value=[],allowCustom=false,onChange,onAdd,...config}={}){
  let items=cpNormalizeOptions(options),selected=new Set(value.map(String)),query='',opened=false,active=-1,shown=[],adding=false;
  const f=createField({...config,family:'TokensField',icon:()=>opened?'24 Linear / Angle - Up':'24 Linear / Angle - Down'});const {element,input,shell,accessory}=f;
  const row=cpElement('div','cp-token-row');shell.insertBefore(row,input);const popup=cpDropdownSurface();popup.id=cpId('tokens');popup.setAttribute('role','listbox');popup.setAttribute('aria-multiselectable','true');popup.setAttribute('aria-label',config.label||'Варианты');element.append(popup);
  input.setAttribute('role','combobox');input.setAttribute('aria-expanded','false');input.setAttribute('aria-autocomplete','list');input.setAttribute('aria-controls',popup.id);
  const position=cpPopup(shell,popup),size=config.size||'Md';
  const tokenData=(hidden=false,hover=false)=>CONTROL_DATA.TokenMarkup.find(x=>x.p.Size===size&&x.p.Type===(hidden?'Hidden':'Normal')&&x.p.Hover===(hover?'Yes':'No')).node;
  function token(o,hidden=false){
    const n=tokenData(hidden),geometry=tokenData(hidden,true),el=cpElement(hidden?'button':'span','cp-token'+(hidden?' cp-token-more':''));
    if(hidden){el.type='button';el.setAttribute('aria-label','Показать ещё '+o.label.slice(1)+' выбранных');el.addEventListener('click',()=>{input.focus();open();});}
    cpStyle(el,{...n.style,...cpTextNodes(n)[0].typo,height:n.box.height+'px',gap:geometry.layout.itemSpacing+'px',padding:geometry.style.padding});
    el.addEventListener('mouseenter',()=>{if(!input.disabled)cpStyle(el,tokenData(hidden,true).style);});el.addEventListener('mouseleave',()=>{if(!input.disabled)cpStyle(el,{...n.style,padding:geometry.style.padding});});
    const label=cpElement('span','cp-token-label',o.label);label.title=o.label;el.append(label);
    if(!hidden){const remove=cpElement('button');remove.type='button';remove.disabled=input.disabled;remove.setAttribute('aria-label','Удалить '+o.label);const icon=n.children.find(c=>c.name.includes('Cross'));remove.append(cpIcon('24 Linear / Cross - Large',icon?.box.width||16));remove.addEventListener('pointerdown',e=>e.preventDefault());remove.addEventListener('click',e=>{e.stopPropagation();const hadFocus=document.activeElement===remove;selected.delete(o.value);changed();if(hadFocus)row.querySelector('button')?.focus();});el.append(remove);}else el.disabled=input.disabled;
    return el;
  }
  const ordered=()=>[...items.filter(o=>selected.has(o.value)),...items.filter(o=>!selected.has(o.value))];
  function collapse(){
    row.replaceChildren();const chosen=ordered().filter(o=>selected.has(o.value));const show=!opened&&chosen.length;
    row.hidden=!show;input.classList.toggle('cp-token-input-collapsed',!!show);
    shell.style.paddingLeft=show?'6px':f.variant('Normal').body.style.padding.split(' ')[3];
    if(!show)return;
    const nodes=chosen.map(o=>token(o));row.append(...nodes);const width=row.clientWidth;if(!width)return;
    let used=0,visible=0;const more=token({label:'+'+chosen.length},true);row.append(more);const reserve=more.getBoundingClientRect().width+4;more.remove();
    for(let i=0;i<nodes.length;i++){const w=nodes[i].getBoundingClientRect().width;if(used+w+(i<nodes.length-1?reserve:0)>width)break;used+=w+4;visible++;}
    if(!visible)visible=1;nodes.slice(visible).forEach(n=>n.remove());
    if(visible<chosen.length){const more=token({label:'+'+(chosen.length-visible)},true);row.append(more);nodes[0].style.maxWidth=Math.max(20,width-more.getBoundingClientRect().width-4)+'px';nodes[0].style.flexShrink='1';}
  }
  function changed(){collapse();if(opened)render();onChange?.(ordered().filter(o=>selected.has(o.value)).map(o=>o.value));}
  function activate(i){active=i;popup.querySelectorAll('[role=option]').forEach((r,n)=>r.dataset.active=String(i===n));const current=popup.querySelector('[data-active=true]');if(current){input.setAttribute('aria-activedescendant',current.id);cpScrollWithin(popup,current);}else input.removeAttribute('aria-activedescendant');}
  function render(){
    const previous=shown[active];popup.replaceChildren();shown=ordered().filter(o=>(o.label.toLocaleLowerCase().startsWith(query.toLocaleLowerCase())||(o.description||'').toLocaleLowerCase().includes(query.toLocaleLowerCase())));
    shown.forEach((o,i)=>{const b=cpOption(o,{kind:'Icon'});b.id=cpId('token-option');b.setAttribute('role','option');b.setAttribute('aria-selected',String(selected.has(o.value)));b.tabIndex=-1;
      const mark=cpVisual(cpVariant('Checkbox',{Size:'Sm',State:'Normal',Toggle:selected.has(o.value)?'On':'Off',Description:'Off'}).visual);b.prepend(mark);b.addEventListener('pointerdown',e=>e.preventDefault());b.addEventListener('click',()=>toggle(o));b.addEventListener('mousemove',()=>activate(i));popup.append(b);});
    if(!shown.length)popup.append(cpListStatus('NotFound','Не найдено'));
    if(allowCustom){
      if(adding){
        const editor=cpInlineAdd({value:query,onSubmit(label){let existing=items.find(o=>o.label.toLocaleLowerCase()===label.toLocaleLowerCase());if(!existing){existing={value:label,label};items.unshift(existing);onAdd?.(existing);}selected.add(existing.value);query='';input.value='';adding=false;input.focus();changed();},onCancel(){adding=false;input.focus();render();}});
        popup.append(editor.element);requestAnimationFrame(()=>editor.input.focus());
      }else {const b=cpOption({label:'Добавить своё значение'},{kind:'AddNew',icon:'24 Linear / Plus'});b.style.color='#1a9cff';b.id=cpId('token-add');b.setAttribute('role','option');b.setAttribute('aria-selected','false');b.tabIndex=-1;b.addEventListener('pointerdown',e=>e.preventDefault());b.addEventListener('click',()=>{adding=true;render();position.place();});popup.append(b);shown.push({add:true});}
    }
    let next=previous&&!previous.add?shown.findIndex(o=>o.value===previous.value):-1;if(query&&next<0)next=shown.findIndex(o=>!o.add&&!o.disabled);if(query&&next<0)next=shown.findIndex(o=>o.add);activate(adding?-1:next);
  }
  function toggle(o){if(o.add){adding=true;render();position.place();return;}if(o.disabled)return;if(selected.has(o.value))selected.delete(o.value);else selected.add(o.value);changed();}
  function open(){if(input.disabled)return;opened=true;f.paint();row.hidden=true;input.classList.remove('cp-token-input-collapsed');shell.style.paddingLeft=f.variant('Normal').body.style.padding.split(' ')[3];popup.hidden=false;input.setAttribute('aria-expanded','true');render();position.place();}
  function close(){opened=false;active=-1;shown=[];adding=false;query='';input.value='';popup.hidden=true;input.setAttribute('aria-expanded','false');input.removeAttribute('aria-activedescendant');f.paint();collapse();}
  input.addEventListener('focus',open);input.addEventListener('click',open);input.addEventListener('input',()=>{query=input.value;active=0;open();});
  shell.addEventListener('click',e=>{if(!e.target.closest('button,.cp-field-accessory')){input.focus();open();}});accessory.addEventListener('pointerdown',e=>e.preventDefault());accessory.addEventListener('click',e=>{e.stopPropagation();if(opened)close();else{input.focus();open();}});accessory.style.cursor='pointer';
  input.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();close();}else if(e.key==='Enter'){e.preventDefault();if(opened&&shown[active])toggle(shown[active]);else if(!opened)open();}else if(['ArrowDown','ArrowUp'].includes(e.key)){e.preventDefault();if(!opened)open();activate(Math.max(0,Math.min(shown.length-1,active+(e.key==='ArrowDown'?1:-1))));}});
  element.addEventListener('focusout',e=>{if(element.contains(e.relatedTarget))return;requestAnimationFrame(()=>{if(!element.contains(document.activeElement))close();});});popup.addEventListener('cp-dismiss',close);
  let lastWidth=-1;const observer=new ResizeObserver(()=>{if(shell.clientWidth!==lastWidth){lastWidth=shell.clientWidth;collapse();}});observer.observe(shell,{box:'border-box'});requestAnimationFrame(collapse);
  return {...f,popup,open,close,setState(s){f.setState(s);if(s==='Disabled')close();collapse();},get value(){return ordered().filter(o=>selected.has(o.value)).map(o=>o.value);},setValue(v){selected=new Set(v.map(String));collapse();if(opened)render();},destroy(){observer.disconnect();position.destroy();element.remove();}};
}
