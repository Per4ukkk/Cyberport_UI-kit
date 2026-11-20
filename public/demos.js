import {createButton,createButtonMenu,createCheckbox,createRadio,createSwitch,createField,createMaskField,createPhoneField,createTimeField,createDateField,createSelect,createCombobox,createTextArea,createTokenField,createBadge} from '/ui-kit/index.js';

import {BUTTON_VARIANTS} from '/ui-kit/data.js';
import {exampleSpec,exampleCode} from '/component-docs.js';

const names={Lg:'Large',Md:'Medium',Sm:'Small',Xs:'Extra small',Normal:'Normal',Disabled:'Disabled',Error:'Error',Warning:'Warning'};
const factories={input:createField,mask:createMaskField,phone:createPhoneField,time:createTimeField,date:createDateField,select:createSelect,combobox:createCombobox,textarea:createTextArea,'token-input':createTokenField};
for(const demo of document.querySelectorAll('[data-component-demo]')){
 const kind=demo.dataset.componentDemo,mount=demo.querySelector('.demo-mount'),controls=demo.querySelector('.demo-controls');
 let current=[];const settings={size:'Md',state:'Normal',use:'Primary',color:'Gray',type:'Normal'};const selectors={};
 function control(title,key,values){
  const select=createSelect({size:'Sm',label:title,ariaLabel:title+' примера',width:'100%',value:settings[key],options:values.map(value=>({value,label:names[value]||value})),onChange:value=>{settings[key]=value;render();}});
  select.element.classList.add('demo-control');controls.append(select.element);selectors[key]=select;
 }
 if(kind!=='switch')control('Размер','size',['checkbox','radio'].includes(kind)?['Md','Sm']:['button','menu-button'].includes(kind)?['Lg','Md','Sm','Xs']:['Lg','Md','Sm']);
 if(kind==='badge')control('Цвет','color',['Gray','Blue','Green','Red','Orange','White','Light Blue']);
 else control('Состояние','state',(factories[kind]||['checkbox','radio'].includes(kind))?['Normal','Disabled','Warning','Error']:['Normal','Disabled']);
 if(kind==='button'){control('Вид','use',[...new Set(BUTTON_VARIANTS.map(v=>v.use))]);control('Формат','type',['Normal','Icon','Blue Link']);}
 function add(instance){current.push(instance);mount.append(instance.element||instance);return instance;}
 function output(){const p=document.createElement('p');p.className='demo-output';p.setAttribute('role','status');mount.append(p);return text=>p.textContent=text;}
 function render(){
  for(const c of current)c.destroy?.();current=[];mount.replaceChildren();
  if(kind==='button'){const types=[...new Set(BUTTON_VARIANTS.filter(v=>v.use===settings.use).map(v=>v.type))];if(!types.includes(settings.type))settings.type='Normal';selectors.type.setOptions(types);selectors.type.setValue(settings.type);}
  const {size,state,use,color,type}=settings;
  const {options}=exampleSpec(kind,settings);
  const code=document.querySelector('[data-example-code]');if(code){code.textContent=exampleCode(kind,settings);code.dispatchEvent(new Event('code-updated',{bubbles:true}));}
  if(kind==='button'){
   const button=add(createButton(options));const announce=output();button.addEventListener('click',()=>announce('Кнопка нажата'));
  }else if(kind==='menu-button'){
   const menu=add(createButtonMenu({...options,onSelect:item=>announce('Выбрано: '+item.label)}));const announce=output();
  }else if(['checkbox','radio','switch'].includes(kind)){
   const group=document.createElement('div');group.className='choice-demo';mount.append(group);
   const factory=kind==='checkbox'?createCheckbox:kind==='radio'?createRadio:createSwitch;
   const list=kind==='radio'?['Первый вариант','Второй вариант']:kind==='checkbox'?['Показывать описание']:['Уведомления'];
   for(const [i,label]of list.entries()){const c=factory({...options,label,checked:kind==='radio'&&i===0});current.push(c);group.append(c.element);}
  }else if(kind==='badge'){
   add(createBadge(options));
  }else{
   const instance=add(factories[kind](options));
   if(['Warning','Error'].includes(state))instance.setValidation?.(state==='Warning'?'Пример предупреждения':'Пример сообщения об ошибке',state);
  }
 }
 demo.querySelector('.demo-reset').addEventListener('click',render);
 render();
}
