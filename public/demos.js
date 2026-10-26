import {createButton,createButtonMenu,createCheckbox,createRadio,createSwitch,createField,createMaskField,createPhoneField,createTimeField,createDateField,createSelect,createCombobox,createTextArea,createTokenField,createBadge} from '/ui-kit/index.js';

const names={Lg:'Large',Md:'Medium',Sm:'Small',Xs:'Extra small',Normal:'Normal',Disabled:'Disabled',Error:'Error',Warning:'Warning'};
const dictionary=['Требование','Рекомендация','Ограничение'];
const factories={input:createField,mask:createMaskField,phone:createPhoneField,time:createTimeField,date:createDateField,select:createSelect,combobox:createCombobox,textarea:createTextArea,'token-input':createTokenField};
for(const demo of document.querySelectorAll('[data-component-demo]')){
 const kind=demo.dataset.componentDemo,mount=demo.querySelector('.demo-mount'),controls=demo.querySelector('.demo-controls');
 let current=[];const settings={size:'Md',state:'Normal',use:'Primary',color:'Gray'};
 function control(title,key,values){
  const select=createSelect({size:'Sm',label:title,ariaLabel:title+' примера',width:'100%',value:settings[key],options:values.map(value=>({value,label:names[value]||value})),onChange:value=>{settings[key]=value;render();}});
  select.element.classList.add('demo-control');controls.append(select.element);
 }
 if(kind!=='switch')control('Размер','size',['checkbox','radio','badge'].includes(kind)?['Md','Sm']:['button','menu-button'].includes(kind)?['Lg','Md','Sm','Xs']:['Lg','Md','Sm']);
 if(kind==='badge')control('Цвет','color',['Gray','Blue','Green','Red','Orange','White','Light Blue']);
 else control('Состояние','state',factories[kind]?['Normal','Disabled','Warning','Error']:['Normal','Disabled']);
 if(kind==='button')control('Вид','use',['Primary','Secondary','Negative']);
 function add(instance){current.push(instance);mount.append(instance.element||instance);return instance;}
 function output(){const p=document.createElement('p');p.className='demo-output';p.setAttribute('role','status');mount.append(p);return text=>p.textContent=text;}
 function render(){
  for(const c of current)c.destroy?.();current=[];mount.replaceChildren();
  const {size,state,use,color}=settings;
  const base={size,state,label:'Название',placeholder:'Введите значение',width:'100%'};
  if(kind==='button'){
   const button=add(createButton({size,state,use,label:'Кнопка',leftIcon:false,rightIcon:false}));const announce=output();button.addEventListener('click',()=>announce('Кнопка нажата'));
  }else if(kind==='menu-button'){
   const menu=add(createButtonMenu({size,state,label:'Действия',columns:[[{items:[{label:'Открыть',value:'open'},{label:'Дублировать',value:'copy'},{label:'Переместить',value:'move'}]}]],onSelect:item=>announce('Выбрано: '+item.label)}));const announce=output();
  }else if(['checkbox','radio','switch'].includes(kind)){
   const group=document.createElement('div');group.className='choice-demo';mount.append(group);
   const factory=kind==='checkbox'?createCheckbox:kind==='radio'?createRadio:createSwitch;
   const list=kind==='radio'?['Первый вариант','Второй вариант']:kind==='checkbox'?['Показывать описание']:['Уведомления'];
   for(const [i,label]of list.entries()){const c=factory({size,state,label,name:'example-radio',checked:kind==='radio'&&i===0});current.push(c);group.append(c.element);}
  }else if(kind==='badge'){
   add(createBadge({size,color,label:'Статус',icon:false}));
  }else{
   const options={...base};
   if(kind==='input')Object.assign(options,{label:'Название требования',placeholder:'Введите название',clearable:true});
   if(kind==='mask')Object.assign(options,{label:'Номер документа',pattern:'## ## ######',placeholder:'__ __ ______'});
   if(kind==='phone')Object.assign(options,{label:'Телефон',placeholder:'+7 ___ ___-__-__'});
   if(kind==='time')Object.assign(options,{label:'Время',placeholder:'__:__'});
   if(kind==='date')Object.assign(options,{label:'Дата',placeholder:'__.__.____'});
   if(kind==='textarea')Object.assign(options,{label:'Описание',placeholder:'Введите описание',rows:3,maxLength:200});
   if(['select','combobox'].includes(kind))Object.assign(options,{label:'Тип требования',placeholder:'Выберите тип',options:dictionary});
   if(kind==='token-input')Object.assign(options,{label:'Категории',placeholder:'Выберите категории',options:dictionary,value:['Требование']});
   const instance=add(factories[kind](options));
   if(['Warning','Error'].includes(state))instance.setValidation?.(state==='Warning'?'Пример предупреждения':'Пример сообщения об ошибке',state);
  }
 }
 demo.querySelector('.demo-reset').addEventListener('click',render);
 render();
}
