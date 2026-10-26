import {CONTROL_DATA} from './control-data.js';
import {cpElement,cpId,cpStyle,cpIcon,cpPopup,cpTextNodes,cpColor} from './control-core.js';
import {createSegmentField,cpDateFrom,cpDateText} from './segmented.js';
export function createDatePicker({value,min,max,onChange}={}){
  const minimum=cpDateFrom(min),maximum=cpDateFrom(max),today=new Date();today.setHours(0,0,0,0);
  let selected=cpDateFrom(value),view=selected||new Date(today),yearMode=false;
  const element=cpElement('div','cp-calendar');cpStyle(element,CONTROL_DATA.Calendar.style);element.dataset.component='DatePicker';element.setAttribute('role','group');element.setAttribute('aria-label','Календарь');
  const inRange=d=>(!minimum||d>=minimum)&&(!maximum||d<=maximum);
  const cellToken=state=>CONTROL_DATA.CalendarCells.find(x=>x.p.Cell==='Date'&&x.p.State===state).node;
  const textStyle=state=>cpTextNodes(cellToken(state))[0].typo;
  element.style.setProperty('--cp-day-hover',cpColor(cellToken('Hover').children[0]));element.style.setProperty('--cp-day-press',cpColor(cellToken('Click').children[0]));element.style.setProperty('--cp-day-selected',cpColor(cellToken('Choice').children[0]));
  const months=['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
  function button(label,handler){const b=cpElement('button','',label);b.type='button';b.addEventListener('click',handler);return b;}
  function render(){
    element.replaceChildren();element.dataset.sourceId=(yearMode?CONTROL_DATA.CalendarYear:CONTROL_DATA.Calendar).id;
    if(yearMode){
      const years=cpElement('div','cp-calendar-years');years.setAttribute('aria-label','Год');
      const start=minimum?.getFullYear()??Math.min(view.getFullYear()-15,today.getFullYear()-15),end=maximum?.getFullYear()??Math.max(view.getFullYear()+15,today.getFullYear()+15);
      for(let y=start;y<=end;y++){
        const b=button(String(y),()=>{view=new Date(y,view.getMonth(),1);yearMode=false;render();element.querySelector('.cp-calendar-year').focus();});cpStyle(b,textStyle('Avaible'));b.dataset.year=y;if(y===view.getFullYear())b.style.color='#1a9cff';years.append(b);
      }
      element.append(years);requestAnimationFrame(()=>years.querySelector(`[data-year="${view.getFullYear()}"]`)?.scrollIntoView({block:'center'}));return;
    }
    const header=cpElement('div','cp-calendar-header'),heading=cpElement('div','cp-calendar-heading');
    const headerTexts=cpTextNodes(CONTROL_DATA.Calendar.children[0].children[0]);cpStyle(heading,headerTexts[0]?.typo);
    const prev=button('',()=>shift(-1)),next=button('',()=>shift(1));prev.className=next.className='cp-calendar-nav';prev.setAttribute('aria-label','Предыдущий месяц');next.setAttribute('aria-label','Следующий месяц');prev.append(cpIcon('24 Linear / Angle - Left',24));next.append(cpIcon('24 Linear / Angle - Right',24));
    prev.disabled=!!minimum&&new Date(view.getFullYear(),view.getMonth(),0)<minimum;next.disabled=!!maximum&&new Date(view.getFullYear(),view.getMonth()+1,1)>maximum;
    const month=cpElement('span','',months[view.getMonth()]),year=button(String(view.getFullYear()),()=>{yearMode=true;render();element.querySelector(`[data-year="${view.getFullYear()}"]`)?.focus();});year.className='cp-calendar-year';year.setAttribute('aria-label','Выбрать год');
    heading.append(month,year);header.append(prev,heading,next);element.append(header);
    const grid=cpElement('div','cp-calendar-grid');grid.setAttribute('role','group');grid.setAttribute('aria-label',months[view.getMonth()]+' '+view.getFullYear());
    const weekday=CONTROL_DATA.CalendarCells.find(x=>x.p.Cell==='Weekday').node;
    ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].forEach((name,i)=>{const e=cpElement('span','cp-calendar-cell',name);cpStyle(e,cpTextNodes(weekday)[0].typo);e.style.height=weekday.box.height+'px';if(i>4)e.style.color='#ff6856';grid.append(e);});
    const start=new Date(view.getFullYear(),view.getMonth(),1);start.setDate(1-(start.getDay()+6)%7);
    let firstAvailable;
    for(let i=0;i<42;i++){
      const d=new Date(start);d.setDate(start.getDate()+i);const isSelected=selected?.getTime()===d.getTime(),isToday=today.getTime()===d.getTime(),other=d.getMonth()!==view.getMonth();
      const b=button('',()=>{selected=d;onChange?.(new Date(d));render();});b.className='cp-calendar-cell';b.disabled=!inRange(d);b.dataset.date=cpDateText(d);b.dataset.selected=String(isSelected);b.dataset.today=String(isToday);b.tabIndex=isSelected?0:-1;
      b.setAttribute('aria-label',d.toLocaleDateString('ru-RU',{day:'numeric',month:'long',year:'numeric'}));b.setAttribute('aria-pressed',String(isSelected));if(isToday)b.setAttribute('aria-current','date');
      const label=cpElement('span','',String(d.getDate()));b.append(label);cpStyle(b,textStyle(isSelected?'Choice':other||b.disabled?'Unavaible':'Avaible'));grid.append(b);
      if(!b.disabled&&!other&&!firstAvailable)firstAvailable=b;
      b.addEventListener('keydown',e=>{
        if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End','PageUp','PageDown'].includes(e.key))return;e.preventDefault();const dest=new Date(d);
        if(e.key==='PageUp'||e.key==='PageDown')dest.setMonth(dest.getMonth()+(e.key==='PageUp'?-1:1));
        else dest.setDate(dest.getDate()+({ArrowLeft:-1,ArrowRight:1,ArrowUp:-7,ArrowDown:7,Home:-(d.getDay()+6)%7,End:6-(d.getDay()+6)%7}[e.key]));
        if(!inRange(dest))return;view=new Date(dest.getFullYear(),dest.getMonth(),1);render();const target=element.querySelector(`[data-date="${cpDateText(dest)}"]`);target?.focus();
      });
    }
    if(!grid.querySelector('button[tabindex="0"]')&&firstAvailable)firstAvailable.tabIndex=0;element.append(grid);
  }
  function shift(n){view=new Date(view.getFullYear(),view.getMonth()+n,1);render();}
  render();return {element,get value(){return selected?new Date(selected):null;},setValue(v){selected=cpDateFrom(v);if(selected)view=new Date(selected);yearMode=false;render();}};
}
export function createDateField({onChange,...options}={}){
  const f=createSegmentField({...options,kind:'date',onChange});const {element,input,shell,accessory}=f;
  const picker=createDatePicker({...options,onChange(d){f.setValue(d);f.setValidation();input.focus();close();onChange?.(cpDateText(d));}});
  const popup=picker.element;popup.classList.add('cp-popup');popup.id=cpId('calendar');popup.hidden=true;element.append(popup);
  input.setAttribute('aria-haspopup','dialog');input.setAttribute('aria-expanded','false');input.setAttribute('aria-controls',popup.id);popup.setAttribute('role','dialog');
  const position=cpPopup(shell,popup);
  function open(){if(input.disabled)return;picker.setValue(f.date);popup.hidden=false;input.setAttribute('aria-expanded','true');position.place();}
  function close(){popup.hidden=true;input.setAttribute('aria-expanded','false');}
  input.addEventListener('focus',open);input.addEventListener('click',open);shell.addEventListener('click',e=>{if(e.target===shell)open();});input.addEventListener('input',()=>{if(f.date)picker.setValue(f.date);});
  input.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();close();}if(e.key==='ArrowDown'&&e.altKey){e.preventDefault();open();popup.querySelector('button[tabindex="0"]')?.focus();}});
  accessory.addEventListener('pointerdown',e=>e.preventDefault());accessory.style.cursor='pointer';accessory.addEventListener('click',()=>{input.focus();open();});
  popup.addEventListener('pointerdown',e=>{if(e.target.closest('button'))e.preventDefault();});
  popup.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();input.focus();close();}});
  element.addEventListener('focusout',e=>{if(element.contains(e.relatedTarget))return;requestAnimationFrame(()=>{if(!element.contains(document.activeElement))close();});});popup.addEventListener('cp-dismiss',close);
  return {...f,popup,picker,open,close,setState(s){f.setState(s);if(s==='Disabled')close();},get value(){return f.value;},destroy(){position.destroy();element.remove();}};
}
