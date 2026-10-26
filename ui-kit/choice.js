import {cpElement,cpId,cpStyle,cpVariant,cpVisual} from './control-core.js';
function createChoice(kind,{size='Md',state='Normal',label='Value',description='',checked=false,name,value='on',required=false,ariaLabel,onChange}={}) {
  if(kind==='Switch')size=undefined;
  const element=cpElement('label','cp-choice');const input=cpElement('input','cp-choice-input');
  input.type=kind==='Radiobutton'?'radio':'checkbox';if(kind==='Switch')input.setAttribute('role','switch');
  input.name=name||'';input.value=value;input.checked=checked;input.required=required;
  if(ariaLabel)input.setAttribute('aria-label',ariaLabel);
  const visual=cpElement('span','cp-choice-mark'),texts=cpElement('span','cp-choice-texts');
  const title=cpElement('span','',label),desc=cpElement('span','',description);desc.id=cpId('description');
  if(description)input.setAttribute('aria-describedby',desc.id);
  texts.append(title);if(description)texts.append(desc);element.append(input,visual,texts);
  let hover=false;
  function paint(){
    const v=cpVariant(kind,{...(size?{Size:size}:{}),State:hover&&state==='Normal'?'Hover':state,Toggle:input.checked?'On':'Off',Description:description?'On':'Off'});
    element.dataset.component=kind;element.dataset.sourceId=v.id;element.dataset.state=state;
    cpStyle(element,{gap:v.gap+'px',opacity:v.style.opacity||'1'});cpStyle(title,v.label);cpStyle(desc,v.description);
    texts.style.gap=v.textGap+'px';input.disabled=state==='Disabled';
    visual.replaceChildren(cpVisual(v.visual));element.style.setProperty('--cp-mark-width',v.visual.box.width+'px');
    element.style.setProperty('--cp-mark-height',v.visual.box.height+'px');
    input.setAttribute('aria-invalid',String(state==='Error'));
  }
  input.addEventListener('change',()=>{paint();if(kind==='Radiobutton'&&input.name)document.querySelectorAll('input[type=radio]').forEach(other=>{if(other!==input&&other.name===input.name)other.dispatchEvent(new Event('cp-sync'));});onChange?.(input.checked,input.value);});
  input.addEventListener('cp-sync',paint);element.addEventListener('mouseenter',()=>{hover=true;paint();});element.addEventListener('mouseleave',()=>{hover=false;paint();});paint();
  return {element,input,get value(){return input.checked;},setValue(v){input.checked=!!v;input.dispatchEvent(new Event('change'));},setState(v){state=v;paint();}};
}
export function createCheckbox(options){return createChoice('Checkbox',options);}
export function createRadio(options){return createChoice('Radiobutton',options);}
export function createSwitch(options){return createChoice('Switch',options);}
