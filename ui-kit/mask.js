import {createField} from './field.js';
import {cpFlash,cpMaskMirror} from './control-core.js';
/** # is a digit slot; separators are literal. variableLength hides the empty mask. */
export function createMaskField({pattern='## ## ######',prefix='',variableLength=false,maxLength,normalize, ...options}={}) {
  const f=createField({...options,family:prefix?'Phone_Field':'Mask_field',value:''});const {input,shell}=f;
  input.inputMode='numeric';const slots=[...pattern].map((c,i)=>c==='#'?i:-1).filter(i=>i>=0),capacity=maxLength||slots.length;
  let digits='',focused=false,internal=false;const mirror=cpMaskMirror(input,shell,f.variant('Filled').value.color,f.variant('Normal').value.color);
  const clean=v=>(normalize?normalize(v):v).replace(/\D/g,'').slice(0,capacity);
  function display(){
    let i=0,out='';for(const c of pattern){if(c==='#'){if(i<digits.length)out+=digits[i++];else if(focused&&!variableLength)out+='_';else break;}else if(i<=digits.length&&(focused&&!variableLength||i>0))out+=c;}
    if(variableLength)out=digits;input.value=prefix+out;f.paint();
    // Prefix alone is empty semantically, while remaining visible and non-erasable.
    if(!digits.length&&!focused)input.style.color=f.variant('Normal').value.color;mirror(!digits.length&&!focused);
  }
  function positionFor(index){return prefix.length+(variableLength?index:(slots[index]??pattern.length));}
  function indexAt(position){if(variableLength)return Math.max(0,position-prefix.length);return slots.filter(i=>i+prefix.length<position).length;}
  function changed(caret){internal=true;display();input.dispatchEvent(new Event('input',{bubbles:true}));internal=false;input.setSelectionRange(positionFor(caret),positionFor(caret));}
  input.addEventListener('focus',()=>{focused=true;display();const pos=positionFor(digits.length);input.setSelectionRange(pos,pos);});
  input.addEventListener('blur',()=>{focused=false;display();});
  input.addEventListener('beforeinput',e=>{
    if(e.isComposing)return;const start=Math.min(digits.length,indexAt(input.selectionStart)),end=Math.min(digits.length,indexAt(input.selectionEnd));
    if(e.inputType.startsWith('delete')){
      e.preventDefault();let a=start,b=end;if(a===b){if(e.inputType.includes('Backward'))a=Math.max(0,a-1);else b=Math.min(digits.length,b+1);}
      digits=digits.slice(0,a)+digits.slice(b);changed(a);return;
    }
    if(e.inputType.startsWith('insert')&&e.data!==null){
      e.preventDefault();const incoming=e.data.replace(/\D/g,'');
      if(!incoming){if(![...e.data].every(c=>pattern.includes(c)))cpFlash(shell);return;}
      const proposed=digits.slice(0,start)+incoming+digits.slice(end);if(proposed.length>capacity||/[^\d]/.test(e.data))cpFlash(shell);
      digits=proposed.slice(0,capacity);changed(Math.min(start+incoming.length,capacity));
    }
  });
  input.addEventListener('paste',e=>{e.preventDefault();const v=e.clipboardData.getData('text'),incoming=clean(v);const a=Math.min(digits.length,indexAt(input.selectionStart)),b=Math.min(digits.length,indexAt(input.selectionEnd));digits=(digits.slice(0,a)+incoming+digits.slice(b)).slice(0,capacity);changed(Math.min(a+incoming.length,capacity));});
  input.addEventListener('input',()=>{if(internal)return;digits=clean(prefix&&input.value.startsWith(prefix)?input.value.slice(prefix.length):input.value);display();});
  digits=clean(String(options.value||''));display();
  return {...f,setState(s){f.setState(s);display();},get value(){return digits?prefix+input.value.slice(prefix.length).replace(/_/g,''):'';},get rawValue(){return digits;},setValue(v){digits=clean(String(v||''));display();}};
}
export function createPhoneField(options={}) {
  return createMaskField({...options,pattern:'### ###-##-##',prefix:'+7 ',normalize(v){let s=String(v).replace(/\D/g,'');if(s.length===11&&/^[78]/.test(s))s=s.slice(1);return s;}});
}
