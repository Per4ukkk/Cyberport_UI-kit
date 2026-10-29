import {cpElement,cpId,cpStyle,cpVariant,cpIcon} from './control-core.js';
/** Foundation used by input, dropdown and segmented controls. */
export function createField({family='Field',size='Md',state='Normal',label='Value',ariaLabel,placeholder='Value',value='',width=250,required=false,disabled=false,readOnly=false,help='',clearable=false,clearOnHover=false,icon,leftIcon,validate,onInput,onChange,...options}={}) {
  const element=cpElement('div','cp-field');element.dataset.component=family;
  element.style.width=typeof width==='number'?width+'px':width;
  const heading=cpElement('div','cp-field-heading'),caption=cpElement('label','cp-field-label',label+(required?'*':''));
  const input=cpElement(options.inputTag||'input','cp-input');if(input.tagName==='INPUT')input.type='text';input.id=cpId('input');caption.htmlFor=input.id;input.value=value;input.placeholder=placeholder;
  input.required=required;input.readOnly=readOnly;input.autocomplete='off';input.setAttribute('autocorrect','off');input.spellcheck=false;if(options.name)input.name=options.name;
  input.setAttribute('aria-label',ariaLabel||label||placeholder);
  heading.append(caption);
  if(help){const hint=cpElement('span','cp-field-help');hint.tabIndex=0;hint.setAttribute('role','img');hint.setAttribute('aria-label',help);hint.title=help;hint.append(cpIcon('24 Linear / Question - Circle',16));heading.append(hint);}
  const shell=cpElement('div','cp-field-shell');
  const leading=leftIcon?cpElement('div','cp-field-leading'):null;
  if(leading){leading.append(cpIcon(leftIcon),input);shell.append(leading);}else shell.append(input);
  const accessory=cpElement('span','cp-field-accessory');shell.append(accessory);
  const message=cpElement('span','cp-field-message'+(options.validationDisplay==='tooltip'?' cp-validation-tooltip':''));message.id=cpId('message');message.hidden=true;if(options.validationDisplay==='tooltip')message.setAttribute('role','tooltip');
  element.append(heading,shell,message);let focused=false,hover=false,initialState=state,invalidEdited=false,validationText='',validationKind='';
  if(disabled)state='Disabled';
  function variant(s){return cpVariant(family,{Size:size,State:s,...(family==='Time_Field'&&['Click','Filled'].includes(s)?{Seconds:options.seconds?'Yes':'No'}:{})});}
  function paint(){
    const effective=state==='Disabled'?'Disabled':['Error','Warning'].includes(state)?state:focused?'Click':hover?'Hover':input.value?'Filled':'Normal';
    let v=variant(effective);element.dataset.sourceId=v.id;element.dataset.state=effective;
    element.dataset.disabled=String(state==='Disabled');input.disabled=state==='Disabled';
    heading.hidden=!label;cpStyle(caption,v.label);heading.style.marginBottom=label?v.labelGap+'px':'0';
    cpStyle(shell,v.body.style);shell.style.height=v.body.box.height+'px';shell.style.gap=v.body.gap+'px';
    // Source TextArea body is allowed to grow; its controller supplies the height.
    if(family==='TextArea'){shell.style.height='auto';shell.style.minHeight=v.body.box.height+'px';}
    const actual=variant('Filled').value;cpStyle(input,{...v.value,color:state==='Disabled'?v.value.color:actual.color});
    shell.style.setProperty('--cp-placeholder',v.value.color);
    element.style.setProperty('--cp-input-line',v.value.lineHeight);
    accessory.replaceChildren();accessory.hidden=true;
    if(clearable&&input.value){
      accessory.hidden=false;const clear=cpElement('button','cp-field-icon-button cp-field-clear');clear.type='button';clear.disabled=input.disabled;clear.setAttribute('aria-label','Очистить '+(label||ariaLabel||placeholder));clear.append(cpIcon('24 Linear / Cross - Large',size==='Lg'?24:20));
      clear.addEventListener('pointerdown',e=>e.preventDefault());clear.addEventListener('click',()=>{input.value='';input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));input.focus();});accessory.append(clear);accessory.classList.toggle('cp-clear-on-hover',clearOnHover);
    }else if(icon){const name=typeof icon==='function'?icon():icon;accessory.hidden=false;if(!(input.disabled&&/Angle - (Up|Down)$/.test(name)))accessory.append(cpIcon(name,size==='Lg'?24:size==='Sm'?16:20));}
    // Icon combinations have their own markup: plain-field padding cannot be reused.
    const markup=family==='Field'?cpVariant('FieldMarkup',{Size:size,'Left Icon':leftIcon?'Yes':'No','Right Icon':accessory.hidden?'No':'Yes',Tokens:'No'}).node:null;
    if(markup){element.dataset.markupId=markup.id;shell.style.padding=markup.style.padding;shell.style.gap=markup.layout.itemSpacing+'px';}
    if(leading){
      const group=markup.children.find(n=>n.name==='Left'),glyph=leading.querySelector('.cp-glyph'),sourceIcon=group.children.find(n=>n.type!=='TEXT');
      leading.style.gap=group.layout.itemSpacing+'px';glyph.style.width=sourceIcon.box.width+'px';glyph.style.height=sourceIcon.box.height+'px';glyph.style.color=focused?'#262c31':'#808b95';
    }
    const slot=markup?.children.find(n=>n.name==='Icon')?.box.width||v.icon?.width||v.body.box.height;
    if(!accessory.hidden){accessory.style.width=slot+'px';accessory.style.height=v.body.box.height+'px';accessory.style.color=focused?'#262c31':'#808b95';if(!markup&&!v.icon)shell.style.paddingRight='0';}
    input.setAttribute('aria-invalid',String(state==='Error'));
    if(validationText){message.textContent=validationText;message.dataset.kind=validationKind;message.hidden=false;message.classList.toggle('cp-edited-message',invalidEdited);input.setAttribute('aria-describedby',message.id);}
    else {message.hidden=true;input.removeAttribute('aria-describedby');}
  }
  function setValidation(text='',kind='Error') {validationText=text;validationKind=kind;invalidEdited=false;state=text?kind:'Normal';paint();}
  function edited(){if(['Error','Warning'].includes(state)){state='Normal';invalidEdited=true;}paint();onInput?.(input.value);}
  input.addEventListener('focus',()=>{focused=true;paint();});input.addEventListener('blur',()=>{
    focused=false;if(invalidEdited){validationText='';invalidEdited=false;}
    if(validate&&input.value){const result=validate(input.value);if(result)setValidation(typeof result==='string'?result:result.message,result.kind||'Error');}
    paint();
  });
  input.addEventListener('input',edited);input.addEventListener('change',()=>onChange?.(input.value));
  shell.addEventListener('click',e=>{if(input.disabled||e.target===input||e.target.closest('button,a,[contenteditable=true],.cp-field-accessory'))return;const editor=shell.querySelector('[contenteditable=true]');(editor||input).focus();});
  shell.addEventListener('mouseenter',()=>{hover=true;paint();});shell.addEventListener('mouseleave',()=>{hover=false;paint();});
  if(initialState==='Error'||initialState==='Warning')validationKind=initialState;
  paint();
  return {element,input,shell,heading,caption,accessory,message,paint,variant,setValidation,
    get value(){return input.value;},setValue(v){input.value=v??'';paint();},setState(v){state=v;paint();},
    notify(){edited();input.dispatchEvent(new Event('change',{bubbles:true}));}};
}
