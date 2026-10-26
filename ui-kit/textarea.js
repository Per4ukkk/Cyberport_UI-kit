import {createField} from './field.js';
import {cpElement,cpId,cpStyle,cpIcon} from './control-core.js';
import {createButton} from './button.js';
/** Plain textarea by default; richText enables the formatting described in the PDF. */
export function createTextArea({maxLength,rows=3,maxRows=12,counterHint='',richText=false,onInput,onChange,...options}={}){
  const f=createField({...options,family:'TextArea',inputTag:'textarea',onInput});const {element,input,shell}=f;shell.classList.add('cp-area-shell');input.rows=rows;
  const count=cpElement('span','cp-area-counter');count.id=cpId('counter');const number=cpElement('span');count.append(number);
  if(counterHint){const hint=cpElement('span');hint.title=counterHint;hint.tabIndex=0;hint.setAttribute('role','img');hint.setAttribute('aria-label',counterHint);hint.append(cpIcon('24 Linear / Info',16));count.append(hint);}
  if(maxLength!==undefined){shell.append(count);const p=f.variant('Normal').body.style.padding.split(' ');count.style.bottom=p[2];count.style.right=p[1];}
  let editor=input,toolbar,linkEditor,savedRange,disposed=false;
  if(richText){
    editor=cpElement('div','cp-input cp-rich-editor');editor.id=cpId('editor');editor.contentEditable=String(!input.disabled);editor.setAttribute('role','textbox');editor.setAttribute('aria-multiline','true');editor.setAttribute('aria-label',options.label||options.ariaLabel||'Текст');editor.setAttribute('data-placeholder',options.placeholder||'Value');editor.textContent=options.value||'';input.hidden=true;shell.prepend(editor);f.caption.htmlFor=editor.id;f.caption.addEventListener('click',()=>editor.focus());
    toolbar=cpElement('div','cp-format-toolbar');toolbar.hidden=true;toolbar.setAttribute('role','toolbar');toolbar.setAttribute('aria-label','Форматирование текста');element.append(toolbar);
    const formats=[['bold','Жирный','B'],['italic','Курсив','I'],['underline','Подчёркнутый','U'],['insertUnorderedList','Маркированный список','•'],['insertOrderedList','Нумерованный список','1.'],['createLink','Ссылка','↗']];
    for(const [command,label,glyph] of formats){const b=cpElement('button');const iconName={bold:'Bold',italic:'Italic',underline:'Underline',insertUnorderedList:'List - Ul',insertOrderedList:'List - Ol',createLink:'Link - H'}[command];b.append(cpIcon('24 Linear / '+iconName,20));b.type='button';b.setAttribute('aria-label',label);if(command==='bold')b.style.fontWeight='600';if(command==='italic')b.style.fontStyle='italic';if(command==='underline')b.style.textDecoration='underline';toolbar.append(b);b.addEventListener('pointerdown',e=>e.preventDefault());b.addEventListener('click',()=>{
      if(command==='createLink'){showLink();return;}restore();document.execCommand(command,false);sync();selection();
    });}
    function restore(){if(savedRange){editor.focus();const sel=window.getSelection();sel.removeAllRanges();sel.addRange(savedRange);}}
    function showLink(){
      if(linkEditor)linkEditor.remove();linkEditor=cpElement('div','cp-link-editor');linkEditor.setAttribute('role','dialog');linkEditor.setAttribute('aria-label','Добавить ссылку');
      const url=cpElement('input');url.type='url';url.placeholder='https://';url.setAttribute('aria-label','Адрес ссылки');
      const apply=createButton({size:'Xs',use:'Primary',label:'Добавить',leftIcon:false,rightIcon:false,onClick:()=>{let parsed;try{parsed=new URL(url.value);}catch{url.setCustomValidity('Укажите полный адрес');url.reportValidity();return;}if(!['http:','https:','mailto:'].includes(parsed.protocol)){url.setCustomValidity('Используйте http, https или mailto');url.reportValidity();return;}restore();document.execCommand('createLink',false,parsed.href);linkEditor.remove();linkEditor=null;sync();}});
      const cancel=createButton({size:'Xs',use:'Secondary',label:'Отмена',leftIcon:false,rightIcon:false,onClick:()=>{linkEditor.remove();linkEditor=null;restore();}});linkEditor.append(url,apply,cancel);const r=toolbar.getBoundingClientRect();linkEditor.style.left=Math.max(8,Math.min(r.left,innerWidth-380))+'px';linkEditor.style.top=(r.bottom+8)+'px';element.append(linkEditor);url.focus();url.addEventListener('keydown',e=>{if(e.key==='Escape')cancel.click();});
    }
    function selection(){
      if(disposed)return;const sel=getSelection();if(!sel||sel.isCollapsed||!editor.contains(sel.anchorNode)||!editor.contains(sel.focusNode)){if(!toolbar.contains(document.activeElement)&&!linkEditor)toolbar.hidden=true;return;}
      savedRange=sel.getRangeAt(0).cloneRange();const r=savedRange.getBoundingClientRect();toolbar.hidden=false;const t=toolbar.getBoundingClientRect();toolbar.style.left=Math.max(8,Math.min(r.left,innerWidth-t.width-8))+'px';toolbar.style.top=(r.top>=t.height+8?r.top-t.height-8:r.bottom+8)+'px';
    }
    document.addEventListener('selectionchange',selection);window.addEventListener('scroll',selection,true);
    editor.addEventListener('focus',()=>input.dispatchEvent(new Event('focus')));editor.addEventListener('blur',()=>input.dispatchEvent(new Event('blur')));
    editor.addEventListener('paste',e=>{e.preventDefault();document.execCommand('insertText',false,e.clipboardData.getData('text/plain'));});
    editor.addEventListener('input',sync);
    f.destroy=()=>{disposed=true;document.removeEventListener('selectionchange',selection);window.removeEventListener('scroll',selection,true);element.remove();};
  }
  function sync(){if(richText){input.value=editor.innerText;input.dispatchEvent(new Event('input',{bubbles:true}));}resize();onChange?.(input.value);}
  function resize(){
    const line=parseFloat(getComputedStyle(editor).lineHeight)||parseFloat(f.variant('Normal').value.lineHeight),minimum=rows*line;
    if(richText)cpStyle(editor,f.variant('Filled').value);
    editor.style.boxSizing='border-box';editor.style.paddingBottom=maxLength!==undefined?line+'px':'0px';editor.style.minHeight='0';editor.style.height='0px';const content=editor.scrollHeight;const h=Math.min(maxRows*line,Math.max(minimum,content+(input.value&&maxLength===undefined?line:0)));
    editor.style.height=h+'px';editor.style.minHeight=minimum+'px';editor.style.overflowY=content>maxRows*line?'auto':'hidden';
    if(maxLength!==undefined){const left=maxLength-Array.from(input.value).length;number.textContent=String(left);count.dataset.exceeded=String(left<0);count.dataset.hasValue=String(!!input.value);if(left<0)editor.setAttribute('aria-describedby',count.id);else editor.removeAttribute('aria-describedby');}
  }
  input.addEventListener('input',resize);input.addEventListener('focus',resize);input.addEventListener('blur',resize);
  const originalSet=f.setValue,originalState=f.setState;f.setValue=v=>{originalSet(v);if(richText)editor.textContent=v;resize();};f.setState=v=>{originalState(v);if(richText)editor.contentEditable=String(!input.disabled);resize();};
  // Detached construction has no computed metrics yet. Recalculate when connected.
  requestAnimationFrame(resize);const observer=new ResizeObserver(resize);observer.observe(shell);
  const dispose=f.destroy;f.destroy=()=>{observer.disconnect();dispose?.();element.remove();};
  return {...f,editor,resize,get value(){return input.value;},get html(){return richText?editor.innerHTML:undefined;}};
}
