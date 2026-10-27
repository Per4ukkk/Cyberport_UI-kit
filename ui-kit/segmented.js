import {createField} from './field.js';
import {cpFlash,cpMaskMirror} from './control-core.js';
export function cpDateFrom(value){
  if(value instanceof Date)return new Date(value.getFullYear(),value.getMonth(),value.getDate());
  if(!value)return null;const s=String(value);let d,m,y;if(/^\d{4}-\d{2}-\d{2}$/.test(s))[y,m,d]=s.split('-').map(Number);else [d,m,y]=s.split(/\D+/).filter(Boolean).map(Number);
  const date=new Date(y,m-1,d);return date.getFullYear()===y&&date.getMonth()===m-1&&date.getDate()===d?date:null;
}
export function cpDateText(date){return [date.getDate(),date.getMonth()+1,date.getFullYear()].map((v,i)=>String(v).padStart(i===2?4:2,'0')).join('.');}
/** One native text input, with selection over the active segment. */
export function createSegmentField({kind='time',seconds=false,min,max,onChange,width=250,...options}={}){
  const date=kind==='date',lengths=date?[2,2,4]:seconds?[2,2,2]:[2,2],separator=date?'.':':';
  const f=createField({...options,placeholder:options.placeholder??lengths.map(n=>'_'.repeat(n)).join(separator),width:width==='auto'?'max-content':width,family:date?'Date_Field':'Time_Field',seconds,value:'',icon:date?'24 Linear / Calendar - Dates':'24 Linear / Clock'});
  const {input,shell}=f;input.inputMode='numeric';input.classList.add('cp-segment-input');
  const starts=lengths.map((_,i)=>lengths.slice(0,i).reduce((a,b)=>a+b+1,0));let parts=lengths.map(()=>''),part=0,fresh=true,focused=false,internal=false;
  const minimum=cpDateFrom(min),maximum=cpDateFrom(max);const mirror=cpMaskMirror(input,shell,f.variant('Filled').value.color,f.variant('Normal').value.color);
  function fit(){
    if(width!=='auto')return;
    const filled=lengths.map(n=>'8'.repeat(n)).join(separator),empty=lengths.map(n=>'_'.repeat(n)).join(separator);
    input.style.flex='none';input.style.width=Math.ceil(Math.max(mirror.measure(filled),mirror.measure(empty)))+2+'px';
  }
  function display(){input.value=parts.some(Boolean)?parts.map((p,i)=>focused?p.padEnd(lengths[i],'_'):p).join(separator):focused?lengths.map(n=>'_'.repeat(n)).join(separator):'';f.paint();mirror();fit();}
  function select(){if(focused)input.setSelectionRange(starts[part],starts[part]+lengths[part]);mirror(false,focused?[starts[part],starts[part]+lengths[part]]:null);}
  function emit(){internal=true;display();input.dispatchEvent(new Event('input',{bubbles:true}));internal=false;select();onChange?.(api.value);}
  function move(i){part=Math.max(0,Math.min(lengths.length-1,i));fresh=true;select();}
  function validRange(d){return d&&(!minimum||d>=minimum)&&(!maximum||d<=maximum);}
  function complete(){
    if(!parts.some(Boolean))return;
    if(date){const today=new Date();if(parts[0]&&!parts[1]&&!parts[2])parts=[parts[0],String(today.getMonth()+1),String(today.getFullYear())];}
    else if(parts[0])for(let i=1;i<parts.length;i++)if(!parts[i])parts[i]='0';
    parts=parts.map((s,i)=>s?s.padStart(lengths[i],'0'):s);display();
    if(date&&!validRange(cpDateFrom(input.value)))f.setValidation('Укажите допустимую дату');
    else if(!date&&parts.some((p,i)=>!p||+p>(i===0?23:59)))f.setValidation('Укажите допустимое время');
  }
  function set(v){let s=v instanceof Date?cpDateText(v):String(v||'');if(date&&/^\d{4}-\d{2}-\d{2}$/.test(s)){const d=cpDateFrom(s);s=d?cpDateText(d):s;}
    const a=s.split(/\D+/).filter(Boolean);if(a.length===1&&a[0].length>2){let offset=0;parts=lengths.map(n=>{const p=a[0].slice(offset,offset+n);offset+=n;return p;});}else parts=lengths.map((_,i)=>a[i]||'');display();select();}
  input.addEventListener('focus',()=>{focused=true;part=0;fresh=true;display();select();});
  input.addEventListener('click',e=>{const p=mirror.indexAt(e.clientX);part=parts.some(Boolean)?Math.max(0,starts.findLastIndex(start=>p>=start)):0;fresh=true;select();});
  input.addEventListener('blur',()=>{focused=false;complete();display();});
  input.addEventListener('keydown',e=>{
    if(e.ctrlKey||e.metaKey||e.altKey)return;
    if(/^\d$/.test(e.key)){
      e.preventDefault();if(input.selectionEnd-input.selectionStart>=starts.at(-1)+lengths.at(-1)){parts=lengths.map(()=>'');part=0;fresh=true;}
      const proposed=(fresh?'':parts[part])+e.key;if(proposed.length>lengths[part]){cpFlash(shell);return;}
      const limit=date?(part===0?31:part===1?12:9999):(part===0?23:59);
      if(+proposed>limit){cpFlash(shell);return;}parts[part]=proposed;fresh=false;
      if(proposed.length===lengths[part]&&part<lengths.length-1){part++;fresh=true;}emit();return;
    }
    if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();move(part+(e.key==='ArrowRight'?1:-1));return;}
    if([' ','.',',',':','/','-'].includes(e.key)){e.preventDefault();if(parts[part])parts[part]=parts[part].padStart(lengths[part],'0');move(part+1);display();select();return;}
    if(['Backspace','Delete'].includes(e.key)){e.preventDefault();if(input.selectionEnd-input.selectionStart>=starts.at(-1)+lengths.at(-1)){parts=lengths.map(()=>'');part=0;}else{if(!parts[part]&&part>0)part--;parts[part]=e.key==='Delete'?'':parts[part].slice(0,-1);}fresh=false;emit();return;}
    if(['ArrowUp','ArrowDown'].includes(e.key)){
      e.preventDefault();const today=new Date(),dir=e.key==='ArrowUp'?1:-1;let base=parts.map((p,i)=>+p||(date?[today.getDate(),today.getMonth()+1,today.getFullYear()][i]:0));
      const limit=date?(part===0?new Date(base[2],base[1],0).getDate():part===1?12:9999):(part===0?23:59),floor=date?1:0;
      base[part]+=dir;if(base[part]>limit)base[part]=floor;if(base[part]<floor)base[part]=limit;
      if(date&&!validRange(cpDateFrom(base.map((n,i)=>String(n).padStart(lengths[i],'0')).join('.')))){cpFlash(shell);return;}
      parts=base.map((n,i)=>String(n).padStart(lengths[i],'0'));fresh=true;emit();return;
    }
    if(e.key==='Home'){e.preventDefault();move(0);}if(e.key==='End'){e.preventDefault();move(lengths.length-1);}
  });
  input.addEventListener('beforeinput',e=>{if(e.inputType.startsWith('insert')&&!e.isComposing){e.preventDefault();cpFlash(shell);}});
  input.addEventListener('paste',e=>{e.preventDefault();const s=e.clipboardData.getData('text');if(date){const d=cpDateFrom(s);if(!validRange(d)){cpFlash(shell);return;}set(d);}else set(s);emit();});
  input.addEventListener('input',()=>{if(!internal)set(input.value);});
  const api={...f,setState(s){f.setState(s);display();},get value(){return parts.some(Boolean)?parts.map((p,i)=>p.padEnd(lengths[i],'_')).join(separator):'';},setValue:set,complete,get date(){return date?cpDateFrom(api.value):null;},inRange:validRange};
  set(options.value||'');document.fonts?.ready.then(()=>{fit();mirror();});return api;
}
export function createTimeField(options={}){return createSegmentField({...options,kind:'time'});}
