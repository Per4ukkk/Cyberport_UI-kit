import {CONTROL_DATA} from './control-data.js';
import {createField} from './field.js';
import {cpElement,cpId,cpStyle,cpIcon,cpPopup,cpTextNodes,cpScrollWithin} from './control-core.js';
import {createButton} from './button.js';
export function cpNormalizeOptions(options){return options.map(o=>typeof o==='string'?{value:o,label:o}:{...o,value:String(o.value)});}
export function cpDropdownSurface(){const n=CONTROL_DATA.DropdownMarkup.find(x=>x.p.Type==='Normal').node;const popup=cpElement('div','cp-popup cp-options');cpStyle(popup,n.style);popup.hidden=true;return popup;}
function dropdownRow(kind){
  if(kind==='Normal')return CONTROL_DATA.DropdownMarkup.find(x=>x.p.Type==='Normal').node.children[0].children[0];
  const name=kind==='Icon'?'Loading':kind;
  const node=CONTROL_DATA.DropdownMarkup.flatMap(x=>x.node.children).find(x=>x.name===name);
  if(!node)throw new RangeError('Missing dropdown row markup: '+kind);return node;
}
export function cpOption(option,{kind='Normal',icon}={}){
  const item=cpElement('button','cp-list-option');item.type='button';
  const n=dropdownRow(kind==='Normal'&&icon?'Icon':kind);
  const typography=cpTextNodes(kind==='Normal'||kind==='Icon'?dropdownRow('Normal'):n)[0].typo;
  cpStyle(item,{...n.style,...typography});item.style.gap=n.layout.itemSpacing+'px';item.dataset.markupId=n.id;
  item.disabled=!!option.disabled;const copy=cpElement('span','cp-list-option-copy'),label=cpElement('span','',option.label);copy.append(label);
  if(option.description)copy.append(cpElement('span','cp-list-description',option.description));
  if(icon)item.append(cpIcon(icon,20));item.append(copy);return item;
}
export function cpListStatus(kind,label){
  const n=dropdownRow(kind),status=cpElement('div','cp-list-status');status.setAttribute('role','status');status.dataset.markupId=n.id;
  cpStyle(status,{...n.style,...cpTextNodes(n)[0].typo});status.style.gap=n.layout.itemSpacing+'px';
  if(kind==='Loading'){const spin=cpIcon('24 Linear / Spinner - Alt',20);spin.classList.add('cp-spin');status.append(spin);}
  status.append(cpElement('span','',label));return status;
}
/** Shared inline creation row, built from the real Sm field and square Sm button. */
export function cpInlineAdd({value='',onSubmit,onCancel}={}){
  const element=cpElement('div','cp-token-add');element.setAttribute('role','group');element.setAttribute('aria-label','Добавление значения');
  const field=createField({size:'Sm',label:'',ariaLabel:'Новый вариант',placeholder:'Введите свой вариант',width:'100%',value});
  const submit=()=>{const label=field.value.trim();if(label)onSubmit(label);else field.input.focus();};
  const button=createButton({use:'Primary',type:'Icon',size:'Sm',ariaLabel:'Добавить вариант',onClick:submit});
  button.querySelector('.cp-button-icon').replaceWith(cpIcon('24 Linear / Arrow - Up - Right right',16));element.append(field.element,button);
  field.input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();e.stopPropagation();submit();}if(e.key==='Escape'){e.preventDefault();e.stopPropagation();onCancel?.();}});
  return {element,input:field.input};
}
export function createSelect(options={}){return createDropdown(false,options);}
export function createCombobox(options={}){return createDropdown(true,options);}
function createDropdown(editable,{options=[],value='',autocomplete=false,allowCustom=false,favorites=[],onAdd,onRetry,onChange,loadOptions,...config}={}){
  let items=cpNormalizeOptions(options),selected=items.find(o=>o.value===String(value)),query='',active=-1,shown=[],opened=false,loadState='ready',request=0,disposed=false,adding=false;
  const f=createField({...config,family:editable?'Combobox':'Select',readOnly:!editable,value:selected?.label||(editable?value:''),icon:editable&&autocomplete?undefined:()=>opened?'24 Linear / Angle - Up':'24 Linear / Angle - Down'});
  const {element,input,shell,accessory}=f;input.classList.toggle('cp-select-value',!editable);
  const popup=cpDropdownSurface();popup.id=cpId('options');popup.setAttribute('role','listbox');popup.setAttribute('aria-label',config.label||'Варианты');element.append(popup);
  input.setAttribute('role','combobox');input.setAttribute('aria-haspopup','listbox');input.setAttribute('aria-expanded','false');input.setAttribute('aria-controls',popup.id);input.setAttribute('aria-autocomplete',editable?'list':'none');
  const position=cpPopup(shell,popup);
  function arrow(){const g=accessory.querySelector('.cp-glyph');if(g&&!autocomplete){g.className=cpIcon(opened?'24 Linear / Angle - Up':'24 Linear / Angle - Down',20).className;}}
  function close(){opened=false;adding=false;popup.hidden=true;input.setAttribute('aria-expanded','false');input.removeAttribute('aria-activedescendant');arrow();}
  function activate(i){active=i;popup.querySelectorAll('[role=option]').forEach((el,index)=>{el.dataset.active=String(index===i);});const current=popup.querySelector('[data-active=true]');if(current){input.setAttribute('aria-activedescendant',current.id);cpScrollWithin(popup,current);}else input.removeAttribute('aria-activedescendant');}
  function choose(o){if(o.disabled)return;selected=o;query='';f.setValue(o.label);f.setValidation();close();onChange?.(o.value,o);}
  function render(){
    popup.replaceChildren();shown=[];
    if(loadState!=='ready'){
      popup.append(cpListStatus(loadState==='loading'?'Loading':'Error',loadState==='loading'?'Загрузка':'Что-то пошло не так'));
      if(loadState==='error'){
        const retry=cpOption({label:'Обновить'},{kind:'Refresh',icon:'24 Linear / History 2'});
        retry.addEventListener('click',()=>{input.focus();onRetry?.();if(loadOptions)fetchOptions(query);});retry.addEventListener('pointerdown',e=>e.preventDefault());popup.append(retry);
      }
      activate(-1);return;
    }
    const filtered=items.filter(o=>!editable||!query||(o.label.toLocaleLowerCase().startsWith(query.toLocaleLowerCase())||(o.description||'').toLocaleLowerCase().includes(query.toLocaleLowerCase())));
    const fav=!query?filtered.filter(o=>favorites.includes(o.value)):[];const rest=filtered.filter(o=>!fav.includes(o));
    function append(o){const row=cpOption(o);row.id=cpId('option');row.setAttribute('role','option');row.setAttribute('aria-selected',String(selected?.value===o.value));row.tabIndex=-1;row.addEventListener('pointerdown',e=>e.preventDefault());row.addEventListener('click',()=>choose(o));row.addEventListener('mousemove',()=>activate(shown.indexOf(o)));popup.append(row);shown.push(o);}
    if(fav.length){popup.append(cpElement('div','cp-list-group','Популярные варианты'));fav.forEach(append);if(rest.length)popup.append(cpElement('hr','cp-list-separator'));}
    rest.forEach(o=>{if(o.separatorBefore)popup.append(cpElement('hr','cp-list-separator'));append(o);});
    if(!filtered.length){popup.append(cpListStatus('NotFound','Не найдено'));}
    if(onAdd){
      if(adding){
        const editor=cpInlineAdd({value:query,onSubmit(label){let option=items.find(o=>o.label.toLocaleLowerCase()===label.toLocaleLowerCase());if(!option){option={value:label,label};items.push(option);onAdd(label);}choose(option);input.focus();close();},onCancel(){adding=false;input.focus();render();}});
        popup.append(editor.element);requestAnimationFrame(()=>editor.input.focus());
      }else{const add=cpOption({label:'Добавить своё значение'},{kind:'AddNew',icon:'24 Linear / Plus'});add.id=cpId('add');add.setAttribute('role','option');add.setAttribute('aria-selected','false');add.tabIndex=-1;add.style.color='#1a9cff';add.addEventListener('pointerdown',e=>e.preventDefault());const action={value:'__add__',label:'Добавить своё значение',add:true};shown.push(action);add.addEventListener('click',()=>{adding=true;render();position.place();});popup.append(add);}
    }
    active=query?shown.findIndex(o=>!o.add&&!o.disabled):shown.findIndex(o=>!o.add&&o.value===selected?.value);if(query&&active<0)active=shown.findIndex(o=>o.add);activate(adding?-1:active);
  }
  function open(){if(input.disabled)return;if(editable&&autocomplete&&!input.value&&!favorites.length)return;opened=true;popup.hidden=false;input.setAttribute('aria-expanded','true');render();arrow();position.place();}
  async function fetchOptions(q){
    const ticket=++request;let timer,minimum;
    timer=setTimeout(()=>{if(ticket===request&&!disposed){loadState='loading';minimum=Date.now()+1000;render();}},300);
    try{const result=await loadOptions(q);clearTimeout(timer);if(minimum)await new Promise(r=>setTimeout(r,Math.max(0,minimum-Date.now())));if(ticket!==request||disposed)return;items=cpNormalizeOptions(result);loadState='ready';}
    catch(e){clearTimeout(timer);if(minimum)await new Promise(r=>setTimeout(r,Math.max(0,minimum-Date.now())));if(ticket!==request||disposed)return;loadState='error';}
    if(opened){render();position.place();}
  }
  input.addEventListener('focus',()=>{if(editable&&selected){input.select();query='';}open();});
  input.addEventListener('click',()=>{if(editable)open();});
  shell.addEventListener('click',e=>{if(e.target!==shell)return;if(editable)open();else if(pointerWasOpen)close();else open();});
  // Pointer focus opens Select once; its subsequent click must not close it immediately.
  let pointerWasOpen=false;shell.addEventListener('pointerdown',()=>{pointerWasOpen=opened;},true);
  if(!editable){input.addEventListener('click',()=>{if(!pointerWasOpen)open();else close();});}
  accessory.addEventListener('pointerdown',e=>e.preventDefault());accessory.addEventListener('click',()=>{if(opened)close();else{input.focus();open();}});accessory.style.cursor='pointer';
  input.addEventListener('input',()=>{query=input.value;selected=undefined;f.setValidation();if(editable&&autocomplete&&!query&&!favorites.length){close();return;}open();if(loadOptions)fetchOptions(query);});
  input.addEventListener('keydown',e=>{
    if(e.key==='Escape'){if(opened)e.preventDefault();close();return;}
    if(e.key==='Tab'){if(loadState==='error'&&!e.shiftKey){const retry=popup.querySelector('button');if(retry){e.preventDefault();retry.focus();return;}}close();return;}
    if(e.key==='Enter'){
      e.preventDefault();if(opened&&loadState==='ready'&&shown[active]&&!shown[active].disabled){const o=shown[active];if(o.add){adding=true;render();position.place();}else choose(o);}else if(!editable&&!opened)open();return;
    }
    if(!editable&&e.key===' '){e.preventDefault();if(opened)close();else open();return;}
    if(['ArrowDown','ArrowUp'].includes(e.key)){
      if(!editable&&!opened){e.preventDefault();open();activate(e.key==='ArrowDown'?0:shown.length-1);return;}
      if(opened&&loadState==='ready'&&(!editable||shown.length>1)){
        e.preventDefault();let i=active+(e.key==='ArrowDown'?1:-1);i=Math.max(0,Math.min(shown.length-1,i));while(shown[i]?.disabled&&i>=0&&i<shown.length)i+=e.key==='ArrowDown'?1:-1;if(i>=0&&i<shown.length)activate(i);
      }
    }
    if(!editable&&opened&&['Home','End'].includes(e.key)){e.preventDefault();activate(e.key==='Home'?0:shown.length-1);}
    if(!editable&&e.key.length===1&&!e.ctrlKey&&!e.metaKey&&e.key!==' '){const i=shown.findIndex(o=>o.label.toLocaleLowerCase().startsWith(e.key.toLocaleLowerCase()));if(i>=0)activate(i);}
  });
  input.addEventListener('blur',e=>{
    if(element.contains(e.relatedTarget))return;close();if(!editable)return;const exact=items.find(o=>o.label.toLocaleLowerCase()===input.value.toLocaleLowerCase()&&!o.disabled);
    if(exact){if(selected?.value!==exact.value)choose(exact);}
    else if(input.value){if(allowCustom){selected={value:input.value,label:input.value};f.setValidation('Значения нет в справочнике. Возможно, вы ошиблись','Warning');onChange?.(input.value,selected);}else f.setValidation(onAdd?'Добавьте значение в справочник или выберите другое значение из списка':'Выберите значение из списка');}
  });
  popup.addEventListener('cp-dismiss',close);element.addEventListener('focusout',e=>{if(element.contains(e.relatedTarget))return;requestAnimationFrame(()=>{if(!element.contains(document.activeElement))close();});});
  return {...f,popup,open,close,setState(s){f.setState(s);if(s==='Disabled')close();},get value(){return selected?.value||'';},setValue(v){selected=items.find(o=>o.value===String(v));f.setValue(selected?.label||'');},setOptions(list){items=cpNormalizeOptions(list);if(opened)render();},setLoadState(s){loadState=s;if(opened)render();},destroy(){disposed=true;request++;position.destroy();element.remove();}};
}
